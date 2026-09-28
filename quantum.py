"""Advanced statevector quantum simulator with intermediate step snapshots, Dirac notation, and code export."""
import numpy as np

S2 = 1 / np.sqrt(2)
GATES = {
    "H": np.array([[1, 1], [1, -1]], dtype=complex) * S2,
    "X": np.array([[0, 1], [1, 0]], dtype=complex),
    "Y": np.array([[0, -1j], [1j, 0]], dtype=complex),
    "Z": np.array([[1, 0], [0, -1]], dtype=complex),
    "S": np.array([[1, 0], [0, 1j]], dtype=complex),
    "Sdg": np.array([[1, 0], [0, -1j]], dtype=complex),
    "T": np.array([[1, 0], [0, np.exp(1j * np.pi / 4)]], dtype=complex),
    "Tdg": np.array([[1, 0], [0, np.exp(-1j * np.pi / 4)]], dtype=complex),
}
CONTROLLED = {"CX": "X", "CZ": "Z"}
MAX_QUBITS, MAX_OPS = 5, 100


def _single(state, U, q, n):
    s = np.tensordot(U, state.reshape((2,) * n), axes=([1], [q]))
    return np.moveaxis(s, 0, q).reshape(-1)


def _controlled(state, U, c, t, n):
    s = state.reshape((2,) * n).copy()
    idx = [slice(None)] * n
    idx[c] = 1
    sub = s[tuple(idx)]
    t2 = t if t < c else t - 1
    sub = np.moveaxis(np.tensordot(U, sub, axes=([1], [t2])), 0, t2)
    s[tuple(idx)] = sub
    return s.reshape(-1)


def _controlled_multi(state, U, controls, target, n):
    s = state.reshape((2,) * n).copy()
    idx = [slice(None)] * n
    for c in controls:
        idx[c] = 1
    sub = s[tuple(idx)]
    t_reduced = target - sum(1 for c in controls if c < target)
    sub = np.moveaxis(np.tensordot(U, sub, axes=([1], [t_reduced])), 0, t_reduced)
    s[tuple(idx)] = sub
    return s.reshape(-1)


def _swap(state, a, b, n):
    return np.swapaxes(state.reshape((2,) * n), a, b).reshape(-1)


def bloch(state, q, n):
    """Calculate Bloch vector (x, y, z), spherical angles (theta, phi), and purity for qubit q."""
    m = np.moveaxis(state.reshape((2,) * n), q, 0).reshape(2, -1)
    rho = m @ m.conj().T
    x = 2 * rho[0, 1].real
    y = -2 * rho[0, 1].imag
    z = (rho[0, 0] - rho[1, 1]).real
    purity = float(np.trace(rho @ rho).real)
    r = float(np.sqrt(x * x + y * y + z * z))
    
    # Spherical coordinates
    theta = float(np.arccos(np.clip(z / (r + 1e-12), -1.0, 1.0)))
    phi = float(np.arctan2(y, x))
    if phi < 0:
        phi += 2 * np.pi

    return {
        "x": round(float(x), 4),
        "y": round(float(y), 4),
        "z": round(float(z), 4),
        "r": round(r, 4),
        "theta": round(theta, 4),
        "phi": round(phi, 4),
        "purity": round(purity, 4),
    }


def format_dirac(state, labels):
    """Produce human-readable Dirac bra-ket string representation of statevector."""
    terms = []
    for i, a in enumerate(state):
        mag2 = abs(a) ** 2
        if mag2 < 1e-4:
            continue
        
        # Check standard fractions
        r, im = a.real, a.imag
        coeff = ""
        if abs(r - S2) < 1e-3 and abs(im) < 1e-3:
            coeff = "1/√2"
        elif abs(r + S2) < 1e-3 and abs(im) < 1e-3:
            coeff = "-1/√2"
        elif abs(r) < 1e-3 and abs(im - S2) < 1e-3:
            coeff = "i/√2"
        elif abs(r) < 1e-3 and abs(im + S2) < 1e-3:
            coeff = "-i/√2"
        elif abs(r - 0.5) < 1e-3 and abs(im) < 1e-3:
            coeff = "1/2"
        elif abs(r + 0.5) < 1e-3 and abs(im) < 1e-3:
            coeff = "-1/2"
        elif abs(r - 1.0) < 1e-3 and abs(im) < 1e-3:
            coeff = ""
        elif abs(r + 1.0) < 1e-3 and abs(im) < 1e-3:
            coeff = "-"
        elif abs(r) < 1e-3 and abs(im - 1.0) < 1e-3:
            coeff = "i"
        elif abs(r) < 1e-3 and abs(im + 1.0) < 1e-3:
            coeff = "-i"
        else:
            if abs(im) < 1e-3:
                coeff = f"{r:+.3f}".rstrip("0").rstrip(".")
                if coeff == "+1":
                    coeff = ""
                elif coeff == "-1":
                    coeff = "-"
            elif abs(r) < 1e-3:
                coeff = f"{im:+.3f}i".rstrip("0").rstrip(".")
            else:
                coeff = f"({r:+.3f}{im:+.3f}i)"

        if coeff and not coeff.startswith("-") and not coeff.startswith("+") and len(terms) > 0:
            coeff = "+ " + coeff
        elif coeff.startswith("+") and len(terms) > 0:
            coeff = "+ " + coeff[1:]
        elif coeff.startswith("-") and len(terms) > 0:
            coeff = "- " + coeff[1:]

        label = f"|{labels[i]}⟩"
        if coeff:
            terms.append(f"{coeff}{label}")
        else:
            terms.append(f"+ {label}" if len(terms) > 0 else label)
            
    return " ".join(terms) if terms else "|0⟩"


def export_qiskit(n, ops):
    """Generate runnable Python Qiskit code."""
    lines = [
        "from qiskit import QuantumCircuit",
        "from qiskit.visualization import plot_histogram",
        "from qiskit_aer import AerSimulator",
        "",
        f"# Initialize {n}-qubit circuit",
        f"qc = QuantumCircuit({n}, {n})",
        "",
    ]
    for op in sorted(ops, key=lambda x: x.get("c", 0)):
        g, q = op["g"], op["q"]
        if g == "H":
            lines.append(f"qc.h({q[0]})")
        elif g == "X":
            lines.append(f"qc.x({q[0]})")
        elif g == "Y":
            lines.append(f"qc.y({q[0]})")
        elif g == "Z":
            lines.append(f"qc.z({q[0]})")
        elif g == "S":
            lines.append(f"qc.s({q[0]})")
        elif g == "Sdg":
            lines.append(f"qc.sdg({q[0]})")
        elif g == "T":
            lines.append(f"qc.t({q[0]})")
        elif g == "Tdg":
            lines.append(f"qc.tdg({q[0]})")
        elif g == "CX":
            lines.append(f"qc.cx({q[0]}, {q[1]})")
        elif g == "CZ":
            lines.append(f"qc.cz({q[0]}, {q[1]})")
        elif g == "CCX":
            lines.append(f"qc.ccx({q[0]}, {q[1]}, {q[2]})")
        elif g == "SWAP":
            lines.append(f"qc.swap({q[0]}, {q[1]})")

    lines.extend([
        "",
        f"qc.measure(range({n}), range({n}))",
        "",
        "# Simulate using AerSimulator",
        "sim = AerSimulator()",
        "result = sim.run(qc, shots=1024).result()",
        "counts = result.get_counts()",
        "print('Measurement Counts:', counts)",
    ])
    return "\n".join(lines)


def export_qasm(n, ops):
    """Generate OpenQASM 2.0 code."""
    lines = [
        'OPENQASM 2.0;',
        'include "qelib1.inc";',
        f'qreg q[{n}];',
        f'creg c[{n}];',
        '',
    ]
    for op in sorted(ops, key=lambda x: x.get("c", 0)):
        g, q = op["g"], op["q"]
        if g == "H":
            lines.append(f'h q[{q[0]}];')
        elif g == "X":
            lines.append(f'x q[{q[0]}];')
        elif g == "Y":
            lines.append(f'y q[{q[0]}];')
        elif g == "Z":
            lines.append(f'z q[{q[0]}];')
        elif g == "S":
            lines.append(f's q[{q[0]}];')
        elif g == "Sdg":
            lines.append(f'sdg q[{q[0]}];')
        elif g == "T":
            lines.append(f't q[{q[0]}];')
        elif g == "Tdg":
            lines.append(f'tdg q[{q[0]}];')
        elif g == "CX":
            lines.append(f'cx q[{q[0]}],q[{q[1]}];')
        elif g == "CZ":
            lines.append(f'cz q[{q[0]}],q[{q[1]}];')
        elif g == "CCX":
            lines.append(f'ccx q[{q[0]}],q[{q[1]}],q[{q[2]}];')
        elif g == "SWAP":
            lines.append(f'swap q[{q[0]}],q[{q[1]}];')

    lines.extend([
        '',
        f'measure q -> c;',
    ])
    return "\n".join(lines)


def simulate(n, ops, shots=1024):
    """Simulate circuit execution, calculating statevector, step snapshots, Bloch spheres, and shots."""
    if not 1 <= n <= MAX_QUBITS:
        raise ValueError(f"Qubits must be between 1 and {MAX_QUBITS}")
    if len(ops) > MAX_OPS:
        raise ValueError("Circuit too long")

    labels = [format(i, f"0{n}b") for i in range(2 ** n)]
    
    # State tracking
    state = np.zeros(2 ** n, dtype=complex)
    state[0] = 1.0

    # Group ops by column to track step-by-step progress
    max_c = max([op.get("c", 0) for op in ops], default=-1)
    col_map = {}
    for op in ops:
        c = op.get("c", 0)
        col_map.setdefault(c, []).append(op)

    steps = []
    # Initial state step (Step 0)
    initial_blochs = [bloch(state, i, n) for i in range(n)]
    initial_probs = [round(float(p), 5) for p in np.abs(state) ** 2]
    steps.append({
        "col": -1,
        "name": "Initial State |0...0⟩",
        "bloch": initial_blochs,
        "probs": initial_probs,
        "amps": [[round(float(a.real), 4), round(float(a.imag), 4)] for a in state],
        "dirac": format_dirac(state, labels),
        "entangled": False,
    })

    for col_idx in range(max_c + 1):
        col_ops = col_map.get(col_idx, [])
        for op in col_ops:
            g, q = op["g"], [int(i) for i in op["q"]]
            if any(i < 0 or i >= n for i in q) or len(set(q)) != len(q):
                raise ValueError("Invalid qubit index")
            if g in GATES:
                state = _single(state, GATES[g], q[0], n)
            elif g in CONTROLLED:
                state = _controlled(state, GATES[CONTROLLED[g]], q[0], q[1], n)
            elif g == "CCX":
                if len(q) != 3:
                    raise ValueError("CCX requires 2 controls and 1 target")
                state = _controlled_multi(state, GATES["X"], [q[0], q[1]], q[2], n)
            elif g == "SWAP":
                state = _swap(state, q[0], q[1], n)
            else:
                raise ValueError(f"Unknown gate {g}")

        step_blochs = [bloch(state, i, n) for i in range(n)]
        step_probs = [round(float(p), 5) for p in np.abs(state) ** 2]
        is_ent = n > 1 and any(b["purity"] < 0.999 for b in step_blochs)
        steps.append({
            "col": col_idx,
            "name": f"Column {col_idx + 1}" + (f": {', '.join(o['g'] for o in col_ops)}" if col_ops else " (idle)"),
            "bloch": step_blochs,
            "probs": step_probs,
            "amps": [[round(float(a.real), 4), round(float(a.imag), 4)] for a in state],
            "dirac": format_dirac(state, labels),
            "entangled": is_ent,
        })

    # Final state evaluation
    probs = np.abs(state) ** 2
    sum_p = probs.sum()
    if sum_p > 0:
        probs /= sum_p
    else:
        probs[0] = 1.0

    counts = np.random.default_rng().multinomial(shots, probs)
    blochs = [bloch(state, i, n) for i in range(n)]
    is_entangled = n > 1 and any(b["purity"] < 0.999 for b in blochs)
    
    # Calculate entanglement entropy (using qubit 0 reduced density matrix)
    m0 = np.moveaxis(state.reshape((2,) * n), 0, 0).reshape(2, -1)
    rho0 = m0 @ m0.conj().T
    eigenvals = np.linalg.eigvalsh(rho0)
    eigenvals = eigenvals[eigenvals > 1e-10]
    entropy = -float(np.sum(eigenvals * np.log2(eigenvals))) if len(eigenvals) > 0 else 0.0

    return {
        "labels": labels,
        "probs": [round(float(p), 5) for p in probs],
        "amps": [[round(float(a.real), 4), round(float(a.imag), 4)] for a in state],
        "counts": {l: int(c) for l, c in zip(labels, counts) if c},
        "bloch": blochs,
        "entangled": is_entangled,
        "entropy": round(entropy, 4),
        "dirac": format_dirac(state, labels),
        "shots": shots,
        "steps": steps,
        "qiskit": export_qiskit(n, ops),
        "qasm": export_qasm(n, ops),
    }


PRESETS = {
    "superposition": {
        "name": "Superposition (H)",
        "category": "Fundamentals",
        "description": "Places a single qubit in equal superposition (|0⟩ + |1⟩)/√2.",
        "n": 1,
        "ops": [{"g": "H", "q": [0], "c": 0}],
    },
    "bell": {
        "name": "Bell State (|Φ+⟩)",
        "category": "Entanglement",
        "description": "Creates maximal 2-qubit entanglement (|00⟩ + |11⟩)/√2 using Hadamard and CNOT.",
        "n": 2,
        "ops": [
            {"g": "H", "q": [0], "c": 0},
            {"g": "CX", "q": [0, 1], "c": 1},
        ],
    },
    "bell_psi": {
        "name": "Bell State (|Ψ-⟩)",
        "category": "Entanglement",
        "description": "The singlet antisymmetric Bell state (|01⟩ - |10⟩)/√2.",
        "n": 2,
        "ops": [
            {"g": "X", "q": [0], "c": 0},
            {"g": "X", "q": [1], "c": 0},
            {"g": "H", "q": [0], "c": 1},
            {"g": "CX", "q": [0, 1], "c": 2},
            {"g": "Z", "q": [0], "c": 3},
        ],
    },
    "ghz": {
        "name": "GHZ State (3-Qubit)",
        "category": "Entanglement",
        "description": "3-qubit maximally entangled Greenberger-Horne-Zeilinger state (|000⟩ + |111⟩)/√2.",
        "n": 3,
        "ops": [
            {"g": "H", "q": [0], "c": 0},
            {"g": "CX", "q": [0, 1], "c": 1},
            {"g": "CX", "q": [1, 2], "c": 2},
        ],
    },
    "teleportation": {
        "name": "Quantum Teleportation",
        "category": "Protocols",
        "description": "Transfers unknown state from q0 to q2 using an entangled Bell pair between q1 and q2.",
        "n": 3,
        "ops": [
            # State prep on q0: H then S
            {"g": "H", "q": [0], "c": 0},
            {"g": "S", "q": [0], "c": 1},
            # Entangle q1 and q2
            {"g": "H", "q": [1], "c": 2},
            {"g": "CX", "q": [1, 2], "c": 3},
            # Bell measurement on q0, q1
            {"g": "CX", "q": [0, 1], "c": 4},
            {"g": "H", "q": [0], "c": 5},
            # Correction gates on q2
            {"g": "CX", "q": [1, 2], "c": 6},
            {"g": "CZ", "q": [0, 2], "c": 7},
        ],
    },
    "superdense": {
        "name": "Superdense Coding",
        "category": "Protocols",
        "description": "Transmits 2 classical bits (e.g. '11' = XZ) over 1 transmitted qubit of an entangled pair.",
        "n": 2,
        "ops": [
            # Bell pair creation
            {"g": "H", "q": [0], "c": 0},
            {"g": "CX", "q": [0, 1], "c": 1},
            # Alice encodes '11' with X and Z on q0
            {"g": "X", "q": [0], "c": 2},
            {"g": "Z", "q": [0], "c": 3},
            # Bob decodes
            {"g": "CX", "q": [0, 1], "c": 4},
            {"g": "H", "q": [0], "c": 5},
        ],
    },
    "phase_kickback": {
        "name": "Phase Kickback Demo",
        "category": "Fundamentals",
        "description": "Shows how eigenvalue phase from the target is transferred back into the control qubit.",
        "n": 2,
        "ops": [
            {"g": "X", "q": [1], "c": 0},
            {"g": "H", "q": [0], "c": 1},
            {"g": "H", "q": [1], "c": 1},
            {"g": "CX", "q": [0, 1], "c": 2},
            {"g": "H", "q": [0], "c": 3},
        ],
    },
    "deutsch_jozsa": {
        "name": "Deutsch-Jozsa Algorithm",
        "category": "Algorithms",
        "description": "Determines whether an oracle is constant or balanced in 1 query (balanced oracle test).",
        "n": 2,
        "ops": [
            {"g": "X", "q": [1], "c": 0},
            {"g": "H", "q": [0], "c": 1},
            {"g": "H", "q": [1], "c": 1},
            {"g": "CX", "q": [0, 1], "c": 2},
            {"g": "H", "q": [0], "c": 3},
        ],
    },
    "grover": {
        "name": "Grover's Search (|11⟩)",
        "category": "Algorithms",
        "description": "Amplifies amplitude of marked state |11⟩ with 100% probability using oracle and diffusion.",
        "n": 2,
        "ops": [
            # Superposition
            {"g": "H", "q": [0], "c": 0},
            {"g": "H", "q": [1], "c": 0},
            # Oracle for |11> (CZ)
            {"g": "CZ", "q": [0, 1], "c": 1},
            # Diffusion operator
            {"g": "H", "q": [0], "c": 2},
            {"g": "H", "q": [1], "c": 2},
            {"g": "X", "q": [0], "c": 3},
            {"g": "X", "q": [1], "c": 3},
            {"g": "CZ", "q": [0, 1], "c": 4},
            {"g": "X", "q": [0], "c": 5},
            {"g": "X", "q": [1], "c": 5},
            {"g": "H", "q": [0], "c": 6},
            {"g": "H", "q": [1], "c": 6},
        ],
    },
    "quantum_adder": {
        "name": "Quantum Half Adder",
        "category": "Arithmetic",
        "description": "Computes Sum (q1 ⊕ q0) using CX and Carry (q0 · q1) using CCX (Toffoli).",
        "n": 3,
        "ops": [
            # Inputs: A=1 (q0), B=1 (q1) -> Sum=0 (q1), Carry=1 (q2)
            {"g": "X", "q": [0], "c": 0},
            {"g": "X", "q": [1], "c": 0},
            # Carry bit to q2: Toffoli
            {"g": "CCX", "q": [0, 1, 2], "c": 1},
            # Sum bit to q1: CNOT
            {"g": "CX", "q": [0, 1], "c": 2},
        ],
    },
    "qft2": {
        "name": "Quantum Fourier Transform (2-Qubit)",
        "category": "Algorithms",
        "description": "Discrete Quantum Fourier Transform on 2 qubits using H, S, and SWAP.",
        "n": 2,
        "ops": [
            {"g": "H", "q": [0], "c": 0},
            {"g": "S", "q": [0], "c": 1},
            {"g": "CX", "q": [1, 0], "c": 2},
            {"g": "H", "q": [1], "c": 3},
            {"g": "SWAP", "q": [0, 1], "c": 4},
        ],
    },
}
