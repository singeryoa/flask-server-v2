window.addEventListener('DOMContentLoaded', function () {
    const canvas = document.getElementById('renderCanvas');
    const engine = new BABYLON.Engine(canvas, true);

    const createScene = function () {
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color3(0.9, 0.9, 1.0);

        const camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 2, -10), scene);
        camera.attachControl(canvas, true);
        camera.speed = 0.5;

        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = 1.0;

        const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 20, height: 20}, scene);
        ground.position.y = 0;

        BABYLON.SceneLoader.Append("/assets/", "avatar.glb", scene, function () {
            console.log("GLB 로드 완료");
        });

        const npcPlane = BABYLON.MeshBuilder.CreatePlane("npcText", {width: 3, height: 1.5}, scene);
        npcPlane.position = new BABYLON.Vector3(0, 2, 0);
        const mat = new BABYLON.StandardMaterial("mat", scene);
        const tex = new BABYLON.DynamicTexture("dynamic texture", {width:512, height:256}, scene, true);
        tex.drawText("GPT NPC\n(클릭하세요)", 75, 140, "bold 32px Arial", "black", "white");
        mat.diffuseTexture = tex;
        npcPlane.material = mat;

        npcPlane.actionManager = new BABYLON.ActionManager(scene);
        npcPlane.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
                document.getElementById("gptUI").style.display = "block";
            })
        );

        return scene;
    };

    const scene = createScene();
    engine.runRenderLoop(() => scene.render());
    window.addEventListener("resize", () => engine.resize());
});

function sendToGPT() {
    const input = document.getElementById("userInput").value;
    fetch("/gpt_test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input })
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById("gptResponse").innerText = data.response;
    });
}
