from flask import Flask, jsonify
from flask_cors import CORS
import sqlite3

app = Flask(__name__)
CORS(app)

def init_db():
    conn = sqlite3.connect('logs.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            ip TEXT,
            action TEXT
        )
    ''')
    conn.commit()
    conn.close()

def insert_log(timestamp, ip, action):
    conn = sqlite3.connect('logs.db')
    cursor = conn.cursor()
    cursor.execute("INSERT INTO logs (timestamp, ip, action) VALUES (?, ?, ?)",
                   (timestamp, ip, action))
    conn.commit()
    conn.close()

def process_log_file():
    conn = sqlite3.connect('logs.db')
    cursor = conn.cursor()

    # clear old logs (to avoid duplicates)
    cursor.execute("DELETE FROM logs")

    with open('sample_logs.txt', 'r') as file:
        for line in file:
            parts = line.strip().split()

            if len(parts) < 4:
                continue

            timestamp = parts[0] + " " + parts[1]
            ip = parts[2].split(":")[1]
            action = parts[3].split(":")[1]

            cursor.execute(
                "INSERT INTO logs (timestamp, ip, action) VALUES (?, ?, ?)",
                (timestamp, ip, action)
            )

    conn.commit()
    conn.close()

def get_logs():
    conn = sqlite3.connect('logs.db')
    cursor = conn.cursor()
    cursor.execute("SELECT timestamp, ip, action FROM logs ORDER BY timestamp ASC")
    rows = cursor.fetchall()
    conn.close()

    return [{"timestamp": r[0], "ip": r[1], "action": r[2]} for r in rows]

@app.route('/process')
def process():
    process_log_file()
    return "Processed"

@app.route('/timeline')
def timeline():
    return jsonify(get_logs())

if __name__ == '__main__':
    init_db()
    app.run(debug=True)