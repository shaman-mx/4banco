from flask import Flask, render_template, request, jsonify
from ai_modules.ai import get_best_move_from_grid
import traceback
import sys
import logging

app = Flask(__name__)

# Bật debug log chi tiết
app.debug = True
logging.basicConfig(level=logging.DEBUG)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/ai_move", methods=["POST"])
def ai_move():
    try:
        data = request.get_json(force=True)
        app.logger.debug(f"📩 Nhận request /ai_move: {data}")

        grid = data.get("grid")
        ai_color = data.get("aiColor")
        depth = data.get("depth", 4)

        if not grid or not ai_color:
            msg = "Thiếu grid hoặc aiColor"
            app.logger.error(f"⚠️ {msg}")
            return jsonify({"status": "error", "message": msg}), 400

        app.logger.info(f"🧠 AI đang tính nước đi... màu={ai_color}, depth={depth}")

        move = get_best_move_from_grid(grid, ai_color, requested_depth=depth, time_limit=10)
        app.logger.info(f"✅ AI trả về move: {move}")

        return jsonify({"status": "ok", "move": move})

    except Exception as e:
        tb = traceback.format_exc()
        app.logger.error(f"💥 Lỗi xử lý /ai_move: {e}\n{tb}")
        return jsonify({"status": "error", "message": str(e), "trace": tb}), 500


if __name__ == "__main__":
    # In log rõ ràng ra console
    sys.stdout.reconfigure(line_buffering=True)
    print("🚀 Flask server khởi động tại port 81 (DEBUG ON)...")
    app.run(host="0.0.0.0", port=81, debug=True)