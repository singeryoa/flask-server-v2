window.addEventListener('DOMContentLoaded', async function () {
    const canvas = document.getElementById('renderCanvas');
    const engine = new BABYLON.Engine(canvas, true);

    const createScene = async function () {
        const scene = new BABYLON.Scene(engine);
        const camera = new BABYLON.UniversalCamera("camera", new BABYLON.Vector3(0, 1.5, -4), scene);
        camera.attachControl(canvas, true);
        camera.speed = 0.1;
        camera.keysUp.push(87);
        camera.keysDown.push(83);
        camera.keysLeft.push(65);
        camera.keysRight.push(68);

        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), scene);

        // 배경 이미지
        new BABYLON.Layer('background', 'https://play-lh.googleusercontent.com/NlKoKe46_2G74xk0MGNvCDK7pJ5DwUtYMhOBm2yXfbfsAwOKnImfWq4koNsAjQ17tpg=w2400', scene, true);

        // 바닥
        const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 20, height: 20 }, scene);

        // GLB 모델
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

        // ✅ Babylon GUI UI (추가)
        const gui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        let inputBox, outputText, uiVisible = false;

        function showGPTUI() {
            if (uiVisible) return;

            inputBox = new BABYLON.GUI.InputText();
            inputBox.width = "300px";
            inputBox.height = "40px";
            inputBox.top = "-200px";
            inputBox.color = "black";
            inputBox.background = "white";
            inputBox.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
            inputBox.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
            gui.addControl(inputBox);

            outputText = new BABYLON.GUI.TextBlock();
            outputText.text = "GPT 응답이 여기에 표시됩니다.";
            outputText.color = "white";
            outputText.top = "150px";
            outputText.fontSize = 24;
            outputText.textWrapping = true;
            outputText.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
            outputText.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
            gui.addControl(outputText);

            setTimeout(() => {
                inputBox.focus();
            }, 100); // 포커스 확실하게 보장

            uiVisible = true;

            inputBox.onKeyboardEventProcessedObservable.add((evt) => {
                if (evt.key === "Enter" && inputBox.text.trim() !== "") {
                    fetch('/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message: inputBox.text })
                    })
                    .then(res => res.json())
                    .then(data => outputText.text = data.reply)
                    .catch(() => outputText.text = "오류 발생");
                }
            });
        }

        function hideGPTUI() {
            if (!uiVisible) return;
            gui.removeControl(inputBox);
            gui.removeControl(outputText);
            inputBox = null;
            outputText = null;
            uiVisible = false;
        }

        // GPT Plane 클릭 시 UI 열기
        plane.actionManager = new BABYLON.ActionManager(scene);
        plane.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => showGPTUI())
        );

        // ESC 키로 UI 닫기
        window.addEventListener('keydown', function (e) {
            if (e.key === "Escape") {
                hideGPTUI();
            }
        });

        return scene;
    };

    const scene = await createScene();
    engine.runRenderLoop(() => scene.render());
    window.addEventListener('resize', () => engine.resize());
});
