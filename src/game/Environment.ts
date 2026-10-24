/**
 * CAMPUS RUSH - 5 Procedural Environments & Zones
 * Fixed Scene-Graph Ownership, Shared GPU Resources, & Endless Progression
 */
import * as THREE from 'three';
import { COLORS } from './Constants.ts';
import { GameRenderer } from './Renderer.ts';

export type ZoneType = 'CAMPUS_MORNING' | 'BHOPAL_LAKEFRONT' | 'MARKET_RUSH' | 'NEON_CODE_CITY' | 'FESTIVAL_NIGHTS';

export interface RoadSegment {
  group: THREE.Group;
  roadInfraGroup: THREE.Group; // Permanent infrastructure (road surface, lane lines, curbs)
  sceneryGroup: THREE.Group;   // Zone-specific scenery props (re-populated on recycle)
  z: number;
}

export class EnvironmentManager {
  private scene: THREE.Scene;
  private renderer: GameRenderer;
  public roadSegments: RoadSegment[] = [];

  private segmentLength: number = 32;
  private numSegments: number = 10; // 320m visible runway
  public currentZone: ZoneType = 'CAMPUS_MORNING';
  public onZoneChange?: (zoneName: string, zoneType: ZoneType) => void;

  // ================= SHARED GPU MATERIALS =================
  private roadMaterial: THREE.MeshStandardMaterial;
  private lineMaterial: THREE.MeshBasicMaterial;
  private curbMaterial: THREE.MeshStandardMaterial;
  private sidewalkMaterial: THREE.MeshStandardMaterial;
  private grassMaterial: THREE.MeshStandardMaterial;
  private grassDarkMaterial: THREE.MeshStandardMaterial;
  private waterMaterial: THREE.MeshStandardMaterial;

  // Architecture Materials
  private brickAcademicMaterial: THREE.MeshStandardMaterial;
  private terracottaMaterial: THREE.MeshStandardMaterial;
  private campusStoneMaterial: THREE.MeshStandardMaterial;
  private roofMaterial: THREE.MeshStandardMaterial;
  private windowWarmMaterial: THREE.MeshBasicMaterial;

  // Flora Materials
  private trunkMaterial: THREE.MeshStandardMaterial;
  private leavesSpringMaterial: THREE.MeshStandardMaterial;
  private leavesLushMaterial: THREE.MeshStandardMaterial;
  private leavesAccentMaterial: THREE.MeshStandardMaterial;

  // Props & Street Furniture Materials
  private lampPostMaterial: THREE.MeshStandardMaterial;
  private lampGlowMaterial: THREE.MeshBasicMaterial;
  private railingMaterial: THREE.MeshStandardMaterial;
  private awningCoralMaterial: THREE.MeshStandardMaterial;
  private awningSaffronMaterial: THREE.MeshStandardMaterial;
  private awningTealMaterial: THREE.MeshStandardMaterial;
  private shopSignMaterial: THREE.MeshBasicMaterial;
  private cyberTowerMaterial: THREE.MeshStandardMaterial;
  private neonCyanMaterial: THREE.MeshBasicMaterial;
  private neonVioletMaterial: THREE.MeshBasicMaterial;
  private lanternArchCableMaterial: THREE.MeshBasicMaterial;
  private lanternMaterials: THREE.MeshBasicMaterial[];

  // ================= SHARED GPU GEOMETRIES =================
  private roadGeo: THREE.PlaneGeometry;
  private lineGeo: THREE.PlaneGeometry;
  private curbGeo: THREE.BoxGeometry;
  private sidewalkGeo: THREE.PlaneGeometry;
  private lawnGeo: THREE.PlaneGeometry;
  private waterGeo: THREE.PlaneGeometry;
  private trunkGeo: THREE.CylinderGeometry;
  private leavesConeGeo: THREE.ConeGeometry;
  private leavesDodecGeo: THREE.DodecahedronGeometry;
  private leavesIcosaGeo: THREE.IcosahedronGeometry;
  private lampPoleGeo: THREE.CylinderGeometry;
  private lampHeadGeo: THREE.BoxGeometry;
  private lampGlobeGeo: THREE.SphereGeometry;
  private railingBarGeo: THREE.BoxGeometry;
  private railingPostGeo: THREE.CylinderGeometry;
  private bldgSmallGeo: THREE.BoxGeometry;
  private bldgMedGeo: THREE.BoxGeometry;
  private bldgLargeGeo: THREE.BoxGeometry;
  private winBandSmallGeo: THREE.PlaneGeometry;
  private winBandMedGeo: THREE.PlaneGeometry;
  private winBandLargeGeo: THREE.PlaneGeometry;
  private entranceCanopyGeo: THREE.BoxGeometry;
  private shopBaseGeo: THREE.BoxGeometry;
  private shopAwningGeo: THREE.BoxGeometry;
  private shopSignGeo: THREE.BoxGeometry;
  private cyberTowerGeo: THREE.BoxGeometry;
  private cyberGridGeo: THREE.PlaneGeometry;
  private cyberPillarGeo: THREE.BoxGeometry;
  private cableGeo: THREE.CylinderGeometry;
  private lanternGeo: THREE.OctahedronGeometry;
  private planterGeo: THREE.BoxGeometry;

  constructor(scene: THREE.Scene, renderer: GameRenderer) {
    this.scene = scene;
    this.renderer = renderer;

    // 1. Initialize all shared materials
    this.roadMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.roadAsphalt,
      roughness: 0.75,
      metalness: 0.1
    });

    this.lineMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.roadMarking
    });

    this.curbMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.curbColor,
      roughness: 0.55
    });

    this.sidewalkMaterial = new THREE.MeshStandardMaterial({
      color: 0xE2E8F0,
      roughness: 0.7
    });

    this.grassMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.grassCampus,
      roughness: 0.85
    });

    this.grassDarkMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.grassDark,
      roughness: 0.85
    });

    this.waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x0284C7,
      roughness: 0.15,
      metalness: 0.85,
      transparent: true,
      opacity: 0.9
    });

    this.brickAcademicMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.brickAcademic,
      roughness: 0.75
    });

    this.terracottaMaterial = new THREE.MeshStandardMaterial({
      color: 0xC2410C,
      roughness: 0.8
    });

    this.campusStoneMaterial = new THREE.MeshStandardMaterial({
      color: 0xF1F5F9,
      roughness: 0.6
    });

    this.roofMaterial = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.7
    });

    this.windowWarmMaterial = new THREE.MeshBasicMaterial({
      color: 0xFEF08A
    });

    this.trunkMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.treeTrunk,
      roughness: 0.9
    });

    this.leavesSpringMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.treeLeavesBright,
      roughness: 0.75
    });

    this.leavesLushMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.treeLeaves,
      roughness: 0.8
    });

    this.leavesAccentMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.treeLeavesAccent,
      roughness: 0.75
    });

    this.lampPostMaterial = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.4
    });

    this.lampGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFFBEB
    });

    this.railingMaterial = new THREE.MeshStandardMaterial({
      color: 0xF1F5F9,
      roughness: 0.4
    });

    this.awningCoralMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.coralAccent,
      roughness: 0.6
    });

    this.awningSaffronMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.warmSaffron,
      roughness: 0.6
    });

    this.awningTealMaterial = new THREE.MeshStandardMaterial({
      color: 0x0D9488,
      roughness: 0.6
    });

    this.shopSignMaterial = new THREE.MeshBasicMaterial({
      color: 0xFEF08A
    });

    this.cyberTowerMaterial = new THREE.MeshStandardMaterial({
      color: 0x0F172A,
      roughness: 0.35,
      metalness: 0.8
    });

    this.neonCyanMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.electricCyan
    });

    this.neonVioletMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.vividViolet
    });

    this.lanternArchCableMaterial = new THREE.MeshBasicMaterial({
      color: 0xFDE047
    });

    this.lanternMaterials = [
      new THREE.MeshBasicMaterial({ color: 0xFBBF24 }),
      new THREE.MeshBasicMaterial({ color: 0xF43F5E }),
      new THREE.MeshBasicMaterial({ color: 0x38BDF8 }),
      new THREE.MeshBasicMaterial({ color: 0xA855F7 })
    ];

    // 2. Initialize all shared geometries
    this.roadGeo = new THREE.PlaneGeometry(11, this.segmentLength);
    this.lineGeo = new THREE.PlaneGeometry(0.2, 3.2);
    this.curbGeo = new THREE.BoxGeometry(0.5, 0.28, this.segmentLength);
    this.sidewalkGeo = new THREE.PlaneGeometry(2.2, this.segmentLength);
    this.lawnGeo = new THREE.PlaneGeometry(35, this.segmentLength);
    this.waterGeo = new THREE.PlaneGeometry(50, this.segmentLength);

    this.trunkGeo = new THREE.CylinderGeometry(0.25, 0.35, 2.5, 6);
    this.leavesConeGeo = new THREE.ConeGeometry(1.6, 3.2, 6);
    this.leavesDodecGeo = new THREE.DodecahedronGeometry(1.65, 1);
    this.leavesIcosaGeo = new THREE.IcosahedronGeometry(1.8, 1);

    this.lampPoleGeo = new THREE.CylinderGeometry(0.08, 0.1, 4.5, 6);
    this.lampHeadGeo = new THREE.BoxGeometry(0.45, 0.18, 0.65);
    this.lampGlobeGeo = new THREE.SphereGeometry(0.35, 8, 8);

    this.railingBarGeo = new THREE.BoxGeometry(0.12, 0.1, this.segmentLength);
    this.railingPostGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.1, 6);

    this.bldgSmallGeo = new THREE.BoxGeometry(12, 10, 16);
    this.bldgMedGeo = new THREE.BoxGeometry(15, 13, 18);
    this.bldgLargeGeo = new THREE.BoxGeometry(18, 16, 20);

    this.winBandSmallGeo = new THREE.PlaneGeometry(10, 0.85);
    this.winBandMedGeo = new THREE.PlaneGeometry(13, 0.85);
    this.winBandLargeGeo = new THREE.PlaneGeometry(16, 0.85);

    this.entranceCanopyGeo = new THREE.BoxGeometry(4.5, 0.2, 2.5);

    this.shopBaseGeo = new THREE.BoxGeometry(7, 5, 10);
    this.shopAwningGeo = new THREE.BoxGeometry(2.8, 0.2, 8);
    this.shopSignGeo = new THREE.BoxGeometry(0.2, 0.8, 6);

    this.cyberTowerGeo = new THREE.BoxGeometry(12, 28, 14);
    this.cyberGridGeo = new THREE.PlaneGeometry(8, 22);
    this.cyberPillarGeo = new THREE.BoxGeometry(0.3, 6, 0.3);

    this.cableGeo = new THREE.CylinderGeometry(0.03, 0.03, 16, 6);
    this.lanternGeo = new THREE.OctahedronGeometry(0.35);
    this.planterGeo = new THREE.BoxGeometry(1.2, 0.6, 2.5);

    this.initRoads();
    this.applyZoneAtmosphere('CAMPUS_MORNING');
  }

  private initRoads(): void {
    for (let i = 0; i < this.numSegments; i++) {
      const z = -i * this.segmentLength;
      const segment = this.createSegment(z, 'CAMPUS_MORNING');
      this.roadSegments.push(segment);
      this.scene.add(segment.group);
    }
  }

  /**
   * Builds a complete road segment with explicit scene-graph separation:
   * - roadInfraGroup: Road surface, bright dashed lane markings, left/right curbs, sidewalks.
   *   NEVER cleared or removed on recycling or reset.
   * - sceneryGroup: Dynamic scenery props that swap per zone.
   */
  public createSegment(z: number, zone: ZoneType): RoadSegment {
    const group = new THREE.Group();
    group.position.z = z;

    // 1. Permanent Road Infrastructure Container
    const roadInfraGroup = new THREE.Group();
    roadInfraGroup.name = 'roadInfraGroup';

    // 1a. Road Surface (Width 11m, Length 32m)
    const roadMesh = new THREE.Mesh(this.roadGeo, this.roadMaterial);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.receiveShadow = true;
    roadInfraGroup.add(roadMesh);

    // 1b. Road Lane Divider Markings (Dashed white lines at x = -1.6 and x = 1.6)
    for (const lx of [-1.6, 1.6]) {
      for (let s = -this.segmentLength / 2 + 2; s < this.segmentLength / 2; s += 6) {
        const lineMesh = new THREE.Mesh(this.lineGeo, this.lineMaterial);
        lineMesh.rotation.x = -Math.PI / 2;
        lineMesh.position.set(lx, 0.015, s);
        roadInfraGroup.add(lineMesh);
      }
    }

    // 1c. Left & Right Curbs (Raised stone edges)
    const leftCurb = new THREE.Mesh(this.curbGeo, this.curbMaterial);
    leftCurb.position.set(-5.75, 0.14, 0);
    const rightCurb = new THREE.Mesh(this.curbGeo, this.curbMaterial);
    rightCurb.position.set(5.75, 0.14, 0);
    roadInfraGroup.add(leftCurb);
    roadInfraGroup.add(rightCurb);

    // 1d. Sidewalk strips flanking the curbs
    const leftSidewalk = new THREE.Mesh(this.sidewalkGeo, this.sidewalkMaterial);
    leftSidewalk.rotation.x = -Math.PI / 2;
    leftSidewalk.position.set(-7.1, 0.06, 0);
    const rightSidewalk = new THREE.Mesh(this.sidewalkGeo, this.sidewalkMaterial);
    rightSidewalk.rotation.x = -Math.PI / 2;
    rightSidewalk.position.set(7.1, 0.06, 0);
    roadInfraGroup.add(leftSidewalk);
    roadInfraGroup.add(rightSidewalk);

    group.add(roadInfraGroup);

    // 2. Dynamic Scenery Container
    const sceneryGroup = new THREE.Group();
    sceneryGroup.name = 'sceneryGroup';
    this.populateScenery(sceneryGroup, zone);
    group.add(sceneryGroup);

    return {
      group,
      roadInfraGroup,
      sceneryGroup,
      z
    };
  }

  private populateScenery(sceneryGroup: THREE.Group, zone: ZoneType): void {
    switch (zone) {
      case 'CAMPUS_MORNING':
        this.buildCampusScenery(sceneryGroup);
        break;
      case 'BHOPAL_LAKEFRONT':
        this.buildLakefrontScenery(sceneryGroup);
        break;
      case 'MARKET_RUSH':
        this.buildMarketScenery(sceneryGroup);
        break;
      case 'NEON_CODE_CITY':
        this.buildNeonCityScenery(sceneryGroup);
        break;
      case 'FESTIVAL_NIGHTS':
        this.buildFestivalScenery(sceneryGroup);
        break;
    }
  }

  // ================= ZONE A: CAMPUS MORNING =================
  private buildCampusScenery(sceneryGroup: THREE.Group): void {
    // Lush green lawns
    const leftLawn = new THREE.Mesh(this.lawnGeo, this.grassMaterial);
    leftLawn.rotation.x = -Math.PI / 2;
    leftLawn.position.set(-25.5, 0.04, 0);
    sceneryGroup.add(leftLawn);

    const rightLawn = new THREE.Mesh(this.lawnGeo, this.grassMaterial);
    rightLawn.rotation.x = -Math.PI / 2;
    rightLawn.position.set(25.5, 0.04, 0);
    sceneryGroup.add(rightLawn);

    // Varied Trees on sides
    for (const side of [-10.2, 10.2]) {
      for (const zOffset of [-9, 9]) {
        const treeType = Math.floor(Math.random() * 3);
        const tree = this.createCampusTree(treeType);
        tree.position.set(side + (Math.random() - 0.5) * 1.2, 0, zOffset);
        sceneryGroup.add(tree);
      }
    }

    // Modern Academic Hall
    const buildingSide = Math.random() > 0.5 ? -21 : 21;
    const building = this.createAcademicBuilding();
    building.position.set(buildingSide, 0, 0);
    sceneryGroup.add(building);

    // Campus Street Lamp
    const lamp = this.createStreetLamp();
    lamp.position.set(-7.5, 0, 0);
    sceneryGroup.add(lamp);

    // Sidewalk Planter on opposite side
    const planter = new THREE.Mesh(this.planterGeo, this.campusStoneMaterial);
    planter.position.set(7.5, 0.3, 0);
    sceneryGroup.add(planter);
  }

  // ================= ZONE B: LAKEFRONT =================
  private buildLakefrontScenery(sceneryGroup: THREE.Group): void {
    // Left: Scenic Blue Water
    const waterMesh = new THREE.Mesh(this.waterGeo, this.waterMaterial);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.set(-33, -0.2, 0);
    sceneryGroup.add(waterMesh);

    // Lake Promenade Railing
    const railing = this.createLakeRailing();
    railing.position.set(-6.1, 0, 0);
    sceneryGroup.add(railing);

    // Promenade Globe Lamps on left edge
    const lamp = this.createPromenadeLamp();
    lamp.position.set(-6.6, 0, 4);
    sceneryGroup.add(lamp);

    // Right: Scenic Sidewalk, Lawn, and Tree Silhouettes
    const rightLawn = new THREE.Mesh(this.lawnGeo, this.grassDarkMaterial);
    rightLawn.rotation.x = -Math.PI / 2;
    rightLawn.position.set(25.5, 0.04, 0);
    sceneryGroup.add(rightLawn);

    const rightTree = this.createCampusTree(1);
    rightTree.position.set(11, 0, 0);
    sceneryGroup.add(rightTree);

    const bldg = this.createAcademicBuilding();
    bldg.position.set(22, 0, 0);
    sceneryGroup.add(bldg);
  }

  // ================= ZONE C: MARKET RUSH =================
  private buildMarketScenery(sceneryGroup: THREE.Group): void {
    // Left & Right colorful street shops with striped awnings
    for (const side of [-1, 1]) {
      const shop = this.createMarketShop(side);
      shop.position.set(side * 11.5, 0, 0);
      sceneryGroup.add(shop);

      // Warm street lamp near shop
      const lamp = this.createStreetLamp();
      lamp.position.set(side * 7.5, 0, 6);
      sceneryGroup.add(lamp);
    }
  }

  // ================= ZONE D: NEON CODE CITY =================
  private buildNeonCityScenery(sceneryGroup: THREE.Group): void {
    // Cyber geometric skyscrapers with glowing cyan/violet window matrices
    for (const side of [-1, 1]) {
      const tower = this.createCyberTower();
      tower.position.set(side * 18, 0, 0);
      sceneryGroup.add(tower);

      // Neon street pillars
      const pillar = new THREE.Mesh(
        this.cyberPillarGeo,
        side < 0 ? this.neonCyanMaterial : this.neonVioletMaterial
      );
      pillar.position.set(side * 7.0, 3, 0);
      sceneryGroup.add(pillar);
    }
  }

  // ================= ZONE E: FESTIVAL NIGHTS =================
  private buildFestivalScenery(sceneryGroup: THREE.Group): void {
    for (const side of [-1, 1]) {
      const building = this.createAcademicBuilding();
      building.position.set(side * 20, 0, 0);
      sceneryGroup.add(building);

      const tree = this.createCampusTree(2);
      tree.position.set(side * 10, 0, 8);
      sceneryGroup.add(tree);
    }

    // Overhead string of glowing festival lanterns
    const lanternWire = this.createFestivalLanternArch();
    lanternWire.position.set(0, 0, 0);
    sceneryGroup.add(lanternWire);
  }

  // ================= SCENERY PROP BUILDERS =================
  private createCampusTree(type: number = 0): THREE.Group {
    const tree = new THREE.Group();

    // Trunk
    const trunk = new THREE.Mesh(this.trunkGeo, this.trunkMaterial);
    trunk.position.y = 1.25;
    trunk.castShadow = true;
    tree.add(trunk);

    // Crown based on type
    let leaves: THREE.Mesh;
    if (type === 0) {
      // Conical evergreen
      leaves = new THREE.Mesh(this.leavesConeGeo, this.leavesSpringMaterial);
      leaves.position.y = 3.2;
    } else if (type === 1) {
      // Round shade tree
      leaves = new THREE.Mesh(this.leavesDodecGeo, this.leavesLushMaterial);
      leaves.position.y = 3.3;
    } else {
      // Flowering accent tree
      leaves = new THREE.Mesh(this.leavesIcosaGeo, this.leavesAccentMaterial);
      leaves.position.y = 3.4;
    }
    leaves.castShadow = true;
    tree.add(leaves);

    return tree;
  }

  private createAcademicBuilding(): THREE.Group {
    const building = new THREE.Group();
    const sizeRoll = Math.random();

    let bGeo = this.bldgSmallGeo;
    let winGeo = this.winBandSmallGeo;
    let h = 10;
    let d = 16;
    let bMat = this.brickAcademicMaterial;

    if (sizeRoll > 0.6) {
      bGeo = this.bldgLargeGeo;
      winGeo = this.winBandLargeGeo;
      h = 16;
      d = 20;
      bMat = this.campusStoneMaterial;
    } else if (sizeRoll > 0.3) {
      bGeo = this.bldgMedGeo;
      winGeo = this.winBandMedGeo;
      h = 13;
      d = 18;
      bMat = this.terracottaMaterial;
    }

    const bMesh = new THREE.Mesh(bGeo, bMat);
    bMesh.position.y = h / 2;
    bMesh.castShadow = true;
    building.add(bMesh);

    // Window bands
    const winMat = this.windowWarmMaterial;
    for (let y = 3.5; y < h - 2; y += 3) {
      const winMesh = new THREE.Mesh(winGeo, winMat);
      winMesh.position.set(0, y, d / 2 + 0.05);
      building.add(winMesh);
    }

    // Entrance canopy
    const canopy = new THREE.Mesh(this.entranceCanopyGeo, this.roofMaterial);
    canopy.position.set(0, 2.6, d / 2 + 1.25);
    building.add(canopy);

    return building;
  }

  private createStreetLamp(): THREE.Group {
    const lamp = new THREE.Group();
    const post = new THREE.Mesh(this.lampPoleGeo, this.lampPostMaterial);
    post.position.y = 2.25;
    lamp.add(post);

    const head = new THREE.Mesh(this.lampHeadGeo, this.lampGlowMaterial);
    head.position.set(0.2, 4.5, 0);
    lamp.add(head);

    return lamp;
  }

  private createLakeRailing(): THREE.Group {
    const railing = new THREE.Group();

    const barTop = new THREE.Mesh(this.railingBarGeo, this.railingMaterial);
    barTop.position.y = 1.0;
    railing.add(barTop);

    const barMid = new THREE.Mesh(this.railingBarGeo, this.railingMaterial);
    barMid.position.y = 0.5;
    railing.add(barMid);

    // Vertical posts
    for (let z = -this.segmentLength / 2; z < this.segmentLength / 2; z += 4) {
      const post = new THREE.Mesh(this.railingPostGeo, this.railingMaterial);
      post.position.set(0, 0.55, z);
      railing.add(post);
    }
    return railing;
  }

  private createPromenadeLamp(): THREE.Group {
    const lamp = new THREE.Group();
    const pole = new THREE.Mesh(this.lampPoleGeo, this.lampPostMaterial);
    pole.position.y = 2.25;
    lamp.add(pole);

    const globe = new THREE.Mesh(this.lampGlobeGeo, this.lampGlowMaterial);
    globe.position.y = 4.6;
    lamp.add(globe);

    return lamp;
  }

  private createMarketShop(side: number): THREE.Group {
    const shop = new THREE.Group();

    const base = new THREE.Mesh(this.shopBaseGeo, this.campusStoneMaterial);
    base.position.y = 2.5;
    shop.add(base);

    // Striped awning
    const awnings = [this.awningCoralMaterial, this.awningSaffronMaterial, this.awningTealMaterial];
    const chosenAwning = awnings[Math.floor(Math.random() * awnings.length)];
    const awning = new THREE.Mesh(this.shopAwningGeo, chosenAwning);
    awning.rotation.z = side * -0.22;
    awning.position.set(side * -2.8, 3.6, 0);
    shop.add(awning);

    // Shop Signboard
    const sign = new THREE.Mesh(this.shopSignGeo, this.shopSignMaterial);
    sign.position.set(side * -3.6, 4.4, 0);
    shop.add(sign);

    return shop;
  }

  private createCyberTower(): THREE.Group {
    const tower = new THREE.Group();
    const bMesh = new THREE.Mesh(this.cyberTowerGeo, this.cyberTowerMaterial);
    bMesh.position.y = 14;
    tower.add(bMesh);

    // Glowing Neon window grid strips
    const gridMat = Math.random() > 0.5 ? this.neonCyanMaterial : this.neonVioletMaterial;
    const grid = new THREE.Mesh(this.cyberGridGeo, gridMat);
    grid.position.set(0, 14, 7.05);
    tower.add(grid);

    return tower;
  }

  private createFestivalLanternArch(): THREE.Group {
    const arch = new THREE.Group();
    const cable = new THREE.Mesh(this.cableGeo, this.lanternArchCableMaterial);
    cable.rotation.z = Math.PI / 2;
    cable.position.set(0, 6.2, 0);
    arch.add(cable);

    for (let x = -5; x <= 5; x += 2.5) {
      const lanternMat = this.lanternMaterials[Math.floor(Math.random() * this.lanternMaterials.length)];
      const lantern = new THREE.Mesh(this.lanternGeo, lanternMat);
      lantern.position.set(x, 5.7, 0);
      arch.add(lantern);
    }
    return arch;
  }

  // ================= UPDATE & ZONE TRANSITIONS =================
  public update(playerSpeed: number, dt: number, totalDistanceMeters: number): void {
    const moveZ = playerSpeed * dt;

    // Endless 5-zone cycle (2600m cycle length)
    const cycleDist = totalDistanceMeters % 2600;
    let newZone: ZoneType = 'CAMPUS_MORNING';
    let zoneDisplayName = 'Campus Morning';

    if (cycleDist >= 2100) {
      newZone = 'FESTIVAL_NIGHTS';
      zoneDisplayName = 'Festival';
    } else if (cycleDist >= 1500) {
      newZone = 'NEON_CODE_CITY';
      zoneDisplayName = 'Neon City';
    } else if (cycleDist >= 950) {
      newZone = 'MARKET_RUSH';
      zoneDisplayName = 'Market';
    } else if (cycleDist >= 450) {
      newZone = 'BHOPAL_LAKEFRONT';
      zoneDisplayName = 'Lakefront';
    } else {
      newZone = 'CAMPUS_MORNING';
      zoneDisplayName = 'Campus Morning';
    }

    if (newZone !== this.currentZone) {
      this.currentZone = newZone;
      this.applyZoneAtmosphere(newZone);
      if (this.onZoneChange) {
        this.onZoneChange(zoneDisplayName, newZone);
      }
    }

    // Move road segments backward and recycle when passing behind camera (Z > 30)
    for (const seg of this.roadSegments) {
      seg.group.position.z += moveZ;

      if (seg.group.position.z > 30) {
        let minZ = 0;
        for (const s of this.roadSegments) {
          if (s.group.position.z < minZ) minZ = s.group.position.z;
        }

        // Reposition ahead of runway
        seg.group.position.z = minZ - this.segmentLength;

        // Clear ONLY dynamic sceneryGroup! roadInfraGroup is preserved completely intact!
        while (seg.sceneryGroup.children.length > 0) {
          seg.sceneryGroup.remove(seg.sceneryGroup.children[seg.sceneryGroup.children.length - 1]);
        }
        this.populateScenery(seg.sceneryGroup, this.currentZone);
      }
    }
  }

  public applyZoneAtmosphere(zone: ZoneType): void {
    switch (zone) {
      case 'CAMPUS_MORNING':
        this.renderer.setAtmosphereColors(
          COLORS.skyCampus,
          COLORS.skyCampusFog,
          0.0065,
          0xFFFDF5,
          1.5,
          0xBAE6FD,
          0x86EFAC
        );
        break;

      case 'BHOPAL_LAKEFRONT':
        this.renderer.setAtmosphereColors(
          COLORS.skyLakefront,
          COLORS.skyLakefrontFog,
          0.0060,
          0xFFD188,
          1.45,
          0xFED7AA,
          0x7DD3FC
        );
        break;

      case 'MARKET_RUSH':
        this.renderer.setAtmosphereColors(
          COLORS.skyMarket,
          COLORS.skyMarketFog,
          0.0065,
          0xFFFBEB,
          1.5,
          0xBAE6FD,
          0xFDE68A
        );
        break;

      case 'NEON_CODE_CITY':
        this.renderer.setAtmosphereColors(
          COLORS.skyNeon,
          COLORS.skyNeonFog,
          0.0080,
          0x818CF8,
          1.25,
          0x38BDF8,
          0x8B5CF6
        );
        break;

      case 'FESTIVAL_NIGHTS':
        this.renderer.setAtmosphereColors(
          COLORS.skyFestival,
          COLORS.skyFestivalFog,
          0.0075,
          0xFBBF24,
          1.35,
          0xC084FC,
          0xF43F5E
        );
        break;
    }
  }

  public reset(): void {
    this.currentZone = 'CAMPUS_MORNING';
    this.applyZoneAtmosphere('CAMPUS_MORNING');
    for (let i = 0; i < this.roadSegments.length; i++) {
      const seg = this.roadSegments[i];
      seg.group.position.z = -i * this.segmentLength;

      // Safely clear only sceneryGroup; roadInfraGroup remains 100% untouched
      while (seg.sceneryGroup.children.length > 0) {
        seg.sceneryGroup.remove(seg.sceneryGroup.children[seg.sceneryGroup.children.length - 1]);
      }
      this.populateScenery(seg.sceneryGroup, 'CAMPUS_MORNING');
    }
  }
}
