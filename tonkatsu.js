import * as THREE from 'three';
import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js';

export function createTonkatsuSystem(scene, camera, canvas) {
  // =====================================
  // 1. 물리엔진 설정
  // =====================================

  const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.82, 0),
  });

  world.broadphase = new CANNON.SAPBroadphase(world);
  world.allowSleep = true;
  world.solver.iterations = 20;
  world.solver.tolerance = 0.001;

  const fryerMaterial = new CANNON.Material('fryer');
  const tonkatsuMaterial = new CANNON.Material('tonkatsu');

  world.addContactMaterial(
    new CANNON.ContactMaterial(fryerMaterial, tonkatsuMaterial, {
      friction: 0.65,
      restitution: 0.25,
    }),
  );

  world.addContactMaterial(
    new CANNON.ContactMaterial(tonkatsuMaterial, tonkatsuMaterial, {
      friction: 0.45,
      restitution: 0.35,
    }),
  );

  // 물리 바닥
  const floorBody = new CANNON.Body({
    mass: 0,
    material: fryerMaterial,
    shape: new CANNON.Plane(),
  });

  floorBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  floorBody.position.set(0, 0, 0);

  world.addBody(floorBody);

  // =====================================
  // 2. 기본 변수
  // =====================================

  const tonkatsus = [];

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  let fryerPhoto = null;
  let pointerDownPosition = null;

  // =====================================
  // 3. 돈까스 얼굴 텍스처
  // =====================================

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.9,
    transparent: false,
  });

  const faceLoader = new THREE.TextureLoader();

  faceLoader.load(
    './image/hojeong.png',

    (texture) => {
      const image = texture.image;

      const faceCanvas = document.createElement('canvas');
      faceCanvas.width = 1024;
      faceCanvas.height = 1024;

      const ctx = faceCanvas.getContext('2d');

      // 투명한 영역은 튀김옷 색상으로 채우기
      ctx.fillStyle = '#bb861c';
      ctx.fillRect(0, 0, 1024, 1024);

      // 호정 사진 적용
      ctx.drawImage(image, 0, 0, 1024, 1024);

      const faceTexture = new THREE.CanvasTexture(faceCanvas);

      faceTexture.colorSpace = THREE.SRGBColorSpace;

      faceTexture.wrapS = THREE.RepeatWrapping;
      faceTexture.wrapT = THREE.ClampToEdgeWrapping;
      faceTexture.repeat.set(2, 1);

      bodyMaterial.map = faceTexture;
      bodyMaterial.needsUpdate = true;

      console.log('호정 얼굴 텍스처 로딩 성공!');
    },

    undefined,

    (error) => {
      console.error('호정 얼굴 사진 로딩 실패!', error);
    },
  );

  // =====================================
  // 4. 반투명 색상 레이어
  // =====================================

  const colorOverlayMaterial = new THREE.MeshBasicMaterial({
    color: 0xbb5e1c,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });

  // =====================================
  // 5. 돈까스 생성
  // =====================================

  function createTonkatsu(x, z) {
    const group = new THREE.Group();

    // 돈까스 몸체
    const bodyGeometry = new THREE.SphereGeometry(1, 64, 48);

    const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);

    // 납작한 돈까스 형태
    bodyMesh.scale.set(0.84, 0.24, 0.6);

    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;

    // 반투명 색상 레이어
    const colorOverlay = new THREE.Mesh(bodyGeometry, colorOverlayMaterial);

    colorOverlay.scale.set(1.01, 1.01, 1.01);

    bodyMesh.add(colorOverlay);

    group.add(bodyMesh);

    scene.add(group);

    // =====================================
    // 6. 돈까스 물리 객체
    // =====================================

    const physicsBody = new CANNON.Body({
      mass: 1,

      material: tonkatsuMaterial,

      shape: new CANNON.Box(new CANNON.Vec3(0.7, 0.2, 0.5)),

      position: new CANNON.Vec3(
        x + (Math.random() - 0.5) * 0.15,
        5,
        z + (Math.random() - 0.5) * 0.15,
      ),

      linearDamping: 0.12,
      angularDamping: 0.15,

      allowSleep: true,
      sleepSpeedLimit: 0.12,
      sleepTimeLimit: 1.5,
    });

    // 처음 떨어질 때 회전
    physicsBody.angularVelocity.set(
      (Math.random() - 0.5) * 2.5,
      (Math.random() - 0.5) * 2.5,
      (Math.random() - 0.5) * 2.5,
    );

    // 약간의 수평 움직임
    physicsBody.velocity.set(
      (Math.random() - 0.5) * 0.8,
      0,
      (Math.random() - 0.5) * 0.8,
    );

    world.addBody(physicsBody);

    tonkatsus.push({
      mesh: group,
      body: physicsBody,
    });

    // 호까스 생성 이벤트 전달
    window.dispatchEvent(new Event('tonkatsu-created'));
  }

  // =====================================
  // 7. 튀김기 사진 지정
  // =====================================

  function setFryerPhoto(mesh) {
    fryerPhoto = mesh;

    fryerPhoto.receiveShadow = true;
  }

  // =====================================
  // 8. 마우스 클릭 위치 기록
  // =====================================

  canvas.addEventListener('pointerdown', (event) => {
    pointerDownPosition = {
      x: event.clientX,
      y: event.clientY,
    };
  });

  // =====================================
  // 9. 마우스 클릭 이벤트
  // =====================================

  canvas.addEventListener('pointerup', (event) => {
    if (!pointerDownPosition) return;

    const distance = Math.hypot(
      event.clientX - pointerDownPosition.x,
      event.clientY - pointerDownPosition.y,
    );

    pointerDownPosition = null;

    // 드래그는 클릭으로 처리하지 않음
    if (distance > 5) return;

    const rect = canvas.getBoundingClientRect();

    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;

    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);

    // =====================================
    // 10. 기존 돈까스 클릭 확인
    // =====================================

    const tonkatsuMeshes = tonkatsus.map((item) => item.mesh);

    const tonkatsuHits = raycaster.intersectObjects(tonkatsuMeshes, true);

    if (tonkatsuHits.length > 0) {
      let clickedObject = tonkatsuHits[0].object;

      while (
        clickedObject.parent &&
        !tonkatsus.some((item) => item.mesh === clickedObject)
      ) {
        clickedObject = clickedObject.parent;
      }

      const selectedTonkatsu = tonkatsus.find(
        (item) => item.mesh === clickedObject,
      );

      if (selectedTonkatsu) {
        const body = selectedTonkatsu.body;

        // 착지한 돈까스만 반응
        if (body.sleepState === CANNON.Body.SLEEPING) {
          body.wakeUp();

          // 위쪽으로 튀어 오르기
          body.velocity.set(
            (Math.random() - 0.5) * 0.8,
            10,
            (Math.random() - 0.5) * 0.8,
          );

          // 튀어 오르면서 회전
          body.angularVelocity.set(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
          );
        }

        return;
      }
    }

    // =====================================
    // 11. 튀김기 사진 클릭 확인
    // =====================================

    if (!fryerPhoto) return;

    const fryerHits = raycaster.intersectObject(fryerPhoto, false);

    if (fryerHits.length === 0) return;

    const hit = fryerHits[0].point;

    // 클릭한 위치에서 돈까스 생성
    createTonkatsu(hit.x, hit.z);
  });

  // =====================================
  // 12. 물리엔진 업데이트
  // =====================================

  function update(delta) {
    world.step(1 / 60, delta, 5);

    tonkatsus.forEach((item) => {
      item.mesh.position.copy(item.body.position);
      item.mesh.quaternion.copy(item.body.quaternion);
    });
  }

  // =====================================
  // 13. 외부 연결
  // =====================================

  return {
    update,
    setFryerPhoto,
  };
}
