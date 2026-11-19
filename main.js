import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createTonkatsuSystem } from './tonkatsu.js';

// Scene
const scene = new THREE.Scene();

// 배경 사진
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
    console.error('배경 사진 로딩 실패! 파일 경로를 확인해 주세요.', error);
  },
);

// Camera
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);

camera.position.set(-20, 8, 18);

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#webgl'),
  antialias: true,
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Orbit Controls
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

// 돈까스 시스템 연결
const tonkatsuSystem = createTonkatsuSystem(scene, camera, renderer.domElement);

// Light
const ambientLight = new THREE.AmbientLight(0xffffff, 2);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);

// 튀김기 사진 로딩
const loader = new THREE.TextureLoader();

loader.load(
  './image/bg.jpg',
  (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;

    const imageWidth = texture.image.width;
    const imageHeight = texture.image.height;

    const aspectRatio = imageWidth / imageHeight;

    const planeWidth = 54;
    const planeHeight = planeWidth / aspectRatio;

    const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      side: THREE.DoubleSide,
      roughness: 0.8,
    });

    const fryerPhoto = new THREE.Mesh(geometry, material);

    fryerPhoto.rotation.x = -Math.PI / 2;
    fryerPhoto.position.set(0, 0, 1.5);

    scene.add(fryerPhoto);

    // ★ 사진이 실제로 로딩된 후 돈까스 시스템에 전달
    tonkatsuSystem.setFryerPhoto(fryerPhoto);

    console.log('튀김기 사진 로딩 성공!');
  },
  undefined,
  (error) => {
    console.error('튀김기 사진 로딩 실패! 파일 경로를 확인해 주세요.', error);
  },
);

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.05);

  controls.update();

  tonkatsuSystem.update(delta);

  renderer.render(scene, camera);
}

animate();
