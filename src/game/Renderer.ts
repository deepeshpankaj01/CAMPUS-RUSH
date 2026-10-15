/**
 * Deepesh Dash: Campus Rush - Three.js Renderer & Scene Setup
 */
import * as THREE from 'three';
import { COLORS } from './Constants';

export class GameRenderer {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public dirLight: THREE.DirectionalLight;
  public hemiLight: THREE.HemisphereLight;
  public fog: THREE.FogExp2;

  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(COLORS.midnightNavy);

    // 2. Fog for atmospheric depth and smooth distance clipping
    this.fog = new THREE.FogExp2(COLORS.midnightNavy, 0.009);
    this.scene.fog = this.fog;

    // 3. Camera (Endless runner 3rd-person follow angle)
    const aspect = container.clientWidth / (container.clientHeight || 1);
    this.camera = new THREE.PerspectiveCamera(58, aspect, 0.1, 300);
    this.camera.position.set(0, 5.2, 9.5);
    this.camera.lookAt(0, 1.8, -12);

    // 4. Renderer with high performance & clamped DPR
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    // Clamp DPR to max 2.0 to ensure smooth 60 FPS on mobile / Retina screens
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    container.appendChild(this.renderer.domElement);

    // 5. Lighting
    this.hemiLight = new THREE.HemisphereLight(0xffffff, COLORS.midnightNavy, 0.85);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xfffaed, 1.3);
    this.dirLight.position.set(20, 45, 20);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 120;
    const d = 25;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0005;
    this.scene.add(this.dirLight);

    // Listen for resize
    window.addEventListener('resize', this.onResize);
  }

  public onResize = (): void => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / (height || 1);
    // Slightly adjust camera FOV on narrow portrait mobile screens so lanes remain visible
    if (this.camera.aspect < 0.75) {
      this.camera.fov = 68;
      this.camera.position.set(0, 5.8, 10.5);
    } else {
      this.camera.fov = 58;
      this.camera.position.set(0, 5.2, 9.5);
    }
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
  };

  public setAtmosphereColors(bgColor: number, fogDensity: number, lightIntensity: number): void {
    const col = new THREE.Color(bgColor);
    this.scene.background = col;
    this.fog.color = col;
    this.fog.density = fogDensity;
    this.dirLight.intensity = lightIntensity;
  }

  public render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
  }
}
