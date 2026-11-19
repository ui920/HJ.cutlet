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

  // 충돌 재질
  const fryerMaterial = new CANNON.Material('fryer');
  const tonkatsuMaterial = new CANNON.Material('tonkatsu');

  // 튀김기 바닥과 돈까스 충돌
  world.addContactMaterial(
    new CANNON.ContactMaterial(fryerMaterial, tonkatsuMaterial, {
      friction: 0.65,
      restitution: 0.25,
    }),
  );

  // 돈까스끼리 충돌
  world.addContactMaterial(
    new CANNON.ContactMaterial(tonkatsuMaterial, tonkatsuMaterial, {
      friction: 0.45,
      restitution: 0.35,
    }),
  );

  // 튀김기 바닥
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
  // 3. 돈까스 생성
  // =====================================

  function createTonkatsu(x, z) {
    const group = new THREE.Group();

    // 돈까스 몸체
    const bodyGeometry = new THREE.SphereGeometry(1, 50, 24);

    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xd99a32,
      roughness: 0.9,
    });

    const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);

    bodyMesh.scale.set(0.7, 0.2, 0.5);

    group.add(bodyMesh);

    // 빵가루
    const crumbMaterial = new THREE.MeshStandardMaterial({
      color: 0xf2c46d,
      roughness: 1,
    });

    for (let i = 0; i < 35; i++) {
      const crumbGeometry = new THREE.SphereGeometry(0.035, 6, 6);

      const crumb = new THREE.Mesh(crumbGeometry, crumbMaterial);

      const angle = Math.random() * Math.PI * 2;
      const radius = Math.sqrt(Math.random()) * 0.55;

      crumb.position.set(
        Math.cos(angle) * radius,
        0.17 + Math.random() * 0.04,
        Math.sin(angle) * radius,
      );

      group.add(crumb);
    }

    scene.add(group);

    // =====================================
    // 4. 돈까스 물리 객체
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

    // 돈까스 목록에 저장
    tonkatsus.push({
      mesh: group,
      body: physicsBody,
    });
  }

  // =====================================
  // 5. 튀김기 사진 지정
  // =====================================

  function setFryerPhoto(mesh) {
    fryerPhoto = mesh;
  }

  // =====================================
  // 6. 마우스 클릭 위치 기록
  // =====================================

  canvas.addEventListener('pointerdown', (event) => {
    pointerDownPosition = {
      x: event.clientX,
      y: event.clientY,
    };
  });

  // =====================================
  // 7. 마우스 클릭 이벤트
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

    // 마우스 위치 계산
    const rect = canvas.getBoundingClientRect();

    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;

    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);

    // =====================================
    // 8. 기존 돈까스 클릭 확인
    // =====================================

    const tonkatsuMeshes = tonkatsus.map((item) => item.mesh);

    const tonkatsuHits = raycaster.intersectObjects(tonkatsuMeshes, true);

    if (tonkatsuHits.length > 0) {
      // 클릭한 빵가루 또는 몸체의 부모 Group 찾기
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

        // 바닥에 안정적으로 착지한 돈까스만 반응
        if (body.sleepState === CANNON.Body.SLEEPING) {
          // 물리엔진 깨우기
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
    // 9. 튀김기 사진 클릭 확인
    // =====================================

    if (!fryerPhoto) return;

    const fryerHits = raycaster.intersectObject(fryerPhoto, false);

    if (fryerHits.length === 0) return;

    const hit = fryerHits[0].point;

    // 클릭한 위치에서 돈까스 생성
    createTonkatsu(hit.x, hit.z);
  });

  // =====================================
  // 10. 물리엔진 업데이트
  // =====================================

  function update(delta) {
    world.step(1 / 60, delta, 5);

    // 물리엔진 위치와 회전을 화면에 반영
    tonkatsus.forEach((item) => {
      item.mesh.position.copy(item.body.position);

      item.mesh.quaternion.copy(item.body.quaternion);
    });
  }

  // =====================================
  // 11. 외부 연결
  // =====================================

  return {
    update,
    setFryerPhoto,
  };
}
