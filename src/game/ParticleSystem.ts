/**
 * Campus Rush - 3D Particle Systems & Juice
 */
import * as THREE from 'three';
import { COLORS } from './Constants';

interface Particle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  active: boolean;
  scaleDelta: number;
}

export class ParticleSystem {
  private scene: THREE.Scene;
  private pool: Particle[] = [];
  private poolSize: number = 80;

  private coinMat: THREE.MeshBasicMaterial;
  private sparkMat: THREE.MeshBasicMaterial;
  private dustMat: THREE.MeshBasicMaterial;
  private shieldMat: THREE.MeshBasicMaterial;
  private sharedGeo: THREE.BoxGeometry;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    this.sharedGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
    this.coinMat = new THREE.MeshBasicMaterial({ color: COLORS.warmSaffron });
    this.sparkMat = new THREE.MeshBasicMaterial({ color: COLORS.electricCyan });
    this.dustMat = new THREE.MeshBasicMaterial({ color: 0x94A3B8, transparent: true, opacity: 0.6 });
    this.shieldMat = new THREE.MeshBasicMaterial({ color: COLORS.electricCyan });

    // Pre-allocate particle pool
    for (let i = 0; i < this.poolSize; i++) {
      const mesh = new THREE.Mesh(this.sharedGeo, this.coinMat);
      mesh.visible = false;
      this.scene.add(mesh);

      this.pool.push({
        mesh,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 1.0,
        active: false,
        scaleDelta: -1.0
      });
    }
  }

  private spawnParticle(
    x: number,
    y: number,
    z: number,
    vx: number,
    vy: number,
    vz: number,
    material: THREE.Material,
    maxLife: number
  ): void {
    const p = this.pool.find((part) => !part.active);
    if (!p) return;

    p.active = true;
    p.life = maxLife;
    p.maxLife = maxLife;
    p.vx = vx;
    p.vy = vy;
    p.vz = vz;
    p.mesh.material = material;
    p.mesh.position.set(x, y, z);
    p.mesh.scale.set(1, 1, 1);
    p.mesh.visible = true;
  }

  public burstCoins(pos: THREE.Vector3): void {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const speed = 3.5 + Math.random() * 2.5;
      const vx = Math.cos(angle) * speed;
      const vy = 2.0 + Math.random() * 3.0;
      const vz = Math.sin(angle) * speed;
      this.spawnParticle(pos.x, pos.y + 0.5, pos.z, vx, vy, vz, this.coinMat, 0.45);
    }
  }

  public burstSpark(pos: THREE.Vector3): void {
    for (let i = 0; i < 14; i++) {
      const vx = (Math.random() - 0.5) * 8.0;
      const vy = 3.0 + Math.random() * 5.0;
      const vz = (Math.random() - 0.5) * 8.0;
      this.spawnParticle(pos.x, pos.y + 0.8, pos.z, vx, vy, vz, this.sparkMat, 0.6);
    }
  }

  public burstShield(pos: THREE.Vector3): void {
    for (let i = 0; i < 16; i++) {
      const vx = (Math.random() - 0.5) * 10.0;
      const vy = 2.0 + Math.random() * 6.0;
      const vz = (Math.random() - 0.5) * 10.0;
      this.spawnParticle(pos.x, pos.y + 1.0, pos.z, vx, vy, vz, this.shieldMat, 0.7);
    }
  }

  public puffSlideDust(pos: THREE.Vector3): void {
    for (let i = 0; i < 2; i++) {
      const vx = (Math.random() - 0.5) * 1.5;
      const vy = 0.5 + Math.random() * 1.0;
      const vz = 4.0 + Math.random() * 3.0;
      this.spawnParticle(pos.x, 0.1, pos.z + 0.4, vx, vy, vz, this.dustMat, 0.35);
    }
  }

  public update(dt: number): void {
    for (const p of this.pool) {
      if (!p.active) continue;

      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        p.mesh.visible = false;
        continue;
      }

      // Physics
      p.vy -= 16.0 * dt; // Gravity
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;

      // Scale down over life
      const progress = p.life / p.maxLife;
      p.mesh.scale.set(progress, progress, progress);
    }
  }

  public reset(): void {
    for (const p of this.pool) {
      p.active = false;
      p.mesh.visible = false;
    }
  }
}
