import * as THREE from "three";

/*
 * 첫 화면 히어로의 3D 지구 장면 (Figma Make `design/extra/landing/src/EarthScene.tsx`를 옮김, `plans/about-revise.md` 9-4).
 * React를 모르는 명령형 모듈이다. `createEarthScene`이 장면을 붙이고, 돌려준 함수가 모두 정리한다.
 * 파일 이름을 `EarthScene.tsx`와 대소문자만 다르게 두지 않는다(macOS에서 `./EarthScene`이 이 파일로 풀릴 수 있다).
 * 움직임: 지구 자전, 관측 위성 두 대 공전. 화면 밖·탭 숨김·움직임 줄이기면 멈춘 한 장면만 그린다.
 * 사진을 받지 못하거나 WebGL 컨텍스트를 잃으면 그리기를 멈추고 `error`를 알린다(빈 지구 대신 안내 문구).
 */

/** 지구 표면 사진(NASA Blue Marble, `public/assets/earth/SOURCE.md`) */
const TEXTURE_PATH = "/assets/earth/blue-marble-january-2048.jpg";

/*
 * 장면 색 (10절 ⑦: 디자인 토큰 예외). 사진 질감·조명·금속 재질의 값이라 화면 역할 색(토큰)과 뜻이 다르다.
 * 테마가 바뀌어도 그대로다. 값은 Make 원본 그대로다.
 */
const SCENE_COLORS = {
  earthBase: 0xffffff,
  atmosphereRgb: "0.22, 0.55, 0.9",
  orbitLine: 0x9cc9da,
  satelliteBody: 0x92999e,
  satelliteDarkMetal: 0x59636a,
  satellitePanel: 0x142a39,
  observationCone: 0xc5f5f1,
  footprint: 0xd4faf7,
  ambientLight: 0x162534,
  keyLight: 0xe8f2ff,
} as const;

/** 처음에 동아시아(한국)가 보이도록 돌려 둔 각도 */
const INITIAL_EAST_ASIA_ROTATION = 2.49;
const ROTATION_PERIOD_SECONDS = 75;
const ORBIT_PERIOD_SECONDS = 52;
const SECOND_ORBIT_PERIOD_SECONDS = 64;

const ATMOSPHERE_VERTEX_SHADER = `
  varying vec3 vViewNormal;
  void main() {
    vViewNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ATMOSPHERE_FRAGMENT_SHADER = `
  varying vec3 vViewNormal;
  void main() {
    float rim = pow(clamp(0.72 - vViewNormal.z, 0.0, 1.0), 3.2);
    gl_FragColor = vec4(${SCENE_COLORS.atmosphereRgb}, rim * 0.38);
  }
`;

export type EarthStatus = "loading" | "ready" | "error";

type Orbit = { radius: number; tilt: THREE.Euler };

function orbitLine(orbit: Orbit, opacity: number): THREE.LineLoop {
  const points = Array.from({ length: 128 }, (_, index) => {
    const angle = (index / 128) * Math.PI * 2;
    return new THREE.Vector3(Math.cos(angle) * orbit.radius, 0, Math.sin(angle) * orbit.radius).applyEuler(orbit.tilt);
  });
  const material = new THREE.LineBasicMaterial({
    color: SCENE_COLORS.orbitLine,
    transparent: true,
    opacity,
    depthWrite: false,
  });
  return new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points), material);
}

/** 몸체·태양 전지판 두 장·센서·관측 원뿔로 된 위성 한 대 */
function buildSatellite(): THREE.Group {
  const satellite = new THREE.Group();
  const body = new THREE.MeshStandardMaterial({ color: SCENE_COLORS.satelliteBody, metalness: 0.78, roughness: 0.38 });
  const darkMetal = new THREE.MeshStandardMaterial({
    color: SCENE_COLORS.satelliteDarkMetal,
    metalness: 0.65,
    roughness: 0.42,
  });
  const panelMaterial = new THREE.MeshStandardMaterial({
    color: SCENE_COLORS.satellitePanel,
    metalness: 0.24,
    roughness: 0.58,
  });

  satellite.add(new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.058, 0.078), body));
  for (const x of [-0.086, 0.086]) {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.066, 0.05, 0.008), darkMetal);
    frame.position.set(x, 0, -0.002);
    satellite.add(frame);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.044, 0.01), panelMaterial);
    panel.position.x = x;
    satellite.add(panel);
    const divider = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.047, 0.01), darkMetal);
    divider.position.set(x, 0, -0.001);
    satellite.add(divider);
  }

  const sensor = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.024, 0.028, 16), darkMetal);
  sensor.rotation.x = Math.PI / 2;
  sensor.position.z = 0.052;
  satellite.add(sensor);

  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(0.075, 0.38, 24, 1, true),
    new THREE.MeshBasicMaterial({
      color: SCENE_COLORS.observationCone,
      transparent: true,
      opacity: 0.028,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  cone.rotation.x = -Math.PI / 2;
  cone.position.z = 0.25;
  satellite.add(cone);
  return satellite;
}

function buildFootprint(): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.CircleGeometry(0.082, 32),
    new THREE.MeshBasicMaterial({
      color: SCENE_COLORS.footprint,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
}

/** 위성을 궤도의 `angle` 자리에 두고 지구 중심을 보게 한다. 그 아래 지표에 관측 자국을 둔다. */
function placeSatellite(body: THREE.Group, footprint: THREE.Mesh, angle: number, orbit: Orbit) {
  const position = new THREE.Vector3(Math.cos(angle) * orbit.radius, 0, Math.sin(angle) * orbit.radius).applyEuler(
    orbit.tilt,
  );
  body.position.copy(position);
  body.lookAt(0, 0, 0);
  footprint.position.copy(position.clone().normalize().multiplyScalar(1.208));
  footprint.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), footprint.position.clone().normalize());
}

function createRenderer(): THREE.WebGLRenderer | null {
  try {
    return new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch {
    // WebGL을 쓸 수 없는 브라우저. 화면을 막지 않고 지구 자리에 안내만 남긴다
    return null;
  }
}

/** 장면 안의 모든 형상·재질을 한 번씩 정리한다(복제한 위성은 원본과 자원을 함께 쓴다). */
function disposeScene(scene: THREE.Scene) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
      geometries.add(object.geometry);
      const list: THREE.Material[] = Array.isArray(object.material) ? object.material : [object.material];
      list.forEach((material) => materials.add(material));
    }
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
}

/**
 * `mount` 안에 캔버스를 붙여 지구 장면을 그린다. 표면 사진을 받으면 `ready`, 실패하면 `error`를 알린다.
 * 돌려준 함수는 움직임·관찰자·WebGL 컨텍스트를 모두 정리한다(화면 왕복·StrictMode 두 번 마운트에도 컨텍스트가 쌓이지 않게).
 * 만드는 도중 예외가 나면(오래된 브라우저에 관찰자가 없는 경우 등) 그때까지 만든 것만 풀고 `error`를 알린다.
 */
export function createEarthScene(mount: HTMLElement, onStatus: (status: EarthStatus) => void): () => void {
  const renderer = createRenderer();
  if (renderer === null) {
    onStatus("error");
    return () => undefined;
  }

  /** 만든 순서대로 쌓고 거꾸로 푼다. WebGL 컨텍스트는 맨 처음에 쌓여 맨 마지막에 풀린다 */
  const disposers: (() => void)[] = [
    () => {
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  ];
  const disposeAll = () => {
    for (let dispose = disposers.pop(); dispose !== undefined; dispose = disposers.pop()) dispose();
  };

  try {
    startScene(renderer, mount, onStatus, disposers);
  } catch {
    disposeAll();
    onStatus("error");
    return () => undefined;
  }
  return disposeAll;
}

function startScene(
  renderer: THREE.WebGLRenderer,
  mount: HTMLElement,
  onStatus: (status: EarthStatus) => void,
  disposers: (() => void)[],
) {
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.domElement.setAttribute("aria-hidden", "true");
  renderer.domElement.className = "block size-full";
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 5.75);

  const axialGroup = new THREE.Group();
  axialGroup.rotation.z = -THREE.MathUtils.degToRad(18);
  scene.add(axialGroup);

  const earthMaterial = new THREE.MeshStandardMaterial({
    color: SCENE_COLORS.earthBase,
    roughness: 0.88,
    metalness: 0.01,
  });
  const earth = new THREE.Mesh(new THREE.SphereGeometry(1.2, 96, 64), earthMaterial);
  earth.rotation.y = INITIAL_EAST_ASIA_ROTATION;
  axialGroup.add(earth);

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(1.225, 96, 64),
    new THREE.ShaderMaterial({
      vertexShader: ATMOSPHERE_VERTEX_SHADER,
      fragmentShader: ATMOSPHERE_FRAGMENT_SHADER,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide,
    }),
  );
  axialGroup.add(atmosphere);

  const firstOrbit: Orbit = { radius: 1.64, tilt: new THREE.Euler(-0.45, 0, 0.18) };
  const secondOrbit: Orbit = { radius: 1.72, tilt: new THREE.Euler(-1.15, 0.25, -0.6) };
  scene.add(orbitLine(firstOrbit, 0.075));
  scene.add(orbitLine(secondOrbit, 0.055));

  const satellite = buildSatellite();
  const footprint = buildFootprint();
  const secondSatellite = satellite.clone(true);
  secondSatellite.scale.setScalar(0.94);
  const secondFootprint = footprint.clone();
  scene.add(satellite, footprint, secondSatellite, secondFootprint);

  scene.add(new THREE.AmbientLight(SCENE_COLORS.ambientLight, 0.42));
  const keyLight = new THREE.DirectionalLight(SCENE_COLORS.keyLight, 3.1);
  keyLight.position.set(-4.2, 3.2, 2.2);
  scene.add(keyLight);

  /** 정리가 시작됨(늦게 온 사진·컨텍스트 소실 알림을 무시한다) */
  let disposed = false;
  /** 사진 실패·컨텍스트 소실. 안내 문구가 뜬 뒤에는 그리지 않는다 */
  let failed = false;
  let surfaceTexture: THREE.Texture | undefined;
  disposers.push(() => {
    disposed = true;
    surfaceTexture?.dispose();
    disposeScene(scene);
  });

  let previousFrameTime: number | null = null;
  let animationFrame = 0;
  let orbitAngle = 0.42;
  let secondOrbitAngle = 2.1;
  let isInView = true;
  disposers.push(() => window.cancelAnimationFrame(animationFrame));

  const fail = () => {
    if (disposed) return;
    failed = true;
    window.cancelAnimationFrame(animationFrame);
    onStatus("error");
  };

  new THREE.TextureLoader().load(
    TEXTURE_PATH,
    (texture) => {
      // 이미 정리했거나 컨텍스트를 잃었으면(안내 문구가 떠 있음) 늦게 온 사진은 버린다
      if (disposed || failed) {
        texture.dispose();
        return;
      }
      surfaceTexture = texture;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      texture.wrapS = THREE.RepeatWrapping;
      texture.needsUpdate = true;
      earthMaterial.map = texture;
      earthMaterial.needsUpdate = true;
      onStatus("ready");
      renderer.render(scene, camera);
    },
    undefined,
    fail,
  );

  // GPU 초기화·메모리 부족으로 컨텍스트를 잃으면 빈 캔버스 대신 안내 문구를 띄운다
  const canvas = renderer.domElement;
  canvas.addEventListener("webglcontextlost", fail);
  disposers.push(() => canvas.removeEventListener("webglcontextlost", fail));

  const resize = () => {
    const width = mount.clientWidth;
    const height = mount.clientHeight;
    if (width === 0 || height === 0 || failed) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  };
  const resizeObserver = new ResizeObserver(resize);
  disposers.push(() => resizeObserver.disconnect());
  resizeObserver.observe(mount);
  resize();

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const placeSatellites = () => {
    placeSatellite(satellite, footprint, orbitAngle, firstOrbit);
    placeSatellite(secondSatellite, secondFootprint, secondOrbitAngle, secondOrbit);
  };
  const shouldAnimate = () => !failed && isInView && !document.hidden && !reduceMotion.matches;

  const frame = (time: number) => {
    if (!shouldAnimate()) return;
    const delta = previousFrameTime === null ? 0 : Math.min((time - previousFrameTime) / 1000, 0.1);
    previousFrameTime = time;
    earth.rotation.y += (Math.PI * 2 * delta) / ROTATION_PERIOD_SECONDS;
    orbitAngle += (Math.PI * 2 * delta) / ORBIT_PERIOD_SECONDS;
    secondOrbitAngle += (Math.PI * 2 * delta) / SECOND_ORBIT_PERIOD_SECONDS;
    placeSatellites();
    renderer.render(scene, camera);
    animationFrame = window.requestAnimationFrame(frame);
  };

  /** 보임·탭·움직임 설정이 바뀌면 지금 장면을 한 번 그리고, 움직여도 되면 다시 돌린다 */
  const reconcile = () => {
    window.cancelAnimationFrame(animationFrame);
    if (failed) return;
    placeSatellites();
    renderer.render(scene, camera);
    if (shouldAnimate()) {
      previousFrameTime = null;
      animationFrame = window.requestAnimationFrame(frame);
    }
  };

  const intersectionObserver = new IntersectionObserver(
    (entries) => {
      isInView = entries.some((entry) => entry.isIntersecting);
      reconcile();
    },
    { threshold: 0.01 },
  );
  disposers.push(() => intersectionObserver.disconnect());
  intersectionObserver.observe(mount);
  document.addEventListener("visibilitychange", reconcile);
  disposers.push(() => document.removeEventListener("visibilitychange", reconcile));
  reduceMotion.addEventListener("change", reconcile);
  disposers.push(() => reduceMotion.removeEventListener("change", reconcile));
  reconcile();
}
