import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createTonkatsuSystem } from './tonkatsu.js';

// =====================================
// 1. 모바일 여부 확인
// =====================================

const isMobile = window.matchMedia('(max-width: 768px)').matches;

// =====================================
// 2. Scene
// =====================================

const scene = new THREE.Scene();

// =====================================
// 3. 배경 사진
// =====================================

const bgLoader = new THREE.TextureLoader();

bgLoader.load(
  './image/backg.jpg',
  (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    scene.background = texture;

    console.log('배경 사진 로딩 성공!');
  },
  undefined,
  (error) => {
    console.error('배경 사진 로딩 실패!', error);
  },
);

// =====================================
// 4. Camera
// =====================================

// PC와 모바일의 화각 분리
const camera = new THREE.PerspectiveCamera(
  isMobile ? 55 : 40,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);

// PC 카메라 위치는 기존 그대로 유지
if (isMobile) {
  // 모바일에서는 정면에 가깝게 조정
  camera.position.set(-27, 10, 20);
} else {
  camera.position.set(-20, 5, 18);
}

// =====================================
// 5. Renderer
// =====================================

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#webgl'),
  antialias: true,
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// =====================================
// 6. Orbit Controls
// =====================================

const controls = new OrbitControls(camera, renderer.domElement);

controls.enableDamping = true;
controls.dampingFactor = 0.05;

controls.enableZoom = true;
controls.enableRotate = true;
controls.enablePan = true;

controls.minDistance = 3;
controls.maxDistance = 30;

controls.target.set(0, 2.5, 0);
controls.update();

// =====================================
// 7. 돈까스 시스템 연결
// =====================================

const tonkatsuSystem = createTonkatsuSystem(scene, camera, renderer.domElement);

// =====================================
// 8. Light
// =====================================

const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);

scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2);

directionalLight.position.set(5, 10, 5);
directionalLight.castShadow = true;

directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;

directionalLight.shadow.camera.left = -30;
directionalLight.shadow.camera.right = 30;
directionalLight.shadow.camera.top = 30;
directionalLight.shadow.camera.bottom = -30;

directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;

directionalLight.shadow.bias = -0.0005;
directionalLight.shadow.radius = 4;

directionalLight.shadow.camera.updateProjectionMatrix();

scene.add(directionalLight);

// =====================================
// 9. 튀김기 사진 로딩
// =====================================

const loader = new THREE.TextureLoader();

loader.load(
  './image/bg.jpg',
  (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;

    const imageWidth = texture.image.width;
    const imageHeight = texture.image.height;

    const aspectRatio = imageWidth / imageHeight;

    const planeWidth = 40;
    const planeHeight = planeWidth / aspectRatio;

    const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      side: THREE.DoubleSide,
      roughness: 0.8,
    });

    const fryerPhoto = new THREE.Mesh(geometry, material);

    // 튀김기 사진을 바닥에 눕히는 설정
    fryerPhoto.rotation.x = -Math.PI / 2;

    // 기존 위치 유지
    fryerPhoto.position.set(0, 0, 1.5);

    fryerPhoto.receiveShadow = true;

    scene.add(fryerPhoto);

    tonkatsuSystem.setFryerPhoto(fryerPhoto);

    console.log('튀김기 사진 로딩 성공!');
  },
  undefined,
  (error) => {
    console.error('튀김기 사진 로딩 실패!', error);
  },
);

// =====================================
// 10. Resize
// =====================================

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;

  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// =====================================
// 11. Animation
// =====================================

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.05);

  controls.update();

  tonkatsuSystem.update(delta);

  renderer.render(scene, camera);
}

animate();

// =====================================
// 12. 호까스 생성 시 튀김 소리 재생
// =====================================

const fryingSound = document.querySelector('#fryingSound');

let isFryingSoundStarted = false;

window.addEventListener('tonkatsu-created', () => {
  if (isFryingSoundStarted) return;

  // 첫 호까스 생성 시에만 재생
  isFryingSoundStarted = true;

  fryingSound.currentTime = 0;

  fryingSound
    .play()
    .then(() => {
      console.log('튀김 소리 재생 시작!');
    })
    .catch((error) => {
      console.error('튀김 소리 재생 실패:', error);

      isFryingSoundStarted = false;
    });
});

// =====================================
// 13. 돼지 버튼 클릭 시 생일 편지 팝업
// =====================================

const soundButton = document.querySelector('#soundButton');

soundButton.addEventListener('click', () => {
  const isMobile = window.matchMedia('(max-width: 768px)').matches;

  if (isMobile) {
    // 모바일에서는 현재 탭에서 편지 페이지 열기
    window.location.href = './letter.html';
  } else {
    // PC에서는 기존 팝업 방식 유지
    const w = 600;
    const h = 700;
    const left = Math.round((screen.width - w) / 2);
    const top = Math.round((screen.height - h) / 2);

    window.open(
      './letter.html',
      'birthdayLetter',
      `width=${w},height=${h},left=${left},top=${top}`,
    );
  }
});
