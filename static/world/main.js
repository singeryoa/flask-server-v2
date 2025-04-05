window.addEventListener('DOMContentLoaded', function () {
    const canvas = document.getElementById('renderCanvas');
    const engine = new BABYLON.Engine(canvas, true);
    const scene = new BABYLON.Scene(engine);

    const camera = new BABYLON.UniversalCamera("camera", new BABYLON.Vector3(0, 1.6, -5), scene);
    camera.attachControl(canvas, true);
    camera.speed = 0.1; // 이동 속도 느리게
    camera.keysUp.push(87);    // W
    camera.keysDown.push(83);  // S
    camera.keysLeft.push(65);  // A
    camera.keysRight.push(68); // D

    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

    // 스카이박스 배경
    const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000.0 }, scene);
    const skyboxMaterial = new BABYLON.StandardMaterial("skyBoxMaterial", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.disableLighting = true;
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("https://playground.babylonjs.com/textures/skybox", scene);
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    skybox.material = skyboxMaterial;

    // GPT 평면 생성
    const gptPlane = BABYLON.MeshBuilder.CreatePlane("gptPlane", { width: 3, height: 2 }, scene);
    gptPlane.position = new BABYLON.Vector3(0, 1.5, 3);
    const planeMaterial = new BABYLON.StandardMaterial("planeMat", scene);
    planeMaterial.diffuseColor = new BABYLON.Color3(1, 0.8, 0.2);
    gptPlane.material = planeMaterial;

    // GPT UI 텍스트
    const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

    const input = new BABYLON.GUI.InputText();
    input.width = "300px";
    input.height = "40px";
    input.top = "-200px";
    input.color = "black";
    input.background = "white";
    input.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    input.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    advancedTexture.addControl(input);

    const output = new BABYLON.GUI.TextBlock();
    output.text = "GPT 응답이 여기에 표시됩니다.";
    output.color = "white";
    output.top = "150px";
    output.fontSize = 24;
    output.textWrapping = true;
    advancedTexture.addControl(output);

    // 클릭 시 GPT 호출
    gptPlane.actionManager = new BABYLON.ActionManager(scene);
    gptPlane.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, function () {
            fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: input.text })
            })
            .then(response => response.json())
            .then(data => {
                output.text = data.reply;
            });
        })
    );

    // GLB 오브젝트 로드
    BABYLON.SceneLoader.Append("/assets/", "avatar.glb", scene, function () {
        console.log("GLB 로드 완료");
    });

    engine.runRenderLoop(function () {
        scene.render();
    });

    window.addEventListener('resize', function () {
        engine.resize();
    });
});
