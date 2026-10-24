/**
 * Campus Rush - Collectibles (Byte Coins, Idea Sparks, Power-Ups)
 */
import * as THREE from 'three';
import { COLORS, GAME_CONFIG, LANES, LaneIndex } from './Constants';

export type CollectibleType = 'BYTE_COIN' | 'IDEA_SPARK' | 'POWERUP_SHIELD' | 'POWERUP_MAGNET' | 'POWERUP_SPRINT';

export interface CollectibleInstance {
  group: THREE.Group;
  type: CollectibleType;
  lane: LaneIndex;
  x: number;
  y: number;
  z: number;
  baseY: number;
  active: boolean;
  bobOffset: number;
}

export class CollectiblesManager {
  private scene: THREE.Scene;
  public items: CollectibleInstance[] = [];

  // Spawning logic
  private nextSpawnZ: number = -25;
  private coinGeometry: THREE.CylinderGeometry;
  private coinMaterial: THREE.MeshStandardMaterial;

  private sparkGeometry: THREE.OctahedronGeometry;
  private sparkMaterial: THREE.MeshBasicMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Shared geometries and materials
    this.coinGeometry = new THREE.CylinderGeometry(0.42, 0.42, 0.12, 12);
    this.coinMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.warmSaffron,
      roughness: 0.3,
      metalness: 0.8,
      emissive: COLORS.warmSaffron,
      emissiveIntensity: 0.25
    });

    this.sparkGeometry = new THREE.OctahedronGeometry(0.45);
    this.sparkMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.electricCyan
    });
  }

  public reset(): void {
    for (const item of this.items) {
      this.scene.remove(item.group);
    }
    this.items = [];
    this.nextSpawnZ = -25;
  }

  public update(playerSpeed: number, dt: number, playerPos: THREE.Vector3, hasMagnet: boolean): void {
    const moveZ = playerSpeed * dt;

    // 1. Update existing items
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.z += moveZ;

      // Bobbing & Rotation
      const time = performance.now() * 0.004 + item.bobOffset;
      item.group.position.z = item.z;
      item.group.position.y = item.baseY + Math.sin(time) * 0.18;
      item.group.rotation.y += dt * 3.5;

      // Magnet attraction logic
      if (hasMagnet && item.type === 'BYTE_COIN') {
        const dx = playerPos.x - item.x;
        const dy = (playerPos.y + 1.0) - item.group.position.y;
        const dz = playerPos.z - item.z;
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq < GAME_CONFIG.magnetRadius * GAME_CONFIG.magnetRadius) {
          // Attract strongly towards player
          const pullSpeed = 24.0 * dt;
          item.x += dx * pullSpeed;
          item.baseY += dy * pullSpeed;
          item.group.position.x = item.x;
        }
      }

      // Despawn behind camera
      if (item.z > 15) {
        this.scene.remove(item.group);
        this.items.splice(i, 1);
      }
    }

    // 2. Procedural spawning ahead
    while (this.nextSpawnZ > -150) {
      this.spawnPattern(this.nextSpawnZ);
      this.nextSpawnZ -= 20 + Math.random() * 12;
    }

    this.nextSpawnZ += moveZ;
  }

  private spawnPattern(z: number): void {
    const roll = Math.random();

    // 12% chance for rare Power-Up
    if (roll < 0.12) {
      const powerTypes: CollectibleType[] = ['POWERUP_SHIELD', 'POWERUP_MAGNET', 'POWERUP_SPRINT'];
      const pType = powerTypes[Math.floor(Math.random() * powerTypes.length)];
      const lane: LaneIndex = Math.floor(Math.random() * 3) as LaneIndex;
      this.spawnItem(pType, lane, z, 1.2);
      return;
    }

    // 25% chance for Idea Spark (charges Focus Mode!)
    if (roll < 0.37) {
      const lane: LaneIndex = Math.floor(Math.random() * 3) as LaneIndex;
      this.spawnItem('IDEA_SPARK', lane, z, 1.3);
      // Flanked by coins
      this.spawnItem('BYTE_COIN', lane, z - 3, 1.0);
      this.spawnItem('BYTE_COIN', lane, z + 3, 1.0);
      return;
    }

    // 63% chance for Byte Coin Trail / Arc
    const lane: LaneIndex = Math.floor(Math.random() * 3) as LaneIndex;
    const isArc = Math.random() > 0.6; // High jumping arc trail

    for (let c = 0; c < 5; c++) {
      const cz = z - c * 2.8;
      // If arc, middle coins are elevated up to 2.4m
      const cy = isArc ? 1.0 + Math.sin((c / 4) * Math.PI) * 1.5 : 1.0;
      this.spawnItem('BYTE_COIN', lane, cz, cy);
    }
  }

  private spawnItem(type: CollectibleType, lane: LaneIndex, z: number, y: number): void {
    const x = LANES[lane];
    let group: THREE.Group;

    switch (type) {
      case 'BYTE_COIN':
        group = this.buildCoinMesh();
        break;
      case 'IDEA_SPARK':
        group = this.buildSparkMesh();
        break;
      case 'POWERUP_SHIELD':
        group = this.buildShieldPickup();
        break;
      case 'POWERUP_MAGNET':
        group = this.buildMagnetPickup();
        break;
      case 'POWERUP_SPRINT':
        group = this.buildSprintPickup();
        break;
    }

    group.position.set(x, y, z);
    this.scene.add(group);

    this.items.push({
      group,
      type,
      lane,
      x,
      y,
      z,
      baseY: y,
      active: true,
      bobOffset: Math.random() * Math.PI * 2
    });
  }

  // ================= 3D COLLECTIBLE BUILDERS =================

  private buildCoinMesh(): THREE.Group {
    const g = new THREE.Group();
    const mesh = new THREE.Mesh(this.coinGeometry, this.coinMaterial);
    mesh.rotation.x = Math.PI / 2; // Face forward
    mesh.castShadow = true;
    g.add(mesh);

    // Embossed inner core
    const coreGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.14, 8);
    const coreMat = new THREE.MeshBasicMaterial({ color: COLORS.electricCyan });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.rotation.x = Math.PI / 2;
    g.add(core);

    return g;
  }

  private buildSparkMesh(): THREE.Group {
    const g = new THREE.Group();
    // Glowing cyan/violet dual crystal
    const crystal = new THREE.Mesh(this.sparkGeometry, this.sparkMaterial);
    g.add(crystal);

    // Outer rotating glowing wireframe
    const wireGeo = new THREE.IcosahedronGeometry(0.65, 1);
    const wireMat = new THREE.MeshBasicMaterial({
      color: COLORS.vividViolet,
      wireframe: true,
      transparent: true,
      opacity: 0.6
    });
    const wire = new THREE.Mesh(wireGeo, wireMat);
    g.add(wire);

    return g;
  }

  private buildShieldPickup(): THREE.Group {
    const g = new THREE.Group();
    // Glowing 3D Shield Emblem
    const shieldGeo = new THREE.CylinderGeometry(0.5, 0.4, 0.16, 6);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: COLORS.electricCyan,
      emissive: COLORS.electricCyan,
      emissiveIntensity: 0.6,
      metalness: 0.8
    });
    const shield = new THREE.Mesh(shieldGeo, shieldMat);
    shield.rotation.x = Math.PI / 2;
    g.add(shield);

    // Protective outer halo
    const haloGeo = new THREE.TorusGeometry(0.7, 0.05, 6, 16);
    const haloMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    g.add(halo);

    return g;
  }

  private buildMagnetPickup(): THREE.Group {
    const g = new THREE.Group();
    // Glowing Red/Silver Horseshoe Magnet
    const magnetGeo = new THREE.TorusGeometry(0.45, 0.14, 8, 16, Math.PI);
    const magnetMat = new THREE.MeshStandardMaterial({
      color: COLORS.coralAccent,
      emissive: COLORS.coralAccent,
      emissiveIntensity: 0.4
    });
    const magnet = new THREE.Mesh(magnetGeo, magnetMat);
    magnet.rotation.z = Math.PI;
    g.add(magnet);

    // Silver poles
    const tipMat = new THREE.MeshStandardMaterial({ color: 0xF4F6FC, metalness: 0.9 });
    for (const tx of [-0.45, 0.45]) {
      const tipGeo = new THREE.BoxGeometry(0.28, 0.24, 0.28);
      const tip = new THREE.Mesh(tipGeo, tipMat);
      tip.position.set(tx, 0.1, 0);
      g.add(tip);
    }

    return g;
  }

  private buildSprintPickup(): THREE.Group {
    const g = new THREE.Group();
    // Glowing Saffron Lightning Bolt / Energy Capsule
    const boltGeo = new THREE.OctahedronGeometry(0.5, 0);
    const boltMat = new THREE.MeshStandardMaterial({
      color: COLORS.warmSaffron,
      emissive: COLORS.warmSaffron,
      emissiveIntensity: 0.7
    });
    const bolt = new THREE.Mesh(boltGeo, boltMat);
    bolt.scale.set(0.6, 1.4, 0.6);
    g.add(bolt);

    return g;
  }

  // Check collision with player
  public checkPickups(playerPos: THREE.Vector3, pickupRadius: number): CollectibleInstance[] {
    const picked: CollectibleInstance[] = [];

    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      if (!item.active) continue;

      const dx = playerPos.x - item.x;
      const dy = (playerPos.y + 0.9) - item.group.position.y;
      const dz = playerPos.z - item.z;
      const distSq = dx * dx + dy * dy + dz * dz;

      if (distSq < pickupRadius * pickupRadius) {
        item.active = false;
        picked.push(item);
        this.scene.remove(item.group);
        this.items.splice(i, 1);
      }
    }

    return picked;
  }
}
