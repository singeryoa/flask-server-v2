
// 최상단에 async 함수로 전체 묶기
// 기존 코드는 바로 아래와 같음. await 기능을 추가하며 async 함수 추가
// window.addEventListener('DOMContentLoaded', () => {



    window.addEventListener('DOMContentLoaded', async () => {

        function showDebug(message) {
            const debug = document.getElementById("debugLog");
            if (debug) {
                debug.innerText = message;
            }
        }
    
    
    
        window.addEventListener("keydown", function (event) {
            if (event.key === "g") {
              const gptUI = document.getElementById("gptUI");
              gptUI.style.display = "block";
            }
        });
          
        
    
        const canvas = document.getElementById('renderCanvas');
    
        // 렌더 지연 방지를 위한 BABYLON.Engine 초기화 설정
        const engine = new BABYLON.Engine(canvas, true, {
            preserveDrawingBuffer: true,
            stencil: true,
            disableWebGL2Support: false
        });
        // const engine = new BABYLON.Engine(canvas, true);  최적화를 위해 위 5줄로 변경
    
        const scene = new BABYLON.Scene(engine);
        // scene.clearColor = new BABYLON.Color3(0.8, 0.9, 1.0); // 밝은 배경, 이 코드는 없어도 됨
    
        // GLB 모델: 최대 3~5MB 이하 권장 (10MB 이상은 Quest에서 로딩 문제 발생)
        // 스카이박스: 512px~1024px 사이 해상도 가장 적합
        // 2048px 이상 → VR 모드에서 로딩 실패 가능성 ↑
        // Babylon.js 씬 최적화
        // main.js의 createScene() 함수 최상단에 아래 추가:
        scene.autoClear = true;
        scene.autoClearDepthAndStencil = true;
        scene.useRightHandedSystem = false;
        engine.setHardwareScalingLevel(1.5); // 낮을수록 더 높은 해상도 (1.5~2 추천)
    
    
    
    
    
        // 카메라 + WASD 이동
        const camera = new BABYLON.UniversalCamera("UniCam", new BABYLON.Vector3(0, 2, -5), scene);
        camera.attachControl(canvas, true);
        camera.speed = 0.2;
    
        camera.keysUp.push(87);    // W
        camera.keysDown.push(83);  // S
        camera.keysLeft.push(65);  // A
        camera.keysRight.push(68); // D
    
    
        // 바닥
        const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 20, height: 20 }, scene);
        ground.material = new BABYLON.StandardMaterial("groundMat", scene);
        ground.material.diffuseColor = new BABYLON.Color3(1, 1, 1);
    
    
    
    
    
    
        /*  
        // 퀘스트에서 Web Speech API를 지원하는 환경에서만 음성 인식 실행
        // Meta Quest 브라우저(VR 모드 포함)에서는 기본적으로 SpeechRecognition이 동작하지 않습니다. 대안으로:
        // 퀘스트 내 Wolvic 브라우저 설치 시 가능
        document.getElementById("voiceBtn").addEventListener("click", () => {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                alert("이 브라우저는 음성 인식을 지원하지 않습니다.");
                return;
            }
    
            const recognition = new SpeechRecognition();
            recognition.lang = "ko-KR";
            recognition.start();
    
            recognition.onresult = (event) => {
                const msg = event.results[0][0].transcript;
                document.getElementById("gptInput").value = msg;
            };
    
            recognition.onerror = (event) => {
                alert("음성 인식 에러: " + event.error);
            };
        });
        */
    
    
    
        // 조명
        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = 1;
    
    
        // Babylon.js 씬 최적화
        scene.autoClear = true;
        scene.autoClearDepthAndStencil = true;
        scene.useRightHandedSystem = false;
        engine.setHardwareScalingLevel(1.5); // 낮을수록 더 높은 해상도 (1.5~2 추천)
    
    
    
    
    
    
        // 이 바로 위의 scene이 선언된 이후에 npcMat을 선언
        // 이 아래 GPT NPC 평면 코드의 바로 위에 이 코드가 위치해야함
        const npcMat = new BABYLON.StandardMaterial("npcMat", scene);
        npcMat.diffuseTexture = new BABYLON.DynamicTexture("npcTextTex", { width: 512, height: 256 }, scene, false);
        
    
    
        // GPT NPC 입력 평면
        const npcPlane = BABYLON.MeshBuilder.CreatePlane("npcText", { width: 4, height: 2 }, scene);
        npcPlane.position = new BABYLON.Vector3(0, 2, 8);  // 카메라 앞쪽으로 바꿈
        npcPlane.isVisible = true;     // 혹시 모르니 명시적으로 true 설정
        
    
    
        // 아래 2줄 위치가 글로벌 변수처럼럼 상단으로 이동됨
        // const npcMat = new BABYLON.StandardMaterial("npcMat", scene);
        // npcMat.diffuseTexture = new BABYLON.DynamicTexture("npcTextTex", { width: 512, height: 256 }, scene, false);
        
        npcPlane.material = npcMat;
        const ctx = npcMat.diffuseTexture.getContext();
        if (!ctx) {
            console.error("❌ 텍스처 컨텍스트를 가져올 수 없습니다.");
            return;
        }
        ctx.font = "bold 28px Arial";
        ctx.fillStyle = "white";
        ctx.fillText("텍스트 출력 성공!", 10, 100);
        npcMat.diffuseTexture.update();
    
    
    
    
        // NPC 클릭 → GPT 대화 시작
        npcPlane.actionManager = new BABYLON.ActionManager(scene);
        npcPlane.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnPickTrigger,
                () => {
                    document.getElementById("gptUI").style.display = "block";
                    document.getElementById("gptInput").focus();
                }
            )
        );
    
        // VR 모드 내에서 마우스 클릭 이벤트 (onPointerPick)가 동작하지 않을 수 있음
        // 대신 WebXRControllerPointerSelection 또는 WebXR input event를 써야 합니다
        // Babylon.js에서 VR 모드 전용 컨트롤러 트리거 이벤트 등록 필요
        scene.onPointerObservable.add((pointerInfo) => {
            if (pointerInfo.pickInfo.hit && pointerInfo.pickInfo.pickedMesh.name === "npcText") {
                document.getElementById("gptUI").style.display = "block";
                document.getElementById("gptInput").focus();
            }
        }, BABYLON.PointerEventTypes.POINTERDOWN);
    
    
    
    
    
        // GPT 응답 전용 평면 생성
        const gptAnswerPlane = BABYLON.MeshBuilder.CreatePlane("gptAnswerText", { width: 4, height: 2 }, scene);
        gptAnswerPlane.position = new BABYLON.Vector3(0, 2, 4); // 카메라 앞쪽에 배치
        gptAnswerPlane.isVisible = true;
    
        /* 
        렌더링 순서 조정: 텍스처를 사용하는 메쉬의 renderingGroupId를 설정하여 렌더링 순서를 조정
        예를 들어, 응답판이 다른 객체들보다 나중에 렌더링되도록 설정
        이때, 다른 메쉬들의 renderingGroupId는 기본값인 0으로 유지됩니다.
        */
        gptAnswerPlane.renderingGroupId = 1;    //  응답판 렌더링 순서
    
        const gptAnswerMat = new BABYLON.StandardMaterial("gptAnswerMat", scene);
    
        const gptAnswerTex = new BABYLON.DynamicTexture("gptAnswerTex", { width: 512, height: 256 }, scene, false);
        gptAnswerTex.hasAlpha = true;  // ✅ 알파 채널 허용
    
        gptAnswerMat.diffuseTexture = gptAnswerTex;
        gptAnswerMat.emissiveColor = new BABYLON.Color3(1, 1, 1); // ✅ 자체 발광
    
        // 텍스처의 invertY 속성 확인: 텍스처가 뒤집혀 보이는 경우 invertY 속성을 false로 설정하여 Y축 반전을 방지
        gptAnswerMat.diffuseTexture = new BABYLON.DynamicTexture("gptAnswerTex", { width: 512, height: 256 }, scene, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE, false);
        // gptAnswerMat.diffuseTexture = new BABYLON.DynamicTexture("gptAnswerTex", { width: 512, height: 256 }, scene, false);
    
        gptAnswerPlane.material = gptAnswerMat;
    
        // const ansCtx = gptAnswerMat.diffuseTexture.getContext();
        /* 
        const ansCtx = gptAnswerTex.getContext();
        ansCtx.clearRect(0, 0, 512, 256);
        ansCtx.font = "bold 22px Arial";
        ansCtx.fillStyle = "white"; // ✅ 흰색 글씨로 잘 보이게
        ansCtx.textAlign = "left";
        ansCtx.fillText("✅ GPT 응답이 여기에 뜹니다!", 10, 100); // 가운데 정렬로 위치 조정
        */
        
        
    
        // 처음에 텍스트가 제대로 로드되지 않으면 텍스처 갱신이 안 될 수 있습니다.
        // 그럴 땐 update() 호출 전 ctx.clearRect() + update()를 두 번 호출해보는 것도 방법입니다:
        gptAnswerMat.diffuseTexture.update();   // 두 번 호출해도 무방
        gptAnswerMat.diffuseTexture.update();
        gptAnswerMat.diffuseTexture.needsUpdate = true;
    
    
    
    
        
        // ✅ 비디오 판 생성
    
        if (!window.videoPlane) {
            // 1. HTMLVideoElement 직접 생성 (src만 지정하고 자동 재생 X)
            const video = document.createElement("video");
            video.src = "https://flask-server-v2.onrender.com/gpt_video";
            video.crossOrigin = "anonymous";
            video.loop = false;
            video.autoplay = false;   // ❗자동 재생 금지
            video.muted = true;
            video.playsInline = true;  // iOS 대응
            // window.videoElement = video;      //  뒤로 옮김
    
            
            video.addEventListener("loadeddata", () => {
                console.log("🎬 리스너 : loaded 데이터");
                // video.play();  sendGPT 구문 내로 이동됨
            });
            
    
            console.log("📦 비디오 엘리먼트 생성:", video);
            showDebug("📦 비디오 엘리먼트트 생성:");
        
            // 2. Babylon VideoTexture 생성
            // 원인은 Babylon.js의 VideoTexture가 생성될 때 HTMLVideoElement.play()를 내부적으로 
            // 자동 실행하는 구조 때문일 가능성이 높음.  
            // 바로 아래 4번째 인자인 generateMipMaps = false 로 변경
            const videoTexture = new BABYLON.VideoTexture("gptVideo", video, scene, false, true);
            videoTexture.hasAlpha = true;
            console.log("📦 비디오 텍스쳐 생성:");
            showDebug("📦 비디오 텍스쳐 생성:");
    
            // 3. 머티리얼 생성
            const videoMaterial = new BABYLON.StandardMaterial("videoMat", scene);
            videoMaterial.diffuseTexture = videoTexture;
            videoMaterial.backFaceCulling = false;  // 뒤에서도 보이게
            videoMaterial.alpha = 1;
            videoMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1); // 밝기 보정
    
            console.log("📦 비디오 머티리얼 생성:", video);
            showDebug("📦 비디오 머티리얼얼 생성:");
        
            // 4. 비디오 평면 생성
            const plane = BABYLON.MeshBuilder.CreatePlane("videoPlane", { width: 4, height: 2.25 }, scene);
            plane.position = new BABYLON.Vector3(0, 2, 0);
            plane.rotation.x = Math.PI;     // 회전 추가 (X축 기준 180도 뒤집기)
            plane.material = videoMaterial;
            plane.isVisible = true;
            plane.visibility = 1;
            console.log("📺 비디오 평면 생성 시작");
            showDebug("📺 비디오 평면 생성 시작");
        
            
            // 5. 윈도우에 저장
            window.videoPlane = plane;
            window.videoTexture = videoTexture;
            window.videoElement = video;          // 앞에서 이 위치로 옮김
            console.log("📦 윈도우에 저장");
            showDebug("📦 윈도우에 저장:");
    
    
            // 자동 재생 방지를 위해 명시적으로 중단
            video.pause();
            video.currentTime = 0;
    
            window.videoPlane.renderingGroupId = 2;   // 비디오판 → renderGroupId = 2 (더 뒤쪽에 렌더링되도록)
        
    
            // 6. 사용자 클릭 시 재생 트리거
            // 일단 생략
            /* 
            scene.onPointerDown = () => {
                if (video.paused) {
                    video.play();
                }
            };
            */
    
            console.log("✅ 비디오 평면 생성 완료");
            showDebug("📦 비디오 평면 생성 완료:");
    
        }
        
    
    
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert("⚠️ 이 브라우저는 마이크 기능을 지원하지 않습니다.");
            showDebug("📦 이 브라우저는 마이크 기능을 지원하지 않습니다.");
            return;
        }
        
        
    
    
        // 음성 대화를 위한 3d 구체 오브젝트 생성
        const voiceSphere = BABYLON.MeshBuilder.CreateSphere("voiceSphere", {diameter: 0.5}, scene);
        voiceSphere.position = new BABYLON.Vector3(1, 1, 0);  // 적절한 위치 조정
    
    
        // 음성 녹음 후 Whisper → mp4 출력 (구체 클릭 기반)
        // const sphere = scene.getMeshByName("voiceSphere");
    
        if (voiceSphere) {
            voiceSphere.actionManager = new BABYLON.ActionManager(scene);
            voiceSphere.actionManager.registerAction(
                new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, async function () {
                    logToDebug("🎤 구체 내 마이크 요청 중...");
                    showDebug("📦 구체 내 마이크 요청 중...");
                    try {
                        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                        logToDebug("🎤 구체 내 마이크 허용됨");
                        showDebug("📦 구체 내 마이크 허용됨");
    
                        const mediaRecorder = new MediaRecorder(stream);
                        const chunks = [];
    
                        mediaRecorder.ondataavailable = e => chunks.push(e.data);
                        mediaRecorder.onstop = async () => {
                            const blob = new Blob(chunks, { type: 'audio/mp3' });
                            const formData = new FormData();
                            formData.append("file", blob, "response.mp3");
    



                        
                            let data;
                            try {
                                const res = await fetch("https://flask-server-v2.onrender.com/whisper", {
                                    method: "POST",
                                    body: formData
                                });

                                
                                const text = await res.text();
                                console.log("🟢 Whisper 응답 원문:", text);

                                try {
                                    data = JSON.parse(text);
                                } catch (jsonErr) {
                                    console.error("❌ 구체 JSON 파싱 실패:", jsonErr.message);
                                    alert("❌ 구체 내 Whisper JSON 파싱 실패: " + jsonErr.message);
                                    showDebug("📦 구체 내 Whisper JSON 파싱 실패");
                                    return;
                                }




                                const recognizedText = data.text?.trim();  // Whisper 결과 저장
                                console.log("🧠 Whisper 텍스트:", recognizedText);

                                // 바로 아래에서 data.text 를 아래처럼 3곳 변경함
                                // if (data.transcript)   여기를 아래처럼 변경
                                if (recognizedText && recognizedText.length > 0) {

                                    logToDebug("🧠 구체 GPT 질문 인식됨: " + recognizedText);
                                    // logToDebug("🧠 구체 GPT 질문 인식됨: " + data.transcript);
                                    showDebug("📦 구체 GPT 질문 인식됨");

                                    // 두줄 아래에서 아래로 변경
                                    sendToGPT(recognizedText);  // 반드시 trim 해서 전달
                                    // sendToGPT(data.transcript);  // → GPT 응답 함수 호출
                                } else {
                                    alert("❌ 구체 내 Whisper 실패: " + (data.error || "에러 없음"));
                                    showDebug("📦 구체 내 Whisper 실패");
                                }
                            } catch (err) {
                                console.error("❌ Whisper 서버 통신 실패:", err);
                                alert("⚠️ Whisper 서버 통신 실패: " + err.message);
                                showDebug("📦 Whisper 서버 통신 실패");
                            }
                        };
    
                        mediaRecorder.start();
                        setTimeout(() => mediaRecorder.stop(), 5000);
                    } catch (err) {
                        alert("❌ 구체 내 마이크 접근 실패: " + err.message);
                        showDebug("📦 구체 내 마이크 접근 실패");
                    }
                })
            );
        }
    
    





        // 🎯 gTTS 테스트용 구체 생성
        const gttsSphere = BABYLON.MeshBuilder.CreateSphere("gttsSphere", {diameter: 0.5}, scene);
        gttsSphere.position = new BABYLON.Vector3(2, 1, 0);  // 기존 구체 옆에 위치
        showDebug("📦 gTTS 테스트용 구체 생성 완료");

        gttsSphere.actionManager = new BABYLON.ActionManager(scene);
        gttsSphere.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, async function () {
                logToDebug("🎯 gTTS 테스트 시작");
                showDebug("📦 gTTS 테스트 시작");

                try {
                    const res = await fetch("https://flask-server-v2.onrender.com/test_gtts");
                    const result = await res.text();
                    console.log("✅ gTTS 서버 응답:", result);
                    showDebug("✅ gTTS 서버 응답: " + result);

                    // mp4 영상 재생
                    if (window.videoElement) {
                        window.videoElement.src = "/gpt_video";  // 상대경로로 변경 (CORS 이슈 방지)
                        window.videoElement.currentTime = 0;
                        await window.videoElement.play();
                        showDebug("✅ gTTS 영상 재생 시작");
                    }

                } catch (err) {
                    console.error("❌ gTTS 요청 실패:", err);
                    showDebug("❌ gTTS 요청 실패: " + err.message);
                }
            })
        );




        // gTTS 전용 비디오 판 (중간 위치)
        const gttsVideoPlane = BABYLON.MeshBuilder.CreatePlane("gttsVideoPlane", { width: 4, height: 2.25 }, scene);
        gttsVideoPlane.position = new BABYLON.Vector3(0, 2, 2);
        gttsVideoPlane.rotation.x = Math.PI;
        gttsVideoPlane.material = new BABYLON.StandardMaterial("gttsVideoMat", scene);
        window.gttsVideoPlane = gttsVideoPlane;





        // ✅ GPT 응답을 음성(mp4)으로 출력하는 전용 원기둥 생성
        const gptSpeechCylinder = BABYLON.MeshBuilder.CreateCylinder("gptSpeechCylinder", {
            diameter: 0.5,
            height: 1
        }, scene);
        gptSpeechCylinder.position = new BABYLON.Vector3(-1, 0.5, 0);  // 기존 오브젝트와 간섭 없이 적당히 배치
        window.gptSpeechCylinder = gptSpeechCylinder; // 반드시 윈도우에 등록

        // 재질 또는 색상 설정 (선택)
        const gptMat = new BABYLON.StandardMaterial("gptMat", scene);
        gptMat.diffuseColor = new BABYLON.Color3(1, 0.6, 0);
        gptSpeechCylinder.material = gptMat;

        console.log("✅ gTTS 테스트용 원기둥 생성 완료");
        showDebug("📥 gTTS 테스트용 원기둥 생성 완료");


        gptSpeechCylinder.actionManager = new BABYLON.ActionManager(scene);

        gptSpeechCylinder.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, async function () {
                // 음성 인식 시작
                console.log("🎤 원기둥 클릭됨 → 음성 인식 시작");
                showDebug("📥 원기둥 클릭됨 → 음성 인식 시작");
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mediaRecorder = new MediaRecorder(stream);
                const chunks = [];
        
                mediaRecorder.ondataavailable = e => chunks.push(e.data);
                mediaRecorder.onstop = async () => {
                    const blob = new Blob(chunks, { type: 'audio/mp3' });
                    const formData = new FormData();
                    formData.append("file", blob, "voice.mp3");
        
                    try {
                        // Whisper → 텍스트 인식
                        const res = await fetch("https://flask-server-v2.onrender.com/whisper", {
                            method: "POST",
                            body: formData
                        });
        
                        const text = await res.text();
                        const data = JSON.parse(text);
                        const question = data.text?.trim();
                        if (!question) return;
        
                        showDebug("📤 Whisper 결과 → GPT 전송: " + question);
        
                        // GPT 응답 요청
                        const gptRes = await fetch("https://flask-server-v2.onrender.com/gpt_test", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ message: question })
                        });
                        const gptData = await gptRes.json();
                        const answer = gptData.response;
        
                        showDebug("📥 GPT 응답 도착 → gTTS 전송");
        
                        // gTTS로 변환 요청
                        await fetch("https://flask-server-v2.onrender.com/gtts", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ text: answer })
                        });
        
                        // mp4 영상 재생    두 줄 아래에서 바로 아래로 변경
                        // window.gttsVideoElement.src = "https://flask-server-v2.onrender.com/static/audio/response.mp4";
                        // window.gttsVideoElement.src = "https://flask-server-v2.onrender.com/gpt_video";
                        // GPT 응답 영상 출력 시는 새 라우터 사용
                        window.gttsVideoElement.src = "/gpt_response_video";

                        window.gttsVideoElement.currentTime = 0;
                        window.gttsVideoElement.play();
                        showDebug("✅ GPT 응답 영상 재생 완료");
        
                    } catch (err) {
                        console.error("❌ 오류 발생:", err);
                        showDebug("❌ 처리 실패: " + err.message);
                    }
                };
        
                mediaRecorder.start();
                setTimeout(() => mediaRecorder.stop(), 5000);
            })
        );
        






        /*  이건 음성 인식 후 원기둥을 클릭하면 GPT 음성영상을 출력하는 구조이므로 일단 생략
        // ✅ GPT 응답을 음성(mp4)으로 출력하는 전용 원기둥 생성
        const gptSpeechCylinder = BABYLON.MeshBuilder.CreateCylinder("gptSpeechCylinder", {
            diameter: 0.5,
            height: 1
        }, scene);
        gptSpeechCylinder.position = new BABYLON.Vector3(-1, 0.5, 0);  // 기존 오브젝트와 간섭 없이 적당히 배치

        gptSpeechCylinder.actionManager = new BABYLON.ActionManager(scene);

        gptSpeechCylinder.actionManager.registerAction(
          new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, async function () {
            showDebug("🎤 원기둥 클릭됨: 음성 녹음 시작");
        
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              const mediaRecorder = new MediaRecorder(stream);
              const chunks = [];
        
              mediaRecorder.ondataavailable = e => chunks.push(e.data);
              mediaRecorder.onstop = async () => {
                const blob = new Blob(chunks, { type: 'audio/mp3' });
                const formData = new FormData();
                formData.append("file", blob, "voice.mp3");
        
                try {
                  const res = await fetch("https://flask-server-v2.onrender.com/whisper", {
                    method: "POST",
                    body: formData
                  });
        
                  const textData = await res.text();
                  const data = JSON.parse(textData);
                  const userText = data.text?.trim();
        
                  if (!userText) {
                    showDebug("❌ Whisper 인식 실패");
                    return;
                  }
        
                  showDebug("🧠 Whisper 인식 완료 → GPT 요청 중...");
        
                  // GPT 요청
                  const gptRes = await fetch("https://flask-server-v2.onrender.com/gpt_test", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: userText })
                  });
        
                  const gptData = await gptRes.json();
                  const gptResponse = gptData.response?.trim();
        
                  if (!gptResponse) {
                    showDebug("❌ GPT 응답 없음");
                    return;
                  }
        
                  showDebug("🟢 GPT 응답 수신 → gTTS로 전송 중...");
        
                  // gTTS 변환 요청
                  await fetch("https://flask-server-v2.onrender.com/gtts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text: gptResponse })
                  });
        

                  // 1. gttsVideoElement 존재 여부 콘솔에 로그 추가
                  console.log("🎬 gttsVideoElement 확인:", window.gttsVideoElement);

                  // 영상 재생
                  if (window.gttsVideoElement) {
                    window.gttsVideoElement.src = "https://flask-server-v2.onrender.com/static/audio/gpt_response.mp4";
                    window.gttsVideoElement.currentTime = 0;
                    
                    window.gttsVideoElement.play()
                        .then(() => {
                            showDebug("✅ GPT 음성 영상 재생 시작");
                            console.log("🎬 영상 재생 성공");
                        })
                        .catch(err => {
                                console.error("❌ 영상 재생 실패:", err);
                                showDebug("❌ GPT 음성 영상 재생 실패");
                        });

                    showDebug("✅ GPT 응답 영상 재생 시작 2");
                  } else {
                    console.warn("⚠️ gttsVideoElement가 정의되지 않았습니다");
                    showDebug("❌ gttsVideoElement가 없음");
                  }
        
                } catch (e) {
                  console.error("❌ 에러 발생:", e);
                  showDebug("❌ Whisper 또는 GPT 에러 발생");
                }
              };
        
              mediaRecorder.start();
              setTimeout(() => mediaRecorder.stop(), 5000);
        
            } catch (err) {
              console.error("❌ 마이크 접근 실패:", err);
              showDebug("❌ 마이크 접근 실패: " + err.message);
            }
          })
        );
        */    





    
    
        // avatar.glb 로드
        // SceneLoader.Append("/assets/", "avatar.glb", ...) 수정 완료됨
        // function (scene) 에서 function () 로 변경함
        // https://flask-server-v2.onrender.com/assets/avatar.glb 접속 → 정상 다운로드 또는 뷰 되면 OK
        // 여러 오브젝트를 배치하고 싶은 경우, 아래처럼 여러 번 SceneLoader.Append() 또는 ImportMesh() 호출하세요.
        // 직접 좌표 설정하고 싶다면 ImportMesh()로 로드 후 .position.set(x,y,z) 처리도 가능
        BABYLON.SceneLoader.Append("/assets/", "mole.glb", scene, function () {
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
    
    
    
    
    
        // 텔레포트. VR 모드 지원   아래는 기존 코드 1줄.  그 아래는 퀘스트 콘트롤러로 텔레포트 이동 기능.
        // 주의: ground 객체는 미리 BABYLON.MeshBuilder.CreateGround(...)로 생성돼 있어야 합니다.
        // const xrHelperPromise = scene.createDefaultXRExperienceAsync({});
        const xrHelper = await scene.createDefaultXRExperienceAsync({
            floorMeshes: [ground]  // 기존 바닥 메쉬를 지정해줘야 텔레포트 가능
        });
        xrHelper.teleportation.enabled = true;
    
    
    
        // 텔레포트를 위한 새로운 바닥 메시를 만들 경우, 아래 코드 이용. 기존 ground 메시 위에 투명 처리.
        /*
        const teleportFloor = BABYLON.MeshBuilder.CreateGround("teleFloor", { width: 20, height: 20 }, scene);
        teleportFloor.position.y = 0.01;  // 기존 메시와 겹칠 경우 살짝 위로
        teleportFloor.isVisible = false; // 플레이어 눈에는 안 보이게
    
    
        const xrHelperPromise = scene.createDefaultXRExperienceAsync().then((xrHelper) => {
            const featuresManager = xrHelper.baseExperience.featuresManager;
            featuresManager.enableFeature(BABYLON.WebXRFeatureName.TELEPORTATION, 'stable', {
                floorMeshes: [teleportFloor]  
            });
        });
        */
    
    
    
    
        // 배경 스카이박스 생성
        // createScene() 함수 하단 또는 GLB 로딩 이후에 추가
        const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000.0 }, scene);
        const skyboxMaterial = new BABYLON.StandardMaterial("skyBoxMaterial", scene);  // skyBoxMaterial 는 변수명이므로 skyBox 로 해도 됨
    
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.disableLighting = true;
        // skybox.infiniteDistance = true;     생략 가능.
    
    
        // 스카이박스 텍스쳐 설정
        // 스카이박스 개인 파일로 설정은 바로 아래 코드 사용
        // skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("/assets/skybox/sky", scene);
        /* 
        스카이박스를 /static/world/assets/skybox/ 폴더에 아래와 같이 넣습니다:
        sky_px.jpg
        sky_py.jpg
        sky_pz.jpg
        sky_nx.jpg
        sky_ny.jpg
        sky_nz.jpg
        그 후, 위 Babylon 코드에서 "/assets/skybox/sky" 는 "sky_px.jpg" 등으로 확장자를 자동 인식하여 6면 큐브로 스카이박스를 구성합니다.
        */
        // 아래 1줄은 기존 제공 코드.   
        // skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("https://playground.babylonjs.com/textures/skybox", scene);
        skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("/assets/skybox/sky", scene);
        skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    
        skybox.material = skyboxMaterial;
    
    
    
    
    
    
        /*
        // Whisper 이용 시,   mp3 전송용 JavaScript (main.js 또는 별도 js 파일에 추가)
        // 이건 클라이언트에서 음성을 녹음해서 FormData로 mp3를 전송하는 예시
    
        let mediaRecorder;
        let audioChunks = [];
    
        document.getElementById("voiceBtn").addEventListener("click", async () => {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
    
            mediaRecorder.ondataavailable = event => {
                audioChunks.push(event.data);
            };
    
            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
                const formData = new FormData();
                formData.append('file', audioBlob, 'speech.mp3');
    
                const response = await fetch("https://flask-server-v2.onrender.com/whisper", {
                    method: "POST",
                    body: formData
                });
    
                const data = await response.json();
                if (data.text) {
                    document.getElementById("gptInput").value = data.text;
                } else {
                    alert("인식 실패: " + (data.error || ''));
                }
            };
    
            mediaRecorder.start();
            setTimeout(() => mediaRecorder.stop(), 5000); // 5초 녹음 후 자동 중단
        });
        */
    
    
    
    
    
        // postman 으로 whisper 를 빠르게 로컬 테스트 시 사용하는 코드
        // GPT 음성 입력 클릭하여 음성을 받고 GPT 가 응답하여 mp4로 변환 후, 음성이 포함된 영상으로 응답
        /*
        document.getElementById("voiceBtn").addEventListener("click", async () => {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            const audioChunks = [];
    
            mediaRecorder.ondataavailable = event => {
                audioChunks.push(event.data);
            };
    
            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
                const formData = new FormData();
                formData.append('file', audioBlob, 'speech.mp3');
    
                try {
                    const response = await fetch("https://flask-server-v2.onrender.com/whisper", {
                        method: "POST",
                        body: formData
                    });
    
                    const data = await response.json();
    
                    if (data.text) {
                        document.getElementById("gptInput").value = data.text;
                        sendToGPT();  // Whisper 결과 바로 GPT에 전송
                    } else {
                        showDebug("❌ Whisper 인식 실패");
                    }
    
                } catch (err) {
                    console.error("❌ Whisper 서버 오류:", err);
                    showDebug("❌ Whisper 서버 오류 발생");
                }
            };
    
            mediaRecorder.start();
            setTimeout(() => mediaRecorder.stop(), 5000); // 5초 녹음
        });
        */
    
    
    
    
        // OpenAI whisper api 코드.
        
    
    
    
     
    
        // GPT로 메시지 전송
        // static/world/index.html 파일의 "GPT 대화 UI" 주석처리 부분이 쌍으로 같이 있어야 함
        window.sendToGPT = function (msgFromWhisper = "") {

            let msg = msgFromWhisper?.trim();
            console.log("🎯 Whisper 입력 내용:", msg);
            showDebug("🟢 Whisper 입력 내용");

            if (!msg || msg.length === 0) {
                msg = document.getElementById("gptInput")?.value?.trim() || "";
                if (!msg || msg.length === 0) {
                    console.log("❌ 최종적으로 입력이 비어있음");
                    showDebug("❌ 최종적으로 입력이 비어있음");
                    return;
                }
                //console.log("⚠️ 최종적으로 입력이 비어 있음");
                //return;
            }

            console.log("✅ fetch 실행 - GPT에 보낼 메시지:", msg);

                // 아래 두 줄은 위 한줄로 대체
                // const inputValue = document.getElementById("gptInput")?.value;
                // msg = inputValue?.trim() || "";
        
    
            console.log("🟢 sendToGPT 함수 실행됨");
            showDebug("🟢 sendToGPT 함수 실행됨");  // 여기에 디버그 출력
    
            // 이 부분은 텍스트 기반 GPT 입력 ui 부분 인데 일단 아래 한 줄만 생략함
            // msg = document.getElementById("gptInput").value;
            if (!msg) {
                console.log("❌ 최종적으로 입력이 비어있을까?");
                showDebug("❌ 최종적으로 입력이 비어있을까?");
                return;
            }
            
    
            console.log("🟢 fetch 시작 전");

            // fetch("/gpt_test",  에서 아래 경로로 변경 
            fetch("https://flask-server-v2.onrender.com/gpt_test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: msg })
            })

            .then(res => res.json())
            

    
            //  GPT 응답 ui 부분 수정 부분
            .then(data => {
                console.log("✅ GPT 응답:", data.response);
                console.log("🟢 GPT 응답 데이터 수신:", data);
                showDebug("🟢 GPT 응답");
            
    
                // ✅ GPT 응답을 전역 변수에 저장
                window.lastGptResponse = data.response;  
                console.log("📌 GPT 응답 저장됨:", window.lastGptResponse);
                showDebug("📦 GPT 응답 저장됨");

    
    
    
                // 여기 묶음은 질문판에서 출력 부분 제거 하기 위해 주석 처리
                // 안전하게 텍스처 컨텍스트 가져오기
                const texture = npcMat.diffuseTexture.getContext();
                if (!texture) {
                    console.error("❌ 텍스처 컨텍스트 없음");
                    showDebug("🟢 텍스처 컨텍스트 없음");
                    return;
                } else {
                    console.log("✅ npc 질문 ctx 있음, 텍스트 처리 시도")
                    showDebug("🟢 npc 질문 ctx 있음, 텍스트 처리 시도");
                }
            
                // 텍스트 출력 전 clear
                texture.clearRect(0, 0, 512, 256);
            
                // 텍스트 스타일 설정 및 출력
                texture.font = "bold 22px Arial";
                texture.fillStyle = "white";
                texture.textAlign = "left"; // 기본값이긴 하지만 확실히 문자가 보이도록 명시
            
                // 너무 길 경우 줄바꿈 처리 (최대 40자 기준)
                const lines = data.response.match(/.{1,20}/g); // 40자씩 자름
                lines.forEach((line, index) => {
                    texture.fillText(line, 10, 40 + index * 30);
                });
    
    
                // ✅ 퀘스트 VR 브라우저 응답 대응용 추가 설정
                gptAnswerTex.hasAlpha = true;
                gptAnswerTex._texture.isReady = true;
    
                // ✅ 반드시 update 호출
                gptAnswerTex.update();
    
            
                // 텍스처 갱신
                npcMat.diffuseTexture.update();
                
                
    
    
    
                // 응답판 출력 (gptAnswerMat)
                const ansCtx = gptAnswerMat.diffuseTexture.getContext();
                if (ansCtx) {
                    ansCtx.clearRect(0, 0, 512, 256);
                    ansCtx.font = "bold 22px Arial";
                    ansCtx.fillStyle = "white";
                    ansCtx.textAlign = "left";
                    const lines = data.response.match(/.{1,20}/g);
                    lines.forEach((line, index) => {
                        ansCtx.fillText(line, 10, 40 + index * 30);
                    });
    
                    scene.onBeforeRenderObservable.add(() => {
                        gptAnswerMat.diffuseTexture.update();     // 여기에 위아래에 저렇게 감쌌음
                    });
                }
            
            
    
    
    
                // UI 숨기기
                document.getElementById("gptUI").style.display = "none";

    
    
                // Babylon.js: 응답 영상 재생 기능 추가
                // 영상 텍스처 재생용 plane 생성 (최초 1회만)
                /* 
                if (!window.videoPlane) {
                    const videoTexture = new BABYLON.VideoTexture(
                        "gptVideo",
                        "https://flask-server-v2.onrender.com/gpt_video",
                        scene,
                        true,
                        true,
                        BABYLON.VideoTexture.TRILINEAR_SAMPLINGMODE,
                        null,
                        {
                            autoPlay: true,
                            loop: false,
                            muted: true
                        }
                    
                    );
                    const videoMaterial = new BABYLON.StandardMaterial("videoMat", scene);
                    videoMaterial.diffuseTexture = videoTexture;
    
                    const plane = BABYLON.MeshBuilder.CreatePlane("videoPlane", { width: 4, height: 2.25 }, scene);
                    plane.position = new BABYLON.Vector3(0, 2, 0);  // 카메라 앞쪽
                    plane.material = videoMaterial;
    
                    window.videoPlane = plane;
                    window.videoTexture = videoTexture;
    
                    // ✅ 바로 여기! 비디오 생성 후 위치
                    scene.onPointerDown = () => {
                        if (videoTexture.video.paused) {
                            videoTexture.video.play();
                        }
                    };
    
    
                } else {
                    window.videoTexture.video.currentTime = 0;
                    window.videoTexture.video.play();
                }
                */
    
    
    
                // 6. 사용자 클릭 시 영상 재생 트리거
                /* 일단 생략
                scene.onPointerDown = () => {
                    if (video.paused) {
                        video.play();
                    }
                };
                */
    
    
                // GPT 응답 이후 재생만 하기 (sendToGPT() 내부)
                // 🎬 GPT 응답 이후에만 비디오 생성 및 재생
                
                // GPT 응답 처리 이후, 음성 영상 재생 시작
    
                if (window.videoElement) {
                    // 영상 출력 테스트 완료되면 이 바로 아래 줄 삭제
                    window.videoElement.src = "https://flask-server-v2.onrender.com/gpt_video";
                    window.videoElement.currentTime = 0;
                    window.videoElement.play();
                    showDebug("🟢 영상 플레이 완료");
                }
    
                // 위 3줄로 변경
                // window.videoElement.currentTime = 0;
                // window.videoElement.play();
        
    
    
                /*  
                // 영상 테스트 코드. 영상 텍스처 재생용 plane 생성
                // ✅ 항상 생성되도록 조건 제거
                const videoTexture = new BABYLON.VideoTexture(
                    "gptVideo",     // string
                    "https://flask-server-v2.onrender.com/gpt_video",    // string or HTMLVideoElement
                    scene,         // BABYLON.Scene
                    true,          // boolean.   generateMipMaps
                    true,          // boolean.   invertY
                    BABYLON.VideoTexture.TRILINEAR_SAMPLINGMODE,    // optional callback
                    null,          // onLoad
                    {
                        autoPlay: true,
                        loop: false,
                        muted: true   // ✅ 필수: 모바일/VR에서는 muted 설정 필요
                    }
                );
                    
    
                const videoMaterial = new BABYLON.StandardMaterial("videoMat", scene);
                videoMaterial.diffuseTexture = videoTexture;
    
                const plane = BABYLON.MeshBuilder.CreatePlane("videoPlane", { width: 4, height: 2.25 }, scene);
                plane.position = new BABYLON.Vector3(0, 2, 0);
                plane.material = videoMaterial;
    
                // ✅ 바로 여기! 비디오 생성 후 위치
                scene.onPointerDown = () => {
                    if (videoTexture.video.paused) {
                    videoTexture.video.play();
                    }
                };
                */



                /* 
                // 🔽🔽🔽 여기에 gTTS 영상 생성용 API 호출 추가 🔽🔽🔽
                fetch("https://flask-server-v2.onrender.com/gpt_voice", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text: data.response })
                })
                .then(() => {
                    console.log("✅ gTTS 음성 영상 생성 완료");
                    if (window.gttsVideoElement) {
                        window.gttsVideoElement.src = "https://flask-server-v2.onrender.com/static/audio/gpt_response.mp4";
                        window.gttsVideoElement.currentTime = 0;
                        window.gttsVideoElement.play();
                        showDebug("🟢 GPT 응답 음성 영상 재생 시작");
                    }
                })
                .catch(err => {
                    console.error("❌ gTTS 요청 실패:", err);
                });
                */





    
            })
            
    
            
    
    
    
    
            // 기존 GPT 응답 UI 부분이 출력되지 않음에 따라 위로 대체
            /*  
            .then(data => {
    
                // 아래는 기존 윈도우 창 응답 방식
                // alert("GPT 응답: " + data.response);  
    
    
    
                // 3D 텍스트 응답 방식
                // GPT 응답을 3D 평면에 출력
                console.log("✅ GPT 응답:", data.response);
    
                const texture = npcMat.diffuseTexture.getContext();
                texture.clearRect(0, 0, 512, 256);
                texture.font = "bold 26px Arial";
                texture.fillStyle = "black";
                texture.fillText(data.response, 10, 100);
                npcMat.diffuseTexture.update();
    
                document.getElementById("gptUI").style.display = "none";
            })
            */
    
            .catch(err => {
    
                console.log("🔥 GPT 에러 발생:", err);
                showDebug("🟢 GPT 에러 발생");
                // alert("에러 발생: " + err);
                document.getElementById("gptUI").style.display = "none";
            });
        }
    
    
    
    
    
    
    
    
    
    
    
    
    
    
        // 퀘스트 vr모드 용 입력 후 엔터 키 작동 법
        // 엔터 키 입력 시 자동 전송
        /*
        document.getElementById("gptInput").addEventListener("keydown", function (e) {
            if (e.key === "Enter" || e.key === "y" || e.key === "Y") {    // 임시로 Y 키 입력 테스트
                e.preventDefault(); // 기본 엔터 동작 방지 (폼 제출 방지)
                console.log("⏎ 엔터 입력 감지됨");
                showDebug("🟢 퀘스트 내 sendToGPT 함수 실행 및 엔터 입력 감지됨");
                sendToGPT();        // 우리가 정의한 GPT 전송 함수 호출
            }
        });
        */
    
    
        // 이건 gtts 비디오 출력을 위한 스크립트
        if (!window.gttsVideoElement) {
            const gttsVideo = document.createElement("video");
            gttsVideo.crossOrigin = "anonymous";
            gttsVideo.loop = false;
            gttsVideo.autoplay = false;
            gttsVideo.muted = true;
            gttsVideo.playsInline = true;
            window.gttsVideoElement = gttsVideo;
        
            console.log("✅ gttsVideoElement 생성 완료");
            showDebug("✅ gttsVideoElement 생성 완료");
        }
        


    
    
        setTimeout(() => {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
              logToDebug("❌ 브라우저에서 마이크 사용이 지원되지 않습니다.");
              showDebug("📦 브라우저에서 마이크 사용이 지원되지 않습니다.");
            } else {
              navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                  logToDebug("✅ 마이크 허용됨: " + stream.getAudioTracks().length + "개의 트랙 탐지됨");
                  console.log("🎤 마이크 스트림", stream);
                  showDebug("📦 마이크 허용됨");
                })
                .catch(err => {
                  logToDebug("❌ 마이크 접근 실패: " + err.message);
                  showDebug("📦 마이크 접근 실패:");
                });
            }
          }, 3000);  // 페이지 로딩 후 3초 뒤 실행
          
    
    
    
    
        // ESC 키 눌렀을 때 GPT UI 닫기
        window.addEventListener("keydown", function (e) {
            if (e.key === "Escape") {
                document.getElementById("gptUI").style.display = "none";
            }
        });
    
    
    
    
        engine.runRenderLoop(() => scene.render());
        window.addEventListener("resize", () => engine.resize());   // 현재 이게 2개 있으므로 주의
    
    
    
        function showDebug(message) {
            const debug = document.getElementById("debugLog");
            if (debug) {
                debug.innerText = message;
            }
        }
    
    
        function logToDebug(msg) {
            const log = document.getElementById("debugLog");
            if (log) log.innerText = msg;
            // log.innerText = msg;
        }
          
        
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