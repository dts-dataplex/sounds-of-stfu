// Three.js Scene Setup - Isometric Chatsubo Bar
import * as THREE from 'three';
import { ZONES } from './zones.js';

export class ChatsuboScene {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = null;
    this.renderer = null;
    this.zoneMeshes = [];
    this.avatars = new Map();

    this.init();
  }

  init() {
    // Isometric camera setup (45° horizontal, 30° downward tilt)
    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 60;

    this.camera = new THREE.OrthographicCamera(
      frustumSize * aspect / -2,
      frustumSize * aspect / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.1,
      1000
    );

    // Position camera for isometric view
    this.camera.position.set(30, 25, 30);
    this.camera.lookAt(0, 0, 0);

    // Renderer with dark background
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0x0a0a0a); // Dark cyberpunk background
    this.container.appendChild(this.renderer.domElement);

    // Ambient light (dim)
    const ambient = new THREE.AmbientLight(0x404040, 0.3);
    this.scene.add(ambient);

    // Create floor
    const floorGeometry = new THREE.PlaneGeometry(60, 60);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.8,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.1;
    this.scene.add(floor);

    // Create zones
    this.createZones();

    // Window resize handler
    window.addEventListener('resize', () => this.onWindowResize());
  }

  createZones() {
    ZONES.forEach(zone => {
      // Zone floor
      const geometry = new THREE.BoxGeometry(zone.size.x, 0.2, zone.size.y);
      const material = new THREE.MeshStandardMaterial({
        color: zone.color,
        emissive: zone.color,
        emissiveIntensity: 0.3,
        roughness: 0.7,
        metalness: 0.3,
      });
      const zoneMesh = new THREE.Mesh(geometry, material);
      zoneMesh.position.set(zone.position.x, 0, zone.position.z);
      zoneMesh.userData = { zone };
      this.scene.add(zoneMesh);
      this.zoneMeshes.push(zoneMesh);

      // Point light for neon glow
      const light = new THREE.PointLight(zone.lightColor, zone.lightIntensity, 30);
      light.position.set(zone.position.x, 5, zone.position.z);
      this.scene.add(light);

      // Zone label (optional, for debugging)
      if (false) { // Set to true to see zone names
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 128;
        ctx.fillStyle = '#ffffff';
        ctx.font = '48px monospace';
        ctx.fillText(zone.name, 10, 64);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.set(zone.position.x, 8, zone.position.z);
        sprite.scale.set(8, 2, 1);
        this.scene.add(sprite);
      }
    });
  }

  createAvatar(id, position, color = 0x00ff00) {
    const geometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 16);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.5,
    });
    const avatar = new THREE.Mesh(geometry, material);
    avatar.position.set(position.x, 1, position.z);

    // Add glow
    const glowGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.3,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.y = 0.5;
    avatar.add(glow);

    this.scene.add(avatar);
    this.avatars.set(id, avatar);
    return avatar;
  }

  updateAvatarPosition(id, position) {
    const avatar = this.avatars.get(id);
    if (avatar) {
      avatar.position.x = position.x;
      avatar.position.z = position.z;
    }
  }

  removeAvatar(id) {
    const avatar = this.avatars.get(id);
    if (avatar) {
      this.scene.remove(avatar);
      this.avatars.delete(id);
    }
  }

  getClickPosition(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera({ x, y }, this.camera);

    // Raycast against a ground plane
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const target = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, target);

    return target ? { x: target.x, z: target.z } : null;
  }

  onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 60;

    this.camera.left = frustumSize * aspect / -2;
    this.camera.right = frustumSize * aspect / 2;
    this.camera.top = frustumSize / 2;
    this.camera.bottom = frustumSize / -2;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.render();
  }
}
