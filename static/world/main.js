window.addEventListener('DOMContentLoaded', function () {
    const canvas = document.getElementById('renderCanvas');
    const engine = new BABYLON.Engine(canvas, true);

    const createScene = function () {
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color3(0.9, 0.9, 1);

        const camera = new BABYLON.UniversalCamera("camera", new BABYLON.Vector3(0, 2, -10), scene);
        camera.attachControl(canvas, true);
        camera.speed = 0.5;

        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), scene);

        const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 30, height: 30 }, scene);

        // Skybox
        const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000 }, scene);
        const skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.9, 1.0);
        skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        skybox.material = skyboxMaterial;

        // GPT NPC Plane
        const npc = BABYLON.MeshBuilder.CreatePlane("npcText", {width: 2, height: 1}, scene);
        npc.position = new BABYLON.Vector3(0, 2, 2);
        const npcMat = new BABYLON.StandardMaterial("npcMat", scene);
        npcMat.diffuseColor = new BABYLON.Color3.Black();
        npc.material = npcMat;

        npc.actionManager = new BABYLON.ActionManager(scene);
        npc.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPickTrigger,
            function () {
                document.getElementById("chatBox").style.display = "block";
            }
        ));

        // GLB 로딩
        BABYLON.SceneLoader.ImportMesh("", "/assets/", "avatar.glb", scene, function (meshes) {
            const obj = meshes[0];
            obj.position = new BABYLON.Vector3(2, 0, 0);
            obj.scaling = new BABYLON.Vector3(1, 1, 1);
        });

        return scene;
    };

    const scene = createScene();
    engine.runRenderLoop(() => scene.render());
    window.addEventListener("resize", () => engine.resize());
});

// GPT 대화 전송
function sendToGPT() {
    const msg = document.getElementById("userInput").value;
    fetch('/gpt_test', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ message: msg })
    }).then(res => res.json())
      .then(data => {
        document.getElementById("gptResponse").innerText = "GPT 응답: " + data.response;
      });
}
