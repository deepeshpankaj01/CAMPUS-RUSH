/**
 * CAMPUS RUSH - Three.js Renderer & Scene Setup
 */
import * as THREE from 'three';
import { COLORS } from './Constants.ts';

export class GameRenderer {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public dirLight: THREE.DirectionalLight;
  public hemiLight: THREE.HemisphereLight;
  public fog: THREE.FogExp2;

  private container: HTMLElement;
  private isMenuMode: boolean = true;

  constructor(container: HTMLElement) {
    this.container = container;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(COLORS.skyCampus);

    // 2. Fog for atmospheric depth and smooth distance clipping
    this.fog = new THREE.FogExp2(COLORS.skyCampusFog, 0.0065);
    this.scene.fog = this.fog;

    // 3. Camera (Endless runner 3rd-person follow angle)
    const aspect = container.clientWidth / (container.clientHeight || 1);
    this.camera = new THREE.PerspectiveCamera(58, aspect, 0.1, 320);
    this.updateCameraForMode();

    // 4. WebGL Renderer with optimized mobile DPR & color management
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    // Clamp DPR to max 2.0 to ensure smooth 60 FPS across mobile and desktop
    const dpr = Math.min(window.devicePixelRatio || 1, 2.0);
    this.renderer.setPixelRatio(dpr);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.06;

    container.appendChild(this.renderer.domElement);

    // 5. Lighting - Bright, cheerful campus daylight
    this.hemiLight = new THREE.HemisphereLight(0xBAE6FD, 0x86EFAC, 0.95);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xFFFDF5, 1.5);
    this.dirLight.position.set(22, 45, 18);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 130;
    const d = 26;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0004;
    this.scene.add(this.dirLight);

    // Listen for resize
    window.addEventListener('resize', this.onResize);
  }

  public setMenuMode(isMenu: boolean): void {
    this.isMenuMode = isMenu;
    this.updateCameraForMode();
  }

  private updateCameraForMode(): void {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight || 1;
    const aspect = width / height;
    this.camera.aspect = aspect;

    if (this.isMenuMode) {
      if (aspect < 0.8) {
        // Portrait mobile menu: lower camera, center runner in lower-middle sweet spot
        this.camera.fov = 62;
        this.camera.position.set(0, 3.8, 7.8);
        this.camera.lookAt(0, 1.3, -8);
      } else {
        this.camera.fov = 54;
        this.camera.position.set(0, 4.2, 8.5);
        this.camera.lookAt(0, 1.4, -10);
      }
    } else {
      // Gameplay follow camera
      if (aspect < 0.8) {
        this.camera.fov = 64;
        this.camera.position.set(0, 5.2, 9.6);
        this.camera.lookAt(0, 1.5, -14);
      } else {
        this.camera.fov = 56;
        this.camera.position.set(0, 4.8, 9.0);
        this.camera.lookAt(0, 1.6, -14);
      }
    }
    this.camera.updateProjectionMatrix();
  }

  public onResize = (): void => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.updateCameraForMode();
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.0));
  };

  public setAtmosphereColors(
    bgColor: number,
    fogColor: number,
    fogDensity: number,
    lightColor: number,
    lightIntensity: number,
    hemiSky: number = 0xBAE6FD,
    hemiGround: number = 0x86EFAC
  ): void {
    this.scene.background = new THREE.Color(bgColor);
    this.fog.color = new THREE.Color(fogColor);
    this.fog.density = fogDensity;
    this.dirLight.color.setHex(lightColor);
    this.dirLight.intensity = lightIntensity;
    this.hemiLight.color.setHex(hemiSky);
    this.hemiLight.groundColor.setHex(hemiGround);
  }

  public render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
  }
}
