from flask import (
    Flask,
    render_template,
    request,
    redirect,
    url_for,
    send_from_directory,
    jsonify,
    send_file,
    make_response,
)
import sqlite3, os
from dotenv import load_dotenv

import openai   
# 최신 OpenAI > 아래 두 줄은 최신 OpenAI 이용을 위한 임포트
# from openai import OpenAI
# client = OpenAI()  # 자동으로 환경변수에서 API 키 사용

import tempfile
import base64

from flask_cors import CORS

import uuid
# import whisper
# from faster_whisper import WhisperModel

from gtts import gTTS
import subprocess

import logging

app = Flask(__name__, static_url_path="", static_folder="static")
# app = Flask(__name__)  위로 변경.
# Flask에서 static 경로를 root처럼 사용하게 만들기

# Whisper 모델 로딩 (GPU 완전 차단) faster-whisper 용용
# model = WhisperModel("base", device="cpu", compute_type="int8")
# model = whisper.load_model("base")  # 작은 모델부터 시작 (tiny/base/small/medium/large)

# CORS(app)
CORS(app, resources={r"/gpt_video": {"origins": "*"}})



"""
VSCode에선 설치하면 밑줄 없어짐	❌ Render 무료 서버에선 실행 불가
whisper 패키지가 설치되지 않아서 밑줄 오류가 발생
pip install git+https://github.com/openai/whisper.git
하지만 다시 강조드리지만, Render에 배포할 목적이라면 import whisper는 전혀 사용하지 않아야 합니다.
whisper 이용 시, 루트 폴더에 uploads 폴더 생성해야함. mp3 처리

# import whisper
"""

from werkzeug.utils import secure_filename



load_dotenv()

# 최신 OpenAI()   에서는 자동으로 환경변수 사용하므로 아래 1줄은 생략 가능
openai.api_key = os.getenv("OPENAI_API_KEY")  



DB_NAME = "database.db"


def init_db():
    with sqlite3.connect(DB_NAME) as conn:
        conn.execute(
            """CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nickname TEXT,
            level TEXT,
            points INTEGER DEFAULT 0
        )"""
        )
        conn.execute(
            """CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            author TEXT,
            date TEXT,
            enable_3d INTEGER DEFAULT 0
        )"""
        )





@app.route("/")
def index():
    init_db()
    with sqlite3.connect(DB_NAME) as conn:
        posts = conn.execute("SELECT * FROM posts ORDER BY id DESC").fetchall()
    return render_template("index.html", posts=posts)


@app.route("/register", methods=["POST"])
def register():
    nickname = request.form["nickname"]
    level = request.form["level"]
    with sqlite3.connect(DB_NAME) as conn:
        conn.execute(
            "INSERT INTO users (nickname, level) VALUES (?, ?)", (nickname, level)
        )
    return redirect(url_for("index"))


@app.route("/write", methods=["POST"])
def write():
    title = request.form["title"]
    author = request.form["author"]
    enable_3d = 1 if "enable_3d" in request.form else 0
    from datetime import datetime

    date = datetime.now().strftime("%Y-%m-%d")
    with sqlite3.connect(DB_NAME) as conn:
        conn.execute(
            "INSERT INTO posts (title, author, date, enable_3d) VALUES (?, ?, ?, ?)",
            (title, author, date, enable_3d),
        )
    return redirect(url_for("index"))


@app.route("/reward/<int:post_id>")
def reward(post_id):
    with sqlite3.connect(DB_NAME) as conn:
        post = conn.execute("SELECT * FROM posts WHERE id = ?", (post_id,)).fetchone()
        if post:
            conn.execute(
                "UPDATE users SET points = points + 30 WHERE nickname = ?", (post[2],)
            )
    return redirect(url_for("index"))


@app.route("/admin")
def admin():
    with sqlite3.connect(DB_NAME) as conn:
        users = conn.execute("SELECT * FROM users").fetchall()
    return render_template("admin.html", users=users)


# 이 구조는 정적 파일로 직접 HTML을 보내는 방식
# 이건 템플릿(templates) 방식이 아니라 static에서 바로 렌더링하는 구조
# static/world/index.html 위치는 send_from_directory(),   	templates/world.html 위치는 render_template() 방식식
@app.route("/world")
def world():
    return send_from_directory("static/world", "index.html")


# Flask 라우트(/assets/<path:filename>) 를 반드시 넣고 커밋해야 함. 아래 3줄 반드시 필요.
# 이 코드가 없다면 Render 서버는 /assets/avatar.glb 경로에 대한 요청을 처리할 수 없음.
@app.route("/assets/<path:filename>")
def serve_assets(filename):
    return send_from_directory("static/world/assets", filename)



# OpenAI 0.28 구버전 적용시 사용
@app.route("/gpt_test", methods=["POST"])
def gpt_test():
    try:
        logging.info("✅ 메시지 수신 전")
        data = request.get_json()
        print("💬 수신된 메시지:", data)
        logging.info("✅ 수신된 메시지")
        user_input = data["message"]

        openai.api_key = os.getenv("OPENAI_API_KEY")  # 명시해도 무방

        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "당신은 한국어로만 답변하는 GPT입니다."},
                {"role": "user", "content": user_input}
            ]
        )


        # 1. GPT 응답 텍스트 저장
        gpt_response = response["choices"][0]["message"]["content"]
        logging.info("✅ GPT 응답 텍스트 저장")

        # 2. TTS로 mp3 생성 (Google TTS 또는 OpenAI TTS)
        tts = gTTS(text=gpt_response, lang='ko')
        mp3_path = os.path.join("static", "audio", "response.mp3")
        tts.save(mp3_path)
        logging.info("✅ TTS로 mp3 생성")




        # mp3 → mp4 변환

        jpg_path = os.path.join("static", "audio", "white.jpg")  # 단색 배경
        if not os.path.exists(jpg_path):
            jpg_path = "white.jpg"  # fallback to root   루트 디렉토리에 있을 경우도 포함
        mp4_path = os.path.join("static", "audio", "response.mp4")
        logging.info("✅ mp3 -> mp4 변환환")


        # ffmpeg 명령어 실행
        subprocess.run([
            "ffmpeg", "-loop", "1",
            "-i", jpg_path,
            "-i", mp3_path,
            "-shortest",
            "-c:v", "libx264",
            "-c:a", "aac",
            "-b:a", "192k",
            "-pix_fmt", "yuv420p",
            "-y", mp4_path
        ])

        logging.info("✅ ffmpeg 명령어 실행")

        return jsonify({"response": gpt_response})
        # 일단 아래는 지정된 mp4 재생 코드이므로 생략하고 위 코드로 대체
        # return jsonify({"response": response["choices"][0]["message"]["content"]})
    



    except Exception as e:
        print("🔥 GPT 처리 중 에러:", e)
        return jsonify({"response": f"[서버 에러 발생] {str(e)}"}), 500
        logging.info("✅ GPT 처리 중 에러")


    try:
        tts = gTTS(gpt_response, lang='ko')
        tts.save("audio/response.mp3")
    except Exception as e:
        print("❌ gTTS 오류:", e)
        return jsonify({"error": "gTTS 실패"}), 500
    return jsonify({"response": gpt_response})


"""
# 최신 OpenAI 1.0 적용 /gpt_test 라우터
@app.route('/gpt_test', methods=['POST'])
def gpt_test():
    try:
        data = request.get_json()
        user_input = data['message']
        print("📦 OpenAI KEY:", os.getenv("OPENAI_API_KEY"))

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "당신은 한국어로만 답변하는 GPT입니다."},
                {"role": "user", "content": user_input}
            ]
        )

        return jsonify({"response": response.choices[0].message.content})

    except Exception as e:
        print("🔥 GPT 처리 중 에러:", e)
        return jsonify({"response": f"[서버 에러 발생] {str(e)}"}), 500
"""





# 주의: static/audio/response.mp4 파일이 미리 존재해야 함
# (→ 이 부분은 향후 TTS 결과를 mp4로 변환하는 자동화 추가 가능) 

@app.route("/gpt_video")
def gpt_video():

    logging.info("✅ gpt_video 진입")
    # static 폴더 내 mp4 파일 경로
    video_path = os.path.join("static", "audio", "response.mp4")

    # 바로 아래 코드는 기존 존재하는 mp4 파일 영상 재생이 목적이므로 생략하고 그 아래 코드로 대체
    return send_file(video_path, mimetype="video/mp4")
    # return send_file("static/audio/response.mp4", mimetype="video/mp4")

    """   
    "https://flask-server-v2.onrender.com/gpt_video" 이 URL이 실제 mp4 파일을 반환하는지 
    브라우저에서 직접 열어 테스트
    정상 작동할 경우 → 브라우저에서 바로 mp4 재생돼야 함
    CORS 문제 발생 시 → 콘솔에 CORS policy blocked 오류 나옴
    위 링크에서 영상이 출력이 안될 경우 아래 코드 이용

    response = make_response(send_file("static/response.mp4", mimetype="video/mp4"))
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response
    """



"""
이전 사용했던 코드
# OpenAI whisper API 
@app.route("/whisper", methods=["POST"])
def whisper_openai():
    try:
        # 1. 파일 받아오기
        if 'file' not in request.files:
            return jsonify({"error": "file 파라미터가 없습니다."}), 400

        file = request.files['file']
        temp_path = f"temp_{uuid.uuid4().hex}.mp3"
        file.save(temp_path)

        # 2. OpenAI Whisper API로 전송
        import openai
        audio_file = open(temp_path, "rb")
        transcript = openai.Audio.transcribe("whisper-1", audio_file, language="ko")

        return jsonify({"text": transcript["text"]})

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
"""





@app.route("/whisper", methods=["POST"])
def whisper():
    try:
        if 'file' not in request.files:
            print("❌ file 파라미터 없음")
            return jsonify({"error": "file 파라미터가 없습니다."}), 400

        audio_file = request.files['file']
        print("✅ 파일 수신됨:", audio_file.filename)
        logging.info("✅ 파일 수신됨")

        
        response_path = "response.mp3"
        # 파일 저장
        audio_file.save(response_path)
        # audio_file.save("temp.mp3")  # 디버깅용 임시 저장
        


        with open("response.mp3", "rb") as f:
            transcript = openai.Audio.transcribe("whisper-1", f)

        print("✅ Whisper 결과:", transcript["text"])
        return jsonify({"text": transcript["text"]})
        logging.info("✅ Whisper 결과")

    except Exception as e:
        print("🔥 Whisper 처리 중 오류 발생:", e)
        return jsonify({"error": str(e)}), 500
        logging.info("✅ Whisper 처리 중 오류 발생생")
    
    
    finally:
        # 마지막에 파일 삭제
        if os.path.exists(response_path):
            os.remove(response_path)
            # 바로 위 코드는 도입 시 충돌 주의 (단일 사용자 테스트에선 OK) 
    








# fast-whisper 로컬 테스트용 
""" 
@app.route("/whisper", methods=["POST"])
def whisper_transcribe():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    temp_name = f"temp_{uuid.uuid4().hex}.mp3"
    file.save(temp_name)

    try:
        segments, _ = model.transcribe(temp_name)
        text = " ".join([seg.text for seg in segments])
        return jsonify({"text": text})
    except Exception as e:
        return jsonify({"error": str(e)})
    finally:
        os.remove(temp_name)

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
"""





#  기존 whisper 코드
"""
@app.route('/whisper', methods=['POST'])
def whisper_recognize():
    try:
        # Base64로 전달된 mp3 파일을 디코딩
        data = request.json.get('audio')
        if not data:
            return jsonify({'error': 'No audio data received'}), 400

        audio_bytes = base64.b64decode(data)

        # 임시 파일에 저장
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as temp_audio:
            temp_audio.write(audio_bytes)
            temp_audio_path = temp_audio.name

        # Whisper API 호출
        import openai
        audio_file = open(temp_audio_path, "rb")
        transcript = openai.Audio.transcribe("whisper-1", audio_file, language="ko")

        return jsonify({"text": transcript["text"]})

    except Exception as e:
        return jsonify({"error": str(e)}), 500
"""


# ㅇㅇㅇㅇㅇ


"""
Render의 무료 서버는 보안상 지정된 포트만 스캔해서 열려 있는지 확인합니다. 
포트를 직접 지정해버리면 그 포트를 Render가 감지하지 못해서 timeout 에러가 납니다. 
그래서 반드시 os.environ.get("PORT")로 Render가 알려주는 포트를 사용해야만 해요.

아래는 과거 코드.

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
"""



#  로컬 서버 테스트를 위해 잠시 생략 가능


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)

















"""
from flask import Flask, render_template, request, redirect, url_for, send_from_directory
import sqlite3
import os
from dotenv import load_dotenv
import openai

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

app = Flask(__name__)

DB_NAME = 'database.db'

def init_db():
    with sqlite3.connect(DB_NAME) as conn:
        conn.execute('''CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nickname TEXT,
            level TEXT,
            points INTEGER DEFAULT 0
        )''')
        conn.execute('''CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            author TEXT,
            date TEXT,
            enable_3d INTEGER DEFAULT 0
        )''')

@app.route('/')
def index():
    init_db()
    with sqlite3.connect(DB_NAME) as conn:
        posts = conn.execute("SELECT * FROM posts ORDER BY id DESC").fetchall()
    return render_template('index.html', posts=posts)

@app.route('/register', methods=['POST'])
def register():
    nickname = request.form['nickname']
    level = request.form['level']
    with sqlite3.connect(DB_NAME) as conn:
        conn.execute("INSERT INTO users (nickname, level) VALUES (?, ?)", (nickname, level))
    return redirect(url_for('index'))

@app.route('/write', methods=['POST'])
def write():
    title = request.form['title']
    author = request.form['author']
    enable_3d = 1 if 'enable_3d' in request.form else 0
    from datetime import datetime
    date = datetime.now().strftime('%Y-%m-%d')
    with sqlite3.connect(DB_NAME) as conn:
        conn.execute("INSERT INTO posts (title, author, date, enable_3d) VALUES (?, ?, ?, ?)",
                     (title, author, date, enable_3d))
    return redirect(url_for('index'))

@app.route('/reward/<int:post_id>')
def reward(post_id):
    with sqlite3.connect(DB_NAME) as conn:
        post = conn.execute("SELECT * FROM posts WHERE id = ?", (post_id,)).fetchone()
        if post:
            conn.execute("UPDATE users SET points = points + 30 WHERE nickname = ?", (post[2],))
    return redirect(url_for('index'))

@app.route('/admin')
def admin():
    with sqlite3.connect(DB_NAME) as conn:
        users = conn.execute("SELECT * FROM users").fetchall()
    return render_template('admin.html', users=users)

@app.route('/world')
def world():
    return send_from_directory('static/world', 'index.html')

@app.route('/gpt_test', methods=['POST'])
def gpt_test():
    user_input = request.form['message']
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": user_input}]
    )
    return response['choices'][0]['message']['content']

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)

"""
#  이 코드는 수정하기 이전의 코드임
