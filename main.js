import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createTonkatsuSystem } from './tonkatsu.js';

// =====================================
// 1. Scene
// =====================================

const scene = new THREE.Scene();

// =====================================
// 2. 배경 사진
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
// 3. 모바일 화면 확인
// =====================================

const mobileQuery = window.matchMedia('(max-width: 768px)');

let isMobile = mobileQuery.matches;

// =====================================
// 4. Camera
// =====================================

const camera = new THREE.PerspectiveCamera(
  isMobile ? 55 : 40,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);

// PC와 모바일 카메라 위치 분리
if (isMobile) {
  // 모바일: 위에서 내려다보는 구도
  camera.position.set(-20, 17, 19.8);
} else {
  // PC: 기존 구도 유지
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

// 그림자 활성화
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
controls.maxDistance = isMobile ? 45 : 30;

controls.target.set(0, 2.5, 0);

controls.update();

// =====================================
// 7. 모바일 카메라 설정
// =====================================

function updateResponsiveCamera() {
  const nowMobile = mobileQuery.matches;

  // PC와 모바일 화면이 전환되었을 때만 카메라 위치 변경
  if (nowMobile !== isMobile) {
    isMobile = nowMobile;

    if (isMobile) {
      // 모바일 카메라
      camera.fov = 55;
      camera.position.set(-15, 28, 32);

      controls.maxDistance = 45;
    } else {
      // PC 카메라: 기존 구도 유지
      camera.fov = 40;
      camera.position.set(-20, 5, 18);

      controls.maxDistance = 30;
    }

    controls.target.set(0, 2.5, 0);

    controls.update();
  }

  // 화면 비율 업데이트
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

// =====================================
// 8. 돈까스 시스템 연결
// =====================================

const tonkatsuSystem = createTonkatsuSystem(scene, camera, renderer.domElement);

// =====================================
// 9. Light
// =====================================

// 전체적인 밝기
const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);

scene.add(ambientLight);

// 그림자를 만드는 방향광
const directionalLight = new THREE.DirectionalLight(0xffffff, 2);

directionalLight.position.set(5, 10, 5);

// 그림자 활성화
directionalLight.castShadow = true;

// 그림자 해상도
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;

// 그림자가 적용될 범위
directionalLight.shadow.camera.left = -30;
directionalLight.shadow.camera.right = 30;
directionalLight.shadow.camera.top = 30;
directionalLight.shadow.camera.bottom = -30;

// 그림자 카메라 거리
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;

// 그림자 깨짐 방지
directionalLight.shadow.bias = -0.0005;

// 부드러운 그림자
directionalLight.shadow.radius = 4;

directionalLight.shadow.camera.updateProjectionMatrix();

scene.add(directionalLight);

// =====================================
// 10. 튀김기 사진 로딩
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

    // 튀김기 사진 회전: PC와 모바일 동일하게 유지
    fryerPhoto.rotation.x = -Math.PI / 2;

    // 기존 튀김기 사진 위치 유지
    fryerPhoto.position.set(0, 0, 1.5);

    // 돈까스 그림자를 받도록 설정
    fryerPhoto.receiveShadow = true;

    scene.add(fryerPhoto);

    // 돈까스 시스템에 전달
    tonkatsuSystem.setFryerPhoto(fryerPhoto);

    console.log('튀김기 사진 로딩 성공!');
    console.log('튀김기 그림자 수신 설정 완료!');
  },
  undefined,
  (error) => {
    console.error('튀김기 사진 로딩 실패!', error);
  },
);

// =====================================
// 11. Resize
// =====================================

window.addEventListener('resize', () => {
  updateResponsiveCamera();

  renderer.setSize(window.innerWidth, window.innerHeight);

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// 모바일 화면 방향 변경 대응
window.addEventListener('orientationchange', () => {
  setTimeout(() => {
    updateResponsiveCamera();

    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }, 200);
});

// =====================================
// 12. Animation
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
// 13. 튀김 소리 자연스러운 루프
// =====================================

const soundButton = document.querySelector('#soundButton');

// Web Audio API
const AudioContextClass = window.AudioContext || window.webkitAudioContext;

const audioContext = new AudioContextClass();

// 사운드 변수
let loopBuffer = null;
let loopSource = null;

let isSoundPlaying = false;
let soundEnabled = true;

// 크로스페이드 길이
const crossfadeDuration = 0.8;

// =====================================
// 14. MP3 로딩 및 크로스페이드 생성
// =====================================

async function loadFryingSound() {
  try {
    // MP3 파일 불러오기
    const response = await fetch('zigle_sound.mp3');

    if (!response.ok) {
      throw new Error('MP3 파일을 불러오지 못했습니다.');
    }

    const arrayBuffer = await response.arrayBuffer();

    // 오디오 데이터 디코딩
    const originalBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const sampleRate = originalBuffer.sampleRate;

    const fadeLength = Math.floor(sampleRate * crossfadeDuration);

    const totalLength = originalBuffer.length;

    // 크로스페이드 구간이 너무 긴 경우 방지
    if (fadeLength * 2 >= totalLength) {
      throw new Error('크로스페이드 구간이 원본 사운드보다 깁니다.');
    }

    // 새로운 오디오 버퍼 생성
    loopBuffer = audioContext.createBuffer(
      originalBuffer.numberOfChannels,
      totalLength - fadeLength,
      sampleRate,
    );

    // 채널별로 크로스페이드 적용
    for (
      let channel = 0;
      channel < originalBuffer.numberOfChannels;
      channel++
    ) {
      const original = originalBuffer.getChannelData(channel);

      const result = loopBuffer.getChannelData(channel);

      // 원본의 중간 부분 복사
      result.set(original.subarray(fadeLength, totalLength - fadeLength), 0);

      // 끝부분과 시작 부분을 자연스럽게 혼합
      for (let i = 0; i < fadeLength; i++) {
        const progress = i / (fadeLength - 1);

        const fadeOut = original[totalLength - fadeLength + i];

        const fadeIn = original[i];

        const mixedSound = fadeOut * (1 - progress) + fadeIn * progress;

        result[totalLength - fadeLength * 2 + i] = mixedSound;
      }
    }

    console.log('튀김 소리 크로스페이드 준비 완료!');
    console.log('자연스러운 반복 재생 준비 완료!');
  } catch (error) {
    console.error('튀김 소리 로딩 실패:', error);
  }
}

// =====================================
// 15. 사운드 재생
// =====================================

async function playSound() {
  if (!soundEnabled || isSoundPlaying) return;

  try {
    // 오디오 로딩이 끝날 때까지 대기
    if (!loopBuffer) {
      await loadFryingSound();
    }

    if (!loopBuffer || !soundEnabled || isSoundPlaying) return;

    // 브라우저 오디오 활성화
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    // 새로운 오디오 소스 생성
    loopSource = audioContext.createBufferSource();

    loopSource.buffer = loopBuffer;

    // 편집된 사운드 반복 재생
    loopSource.loop = true;

    // 출력 연결
    loopSource.connect(audioContext.destination);

    // 재생 시작
    loopSource.start(0);

    isSoundPlaying = true;

    soundButton.setAttribute('aria-label', '소리 끄기');

    console.log('튀김 소리 재생 시작!');
  } catch (error) {
    console.error('튀김 소리 재생 실패:', error);
  }
}

// =====================================
// 16. 사운드 정지
// =====================================

function stopSound() {
  soundEnabled = false;

  if (loopSource) {
    loopSource.stop();
    loopSource.disconnect();

    loopSource = null;
  }

  isSoundPlaying = false;

  soundButton.setAttribute('aria-label', '소리 켜기');

  console.log('튀김 소리 정지!');
}

// =====================================
// 17. 돼지 버튼 ON / OFF
// =====================================

soundButton.addEventListener('click', () => {
  if (soundEnabled) {
    stopSound();
  } else {
    soundEnabled = true;
    playSound();
  }
});

// =====================================
// 18. 사이트 접속 시 자동 재생
// =====================================

playSound();

// 브라우저 자동 재생이 차단된 경우
// 첫 사용자 동작 이후 재생
document.addEventListener(
  'pointerdown',
  (event) => {
    // 돼지 버튼을 누른 경우 제외
    if (event.target.closest('#soundButton')) return;

    if (soundEnabled && !isSoundPlaying) {
      playSound();
    }
  },
  { once: true },
);
