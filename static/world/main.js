window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('renderCanvas');
    const engine = new BABYLON.Engine(canvas, true);
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

    // 배경 스카이박스
    // 밝은 외부 풍경 배경 스카이박스 추가
    const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000.0 }, scene);
    const skyboxMaterial = new BABYLON.StandardMaterial("skyBoxMaterial", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("https://playground.babylonjs.com/textures/skybox", scene);
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    skyboxMaterial.disableLighting = true;
    skybox.material = skyboxMaterial;


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
    BABYLON.SceneLoader.Append("/assets/", "avatar.glb", scene, function () {
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