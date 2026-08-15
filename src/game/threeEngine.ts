import * as THREE from 'three';
import {
  createPalmTreeMesh,
  createRockMesh,
  createPumpkinPatchMesh,
  createCookingStationMesh,
  createSurvivalCabinMesh,
  createFabricatorMesh,
  createTurretMesh,
  createBarricadeMesh,
  createSpikesMesh,
  createCharacterMesh,
  createEnemyMesh,
  createArrowMesh,
  createInkProjectileMesh,
  createInkSplatterMesh,
} from './entities';
import { TimeOfDay, ResourceType, ToolType, InkProjectile, InkSplatter } from '../types/game';
import { RevealedArea } from './gameLogic';

export interface Floating3DText {
  mesh: THREE.Sprite;
  createdAt: number;
  lifetime: number;
  vy: number;
}

export interface FloatingPickup {
  mesh: THREE.Group;
  resource: ResourceType;
  x: number;
  y: number;
  z: number;
  vy: number;
  createdAt: number;
}

export class IslandThreeEngine {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private container: HTMLElement;

  // Lights
  public sunLight: THREE.DirectionalLight;
  public hemiLight: THREE.HemisphereLight;
  public moonLight: THREE.DirectionalLight;
  public ambientLight: THREE.AmbientLight;

  // Meshes & Entities maps
  public heroGroup: THREE.Group;
  public nodeMeshes: Map<string, THREE.Group> = new Map();
  public structureMeshes: Map<string, THREE.Group> = new Map();
  public enemyMeshes: Map<string, THREE.Group> = new Map();
  public arrowMeshes: Map<string, THREE.Group> = new Map();
  public inkProjectileMeshes: Map<string, THREE.Group> = new Map();
  public inkSplatterMeshes: Map<string, THREE.Mesh> = new Map();
  public floatingTexts: Floating3DText[] = [];
  public floatingPickups: FloatingPickup[] = [];

  // Special structures
  public survivalCabinMesh: THREE.Group | null = null;
  public fabricatorMesh: THREE.Group | null = null;
  public fabricatorBillboard: THREE.Sprite | null = null;
  public cookingStationMesh: THREE.Group | null = null;
  public cookingBillboard: THREE.Sprite | null = null;
  public waterMesh: THREE.Mesh | null = null;

  // Fog of War Dynamic Overlay
  private fogPlane: THREE.Mesh | null = null;
  private fogCanvas: HTMLCanvasElement;
  private fogContext: CanvasRenderingContext2D;
  private fogTexture: THREE.CanvasTexture;

  private clock = new THREE.Clock();
  private animationFrameId: number | null = null;
  private isDestroyed = false;

  // Camera Target
  public targetCameraPos = new THREE.Vector3();

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x89d6fb); // Daylight blue sky

    // Camera setup - Optimized for iPhone 16 portrait and landscape viewports
    const aspect = container.clientWidth / (container.clientHeight || 1);
    const initialFov = aspect < 1.0 ? 52 + Math.min(10, (1 - aspect) * 14) : 42;
    this.camera = new THREE.PerspectiveCamera(initialFov, aspect, 0.1, 1000);
    this.camera.position.set(0, aspect < 1.0 ? 22 : 18, aspect < 1.0 ? 18 : 16);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    container.appendChild(this.renderer.domElement);

    // Lighting setup
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x558833, 0.65);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfffaed, 1.35);
    this.sunLight.position.set(18, 28, 14);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 70;
    const shadowD = 22;
    this.sunLight.shadow.camera.left = -shadowD;
    this.sunLight.shadow.camera.right = shadowD;
    this.sunLight.shadow.camera.top = shadowD;
    this.sunLight.shadow.camera.bottom = -shadowD;
    this.sunLight.shadow.bias = -0.001;
    this.scene.add(this.sunLight);

    this.moonLight = new THREE.DirectionalLight(0x4466aa, 0.0);
    this.moonLight.position.set(-18, 22, -14);
    this.moonLight.castShadow = false;
    this.scene.add(this.moonLight);

    // Build World Terrain
    this.buildTieredIsland();

    // Create Survival Camp Cabin & Fabricator
    this.createSurvivalBase();

    // Create Hero
    this.heroGroup = createCharacterMesh();
    this.heroGroup.position.set(0, 0.8, -3.2);
    this.scene.add(this.heroGroup);

    // Create Cooking Station & Billboard
    this.createCookingStation();

    // Initialize Fog of War dynamic overlay
    this.fogCanvas = document.createElement('canvas');
    this.fogCanvas.width = 256;
    this.fogCanvas.height = 256;
    this.fogContext = this.fogCanvas.getContext('2d')!;
    this.fogTexture = new THREE.CanvasTexture(this.fogCanvas);
    this.fogTexture.minFilter = THREE.LinearFilter;
    this.createFogOfWarMesh();

    // Handle Window Resize
    window.addEventListener('resize', this.onResize);
  }

  private onResize = () => {
    if (this.isDestroyed || !this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) return;
    const aspect = width / height;
    this.camera.aspect = aspect;
    this.camera.fov = aspect < 1.0 ? 52 + Math.min(10, (1 - aspect) * 14) : 42;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public setTimeOfDay(phase: TimeOfDay, progress: number) {
    if (phase === 'day') {
      this.scene.background = new THREE.Color(0x82d0f8);
      this.ambientLight.intensity = 0.5;
      this.hemiLight.intensity = 0.65;
      this.sunLight.intensity = 1.35;
      this.sunLight.color.setHex(0xfffaed);
      this.moonLight.intensity = 0.0;
    } else if (phase === 'sunset') {
      this.scene.background = new THREE.Color(0xf28b5e);
      this.ambientLight.intensity = 0.35;
      this.hemiLight.intensity = 0.45;
      this.sunLight.intensity = 0.9;
      this.sunLight.color.setHex(0xff8844);
      this.moonLight.intensity = 0.2;
    } else if (phase === 'night') {
      this.scene.background = new THREE.Color(0x0a1024);
      this.ambientLight.intensity = 0.15;
      this.hemiLight.intensity = 0.2;
      this.sunLight.intensity = 0.05;
      this.sunLight.color.setHex(0x334466);
      this.moonLight.intensity = 0.6;
      this.moonLight.color.setHex(0x5577bb);
    } else if (phase === 'sunrise') {
      this.scene.background = new THREE.Color(0xf5b28a);
      this.ambientLight.intensity = 0.4;
      this.hemiLight.intensity = 0.5;
      this.sunLight.intensity = 1.1;
      this.sunLight.color.setHex(0xffca7a);
      this.moonLight.intensity = 0.05;
    }
  }

  private buildTieredIsland() {
    const islandGroup = new THREE.Group();

    // Ocean Water
    const waterGeo = new THREE.PlaneGeometry(100, 100, 16, 16);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x36b8e3,
      transparent: true,
      opacity: 0.85,
      roughness: 0.1,
      metalness: 0.1,
    });
    this.waterMesh = new THREE.Mesh(waterGeo, waterMat);
    this.waterMesh.position.y = -0.6;
    islandGroup.add(this.waterMesh);

    // Sand Shoreline
    const sandGeo = new THREE.BoxGeometry(32, 0.8, 36);
    const sandMat = new THREE.MeshStandardMaterial({ color: 0xecd19b, roughness: 0.95 });
    const sandMesh = new THREE.Mesh(sandGeo, sandMat);
    sandMesh.position.y = -0.4;
    sandMesh.receiveShadow = true;
    islandGroup.add(sandMesh);

    // Tier 1 Main Plateau (Lower Green Field)
    const t1Geo = new THREE.BoxGeometry(26, 1.6, 28);
    const t1Mat = new THREE.MeshStandardMaterial({ color: 0x82d93e, roughness: 0.8 });
    const t1Mesh = new THREE.Mesh(t1Geo, t1Mat);
    t1Mesh.position.set(-1, 0, 1);
    t1Mesh.receiveShadow = true;
    t1Mesh.castShadow = true;
    islandGroup.add(t1Mesh);

    // Cliff earth edge skirts
    const cliffMat = new THREE.MeshStandardMaterial({ color: 0xc48757, roughness: 0.9 });
    const cliffFront = new THREE.Mesh(new THREE.BoxGeometry(26.2, 1.4, 0.4), cliffMat);
    cliffFront.position.set(-1, -0.2, 15.1);
    islandGroup.add(cliffFront);

    // Tier 2 High Cliff Plateau (Repositioned to North-West corner, completely clear of Survival Camp)
    const t2Geo = new THREE.BoxGeometry(9.0, 1.2, 8.5);
    const t2Mesh = new THREE.Mesh(t2Geo, t1Mat);
    t2Mesh.position.set(-9.2, 1.4, -9.2);
    t2Mesh.receiveShadow = true;
    t2Mesh.castShadow = true;
    islandGroup.add(t2Mesh);

    // Tier 2 Cliff face skirts
    const t2CliffSouth = new THREE.Mesh(new THREE.BoxGeometry(9.0, 1.2, 0.3), cliffMat);
    t2CliffSouth.position.set(-9.2, 0.8, -4.95);
    islandGroup.add(t2CliffSouth);

    const t2CliffEast = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 8.5), cliffMat);
    t2CliffEast.position.set(-4.7, 0.8, -9.2);
    islandGroup.add(t2CliffEast);

    // Wooden Stairs (South face of the plateau at x = -8.0, climbing up to Tier 2)
    const stairsGroup = new THREE.Group();
    stairsGroup.position.set(-8.0, 0.8, -4.95);
    const plankMat = new THREE.MeshStandardMaterial({ color: 0xaf7643, roughness: 0.7 });

    const numSteps = 6;
    for (let i = 0; i < numSteps; i++) {
      const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.18, 0.4), plankMat);
      stepMesh.position.set(0, (i + 1) * 0.18, (i - 3) * 0.3);
      stepMesh.castShadow = true;
      stepMesh.receiveShadow = true;
      stairsGroup.add(stepMesh);
    }
    const railGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.6, 5);
    railGeo.rotateX(-Math.PI / 5);
    const railL = new THREE.Mesh(railGeo, plankMat);
    railL.position.set(-1.05, 0.65, -0.5);
    const railR = new THREE.Mesh(railGeo, plankMat);
    railR.position.set(1.05, 0.65, -0.5);
    stairsGroup.add(railL);
    stairsGroup.add(railR);
    islandGroup.add(stairsGroup);

    // Decorative coastal boulders
    const decorRock1 = createRockMesh();
    decorRock1.position.set(-11, 0.2, 9);
    decorRock1.scale.set(1.2, 1.2, 1.2);
    islandGroup.add(decorRock1);

    const decorRock2 = createRockMesh();
    decorRock2.position.set(10, 0.2, 7);
    islandGroup.add(decorRock2);

    this.scene.add(islandGroup);
  }

  // --- SURVIVAL CAMP LODGE & FABRICATOR 3D PRINTER ---
  private createSurvivalBase() {
    // 1. Cabin Lodge with 4 walls & Door
    this.survivalCabinMesh = createSurvivalCabinMesh();
    this.survivalCabinMesh.position.set(0, 0.8, -4.5);
    this.scene.add(this.survivalCabinMesh);

    // 2. Futuristic Fabricator 3D Printer inside the cabin
    this.fabricatorMesh = createFabricatorMesh();
    this.fabricatorMesh.position.set(0, 0.8, -5.2);
    this.scene.add(this.fabricatorMesh);

    // 3. In-world Fabricator Billboard
    this.fabricatorBillboard = this.createInWorldSprite('⚡ 3D 万能ファブリケーター', '触れてセーブ / クラフト', '#00f0ff');
    this.fabricatorBillboard.position.set(0, 3.4, -5.2);
    this.scene.add(this.fabricatorBillboard);
  }

  private createCookingStation() {
    this.cookingStationMesh = createCookingStationMesh();
    this.cookingStationMesh.position.set(-4, 0.8, 3);
    this.scene.add(this.cookingStationMesh);

    this.cookingBillboard = this.createInWorldSprite('🍲 焚き火 & 調理鍋', '🎃 5/5 -> 🍲 1', '#ff9900');
    this.cookingBillboard.position.set(-4, 3.0, 3);
    this.scene.add(this.cookingBillboard);
  }

  private createInWorldSprite(title: string, subtitle: string, accentColor: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 140;
    const ctx = canvas.getContext('2d')!;

    // Card background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.roundRect(8, 8, 384, 124, 20);
    ctx.fill();
    ctx.stroke();

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, 200, 52);

    // Subtitle
    ctx.fillStyle = accentColor;
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(subtitle, 200, 96);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(3.2, 1.1, 1);
    return sprite;
  }

  // --- FOG OF WAR (未踏領域の動的マスクメッシュ) ---
  private createFogOfWarMesh() {
    const fogGeo = new THREE.PlaneGeometry(36, 36);
    fogGeo.rotateX(-Math.PI / 2);

    const fogMat = new THREE.MeshBasicMaterial({
      color: 0x090d16,
      transparent: true,
      opacity: 0.86,
      alphaMap: this.fogTexture,
      depthWrite: false,
    });

    this.fogPlane = new THREE.Mesh(fogGeo, fogMat);
    this.fogPlane.position.set(0, 1.25, 0);
    this.scene.add(this.fogPlane);
  }

  public updateFogOfWar(revealedAreas: RevealedArea[]) {
    if (!this.fogContext || !this.fogCanvas) return;
    const ctx = this.fogContext;
    const w = this.fogCanvas.width;
    const h = this.fogCanvas.height;

    // Draw opaque mask
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#ffffff'; // White = fogged/hidden
    ctx.fillRect(0, 0, w, h);

    // Island bounds in world coords: x in [-18, 18], z in [-18, 18]
    // Map world coords (x, z) to canvas pixel coords (px, py)
    ctx.globalCompositeOperation = 'destination-out';

    for (const area of revealedAreas) {
      const cx = ((area.x + 18) / 36) * w;
      const cy = ((area.z + 18) / 36) * h;
      const cr = (area.radius / 36) * w;

      const grad = ctx.createRadialGradient(cx, cy, cr * 0.45, cx, cy, cr);
      grad.addColorStop(0, 'rgba(0, 0, 0, 1)');
      grad.addColorStop(0.8, 'rgba(0, 0, 0, 0.9)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.fill();
    }

    this.fogTexture.needsUpdate = true;
  }

  // --- FLOATING TEXT & REACTION VFX ---
  public spawnFloatingText(text: string, x: number, y: number, z: number, color: string = '#ffffff') {
    const canvas = document.createElement('canvas');
    canvas.width = 280;
    canvas.height = 80;
    const ctx = canvas.getContext('2d')!;

    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Outline
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 5;
    ctx.strokeText(text, 140, 40);

    ctx.fillStyle = color;
    ctx.fillText(text, 140, 40);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.set(x + (Math.random() - 0.5) * 0.4, y + 1.2, z + (Math.random() - 0.5) * 0.4);
    sprite.scale.set(2.2, 0.65, 1);
    this.scene.add(sprite);

    this.floatingTexts.push({
      mesh: sprite,
      createdAt: performance.now(),
      lifetime: 1100,
      vy: 0.035,
    });
  }

  public spawnPickupDrop(resource: ResourceType, x: number, z: number) {
    const g = new THREE.Group();
    let mesh: THREE.Mesh;

    if (resource === 'wood') {
      mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.4, 5), new THREE.MeshStandardMaterial({ color: 0x8a5530 }));
    } else if (resource === 'stone') {
      mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18), new THREE.MeshStandardMaterial({ color: 0x9ca8b5 }));
    } else if (resource === 'leaf') {
      mesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.3), new THREE.MeshStandardMaterial({ color: 0x48bb32 }));
    } else if (resource === 'pumpkin') {
      mesh = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), new THREE.MeshStandardMaterial({ color: 0xff7700 }));
    } else if (resource === 'coconut') {
      mesh = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), new THREE.MeshStandardMaterial({ color: 0x6e4726 }));
    } else {
      mesh = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.25), new THREE.MeshStandardMaterial({ color: 0xffd700 }));
    }

    mesh.castShadow = true;
    g.add(mesh);
    g.position.set(x + (Math.random() - 0.5) * 0.6, 1.0, z + (Math.random() - 0.5) * 0.6);
    this.scene.add(g);

    this.floatingPickups.push({
      mesh: g,
      resource,
      x: g.position.x,
      y: g.position.y,
      z: g.position.z,
      vy: 0.08,
      createdAt: performance.now(),
    });
  }

  // --- SYNC INK PROJECTILES & SPLATTERS ---
  public syncInkProjectiles(projectiles: InkProjectile[]) {
    const currentIds = new Set(projectiles.map(p => p.id));
    for (const [id, mesh] of this.inkProjectileMeshes.entries()) {
      if (!currentIds.has(id)) {
        this.scene.remove(mesh);
        this.inkProjectileMeshes.delete(id);
      }
    }
    for (const p of projectiles) {
      let mesh = this.inkProjectileMeshes.get(p.id);
      if (!mesh) {
        mesh = createInkProjectileMesh(parseInt(p.color.replace('#', '0x'), 16));
        this.scene.add(mesh);
        this.inkProjectileMeshes.set(p.id, mesh);
      }
      mesh.position.set(p.x, p.y, p.z);
    }
  }

  public getTerrainHeight(x: number, z: number): number {
    if (x <= -4.7 && z <= -4.95) {
      return 2.0;
    }
    if (Math.abs(x - (-8.0)) < 1.1 && z >= -4.95 && z <= -3.2) {
      const progress = Math.max(0, Math.min(1, (-3.2 - z) / 1.75));
      return 0.8 + progress * 1.2;
    }
    return 0.8;
  }

  public syncInkSplatters(splatters: InkSplatter[]) {
    const currentIds = new Set(splatters.map(s => s.id));
    for (const [id, mesh] of this.inkSplatterMeshes.entries()) {
      if (!currentIds.has(id)) {
        this.scene.remove(mesh);
        this.inkSplatterMeshes.delete(id);
      }
    }
    for (const s of splatters) {
      let mesh = this.inkSplatterMeshes.get(s.id);
      if (!mesh) {
        mesh = createInkSplatterMesh(parseInt(s.color.replace('#', '0x'), 16), s.radius);
        const y = this.getTerrainHeight(s.x, s.z) + 0.02;
        mesh.position.set(s.x, y, s.z);
        mesh.rotation.y = s.rotation;
        this.scene.add(mesh);
        this.inkSplatterMeshes.set(s.id, mesh);
      }
    }
  }

  // --- SYNC RESOURCE NODES ---
  public syncResourceNodes(nodes: { id: string; type: string; x: number; z: number; isDepleted: boolean }[]) {
    const currentIds = new Set(nodes.map(n => n.id));
    for (const [id, mesh] of this.nodeMeshes.entries()) {
      if (!currentIds.has(id)) {
        this.scene.remove(mesh);
        this.nodeMeshes.delete(id);
      }
    }
    for (const node of nodes) {
      let mesh = this.nodeMeshes.get(node.id);
      if (!mesh) {
        if (node.type === 'tree' || node.type === 'coconut_palm') {
          mesh = createPalmTreeMesh();
        } else if (node.type === 'rock' || node.type === 'iron_ore') {
          mesh = createRockMesh();
        } else {
          mesh = createPumpkinPatchMesh();
        }
        const y = this.getTerrainHeight(node.x, node.z);
        mesh.position.set(node.x, y, node.z);
        this.scene.add(mesh);
        this.nodeMeshes.set(node.id, mesh);
      }
      mesh.visible = !node.isDepleted;
    }
  }

  // --- SYNC PLACED STRUCTURES ---
  public syncStructures(structures: { id: string; type: string; level: number; x: number; z: number }[]) {
    const currentIds = new Set(structures.map(s => s.id));
    for (const [id, mesh] of this.structureMeshes.entries()) {
      if (!currentIds.has(id)) {
        this.scene.remove(mesh);
        this.structureMeshes.delete(id);
      }
    }
    for (const s of structures) {
      if (s.type === 'safehouse' || s.type === 'campfire') continue; // Handled as base models
      let mesh = this.structureMeshes.get(s.id);
      if (!mesh) {
        if (s.type === 'turret') {
          mesh = createTurretMesh();
        } else if (s.type === 'barricade') {
          mesh = createBarricadeMesh();
        } else if (s.type === 'spikes') {
          mesh = createSpikesMesh();
        }
        if (mesh) {
          const y = this.getTerrainHeight(s.x, s.z);
          mesh.position.set(s.x, y, s.z);
          this.scene.add(mesh);
          this.structureMeshes.set(s.id, mesh);
        }
      }
    }
  }

  // --- SYNC ENEMIES ---
  public syncEnemies(enemies: { id: string; type: string; x: number; z: number; hp: number; maxHp: number }[]) {
    const currentIds = new Set(enemies.map(e => e.id));
    for (const [id, mesh] of this.enemyMeshes.entries()) {
      if (!currentIds.has(id)) {
        this.scene.remove(mesh);
        this.enemyMeshes.delete(id);
      }
    }
    for (const enemy of enemies) {
      let mesh = this.enemyMeshes.get(enemy.id);
      if (!mesh) {
        mesh = createEnemyMesh(enemy.type);
        this.scene.add(mesh);
        this.enemyMeshes.set(enemy.id, mesh);
      }
      const y = this.getTerrainHeight(enemy.x, enemy.z);
      mesh.position.set(enemy.x, y, enemy.z);
    }
  }

  // --- SYNC ARROW PROJECTILES ---
  public syncArrows(projectiles: { id: string; x: number; y: number; z: number; targetX: number; targetZ: number }[]) {
    const currentIds = new Set(projectiles.map(p => p.id));
    for (const [id, mesh] of this.arrowMeshes.entries()) {
      if (!currentIds.has(id)) {
        this.scene.remove(mesh);
        this.arrowMeshes.delete(id);
      }
    }
    for (const proj of projectiles) {
      let mesh = this.arrowMeshes.get(proj.id);
      if (!mesh) {
        mesh = createArrowMesh();
        this.scene.add(mesh);
        this.arrowMeshes.set(proj.id, mesh);
      }
      mesh.position.set(proj.x, proj.y, proj.z);
      mesh.lookAt(proj.targetX, proj.y, proj.targetZ);
    }
  }

  // --- CHARACTER ANIMATION ---
  public updateCharacterPose(
    x: number,
    z: number,
    rotationY: number,
    isMoving: boolean,
    isAttacking: boolean,
    equippedTool: ToolType
  ) {
    const heroY = this.getTerrainHeight(x, z);
    this.heroGroup.position.set(x, heroY, z);
    this.heroGroup.rotation.y = rotationY;

    const time = performance.now() * 0.01;
    const userData = this.heroGroup.userData;

    if (isMoving) {
      userData.leftLeg.rotation.x = Math.sin(time) * 0.6;
      userData.rightLeg.rotation.x = -Math.sin(time) * 0.6;
      userData.leftArm.rotation.x = -Math.sin(time) * 0.5;
    } else {
      userData.leftLeg.rotation.x = 0;
      userData.rightLeg.rotation.x = 0;
      userData.leftArm.rotation.x = 0;
    }

    if (isAttacking) {
      userData.rightArm.rotation.x = Math.sin(performance.now() * 0.02) * 1.2;
    } else {
      userData.rightArm.rotation.x = isMoving ? Math.sin(time) * 0.5 : 0;
    }

    const isPortrait = this.camera.aspect < 1.0;
    const camHeight = isPortrait ? 22 : 18;
    const camDist = isPortrait ? 18 : 16;
    this.targetCameraPos.set(x, camHeight, z + camDist);
    this.camera.position.lerp(this.targetCameraPos, 0.08);
    this.camera.lookAt(x, 0.8, z);
  }

  // --- MAIN RENDER LOOP ---
  public render() {
    if (this.isDestroyed) return;

    const delta = this.clock.getDelta();
    const time = performance.now() * 0.001;

    // Ocean water wave animation
    if (this.waterMesh) {
      this.waterMesh.position.y = -0.6 + Math.sin(time * 1.5) * 0.08;
    }

    // Fabricator Holographic 3D Rotation Animation
    if (this.fabricatorMesh && this.fabricatorMesh.userData.holoMesh) {
      this.fabricatorMesh.userData.holoMesh.rotation.y += 0.03;
      this.fabricatorMesh.userData.holoMesh.rotation.x += 0.015;
      if (this.fabricatorMesh.userData.holoInner) {
        this.fabricatorMesh.userData.holoInner.rotation.y -= 0.05;
      }
      if (this.fabricatorMesh.userData.printRing) {
        this.fabricatorMesh.userData.printRing.position.y = 1.1 + Math.sin(time * 3) * 0.12;
      }
    }

    // Campfire flame animation
    if (this.cookingStationMesh && this.cookingStationMesh.userData.flameMesh) {
      const scale = 1 + Math.sin(time * 10) * 0.15;
      this.cookingStationMesh.userData.flameMesh.scale.set(scale, scale * 1.2, scale);
    }

    // Update Floating Texts
    const now = performance.now();
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      const elapsed = now - ft.createdAt;
      if (elapsed > ft.lifetime) {
        this.scene.remove(ft.mesh);
        ft.mesh.material.map?.dispose();
        this.floatingTexts.splice(i, 1);
      } else {
        ft.mesh.position.y += ft.vy;
        (ft.mesh.material as THREE.SpriteMaterial).opacity = 1 - elapsed / ft.lifetime;
      }
    }

    // Update Floating Pickups
    for (let i = this.floatingPickups.length - 1; i >= 0; i--) {
      const p = this.floatingPickups[i];
      p.mesh.rotation.y += 0.04;
      p.mesh.position.y = 0.9 + Math.abs(Math.sin((now - p.createdAt) * 0.005)) * 0.35;
      if (now - p.createdAt > 10000) {
        this.scene.remove(p.mesh);
        this.floatingPickups.splice(i, 1);
      }
    }

    this.renderer.render(this.scene, this.camera);
    this.animationFrameId = requestAnimationFrame(() => this.render());
  }

  public start() {
    this.render();
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onResize);
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
