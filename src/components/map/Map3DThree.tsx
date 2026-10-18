import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  Layers,
  Compass,
  Sun,
  Maximize2,
  Sliders,
  Info,
  CheckCircle2,
  Eye,
  RotateCcw,
  Mountain,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { store } from '../../services/store';
import { Dataset, SpatialFeature } from '../../types';
import { LEBAK_KECAMATAN_DATA } from '../../data/administrativeRegions';

// Map geographic bounds for Kabupaten Lebak
// Center: ~ -6.55, 106.25
const LEBAK_CENTER = { lat: -6.55, lng: 106.25 };
const SCALE_X = 140; // coordinates to 3D world units
const SCALE_Z = 140;

function geoTo3D(lat: number, lng: number, elevation: number = 0, exaggeration: number = 1.0): THREE.Vector3 {
  const x = (lng - LEBAK_CENTER.lng) * SCALE_X;
  const z = -(lat - LEBAK_CENTER.lat) * SCALE_Z; // Flip Y for Three.js Z
  const y = (elevation / 100) * exaggeration;
  return new THREE.Vector3(x, y, z);
}

// Procedural elevation approximation based on authentic Lebak geography
function getLebakElevation(lat: number, lng: number): number {
  // Distance from Mount Halimun Salak peak in South-East Lebak (~ -6.75, 106.45)
  const dHalimun = Math.hypot(lat - (-6.75), lng - 106.45);
  // Distance from Gunung Karang / Pandeglang border in North-West
  const dNorth = Math.hypot(lat - (-6.30), lng - 106.20);
  // Distance from South Coast (Bayah / Sawarna / Cihara: lat < -6.85)
  const isCoast = lat < -6.85;

  let baseElev = 50; // default plain (Rangkasbitung ~30-50m)

  // Halimun mountain range & Cibeber / Lebakgedong / Citorek (peaks up to 1200-1800m)
  if (dHalimun < 0.45) {
    baseElev += (1 - dHalimun / 0.45) * 1150;
  }

  // Central rolling hills: Leuwidamar (Baduy), Bojongmanik, Gunungkencana (~250-500m)
  const dCenter = Math.hypot(lat - (-6.55), lng - 106.22);
  if (dCenter < 0.35) {
    baseElev += (1 - dCenter / 0.35) * 420;
  }

  // South coast drop
  if (isCoast) {
    const coastalFactor = Math.max(0, (lat - (-6.98)) / 0.13);
    baseElev = Math.min(baseElev, coastalFactor * 120);
  }

  // Add subtle terrain ridge noise
  const noise = Math.sin(lat * 80) * Math.cos(lng * 80) * 45 + Math.sin(lat * 150 + lng * 150) * 20;

  return Math.max(2, baseElev + noise);
}

interface Map3DThreeProps {
  onSelectFeature?: (feature: SpatialFeature) => void;
  onSwitchTo2D?: () => void;
}

export const Map3DThree: React.FC<Map3DThreeProps> = ({ onSelectFeature, onSwitchTo2D }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const featureMeshesRef = useRef<Map<string, THREE.Object3D>>(new Map());
  const hoveredMeshRef = useRef<THREE.Object3D | null>(null);

  // Reusable vectors for animation/raycasting without GC
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const mouse = useMemo(() => new THREE.Vector2(), []);

  // UI States
  const [verticalExaggeration, setVerticalExaggeration] = useState<number>(2.0);
  const [sunAngle, setSunAngle] = useState<number>(45);
  const [wireframe, setWireframe] = useState<boolean>(false);
  const [showPOIs, setShowPOIs] = useState<boolean>(true);
  const [showRivers, setShowRivers] = useState<boolean>(true);
  const [showCustomaryZone, setShowCustomaryZone] = useState<boolean>(true);
  const [selectedFeature, setSelectedFeature] = useState<SpatialFeature | null>(null);
  const [cameraPreset, setCameraPreset] = useState<'default' | 'baduy' | 'halimun' | 'coast' | 'top'>('default');
  const [isHudCollapsed, setIsHudCollapsed] = useState<boolean>(false);

  const datasets = store.getDatasets();
  const features = store.getFeatures();

  // Create procedural satellite & topographic canvas texture for the 3D Lebak terrain
  const terrainTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Base background: Natural forest & agricultural green gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 1024);
    grad.addColorStop(0, '#2D6A4F'); // North plains
    grad.addColorStop(0.3, '#1B4332'); // Central forest
    grad.addColorStop(0.7, '#244F3B'); // High mountain valleys
    grad.addColorStop(0.92, '#D4A373'); // Coastal sands
    grad.addColorStop(1, '#0284C7'); // Indian Ocean
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);

    // Grid lines for geospatial grid coordinates (WGS 84 simulation)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= 1024; x += 128) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1024);
      ctx.stroke();
    }
    for (let y = 0; y <= 1024; y += 128) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1024, y);
      ctx.stroke();
    }

    // Topography elevation isolines simulation
    ctx.strokeStyle = 'rgba(216, 243, 220, 0.22)';
    ctx.lineWidth = 1.5;
    for (let r = 80; r < 450; r += 45) {
      ctx.beginPath();
      ctx.ellipse(720, 680, r, r * 0.7, Math.PI / 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Ciujung River water path painted on texture
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(700, 720); // Mount Halimun
    ctx.quadraticCurveTo(560, 480, 520, 360); // Sajira / Karian
    ctx.quadraticCurveTo(450, 240, 390, 80); // Rangkasbitung & north
    ctx.stroke();

    // Baduy Cultural Reserve outline pattern on texture
    ctx.strokeStyle = '#D4A373';
    ctx.setLineDash([8, 6]);
    ctx.lineWidth = 3;
    ctx.strokeRect(400, 480, 160, 140);
    ctx.setLineDash([]);

    // Typography labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('KABUPATEN LEBAK', 40, 50);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.fillText('Rangkasbitung (Pusat Pemerintahan)', 380, 110);
    ctx.fillText('Kawasan Adat Kanekes (Baduy)', 410, 560);
    ctx.fillText('Pegunungan Halimun Salak / Cibeber', 660, 750);
    ctx.fillText('Pesisir Samudra Hindia (Bayah & Malingping)', 350, 960);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    return texture;
  }, []);

  // Main Three.js Scene Setup
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#0F172A'); // Deep slate night sky
    scene.fog = new THREE.FogExp2('#0F172A', 0.012);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.5, 1000);
    camera.position.set(0, 75, 95);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Renderer with ACESFilmicToneMapping & SRGBColorSpace
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Studio Environment Reflection via RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // Prevent camera sinking under terrain
    controls.minDistance = 15;
    controls.maxDistance = 220;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // 6. Lighting: Warm Key Directional + Cool Hemisphere
    const hemiLight = new THREE.HemisphereLight('#E2E8F0', '#1E293B', 0.7);
    hemiLight.position.set(0, 100, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight('#FEF08A', 1.8);
    dirLight.position.set(50, 80, 50);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 250;
    dirLight.shadow.camera.left = -70;
    dirLight.shadow.camera.right = 70;
    dirLight.shadow.camera.top = 70;
    dirLight.shadow.camera.bottom = -70;
    dirLight.shadow.bias = -0.0005;
    dirLight.name = 'sun_light';
    scene.add(dirLight);

    // 7. Base Terrain Mesh with authentic Lebak Relief
    const terrainSize = 100;
    const gridRes = 96; // 96x96 vertices for smooth topographic relief
    const terrainGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, gridRes, gridRes);
    terrainGeo.rotateX(-Math.PI / 2); // Lay flat on XZ plane

    const posAttr = terrainGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);

      // Map local X, Z back to approximate Lat/Lng for elevation query
      const lng = LEBAK_CENTER.lng + x / SCALE_X;
      const lat = LEBAK_CENTER.lat - z / SCALE_Z;
      const elev = getLebakElevation(lat, lng);
      posAttr.setY(i, (elev / 100) * verticalExaggeration);
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      map: terrainTexture || null,
      color: '#FFFFFF',
      roughness: 0.85,
      metalness: 0.1,
      wireframe: wireframe
    });

    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.receiveShadow = true;
    terrainMesh.castShadow = true;
    scene.add(terrainMesh);
    terrainMeshRef.current = terrainMesh;

    // 8. Contact shadow plane under terrain
    const shadowGeo = new THREE.PlaneGeometry(terrainSize * 1.15, terrainSize * 1.15);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: '#020617',
      transparent: true,
      opacity: 0.5
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.position.y = -0.5;
    scene.add(shadowMesh);

    // 9. Interactive 3D Objects: Build POIs & Landmarks
    const poiGroup = new THREE.Group();
    poiGroup.name = 'poi_group';
    scene.add(poiGroup);

    features.forEach(f => {
      if (f.geometry.type === 'Point') {
        const [lng, lat] = f.geometry.coordinates;
        const elev = getLebakElevation(lat, lng);
        const pos = geoTo3D(lat, lng, elev, verticalExaggeration);

        // 3D Composite Marker: Base pedestal + Vertical light beam + Glowing Sphere
        const markerGroup = new THREE.Group();
        markerGroup.position.copy(pos);
        markerGroup.userData = { feature: f };

        // Color based on source / category
        let colorHex = '#52B788'; // green default
        if (f.properties.category === 'Kawasan Adat & Budaya') colorHex = '#D4A373'; // Baduy ochre
        if (f.properties.category === 'Hidrologi & Sungai') colorHex = '#0284C7'; // Blue
        if (f.properties.sub_category === 'Fasilitas Kesehatan') colorHex = '#EF4444'; // Red

        // Pedestal
        const pedGeo = new THREE.CylinderGeometry(0.8, 1.2, 1, 16);
        const pedMat = new THREE.MeshStandardMaterial({ color: '#1E293B', roughness: 0.4 });
        const pedMesh = new THREE.Mesh(pedGeo, pedMat);
        pedMesh.position.y = 0.5;
        markerGroup.add(pedMesh);

        // Vertical beam pillar
        const beamGeo = new THREE.CylinderGeometry(0.15, 0.15, 6, 8);
        const beamMat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.75 });
        const beamMesh = new THREE.Mesh(beamGeo, beamMat);
        beamMesh.position.y = 3.5;
        markerGroup.add(beamMesh);

        // Floating glowing sphere
        const sphereGeo = new THREE.SphereGeometry(1.2, 16, 16);
        const sphereMat = new THREE.MeshStandardMaterial({
          color: colorHex,
          emissive: colorHex,
          emissiveIntensity: 0.6,
          roughness: 0.2
        });
        const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
        sphereMesh.position.y = 6.8;
        sphereMesh.castShadow = true;
        markerGroup.add(sphereMesh);

        poiGroup.add(markerGroup);
        featureMeshesRef.current.set(f.id, markerGroup);
      }
    });

    // 10. 3D Ribbon for Sungai Ciujung
    const riverCurvePoints = [
      geoTo3D(-6.65, 106.425, getLebakElevation(-6.65, 106.425) + 0.5, verticalExaggeration),
      geoTo3D(-6.58, 106.385, getLebakElevation(-6.58, 106.385) + 0.5, verticalExaggeration),
      geoTo3D(-6.51, 106.350, getLebakElevation(-6.51, 106.350) + 0.5, verticalExaggeration),
      geoTo3D(-6.45, 106.335, getLebakElevation(-6.45, 106.335) + 0.5, verticalExaggeration),
      geoTo3D(-6.41, 106.290, getLebakElevation(-6.41, 106.290) + 0.5, verticalExaggeration),
      geoTo3D(-6.36, 106.248, getLebakElevation(-6.36, 106.248) + 0.5, verticalExaggeration),
      geoTo3D(-6.28, 106.185, getLebakElevation(-6.28, 106.185) + 0.5, verticalExaggeration),
    ];
    const riverCurve = new THREE.CatmullRomCurve3(riverCurvePoints);
    const riverGeo = new THREE.TubeGeometry(riverCurve, 64, 0.65, 8, false);
    const riverMat = new THREE.MeshStandardMaterial({
      color: '#0284C7',
      emissive: '#0369A1',
      emissiveIntensity: 0.4,
      roughness: 0.1,
      metalness: 0.8
    });
    const riverMesh = new THREE.Mesh(riverGeo, riverMat);
    riverMesh.name = 'river_ciujung';
    scene.add(riverMesh);

    // 11. 3D Adat Baduy Kanekes Territorium Boundary Line
    const baduyPoints = [
      geoTo3D(-6.520, 106.195, getLebakElevation(-6.520, 106.195) + 1.2, verticalExaggeration),
      geoTo3D(-6.518, 106.245, getLebakElevation(-6.518, 106.245) + 1.2, verticalExaggeration),
      geoTo3D(-6.545, 106.265, getLebakElevation(-6.545, 106.265) + 1.2, verticalExaggeration),
      geoTo3D(-6.585, 106.255, getLebakElevation(-6.585, 106.255) + 1.2, verticalExaggeration),
      geoTo3D(-6.605, 106.215, getLebakElevation(-6.605, 106.215) + 1.2, verticalExaggeration),
      geoTo3D(-6.575, 106.185, getLebakElevation(-6.575, 106.185) + 1.2, verticalExaggeration),
      geoTo3D(-6.520, 106.195, getLebakElevation(-6.520, 106.195) + 1.2, verticalExaggeration),
    ];
    const baduyGeo = new THREE.BufferGeometry().setFromPoints(baduyPoints);
    const baduyMat = new THREE.LineDashedMaterial({
      color: '#D4A373',
      linewidth: 3,
      scale: 1,
      dashSize: 2,
      gapSize: 1
    });
    const baduyLine = new THREE.Line(baduyGeo, baduyMat);
    baduyLine.computeLineDistances();
    baduyLine.name = 'baduy_boundary';
    scene.add(baduyLine);

    // Animation Loop with Clock
    const clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Gentle floating animation on POI spheres
      poiGroup.children.forEach((group: any, idx) => {
        const sphere = group.children[2];
        if (sphere) {
          sphere.position.y = 6.8 + Math.sin(elapsed * 2 + idx) * 0.4;
          sphere.rotation.y += delta * 0.5;
        }
      });

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Mouse click raycasting for 3D inspection
    const handleCanvasClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(poiGroup.children, true);

      if (intersects.length > 0) {
        let parent: any = intersects[0].object;
        while (parent && !parent.userData?.feature && parent.parent) {
          parent = parent.parent;
        }
        if (parent && parent.userData?.feature) {
          const feat = parent.userData.feature;
          setSelectedFeature(feat);
          if (onSelectFeature) onSelectFeature(feat);
        }
      }
    };

    renderer.domElement.addEventListener('click', handleCanvasClick);

    // Resize handler
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', handleCanvasClick);

      // Dispose Three.js resources
      terrainGeo.dispose();
      terrainMat.dispose();
      if (terrainTexture) terrainTexture.dispose();
      riverGeo.dispose();
      riverMat.dispose();
      baduyGeo.dispose();
      baduyMat.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();

      renderer.dispose();
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [terrainTexture]);

  // Handle Vertical Exaggeration update
  useEffect(() => {
    if (!terrainMeshRef.current) return;
    const geo = terrainMeshRef.current.geometry as THREE.PlaneGeometry;
    const pos = geo.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const lng = LEBAK_CENTER.lng + x / SCALE_X;
      const lat = LEBAK_CENTER.lat - z / SCALE_Z;
      const elev = getLebakElevation(lat, lng);
      pos.setY(i, (elev / 100) * verticalExaggeration);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();

    // Also update POI heights
    features.forEach(f => {
      const mesh = featureMeshesRef.current.get(f.id);
      if (mesh && f.geometry.type === 'Point') {
        const [lng, lat] = f.geometry.coordinates;
        const elev = getLebakElevation(lat, lng);
        const newPos = geoTo3D(lat, lng, elev, verticalExaggeration);
        mesh.position.copy(newPos);
      }
    });
  }, [verticalExaggeration, features]);

  // Handle Sun Angle / Lighting update
  useEffect(() => {
    if (!sceneRef.current) return;
    const sun = sceneRef.current.getObjectByName('sun_light') as THREE.DirectionalLight;
    if (sun) {
      const rad = (sunAngle * Math.PI) / 180;
      sun.position.set(Math.cos(rad) * 90, Math.sin(rad) * 90, 45);
    }
  }, [sunAngle]);

  // Handle Wireframe toggle
  useEffect(() => {
    if (!terrainMeshRef.current) return;
    (terrainMeshRef.current.material as THREE.MeshStandardMaterial).wireframe = wireframe;
  }, [wireframe]);

  // Handle Layer toggles
  useEffect(() => {
    if (!sceneRef.current) return;
    const poi = sceneRef.current.getObjectByName('poi_group');
    if (poi) poi.visible = showPOIs;

    const river = sceneRef.current.getObjectByName('river_ciujung');
    if (river) river.visible = showRivers;

    const baduy = sceneRef.current.getObjectByName('baduy_boundary');
    if (baduy) baduy.visible = showCustomaryZone;
  }, [showPOIs, showRivers, showCustomaryZone]);

  // Handle Camera Presets
  const applyCameraPreset = (preset: 'default' | 'baduy' | 'halimun' | 'coast' | 'top') => {
    setCameraPreset(preset);
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    if (preset === 'default') {
      camera.position.set(0, 75, 95);
      controls.target.set(0, 0, 0);
    } else if (preset === 'baduy') {
      // Kanekes Baduy is in south-central Leuwidamar
      camera.position.set(-8, 30, 20);
      controls.target.set(-4, 5, 0);
    } else if (preset === 'halimun') {
      // Mount Halimun Salak & Cibeber in South-East
      camera.position.set(35, 45, -15);
      controls.target.set(15, 12, -8);
    } else if (preset === 'coast') {
      // South coast Bayah & Malingping looking North
      camera.position.set(0, 32, 65);
      controls.target.set(0, 5, 25);
    } else if (preset === 'top') {
      // Orthogonal top-down view
      camera.position.set(0, 110, 0.1);
      controls.target.set(0, 0, 0);
    }
    controls.update();
  };

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] bg-[#0F172A] overflow-hidden select-none">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Bar Floating Controls */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2">
        {/* Mode Switcher: 2D GIS <-> 3D Terrain */}
        <div className="flex items-center p-1 bg-white/90 backdrop-blur-md rounded-xl border border-slate-200 shadow-md">
          <button
            onClick={onSwitchTo2D}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2D Leaflet</span>
          </button>
          <button
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#1B4332] text-white shadow-xs flex items-center gap-1.5"
          >
            <Mountain className="w-3.5 h-3.5 text-[#52B788]" />
            <span>3D Three.js Relief</span>
          </button>
        </div>

        {/* Viewport Title Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-800 text-xs text-slate-300">
          <span className="w-2 h-2 rounded-full bg-[#52B788]" />
          <span>Elevasi Digital Topografi Kabupaten Lebak</span>
        </div>
      </div>

      {/* Right Top Reset / Preset Views */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 text-xs">
        <span className="text-[11px] text-slate-400 px-1 font-medium">Sudut Kamera:</span>
        <button
          onClick={() => applyCameraPreset('default')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
            cameraPreset === 'default' ? 'bg-[#1B4332] text-white' : 'text-slate-300 hover:text-white'
          }`}
        >
          Isometrik
        </button>
        <button
          onClick={() => applyCameraPreset('baduy')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
            cameraPreset === 'baduy' ? 'bg-[#1B4332] text-white' : 'text-slate-300 hover:text-white'
          }`}
        >
          Baduy
        </button>
        <button
          onClick={() => applyCameraPreset('halimun')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
            cameraPreset === 'halimun' ? 'bg-[#1B4332] text-white' : 'text-slate-300 hover:text-white'
          }`}
        >
          Halimun
        </button>
        <button
          onClick={() => applyCameraPreset('coast')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
            cameraPreset === 'coast' ? 'bg-[#1B4332] text-white' : 'text-slate-300 hover:text-white'
          }`}
        >
          Pesisir Bayah
        </button>
        <button
          onClick={() => applyCameraPreset('top')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
            cameraPreset === 'top' ? 'bg-[#1B4332] text-white' : 'text-slate-300 hover:text-white'
          }`}
        >
          Tegak 2D
        </button>
      </div>

      {/* Feature Inspector Modal if Object Clicked in 3D */}
      {selectedFeature && (
        <div className="absolute right-4 top-16 w-80 bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-700 shadow-2xl p-4 z-30 text-xs text-slate-200 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#52B788]">
                {selectedFeature.properties.category || 'Objek Spasial 3D'}
              </span>
              <h4 className="text-sm font-bold text-white mt-0.5 leading-snug">
                {selectedFeature.properties.name}
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {selectedFeature.properties.kecamatan ? `Kecamatan ${selectedFeature.properties.kecamatan}` : 'Kabupaten Lebak'}
              </p>
            </div>
            <button
              onClick={() => setSelectedFeature(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              ✕
            </button>
          </div>

          <div className="p-2.5 bg-slate-800/80 rounded-lg space-y-1.5 border border-slate-700/80 text-[11px]">
            <p className="flex justify-between">
              <span className="text-slate-400">Sumber Data:</span>
              <span className="text-white font-medium">{selectedFeature.properties.source || 'Database GEORuhay'}</span>
            </p>
            {selectedFeature.properties.luas_hektar && (
              <p className="flex justify-between">
                <span className="text-slate-400">Luas Wilayah:</span>
                <span className="text-white font-mono">{selectedFeature.properties.luas_hektar} Ha</span>
              </p>
            )}
            {selectedFeature.properties.status_verifikasi && (
              <p className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="text-[#52B788] font-medium">{selectedFeature.properties.status_verifikasi}</span>
              </p>
            )}
          </div>

          {selectedFeature.properties.keterangan && (
            <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-800/40 p-2 rounded">
              {selectedFeature.properties.keterangan}
            </p>
          )}

          <div className="pt-1 flex justify-end">
            <button
              onClick={() => {
                setSelectedFeature(null);
                if (onSwitchTo2D) onSwitchTo2D();
              }}
              className="px-3 py-1.5 bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-semibold rounded-lg text-xs"
            >
              Lihat di Peta 2D
            </button>
          </div>
        </div>
      )}

      {/* Ergonomic Collapsible Bottom Control Dock (Adhering to Three.js Design Directives) */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 max-w-4xl w-[94vw] transition-transform duration-300"
        style={{ transform: `translate(-50%, ${isHudCollapsed ? 'calc(100% - 28px)' : '0'})` }}
      >
        {/* Toggle Collapse Bar */}
        <div className="flex justify-center mb-1">
          <button
            onClick={() => setIsHudCollapsed(!isHudCollapsed)}
            className="px-4 py-1 bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md rounded-t-lg border-t border-x border-slate-700 text-[11px] text-slate-300 hover:text-white flex items-center gap-1.5 shadow-md"
          >
            {isHudCollapsed ? <ChevronUp className="w-3.5 h-3.5 text-[#52B788]" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
            <span>{isHudCollapsed ? 'Buka Pengaturan 3D' : 'Sembunyikan Pengaturan 3D'}</span>
          </button>
        </div>

        {/* Main Dock Container */}
        <div className="bg-slate-900/92 backdrop-blur-md rounded-2xl border border-slate-700/80 p-4 shadow-2xl text-xs text-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
            {/* Control 1: Eksagerasi Vertikal (Relief Multiplier) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium flex items-center gap-1.5">
                  <Mountain className="w-3.5 h-3.5 text-[#52B788]" />
                  <span>Eksagerasi Vertikal:</span>
                </span>
                <span className="font-mono text-[#52B788] font-bold tabular-nums">
                  {verticalExaggeration.toFixed(1)}x
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="4.0"
                step="0.1"
                value={verticalExaggeration}
                onChange={e => setVerticalExaggeration(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#52B788]"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0.5x (Alami)</span>
                <span>2.0x (Optimal)</span>
                <span>4.0x (Curam)</span>
              </div>
            </div>

            {/* Control 2: Sudut Pencahayaan Matahari */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sudut Matahari:</span>
                </span>
                <span className="font-mono text-amber-300 font-bold tabular-nums">
                  {sunAngle}°
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="85"
                step="1"
                value={sunAngle}
                onChange={e => setSunAngle(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Pagi / Sore</span>
                <span>Siang Terik</span>
              </div>
            </div>

            {/* Control 3: Layer Toggles */}
            <div className="flex flex-wrap items-center gap-2 justify-end">
              <button
                onClick={() => setShowPOIs(!showPOIs)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  showPOIs
                    ? 'bg-[#1B4332] text-white border-[#52B788]'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                Titik Fasilitas ({features.filter(f => f.geometry.type === 'Point').length})
              </button>

              <button
                onClick={() => setShowRivers(!showRivers)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  showRivers
                    ? 'bg-[#0369A1] text-white border-[#38BDF8]'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                Sungai Ciujung
              </button>

              <button
                onClick={() => setWireframe(!wireframe)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  wireframe
                    ? 'bg-purple-900/70 text-purple-200 border-purple-400'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                Wireframe DEM
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
