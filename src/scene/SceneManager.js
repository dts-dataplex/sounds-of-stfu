/**
 * SceneManager - Main Three.js scene orchestrator
 * Handles rendering loop, camera, lighting, and zone rendering
 */

import * as THREE from 'three';
import { ZONES, FLOOR_HEIGHT } from '../zones/zoneConfig.js';

export class SceneManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.renderer = this.createRenderer();
    this.camera = this.createIsometricCamera();
    this.clock = new THREE.Clock();
    this.zoneMeshes = {};
    this.lights = {};
    this.animationFrameId = null;

    this.init();
  }

  createRenderer() {
    const renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x0a0a0a, 1);
    return renderer;
  }

  createIsometricCamera() {
    // Orthographic camera for true isometric projection
    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 50;

    const camera = new THREE.OrthographicCamera(
      (frustumSize * aspect) / -2, // left
      (frustumSize * aspect) / 2, // right
      frustumSize / 2, // top
      frustumSize / -2, // bottom
      1, // near
      1000 // far
    );

    // Position for 30° downward tilt, 45° horizontal (isometric)
    const distance = 60;
    camera.position.set(
      distance * Math.cos(Math.PI / 4), // X: 45° horizontal
      distance * Math.sin(Math.PI / 6), // Y: 30° elevation
      distance * Math.sin(Math.PI / 4) // Z: 45° horizontal
    );

    // Look at center of bar (24, 0, 18)
    camera.lookAt(24, 0, 18);

    return camera;
  }

  init() {
    // Scene background
    this.scene.background = new THREE.Color(0x0a0a0a);
    this.scene.fog = new THREE.Fog(0x112233, 40, 80);

    // Ambient darkness (cyberpunk aesthetic)
    const ambient = new THREE.AmbientLight(0x112233, 0.2);
    this.scene.add(ambient);

    // Add zone lighting and geometry
    this.renderAllZones();

    // Grid helper for development
    const gridHelper = new THREE.GridHelper(48, 48, 0x444444, 0x222222);
    this.scene.add(gridHelper);

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());
  }

  renderAllZones() {
    Object.entries(ZONES).forEach(([key, zone]) => {
      this.renderZone(key, zone);
      this.addZoneLight(key, zone);
    });
  }

  renderZone(key, zone) {
    const { bounds, color, floor } = zone;

    // Create zone geometry (flat rectangle for Phase 1)
    const geometry = new THREE.PlaneGeometry(bounds.width, bounds.height);

    // Create material with zone color
    const material = new THREE.MeshPhongMaterial({
      color: color,
      side: THREE.DoubleSide,
      emissive: color,
      emissiveIntensity: 0.2,
    });

    // Apply transparency for second floor
    if (floor === 1) {
      material.transparent = true;
      material.opacity = 0.4;
      material.depthWrite = false;
    }

    const mesh = new THREE.Mesh(geometry, material);

    // Position zone
    const centerX = bounds.x + bounds.width / 2;
    const centerZ = bounds.y + bounds.height / 2;
    const y = floor === 1 ? FLOOR_HEIGHT.SECOND : FLOOR_HEIGHT.FIRST;

    mesh.position.set(centerX, y, centerZ);
    mesh.rotation.x = -Math.PI / 2; // Lay flat

    this.scene.add(mesh);
    this.zoneMeshes[key] = mesh;
  }

  addZoneLight(name, zone) {
    // Calculate zone center position
    const centerX = zone.bounds.x + zone.bounds.width / 2;
    const centerY = zone.floor === 1 ? FLOOR_HEIGHT.SECOND + 5 : 5;
    const centerZ = zone.bounds.y + zone.bounds.height / 2;

    const light = new THREE.PointLight(
      zone.lightColor,
      zone.lightIntensity,
      zone.bounds.width * 1.5, // Distance based on zone size
      2 // Decay
    );

    light.position.set(centerX, centerY, centerZ);

    // Add flicker to firepit
    if (name === 'firepit') {
      light.userData.flicker = true;
    }

    this.lights[name] = light;
    this.scene.add(light);
  }

  onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 50;

    this.camera.left = (frustumSize * aspect) / -2;
    this.camera.right = (frustumSize * aspect) / 2;
    this.camera.top = frustumSize / 2;
    this.camera.bottom = frustumSize / -2;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    const time = this.clock.getElapsedTime();

    // Firepit flicker animation
    if (this.lights.firepit && this.lights.firepit.userData.flicker) {
      const flicker = Math.sin(time * 3) * 0.1 + Math.random() * 0.05;
      this.lights.firepit.intensity = 1.0 + flicker;
    }

    // Render scene
    this.renderer.render(this.scene, this.camera);
  }

  start() {
    this.animate();
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}
