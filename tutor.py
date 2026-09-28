"""AI Quantum Tutor: rule-based quantum assistant engine with optional LLM integration."""
import os
from content import KB

SYSTEM = (
    "You are a friendly, expert quantum computing tutor inside the Zentum learning platform. "
    "Explain concepts simply using intuitive analogies, reference the student's current circuit and simulation result, "
    "suggest a practical next experiment to try, format formulas cleanly using Dirac notation, and keep answers engaging and under 180 words."
)


def describe(circuit, result):
    n = circuit.get("n", 1)
    ops = sorted(circuit.get("ops", []), key=lambda o: o.get("c", 0))
    steps = ", ".join(f'{o["g"]}({",".join(map(str, o["q"]))})' for o in ops) or "Empty circuit"
    top = ""
    if result:
        pairs = sorted(zip(result.get("labels", []), result.get("probs", [])), key=lambda x: -x[1])
        top_pairs = [f"|{l}⟩: {p * 100:.1f}%" for l, p in pairs if p > 0.01][:3]
        top = " | Outcomes: " + ", ".join(top_pairs) if top_pairs else ""
        if result.get("entangled"):
            top += " (Entangled state detected!)"
        if result.get("dirac"):
            top += f" | State: {result['dirac']}"
    return f"{n}-qubit circuit [{steps}]{top}"


def analyze(circuit, result):
    ops = circuit.get("ops", [])
    gates = {o["g"] for o in ops}
    n = circuit.get("n", 1)
    tips = []

    if not ops:
        return (
            "Your circuit is currently empty. ✨ **Try this:** Place a **Hadamard (H)** gate on qubit 0 "
            "and press **Run** to place the qubit into an equal superposition (|0⟩ + |1⟩)/√2!"
        )

    # Entanglement checks
    has_superposition = "H" in gates
    has_cnot = any(o["g"] in ["CX", "CZ", "CCX"] for o in ops)

    if has_superposition and not has_cnot and n > 1:
        tips.append("💡 You've created superposition! Next, try adding a **CNOT (CX)** gate to entangle your qubits into a Bell state.")

    if has_cnot and not has_superposition:
        tips.append("💡 Controlled gates without superposition only act as classical permutations. Add an **H gate** to the control wire first to create true quantum entanglement!")

    if result and result.get("entangled"):
        tips.append("🎉 **Quantum Entanglement active!** Notice how the individual Bloch vector purities have dropped below 1.0 because the qubits share a joint state.")

    if "Z" in gates and not has_superposition:
        tips.append("🔍 The Pauli-Z gate alters phase (Z|0⟩ = |0⟩, Z|1⟩ = -|1⟩). Because measurement only detects amplitude squared, sandwich Z between two **H gates** (H · Z · H = X) to observe quantum interference!")

    if "CCX" in gates:
        tips.append("⚡ **Toffoli gate placed:** This 3-qubit reversible AND gate enables classical-quantum reversible arithmetic, like the quantum full adder.")

    if not tips:
        tips.append("Your circuit looks balanced! Try stepping through the timeline column by column to observe state transitions, or test measurement shots under noise.")

    return " ".join(tips)


def answer(message, circuit, result):
    # Check for optional LLM
    key = os.environ.get("ANTHROPIC_API_KEY")
    if key:
        try:
            import anthropic
            client = anthropic.Anthropic(api_key=key)
            r = client.messages.create(
                model=os.environ.get("ZENTUM_MODEL", os.environ.get("ARIYAS_IQ_MODEL", os.environ.get("QLEARN_MODEL", "claude-3-5-sonnet-20241022"))),
                max_tokens=600,
                system=SYSTEM,
                messages=[{
                    "role": "user",
                    "content": f"Student Circuit State: {describe(circuit, result)}\n\nStudent Question: {message}"
                }]
            )
            return r.content[0].text
        except Exception as e:
            print("LLM fallback triggered:", e)

    m = (message or "").lower()
    
    # Specific targeted intents
    if "explain" in m and ("circuit" in m or "this" in m or "state" in m):
        return f"📊 **Circuit Breakdown**:\n{describe(circuit, result)}\n\n{analyze(circuit, result)}"

    if "hint" in m or "what next" in m or "suggest" in m:
        return f"💡 **Tutor Recommendation**:\n{analyze(circuit, result)}"

    # Knowledge base lookup
    matched = []
    for key, text in KB.items():
        if key in m:
            matched.append(text)

    if matched:
        reply = "\n\n".join(matched[:2])
        reply += f"\n\n🔍 **Circuit Connection:** {analyze(circuit, result)}"
        return reply

    # Default friendly guidance
    circuit_desc = describe(circuit, result)
    circuit_tips = analyze(circuit, result)
    return (
        f"⚛️ **Quantum Tutor Feedback**:\n"
        f"You are exploring a {circuit_desc}.\n\n"
        f"{circuit_tips}\n\n"
        f"_Ask me anything about Superposition, Bloch Spheres, Entanglement, CNOT, Phase Kickback, Grover Search, or Deutsch-Jozsa!_"
    )
