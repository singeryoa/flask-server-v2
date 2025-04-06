window.addEventListener('DOMContentLoaded', () => {

    // GLB 모델: 최대 3~5MB 이하 권장 (10MB 이상은 Quest에서 로딩 문제 발생)
    // 스카이박스: 512px~1024px 사이 해상도 가장 적합
    // 2048px 이상 → VR 모드에서 로딩 실패 가능성 ↑
    // Babylon.js 씬 최적화
    // main.js의 createScene() 함수 최상단에 아래 추가:
    scene.autoClear = true;
    scene.autoClearDepthAndStencil = true;
    scene.useRightHandedSystem = false;
    engine.setHardwareScalingLevel(1.5); // 낮을수록 더 높은 해상도 (1.5~2 추천)


    const canvas = document.getElementById('renderCanvas');

    // 렌더 지연 방지를 위한 BABYLON.Engine 초기화 설정
    const engine = new BABYLON.Engine(canvas, true, {
        preserveDrawingBuffer: true,
        stencil: true,
        disableWebGL2Support: false
    });
    // const engine = new BABYLON.Engine(canvas, true);  최적화를 위해 위 5줄로 변경

    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(0.8, 0.9, 1.0); // 밝은 배경

    // 카메라 + WASD 이동
    const camera = new BABYLON.UniversalCamera("UniCam", new BABYLON.Vector3(0, 2, -5), scene);
    camera.attachControl(canvas, true);
    camera.speed = 0.2;

    camera.keysUp.push(87);    // W
    camera.keysDown.push(83);  // S
    camera.keysLeft.push(65);  // A
    camera.keysRight.push(68); // D


    // VR 모드 지원
    const xrHelperPromise = scene.createDefaultXRExperienceAsync({});

    // 조명
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 1;

    // 바닥
    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 20, height: 20 }, scene);
    ground.material = new BABYLON.StandardMaterial("groundMat", scene);
    ground.material.diffuseColor = new BABYLON.Color3(1, 1, 1);


    // Babylon.js 씬 최적화
    scene.autoClear = true;
    scene.autoClearDepthAndStencil = true;
    scene.useRightHandedSystem = false;
    engine.setHardwareScalingLevel(1.5); // 낮을수록 더 높은 해상도 (1.5~2 추천)




    // GPT NPC 평면
    const npcPlane = BABYLON.MeshBuilder.CreatePlane("npcText", { width: 4, height: 2 }, scene);
    npcPlane.position = new BABYLON.Vector3(0, 2, 0);
    const npcMat = new BABYLON.StandardMaterial("npcMat", scene);
    npcMat.diffuseTexture = new BABYLON.DynamicTexture("npcTextTex", { width: 512, height: 256 }, scene, false);
    npcPlane.material = npcMat;
    const ctx = npcMat.diffuseTexture.getContext();
    ctx.font = "bold 26px Arial";
    ctx.fillStyle = "black";
    ctx.fillText("GPT NPC: 클릭하면 대화 시작!", 10, 100);
    npcMat.diffuseTexture.update();

    // NPC 클릭 → GPT 대화 시작
    npcPlane.actionManager = new BABYLON.ActionManager(scene);
    npcPlane.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnPickTrigger,
        () => {
            const msg = prompt("GPT에게 질문하세요:");
            if (msg) {

                fetch("/gpt_test", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ message: msg })
                })
                    .then(res => res.json())
                    .then(data => {
                        alert("GPT 응답: " + data.response);
                    })
                    .catch(err => {
                        alert("에러 발생: " + err);
                    });


                /*  
                fetch("/gpt_test", {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: `message=${encodeURIComponent(msg)}`
                })
                    .then(res => res.text())
                    .then(reply => alert("GPT 응답: " + reply));
                */
            }
        }
    ));

    // avatar.glb 로드
    // SceneLoader.Append("/assets/", "avatar.glb", ...) 수정 완료됨
    // function (scene) 에서 function () 로 변경함
    // https://flask-server-v2.onrender.com/assets/avatar.glb 접속 → 정상 다운로드 또는 뷰 되면 OK
    // 여러 오브젝트를 배치하고 싶은 경우, 아래처럼 여러 번 SceneLoader.Append() 또는 ImportMesh() 호출하세요.
    // 직접 좌표 설정하고 싶다면 ImportMesh()로 로드 후 .position.set(x,y,z) 처리도 가능
    BABYLON.SceneLoader.Append("/assets/", "mole.glb", scene, function () {
        const root = scene.meshes[scene.meshes.length - 1];
        root.position = new BABYLON.Vector3(3, 0, 0); // NPC에서 약간 떨어진 위치
        root.getChildMeshes().forEach(m => {
            if (m.material && m.material.albedoTexture) {
                m.material.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
                m.material.alpha = 0.9;
            }
        });
        console.log("GLB 로드 완료");
    });




    
    // 배경 스카이박스 생성
    // createScene() 함수 하단 또는 GLB 로딩 이후에 추가
    const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000.0 }, scene);
    const skyboxMaterial = new BABYLON.StandardMaterial("skyBoxMaterial", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.disableLighting = true;
    // skybox.infiniteDistance = true;     생략 가능.


    // 스카이박스 텍스쳐 설정
    // 스카이박스 개인 파일로 설정은 바로 아래 코드 사용
    // skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("/assets/skybox/sky", scene);
    /* 
    스카이박스를 /static/world/assets/skybox/ 폴더에 아래와 같이 넣습니다:
    sky_px.jpg
    sky_py.jpg
    sky_pz.jpg
    sky_nx.jpg
    sky_ny.jpg
    sky_nz.jpg
    그 후, 위 Babylon 코드에서 "/assets/skybox/sky" 는 "sky_px.jpg" 등으로 확장자를 자동 인식하여 6면 큐브로 스카이박스를 구성합니다.
    */
    // 아래 1줄은 기존 제공 코드.   
    // skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("https://playground.babylonjs.com/textures/skybox", scene);
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("/assets/skybox/sky", scene);
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;

    skybox.material = skyboxMaterial;






    engine.runRenderLoop(() => scene.render());
    window.addEventListener("resize", () => engine.resize());
});



/*
window.addEventListener('DOMContentLoaded', function () {
    const canvas = document.getElementById('renderCanvas');
    const engine = new BABYLON.Engine(canvas, true);

    const createScene = function () {
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color3(0.9, 0.9, 1.0);

        const camera = new BABYLON.ArcRotateCamera("ArcCamera", Math.PI / 2, Math.PI / 3, 15, BABYLON.Vector3.Zero(), scene);
        camera.attachControl(canvas, true);

        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), scene);
        light.intensity = 1;

        const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 20, height: 20}, scene);
        ground.material = new BABYLON.StandardMaterial("groundMat", scene);
        ground.material.diffuseColor = new BABYLON.Color3(1, 1, 1);

        // NPC 안내 텍스트
        const npcText = BABYLON.MeshBuilder.CreatePlane("npcText", {width: 4, height: 2}, scene);
        npcText.position.set(0, 2, -5);
        const npcMat = new BABYLON.StandardMaterial("npcMat", scene);
        npcMat.diffuseTexture = new BABYLON.DynamicTexture("npcTextTex", {width:512, height:256}, scene, false);
        npcText.material = npcMat;
        const ctx = npcMat.diffuseTexture.getContext();
        ctx.font = "bold 28px Arial";
        ctx.fillStyle = "black";
        ctx.fillText("GPT NPC: 거래 방법을 알려드릴게요!", 10, 100);
        npcMat.diffuseTexture.update();

        // GLB 오브젝트 로드
        BABYLON.SceneLoader.Append("assets/", "box.glb", scene, function () {
            console.log("GLB 로드 완료");
        });

        return scene;
    };

    const scene = createScene();
    engine.runRenderLoop(() => scene.render());
    window.addEventListener("resize", () => engine.resize());
});

*/
//  위 코드는 glb 작동 이전의 코드임. glb 기능 수정 필요