/**
 * Campus Rush - Obstacles, Fair Procedural Spawning & Object Pooling
 */
import * as THREE from 'three';
import { COLORS, LANES, LaneIndex } from './Constants';

export type ObstacleType =
  | 'BARRICADE'       // Jumpable / Switch lane
  | 'CONES'           // Jumpable / Switch lane
  | 'POTHOLE'         // Jumpable / Switch lane
  | 'CAMPUS_CART'     // Switch lane (unjumpable)
  | 'CHAI_TAPRI'      // Switch lane (unjumpable)
  | 'OVERHEAD_BANNER' // Requires SLIDE (or switch lane)
  | 'CAMPUS_AUTO';    // Switch lane (unjumpable)

export interface ObstacleInstance {
  group: THREE.Group;
  type: ObstacleType;
  lane: LaneIndex;
  z: number;
  width: number;
  height: number;
  depth: number;
  yOffset: number; // For overhead banners that start above ground!
  canJumpOver: boolean;
  requiresSlide: boolean;
  active: boolean;
}

export class ObstacleManager {
  private scene: THREE.Scene;
  public obstacles: ObstacleInstance[] = [];

  // Object pool by obstacle type to eliminate GPU & GC allocations during gameplay
  private pool: Map<ObstacleType, ObstacleInstance[]> = new Map();

  // Spawn parameters
  private nextSpawnZ: number = -45;
  private minSpawnSpacing: number = 28;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public reset(): void {
    // Return all active obstacles to the pool
    for (const obs of this.obstacles) {
      obs.active = false;
      obs.group.visible = false;
      let list = this.pool.get(obs.type);
      if (!list) {
        list = [];
        this.pool.set(obs.type, list);
      }
      list.push(obs);
    }
    this.obstacles = [];
    this.nextSpawnZ = -45;
  }

  public update(playerSpeed: number, dt: number): void {
    const moveZ = playerSpeed * dt;

    // 1. Move obstacles towards camera
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.z += moveZ;
      obs.group.position.z = obs.z;

      // Recycle obstacle when passed behind player (Z > 15)
      if (obs.z > 15) {
        obs.active = false;
        obs.group.visible = false;
        let list = this.pool.get(obs.type);
        if (!list) {
          list = [];
          this.pool.set(obs.type, list);
        }
        list.push(obs);
        this.obstacles.splice(i, 1);
      }
    }

    // 2. Adjust dynamic spawn spacing based on speed (giving ~0.85s reaction window)
    const dynamicSpacing = Math.max(this.minSpawnSpacing, playerSpeed * 0.88);

    // 3. Spawn new row of obstacles ahead
    while (this.nextSpawnZ > -150) {
      this.spawnObstacleRow(this.nextSpawnZ);
      this.nextSpawnZ -= dynamicSpacing;
    }

    this.nextSpawnZ += moveZ;
  }

  private spawnObstacleRow(z: number): void {
    // Pick how many lanes to block: 1 or 2 lanes (NEVER all 3!)
    const roll = Math.random();
    const lanesBlockedCount = roll < 0.65 ? 1 : 2;

    const availableLanes: LaneIndex[] = [0, 1, 2];
    availableLanes.sort(() => Math.random() - 0.5);

    const chosenLanes = availableLanes.slice(0, lanesBlockedCount);

    for (let i = 0; i < chosenLanes.length; i++) {
      const lane = chosenLanes[i];
      const type = this.pickObstacleType(i === 1);
      this.getOrCreateObstacle(type, lane, z);
    }
  }

  private pickObstacleType(isSecondInRow: boolean): ObstacleType {
    if (isSecondInRow) {
      // Second obstacle in same row: guarantee jumpable or slideable so it's always fair
      const fairTypes: ObstacleType[] = ['BARRICADE', 'POTHOLE', 'CONES', 'OVERHEAD_BANNER'];
      return fairTypes[Math.floor(Math.random() * fairTypes.length)];
    }

    const types: ObstacleType[] = [
      'BARRICADE',
      'CONES',
      'POTHOLE',
      'CAMPUS_CART',
      'CHAI_TAPRI',
      'OVERHEAD_BANNER',
      'CAMPUS_AUTO'
    ];
    return types[Math.floor(Math.random() * types.length)];
  }

  private getOrCreateObstacle(type: ObstacleType, lane: LaneIndex, z: number): void {
    const list = this.pool.get(type);
    if (list && list.length > 0) {
      const obs = list.pop()!;
      obs.lane = lane;
      obs.z = z;
      obs.active = true;
      obs.group.visible = true;
      obs.group.position.set(LANES[lane], 0, z);
      this.obstacles.push(obs);
      return;
    }

    // Otherwise create a new instance
    this.createAndAddObstacle(type, lane, z);
  }

  private createAndAddObstacle(type: ObstacleType, lane: LaneIndex, z: number): void {
    const x = LANES[lane];
    let group: THREE.Group;
    let width = 2.4;
    let height = 1.1;
    let depth = 1.0;
    let yOffset = 0;
    let canJumpOver = true;
    let requiresSlide = false;

    switch (type) {
      case 'BARRICADE':
        group = this.buildBarricade();
        height = 1.15;
        depth = 0.8;
        canJumpOver = true;
        break;

      case 'CONES':
        group = this.buildConstructionCones();
        height = 0.85;
        depth = 1.4;
        canJumpOver = true;
        break;

      case 'POTHOLE':
        group = this.buildPothole();
        height = 0.35;
        depth = 2.4;
        canJumpOver = true;
        break;

      case 'CAMPUS_CART':
        group = this.buildCampusCart();
        height = 1.8;
        depth = 1.8;
        canJumpOver = false;
        break;

      case 'CHAI_TAPRI':
        group = this.buildChaiTapri();
        height = 2.2;
        depth = 2.0;
        canJumpOver = false;
        break;

      case 'OVERHEAD_BANNER':
        group = this.buildOverheadBanner();
        height = 1.6;
        depth = 0.6;
        yOffset = 1.35; // Bottom of banner sits at y=1.35 (slashes standing player, clear for sliding!)
        canJumpOver = false;
        requiresSlide = true;
        break;

      case 'CAMPUS_AUTO':
        group = this.buildCampusAuto();
        height = 1.9;
        depth = 2.8;
        canJumpOver = false;
        break;
    }

    group.position.set(x, 0, z);
    this.scene.add(group);

    this.obstacles.push({
      group,
      type,
      lane,
      z,
      width,
      height,
      depth,
      yOffset,
      canJumpOver,
      requiresSlide,
      active: true
    });
  }

  // ================= 3D OBSTACLE BUILDERS =================

  private buildBarricade(): THREE.Group {
    const g = new THREE.Group();
    const barGeo = new THREE.BoxGeometry(2.4, 0.22, 0.1);
    const barMat1 = new THREE.MeshStandardMaterial({ color: 0xFACC15 });
    const barMat2 = new THREE.MeshStandardMaterial({ color: 0x1E293B });

    const bar1 = new THREE.Mesh(barGeo, barMat1);
    bar1.position.y = 0.95;
    bar1.castShadow = true;
    g.add(bar1);

    const bar2 = new THREE.Mesh(barGeo, barMat2);
    bar2.position.y = 0.55;
    g.add(bar2);

    for (let x = -0.9; x <= 0.9; x += 0.45) {
      const stripeGeo = new THREE.BoxGeometry(0.18, 0.23, 0.11);
      const stripe = new THREE.Mesh(stripeGeo, barMat2);
      stripe.position.set(x, 0.95, 0);
      g.add(stripe);
    }

    const legGeo = new THREE.BoxGeometry(0.15, 1.1, 0.55);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
    const legL = new THREE.Mesh(legGeo, legMat);
    legL.position.set(-1.0, 0.55, 0);
    const legR = new THREE.Mesh(legGeo, legMat);
    legR.position.set(1.0, 0.55, 0);
    g.add(legL);
    g.add(legR);

    return g;
  }

  private buildConstructionCones(): THREE.Group {
    const g = new THREE.Group();
    const coneGeo = new THREE.ConeGeometry(0.3, 0.8, 8);
    const coneMat = new THREE.MeshStandardMaterial({ color: 0xEA580C });
    const bandMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });

    const positions = [
      [-0.7, 0, -0.4],
      [0.0, 0, 0.2],
      [0.7, 0, -0.3]
    ];

    positions.forEach(([cx, cy, cz]) => {
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.set(cx, cy + 0.4, cz);
      cone.castShadow = true;
      g.add(cone);

      const bandGeo = new THREE.CylinderGeometry(0.2, 0.24, 0.16, 8);
      const band = new THREE.Mesh(bandGeo, bandMat);
      band.position.set(cx, cy + 0.45, cz);
      g.add(band);
    });

    return g;
  }

  private buildPothole(): THREE.Group {
    const g = new THREE.Group();
    const holeGeo = new THREE.BoxGeometry(2.2, 0.08, 2.0);
    const holeMat = new THREE.MeshStandardMaterial({ color: 0x070A14, roughness: 0.95 });
    const hole = new THREE.Mesh(holeGeo, holeMat);
    hole.position.y = 0.04;
    g.add(hole);

    const poleGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.0, 6);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xCBD5E1 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(0.9, 0.5, 0.8);
    g.add(pole);

    const flagGeo = new THREE.BoxGeometry(0.02, 0.25, 0.35);
    const flagMat = new THREE.MeshBasicMaterial({ color: COLORS.coralAccent });
    const flag = new THREE.Mesh(flagGeo, flagMat);
    flag.position.set(0.9, 0.85, 0.65);
    g.add(flag);

    return g;
  }

  private buildCampusCart(): THREE.Group {
    const g = new THREE.Group();
    const bodyGeo = new THREE.BoxGeometry(2.1, 0.9, 1.6);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5, roughness: 0.5 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.65;
    body.castShadow = true;
    g.add(body);

    const boxGeo = new THREE.BoxGeometry(1.2, 0.6, 0.9);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x94A3B8 });
    const box = new THREE.Mesh(boxGeo, boxMat);
    box.position.set(-0.2, 1.35, 0);
    g.add(box);

    const screenGeo = new THREE.BoxGeometry(0.7, 0.5, 0.1);
    const screenMat = new THREE.MeshBasicMaterial({ color: COLORS.electricCyan });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(0.5, 1.35, 0.2);
    g.add(screen);

    const wheelGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.1, 8);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111827 });
    for (const wx of [-0.85, 0.85]) {
      for (const wz of [-0.65, 0.65]) {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 0.18, wz);
        g.add(wheel);
      }
    }

    return g;
  }

  private buildChaiTapri(): THREE.Group {
    const g = new THREE.Group();
    const stallGeo = new THREE.BoxGeometry(2.3, 1.0, 1.5);
    const stallMat = new THREE.MeshStandardMaterial({ color: 0x78350F, roughness: 0.8 });
    const stall = new THREE.Mesh(stallGeo, stallMat);
    stall.position.y = 0.5;
    stall.castShadow = true;
    g.add(stall);

    const roofGeo = new THREE.BoxGeometry(2.6, 0.12, 1.8);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x0284C7, metalness: 0.4 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, 1.9, 0);
    roof.rotation.x = 0.1;
    g.add(roof);

    const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
    for (const px of [-1.1, 1.1]) {
      for (const pz of [-0.7, 0.7]) {
        const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.0, 6);
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.set(px, 1.45, pz);
        g.add(pole);
      }
    }

    const kettleGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.4, 8);
    const kettleMat = new THREE.MeshStandardMaterial({ color: 0xE2E8F0, metalness: 0.8 });
    const kettle = new THREE.Mesh(kettleGeo, kettleMat);
    kettle.position.set(-0.4, 1.2, 0);
    g.add(kettle);

    return g;
  }

  private buildOverheadBanner(): THREE.Group {
    const g = new THREE.Group();
    const pillarMat = new THREE.MeshStandardMaterial({ color: COLORS.deepIndigo });
    for (const px of [-1.45, 1.45]) {
      const pillarGeo = new THREE.BoxGeometry(0.25, 3.2, 0.25);
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(px, 1.6, 0);
      g.add(pillar);
    }

    const bannerGeo = new THREE.BoxGeometry(2.8, 0.95, 0.12);
    const bannerMat = new THREE.MeshStandardMaterial({
      color: COLORS.vividViolet,
      emissive: COLORS.vividViolet,
      emissiveIntensity: 0.2
    });
    const banner = new THREE.Mesh(bannerGeo, bannerMat);
    banner.position.set(0, 1.85, 0);
    banner.castShadow = true;
    g.add(banner);

    const textStripeGeo = new THREE.PlaneGeometry(2.4, 0.35);
    const textStripeMat = new THREE.MeshBasicMaterial({ color: COLORS.electricCyan });
    const textStripe = new THREE.Mesh(textStripeGeo, textStripeMat);
    textStripe.position.set(0, 1.85, 0.07);
    g.add(textStripe);

    const downArrowGeo = new THREE.ConeGeometry(0.18, 0.3, 4);
    const downArrowMat = new THREE.MeshBasicMaterial({ color: COLORS.warmSaffron });
    const downArrow = new THREE.Mesh(downArrowGeo, downArrowMat);
    downArrow.rotation.x = Math.PI;
    downArrow.position.set(0, 1.25, 0);
    g.add(downArrow);

    return g;
  }

  private buildCampusAuto(): THREE.Group {
    const g = new THREE.Group();
    const bodyGeo = new THREE.BoxGeometry(2.0, 0.9, 2.5);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x16A34A, roughness: 0.5 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.65;
    body.castShadow = true;
    g.add(body);

    const roofGeo = new THREE.BoxGeometry(1.9, 0.65, 2.3);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xEAB308, roughness: 0.5 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, 1.35, 0.1);
    g.add(roof);

    const glassGeo = new THREE.PlaneGeometry(1.6, 0.5);
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0284C7, roughness: 0.1, transparent: true, opacity: 0.6 });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(0, 1.3, -1.06);
    g.add(glass);

    const lightGeo = new THREE.CircleGeometry(0.16, 8);
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xFFFBEB });
    const light = new THREE.Mesh(lightGeo, lightMat);
    light.position.set(0, 0.65, -1.26);
    g.add(light);

    const wMat = new THREE.MeshStandardMaterial({ color: 0x1F2937 });
    const wGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.14, 8);
    for (const [wx, wz] of [[-0.85, 0.7], [0.85, 0.7], [0, -0.9]]) {
      const w = new THREE.Mesh(wGeo, wMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(wx, 0.24, wz);
      g.add(w);
    }

    return g;
  }

  public checkCollisions(playerBox: THREE.Box3, playerIsSliding: boolean): ObstacleInstance | null {
    for (const obs of this.obstacles) {
      if (!obs.active) continue;

      const x = LANES[obs.lane];
      const halfW = obs.width / 2;
      const halfD = obs.depth / 2;

      if (obs.requiresSlide) {
        if (playerIsSliding) {
          continue;
        }
      }

      const obsBox = new THREE.Box3(
        new THREE.Vector3(x - halfW, obs.yOffset, obs.z - halfD),
        new THREE.Vector3(x + halfW, obs.yOffset + obs.height, obs.z + halfD)
      );

      if (playerBox.intersectsBox(obsBox)) {
        return obs;
      }
    }
    return null;
  }

  public dispose(): void {
    const allInstances: ObstacleInstance[] = [...this.obstacles];
    for (const list of this.pool.values()) {
      allInstances.push(...list);
    }
    for (const obs of allInstances) {
      this.scene.remove(obs.group);
      obs.group.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.isMesh) {
          if (mesh.geometry) mesh.geometry.dispose();
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((m) => m.dispose());
            } else {
              mesh.material.dispose();
            }
          }
        }
      });
    }
    this.obstacles = [];
    this.pool.clear();
  }
}
