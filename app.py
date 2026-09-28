from flask import Flask, jsonify, render_template, request
import quantum, tutor
from content import LESSONS, QUIZ

app = Flask(__name__)


@app.get("/")
def index():
    return render_template("index.html")


@app.get("/api/content")
def content():
    return jsonify(lessons=LESSONS, quiz=QUIZ, presets=quantum.PRESETS)


@app.post("/api/simulate")
def simulate():
    d = request.get_json(force=True)
    try:
        shots = max(1, min(int(d.get("shots", 1024)), 10000))
        return jsonify(quantum.simulate(int(d["n"]), d.get("ops", []), shots))
    except (ValueError, KeyError, TypeError) as e:
        return jsonify(error=str(e)), 400


@app.post("/api/tutor")
def tutor_api():
    d = request.get_json(force=True)
    return jsonify(reply=tutor.answer(d.get("message", ""), d.get("circuit", {}), d.get("result")))


if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "false").lower() in ("true", "1")
    app.run(host="0.0.0.0", port=port, debug=debug)
