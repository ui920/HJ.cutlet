import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeacf03);

// Camera
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);

camera.position.set(0, 7, 10);

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
controls.maxDistance = 25;

// Light
const ambientLight = new THREE.AmbientLight(0xffffff, 2);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);

// Texture Loader
const loader = new THREE.TextureLoader();

loader.load('./image/bg.jpg', (texture) => {
  texture.colorSpace = THREE.SRGBColorSpace;

  const imageWidth = texture.image.width;
  const imageHeight = texture.image.height;

  const aspectRatio = imageWidth / imageHeight;

  // 사진 비율 유지
  const planeWidth = 8;
  const planeHeight = planeWidth / aspectRatio;

  // 사진을 입힌 3D 평면
  const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);

  const material = new THREE.MeshStandardMaterial({
    map: texture,
    side: THREE.DoubleSide,
    roughness: 0.8,
  });

  const fryerPhoto = new THREE.Mesh(geometry, material);

  // 바닥에 눕혀 배치
  fryerPhoto.rotation.x = -Math.PI / 2;
  fryerPhoto.position.y = 0;

  scene.add(fryerPhoto);
});

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation
function animate() {
  requestAnimationFrame(animate);

  controls.update();
  renderer.render(scene, camera);
}

animate();
