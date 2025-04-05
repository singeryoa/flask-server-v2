from flask import Flask, render_template, request, redirect, url_for, jsonify
import sqlite3
import openai
import os
from dotenv import load_dotenv

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

app = Flask(__name__, static_url_path='', static_folder='static')

# ✅ 기본 접속 경로는 2D 게시판
@app.route('/')
def index():
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute("SELECT * FROM posts ORDER BY id DESC")
    posts = c.fetchall()
    conn.close()
    return render_template('index.html', posts=posts)

# ✅ 글 작성 처리
@app.route('/write', methods=['POST'])
def write():
    title = request.form['title']
    author = request.form['author']
    enable_3d = 'enable_3d' in request.form

    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute("INSERT INTO posts (title, author, content, enable_3d) VALUES (?, ?, ?, ?)",
              (title, author, '', enable_3d))
    conn.commit()
    conn.close()
    return redirect(url_for('index'))

# ✅ 포인트 지급 처리 (단순 표시)
@app.route('/reward/<int:post_id>')
def reward(post_id):
    return f"{post_id}번 글에 대한 포인트가 지급되었습니다."

# ✅ 3D 월드는 /world 경로에서만 진입
@app.route('/world')
def world():
    return render_template('world.html')

# ✅ GPT 대화 API (gpt-3.5-turbo, 한국어 응답)
@app.route('/chat', methods=['POST'])
def chat():
    user_msg = request.json['message']
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "당신은 친절한 조수입니다. 한국어로만 대답하세요."},
            {"role": "user", "content": user_msg}
        ]
    )
    reply = response.choices[0].message['content']
    return jsonify({'reply': reply})

# ✅ GLB 파일 경로 유지 (/assets/avatar.glb)
@app.route('/assets/<path:filename>')
def serve_assets(filename):
    return app.send_static_file(f"world/assets/{filename}")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)

