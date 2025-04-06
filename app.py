from flask import (
    Flask,
    render_template,
    request,
    redirect,
    url_for,
    send_from_directory,
    jsonify,
)
import sqlite3, os
from dotenv import load_dotenv

# 최신 OpenAI > 아래 두 줄은 최신 OpenAI 이용을 위한 임포트
import openai
from openai import OpenAI




# 최신 OpenAI
client = OpenAI()  # 자동으로 환경변수에서 API 키 사용


load_dotenv()

# 최신 OpenAI()   에서는 자동으로 환경변수 사용하므로 아래 1줄은 생략 가능
# openai.api_key = os.getenv("OPENAI_API_KEY")  

app = Flask(__name__, static_url_path="", static_folder="static")
# app = Flask(__name__)  위로 변경.
# Flask에서 static 경로를 root처럼 사용하게 만들기

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


# 최신 OpenAI 적용 /gpt_test 라우터
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
Render의 무료 서버는 보안상 지정된 포트만 스캔해서 열려 있는지 확인합니다. 
포트를 직접 지정해버리면 그 포트를 Render가 감지하지 못해서 timeout 에러가 납니다. 
그래서 반드시 os.environ.get("PORT")로 Render가 알려주는 포트를 사용해야만 해요.

아래는 과거 코드.

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
"""
# 이 부분을 정확히 삽입해야 render 에 발행이 됨.
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
