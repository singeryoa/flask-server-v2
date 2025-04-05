window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('renderCanvas');
    const engine = new BABYLON.Engine(canvas, true);
    const scene = new BABYLON.Scene(engine);

    const camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 2, -10), scene);
    camera.attachControl(canvas, true);
    camera.keysUp.push(87); // W
    camera.keysDown.push(83); // S
    camera.keysLeft.push(65); // A
    camera.keysRight.push(68); // D

    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 1;

    const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 20, height: 20}, scene);

    BABYLON.SceneLoader.Append("/assets/", "avatar.glb", scene, () => {
        console.log("GLB 로드 완료");
    });

    const npcPlane = BABYLON.MeshBuilder.CreatePlane("npcText", {width: 3, height: 1.5}, scene);
    npcPlane.position = new BABYLON.Vector3(0, 2, 0);
    const mat = new BABYLON.StandardMaterial("mat", scene);
    const tex = new BABYLON.DynamicTexture("dynamic texture", {width:512, height:256}, scene, true);
    tex.drawText("GPT NPC (클릭)", 75, 140, "bold 30px Arial", "black", "white");
    mat.diffuseTexture = tex;
    npcPlane.material = mat;

    npcPlane.actionManager = new BABYLON.ActionManager(scene);
    npcPlane.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
            document.getElementById("gptUI").style.display = "block";
        })
    );

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
