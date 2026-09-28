# Zentum - AI Quantum Algorithm & Computing Learning Platform

Interactive platform: theory lessons, drag-and-click circuit composer, real-time statevector simulation
(probabilities, amplitudes, shots, 3D Bloch vectors, entanglement detection, step-by-step timeline debugger), adaptive quizzes, Qiskit/OpenQASM code export, and an AI tutor.

## Run
```bash
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
Open http://127.0.0.1:5000 or http://localhost:5000

## AI tutor
Works offline with a built-in rule-based coach. For LLM answers:
`export ANTHROPIC_API_KEY=your_key` (Windows: `set ANTHROPIC_API_KEY=your_key`). Optional: `ZENTUM_MODEL`.

## Structure
app.py (Flask API) · quantum.py (simulator, presets, Qiskit/QASM export) · tutor.py (AI tutor) · content.py (lessons, quiz, KB) · templates/ static/ (UI & 3D Bloch renderer)
