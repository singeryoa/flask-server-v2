window.addEventListener('DOMContentLoaded', function () {
    const canvas = document.getElementById('renderCanvas');
    const engine = new BABYLON.Engine(canvas, true);

    const createScene = function () {
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color3(0.9, 0.9, 1.0);

        // 카메라: WASD 이동 가능
        const camera = new BABYLON.UniversalCamera("UniversalCamera", new BABYLON.Vector3(0, 2, -10), scene);
        camera.attachControl(canvas, true);
        camera.speed = 0.25;

        // 조명
        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), scene);

        // 바닥
        const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 30, height: 30}, scene);
        ground.position.y = 0;

        // 스카이박스 (자연 이미지 배경)
        const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", {size:1000.0}, scene);
        const skyboxMaterial = new BABYLON.StandardMaterial("skyBoxMaterial", scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("https://playground.babylonjs.com/textures/skybox", scene);
        skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        skyboxMaterial.disableLighting = true;
        skybox.material = skyboxMaterial;

        // GPT 안내 텍스트 평면
        const npcPlane = BABYLON.MeshBuilder.CreatePlane("npcText", {width: 6, height: 3}, scene);
        npcPlane.position.set(5, 2, 0);
        const npcMat = new BABYLON.StandardMaterial("npcMat", scene);
        npcMat.diffuseTexture = new BABYLON.DynamicTexture("npcTextTex", {width:512, height:256}, scene, false);
        npcPlane.material = npcMat;
        const ctx = npcMat.diffuseTexture.getContext();
        ctx.font = "bold 28px Arial";
        ctx.fillStyle = "black";
        ctx.fillText("GPT NPC - 클릭 시 대화 시작", 10, 100);
        npcMat.diffuseTexture.update();

        // 클릭 시 GPT UI 창 표시
        npcPlane.actionManager = new BABYLON.ActionManager(scene);
        npcPlane.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
                document.getElementById("gptWindow").style.display = "block";
                document.getElementById("gptInput").focus();
            })
        );

        // GLB 모델 불러오기
        BABYLON.SceneLoader.Append("/assets/", "avatar.glb", scene, function () {
            console.log("GLB 로드 완료");
        });

        return scene;
    };

    const scene = createScene();
    engine.runRenderLoop(() => scene.render());

    window.addEventListener("resize", () => engine.resize());

    // ESC 누르면 GPT UI 창 닫기
    window.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            document.getElementById("gptWindow").style.display = "none";
        }
    });

    // GPT 응답 처리
    document.getElementById("gptForm").addEventListener("submit", function (e) {
        e.preventDefault();
        const message = document.getElementById("gptInput").value;
        fetch("/gpt_test", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({message: message})
        })
        .then(res => res.json())
        .then(data => {
            document.getElementById("gptResponse").innerText = data.response;
        });
    });
});
