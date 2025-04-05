window.addEventListener('DOMContentLoaded', async function () {
    const canvas = document.getElementById('renderCanvas');
    const engine = new BABYLON.Engine(canvas, true);

    const createScene = async function () {
        const scene = new BABYLON.Scene(engine);
        const camera = new BABYLON.UniversalCamera("camera", new BABYLON.Vector3(0, 1.5, -4), scene);
        camera.attachControl(canvas, true);

        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), scene);

        // 기존 배경
        new BABYLON.Layer('background', 'https://play-lh.googleusercontent.com/NlKoKe46_2G74xk0MGNvCDK7pJ5DwUtYMhOBm2yXfbfsAwOKnImfWq4koNsAjQ17tpg=w2400', scene, true);

        // 바닥
        const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 20, height: 20 }, scene);

        // GLB 모델 로드
        BABYLON.SceneLoader.Append("/assets/", "avatar.glb", scene, function () {
            console.log("GLB 로드 완료");
        });

        // GPT Plane
        const plane = BABYLON.MeshBuilder.CreatePlane("gptPlane", { width: 1, height: 1 }, scene);
        plane.position = new BABYLON.Vector3(2, 1, 0);
        const planeMat = new BABYLON.StandardMaterial("planeMat", scene);
        const dynamicTexture = new BABYLON.DynamicTexture("dynamicTexture", 512, scene);
        dynamicTexture.drawText("GPT에게 질문하기", 75, 280, "bold 50px Arial", "black", "white");
        planeMat.diffuseTexture = dynamicTexture;
        plane.material = planeMat;

        // GPT UI (클릭 시만 생성)
        const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        let uiVisible = false;
        let inputBox, outputText;

        plane.actionManager = new BABYLON.ActionManager(scene);
        plane.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, function () {
                if (uiVisible) return;

                inputBox = new BABYLON.GUI.InputText();
                inputBox.width = "300px";
                inputBox.height = "40px";
                inputBox.top = "-200px";
                inputBox.color = "black";
                inputBox.background = "white";
                inputBox.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
                inputBox.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
                advancedTexture.addControl(inputBox);

                outputText = new BABYLON.GUI.TextBlock();
                outputText.text = "GPT 응답이 여기에 표시됩니다.";
                outputText.color = "white";
                outputText.top = "150px";
                outputText.fontSize = 24;
                outputText.textWrapping = true;
                outputText.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
                outputText.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
                advancedTexture.addControl(outputText);

                uiVisible = true;

                inputBox.onKeyboardEventProcessedObservable.add((evt) => {
                    if (evt.key === "Enter" && inputBox.text.trim() !== "") {
                        fetch('/chat', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ message: inputBox.text })
                        })
                        .then(response => response.json())
                        .then(data => {
                            outputText.text = data.reply;
                        })
                        .catch(() => {
                            outputText.text = "오류가 발생했습니다.";
                        });
                    }
                });
            })
        );

        // ✅ Quest VR 브라우저 자동 VR 진입
        if (navigator.userAgent.includes("Quest") || navigator.userAgent.includes("OculusBrowser")) {
            const xr = await scene.createDefaultXRExperienceAsync();
            xr.baseExperience.enterXRAsync("immersive-vr", "local-floor", xr.renderTarget)
                .then(() => console.log("VR 모드 진입 완료"))
                .catch((e) => console.warn("VR 진입 실패:", e));
        }

        return scene;
    };

    const scene = await createScene();

    engine.runRenderLoop(function () {
        scene.render();
    });

    window.addEventListener('resize', function () {
        engine.resize();
    });
});
