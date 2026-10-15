/**
 * Deepesh Dash: Campus Rush - Deepesh 3D Character Model & Animations
 */
import * as THREE from 'three';
import { COLORS, GAME_CONFIG, LANES, LaneIndex, OUTFITS, OutfitDefinition } from './Constants';

export type PlayerState = 'RUNNING' | 'JUMPING' | 'SLIDING' | 'STUMBLED';

export class Player {
  public group: THREE.Group;

  // Hierarchical Body Parts
  private bodyRoot: THREE.Group;
  private torsoGroup: THREE.Group;
  private headGroup: THREE.Group;
  private backpackGroup: THREE.Group;
  private leftArmGroup: THREE.Group;
  private rightArmGroup: THREE.Group;
  private leftLegGroup: THREE.Group;
  private rightLegGroup: THREE.Group;
  private leftKneeGroup: THREE.Group;
  private rightKneeGroup: THREE.Group;
  private shadowMesh: THREE.Mesh;

  // Power-up visual overlays
  private shieldMesh: THREE.Mesh;
  private magnetRingMesh: THREE.Mesh;
  private focusAuraMesh: THREE.Mesh;

  // Outfit Materials
  private hoodieMaterial: THREE.MeshStandardMaterial;
  private pantsMaterial: THREE.MeshStandardMaterial;
  private accentMaterial: THREE.MeshStandardMaterial;
  private skinMaterial: THREE.MeshStandardMaterial;
  private hairMaterial: THREE.MeshStandardMaterial;
  private sneakerMaterial: THREE.MeshStandardMaterial;
  private backpackMaterial: THREE.MeshStandardMaterial;

  // State & Physics
  public state: PlayerState = 'RUNNING';
  public currentLane: LaneIndex = 1; // Center lane
  public targetX: number = LANES[1];
  public x: number = LANES[1];
  public y: number = 0;
  public vy: number = 0;
  public slideTimer: number = 0;

  // Animation cycle clocks
  private runAnimTime: number = 0;
  private currentOutfit: OutfitDefinition = OUTFITS[0];

  // Active power-up states
  public hasShield: boolean = false;
  public hasMagnet: boolean = false;
  public isSprintBoosting: boolean = false;
  public isFocusMode: boolean = false;

  constructor() {
    this.group = new THREE.Group();

    // Materials setup
    this.hoodieMaterial = new THREE.MeshStandardMaterial({
      color: this.currentOutfit.hoodieColor,
      roughness: 0.6,
      metalness: 0.1
    });

    this.pantsMaterial = new THREE.MeshStandardMaterial({
      color: this.currentOutfit.pantsColor,
      roughness: 0.7
    });

    this.accentMaterial = new THREE.MeshStandardMaterial({
      color: this.currentOutfit.accentColor,
      roughness: 0.3,
      emissive: this.currentOutfit.glowColor,
      emissiveIntensity: 0.25
    });

    this.skinMaterial = new THREE.MeshStandardMaterial({
      color: 0x8D5524, // Warm Indian skin tone
      roughness: 0.8
    });

    this.hairMaterial = new THREE.MeshStandardMaterial({
      color: 0x1A1412,
      roughness: 0.9
    });

    this.sneakerMaterial = new THREE.MeshStandardMaterial({
      color: 0xF4F6FC,
      roughness: 0.4
    });

    this.backpackMaterial = new THREE.MeshStandardMaterial({
      color: 0x1B2032,
      roughness: 0.7
    });

    // Build the hierarchical character rig
    this.bodyRoot = new THREE.Group();
    this.group.add(this.bodyRoot);

    // 1. Torso
    this.torsoGroup = new THREE.Group();
    this.torsoGroup.position.y = 1.05;
    this.bodyRoot.add(this.torsoGroup);

    // Hoodie body
    const torsoGeo = new THREE.BoxGeometry(0.75, 0.85, 0.45);
    const torsoMesh = new THREE.Mesh(torsoGeo, this.hoodieMaterial);
    torsoMesh.castShadow = true;
    this.torsoGroup.add(torsoMesh);

    // Hoodie drawstrings / collar
    const collarGeo = new THREE.CylinderGeometry(0.24, 0.26, 0.12, 8);
    const collarMesh = new THREE.Mesh(collarGeo, this.accentMaterial);
    collarMesh.position.y = 0.46;
    this.torsoGroup.add(collarMesh);

    // Folded Hood on back
    const hoodGeo = new THREE.BoxGeometry(0.5, 0.3, 0.22);
    const hoodMesh = new THREE.Mesh(hoodGeo, this.hoodieMaterial);
    hoodMesh.position.set(0, 0.32, 0.26);
    this.torsoGroup.add(hoodMesh);

    // 2. Student Backpack
    this.backpackGroup = new THREE.Group();
    this.backpackGroup.position.set(0, 0.05, 0.3);
    this.torsoGroup.add(this.backpackGroup);

    const packGeo = new THREE.BoxGeometry(0.55, 0.65, 0.3);
    const packMesh = new THREE.Mesh(packGeo, this.backpackMaterial);
    packMesh.castShadow = true;
    this.backpackGroup.add(packMesh);

    // Laptop compartment pocket
    const pocketGeo = new THREE.BoxGeometry(0.46, 0.42, 0.1);
    const pocketMesh = new THREE.Mesh(pocketGeo, this.backpackMaterial);
    pocketMesh.position.z = 0.16;
    this.backpackGroup.add(pocketMesh);

    // Glowing Byte/Code badge sticker on backpack
    const badgeGeo = new THREE.PlaneGeometry(0.2, 0.2);
    const badgeMesh = new THREE.Mesh(badgeGeo, this.accentMaterial);
    badgeMesh.position.set(0, 0.05, 0.22);
    this.backpackGroup.add(badgeMesh);

    // 3. Head & Hair
    this.headGroup = new THREE.Group();
    this.headGroup.position.y = 0.65;
    this.torsoGroup.add(this.headGroup);

    const headGeo = new THREE.BoxGeometry(0.48, 0.52, 0.46);
    const headMesh = new THREE.Mesh(headGeo, this.skinMaterial);
    headMesh.castShadow = true;
    this.headGroup.add(headMesh);

    // Stylized modern quiff/pompadour hair
    const hairGeo = new THREE.BoxGeometry(0.54, 0.28, 0.52);
    const hairMesh = new THREE.Mesh(hairGeo, this.hairMaterial);
    hairMesh.position.set(0, 0.28, 0.02);
    this.headGroup.add(hairMesh);

    const hairFringeGeo = new THREE.BoxGeometry(0.5, 0.16, 0.18);
    const hairFringe = new THREE.Mesh(hairFringeGeo, this.hairMaterial);
    hairFringe.position.set(0, 0.22, -0.22);
    this.headGroup.add(hairFringe);

    // Cool Tech Sunglasses / Visor
    const glassesGeo = new THREE.BoxGeometry(0.44, 0.14, 0.1);
    const glassesMat = new THREE.MeshStandardMaterial({
      color: 0x050810,
      roughness: 0.1,
      metalness: 0.8
    });
    const glassesMesh = new THREE.Mesh(glassesGeo, glassesMat);
    glassesMesh.position.set(0, 0.06, -0.24);
    this.headGroup.add(glassesMesh);

    // 4. Arms
    this.leftArmGroup = this.createArm(-1);
    this.rightArmGroup = this.createArm(1);
    this.torsoGroup.add(this.leftArmGroup);
    this.torsoGroup.add(this.rightArmGroup);

    // 5. Legs
    const [leftLeg, leftKnee] = this.createLeg(-1);
    const [rightLeg, rightKnee] = this.createLeg(1);
    this.leftLegGroup = leftLeg;
    this.rightLegGroup = rightLeg;
    this.leftKneeGroup = leftKnee;
    this.rightKneeGroup = rightKnee;
    this.bodyRoot.add(this.leftLegGroup);
    this.bodyRoot.add(this.rightLegGroup);

    // 6. Contact Shadow Mesh on ground
    const shadowGeo = new THREE.PlaneGeometry(1.4, 2.0);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45,
      depthWrite: false
    });
    this.shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowMesh.rotation.x = -Math.PI / 2;
    this.shadowMesh.position.y = 0.02;
    this.group.add(this.shadowMesh);

    // 7. Notebook Shield 3D Forcefield Sphere
    const shieldGeo = new THREE.IcosahedronGeometry(1.5, 2);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: COLORS.electricCyan,
      transparent: true,
      opacity: 0.35,
      wireframe: true,
      emissive: COLORS.electricCyan,
      emissiveIntensity: 0.6
    });
    this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    this.shieldMesh.position.y = 1.1;
    this.shieldMesh.visible = false;
    this.group.add(this.shieldMesh);

    // 8. Code Magnet Magnetic Pulse Ring
    const magnetGeo = new THREE.TorusGeometry(1.6, 0.06, 8, 24);
    const magnetMat = new THREE.MeshBasicMaterial({
      color: COLORS.coralAccent,
      transparent: true,
      opacity: 0.7
    });
    this.magnetRingMesh = new THREE.Mesh(magnetGeo, magnetMat);
    this.magnetRingMesh.rotation.x = Math.PI / 2;
    this.magnetRingMesh.position.y = 0.3;
    this.magnetRingMesh.visible = false;
    this.group.add(this.magnetRingMesh);

    // 9. Focus Mode Glowing Energy Aura
    const auraGeo = new THREE.CylinderGeometry(1.2, 1.4, 2.4, 16, 1, true);
    const auraMat = new THREE.MeshBasicMaterial({
      color: COLORS.vividViolet,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    this.focusAuraMesh = new THREE.Mesh(auraGeo, auraMat);
    this.focusAuraMesh.position.y = 1.1;
    this.focusAuraMesh.visible = false;
    this.group.add(this.focusAuraMesh);
  }

  private createArm(side: number): THREE.Group {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.48, 0.34, 0);

    // Upper arm (Hoodie sleeve)
    const upperGeo = new THREE.BoxGeometry(0.24, 0.45, 0.24);
    const upperMesh = new THREE.Mesh(upperGeo, this.hoodieMaterial);
    upperMesh.position.y = -0.2;
    upperMesh.castShadow = true;
    shoulder.add(upperMesh);

    // Forearm & Hand
    const handGeo = new THREE.BoxGeometry(0.2, 0.4, 0.2);
    const handMesh = new THREE.Mesh(handGeo, this.skinMaterial);
    handMesh.position.y = -0.55;
    shoulder.add(handMesh);

    return shoulder;
  }

  private createLeg(side: number): [THREE.Group, THREE.Group] {
    const hip = new THREE.Group();
    hip.position.set(side * 0.24, 0.65, 0);

    // Upper Leg (Pants)
    const thighGeo = new THREE.BoxGeometry(0.26, 0.45, 0.26);
    const thighMesh = new THREE.Mesh(thighGeo, this.pantsMaterial);
    thighMesh.position.y = -0.2;
    thighMesh.castShadow = true;
    hip.add(thighMesh);

    // Knee joint
    const knee = new THREE.Group();
    knee.position.y = -0.4;
    hip.add(knee);

    // Lower Leg (Calf)
    const calfGeo = new THREE.BoxGeometry(0.24, 0.42, 0.24);
    const calfMesh = new THREE.Mesh(calfGeo, this.pantsMaterial);
    calfMesh.position.y = -0.18;
    calfMesh.castShadow = true;
    knee.add(calfMesh);

    // Modern Sneaker Shoe
    const shoeGeo = new THREE.BoxGeometry(0.28, 0.18, 0.48);
    const shoeMesh = new THREE.Mesh(shoeGeo, this.sneakerMaterial);
    shoeMesh.position.set(0, -0.42, -0.07);
    shoeMesh.castShadow = true;
    knee.add(shoeMesh);

    // Sneaker cyan/accent trim
    const shoeTrimGeo = new THREE.BoxGeometry(0.29, 0.06, 0.49);
    const shoeTrimMesh = new THREE.Mesh(shoeTrimGeo, this.accentMaterial);
    shoeTrimMesh.position.set(0, -0.48, -0.07);
    knee.add(shoeTrimMesh);

    return [hip, knee];
  }

  public setOutfit(outfitId: string): void {
    const found = OUTFITS.find((o) => o.id === outfitId) || OUTFITS[0];
    this.currentOutfit = found;

    this.hoodieMaterial.color.setHex(found.hoodieColor);
    this.pantsMaterial.color.setHex(found.pantsColor);
    this.accentMaterial.color.setHex(found.accentColor);
    this.accentMaterial.emissive.setHex(found.glowColor);
  }

  // Input actions
  public moveLeft(): boolean {
    if (this.state === 'STUMBLED') return false;
    if (this.currentLane > 0) {
      this.currentLane = (this.currentLane - 1) as LaneIndex;
      this.targetX = LANES[this.currentLane];
      return true;
    }
    return false;
  }

  public moveRight(): boolean {
    if (this.state === 'STUMBLED') return false;
    if (this.currentLane < 2) {
      this.currentLane = (this.currentLane + 1) as LaneIndex;
      this.targetX = LANES[this.currentLane];
      return true;
    }
    return false;
  }

  public jump(): boolean {
    if (this.state === 'STUMBLED') return false;
    // Allow jumping from running or sliding
    if (this.state === 'RUNNING' || this.state === 'SLIDING') {
      this.state = 'JUMPING';
      this.vy = GAME_CONFIG.jumpVelocity;
      this.slideTimer = 0;
      return true;
    }
    return false;
  }

  public slide(): boolean {
    if (this.state === 'STUMBLED') return false;
    if (this.state === 'JUMPING') {
      // Fast fall down into slide!
      this.vy = -GAME_CONFIG.jumpVelocity * 1.5;
    }
    this.state = 'SLIDING';
    this.slideTimer = GAME_CONFIG.slideDuration;
    return true;
  }

  public stumble(): void {
    this.state = 'STUMBLED';
  }

  public reset(): void {
    this.state = 'RUNNING';
    this.currentLane = 1;
    this.targetX = LANES[1];
    this.x = LANES[1];
    this.y = 0;
    this.vy = 0;
    this.slideTimer = 0;
    this.hasShield = false;
    this.hasMagnet = false;
    this.isSprintBoosting = false;
    this.isFocusMode = false;
    this.group.position.set(this.x, 0, 0);
    this.bodyRoot.rotation.set(0, 0, 0);
    this.bodyRoot.position.set(0, 0, 0);
  }

  // Physics & Animation Loop
  public update(dt: number, speedMultiplier: number): void {
    // 1. Smooth Lane Interpolation (Lerp with slight banking)
    const dx = this.targetX - this.x;
    this.x += dx * Math.min(1.0, dt * GAME_CONFIG.laneSwitchSpeed);
    this.group.position.x = this.x;

    // Banking roll angle while changing lanes
    const bankAngle = -dx * 0.12;
    this.bodyRoot.rotation.z = bankAngle;

    // 2. Vertical Physics (Jump & Gravity)
    if (this.state === 'JUMPING' || this.y > 0) {
      this.vy += GAME_CONFIG.gravity * dt;
      this.y += this.vy * dt;

      if (this.y <= 0) {
        this.y = 0;
        this.vy = 0;
        if (this.state === 'JUMPING') {
          this.state = 'RUNNING';
        }
      }
    }

    // 3. Slide Timer
    if (this.state === 'SLIDING') {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) {
        this.state = 'RUNNING';
      }
    }

    this.group.position.y = this.y;

    // 4. Dynamic Shadow adjustment
    const shadowScale = Math.max(0.4, 1.0 - this.y / 4.0);
    this.shadowMesh.scale.set(shadowScale, shadowScale, 1);
    (this.shadowMesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0.1, 0.45 - this.y * 0.1);

    // 5. Procedural Joint Animations
    this.animateBody(dt, speedMultiplier);

    // 6. Power-up Visual Overlays
    this.updatePowerUpAuras(dt);
  }

  private animateBody(dt: number, speedMultiplier: number): void {
    if (this.state === 'STUMBLED') {
      // Crash impact pose: spin back and tumble
      this.bodyRoot.rotation.x = THREE.MathUtils.lerp(this.bodyRoot.rotation.x, -Math.PI / 2.2, dt * 10);
      this.bodyRoot.position.y = THREE.MathUtils.lerp(this.bodyRoot.position.y, 0.4, dt * 10);
      this.leftArmGroup.rotation.x = -Math.PI / 3;
      this.rightArmGroup.rotation.x = -Math.PI / 3;
      return;
    }

    if (this.state === 'SLIDING') {
      // Crouch slide pose: torso drops back, legs slide forward
      this.bodyRoot.position.y = THREE.MathUtils.lerp(this.bodyRoot.position.y, -0.45, dt * 16);
      this.torsoGroup.rotation.x = THREE.MathUtils.lerp(this.torsoGroup.rotation.x, -0.45, dt * 16);
      this.headGroup.rotation.x = THREE.MathUtils.lerp(this.headGroup.rotation.x, 0.45, dt * 16);

      this.leftLegGroup.rotation.x = THREE.MathUtils.lerp(this.leftLegGroup.rotation.x, -1.3, dt * 16);
      this.rightLegGroup.rotation.x = THREE.MathUtils.lerp(this.rightLegGroup.rotation.x, -1.1, dt * 16);
      this.leftKneeGroup.rotation.x = 0.2;
      this.rightKneeGroup.rotation.x = 0.3;

      this.leftArmGroup.rotation.x = -0.5;
      this.rightArmGroup.rotation.x = -0.5;
      return;
    }

    if (this.state === 'JUMPING') {
      // Jump tuck pose: legs bent, arms reaching up
      this.bodyRoot.position.y = THREE.MathUtils.lerp(this.bodyRoot.position.y, 0, dt * 12);
      this.torsoGroup.rotation.x = -0.15;
      this.leftLegGroup.rotation.x = -0.7;
      this.rightLegGroup.rotation.x = -0.5;
      this.leftKneeGroup.rotation.x = 1.1;
      this.rightKneeGroup.rotation.x = 0.9;
      this.leftArmGroup.rotation.x = 1.6;
      this.rightArmGroup.rotation.x = 1.6;
      return;
    }

    // Default: RUNNING STRIDE
    this.bodyRoot.position.y = THREE.MathUtils.lerp(this.bodyRoot.position.y, 0, dt * 12);
    this.torsoGroup.rotation.x = 0.12; // Athletic forward lean
    this.headGroup.rotation.x = -0.08;

    const runSpeed = 12.0 * speedMultiplier;
    this.runAnimTime += dt * runSpeed;

    const legAngle = Math.sin(this.runAnimTime) * 0.75;
    const armAngle = -Math.sin(this.runAnimTime) * 0.75;

    // Opposing limb swings
    this.leftLegGroup.rotation.x = legAngle;
    this.rightLegGroup.rotation.x = -legAngle;

    // Knee bends on backswing
    this.leftKneeGroup.rotation.x = legAngle < 0 ? -legAngle * 1.2 : 0.1;
    this.rightKneeGroup.rotation.x = -legAngle < 0 ? legAngle * 1.2 : 0.1;

    this.leftArmGroup.rotation.x = armAngle;
    this.rightArmGroup.rotation.x = -armAngle;

    // Subtle torso vertical bounce & backpack sway
    this.torsoGroup.position.y = 1.05 + Math.abs(Math.cos(this.runAnimTime * 2)) * 0.08;
    this.backpackGroup.rotation.x = Math.sin(this.runAnimTime * 2) * 0.06;
  }

  private updatePowerUpAuras(dt: number): void {
    // Notebook Shield
    this.shieldMesh.visible = this.hasShield;
    if (this.hasShield) {
      this.shieldMesh.rotation.y += dt * 2.0;
      this.shieldMesh.rotation.x += dt * 1.2;
    }

    // Code Magnet
    this.magnetRingMesh.visible = this.hasMagnet;
    if (this.hasMagnet) {
      this.magnetRingMesh.rotation.z += dt * 3.5;
    }

    // Focus Mode
    this.focusAuraMesh.visible = this.isFocusMode;
    if (this.isFocusMode) {
      this.focusAuraMesh.rotation.y += dt * 4.0;
    }
  }

  // Get current collision bounding box
  public getBoundingBox(): THREE.Box3 {
    const isSliding = this.state === 'SLIDING';
    const h = isSliding ? GAME_CONFIG.playerSlideHeight : GAME_CONFIG.playerHeight;
    const halfW = GAME_CONFIG.playerWidth / 2;
    const halfD = GAME_CONFIG.playerDepth / 2;

    return new THREE.Box3(
      new THREE.Vector3(this.x - halfW, this.y, -halfD),
      new THREE.Vector3(this.x + halfW, this.y + h, halfD)
    );
  }
}
