window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('renderCanvas');
    const engine = new BABYLON.Engine(canvas, true);
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(0.9, 0.9, 1.0);
  
    const camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 2, -10), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.attachControl(canvas, true);
    camera.speed = 0.3;
  
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
  
    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 30, height: 30 }, scene);
  
    // GLB 로드
    BABYLON.SceneLoader.Append("/assets/", "avatar.glb", scene, () => {
      console.log("GLB 로드 완료");
    });
  
    const plane = BABYLON.MeshBuilder.CreatePlane("dialogPlane", {width: 4, height: 2}, scene);
    plane.position.set(0, 2, 0);
    const mat = new BABYLON.StandardMaterial("mat", scene);
    const texture = new BABYLON.DynamicTexture("textTexture", {width:512, height:256}, scene);
    mat.diffuseTexture = texture;
    plane.material = mat;
    texture.drawText("GPT에게 클릭해보세요", 20, 135, "bold 28px Arial", "black", "white", true);
  
    plane.actionManager = new BABYLON.ActionManager(scene);
    plane.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
        const userInput = prompt("GPT에게 질문해보세요:");
        if (userInput) {
          fetch("/gpt_test", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: userInput })
          })
          .then(res => res.json())
          .then(data => {
            texture.drawText(data.response, 20, 135, "bold 20px Arial", "black", "white", true);
          });
        }
      })
    );
  
    engine.runRenderLoop(() => scene.render());
    window.addEventListener("resize", () => engine.resize());
  });
  