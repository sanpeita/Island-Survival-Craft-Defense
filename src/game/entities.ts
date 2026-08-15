import * as THREE from 'three';
import { ResourceType, ToolType } from '../types/game';

// Custom materials caching for optimal performance
const materials = {
  grassTop: new THREE.MeshStandardMaterial({ color: 0x82d93e, roughness: 0.8 }),
  cliffEarth: new THREE.MeshStandardMaterial({ color: 0xc48757, roughness: 0.9 }),
  sand: new THREE.MeshStandardMaterial({ color: 0xe6cd9c, roughness: 0.95 }),
  woodBark: new THREE.MeshStandardMaterial({ color: 0x8a5530, roughness: 0.7 }),
  woodPlank: new THREE.MeshStandardMaterial({ color: 0xb57842, roughness: 0.6 }),
  palmLeaf: new THREE.MeshStandardMaterial({ color: 0x48bb32, roughness: 0.5, side: THREE.DoubleSide }),
  palmLeafLight: new THREE.MeshStandardMaterial({ color: 0x6edb4a, roughness: 0.5 }),
  stone: new THREE.MeshStandardMaterial({ color: 0x9ca8b5, roughness: 0.85 }),
  stoneDark: new THREE.MeshStandardMaterial({ color: 0x6e7680, roughness: 0.9 }),
  pumpkinOrange: new THREE.MeshStandardMaterial({ color: 0xff7700, roughness: 0.6 }),
  pumpkinStem: new THREE.MeshStandardMaterial({ color: 0x3d7027 }),
  tilledSoil: new THREE.MeshStandardMaterial({ color: 0x785031, roughness: 0.9 }),
  water: new THREE.MeshStandardMaterial({ color: 0x2bb5d8, transparent: true, opacity: 0.8, roughness: 0.2 }),
  waterFoam: new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }),
  ironMetal: new THREE.MeshStandardMaterial({ color: 0xccd3de, metalness: 0.8, roughness: 0.2 }),
  goldMetal: new THREE.MeshStandardMaterial({ color: 0xffc72b, metalness: 0.7, roughness: 0.3 }),
  cloth: new THREE.MeshStandardMaterial({ color: 0xeae1d0, roughness: 0.9 }),
  charSkin: new THREE.MeshStandardMaterial({ color: 0xf5b78b, roughness: 0.6 }),
  charShirt: new THREE.MeshStandardMaterial({ color: 0x2980b9, roughness: 0.6 }),
  charPants: new THREE.MeshStandardMaterial({ color: 0x34495e, roughness: 0.7 }),
  charHair: new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 0.9 }),
  goblinSkin: new THREE.MeshStandardMaterial({ color: 0x5fa83b, roughness: 0.8 }),
  goblinEye: new THREE.MeshBasicMaterial({ color: 0xff1e1e }),
  skeletonBone: new THREE.MeshStandardMaterial({ color: 0xdedede, roughness: 0.6 }),
  fireGlow: new THREE.MeshBasicMaterial({ color: 0xff6600 }),
  potIron: new THREE.MeshStandardMaterial({ color: 0x222225, metalness: 0.9, roughness: 0.4 }),
  soupStew: new THREE.MeshStandardMaterial({ color: 0xdb6518, roughness: 0.3 }),
  // Futuristic Fabricator materials
  fabricatorMetal: new THREE.MeshStandardMaterial({ color: 0x1a2230, metalness: 0.95, roughness: 0.15 }),
  fabricatorNeon: new THREE.MeshBasicMaterial({ color: 0x00f0ff }),
  fabricatorHolo: new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.7,
    roughness: 0.1,
    metalness: 0.8,
    wireframe: true,
  }),
  safeAreaBarrier: new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide,
  }),
  slimeBody: new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    transparent: true,
    opacity: 0.88,
    roughness: 0.1,
    metalness: 0.2,
  }),
  shadowBeastFur: new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 }),
  shadowBeastGlow: new THREE.MeshBasicMaterial({ color: 0xfacc15 }),
};

// --- SURVIVAL CAMP LODGE (四方が壁と扉で囲まれた中が見える開放型旅小屋 & SafeArea) ---
export function createSurvivalCabinMesh(): THREE.Group {
  const group = new THREE.Group();

  // Cabin dimensions: Width 5.6m, Depth 4.8m, Height 1.9m
  const woodPlankDark = new THREE.MeshStandardMaterial({ color: 0x7c4a27, roughness: 0.7 });
  const woodBeamMat = new THREE.MeshStandardMaterial({ color: 0x543217, roughness: 0.8 });
  const stoneFoundationMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 });
  const fabricMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.8 });
  const pillowMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.9 });
  const rugMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.85 });

  // 1. Stone Foundation Slab
  const floorGeo = new THREE.BoxGeometry(5.8, 0.25, 5.0);
  const floorMesh = new THREE.Mesh(floorGeo, stoneFoundationMat);
  floorMesh.position.y = 0.12;
  floorMesh.receiveShadow = true;
  group.add(floorMesh);

  // Interior Wood Flooring Planks
  const interiorFloor = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.05, 4.6), materials.woodPlank);
  interiorFloor.position.y = 0.26;
  interiorFloor.receiveShadow = true;
  group.add(interiorFloor);

  // Decorative Interior Woven Rug (Center-South)
  const rugGeo = new THREE.BoxGeometry(3.0, 0.02, 2.2);
  const rugMesh = new THREE.Mesh(rugGeo, rugMat);
  rugMesh.position.set(0, 0.28, 0.2);
  rugMesh.receiveShadow = true;
  group.add(rugMesh);

  // 2. Four Corner Timber Beams & Perimeter Top Frame
  const cornerPositions = [
    [-2.7, 1.0, -2.3],
    [2.7, 1.0, -2.3],
    [-2.7, 1.0, 2.3],
    [2.7, 1.0, 2.3],
  ];
  for (const [cx, cy, cz] of cornerPositions) {
    const postGeo = new THREE.BoxGeometry(0.32, 1.8, 0.32);
    const post = new THREE.Mesh(postGeo, woodBeamMat);
    post.position.set(cx, cy, cz);
    post.castShadow = true;
    post.receiveShadow = true;
    group.add(post);
  }

  // Top Perimeter Timber Beams (Defines lodge structure while keeping top-down view clear)
  const beamNorth = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.18, 0.22), woodBeamMat);
  beamNorth.position.set(0, 1.9, -2.3);
  group.add(beamNorth);

  const beamWest = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 4.6), woodBeamMat);
  beamWest.position.set(-2.7, 1.9, 0);
  group.add(beamWest);

  const beamEast = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 4.6), woodBeamMat);
  beamEast.position.set(2.7, 1.9, 0);
  group.add(beamEast);

  const beamSouthL = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.18, 0.22), woodBeamMat);
  beamSouthL.position.set(-1.8, 1.9, 2.3);
  group.add(beamSouthL);

  const beamSouthR = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.18, 0.22), woodBeamMat);
  beamSouthR.position.set(1.8, 1.9, 2.3);
  group.add(beamSouthR);

  // Cross Corner Rafters (Rustic Timber Aesthetics)
  const rafterNW = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 0.12), woodBeamMat);
  rafterNW.position.set(-2.2, 1.9, -1.8);
  rafterNW.rotation.y = Math.PI / 4;
  group.add(rafterNW);

  const rafterNE = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 0.12), woodBeamMat);
  rafterNE.position.set(2.2, 1.9, -1.8);
  rafterNE.rotation.y = -Math.PI / 4;
  group.add(rafterNE);

  // 3. Cutaway Walls (Low profile to allow clear visibility into the cabin interior)
  // North Wall (Back)
  const northWall = new THREE.Mesh(new THREE.BoxGeometry(5.4, 1.2, 0.22), woodPlankDark);
  northWall.position.set(0, 0.85, -2.3);
  northWall.castShadow = true;
  northWall.receiveShadow = true;
  group.add(northWall);

  // East Wall (Right)
  const eastWall = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.1, 4.6), woodPlankDark);
  eastWall.position.set(2.7, 0.8, 0);
  eastWall.castShadow = true;
  eastWall.receiveShadow = true;
  group.add(eastWall);

  // West Wall (Left)
  const westWall = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.1, 4.6), woodPlankDark);
  westWall.position.set(-2.7, 0.8, 0);
  westWall.castShadow = true;
  westWall.receiveShadow = true;
  group.add(westWall);

  // South Wall (Front) - Low waist-high segments leaving wide open doorway
  const southWallL = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 0.22), woodPlankDark);
  southWallL.position.set(-1.8, 0.65, 2.3);
  southWallL.castShadow = true;
  southWallL.receiveShadow = true;
  group.add(southWallL);

  const southWallR = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 0.22), woodPlankDark);
  southWallR.position.set(1.8, 0.65, 2.3);
  southWallR.castShadow = true;
  southWallR.receiveShadow = true;
  group.add(southWallR);

  // 4. Interior Furniture & Survival Gear
  // Survival Bed / Cot (North-West corner)
  const cotBase = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.2, 2.2), woodBeamMat);
  cotBase.position.set(-1.8, 0.38, -1.0);
  cotBase.castShadow = true;
  group.add(cotBase);

  const cotMattress = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.12, 2.0), fabricMat);
  cotMattress.position.set(-1.8, 0.5, -1.0);
  group.add(cotMattress);

  const cotPillow = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.1, 0.5), pillowMat);
  cotPillow.position.set(-1.8, 0.58, -1.7);
  group.add(cotPillow);

  // Supply Storage Crates (North-East corner)
  const crateMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.8 });
  const crate1 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.9), crateMat);
  crate1.position.set(1.8, 0.56, -1.4);
  crate1.castShadow = true;
  group.add(crate1);

  const crate2 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.7), crateMat);
  crate2.position.set(1.85, 1.05, -1.35);
  crate2.rotation.y = 0.25;
  crate2.castShadow = true;
  group.add(crate2);

  // Survival Tool Shelf / Workbench (East Wall)
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 1.6), woodPlankDark);
  shelf.position.set(2.2, 0.6, 0.6);
  shelf.castShadow = true;
  group.add(shelf);

  // Cozy Interior Wall Lantern
  const intLantern = createMiniLantern();
  intLantern.position.set(0, 1.5, -2.1);
  group.add(intLantern);

  const cabinLight = new THREE.PointLight(0xffbe5c, 1.2, 5, 2);
  cabinLight.position.set(0, 1.4, -0.5);
  group.add(cabinLight);

  // Entrance Step
  const stepGeo = new THREE.BoxGeometry(1.8, 0.12, 0.8);
  const stepMesh = new THREE.Mesh(stepGeo, stoneFoundationMat);
  stepMesh.position.set(0, 0.06, 2.7);
  group.add(stepMesh);

  // Warm Cabin Porch Lanterns
  const porchLanternL = createMiniLantern();
  porchLanternL.position.set(-1.0, 1.4, 2.4);
  group.add(porchLanternL);

  const porchLanternR = createMiniLantern();
  porchLanternR.position.set(1.0, 1.4, 2.4);
  group.add(porchLanternR);

  // 5. SafeArea Barrier Perimeter (Subtle glowing protective dome / ring)
  const barrierGeo = new THREE.CylinderGeometry(5.2, 5.2, 2.2, 24, 1, true);
  const barrierMesh = new THREE.Mesh(barrierGeo, materials.safeAreaBarrier);
  barrierMesh.position.y = 1.1;
  group.add(barrierMesh);

  // Floor protective rune ring
  const ringGeo = new THREE.RingGeometry(4.9, 5.2, 32);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMesh = new THREE.Mesh(ringGeo, materials.fabricatorNeon);
  ringMesh.position.y = 0.02;
  group.add(ringMesh);

  group.userData = { type: 'survival_cabin', barrierMesh };
  return group;
}

// --- FUTURISTIC FABRICATOR (未知の未来型万能3Dプリンター & セーブ装置) ---
export function createFabricatorMesh(): THREE.Group {
  const group = new THREE.Group();

  // 1. High-Tech Hexagonal Base Pedestal
  const baseGeo = new THREE.CylinderGeometry(0.85, 0.95, 0.35, 6);
  const baseMesh = new THREE.Mesh(baseGeo, materials.fabricatorMetal);
  baseMesh.position.y = 0.18;
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // Neon Circuit Ring on Base
  const neonRingGeo = new THREE.TorusGeometry(0.7, 0.035, 6, 6);
  neonRingGeo.rotateX(Math.PI / 2);
  const neonRing = new THREE.Mesh(neonRingGeo, materials.fabricatorNeon);
  neonRing.position.y = 0.36;
  group.add(neonRing);

  // 2. Central Core Column
  const coreGeo = new THREE.CylinderGeometry(0.35, 0.45, 0.6, 6);
  const coreMesh = new THREE.Mesh(coreGeo, materials.fabricatorMetal);
  coreMesh.position.y = 0.65;
  coreMesh.castShadow = true;
  group.add(coreMesh);

  // 3. 3D Printing Laser Gantry / Magnetic Floating Ring
  const printRingGeo = new THREE.TorusGeometry(0.55, 0.04, 8, 16);
  printRingGeo.rotateX(Math.PI / 2);
  const printRing = new THREE.Mesh(printRingGeo, materials.fabricatorNeon);
  printRing.position.y = 1.1;
  group.add(printRing);

  // Laser projectors on ring
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const laserEmmiter = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 0.08), materials.fabricatorMetal);
    laserEmmiter.position.set(Math.cos(angle) * 0.55, 1.1, Math.sin(angle) * 0.55);
    group.add(laserEmmiter);
  }

  // 4. Rotating Holographic 3D Object (Holo-Matrix Gear & Cube)
  const holoGeo = new THREE.BoxGeometry(0.38, 0.38, 0.38);
  const holoMesh = new THREE.Mesh(holoGeo, materials.fabricatorHolo);
  holoMesh.position.y = 1.1;
  group.add(holoMesh);

  const holoInner = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), materials.fabricatorNeon);
  holoInner.position.y = 1.1;
  group.add(holoInner);

  // 5. Point Light Emission
  const fabLight = new THREE.PointLight(0x00f0ff, 1.8, 6, 2);
  fabLight.position.set(0, 1.2, 0);
  group.add(fabLight);

  group.userData = {
    type: 'fabricator',
    holoMesh,
    holoInner,
    printRing,
    fabLight,
  };

  return group;
}

// --- INK PROJECTILE & SPLATTERS (スプラトゥーン風インク) ---
export function createInkProjectileMesh(colorHex = 0xec4899): THREE.Group {
  const group = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: colorHex });

  // Main teardrop / sphere ink blob
  const blobGeo = new THREE.SphereGeometry(0.24, 8, 8);
  blobGeo.scale(1, 1, 1.4);
  const blobMesh = new THREE.Mesh(blobGeo, mat);
  group.add(blobMesh);

  // Trailing droplets
  for (let i = 0; i < 2; i++) {
    const dropGeo = new THREE.SphereGeometry(0.08 - i * 0.02, 6, 6);
    const drop = new THREE.Mesh(dropGeo, mat);
    drop.position.set((Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1, -0.25 - i * 0.2);
    group.add(drop);
  }

  return group;
}

export function createInkSplatterMesh(colorHex = 0xec4899, radius = 2.2): THREE.Mesh {
  const splatGeo = new THREE.CircleGeometry(radius, 16);
  splatGeo.rotateX(-Math.PI / 2);
  const splatMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const mesh = new THREE.Mesh(splatGeo, splatMat);
  mesh.position.y = 0.04;
  return mesh;
}

// --- GROUND DROPS (Dropped Items / Monster Loot) ---
export function createGroundDropMesh(resource: ResourceType): THREE.Group {
  const group = new THREE.Group();

  if (resource === 'gold') {
    // Sparkling Gold Ingot / Coin
    const goldGeo = new THREE.BoxGeometry(0.32, 0.22, 0.45);
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x996600,
      emissiveIntensity: 0.35,
    });
    const mesh = new THREE.Mesh(goldGeo, goldMat);
    mesh.castShadow = true;
    group.add(mesh);

    // Glowing spark beacon
    const glowGeo = new THREE.OctahedronGeometry(0.12, 0);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xffea70 });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.y = 0.32;
    group.add(glow);
  } else if (resource === 'gem') {
    // Glowing Island Diamond / Gemstone
    const gemGeo = new THREE.OctahedronGeometry(0.28, 0);
    gemGeo.scale(1, 1.4, 1);
    const gemMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      metalness: 0.8,
      roughness: 0.1,
    });
    const mesh = new THREE.Mesh(gemGeo, gemMat);
    mesh.castShadow = true;
    group.add(mesh);
  } else if (resource === 'iron') {
    // Iron Ingot
    const ironGeo = new THREE.BoxGeometry(0.3, 0.18, 0.45);
    const ironMat = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      metalness: 0.85,
      roughness: 0.3,
    });
    const mesh = new THREE.Mesh(ironGeo, ironMat);
    mesh.castShadow = true;
    group.add(mesh);
  } else if (resource === 'wood') {
    const logGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.45, 5);
    const mesh = new THREE.Mesh(logGeo, materials.woodBark);
    mesh.rotateZ(Math.PI / 2);
    mesh.castShadow = true;
    group.add(mesh);
  } else if (resource === 'stone') {
    const rockGeo = new THREE.DodecahedronGeometry(0.2, 0);
    const mesh = new THREE.Mesh(rockGeo, materials.stone);
    mesh.castShadow = true;
    group.add(mesh);
  } else if (resource === 'leaf') {
    const leafGeo = new THREE.BoxGeometry(0.35, 0.05, 0.35);
    const mesh = new THREE.Mesh(leafGeo, materials.palmLeaf);
    mesh.castShadow = true;
    group.add(mesh);
  } else if (resource === 'pumpkin') {
    const pGeo = new THREE.SphereGeometry(0.22, 6, 6);
    const mesh = new THREE.Mesh(pGeo, materials.pumpkinOrange);
    mesh.castShadow = true;
    group.add(mesh);
  } else if (resource === 'coconut') {
    const cGeo = new THREE.SphereGeometry(0.2, 6, 6);
    const mesh = new THREE.Mesh(cGeo, materials.woodBark);
    mesh.castShadow = true;
    group.add(mesh);
  } else {
    const boxGeo = new THREE.BoxGeometry(0.28, 0.28, 0.28);
    const mesh = new THREE.Mesh(boxGeo, materials.goldMetal);
    mesh.castShadow = true;
    group.add(mesh);
  }

  group.userData = { resource, baseScale: 1 };
  return group;
}

// --- PALM TREE ---
export function createPalmTreeMesh(): THREE.Group {
  const group = new THREE.Group();

  // Curved Trunk segments
  const trunkCurve = new THREE.CurvePath();
  const trunkPoints = 5;
  let currY = 0;
  let currX = 0;
  let currZ = 0;
  const trunkSegments: THREE.Mesh[] = [];

  for (let i = 0; i < trunkPoints; i++) {
    const radiusTop = 0.35 - i * 0.04;
    const radiusBottom = 0.42 - i * 0.04;
    const height = 0.9;
    const segGeo = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 7);
    const segMesh = new THREE.Mesh(segGeo, materials.woodBark);
    segMesh.castShadow = true;
    segMesh.receiveShadow = true;

    segMesh.position.set(currX, currY + height / 2, currZ);
    segMesh.rotation.z = i * 0.08;
    group.add(segMesh);
    trunkSegments.push(segMesh);

    currY += height * 0.88;
    currX += 0.12;
  }

  // Fronds / Palm leaves
  const crown = new THREE.Group();
  crown.position.set(currX, currY, currZ);

  const numFronds = 7;
  for (let i = 0; i < numFronds; i++) {
    const frond = new THREE.Group();
    const angle = (i / numFronds) * Math.PI * 2;
    frond.rotation.y = angle;

    // Leaf blade
    const leafGeo = new THREE.ConeGeometry(0.7, 2.2, 5);
    leafGeo.scale(1, 1, 0.15);
    const leafMesh = new THREE.Mesh(leafGeo, i % 2 === 0 ? materials.palmLeaf : materials.palmLeafLight);
    leafMesh.castShadow = true;
    leafMesh.position.set(0, 0.4, 0.9);
    leafMesh.rotation.x = Math.PI / 3.2;

    frond.add(leafMesh);
    crown.add(frond);
  }

  // Coconuts
  for (let c = 0; c < 3; c++) {
    const cocoGeo = new THREE.SphereGeometry(0.22, 6, 6);
    const cocoMesh = new THREE.Mesh(cocoGeo, materials.woodBark);
    const angle = (c / 3) * Math.PI * 2 + 0.3;
    cocoMesh.position.set(Math.cos(angle) * 0.3, -0.1, Math.sin(angle) * 0.3);
    cocoMesh.castShadow = true;
    crown.add(cocoMesh);
  }

  group.add(crown);
  group.userData = { crown, type: 'tree' };
  return group;
}

// --- BOULDER / ROCK ---
export function createRockMesh(): THREE.Group {
  const group = new THREE.Group();

  const mainGeo = new THREE.DodecahedronGeometry(0.9, 1);
  // Deform slightly for natural stylized look
  const pos = mainGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i) * (0.85 + Math.sin(i * 1.5) * 0.15);
    const vy = pos.getY(i) * 0.75;
    const vz = pos.getZ(i) * (0.85 + Math.cos(i * 1.7) * 0.15);
    pos.setXYZ(i, vx, vy, vz);
  }
  mainGeo.computeVertexNormals();

  const mainMesh = new THREE.Mesh(mainGeo, materials.stone);
  mainMesh.position.y = 0.55;
  mainMesh.castShadow = true;
  mainMesh.receiveShadow = true;
  group.add(mainMesh);

  // Small side rock
  const subGeo = new THREE.DodecahedronGeometry(0.45, 0);
  const subMesh = new THREE.Mesh(subGeo, materials.stoneDark);
  subMesh.position.set(0.6, 0.25, 0.3);
  subMesh.castShadow = true;
  group.add(subMesh);

  group.userData = { type: 'rock', mainMesh };
  return group;
}

// --- PUMPKIN / CROPS ---
export function createPumpkinPatchMesh(): THREE.Group {
  const group = new THREE.Group();

  // Soil mound
  const soilGeo = new THREE.BoxGeometry(1.6, 0.18, 1.6);
  const soilMesh = new THREE.Mesh(soilGeo, materials.tilledSoil);
  soilMesh.position.y = 0.09;
  soilMesh.receiveShadow = true;
  group.add(soilMesh);

  // 2 Pumpkins
  const pumpkin1 = createSinglePumpkin();
  pumpkin1.position.set(-0.35, 0.18, -0.3);
  group.add(pumpkin1);

  const pumpkin2 = createSinglePumpkin();
  pumpkin2.position.set(0.35, 0.18, 0.25);
  pumpkin2.scale.set(0.85, 0.85, 0.85);
  group.add(pumpkin2);

  // Green leaves/vines
  for (let i = 0; i < 4; i++) {
    const leafGeo = new THREE.BoxGeometry(0.3, 0.05, 0.3);
    const leafMesh = new THREE.Mesh(leafGeo, materials.palmLeaf);
    const angle = (i / 4) * Math.PI * 2;
    leafMesh.position.set(Math.cos(angle) * 0.5, 0.18, Math.sin(angle) * 0.5);
    leafMesh.rotation.y = angle;
    group.add(leafMesh);
  }

  group.userData = { type: 'pumpkin', pumpkins: [pumpkin1, pumpkin2] };
  return group;
}

function createSinglePumpkin(): THREE.Group {
  const pGroup = new THREE.Group();
  const pGeo = new THREE.SphereGeometry(0.35, 8, 6);
  pGeo.scale(1.2, 0.9, 1.2);
  const pMesh = new THREE.Mesh(pGeo, materials.pumpkinOrange);
  pMesh.position.y = 0.25;
  pMesh.castShadow = true;
  pGroup.add(pMesh);

  // Stem
  const stemGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.18, 5);
  const stemMesh = new THREE.Mesh(stemGeo, materials.pumpkinStem);
  stemMesh.position.set(0, 0.55, 0);
  stemMesh.rotation.z = 0.2;
  pGroup.add(stemMesh);

  return pGroup;
}

// --- CAMPFIRE & COOKING POT ---
export function createCookingStationMesh(): THREE.Group {
  const group = new THREE.Group();

  // Stone ring
  const ringGeo = new THREE.TorusGeometry(0.6, 0.12, 5, 8);
  ringGeo.rotateX(Math.PI / 2);
  const ringMesh = new THREE.Mesh(ringGeo, materials.stoneDark);
  ringMesh.position.y = 0.1;
  ringMesh.castShadow = true;
  group.add(ringMesh);

  // Log supports / tripod
  for (let i = 0; i < 3; i++) {
    const stickGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.6, 5);
    const stickMesh = new THREE.Mesh(stickGeo, materials.woodBark);
    const angle = (i / 3) * Math.PI * 2;
    stickMesh.position.set(Math.cos(angle) * 0.45, 0.75, Math.sin(angle) * 0.45);
    stickMesh.rotation.x = -Math.sin(angle) * 0.35;
    stickMesh.rotation.z = Math.cos(angle) * 0.35;
    stickMesh.castShadow = true;
    group.add(stickMesh);
  }

  // Iron Hanging Pot
  const potGeo = new THREE.SphereGeometry(0.35, 8, 8);
  potGeo.scale(1, 0.7, 1);
  const potMesh = new THREE.Mesh(potGeo, materials.potIron);
  potMesh.position.set(0, 0.65, 0);
  potMesh.castShadow = true;
  group.add(potMesh);

  // Stew surface
  const stewGeo = new THREE.CircleGeometry(0.32, 8);
  stewGeo.rotateX(-Math.PI / 2);
  const stewMesh = new THREE.Mesh(stewGeo, materials.soupStew);
  stewMesh.position.set(0, 0.8, 0);
  group.add(stewMesh);

  // Fire flame (animated)
  const flameGeo = new THREE.ConeGeometry(0.25, 0.5, 6);
  const flameMesh = new THREE.Mesh(flameGeo, materials.fireGlow);
  flameMesh.position.set(0, 0.25, 0);
  group.add(flameMesh);

  // Point Light for campfire illumination
  const light = new THREE.PointLight(0xff7722, 2, 8, 2);
  light.position.set(0, 0.8, 0);
  group.add(light);

  // Tree stump nearby for chopping/cooking prep table
  const stumpGeo = new THREE.CylinderGeometry(0.4, 0.45, 0.5, 7);
  const stumpMesh = new THREE.Mesh(stumpGeo, materials.woodPlank);
  stumpMesh.position.set(1.1, 0.25, 0);
  stumpMesh.castShadow = true;
  group.add(stumpMesh);

  group.userData = { flameMesh, light, type: 'campfire' };
  return group;
}

// --- SAFEHOUSE SHELTER (TIER 1 - 4) ---
export function createSafehouseMesh(level: number): THREE.Group {
  const group = new THREE.Group();

  if (level === 1) {
    // Canvas Survivor Tent
    const tentGeo = new THREE.ConeGeometry(1.8, 2.0, 4);
    tentGeo.rotateY(Math.PI / 4);
    const tentMesh = new THREE.Mesh(tentGeo, materials.cloth);
    tentMesh.position.y = 1.0;
    tentMesh.castShadow = true;
    tentMesh.receiveShadow = true;
    group.add(tentMesh);

    // Ridge pole
    const poleGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.4, 6);
    poleGeo.rotateX(Math.PI / 2);
    const poleMesh = new THREE.Mesh(poleGeo, materials.woodBark);
    poleMesh.position.set(0, 1.8, 0);
    group.add(poleMesh);

    // Warm lantern hanging at entrance
    const lantern = createMiniLantern();
    lantern.position.set(0, 1.2, 1.1);
    group.add(lantern);
  } else if (level === 2) {
    // Sturdy Log Cabin
    const baseGeo = new THREE.BoxGeometry(3.0, 1.8, 2.6);
    const baseMesh = new THREE.Mesh(baseGeo, materials.woodPlank);
    baseMesh.position.y = 0.9;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    group.add(baseMesh);

    // Roof
    const roofGeo = new THREE.ConeGeometry(2.5, 1.4, 4);
    roofGeo.rotateY(Math.PI / 4);
    const roofMesh = new THREE.Mesh(roofGeo, materials.palmLeaf);
    roofMesh.position.y = 2.4;
    roofMesh.scale.set(1.1, 1, 1.3);
    roofMesh.castShadow = true;
    group.add(roofMesh);

    // Chimney & Porch
    const porchGeo = new THREE.BoxGeometry(1.2, 0.15, 0.8);
    const porchMesh = new THREE.Mesh(porchGeo, materials.woodBark);
    porchMesh.position.set(0, 0.08, 1.5);
    group.add(porchMesh);

    const lantern = createMiniLantern();
    lantern.position.set(0.9, 1.4, 1.35);
    group.add(lantern);
  } else {
    // Fortified Stone Bunker / Citadel
    const baseGeo = new THREE.BoxGeometry(3.6, 2.4, 3.2);
    const baseMesh = new THREE.Mesh(baseGeo, materials.stone);
    baseMesh.position.y = 1.2;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    group.add(baseMesh);

    // Crenelated battlements
    for (let x = -1.6; x <= 1.6; x += 0.8) {
      const merlon = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.3), materials.stoneDark);
      merlon.position.set(x, 2.6, 1.6);
      merlon.castShadow = true;
      group.add(merlon);

      const merlonBack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.3), materials.stoneDark);
      merlonBack.position.set(x, 2.6, -1.6);
      merlonBack.castShadow = true;
      group.add(merlonBack);
    }

    // Iron gate & torch lights
    const gateGeo = new THREE.BoxGeometry(1.2, 1.6, 0.2);
    const gateMesh = new THREE.Mesh(gateGeo, materials.ironMetal);
    gateMesh.position.set(0, 0.8, 1.62);
    group.add(gateMesh);

    const l1 = createMiniLantern();
    l1.position.set(-1.0, 1.8, 1.65);
    const l2 = createMiniLantern();
    l2.position.set(1.0, 1.8, 1.65);
    group.add(l1);
    group.add(l2);
  }

  group.userData = { type: 'safehouse', level };
  return group;
}

function createMiniLantern(): THREE.Group {
  const g = new THREE.Group();
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.2), materials.goldMetal);
  g.add(mesh);
  const glow = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), materials.fireGlow);
  g.add(glow);
  const light = new THREE.PointLight(0xffaa33, 1.2, 6, 2);
  g.add(light);
  return g;
}

// --- DEFENSE STRUCTURES (TURRET, 7DTD-STYLE OMNIDIRECTIONAL BARRICADE, SPIKES, LANTERN) ---
export function createTurretMesh(): THREE.Group {
  const group = new THREE.Group();

  // Stone base pedestal (Omnidirectional pyramid foundation)
  const baseGeo = new THREE.CylinderGeometry(0.55, 0.75, 0.7, 6);
  const baseMesh = new THREE.Mesh(baseGeo, materials.stone);
  baseMesh.position.y = 0.35;
  baseMesh.castShadow = true;
  group.add(baseMesh);

  // Rotating Crossbow Mount
  const mount = new THREE.Group();
  mount.position.y = 0.75;

  const swivelGeo = new THREE.BoxGeometry(0.38, 0.28, 0.65);
  const swivelMesh = new THREE.Mesh(swivelGeo, materials.woodPlank);
  swivelMesh.castShadow = true;
  mount.add(swivelMesh);

  // Bow arms
  const bowArmGeo = new THREE.BoxGeometry(1.5, 0.12, 0.14);
  const bowArmMesh = new THREE.Mesh(bowArmGeo, materials.ironMetal);
  bowArmMesh.position.set(0, 0.15, 0.22);
  mount.add(bowArmMesh);

  // Arrow on rail
  const arrowGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.75, 4);
  arrowGeo.rotateX(Math.PI / 2);
  const arrowMesh = new THREE.Mesh(arrowGeo, materials.woodBark);
  arrowMesh.position.set(0, 0.18, 0.1);
  mount.add(arrowMesh);

  group.add(mount);
  group.userData = { mount, type: 'turret' };
  return group;
}

// 7 Days to Die (7DTD) スタイルの「全方位対応・木造クロススパイクバリケード」
// どの方向から見ても・どの角度で設置しても、均等に外側へトゲが突き出ている防衛障害物
export function createBarricadeMesh(): THREE.Group {
  const group = new THREE.Group();

  // 1. Square base cross foundation (土台クロスフレーム)
  const base1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.14, 0.22), materials.woodBark);
  base1.position.y = 0.07;
  base1.castShadow = true;
  group.add(base1);

  const base2 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 1.6), materials.woodBark);
  base2.position.y = 0.07;
  base2.castShadow = true;
  group.add(base2);

  // Diagonal base supports
  const baseD1 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 0.16), materials.woodBark);
  baseD1.position.y = 0.06;
  baseD1.rotation.y = Math.PI / 4;
  group.add(baseD1);

  const baseD2 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 0.16), materials.woodBark);
  baseD2.position.y = 0.06;
  baseD2.rotation.y = -Math.PI / 4;
  group.add(baseD2);

  // 2. Central Stout Core Pillar (中央結束支柱)
  const centerPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.95, 6), materials.woodPlank);
  centerPillar.position.y = 0.48;
  centerPillar.castShadow = true;
  group.add(centerPillar);

  // Heavy Iron / Rope Binding Ring
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.04, 6, 8), materials.ironMetal);
  ring1.rotateX(Math.PI / 2);
  ring1.position.y = 0.35;
  group.add(ring1);

  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.035, 6, 8), materials.ironMetal);
  ring2.rotateX(Math.PI / 2);
  ring2.position.y = 0.65;
  group.add(ring2);

  // 3. 4-Way & Diagonal Spikes radiating outwards (4方位 + 斜め4方向へ突き出た鋭利なスパイク杭)
  // 4 Main Orthogonal Heavy Spikes (傾斜角約50度で外側に突き出す)
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    const spikeGroup = new THREE.Group();
    spikeGroup.position.set(0, 0.38, 0);
    spikeGroup.rotation.y = angle;

    // Log shaft
    const shaftGeo = new THREE.CylinderGeometry(0.09, 0.13, 1.25, 5);
    const shaft = new THREE.Mesh(shaftGeo, materials.woodPlank);
    shaft.position.set(0, 0.4, 0.35);
    shaft.rotation.x = 0.65; // Tilt outward
    shaft.castShadow = true;
    spikeGroup.add(shaft);

    // Sharpened cone spike tip
    const tipGeo = new THREE.ConeGeometry(0.09, 0.45, 5);
    const tip = new THREE.Mesh(tipGeo, materials.woodBark);
    tip.position.set(0, 0.82, 0.62);
    tip.rotation.x = 0.65;
    tip.castShadow = true;
    spikeGroup.add(tip);

    group.add(spikeGroup);
  }

  // 4 Diagonal Secondary Spikes (低角で足元を狙うスパイク)
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 + Math.PI / 4;
    const spikeGroup = new THREE.Group();
    spikeGroup.position.set(0, 0.22, 0);
    spikeGroup.rotation.y = angle;

    const shaftGeo = new THREE.CylinderGeometry(0.06, 0.09, 0.9, 5);
    const shaft = new THREE.Mesh(shaftGeo, materials.woodPlank);
    shaft.position.set(0, 0.25, 0.3);
    shaft.rotation.x = 0.85; // Low tilt
    shaft.castShadow = true;
    spikeGroup.add(shaft);

    const tipGeo = new THREE.ConeGeometry(0.06, 0.35, 5);
    const tip = new THREE.Mesh(tipGeo, materials.stoneDark);
    tip.position.set(0, 0.55, 0.52);
    tip.rotation.x = 0.85;
    tip.castShadow = true;
    spikeGroup.add(tip);

    group.add(spikeGroup);
  }

  group.userData = { type: 'barricade' };
  return group;
}

export function createSpikesMesh(): THREE.Group {
  const group = new THREE.Group();

  const baseGeo = new THREE.BoxGeometry(1.6, 0.08, 1.6);
  const baseMesh = new THREE.Mesh(baseGeo, materials.woodBark);
  baseMesh.position.y = 0.04;
  group.add(baseMesh);

  // Cross brace planks
  const brace1 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.05, 0.2), materials.woodPlank);
  brace1.position.y = 0.08;
  group.add(brace1);
  const brace2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 1.5), materials.woodPlank);
  brace2.position.y = 0.08;
  group.add(brace2);

  // Sharp omnidirectional caltrop spikes (9 positions)
  const coords = [-0.5, 0, 0.5];
  for (const x of coords) {
    for (const z of coords) {
      const spikeGeo = new THREE.ConeGeometry(0.08, 0.65, 5);
      const spikeMesh = new THREE.Mesh(spikeGeo, materials.stoneDark);
      spikeMesh.position.set(x + (Math.random() - 0.5) * 0.08, 0.38, z + (Math.random() - 0.5) * 0.08);
      // Slight random tilt in all directions
      spikeMesh.rotation.x = (Math.random() - 0.5) * 0.35;
      spikeMesh.rotation.z = (Math.random() - 0.5) * 0.35;
      spikeMesh.castShadow = true;
      group.add(spikeMesh);
    }
  }

  group.userData = { type: 'spikes' };
  return group;
}

export function createFlameLanternMesh(): THREE.Group {
  const group = new THREE.Group();

  // Stone base pedestal
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.3, 6), materials.stone);
  base.position.y = 0.15;
  base.castShadow = true;
  group.add(base);

  // Wood post
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.6, 6), materials.woodBark);
  post.position.y = 0.95;
  post.castShadow = true;
  group.add(post);

  // Top Lantern brazier
  const brazier = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.15, 0.35, 6), materials.ironMetal);
  brazier.position.y = 1.75;
  group.add(brazier);

  // Magical Sacred Fire Flame
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.45, 6), materials.fireGlow);
  flame.position.y = 1.95;
  group.add(flame);

  // Omni Point Light
  const light = new THREE.PointLight(0xffaa22, 2.0, 10, 2);
  light.position.y = 2.0;
  group.add(light);

  group.userData = { type: 'lantern', light };
  return group;
}

// --- HERO CHARACTER (Animated Legs/Arms + Tool) ---
export function createCharacterMesh(): THREE.Group {
  const hero = new THREE.Group();

  // Torso
  const bodyGeo = new THREE.BoxGeometry(0.55, 0.65, 0.35);
  const bodyMesh = new THREE.Mesh(bodyGeo, materials.charShirt);
  bodyMesh.position.y = 0.85;
  bodyMesh.castShadow = true;
  hero.add(bodyMesh);

  // Head
  const headGeo = new THREE.BoxGeometry(0.45, 0.45, 0.45);
  const headMesh = new THREE.Mesh(headGeo, materials.charSkin);
  headMesh.position.y = 1.42;
  headMesh.castShadow = true;
  hero.add(headMesh);

  // Hair
  const hairGeo = new THREE.BoxGeometry(0.48, 0.2, 0.48);
  const hairMesh = new THREE.Mesh(hairGeo, materials.charHair);
  hairMesh.position.set(0, 1.6, -0.02);
  hero.add(hairMesh);

  // Left Leg & Right Leg
  const legGeo = new THREE.BoxGeometry(0.22, 0.55, 0.24);
  const leftLeg = new THREE.Mesh(legGeo, materials.charPants);
  leftLeg.position.set(-0.16, 0.28, 0);
  leftLeg.castShadow = true;
  hero.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, materials.charPants);
  rightLeg.position.set(0.16, 0.28, 0);
  rightLeg.castShadow = true;
  hero.add(rightLeg);

  // Arms
  const armGeo = new THREE.BoxGeometry(0.18, 0.55, 0.2);
  const leftArm = new THREE.Mesh(armGeo, materials.charShirt);
  leftArm.position.set(-0.4, 0.85, 0);
  leftArm.castShadow = true;
  hero.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.4, 1.05, 0);
  const rightArmMesh = new THREE.Mesh(armGeo, materials.charShirt);
  rightArmMesh.position.y = -0.2;
  rightArmMesh.castShadow = true;
  rightArm.add(rightArmMesh);

  // Tool / Weapon in right hand
  const toolGroup = new THREE.Group();
  toolGroup.position.set(0, -0.4, 0.2);
  toolGroup.rotation.x = Math.PI / 3;

  // Default Axe
  const handleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 5);
  const handleMesh = new THREE.Mesh(handleGeo, materials.woodBark);
  toolGroup.add(handleMesh);

  const bladeGeo = new THREE.BoxGeometry(0.1, 0.35, 0.25);
  const bladeMesh = new THREE.Mesh(bladeGeo, materials.ironMetal);
  bladeMesh.position.set(0, 0.3, 0.1);
  toolGroup.add(bladeMesh);

  rightArm.add(toolGroup);
  hero.add(rightArm);

  hero.userData = {
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    toolGroup,
    bladeMesh,
  };

  return hero;
}

// --- MONSTERS (Goblin, Skeleton, Shadow Beast, Boss Golem, Poison Slime) ---
export function createEnemyMesh(type: string): THREE.Group {
  const enemy = new THREE.Group();

  if (type === 'goblin') {
    // Green island goblin
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.5, 0.3), materials.goblinSkin);
    body.position.y = 0.55;
    body.castShadow = true;
    enemy.add(body);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.38, 0.4), materials.goblinSkin);
    head.position.y = 0.95;
    head.castShadow = true;
    enemy.add(head);

    // Glowing eyes
    const eye1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), materials.goblinEye);
    eye1.position.set(-0.12, 0.98, 0.2);
    const eye2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), materials.goblinEye);
    eye2.position.set(0.12, 0.98, 0.2);
    enemy.add(eye1);
    enemy.add(eye2);

    // Club
    const club = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, 0.7, 5), materials.woodBark);
    club.position.set(0.35, 0.6, 0.2);
    club.rotation.x = Math.PI / 4;
    enemy.add(club);
  } else if (type === 'skeleton') {
    // Pale skeleton raider with bone sword
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.6, 0.25), materials.skeletonBone);
    body.position.y = 0.65;
    body.castShadow = true;
    enemy.add(body);

    const skull = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.38), materials.skeletonBone);
    skull.position.y = 1.1;
    skull.castShadow = true;
    enemy.add(skull);

    // Glowing eye sockets
    const eye1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), materials.fireGlow);
    eye1.position.set(-0.1, 1.1, 0.19);
    const eye2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), materials.fireGlow);
    eye2.position.set(0.1, 1.1, 0.19);
    enemy.add(eye1);
    enemy.add(eye2);
  } else if (type === 'poison_slime') {
    // Bouncing Green/Toxic Slime Droplet
    const slimeGeo = new THREE.SphereGeometry(0.48, 8, 8);
    slimeGeo.scale(1.2, 0.9, 1.1);
    const body = new THREE.Mesh(slimeGeo, materials.slimeBody);
    body.position.y = 0.4;
    body.castShadow = true;
    enemy.add(body);

    // Cute/Angry eye bubbles
    const eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), materials.goblinEye);
    eye1.position.set(-0.16, 0.48, 0.38);
    const eye2 = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), materials.goblinEye);
    eye2.position.set(0.16, 0.48, 0.38);
    enemy.add(eye1);
    enemy.add(eye2);

    // Toxic glow bubble inside
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), materials.fabricatorNeon);
    core.position.y = 0.38;
    enemy.add(core);
  } else if (type === 'shadow_beast') {
    // Dark quadrupedal panther-like beast with glowing yellow eyes
    const bodyGeo = new THREE.BoxGeometry(0.55, 0.45, 0.95);
    const body = new THREE.Mesh(bodyGeo, materials.shadowBeastFur);
    body.position.y = 0.55;
    body.castShadow = true;
    enemy.add(body);

    const headGeo = new THREE.BoxGeometry(0.38, 0.35, 0.4);
    const head = new THREE.Mesh(headGeo, materials.shadowBeastFur);
    head.position.set(0, 0.75, 0.5);
    head.castShadow = true;
    enemy.add(head);

    // Glowing predator eyes
    const eye1 = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.07), materials.shadowBeastGlow);
    eye1.position.set(-0.11, 0.8, 0.68);
    const eye2 = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.07), materials.shadowBeastGlow);
    eye2.position.set(0.11, 0.8, 0.68);
    enemy.add(eye1);
    enemy.add(eye2);

    // 4 legs
    for (const [lx, lz] of [[-0.22, -0.3], [0.22, -0.3], [-0.22, 0.3], [0.22, 0.3]]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.4, 0.14), materials.shadowBeastFur);
      leg.position.set(lx, 0.2, lz);
      leg.castShadow = true;
      enemy.add(leg);
    }
  } else {
    // Boss Golem (Night 3+ Titan Boss)
    const body = new THREE.Mesh(new THREE.DodecahedronGeometry(0.9, 1), materials.stoneDark);
    body.position.y = 1.2;
    body.castShadow = true;
    enemy.add(body);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.6), materials.stone);
    head.position.y = 2.0;
    head.castShadow = true;
    enemy.add(head);

    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.1), materials.goblinEye);
    eye.position.set(0, 2.0, 0.32);
    enemy.add(eye);

    // Glowing core crystal
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.3, 0), materials.fireGlow);
    crystal.position.set(0, 1.2, 0.7);
    enemy.add(crystal);

    enemy.scale.set(1.45, 1.45, 1.45);
  }

  enemy.userData = { type };
  return enemy;
}

// --- PROJECTILE (Arrow) ---
export function createArrowMesh(): THREE.Group {
  const arrow = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 4), materials.woodBark);
  shaft.rotateX(Math.PI / 2);
  arrow.add(shaft);

  const head = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 4), materials.ironMetal);
  head.position.z = 0.45;
  head.rotateX(Math.PI / 2);
  arrow.add(head);

  return arrow;
}
