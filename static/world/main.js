window.addEventListener('DOMContentLoaded', function () {
    const canvas = document.getElementById('renderCanvas');
    const engine = new BABYLON.Engine(canvas, true);
    
    const createScene = function () {
        const scene = new BABYLON.Scene(engine);
        const camera = new BABYLON.UniversalCamera("camera", new BABYLON.Vector3(0, 1.5, -4), scene);
        camera.attachControl(canvas, true);

        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), scene);

        // 배경 이미지 설정
        new BABYLON.Layer('background', 'https://play-lh.googleusercontent.com/NlKoKe46_2G74xk0MGNvCDK7pJ5DwUtYMhOBm2yXfbfsAwOKnImfWq4koNsAjQ17tpg=w2400', scene, true);

        // 바닥
        const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 20, height: 20}, scene);

        // GLB 모델 로드
        BABYLON.SceneLoader.Append("/assets/", "avatar.glb", scene, function () {
            console.log("GLB 로드 완료");
        });

        // GPT Plane
        const plane = BABYLON.MeshBuilder.CreatePlane("gptPlane", { width: 1, height: 1 }, scene);
        plane.position = new BABYLON.Vector3(2, 1, 0);  // GLB와 떨어진 위치
        const planeMat = new BABYLON.StandardMaterial("planeMat", scene);
        const dynamicTexture = new BABYLON.DynamicTexture("dynamicTexture", 512, scene);
        dynamicTexture.drawText("GPT에게 질문하기", 75, 280, "bold 50px Arial", "black", "white");
        planeMat.diffuseTexture = dynamicTexture;
        plane.material = planeMat;

        // 클릭 이벤트
        plane.actionManager = new BABYLON.ActionManager(scene);
        plane.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPickTrigger,
            function () {
                const userMessage = prompt("GPT에게 질문하세요:");
                if (userMessage) {
                    fetch("/gpt_test", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ message: userMessage })
                    })
                    .then(res => res.json())
                    .then(data => alert("GPT 응답: " + data.response));
                }
            }
        ));

        return scene;
    };

    const scene = createScene();
    engine.runRenderLoop(() => scene.render());
    window.addEventListener("resize", () => engine.resize());
});
