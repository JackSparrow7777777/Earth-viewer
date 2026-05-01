import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const EARTH_RADIUS = 1.84;
const TEXTURE_ROOT = "https://threejs.org/examples/textures/";
const PLANET_TEXTURE_ROOT = `${TEXTURE_ROOT}planets/`;
const SATELLITE_TILE_ROOT = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/";
const LOCAL_TILE_SIZE = 256;
const GLOBAL_MIN_DISTANCE = 2.22;
const GLOBAL_MAX_DISTANCE = 9.5;
const CITY_MIN_DISTANCE = 0.22;
const CITY_MAX_DISTANCE = 2.05;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;

const canvas = document.querySelector("#globe-canvas");
const ui = {
  loading: document.querySelector("#loading"),
  loadingBar: document.querySelector("#loading-bar"),
  loadingNote: document.querySelector("#loading-note"),
  cityButtons: document.querySelector("#city-buttons"),
  modeButtons: document.querySelector("#mode-buttons"),
  modeReadout: document.querySelector("#mode-readout"),
  toggles: document.querySelector("#layer-toggles"),
  rangeReadout: document.querySelector("#range-readout"),
  app: document.querySelector("#app"),
  imageryScene: document.querySelector("#imagery-scene"),
  imageryStage: document.querySelector("#imagery-stage"),
  imageryPlace: document.querySelector("#imagery-place"),
  imageryCoords: document.querySelector("#imagery-coords"),
  labelsLayer: document.querySelector("#labels-layer"),
  searchForm: document.querySelector("#search-form"),
  searchInput: document.querySelector("#search-input"),
  searchResults: document.querySelector("#search-results"),
  liveTime: document.querySelector("#live-time"),
  timeSlider: document.querySelector("#time-slider"),
  timeLabel: document.querySelector("#time-label"),
  sunLabel: document.querySelector("#sun-label"),
  tourBtn: document.querySelector("#tour-btn"),
  resetBtn: document.querySelector("#reset-btn"),
  shotBtn: document.querySelector("#shot-btn"),
  toast: document.querySelector("#toast"),
  locationCard: document.querySelector("#location-card"),
  locationName: document.querySelector("#location-name"),
  locationCopy: document.querySelector("#location-copy"),
  locationLat: document.querySelector("#location-lat"),
  locationLon: document.querySelector("#location-lon"),
  locationView: document.querySelector("#location-view")
};

const DESTINATIONS = [
  {
    name: "New York",
    country: "United States",
    lat: 40.7128,
    lon: -74.006,
    color: "#78e4ff",
    copy: "Dense coastal light, Atlantic weather corridors, and one of Earth's most recognizable night signatures."
  },
  {
    name: "Los Angeles",
    country: "United States",
    lat: 34.0522,
    lon: -118.2437,
    color: "#ffcd75",
    copy: "A luminous Pacific basin edge framed by mountains, desert, and a vast metropolitan grid."
  },
  {
    name: "London",
    country: "United Kingdom",
    lat: 51.5074,
    lon: -0.1278,
    color: "#b7a8ff",
    copy: "A historic city node where river, weather, transport, and time zones all meet."
  },
  {
    name: "Paris",
    country: "France",
    lat: 48.8566,
    lon: 2.3522,
    color: "#ff8cb4",
    copy: "A compact European light pattern with elegant radial structure and deep cultural gravity."
  },
  {
    name: "Tokyo",
    country: "Japan",
    lat: 35.6762,
    lon: 139.6503,
    color: "#7fffd0",
    copy: "A brilliant megacity arc on the Pacific, tightly woven into mountains, bays, and rail corridors."
  },
  {
    name: "Sydney",
    country: "Australia",
    lat: -33.8688,
    lon: 151.2093,
    color: "#7dd3ff",
    copy: "A southern harbor city with a crisp coastline and wide ocean horizon."
  },
  {
    name: "Dubai",
    country: "United Arab Emirates",
    lat: 25.2048,
    lon: 55.2708,
    color: "#ffd98c",
    copy: "A desert metropolis where engineered coastline, trade routes, and night lights form a sharp signal."
  },
  {
    name: "Rio de Janeiro",
    country: "Brazil",
    lat: -22.9068,
    lon: -43.1729,
    color: "#95ff9d",
    copy: "Mountains, ocean, and urban light meet in one of the world's most cinematic coastal settings."
  }
];

const SEARCH_PLACES = [
  ...DESTINATIONS,
  { name: "Seoul", country: "South Korea", lat: 37.5665, lon: 126.978, color: "#9be7ff", copy: "A high-density capital ringed by mountains and crossed by the Han River." },
  { name: "Singapore", country: "Singapore", lat: 1.3521, lon: 103.8198, color: "#7fffd0", copy: "A compact equatorial city-state at a major maritime crossroads." },
  { name: "Cairo", country: "Egypt", lat: 30.0444, lon: 31.2357, color: "#ffcd75", copy: "A desert-edge metropolis illuminated along the Nile corridor." },
  { name: "Mumbai", country: "India", lat: 19.076, lon: 72.8777, color: "#ffc2a6", copy: "A coastal megacity with intense night-light density along the Arabian Sea." },
  { name: "Cape Town", country: "South Africa", lat: -33.9249, lon: 18.4241, color: "#98ffcf", copy: "A southern Atlantic city shaped by mountains, ocean, and weather systems." },
  { name: "Reykjavik", country: "Iceland", lat: 64.1466, lon: -21.9426, color: "#b5f7ff", copy: "A high-latitude capital near aurora paths and North Atlantic weather." },
  { name: "Mexico City", country: "Mexico", lat: 19.4326, lon: -99.1332, color: "#ffb86b", copy: "A vast highland metropolis with a strong night signature in central Mexico." },
  { name: "Toronto", country: "Canada", lat: 43.6532, lon: -79.3832, color: "#9be7ff", copy: "A Great Lakes city with a bright urban shoreline and continental scale." },
  { name: "Berlin", country: "Germany", lat: 52.52, lon: 13.405, color: "#d7c8ff", copy: "A central European capital with layered history and a distinctive urban footprint." },
  { name: "Beijing", country: "China", lat: 39.9042, lon: 116.4074, color: "#ff9da9", copy: "A northern capital city embedded in plains, mountains, and regional megacity networks." }
];

const CITY_PROFILES = {
  "New York": {
    layout: "grid",
    count: 145,
    radiusX: 0.038,
    radiusY: 0.07,
    height: 0.072,
    mapZoom: 14,
    palette: [0x9fb7c8, 0x52687a, 0xd6c5a4, 0x6fa8c9]
  },
  "Los Angeles": {
    layout: "sprawl",
    count: 105,
    radiusX: 0.08,
    radiusY: 0.048,
    height: 0.036,
    mapZoom: 13,
    palette: [0xd9c09c, 0xb98e72, 0x7fa0aa, 0xe7d7b5]
  },
  London: {
    layout: "river",
    count: 110,
    radiusX: 0.055,
    radiusY: 0.047,
    height: 0.04,
    mapZoom: 14,
    palette: [0xb7b2a7, 0x7f8791, 0xc8b99c, 0x5d7485]
  },
  Paris: {
    layout: "radial",
    count: 115,
    radiusX: 0.052,
    radiusY: 0.052,
    height: 0.038,
    mapZoom: 14,
    palette: [0xd6c3aa, 0xb99786, 0xf0dcc0, 0x8f7a71]
  },
  Tokyo: {
    layout: "dense",
    count: 165,
    radiusX: 0.065,
    radiusY: 0.055,
    height: 0.06,
    mapZoom: 14,
    palette: [0x9aa4b4, 0x566173, 0xdadfe8, 0x6bffe1]
  },
  Sydney: {
    layout: "harbor",
    count: 92,
    radiusX: 0.053,
    radiusY: 0.043,
    height: 0.046,
    mapZoom: 14,
    palette: [0xc8d2d9, 0x8da4af, 0xe2d6bd, 0x76c7df]
  },
  Dubai: {
    layout: "linear",
    count: 96,
    radiusX: 0.036,
    radiusY: 0.083,
    height: 0.105,
    mapZoom: 14,
    palette: [0xe0d1b5, 0x9aaec3, 0xf2e5ca, 0x77d7ff]
  },
  "Rio de Janeiro": {
    layout: "coastal",
    count: 96,
    radiusX: 0.062,
    radiusY: 0.045,
    height: 0.035,
    mapZoom: 14,
    palette: [0xcfc4aa, 0x93ad96, 0xd9d2bd, 0x7ad8ff]
  }
};

const DEFAULT_CITY_PROFILE = {
  layout: "district",
  count: 88,
  radiusX: 0.05,
  radiusY: 0.048,
  height: 0.04,
  mapZoom: 13,
  palette: [0x96a7b4, 0x566677, 0xc8b99c, 0x78e4ff]
};

const state = {
  mode: "satellite",
  clouds: true,
  atmosphere: true,
  terrain: false,
  labels: true,
  borders: false,
  buildings: true,
  weather: false,
  aurora: true,
  sound: false,
  liveTime: true,
  manualHour: 12,
  tour: false
};

const clock = new THREE.Clock();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.01, 120);
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: "high-performance",
  preserveDrawingBuffer: true
});

const controls = new OrbitControls(camera, renderer.domElement);
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const tmpVec = new THREE.Vector3();
const tmpVec2 = new THREE.Vector3();
const sunDirection = new THREE.Vector3(1, 0.12, 0.2).normalize();

const earth = {
  group: new THREE.Group(),
  mesh: null,
  nightMesh: null,
  clouds: null,
  atmosphere: null,
  borders: null,
  terrainOverlay: null,
  markerGroup: new THREE.Group(),
  buildingGroup: new THREE.Group(),
  streetGroup: new THREE.Group(),
  weatherGroup: new THREE.Group(),
  auroraGroup: new THREE.Group(),
  sunSprite: null
};

let textures = {};
let surfaceMaterial;
let nightMaterial;
let cloudMaterial;
let sunLight;
let hemiLight;
let activeFlight = null;
let activePlace = null;
let tourIndex = 0;
let nextTourAt = 0;
let labelEntries = [];
let markerEntries = [];
let pointerDown = null;
let audioRig = null;
let toastTimer = null;
const tileTextureCache = new Map();
const localImagery = {
  active: false,
  place: null,
  lat: 0,
  lon: 0,
  zoom: 17,
  minZoom: 15,
  maxZoom: 18,
  drag: null,
  tileEls: new Map(),
  renderQueued: false
};

boot();

async function boot() {
  configureRenderer();
  setupCameraAndControls();
  setupLightsAndSpace();
  setupInterface();

  textures = await loadEarthTextures();
  createEarth();
  createMarkers();
  createWeatherLayer();
  createAuroraLayer();
  applyState();
  updateSunFromTime();
  updateLocationCard(null);

  ui.loading.classList.add("hidden");
  window.setTimeout(() => ui.loading.remove(), 650);
  queueInitialDestination();
  requestAnimationFrame(animate);
}

function configureRenderer() {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isCoarsePointer ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  camera.position.set(0.18, 0.34, 6.15);
  scene.fog = new THREE.FogExp2(0x02050c, 0.012);
}

function setupCameraAndControls() {
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.rotateSpeed = 0.45;
  controls.zoomSpeed = 0.58;
  controls.panSpeed = 0.28;
  controls.screenSpacePanning = false;
  controls.minDistance = GLOBAL_MIN_DISTANCE;
  controls.maxDistance = GLOBAL_MAX_DISTANCE;
  controls.autoRotate = !prefersReducedMotion;
  controls.autoRotateSpeed = 0.16;
  controls.target.set(0, 0, 0);
  controls.update();

  controls.addEventListener("start", () => {
    controls.autoRotate = false;
    if (state.tour) toggleTour(false);
  });

  window.addEventListener("resize", onResize);
  renderer.domElement.addEventListener("dblclick", onDoubleClick);
  renderer.domElement.addEventListener("pointerdown", onPointerDown);
  renderer.domElement.addEventListener("pointerup", onPointerUp);

  ui.imageryScene.addEventListener("pointerdown", onImageryPointerDown);
  ui.imageryScene.addEventListener("pointermove", onImageryPointerMove);
  ui.imageryScene.addEventListener("pointerup", onImageryPointerUp);
  ui.imageryScene.addEventListener("pointercancel", onImageryPointerUp);
  ui.imageryScene.addEventListener("wheel", onImageryWheel, { passive: false });
  ui.imageryScene.addEventListener("dblclick", onImageryDoubleClick);
}

function setupLightsAndSpace() {
  hemiLight = new THREE.HemisphereLight(0x9acfff, 0x070812, 0.48);
  scene.add(hemiLight);

  sunLight = new THREE.DirectionalLight(0xffffff, 3.35);
  sunLight.position.copy(sunDirection).multiplyScalar(10);
  scene.add(sunLight);

  const backLight = new THREE.DirectionalLight(0x78e4ff, 0.36);
  backLight.position.set(-6, 2.4, -4);
  scene.add(backLight);

  scene.add(createStarField(1600, 34, 0.022, 0xffffff, 0.8));
  scene.add(createStarField(620, 58, 0.035, 0x9fdcff, 0.42));
  scene.add(createNebulaMist());
  scene.add(earth.group);
}

async function loadEarthTextures() {
  const loaded = {
    night: configureTexture(createFallbackNightTexture(), true),
    clouds: configureTexture(createFallbackCloudTexture(), false),
    specular: configureTexture(createFallbackSpecularTexture(), false),
    normal: configureTexture(createFallbackNormalTexture(), false)
  };

  loaded.day = await loadTextureWithFallback(
    `${TEXTURE_ROOT}land_ocean_ice_cloud_2048.jpg`,
    createFallbackDayTexture,
    true,
    5200
  );
  setLoadingProgress(0.68, "Surface map locked. Streaming orbital detail...");
  loaded.borders = createBorderTexture();
  loaded.terrainLines = createTerrainLineTexture();

  hydrateTexture("night", `${PLANET_TEXTURE_ROOT}earth_lights_2048.png`, true, loaded);
  hydrateTexture("clouds", `${PLANET_TEXTURE_ROOT}earth_clouds_1024.png`, false, loaded);
  hydrateTexture("specular", `${PLANET_TEXTURE_ROOT}earth_specular_2048.jpg`, false, loaded);
  hydrateTexture("normal", `${PLANET_TEXTURE_ROOT}earth_normal_2048.jpg`, false, loaded);
  return loaded;
}

async function loadTextureWithFallback(url, fallbackFactory, isColorTexture, timeoutMs = 7000) {
  const texture = await loadRemoteTexture(url, isColorTexture, timeoutMs);
  return texture || configureTexture(fallbackFactory(), isColorTexture);
}

function loadRemoteTexture(url, isColorTexture, timeoutMs = 7000) {
  return new Promise((resolve) => {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    let settled = false;
    const timeout = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve(null);
    }, timeoutMs);

    loader.load(
      url,
      (texture) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        resolve(configureTexture(texture, isColorTexture));
      },
      undefined,
      () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        resolve(null);
      }
    );
  });
}

async function hydrateTexture(key, url, isColorTexture, loaded) {
  const texture = await loadRemoteTexture(url, isColorTexture, 12000);
  if (!texture) return;

  const previous = loaded[key];
  loaded[key] = texture;
  if (textures === loaded || earth.mesh) {
    applyTextureUpdate(key, texture);
  }
  if (previous && previous !== texture) previous.dispose();
}

function applyTextureUpdate(key, texture) {
  if (key === "night" && nightMaterial) {
    nightMaterial.uniforms.nightMap.value = texture;
  }
  if (key === "clouds" && cloudMaterial) {
    cloudMaterial.alphaMap = texture;
    cloudMaterial.needsUpdate = true;
  }
  if (key === "specular" && surfaceMaterial) {
    surfaceMaterial.specularMap = texture;
    surfaceMaterial.needsUpdate = true;
  }
  if (key === "normal" && surfaceMaterial) {
    surfaceMaterial.normalMap = texture;
    surfaceMaterial.needsUpdate = true;
  }
  if (key === "day" && surfaceMaterial) {
    surfaceMaterial.map = texture;
    surfaceMaterial.needsUpdate = true;
  }
}

function configureTexture(texture, isColorTexture = true) {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  texture.colorSpace = isColorTexture ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function createEarth() {
  const highDetail = !isCoarsePointer;
  const sphereSegments = highDetail ? 160 : 96;
  const baseGeometry = new THREE.SphereGeometry(EARTH_RADIUS, sphereSegments, Math.floor(sphereSegments / 2));

  surfaceMaterial = new THREE.MeshPhongMaterial({
    map: textures.day,
    normalMap: textures.normal,
    normalScale: new THREE.Vector2(0.22, 0.22),
    specularMap: textures.specular,
    specular: new THREE.Color(0x557a93),
    shininess: 21,
    color: 0xffffff
  });

  earth.mesh = new THREE.Mesh(baseGeometry, surfaceMaterial);
  earth.group.add(earth.mesh);

  nightMaterial = createNightMaterial();
  earth.nightMesh = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_RADIUS * 1.003, sphereSegments, Math.floor(sphereSegments / 2)),
    nightMaterial
  );
  earth.group.add(earth.nightMesh);

  cloudMaterial = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    alphaMap: textures.clouds,
    transparent: true,
    opacity: 0.38,
    depthWrite: false
  });
  earth.clouds = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_RADIUS * 1.012, sphereSegments, Math.floor(sphereSegments / 2)),
    cloudMaterial
  );
  earth.group.add(earth.clouds);

  earth.atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_RADIUS * 1.085, sphereSegments, Math.floor(sphereSegments / 2)),
    createAtmosphereMaterial()
  );
  scene.add(earth.atmosphere);

  earth.borders = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_RADIUS * 1.006, sphereSegments, Math.floor(sphereSegments / 2)),
    new THREE.MeshBasicMaterial({
      map: textures.borders,
      color: 0x9edcff,
      transparent: true,
      opacity: 0.34,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  earth.group.add(earth.borders);

  earth.terrainOverlay = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_RADIUS * 1.008, sphereSegments, Math.floor(sphereSegments / 2)),
    new THREE.MeshBasicMaterial({
      map: textures.terrainLines,
      color: 0xffd98c,
      transparent: true,
      opacity: 0.26,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  earth.group.add(earth.terrainOverlay);

  earth.group.add(earth.markerGroup);
  earth.group.add(earth.streetGroup);
  earth.group.add(earth.buildingGroup);
  earth.group.add(earth.weatherGroup);
  earth.group.add(earth.auroraGroup);

  earth.sunSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createRadialSpriteTexture("#ffd88a", "#78e4ff"),
      color: 0xffffff,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  earth.sunSprite.scale.set(2.2, 2.2, 1);
  scene.add(earth.sunSprite);
}

function createNightMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      nightMap: { value: textures.night },
      sunDirection: { value: sunDirection.clone() },
      intensity: { value: 1.42 },
      opacity: { value: 1.0 }
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorldNormal;

      void main() {
        vUv = uv;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D nightMap;
      uniform vec3 sunDirection;
      uniform float intensity;
      uniform float opacity;
      varying vec2 vUv;
      varying vec3 vWorldNormal;

      void main() {
        float daySide = dot(normalize(vWorldNormal), normalize(sunDirection));
        float nightMask = smoothstep(0.14, -0.24, daySide);
        vec3 city = texture2D(nightMap, vUv).rgb;
        float signal = max(max(city.r, city.g), city.b);
        vec3 warmCity = city * vec3(1.45, 1.12, 0.82) * intensity;
        gl_FragColor = vec4(warmCity, signal * nightMask * opacity);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
}

function createAtmosphereMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      sunDirection: { value: sunDirection.clone() },
      intensity: { value: 1.0 }
    },
    vertexShader: `
      varying vec3 vWorldNormal;
      varying vec3 vViewPosition;

      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 sunDirection;
      uniform float intensity;
      varying vec3 vWorldNormal;
      varying vec3 vViewPosition;

      void main() {
        vec3 viewDir = normalize(vViewPosition);
        float rim = pow(1.0 - abs(dot(normalize(vWorldNormal), viewDir)), 2.35);
        float lit = dot(normalize(vWorldNormal), normalize(sunDirection)) * 0.5 + 0.5;
        vec3 dayGlow = vec3(0.30, 0.78, 1.0);
        vec3 sunsetGlow = vec3(1.0, 0.56, 0.24);
        vec3 color = mix(sunsetGlow, dayGlow, smoothstep(0.15, 0.86, lit));
        float alpha = rim * (0.30 + lit * 0.42) * intensity;
        gl_FragColor = vec4(color, alpha);
      }
    `,
    side: THREE.BackSide,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
}

function createMarkers() {
  const dotGeometry = new THREE.SphereGeometry(0.018, 16, 8);
  const ringGeometry = new THREE.TorusGeometry(0.034, 0.0023, 8, 42);

  SEARCH_PLACES.forEach((place) => {
    const normal = latLonToVector3(place.lat, place.lon, 1).normalize();
    const position = normal.clone().multiplyScalar(EARTH_RADIUS * 1.018);
    const dot = new THREE.Mesh(
      dotGeometry,
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(place.color || "#78e4ff"),
        transparent: true,
        opacity: 0.95,
        depthWrite: false
      })
    );
    dot.position.copy(position);
    dot.userData.place = place;

    const ring = new THREE.Mesh(
      ringGeometry,
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(place.color || "#78e4ff"),
        transparent: true,
        opacity: 0.62,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    ring.position.copy(position);
    ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    ring.userData.place = place;

    earth.markerGroup.add(dot, ring);
    markerEntries.push(dot, ring);

    const label = document.createElement("button");
    label.type = "button";
    label.className = "map-label";
    label.textContent = place.name;
    label.style.setProperty("--accent", place.color || "#78e4ff");
    label.addEventListener("click", () => flyToPlace(place));
    ui.labelsLayer.append(label);
    labelEntries.push({ place, label, position });
  });
}

function createWeatherLayer() {
  const materialA = new THREE.LineBasicMaterial({
    color: 0x78e4ff,
    transparent: true,
    opacity: 0.34,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const materialB = new THREE.LineBasicMaterial({
    color: 0xffcd75,
    transparent: true,
    opacity: 0.24,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const streams = [
    [-18, -150, -8, -70], [22, -130, 34, -42], [48, -80, 57, 12],
    [34, 10, 45, 86], [-28, 28, -38, 116], [9, 82, 18, 150],
    [-44, -92, -36, -18], [62, 40, 67, 130], [-8, -22, 4, 52],
    [38, 120, 46, -166], [-58, 120, -50, -170], [16, -22, 25, 38]
  ];

  streams.forEach((stream, index) => {
    const [latA, lonA, latB, lonB] = stream;
    const points = [];
    for (let i = 0; i <= 36; i += 1) {
      const t = i / 36;
      const lat = THREE.MathUtils.lerp(latA, latB, t) + Math.sin(t * Math.PI * 2) * 3.5;
      const lon = lerpLongitude(lonA, lonB, t);
      points.push(latLonToVector3(lat, lon, EARTH_RADIUS * (1.045 + Math.sin(t * Math.PI) * 0.025)));
    }
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), index % 3 === 0 ? materialB : materialA);
    earth.weatherGroup.add(line);
  });
}

function createAuroraLayer() {
  const ringMaterialNorth = new THREE.MeshBasicMaterial({
    color: 0x7fffd0,
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const ringMaterialSouth = ringMaterialNorth.clone();
  ringMaterialSouth.color.set(0xb7a8ff);

  [1, -1].forEach((pole) => {
    for (let i = 0; i < 3; i += 1) {
      const torus = new THREE.Mesh(
        new THREE.TorusGeometry(0.46 + i * 0.12, 0.012, 10, 120),
        pole > 0 ? ringMaterialNorth.clone() : ringMaterialSouth.clone()
      );
      torus.position.set(0, pole * EARTH_RADIUS * (0.91 - i * 0.018), 0);
      torus.rotation.x = Math.PI / 2;
      torus.rotation.z = i * 0.7;
      torus.material.opacity = 0.13 + i * 0.045;
      earth.auroraGroup.add(torus);
    }
  });
}

function setupInterface() {
  DESTINATIONS.forEach((place) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = place.name;
    button.style.setProperty("--accent", place.color);
    button.addEventListener("click", () => {
      if (state.tour) toggleTour(false);
      flyToPlace(place);
    });
    ui.cityButtons.append(button);
  });

  ui.modeButtons.addEventListener("click", (event) => {
    const button = event.target.closest("[data-mode]");
    if (!button) return;
    state.mode = button.dataset.mode;
    applyState();
  });

  ui.toggles.addEventListener("change", (event) => {
    const input = event.target.closest("[data-toggle]");
    if (!input) return;
    state[input.dataset.toggle] = input.checked;
    applyState();
  });

  ui.liveTime.addEventListener("change", () => {
    state.liveTime = ui.liveTime.checked;
    ui.timeSlider.disabled = state.liveTime;
    updateSunFromTime();
  });

  ui.timeSlider.addEventListener("input", () => {
    state.manualHour = Number(ui.timeSlider.value);
    state.liveTime = false;
    ui.liveTime.checked = false;
    ui.timeSlider.disabled = false;
    updateSunFromTime();
  });

  ui.resetBtn.addEventListener("click", () => {
    if (state.tour) toggleTour(false);
    resetGlobeView();
  });

  ui.tourBtn.addEventListener("click", () => toggleTour());
  ui.shotBtn.addEventListener("click", captureScreenshot);

  ui.searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const matches = getSearchMatches(ui.searchInput.value);
    if (matches.length) {
      flyToPlace(matches[0]);
      ui.searchResults.classList.remove("visible");
      ui.searchInput.blur();
    }
  });

  ui.searchInput.addEventListener("input", () => renderSearchResults());
  document.addEventListener("pointerdown", (event) => {
    if (!ui.searchForm.contains(event.target)) ui.searchResults.classList.remove("visible");
  });

  ui.timeSlider.disabled = true;
  ui.timeSlider.value = new Date().getUTCHours() + new Date().getUTCMinutes() / 60;
}

function queueInitialDestination() {
  const params = new URLSearchParams(window.location.search);
  const city = params.get("city");
  if (!city) return;
  const match = SEARCH_PLACES.find((place) => place.name.toLowerCase() === city.toLowerCase());
  if (!match) return;
  if (params.has("instant")) {
    window.setTimeout(() => focusPlaceInstantly(match), 420);
    return;
  }
  window.setTimeout(() => flyToPlace(match, { duration: prefersReducedMotion ? 250 : 1500 }), 420);
}

function applyState() {
  if (!earth.mesh) return;

  const modeButtons = ui.modeButtons.querySelectorAll("[data-mode]");
  modeButtons.forEach((button) => button.classList.toggle("active", button.dataset.mode === state.mode));

  const modeNames = {
    satellite: "Satellite",
    political: "Labeled",
    night: "Night Lights",
    terrain: "Terrain",
    clean: "Clean"
  };
  ui.modeReadout.textContent = modeNames[state.mode] || "Satellite";

  const terrainActive = state.terrain || state.mode === "terrain";
  const labelActive = state.labels || state.mode === "political";
  const borderActive = state.borders || state.mode === "political" || state.mode === "terrain";

  if (!localImagery.active && activePlace && !earth.streetGroup.children.length && state.mode !== "clean") createStreetTilePatch(activePlace);
  if (!localImagery.active && activePlace && state.buildings && !earth.buildingGroup.children.length) createCityBuildings(activePlace);

  earth.clouds.visible = state.clouds && state.mode !== "clean";
  earth.atmosphere.visible = state.atmosphere;
  earth.borders.visible = borderActive && state.mode !== "clean";
  earth.terrainOverlay.visible = terrainActive && state.mode !== "clean";
  earth.weatherGroup.visible = state.weather;
  earth.auroraGroup.visible = state.aurora;
  earth.markerGroup.visible = labelActive;
  earth.streetGroup.visible = Boolean(activePlace) && state.mode !== "clean";
  earth.buildingGroup.visible = state.buildings && Boolean(activePlace);
  earth.nightMesh.visible = state.mode !== "clean";

  surfaceMaterial.map = state.mode === "clean" ? null : textures.day;
  surfaceMaterial.normalScale.setScalar(terrainActive ? 0.78 : 0.22);
  surfaceMaterial.shininess = state.mode === "terrain" ? 12 : 21;

  const modeColors = {
    satellite: 0xffffff,
    political: 0xcfe6ff,
    night: 0x536c86,
    terrain: 0xf3e2b8,
    clean: 0x1d9fcc
  };
  surfaceMaterial.color.setHex(modeColors[state.mode] || 0xffffff);
  surfaceMaterial.needsUpdate = true;

  nightMaterial.uniforms.intensity.value = state.mode === "night" ? 2.35 : 1.42;
  nightMaterial.uniforms.opacity.value = state.mode === "clean" ? 0.0 : 1.0;
  cloudMaterial.opacity = state.mode === "terrain" ? 0.22 : 0.38;

  hemiLight.intensity = state.mode === "night" ? 0.3 : 0.48;
  sunLight.intensity = state.mode === "night" ? 2.75 : 3.35;

  if (state.sound) {
    startAmbientSound();
  } else {
    stopAmbientSound();
  }

  updateLabels();
}

function renderSearchResults() {
  const matches = getSearchMatches(ui.searchInput.value).slice(0, 5);
  ui.searchResults.innerHTML = "";
  if (!matches.length) {
    ui.searchResults.classList.remove("visible");
    return;
  }

  matches.forEach((place) => {
    const item = document.createElement("button");
    item.type = "button";
    item.innerHTML = `<span>${place.name}</span><small>${place.country}</small>`;
    item.addEventListener("click", () => {
      flyToPlace(place);
      ui.searchResults.classList.remove("visible");
      ui.searchInput.value = place.name;
      ui.searchInput.blur();
    });
    ui.searchResults.append(item);
  });
  ui.searchResults.classList.add("visible");
}

function getSearchMatches(query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  return SEARCH_PLACES.filter((place) => {
    const haystack = `${place.name} ${place.country}`.toLowerCase();
    return haystack.includes(normalized);
  });
}

function flyToPlace(place, options = {}) {
  if (localImagery.active && !options.forceGlobe) {
    focusPlaceInImagery(place);
    return;
  }

  controls.autoRotate = false;
  controls.enabled = false;
  controls.minDistance = CITY_MIN_DISTANCE;
  controls.maxDistance = CITY_MAX_DISTANCE;
  activePlace = place;

  const normal = latLonToVector3(place.lat, place.lon, 1).normalize();
  const frame = localFrame(normal);
  const altitude = options.altitude ?? (window.innerWidth < 720 ? 0.48 : 0.34);
  const lateral = frame.east.clone().multiplyScalar(window.innerWidth < 720 ? 0.06 : 0.09).add(frame.north.clone().multiplyScalar(0.045));
  const endTarget = normal.clone().multiplyScalar(EARTH_RADIUS * 1.012);
  const endPosition = normal.clone().multiplyScalar(EARTH_RADIUS + altitude).add(lateral);
  const currentDistance = camera.position.length();

  activeFlight = {
    type: "place",
    place,
    startTime: performance.now(),
    duration: prefersReducedMotion ? 350 : options.duration ?? 2600,
    startPosition: camera.position.clone(),
    startTarget: controls.target.clone(),
    startDirection: camera.position.clone().normalize(),
    endDirection: endPosition.clone().normalize(),
    startDistance: currentDistance,
    endDistance: endPosition.length(),
    endPosition,
    endTarget,
    lateral,
    arc: currentDistance > 4.3 ? 0.78 : 0.28
  };

  setActiveCityButton(place);
  updateLocationCard(place, "Approach");
}

function resetGlobeView() {
  exitLocalImagery();
  controls.enabled = false;
  controls.minDistance = GLOBAL_MIN_DISTANCE;
  controls.maxDistance = GLOBAL_MAX_DISTANCE;
  activePlace = null;
  clearGroup(earth.buildingGroup);
  clearGroup(earth.streetGroup);

  const endPosition = new THREE.Vector3(0.18, 0.34, 6.15);
  const endTarget = new THREE.Vector3(0, 0, 0);
  activeFlight = {
    type: "reset",
    startTime: performance.now(),
    duration: prefersReducedMotion ? 300 : 1900,
    startPosition: camera.position.clone(),
    startTarget: controls.target.clone(),
    startDirection: camera.position.clone().normalize(),
    endDirection: endPosition.clone().normalize(),
    startDistance: camera.position.length(),
    endDistance: endPosition.length(),
    endPosition,
    endTarget,
    lateral: new THREE.Vector3(),
    arc: 0.42
  };

  setActiveCityButton(null);
  updateLocationCard(null, "Orbital");
}

function focusPlaceInstantly(place) {
  controls.autoRotate = false;
  controls.enabled = true;
  controls.minDistance = CITY_MIN_DISTANCE;
  controls.maxDistance = CITY_MAX_DISTANCE;
  activePlace = place;

  const normal = latLonToVector3(place.lat, place.lon, 1).normalize();
  const frame = localFrame(normal);
  const altitude = window.innerWidth < 720 ? 0.48 : 0.34;
  const lateral = frame.east.clone().multiplyScalar(window.innerWidth < 720 ? 0.06 : 0.09).add(frame.north.clone().multiplyScalar(0.045));
  controls.target.copy(normal.clone().multiplyScalar(EARTH_RADIUS * 1.012));
  camera.position.copy(normal.clone().multiplyScalar(EARTH_RADIUS + altitude).add(lateral));
  camera.lookAt(controls.target);

  enterLocalImagery(place);
  setActiveCityButton(place);
  updateLocationCard(place, "City focus");
  applyState();
}

function updateFlight(now) {
  if (!activeFlight) return;

  const raw = THREE.MathUtils.clamp((now - activeFlight.startTime) / activeFlight.duration, 0, 1);
  const eased = easeInOutCubic(raw);
  const direction = slerpUnitVectors(activeFlight.startDirection, activeFlight.endDirection, eased);
  const distance = THREE.MathUtils.lerp(activeFlight.startDistance, activeFlight.endDistance, eased);
  const liftedDistance = distance + Math.sin(raw * Math.PI) * activeFlight.arc;
  const target = activeFlight.startTarget.clone().lerp(activeFlight.endTarget, easeOutCubic(raw));

  camera.position.copy(direction.multiplyScalar(liftedDistance));
  controls.target.copy(target);
  camera.lookAt(controls.target);

  if (raw >= 1) {
    camera.position.copy(activeFlight.endPosition);
    controls.target.copy(activeFlight.endTarget);
    camera.lookAt(controls.target);
    controls.enabled = true;

    if (activeFlight.type === "place") {
      enterLocalImagery(activeFlight.place);
      updateLocationCard(activeFlight.place, "City focus");
      showToast(`Arrived over ${activeFlight.place.name}`);
      if (state.tour) nextTourAt = performance.now() + 2600;
    } else {
      controls.autoRotate = !prefersReducedMotion;
      updateLocationCard(null, "Orbital");
    }

    activeFlight = null;
    applyState();
  }
}

function enterLocalImagery(place) {
  if (!place || !ui.imageryScene) return;
  localImagery.active = true;
  localImagery.place = place;
  localImagery.lat = place.lat;
  localImagery.lon = place.lon;
  localImagery.zoom = getCityProfile(place).localZoom || 17;
  ui.app.classList.add("local-view");
  ui.imageryScene.classList.add("active");
  controls.enabled = false;
  controls.autoRotate = false;
  drawLocalImageryTiles();
}

function focusPlaceInImagery(place) {
  activePlace = place;
  setActiveCityButton(place);
  updateLocationCard(place, "Satellite city");
  enterLocalImagery(place);
  showToast(`Satellite imagery over ${place.name}`);
}

function exitLocalImagery() {
  if (!localImagery.active) return;
  localImagery.active = false;
  localImagery.place = null;
  localImagery.drag = null;
  localImagery.tileEls.forEach((tile) => tile.remove());
  localImagery.tileEls.clear();
  ui.imageryScene.classList.remove("active", "dragging");
  ui.app.classList.remove("local-view");
  controls.enabled = true;
}

function renderLocalImagery() {
  if (!localImagery.active || !ui.imageryStage) return;
  if (localImagery.renderQueued) return;
  localImagery.renderQueued = true;
  requestAnimationFrame(() => {
    localImagery.renderQueued = false;
    drawLocalImageryTiles();
  });
}

function drawLocalImageryTiles() {
  if (!localImagery.active || !ui.imageryStage) return;
  const width = ui.imageryScene.clientWidth;
  const height = ui.imageryScene.clientHeight;
  const zoom = localImagery.zoom;
  const center = latLonToGlobalPixel(localImagery.lat, localImagery.lon, zoom);
  const startX = Math.floor((center.x - width / 2) / LOCAL_TILE_SIZE) - 1;
  const endX = Math.floor((center.x + width / 2) / LOCAL_TILE_SIZE) + 1;
  const startY = Math.floor((center.y - height / 2) / LOCAL_TILE_SIZE) - 1;
  const endY = Math.floor((center.y + height / 2) / LOCAL_TILE_SIZE) + 1;
  const maxTile = 2 ** zoom;
  const visible = new Set();

  for (let tileX = startX; tileX <= endX; tileX += 1) {
    for (let tileY = startY; tileY <= endY; tileY += 1) {
      if (tileY < 0 || tileY >= maxTile) continue;
      const wrappedX = ((tileX % maxTile) + maxTile) % maxTile;
      const key = `${zoom}/${wrappedX}/${tileY}/${tileX}`;
      visible.add(key);
      let tile = localImagery.tileEls.get(key);
      if (!tile) {
        tile = document.createElement("img");
        tile.className = "imagery-tile";
        tile.decoding = "async";
        tile.loading = "eager";
        tile.alt = "";
        tile.addEventListener("load", () => tile.classList.add("loaded"), { once: true });
        tile.addEventListener("error", () => handleImageryTileError(tile, zoom, tileY, wrappedX), { once: true });
        tile.src = `${SATELLITE_TILE_ROOT}${zoom}/${tileY}/${wrappedX}`;
        localImagery.tileEls.set(key, tile);
        ui.imageryStage.append(tile);
      }
      const left = tileX * LOCAL_TILE_SIZE - center.x + width / 2;
      const top = tileY * LOCAL_TILE_SIZE - center.y + height / 2;
      tile.style.transform = `translate3d(${left}px, ${top}px, 0)`;
    }
  }

  localImagery.tileEls.forEach((tile, key) => {
    if (!visible.has(key)) {
      tile.remove();
      localImagery.tileEls.delete(key);
    }
  });

  ui.imageryPlace.textContent = localImagery.place ? `${localImagery.place.name} satellite` : "Satellite view";
  ui.imageryCoords.textContent = `${localImagery.lat.toFixed(4)}, ${localImagery.lon.toFixed(4)} • L${zoom} • Esri World Imagery`;
}

function handleImageryTileError(tile, zoom, row, col) {
  if (tile.dataset.fallback === "true" || zoom <= localImagery.minZoom) {
    tile.remove();
    return;
  }
  tile.dataset.fallback = "true";
  tile.addEventListener("load", () => tile.classList.add("loaded"), { once: true });
  tile.src = `${SATELLITE_TILE_ROOT}${zoom - 1}/${Math.floor(row / 2)}/${Math.floor(col / 2)}`;
}

function onImageryPointerDown(event) {
  if (!localImagery.active) return;
  event.preventDefault();
  localImagery.drag = {
    pointerId: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    center: latLonToGlobalPixel(localImagery.lat, localImagery.lon, localImagery.zoom)
  };
  ui.imageryScene.classList.add("dragging");
  ui.imageryScene.setPointerCapture(event.pointerId);
}

function onImageryPointerMove(event) {
  if (!localImagery.active || !localImagery.drag || localImagery.drag.pointerId !== event.pointerId) return;
  event.preventDefault();
  const dx = event.clientX - localImagery.drag.x;
  const dy = event.clientY - localImagery.drag.y;
  const next = globalPixelToLatLon(localImagery.drag.center.x - dx, localImagery.drag.center.y - dy, localImagery.zoom);
  localImagery.lat = next.lat;
  localImagery.lon = next.lon;
  renderLocalImagery();
}

function onImageryPointerUp(event) {
  if (!localImagery.drag || localImagery.drag.pointerId !== event.pointerId) return;
  localImagery.drag = null;
  ui.imageryScene.classList.remove("dragging");
  if (ui.imageryScene.hasPointerCapture(event.pointerId)) ui.imageryScene.releasePointerCapture(event.pointerId);
}

function onImageryWheel(event) {
  if (!localImagery.active) return;
  event.preventDefault();
  zoomLocalImageryAt(event.clientX, event.clientY, event.deltaY < 0 ? 1 : -1);
}

function onImageryDoubleClick(event) {
  if (!localImagery.active) return;
  event.preventDefault();
  zoomLocalImageryAt(event.clientX, event.clientY, 1);
}

function zoomLocalImageryAt(clientX, clientY, direction) {
  const currentZoom = localImagery.zoom;
  const nextZoom = THREE.MathUtils.clamp(currentZoom + direction, localImagery.minZoom, localImagery.maxZoom);
  if (nextZoom === currentZoom) return;
  const rect = ui.imageryScene.getBoundingClientRect();
  const cursorX = clientX - rect.left - rect.width / 2;
  const cursorY = clientY - rect.top - rect.height / 2;
  const oldCenter = latLonToGlobalPixel(localImagery.lat, localImagery.lon, currentZoom);
  const anchor = globalPixelToLatLon(oldCenter.x + cursorX, oldCenter.y + cursorY, currentZoom);
  const newAnchor = latLonToGlobalPixel(anchor.lat, anchor.lon, nextZoom);
  const newCenter = globalPixelToLatLon(newAnchor.x - cursorX, newAnchor.y - cursorY, nextZoom);
  localImagery.zoom = nextZoom;
  localImagery.lat = newCenter.lat;
  localImagery.lon = newCenter.lon;
  localImagery.tileEls.forEach((tile) => tile.remove());
  localImagery.tileEls.clear();
  renderLocalImagery();
}

function createStreetTilePatch(place) {
  clearGroup(earth.streetGroup);
  if (!place) return;

  const profile = getCityProfile(place);
  const zoom = profile.mapZoom || 13;
  const tileRadius = window.innerWidth < 720 ? 1 : 2;
  const mapScale = profile.mapScale || 0.009;
  const centerTile = latLonToTile(place.lat, place.lon, zoom);
  const centerNormal = latLonToVector3(place.lat, place.lon, 1).normalize();
  const frame = localFrame(centerNormal);
  const basis = new THREE.Matrix4().makeBasis(frame.east, frame.north, centerNormal);
  const rotation = new THREE.Quaternion().setFromRotationMatrix(basis);
  const fallbackTexture = createStreetFallbackTexture(place);
  const kmPerLat = 111.32;
  const kmPerLon = Math.max(18, 111.32 * Math.cos(THREE.MathUtils.degToRad(place.lat)));

  for (let dx = -tileRadius; dx <= tileRadius; dx += 1) {
    for (let dy = -tileRadius; dy <= tileRadius; dy += 1) {
      const x = centerTile.x + dx;
      const y = centerTile.y + dy;
      const bounds = tileBounds(x, y, zoom);
      const centerLat = (bounds.north + bounds.south) * 0.5;
      const centerLon = (bounds.west + bounds.east) * 0.5;
      const localX = normalizeLongitudeDelta(centerLon - place.lon) * kmPerLon * mapScale;
      const localY = (centerLat - place.lat) * kmPerLat * mapScale;
      const tileWidth = Math.abs(normalizeLongitudeDelta(bounds.east - bounds.west)) * kmPerLon * mapScale;
      const tileHeight = Math.abs(bounds.north - bounds.south) * kmPerLat * mapScale;
      const material = new THREE.MeshBasicMaterial({
        map: fallbackTexture,
        color: 0xffffff,
        transparent: true,
        opacity: 0.86,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(tileWidth * 0.985, tileHeight * 0.985), material);
      plane.position.copy(localCityPoint(centerNormal, frame, localX, localY, 0.014));
      plane.quaternion.copy(rotation);
      plane.renderOrder = 2;
      plane.userData.streetTile = true;
      earth.streetGroup.add(plane);
      hydrateStreetTileMaterial(material, x, y, zoom);
    }
  }
}

function createCityBuildings(place) {
  clearGroup(earth.buildingGroup);
  if (!state.buildings || !place) return;

  const profile = getCityProfile(place);
  const centerNormal = latLonToVector3(place.lat, place.lon, 1).normalize();
  const frame = localFrame(centerNormal);
  const seed = Math.abs(Math.sin((place.lat + place.lon) * 12.9898) * 43758.5453);
  const materials = createCityMaterials(profile, place);

  addCityRoadNetwork(profile, centerNormal, frame, seed);

  for (let i = 0; i < profile.count; i += 1) {
    const placement = createBuildingPlacement(profile, i, seed);
    if (!placement) continue;

    const geometry = new THREE.BoxGeometry(placement.width, placement.height, placement.depth);
    const material = materials[pickBuildingMaterialIndex(materials.length, seed, i)];
    const building = new THREE.Mesh(geometry, material);
    const normal = localCityNormal(centerNormal, frame, placement.x, placement.y);
    building.position.copy(normal.clone().multiplyScalar(EARTH_RADIUS * 1.018 + placement.height * 0.5));
    building.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
    building.rotateY(placement.rotation);
    building.userData.cityBuilding = true;
    earth.buildingGroup.add(building);

    if (placement.height > profile.height * 0.72) {
      addRoofDetail(building, normal, placement, place.color || "#78e4ff");
    }
  }

  addCityLandmark(profile, place, centerNormal, frame);
  addCityFocusRing(place, centerNormal);
}

function pickBuildingMaterialIndex(materialCount, seed, index) {
  if (materialCount <= 1) return 0;
  const r = seededRandom(seed + index * 43.7);
  if (r > 0.9) return materialCount - 1;
  return Math.floor(r * (materialCount - 1));
}

function getCityProfile(place) {
  const profile = CITY_PROFILES[place?.name] || {};
  return {
    ...DEFAULT_CITY_PROFILE,
    ...profile
  };
}

function createCityMaterials(profile, place) {
  const accent = new THREE.Color(place.color || "#78e4ff");
  return profile.palette.map((color, index) => {
    const base = new THREE.Color(color);
    if (index === profile.palette.length - 1) base.lerp(accent, 0.35);
    return new THREE.MeshStandardMaterial({
      color: base,
      roughness: index % 2 ? 0.48 : 0.28,
      metalness: index % 2 ? 0.18 : 0.44,
      emissive: index === profile.palette.length - 1 ? accent : new THREE.Color(0x000000),
      emissiveIntensity: index === profile.palette.length - 1 ? 0.14 : 0.0,
      transparent: true,
      opacity: 0.92
    });
  });
}

function createBuildingPlacement(profile, index, seed) {
  const r1 = seededRandom(seed + index * 13.1);
  const r2 = seededRandom(seed + index * 17.7);
  const r3 = seededRandom(seed + index * 21.9);
  const r4 = seededRandom(seed + index * 29.3);
  const rx = profile.radiusX;
  const ry = profile.radiusY;
  let x = 0;
  let y = 0;
  let rotation = r4 * Math.PI;
  let heightBias = 1;

  if (profile.layout === "grid") {
    const cols = 13;
    const col = index % cols;
    const row = Math.floor(index / cols);
    x = ((col / (cols - 1)) - 0.5) * rx * 2 + (r1 - 0.5) * 0.004;
    y = ((row / Math.ceil(profile.count / cols)) - 0.5) * ry * 2 + (r2 - 0.5) * 0.004;
    rotation = 0;
    heightBias = 1.45 - Math.min(1, Math.abs(x) / rx + Math.abs(y) / ry) * 0.55;
  } else if (profile.layout === "linear") {
    y = (r1 * 2 - 1) * ry;
    x = (r2 - 0.5) * rx * (0.45 + Math.abs(y / ry) * 0.55) + Math.sin(y * 52) * 0.006;
    rotation = 0.08 + (r3 - 0.5) * 0.28;
    heightBias = 1.9 - Math.min(1, Math.abs(y) / ry) * 0.72;
  } else if (profile.layout === "radial") {
    const ring = Math.floor(index / 22);
    const angle = (index % 22) / 22 * Math.PI * 2 + ring * 0.17;
    const radius = (0.18 + ring * 0.16 + r1 * 0.06) * Math.min(rx, ry);
    x = Math.cos(angle) * radius;
    y = Math.sin(angle) * radius;
    rotation = angle + Math.PI * 0.5;
    heightBias = 1.15 - radius / Math.max(rx, ry) * 0.38;
  } else if (profile.layout === "river") {
    x = (r1 * 2 - 1) * rx;
    const river = Math.sin(x * 45) * 0.012;
    y = (r2 * 2 - 1) * ry;
    if (Math.abs(y - river) < 0.008) y += Math.sign(y - river || 1) * 0.014;
    rotation = (r3 - 0.5) * 0.38;
    heightBias = 1.1 - Math.abs(y) / ry * 0.24;
  } else if (profile.layout === "harbor" || profile.layout === "coastal") {
    const angle = -Math.PI * 0.75 + r1 * Math.PI * 1.2;
    const band = 0.35 + r2 * 0.65;
    x = Math.cos(angle) * rx * band;
    y = Math.sin(angle) * ry * band + Math.sin(x * 38) * 0.01;
    rotation = angle + Math.PI * 0.5;
    heightBias = 1.2 - band * 0.38;
  } else if (profile.layout === "sprawl") {
    x = (r1 * 2 - 1) * rx;
    y = (r2 * 2 - 1) * ry;
    rotation = (Math.round(r3 * 4) * Math.PI) / 8;
    heightBias = 0.7 + Math.exp(-(x * x + y * y) / 0.0014) * 1.15;
  } else {
    const angle = r1 * Math.PI * 2;
    const radius = Math.pow(r2, 0.7) * Math.min(rx, ry);
    x = Math.cos(angle) * radius;
    y = Math.sin(angle) * radius;
    rotation = angle;
    heightBias = 1.0 - radius / Math.max(rx, ry) * 0.3;
  }

  if (Math.abs(x) > rx * 1.08 || Math.abs(y) > ry * 1.08) return null;

  const footprint = 0.0038 + r3 * 0.0055;
  const towerBoost = Math.pow(seededRandom(seed + index * 5.1), profile.layout === "linear" ? 1.1 : 2.2);
  return {
    x,
    y,
    width: footprint * (0.85 + seededRandom(seed + index * 7.4) * 1.15),
    depth: footprint * (0.85 + seededRandom(seed + index * 8.2) * 1.2),
    height: 0.006 + profile.height * (0.16 + towerBoost * heightBias),
    rotation
  };
}

function addCityRoadNetwork(profile, centerNormal, frame, seed) {
  const roadMaterial = new THREE.LineBasicMaterial({
    color: 0xeef8ff,
    transparent: true,
    opacity: 0.32,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const arterialMaterial = roadMaterial.clone();
  arterialMaterial.color.set(0xffcd75);
  arterialMaterial.opacity = 0.42;

  const rx = profile.radiusX;
  const ry = profile.radiusY;
  const roadCount = profile.layout === "grid" ? 9 : 7;

  if (profile.layout === "radial") {
    for (let i = 0; i < 12; i += 1) {
      const angle = (i / 12) * Math.PI * 2;
      addRoadLine(centerNormal, frame, [
        [Math.cos(angle) * rx * 0.08, Math.sin(angle) * ry * 0.08],
        [Math.cos(angle) * rx * 0.96, Math.sin(angle) * ry * 0.96]
      ], i % 3 === 0 ? arterialMaterial : roadMaterial);
    }
    for (let ring = 1; ring <= 3; ring += 1) {
      const points = [];
      for (let step = 0; step <= 72; step += 1) {
        const angle = (step / 72) * Math.PI * 2;
        points.push([Math.cos(angle) * rx * ring * 0.24, Math.sin(angle) * ry * ring * 0.24]);
      }
      addRoadLine(centerNormal, frame, points, ring === 2 ? arterialMaterial : roadMaterial);
    }
    return;
  }

  if (profile.layout === "river") {
    const river = [];
    for (let step = 0; step <= 80; step += 1) {
      const x = -rx + (step / 80) * rx * 2;
      river.push([x, Math.sin(x * 45) * 0.012]);
    }
    const riverMaterial = new THREE.LineBasicMaterial({
      color: 0x78e4ff,
      transparent: true,
      opacity: 0.58,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    addRoadLine(centerNormal, frame, river, riverMaterial, 0.018);
  }

  if (profile.layout === "coastal" || profile.layout === "harbor") {
    const coast = [];
    for (let step = 0; step <= 70; step += 1) {
      const t = step / 70;
      const angle = -Math.PI * 0.75 + t * Math.PI * 1.22;
      coast.push([Math.cos(angle) * rx * 0.95, Math.sin(angle) * ry * 0.85]);
    }
    addRoadLine(centerNormal, frame, coast, arterialMaterial, 0.018);
  }

  for (let i = 0; i < roadCount; i += 1) {
    const t = roadCount === 1 ? 0.5 : i / (roadCount - 1);
    const x = -rx + t * rx * 2;
    const y = -ry + t * ry * 2;
    const xBend = Math.sin(i + seed) * 0.008;
    const yBend = Math.cos(i + seed) * 0.008;
    addRoadLine(centerNormal, frame, [[x + xBend, -ry], [x - xBend, ry]], i % 3 === 0 ? arterialMaterial : roadMaterial);
    addRoadLine(centerNormal, frame, [[-rx, y + yBend], [rx, y - yBend]], i % 4 === 0 ? arterialMaterial : roadMaterial);
  }
}

function addRoadLine(centerNormal, frame, points, material, height = 0.021) {
  const geometry = new THREE.BufferGeometry().setFromPoints(
    points.map(([x, y]) => localCityPoint(centerNormal, frame, x, y, height))
  );
  const line = new THREE.Line(geometry, material);
  line.renderOrder = 3;
  earth.buildingGroup.add(line);
}

function addRoofDetail(building, normal, placement, color) {
  const capMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const cap = new THREE.Mesh(new THREE.BoxGeometry(placement.width * 0.54, 0.0016, placement.depth * 0.54), capMaterial);
  cap.position.copy(building.position.clone().add(normal.clone().multiplyScalar(placement.height * 0.51)));
  cap.quaternion.copy(building.quaternion);
  cap.userData.cityBuilding = true;
  earth.buildingGroup.add(cap);
}

function addCityLandmark(profile, place, centerNormal, frame) {
  if (!CITY_PROFILES[place.name]) return;
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(place.color || "#78e4ff"),
    roughness: 0.2,
    metalness: 0.55,
    emissive: new THREE.Color(place.color || "#78e4ff"),
    emissiveIntensity: 0.22,
    transparent: true,
    opacity: 0.94
  });
  const height = profile.layout === "linear" ? 0.17 : profile.layout === "grid" || profile.layout === "dense" ? 0.105 : 0.075;
  const width = profile.layout === "linear" ? 0.009 : 0.012;
  const normal = localCityNormal(centerNormal, frame, 0, 0);
  const landmark = new THREE.Mesh(new THREE.CylinderGeometry(width * 0.55, width, height, 10), material);
  landmark.position.copy(normal.clone().multiplyScalar(EARTH_RADIUS * 1.018 + height * 0.5));
  landmark.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
  landmark.userData.cityBuilding = true;
  earth.buildingGroup.add(landmark);
}

function addCityFocusRing(place, centerNormal) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.083, 0.0015, 8, 120),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(place.color || "#78e4ff"),
      transparent: true,
      opacity: 0.52,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  ring.position.copy(centerNormal.clone().multiplyScalar(EARTH_RADIUS * 1.024));
  ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), centerNormal);
  ring.userData.pulse = true;
  earth.buildingGroup.add(ring);
}

function localCityPoint(centerNormal, frame, x, y, height = 0.018) {
  return centerNormal
    .clone()
    .multiplyScalar(EARTH_RADIUS + height)
    .add(frame.east.clone().multiplyScalar(x))
    .add(frame.north.clone().multiplyScalar(y));
}

function localCityNormal(centerNormal, frame, x, y) {
  return centerNormal
    .clone()
    .multiplyScalar(EARTH_RADIUS)
    .add(frame.east.clone().multiplyScalar(x))
    .add(frame.north.clone().multiplyScalar(y))
    .normalize();
}

function hydrateStreetTileMaterial(material, x, y, zoom) {
  const n = 2 ** zoom;
  const wrappedX = ((x % n) + n) % n;
  const clampedY = THREE.MathUtils.clamp(y, 0, n - 1);
  const url = `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${clampedY}.png`;
  if (tileTextureCache.has(url)) {
    material.map = tileTextureCache.get(url);
    material.needsUpdate = true;
    return;
  }

  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin("anonymous");
  loader.load(
    url,
    (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      texture.needsUpdate = true;
      tileTextureCache.set(url, texture);
      material.map = texture;
      material.needsUpdate = true;
    },
    undefined,
    () => {
      material.opacity = 0.48;
    }
  );
}

function createStreetFallbackTexture(place) {
  return configureTexture(createCanvasTexture(256, 256, (ctx, width, height) => {
    ctx.fillStyle = "#17202b";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(120, 228, 255, 0.42)";
    ctx.lineWidth = 3;
    for (let i = 0; i < 8; i += 1) {
      const p = (i / 7) * width;
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(width - p * 0.25, height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, p);
      ctx.lineTo(width, height - p * 0.2);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(255, 205, 117, 0.8)";
    ctx.font = "600 20px system-ui";
    ctx.fillText(place.name.slice(0, 18), 16, 132);
  }), true);
}

function latLonToTile(lat, lon, zoom) {
  const n = 2 ** zoom;
  const latRad = THREE.MathUtils.degToRad(THREE.MathUtils.clamp(lat, -85.0511, 85.0511));
  return {
    x: Math.floor(((lon + 180) / 360) * n),
    y: Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n)
  };
}

function latLonToGlobalPixel(lat, lon, zoom) {
  const scale = LOCAL_TILE_SIZE * 2 ** zoom;
  const clampedLat = THREE.MathUtils.clamp(lat, -85.0511, 85.0511);
  const sinLat = Math.sin(THREE.MathUtils.degToRad(clampedLat));
  return {
    x: ((normalizeLongitude(lon) + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale
  };
}

function globalPixelToLatLon(x, y, zoom) {
  const scale = LOCAL_TILE_SIZE * 2 ** zoom;
  const lon = normalizeLongitude((x / scale) * 360 - 180);
  const mercatorY = 0.5 - y / scale;
  const lat = THREE.MathUtils.radToDeg(Math.atan(Math.sinh(mercatorY * 2 * Math.PI)));
  return {
    lat: THREE.MathUtils.clamp(lat, -85.0511, 85.0511),
    lon
  };
}

function tileBounds(x, y, zoom) {
  return {
    west: tileXToLon(x, zoom),
    east: tileXToLon(x + 1, zoom),
    north: tileYToLat(y, zoom),
    south: tileYToLat(y + 1, zoom)
  };
}

function tileXToLon(x, zoom) {
  return (x / 2 ** zoom) * 360 - 180;
}

function tileYToLat(y, zoom) {
  const n = Math.PI - (2 * Math.PI * y) / 2 ** zoom;
  return THREE.MathUtils.radToDeg(Math.atan(Math.sinh(n)));
}

function updateSunFromTime() {
  const now = new Date();
  const hour = state.liveTime ? now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600 : state.manualHour;
  const startOfYear = Date.UTC(now.getUTCFullYear(), 0, 0);
  const dayOfYear = (Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - startOfYear) / 86400000;
  const declination = THREE.MathUtils.degToRad(23.44) * Math.sin((2 * Math.PI * (dayOfYear - 81)) / 365);
  const solarAngle = ((hour - 12) / 24) * Math.PI * 2;
  const horizontal = Math.cos(declination);

  sunDirection.set(Math.cos(solarAngle) * horizontal, Math.sin(declination), Math.sin(solarAngle) * horizontal).normalize();
  sunLight.position.copy(sunDirection).multiplyScalar(10);
  if (earth.sunSprite) earth.sunSprite.position.copy(sunDirection).multiplyScalar(16);
  if (nightMaterial) nightMaterial.uniforms.sunDirection.value.copy(sunDirection);
  if (earth.atmosphere) earth.atmosphere.material.uniforms.sunDirection.value.copy(sunDirection);

  ui.timeLabel.textContent = state.liveTime ? formatUtcTime(now) : `${formatHour(state.manualHour)} UTC`;
  ui.sunLabel.textContent = `Declination ${THREE.MathUtils.radToDeg(declination).toFixed(1)} deg`;
}

function animate(now = 0) {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  if (state.liveTime) updateSunFromTime();
  updateFlight(now);
  updateTour(now);
  if (!activeFlight) controls.update();

  if (earth.clouds?.visible) earth.clouds.rotation.y += delta * 0.012;
  if (earth.weatherGroup.visible) earth.weatherGroup.rotation.y += delta * 0.018;
  if (earth.auroraGroup.visible) {
    earth.auroraGroup.children.forEach((child, index) => {
      child.rotation.z += delta * (index % 2 ? -0.08 : 0.06);
      child.material.opacity = 0.13 + Math.sin(now * 0.0014 + index) * 0.035;
    });
  }
  earth.buildingGroup.children.forEach((child) => {
    if (child.userData.pulse) {
      const scale = 1 + Math.sin(now * 0.0024) * 0.08;
      child.scale.setScalar(scale);
      child.material.opacity = 0.34 + Math.sin(now * 0.0024) * 0.1;
    }
  });

  updateLabels();
  updateRangeReadout();
  renderer.render(scene, camera);
}

function updateLabels() {
  if (!labelEntries.length) return;
  if (localImagery.active) {
    labelEntries.forEach(({ label }) => label.classList.remove("visible"));
    return;
  }
  const labelActive = (state.labels || state.mode === "political") && state.mode !== "clean";
  const width = window.innerWidth;
  const height = window.innerHeight;
  const distance = camera.position.distanceTo(controls.target);
  const cityFocus = Boolean(activePlace) && distance < 1.55;
  const showAll = !cityFocus && (state.mode === "political" || distance < 4.8);

  labelEntries.forEach(({ place, label, position }) => {
    if (!labelActive) {
      label.classList.remove("visible");
      return;
    }

    const world = position.clone();
    const normal = world.clone().normalize();
    const cameraDirection = camera.position.clone().sub(world).normalize();
    const frontFacing = normal.dot(cameraDirection) > 0.08;
    const featured = activePlace && activePlace.name === place.name;
    if (cityFocus && !featured) {
      label.classList.remove("visible");
      return;
    }
    const shouldShow = frontFacing && (showAll || featured || DESTINATIONS.some((dest) => dest.name === place.name));

    if (!shouldShow) {
      label.classList.remove("visible");
      return;
    }

    tmpVec.copy(world).project(camera);
    const x = (tmpVec.x * 0.5 + 0.5) * width;
    const y = (-tmpVec.y * 0.5 + 0.5) * height;

    label.style.left = `${x}px`;
    label.style.top = `${y}px`;
    label.classList.add("visible");
  });
}

function updateRangeReadout() {
  if (localImagery.active) {
    ui.rangeReadout.textContent = "Satellite city";
    return;
  }
  const distance = camera.position.distanceTo(controls.target);
  let label = "Low orbit";
  if (distance > 6.3) label = "Planetary";
  if (distance < 3.15) label = "Regional";
  if (distance < 2.55) label = "City focus";
  ui.rangeReadout.textContent = label;
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isCoarsePointer ? 1.5 : 2));
  renderLocalImagery();
}

function onDoubleClick(event) {
  if (!earth.mesh) return;
  setPointerFromEvent(event);
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObject(earth.mesh, false)[0];
  if (!hit) return;

  const coords = vectorToLatLon(hit.point);
  const place = {
    name: "Selected Coordinate",
    country: "Custom focus",
    lat: coords.lat,
    lon: coords.lon,
    color: "#78e4ff",
    copy: "A custom surface point selected directly from the globe."
  };
  if (state.tour) toggleTour(false);
  flyToPlace(place, { altitude: window.innerWidth < 720 ? 0.54 : 0.38 });
}

function onPointerDown(event) {
  pointerDown = { x: event.clientX, y: event.clientY, time: performance.now() };
}

function onPointerUp(event) {
  if (!pointerDown || !earth.markerGroup.visible) return;
  const moved = Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y);
  const elapsed = performance.now() - pointerDown.time;
  pointerDown = null;
  if (moved > 6 || elapsed > 360) return;

  setPointerFromEvent(event);
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(markerEntries, false);
  if (!hits.length) return;
  const place = hits[0].object.userData.place;
  if (place) {
    if (state.tour) toggleTour(false);
    flyToPlace(place);
  }
}

function setPointerFromEvent(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function toggleTour(forceValue) {
  state.tour = typeof forceValue === "boolean" ? forceValue : !state.tour;
  ui.tourBtn.classList.toggle("active", state.tour);
  ui.tourBtn.textContent = state.tour ? "Touring" : "Tour";
  if (state.tour) {
    controls.autoRotate = false;
    nextTourAt = 0;
    advanceTour();
  }
}

function advanceTour() {
  if (!state.tour || activeFlight) return;
  const place = DESTINATIONS[tourIndex % DESTINATIONS.length];
  tourIndex += 1;
  flyToPlace(place, { duration: 2900 });
}

function updateTour(now) {
  if (state.tour && !activeFlight && now >= nextTourAt) advanceTour();
}

function captureScreenshot() {
  if (localImagery.active) {
    showToast("Browser screenshot is best for satellite city views");
    return;
  }
  try {
    renderer.render(scene, camera);
    const link = document.createElement("a");
    link.download = `astra-terra-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = renderer.domElement.toDataURL("image/png");
    link.click();
    showToast("Screenshot captured");
  } catch {
    showToast("Screenshot unavailable while remote textures are loading");
  }
}

function updateLocationCard(place, view = "Orbital") {
  const target = place || {
    name: "Earth",
    country: "Planetary",
    lat: 0,
    lon: 0,
    copy: "Full-planet view with live sunlight, city lights, atmosphere, clouds, and layered visual modes."
  };
  ui.locationName.textContent = target.name;
  ui.locationCopy.textContent = target.copy;
  ui.locationLat.textContent = `${target.lat.toFixed(2)} deg`;
  ui.locationLon.textContent = `${target.lon.toFixed(2)} deg`;
  ui.locationView.textContent = view;
}

function setActiveCityButton(place) {
  [...ui.cityButtons.children].forEach((button) => {
    button.classList.toggle("active", Boolean(place && button.textContent === place.name));
  });
}

function showToast(message) {
  ui.toast.textContent = message;
  ui.toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => ui.toast.classList.remove("visible"), 2200);
}

function setLoadingProgress(progress, note) {
  ui.loadingBar.style.width = `${Math.max(18, Math.round(progress * 100))}%`;
  ui.loadingNote.textContent = note;
}

function createStarField(count, radius, size, color, opacity) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const baseColor = new THREE.Color(color);
  for (let i = 0; i < count; i += 1) {
    const u = seededRandom(i * 12.17);
    const v = seededRandom(i * 4.91 + 22);
    const theta = u * Math.PI * 2;
    const phi = Math.acos(2 * v - 1);
    const r = radius * (0.82 + seededRandom(i * 9.3) * 0.28);
    const index = i * 3;
    positions[index] = r * Math.sin(phi) * Math.cos(theta);
    positions[index + 1] = r * Math.cos(phi);
    positions[index + 2] = r * Math.sin(phi) * Math.sin(theta);

    const brightness = 0.58 + seededRandom(i * 3.7) * 0.42;
    colors[index] = baseColor.r * brightness;
    colors[index + 1] = baseColor.g * brightness;
    colors[index + 2] = baseColor.b * brightness;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({
    size,
    vertexColors: true,
    transparent: true,
    opacity,
    sizeAttenuation: true,
    depthWrite: false
  });
  return new THREE.Points(geometry, material);
}

function createNebulaMist() {
  const group = new THREE.Group();
  const material = new THREE.LineBasicMaterial({
    color: 0x78e4ff,
    transparent: true,
    opacity: 0.08,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  for (let i = 0; i < 18; i += 1) {
    const points = [];
    const baseLat = -52 + i * 6;
    for (let step = 0; step < 50; step += 1) {
      const t = step / 49;
      const lat = baseLat + Math.sin(t * Math.PI * 2 + i) * 4;
      const lon = -180 + t * 360;
      points.push(latLonToVector3(lat, lon, 18 + (i % 5)));
    }
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material));
  }
  group.rotation.set(0.7, -0.35, 0.24);
  return group;
}

function createRadialSpriteTexture(inner, outer) {
  const canvasEl = document.createElement("canvas");
  canvasEl.width = 256;
  canvasEl.height = 256;
  const ctx = canvasEl.getContext("2d");
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, inner);
  gradient.addColorStop(0.12, "rgba(255, 245, 210, 0.96)");
  gradient.addColorStop(0.38, outer);
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  return configureTexture(new THREE.CanvasTexture(canvasEl), true);
}

function createFallbackDayTexture() {
  return createCanvasTexture(1536, 768, (ctx, width, height) => {
    const ocean = ctx.createLinearGradient(0, 0, width, height);
    ocean.addColorStop(0, "#133a63");
    ocean.addColorStop(0.45, "#0d5d7a");
    ocean.addColorStop(1, "#071c39");
    ctx.fillStyle = ocean;
    ctx.fillRect(0, 0, width, height);

    const blobs = [
      [-104, 44, 0.16, 0.32, "#5f8357"], [-61, -14, 0.13, 0.28, "#658558"],
      [18, 4, 0.18, 0.30, "#778651"], [78, 46, 0.31, 0.23, "#8c8f5c"],
      [105, -26, 0.17, 0.15, "#8a7f51"], [-42, 72, 0.12, 0.08, "#d9e3df"],
      [134, -74, 0.42, 0.06, "#eef5f4"]
    ];
    blobs.forEach(([lon, lat, sx, sy, color], index) => drawContinentBlob(ctx, width, height, lon, lat, sx, sy, color, index));

    ctx.globalAlpha = 0.18;
    for (let i = 0; i < 280; i += 1) {
      const x = seededRandom(i * 9.7) * width;
      const y = seededRandom(i * 2.4) * height;
      ctx.fillStyle = seededRandom(i) > 0.58 ? "#f4d9a5" : "#314d35";
      ctx.beginPath();
      ctx.ellipse(x, y, 12 + seededRandom(i + 2) * 24, 3 + seededRandom(i + 3) * 9, seededRandom(i + 4) * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });
}

function createFallbackNightTexture() {
  return createCanvasTexture(1536, 768, (ctx, width, height) => {
    ctx.fillStyle = "#020306";
    ctx.fillRect(0, 0, width, height);
    SEARCH_PLACES.forEach((place, index) => {
      const [x, y] = latLonToTexturePoint(place.lat, place.lon, width, height);
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 45);
      gradient.addColorStop(0, "rgba(255, 222, 143, 0.95)");
      gradient.addColorStop(0.22, "rgba(255, 183, 92, 0.42)");
      gradient.addColorStop(1, "rgba(255, 183, 92, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(x - 50, y - 50, 100, 100);

      ctx.fillStyle = "rgba(255, 236, 180, 0.8)";
      for (let i = 0; i < 30; i += 1) {
        const angle = seededRandom(index * 100 + i) * Math.PI * 2;
        const r = Math.pow(seededRandom(index * 200 + i), 0.55) * 34;
        ctx.fillRect(x + Math.cos(angle) * r, y + Math.sin(angle) * r, 1.4, 1.4);
      }
    });
  });
}

function createFallbackCloudTexture() {
  return createCanvasTexture(1024, 512, (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < 180; i += 1) {
      const x = seededRandom(i * 2.4) * width;
      const y = seededRandom(i * 5.7) * height;
      const rx = 34 + seededRandom(i * 8.1) * 92;
      const ry = 8 + seededRandom(i * 3.9) * 24;
      ctx.fillStyle = `rgba(255,255,255,${0.05 + seededRandom(i) * 0.18})`;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, seededRandom(i * 1.3) * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function createFallbackSpecularTexture() {
  return createCanvasTexture(1024, 512, (ctx, width, height) => {
    ctx.fillStyle = "#f5f5f5";
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 0.82;
    [
      [-104, 44, 0.16, 0.32], [-61, -14, 0.13, 0.28],
      [18, 4, 0.18, 0.30], [78, 46, 0.31, 0.23], [105, -26, 0.17, 0.15]
    ].forEach(([lon, lat, sx, sy], index) => drawContinentBlob(ctx, width, height, lon, lat, sx, sy, "#111111", index));
    ctx.globalAlpha = 1;
  });
}

function createFallbackNormalTexture() {
  return createCanvasTexture(1024, 512, (ctx, width, height) => {
    ctx.fillStyle = "rgb(128,128,255)";
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 0.16;
    for (let i = 0; i < 420; i += 1) {
      const x = seededRandom(i * 3.1) * width;
      const y = seededRandom(i * 7.3) * height;
      ctx.fillStyle = seededRandom(i) > 0.5 ? "rgb(166,166,255)" : "rgb(92,92,228)";
      ctx.beginPath();
      ctx.ellipse(x, y, 8 + seededRandom(i + 1) * 28, 2 + seededRandom(i + 2) * 9, seededRandom(i + 3) * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });
}

function createBorderTexture() {
  return configureTexture(createCanvasTexture(2048, 1024, (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(160, 226, 255, 0.34)";
    ctx.lineWidth = 1.2;
    for (let lon = -180; lon <= 180; lon += 30) {
      const x = ((lon + 180) / 360) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let lat = -60; lat <= 60; lat += 15) {
      const y = ((90 - lat) / 180) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 16; i += 1) {
      ctx.beginPath();
      const startLon = -170 + seededRandom(i) * 340;
      const startLat = -54 + seededRandom(i + 20) * 108;
      for (let step = 0; step < 22; step += 1) {
        const lon = startLon + step * (5 + seededRandom(i + step) * 4);
        const lat = startLat + Math.sin(step * 0.8 + i) * (4 + seededRandom(i * 3) * 7);
        const [x, y] = latLonToTexturePoint(lat, lon, width, height);
        if (step === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }), false);
}

function createTerrainLineTexture() {
  return configureTexture(createCanvasTexture(2048, 1024, (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    for (let band = 0; band < 34; band += 1) {
      const yBase = (band / 34) * height;
      ctx.beginPath();
      for (let x = 0; x <= width; x += 16) {
        const y = yBase + Math.sin(x * 0.011 + band * 1.7) * (8 + (band % 5) * 2);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = band % 3 === 0 ? "rgba(255, 216, 140, 0.38)" : "rgba(120, 228, 255, 0.18)";
      ctx.lineWidth = band % 3 === 0 ? 1.3 : 0.8;
      ctx.stroke();
    }
  }), false);
}

function createCanvasTexture(width, height, draw) {
  const canvasEl = document.createElement("canvas");
  canvasEl.width = width;
  canvasEl.height = height;
  const ctx = canvasEl.getContext("2d");
  draw(ctx, width, height);
  return new THREE.CanvasTexture(canvasEl);
}

function drawContinentBlob(ctx, width, height, lon, lat, sx, sy, color, seed) {
  const [cx, cy] = latLonToTexturePoint(lat, lon, width, height);
  const rx = sx * width;
  const ry = sy * height;
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i <= 40; i += 1) {
    const a = (i / 40) * Math.PI * 2;
    const jitter = 0.72 + seededRandom(seed * 41 + i * 2.9) * 0.44;
    const x = cx + Math.cos(a) * rx * jitter;
    const y = cy + Math.sin(a) * ry * (0.72 + seededRandom(seed * 17 + i) * 0.36);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function latLonToTexturePoint(lat, lon, width, height) {
  const wrappedLon = ((((lon + 180) % 360) + 360) % 360) - 180;
  return [((wrappedLon + 180) / 360) * width, ((90 - lat) / 180) * height];
}

function latLonToVector3(lat, lon, radius) {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lon + 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function vectorToLatLon(vector) {
  const normal = vector.clone().normalize();
  const lat = 90 - THREE.MathUtils.radToDeg(Math.acos(THREE.MathUtils.clamp(normal.y, -1, 1)));
  let lon = THREE.MathUtils.radToDeg(Math.atan2(normal.z, -normal.x)) - 180;
  if (lon < -180) lon += 360;
  if (lon > 180) lon -= 360;
  return { lat, lon };
}

function localFrame(normal) {
  const pole = new THREE.Vector3(0, 1, 0);
  let east = pole.clone().cross(normal);
  if (east.lengthSq() < 0.00001) east = new THREE.Vector3(1, 0, 0);
  east.normalize();
  const north = normal.clone().cross(east).normalize();
  return { east, north };
}

function slerpUnitVectors(start, end, t) {
  const dot = THREE.MathUtils.clamp(start.dot(end), -1, 1);
  if (dot > 0.9995) return start.clone().lerp(end, t).normalize();
  const theta = Math.acos(dot) * t;
  const relative = end.clone().sub(start.clone().multiplyScalar(dot)).normalize();
  return start.clone().multiplyScalar(Math.cos(theta)).add(relative.multiplyScalar(Math.sin(theta))).normalize();
}

function lerpLongitude(a, b, t) {
  let delta = b - a;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return a + delta * t;
}

function normalizeLongitudeDelta(delta) {
  let value = delta;
  while (value > 180) value -= 360;
  while (value < -180) value += 360;
  return value;
}

function normalizeLongitude(lon) {
  return ((((lon + 180) % 360) + 360) % 360) - 180;
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function seededRandom(seed) {
  const value = Math.sin(seed * 12.9898) * 43758.5453123;
  return value - Math.floor(value);
}

function formatUtcTime(date) {
  return `${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")} UTC`;
}

function formatHour(hour) {
  let whole = Math.floor(hour);
  let minutes = Math.round((hour - whole) * 60);
  if (minutes >= 60) {
    minutes = 0;
    whole = (whole + 1) % 24;
  }
  return `${String(whole).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function clearGroup(group) {
  group.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach((material) => material.dispose());
      } else {
        child.material.dispose();
      }
    }
  });
  group.clear();
}

function startAmbientSound() {
  if (audioRig) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    showToast("Audio is not supported in this browser");
    state.sound = false;
    const input = ui.toggles.querySelector('[data-toggle="sound"]');
    if (input) input.checked = false;
    return;
  }

  const ctx = new AudioContextClass();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  const oscA = ctx.createOscillator();
  const oscB = ctx.createOscillator();

  filter.type = "lowpass";
  filter.frequency.value = 420;
  gain.gain.value = 0.0001;
  oscA.type = "sine";
  oscB.type = "triangle";
  oscA.frequency.value = 52;
  oscB.frequency.value = 78;
  oscA.connect(filter);
  oscB.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  oscA.start();
  oscB.start();
  gain.gain.exponentialRampToValueAtTime(0.025, ctx.currentTime + 0.8);
  audioRig = { ctx, gain, oscA, oscB };
}

function stopAmbientSound() {
  if (!audioRig) return;
  const { ctx, gain, oscA, oscB } = audioRig;
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
  window.setTimeout(() => {
    oscA.stop();
    oscB.stop();
    ctx.close();
  }, 260);
  audioRig = null;
}
