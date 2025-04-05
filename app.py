from flask import Flask, render_template, request, redirect, url_for, send_from_directory, jsonify
import sqlite3, os
from dotenv import load_dotenv
import openai

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

app = Flask(__name__, static_url_path='', static_folder='static')
DB_NAME = 'database.db'

def init_db():
    with sqlite3.connect(DB_NAME) as conn:
        conn.execute("""CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nickname TEXT,
            level TEXT,
            points INTEGER DEFAULT 0
        )""")
        conn.execute("""CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            author TEXT,
            date TEXT,
            enable_3d INTEGER DEFAULT 0
        )""")

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
    user_input = request.json['message']
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "당신은 한국어로만 답변하는 GPT입니다."},
            {"role": "user", "content": user_input}
        ]
    )
    return jsonify({"response": response['choices'][0]['message']['content']})

@app.route('/assets/<path:filename>')
def serve_assets(filename):
    return send_from_directory('static/world/assets', filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)
