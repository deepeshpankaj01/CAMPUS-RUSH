/**
 * Campus Rush - 5 Procedural Environments & Zones
 */
import * as THREE from 'three';
import { COLORS, ZoneType, StageInfo, ZONE_SEQUENCE, getStageInfo } from './Constants';
import { GameRenderer } from './Renderer';

export type { ZoneType, StageInfo };
export { ZONE_SEQUENCE, getStageInfo };

interface RoadSegment {
  group: THREE.Group;
  z: number;
}

export class EnvironmentManager {
  private scene: THREE.Scene;
  private renderer: GameRenderer;
  private roadSegments: RoadSegment[] = [];

  private segmentLength: number = 32;
  private numSegments: number = 10; // 320m visible runway
  public currentZone: ZoneType = 'CAMPUS_MORNING';

  // Shared Geometries & Materials for high performance
  private roadMaterial: THREE.MeshStandardMaterial;
  private curbMaterial: THREE.MeshStandardMaterial;
  private grassMaterial: THREE.MeshStandardMaterial;
  private waterMaterial: THREE.MeshStandardMaterial;
  private lineMaterial: THREE.MeshBasicMaterial;

  constructor(scene: THREE.Scene, renderer: GameRenderer) {
    this.scene = scene;
    this.renderer = renderer;

    this.roadMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.roadAsphalt,
      roughness: 0.8
    });

    this.curbMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.curbColor,
      roughness: 0.6
    });

    this.grassMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.grassCampus,
      roughness: 0.9
    });

    this.waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x1E40AF,
      roughness: 0.2,
      metalness: 0.7,
      transparent: true,
      opacity: 0.85
    });

    this.lineMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF
    });

    this.initRoads();
  }

  private initRoads(): void {
    for (let i = 0; i < this.numSegments; i++) {
      const z = -i * this.segmentLength;
      const segmentGroup = this.createSegment(z, 'CAMPUS_MORNING');
      this.roadSegments.push({ group: segmentGroup, z });
      this.scene.add(segmentGroup);
    }
  }

  private createSegment(z: number, zone: ZoneType): THREE.Group {
    const seg = new THREE.Group();
    seg.position.z = z;

    // 1. Road Surface (Width 11m, Length 32m)
    const roadGeo = new THREE.PlaneGeometry(11, this.segmentLength);
    const roadMesh = new THREE.Mesh(roadGeo, this.roadMaterial);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.receiveShadow = true;
    seg.add(roadMesh);

    // 2. Road Lane Divider Markings (Dashed white lines at x = -1.6 and x = 1.6)
    for (const lx of [-1.6, 1.6]) {
      for (let s = -this.segmentLength / 2 + 2; s < this.segmentLength / 2; s += 6) {
        const lineGeo = new THREE.PlaneGeometry(0.18, 3.2);
        const lineMesh = new THREE.Mesh(lineGeo, this.lineMaterial);
        lineMesh.rotation.x = -Math.PI / 2;
        lineMesh.position.set(lx, 0.01, s);
        seg.add(lineMesh);
      }
    }

    // 3. Curbs (Left & Right)
    const curbGeo = new THREE.BoxGeometry(0.5, 0.25, this.segmentLength);
    const leftCurb = new THREE.Mesh(curbGeo, this.curbMaterial);
    leftCurb.position.set(-5.75, 0.125, 0);
    const rightCurb = new THREE.Mesh(curbGeo, this.curbMaterial);
    rightCurb.position.set(5.75, 0.125, 0);
    seg.add(leftCurb);
    seg.add(rightCurb);

    // 4. Populate Scenery Props for current Zone
    this.populateScenery(seg, zone);

    return seg;
  }

  private populateScenery(seg: THREE.Group, zone: ZoneType): void {
    if (zone === 'CAMPUS_MORNING') {
      this.buildCampusScenery(seg);
    } else if (zone === 'BHOPAL_LAKEFRONT') {
      this.buildLakefrontScenery(seg);
    } else if (zone === 'MARKET_RUSH') {
      this.buildMarketScenery(seg);
    } else if (zone === 'NEON_CODE_CITY') {
      this.buildNeonCityScenery(seg);
    } else {
      this.buildFestivalScenery(seg);
    }
  }

  // --- Zone A: Campus Morning ---
  private buildCampusScenery(seg: THREE.Group): void {
    // Green lawns
    const lawnGeo = new THREE.PlaneGeometry(35, this.segmentLength);
    const leftLawn = new THREE.Mesh(lawnGeo, this.grassMaterial);
    leftLawn.rotation.x = -Math.PI / 2;
    leftLawn.position.set(-23.5, 0.05, 0);
    seg.add(leftLawn);

    const rightLawn = new THREE.Mesh(lawnGeo, this.grassMaterial);
    rightLawn.rotation.x = -Math.PI / 2;
    rightLawn.position.set(23.5, 0.05, 0);
    seg.add(rightLawn);

    // Trees on sides
    for (const side of [-9.5, 9.5]) {
      for (const zOffset of [-10, 10]) {
        const tree = this.createCampusTree();
        tree.position.set(side + (Math.random() - 0.5) * 1.5, 0, zOffset);
        seg.add(tree);
      }
    }

    // Brick Academic Building on one side
    const building = this.createAcademicBuilding();
    building.position.set(Math.random() > 0.5 ? -20 : 20, 0, 0);
    seg.add(building);

    // Street Lamps
    const lamp = this.createStreetLamp();
    lamp.position.set(-6.4, 0, 0);
    seg.add(lamp);
  }

  // --- Zone B: Bhopal Lakefront ---
  private buildLakefrontScenery(seg: THREE.Group): void {
    // Left: Scenic VIP Road Lake Water with gentle shine
    const waterGeo = new THREE.PlaneGeometry(50, this.segmentLength);
    const waterMesh = new THREE.Mesh(waterGeo, this.waterMaterial);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.set(-31, -0.3, 0);
    seg.add(waterMesh);

    // Lake Promenade Railing on Left
    const railing = this.createLakeRailing();
    railing.position.set(-6.2, 0, 0);
    seg.add(railing);

    // Right: Scenic Sidewalk and Hillside Silhouette
    const hillGeo = new THREE.ConeGeometry(18, 14, 5);
    const hillMat = new THREE.MeshStandardMaterial({ color: 0x18263E, roughness: 0.9 });
    const hill = new THREE.Mesh(hillGeo, hillMat);
    hill.position.set(26, 7, 0);
    seg.add(hill);

    // Promenade Lamps
    const lamp = this.createPromenadeLamp();
    lamp.position.set(-6.5, 0, 6);
    seg.add(lamp);
  }

  // --- Zone C: Market Rush ---
  private buildMarketScenery(seg: THREE.Group): void {
    for (const side of [-1, 1]) {
      const shop = this.createMarketShop(side);
      shop.position.set(side * 11, 0, 0);
      seg.add(shop);
    }
  }

  // --- Zone D: Neon Code City ---
  private buildNeonCityScenery(seg: THREE.Group): void {
    for (const side of [-1, 1]) {
      const tower = this.createCyberTower();
      tower.position.set(side * 18, 0, 0);
      seg.add(tower);

      const pillarGeo = new THREE.BoxGeometry(0.3, 6, 0.3);
      const pillarMat = new THREE.MeshBasicMaterial({ color: side < 0 ? COLORS.electricCyan : COLORS.vividViolet });
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(side * 6.5, 3, 0);
      seg.add(pillar);
    }
  }

  // --- Zone E: Festival Nights ---
  private buildFestivalScenery(seg: THREE.Group): void {
    for (const side of [-1, 1]) {
      const building = this.createAcademicBuilding();
      building.position.set(side * 18, 0, 0);
      seg.add(building);
    }

    const lanternWire = this.createFestivalLanternArch();
    lanternWire.position.set(0, 0, 0);
    seg.add(lanternWire);
  }

  // ================= SCENERY PROP BUILDERS =================

  private createCampusTree(): THREE.Group {
    const tree = new THREE.Group();
    const trunkGeo = new THREE.CylinderGeometry(0.25, 0.35, 2.5, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: COLORS.treeTrunk, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1.25;
    trunk.castShadow = true;
    tree.add(trunk);

    const leavesGeo = new THREE.DodecahedronGeometry(1.6, 1);
    const leavesMat = new THREE.MeshStandardMaterial({
      color: Math.random() > 0.3 ? COLORS.treeLeaves : 0x8B3A2B,
      roughness: 0.8
    });
    const leaves = new THREE.Mesh(leavesGeo, leavesMat);
    leaves.position.y = 3.2;
    leaves.castShadow = true;
    tree.add(leaves);

    return tree;
  }

  private createAcademicBuilding(): THREE.Group {
    const building = new THREE.Group();
    const w = 12 + Math.random() * 6;
    const h = 10 + Math.random() * 8;
    const d = 16;

    const bGeo = new THREE.BoxGeometry(w, h, d);
    const bMat = new THREE.MeshStandardMaterial({
      color: COLORS.brickAcademic,
      roughness: 0.8
    });
    const bMesh = new THREE.Mesh(bGeo, bMat);
    bMesh.position.y = h / 2;
    bMesh.castShadow = true;
    building.add(bMesh);

    const winGeo = new THREE.PlaneGeometry(w - 2, 0.8);
    const winMat = new THREE.MeshBasicMaterial({ color: 0xFDE68A });
    for (let y = 3; y < h - 2; y += 3) {
      const winMesh = new THREE.Mesh(winGeo, winMat);
      winMesh.position.set(0, y, d / 2 + 0.05);
      building.add(winMesh);
    }

    return building;
  }

  private createStreetLamp(): THREE.Group {
    const lamp = new THREE.Group();
    const postGeo = new THREE.CylinderGeometry(0.08, 0.1, 4.5, 6);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.y = 2.25;
    lamp.add(post);

    const headGeo = new THREE.BoxGeometry(0.4, 0.15, 0.6);
    const headMat = new THREE.MeshBasicMaterial({ color: 0xFFFBEB });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0.2, 4.5, 0);
    lamp.add(head);

    return lamp;
  }

  private createLakeRailing(): THREE.Group {
    const railing = new THREE.Group();
    const barGeo = new THREE.BoxGeometry(0.12, 0.1, this.segmentLength);
    const barMat = new THREE.MeshStandardMaterial({ color: 0xE2E8F0 });
    const barTop = new THREE.Mesh(barGeo, barMat);
    barTop.position.y = 1.0;
    railing.add(barTop);

    const barMid = new THREE.Mesh(barGeo, barMat);
    barMid.position.y = 0.5;
    railing.add(barMid);

    for (let z = -this.segmentLength / 2; z < this.segmentLength / 2; z += 4) {
      const postGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.1, 6);
      const post = new THREE.Mesh(postGeo, barMat);
      post.position.set(0, 0.55, z);
      railing.add(post);
    }
    return railing;
  }

  private createPromenadeLamp(): THREE.Group {
    const lamp = new THREE.Group();
    const poleGeo = new THREE.CylinderGeometry(0.08, 0.1, 5, 6);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x1E293B });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 2.5;
    lamp.add(pole);

    const globeGeo = new THREE.SphereGeometry(0.35, 8, 8);
    const globeMat = new THREE.MeshBasicMaterial({ color: 0xFFD166 });
    const globe = new THREE.Mesh(globeGeo, globeMat);
    globe.position.y = 5.1;
    lamp.add(globe);

    return lamp;
  }

  private createMarketShop(side: number): THREE.Group {
    const shop = new THREE.Group();
    const w = 7;
    const h = 5;
    const d = 10;

    const baseGeo = new THREE.BoxGeometry(w, h, d);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = h / 2;
    shop.add(base);

    const awningGeo = new THREE.BoxGeometry(2.8, 0.2, 8);
    const awningMat = new THREE.MeshStandardMaterial({
      color: Math.random() > 0.5 ? COLORS.warmSaffron : COLORS.coralAccent,
      roughness: 0.5
    });
    const awning = new THREE.Mesh(awningGeo, awningMat);
    awning.rotation.z = side * -0.25;
    awning.position.set(side * -2.8, 3.6, 0);
    shop.add(awning);

    const signGeo = new THREE.BoxGeometry(0.2, 0.8, 6);
    const signMat = new THREE.MeshBasicMaterial({ color: 0xFEF08A });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(side * -3.6, 4.4, 0);
    shop.add(sign);

    return shop;
  }

  private createCyberTower(): THREE.Group {
    const tower = new THREE.Group();
    const h = 24 + Math.random() * 16;
    const bGeo = new THREE.BoxGeometry(10, h, 14);
    const bMat = new THREE.MeshStandardMaterial({ color: 0x0F172A, roughness: 0.4, metalness: 0.8 });
    const bMesh = new THREE.Mesh(bGeo, bMat);
    bMesh.position.y = h / 2;
    tower.add(bMesh);

    const gridGeo = new THREE.PlaneGeometry(8, h - 4);
    const gridMat = new THREE.MeshBasicMaterial({
      color: Math.random() > 0.5 ? COLORS.electricCyan : COLORS.vividViolet
    });
    const grid = new THREE.Mesh(gridGeo, gridMat);
    grid.position.set(0, h / 2, 7.05);
    tower.add(grid);

    return tower;
  }

  private createFestivalLanternArch(): THREE.Group {
    const arch = new THREE.Group();
    const cableGeo = new THREE.CylinderGeometry(0.03, 0.03, 16, 6);
    const cableMat = new THREE.MeshBasicMaterial({ color: 0xFDE047 });
    const cable = new THREE.Mesh(cableGeo, cableMat);
    cable.rotation.z = Math.PI / 2;
    cable.position.set(0, 6.2, 0);
    arch.add(cable);

    const colors = [COLORS.warmSaffron, COLORS.coralAccent, COLORS.electricCyan, 0xF43F5E];
    for (let x = -5; x <= 5; x += 2.5) {
      const lanternGeo = new THREE.OctahedronGeometry(0.35);
      const lanternMat = new THREE.MeshBasicMaterial({
        color: colors[Math.floor(Math.random() * colors.length)]
      });
      const lantern = new THREE.Mesh(lanternGeo, lanternMat);
      lantern.position.set(x, 5.7, 0);
      arch.add(lantern);
    }
    return arch;
  }

  /**
   * Recursively disposes all geometries and materials of an Object3D hierarchy
   * to prevent GPU memory leaks during endless recycling.
   */
  private disposeHierarchy(obj: THREE.Object3D): void {
    obj.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) {
        if (mesh.geometry) {
          mesh.geometry.dispose();
        }
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

  // ================= STAGE PROGRESSION & UPDATE =================

  public getStageInfo(totalDistanceMeters: number): StageInfo {
    return getStageInfo(totalDistanceMeters);
  }

  public update(playerSpeed: number, dt: number, totalDistanceMeters: number): void {
    const moveZ = playerSpeed * dt;

    // Determine current zone based on distance (endless progression)
    const stageInfo = this.getStageInfo(totalDistanceMeters);
    const prevZone = this.currentZone;
    this.currentZone = stageInfo.zone;

    // Apply lighting and fog color transitions if zone changed
    if (prevZone !== this.currentZone) {
      this.applyZoneAtmosphere(this.currentZone);
    }

    // 2. Recycle segments when passing behind the camera (Z > 30)
    for (const seg of this.roadSegments) {
      seg.group.position.z += moveZ;

      if (seg.group.position.z > 30) {
        let minZ = 0;
        for (const s of this.roadSegments) {
          if (s.group.position.z < minZ) minZ = s.group.position.z;
        }

        // Reposition segment ahead
        seg.group.position.z = minZ - this.segmentLength;

        // Cleanly dispose and remove existing scenery children (children 0,1,2,3 are road/lines/curbs)
        while (seg.group.children.length > 3) {
          const child = seg.group.children[seg.group.children.length - 1];
          this.disposeHierarchy(child);
          seg.group.remove(child);
        }
        this.populateScenery(seg.group, this.currentZone);
      }
    }
  }

  private applyZoneAtmosphere(zone: ZoneType): void {
    switch (zone) {
      case 'CAMPUS_MORNING':
        this.renderer.setAtmosphereColors(COLORS.midnightNavy, 0.009, 1.3);
        this.renderer.dirLight.color.setHex(0xFFFAED);
        break;
      case 'BHOPAL_LAKEFRONT':
        this.renderer.setAtmosphereColors(0x1B1633, 0.008, 1.1);
        this.renderer.dirLight.color.setHex(0xFFD8A8);
        break;
      case 'MARKET_RUSH':
        this.renderer.setAtmosphereColors(0x181A2B, 0.010, 1.2);
        this.renderer.dirLight.color.setHex(0xFFECD1);
        break;
      case 'NEON_CODE_CITY':
        this.renderer.setAtmosphereColors(0x060814, 0.012, 0.9);
        this.renderer.dirLight.color.setHex(COLORS.electricCyan);
        break;
      case 'FESTIVAL_NIGHTS':
        this.renderer.setAtmosphereColors(0x160C28, 0.009, 1.2);
        this.renderer.dirLight.color.setHex(0xFFC078);
        break;
    }
  }

  public reset(): void {
    this.currentZone = 'CAMPUS_MORNING';
    this.applyZoneAtmosphere('CAMPUS_MORNING');
    for (let i = 0; i < this.roadSegments.length; i++) {
      const seg = this.roadSegments[i];
      seg.group.position.z = -i * this.segmentLength;
      while (seg.group.children.length > 3) {
        const child = seg.group.children[seg.group.children.length - 1];
        this.disposeHierarchy(child);
        seg.group.remove(child);
      }
      this.populateScenery(seg.group, 'CAMPUS_MORNING');
    }
  }

  public dispose(): void {
    for (const seg of this.roadSegments) {
      this.disposeHierarchy(seg.group);
      this.scene.remove(seg.group);
    }
    this.roadSegments = [];
    this.roadMaterial.dispose();
    this.curbMaterial.dispose();
    this.grassMaterial.dispose();
    this.waterMaterial.dispose();
    this.lineMaterial.dispose();
  }
}
