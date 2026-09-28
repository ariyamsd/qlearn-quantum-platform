"""Educational content: Structured curriculum lessons, adaptive quiz question bank, and quantum knowledge base."""

LESSONS = [
    {
        "id": "qubits",
        "title": "1. Qubits, Bra-Ket & Superposition",
        "tag": "Fundamentals",
        "preset": "superposition",
        "summary": "Understand quantum superposition and how the Hadamard gate creates equal quantum probabilities.",
        "text": (
            "A classical computer bit is either 0 or 1. A quantum bit (qubit) exists in a superposition: "
            "|ψ⟩ = α|0⟩ + β|1⟩, where α and β are complex probability amplitudes satisfying |α|² + |β|² = 1.\n\n"
            "• When you measure a qubit, it collapses to |0⟩ with probability |α|² and |1⟩ with probability |β|².\n"
            "• The **Hadamard (H) gate** creates an equal superposition: H|0⟩ = (|0⟩ + |1⟩)/√2 (50% |0⟩, 50% |1⟩).\n"
            "• Try loading the preset and watch how the statevector splits equally between |0⟩ and |1⟩!"
        ),
        "task": "Load the preset and run the simulation. Look at the measurement histogram across 1024 shots.",
    },
    {
        "id": "bloch",
        "title": "2. Pauli Gates & The Bloch Sphere",
        "tag": "Visual Geometry",
        "preset": None,
        "summary": "Visualize single-qubit states on the 3D Bloch sphere and explore Pauli X, Y, and Z rotations.",
        "text": (
            "Any pure single-qubit state can be represented as a point on the surface of a unit sphere called the **Bloch Sphere**.\n\n"
            "• The north pole (+Z) is |0⟩, and the south pole (-Z) is |1⟩.\n"
            "• The equator contains superpositions: (+X) is |+⟩ = (|0⟩+|1⟩)/√2, (-X) is |-⟩ = (|0⟩-|1⟩)/√2.\n"
            "• **Pauli-X (NOT)**: 180° rotation around the X-axis (flips |0⟩ ↔ |1⟩).\n"
            "• **Pauli-Z (Phase-Flip)**: 180° rotation around the Z-axis (leaves |0⟩ unchanged, flips phase of |1⟩ to -|1⟩).\n"
            "• **Pauli-Y**: Combines bit-flip and phase-flip (rotation around Y-axis)."
        ),
        "task": "Place an X gate on q0, then follow with an H gate, and examine where the Bloch vector points.",
    },
    {
        "id": "phase",
        "title": "3. Quantum Phase & Interference",
        "tag": "Wave Nature",
        "preset": "phase_kickback",
        "summary": "Discover relative phase, S and T gates, and how constructive/destructive interference guides quantum algorithms.",
        "text": (
            "Phase is what makes quantum computing fundamentally different from classical probability!\n\n"
            "• Measurement only reveals magnitude |α|², so a pure phase change |ψ⟩ → |0⟩ - |1⟩ produces identical 50/50 measurement probabilities as |0⟩ + |1⟩.\n"
            "• However, applying an **H gate before measurement** creates interference:\n"
            "  - H(|0⟩ + |1⟩)/√2 = |0⟩ (Constructive interference on |0⟩)\n"
            "  - H(|0⟩ - |1⟩)/√2 = |1⟩ (Destructive interference on |0⟩, constructive on |1⟩)\n"
            "• **S Gate**: Adds a π/2 (90°) phase shift. **T Gate**: Adds a π/4 (45°) phase shift."
        ),
        "task": "Load the Phase Kickback demo to observe how phase on the target qubit kicks back to the control qubit.",
    },
    {
        "id": "entanglement",
        "title": "4. Multi-Qubit Entanglement & Bell States",
        "tag": "Quantum Magic",
        "preset": "bell",
        "summary": "Create Einstein-Podolsky-Rosen (EPR) Bell pairs and explore spooky action at a distance.",
        "text": (
            "When two or more qubits interact via controlled gates (like **CNOT**), their states can become inextricably linked.\n\n"
            "• The **Bell State** |Φ+⟩ = (|00⟩ + |11⟩)/√2 has the property that measuring qubit 0 instantly determines qubit 1 with 100% certainty, even if separated across galaxies!\n"
            "• In an entangled state, individual qubits do *not* have independent states. Notice how individual single-qubit Bloch vectors shrink inside the sphere (reduced purity < 1.0).\n"
            "• A 3-qubit generalization is the **GHZ State**: (|000⟩ + |111⟩)/√2."
        ),
        "task": "Load the Bell State preset. Run simulation and check that individual qubit Bloch purities drop while measurement yields only |00⟩ and |11⟩.",
    },
    {
        "id": "teleportation",
        "title": "5. Quantum Teleportation Protocol",
        "tag": "Protocols",
        "preset": "teleportation",
        "summary": "Transfer an unknown quantum state using entanglement and classical communication without moving the physical qubit.",
        "text": (
            "Quantum Teleportation transmits an unknown state |ψ⟩ from Alice (q0) to Bob (q2) using a shared Bell pair (q1-q2).\n\n"
            "1. Alice entangles her input qubit q0 with her half of the Bell pair q1 using CNOT and H.\n"
            "2. Alice measures q0 and q1, collapsing them into 2 classical bits.\n"
            "3. Bob applies classical feed-forward corrections (X and Z gates) to q2 based on Alice's outcome.\n"
            "4. Bob's qubit q2 is now in the exact state |ψ⟩ initially held by Alice!"
        ),
        "task": "Step through the Teleportation preset column by column to observe state transfer in action.",
    },
    {
        "id": "deutsch",
        "title": "6. Deutsch-Jozsa Algorithm",
        "tag": "Speedup",
        "preset": "deutsch_jozsa",
        "summary": "Solve a black-box oracle problem with an exponential quantum speedup over classical deterministic algorithms.",
        "text": (
            "Suppose a black-box function f(x) is either **constant** (returns 0 for all x, or 1 for all x) or **balanced** (returns 0 for half the inputs, 1 for the other half).\n\n"
            "• Classically, you need up to 2^(n-1) + 1 evaluations in the worst case.\n"
            "• Deutsch-Jozsa solves this in **exactly ONE quantum query**!\n"
            "• By putting all inputs in superposition and evaluating the oracle, phase kickback encodes the global function property into interference: measuring |00...0⟩ means constant; anything else means balanced."
        ),
        "task": "Load the Deutsch-Jozsa preset. Note that qubit 0 measures |1⟩ with 100% certainty, proving the oracle is balanced in a single shot!",
    },
    {
        "id": "grover",
        "title": "7. Grover's Quantum Search",
        "tag": "Algorithms",
        "preset": "grover",
        "summary": "Search unsorted databases with quadratic speedup ~O(√N) using oracle tagging and amplitude amplification.",
        "text": (
            "Finding a specific item in an unsorted database of N items requires O(N) classical steps. Grover's algorithm achieves **O(√N)**!\n\n"
            "• **Step 1 (Superposition)**: Initialize all states equally with Hadamard gates.\n"
            "• **Step 2 (Oracle)**: Flips the phase (negative sign) of the target state (here |11⟩).\n"
            "• **Step 3 (Diffusion Operator)**: Inversion about the mean reflects all amplitudes, boosting the marked item's amplitude while suppressing non-targets.\n"
            "• For N=4 (2 qubits), just **1 iteration** reaches 100% probability!"
        ),
        "task": "Run the Grover preset and verify that outcome |11⟩ peaks at ~100% probability.",
    },
    {
        "id": "qft",
        "title": "8. Quantum Arithmetic & Toffoli Adders",
        "tag": "Architecture",
        "preset": "quantum_adder",
        "summary": "Construct reversible quantum logic using CNOT and 3-qubit Toffoli (CCX) gates to perform quantum addition.",
        "text": (
            "All quantum computation is unitary and reversible. Classical logic gates like AND/OR are irreversible, but the **Toffoli (CCX) gate** is universal and fully reversible!\n\n"
            "• **CCX (Controlled-Controlled-NOT)**: Flips target if and only if both control qubits are |1⟩ (Quantum AND gate).\n"
            "• **Quantum Half Adder**: Given inputs A and B in |11⟩, CCX writes the Carry bit (1) to q2, and CNOT writes the Sum bit (0) to q1, resulting in |101⟩ (binary 2)."
        ),
        "task": "Load the Quantum Half Adder preset. Observe the carry and sum bit outputs in the measurement histogram.",
    },
]

QUIZ = [
    {
        "topic": "qubits",
        "q": "What is the result of applying a Hadamard (H) gate to the ground state |0⟩?",
        "options": [
            "|1⟩",
            "(|0⟩ + |1⟩)/√2 (The |+⟩ superposition state)",
            "(|0⟩ - |1⟩)/√2 (The |-⟩ superposition state)",
            "A mixed state with zero purity"
        ],
        "a": 1,
        "why": "The Hadamard gate maps basis states to equal superpositions: H|0⟩ = |+⟩ = (|0⟩ + |1⟩)/√2.",
    },
    {
        "topic": "qubits",
        "q": "If a qubit state is |ψ⟩ = α|0⟩ + β|1⟩, which normalization condition must hold?",
        "options": [
            "α + β = 1",
            "|α|² + |β|² = 1",
            "α² + β² = 0",
            "|α| = |β| always"
        ],
        "a": 1,
        "why": "Born's rule states probabilities P(0)=|α|² and P(1)=|β|² must sum to 1.",
    },
    {
        "topic": "bloch",
        "q": "Where does the state |1⟩ reside on the standard Bloch sphere?",
        "options": [
            "North pole (+Z axis)",
            "South pole (-Z axis)",
            "Equator (+X axis)",
            "Equator (+Y axis)"
        ],
        "a": 1,
        "why": "The +Z axis corresponds to |0⟩ (θ = 0), and the -Z axis corresponds to |1⟩ (θ = π).",
    },
    {
        "topic": "bloch",
        "q": "Which sequence of gates is mathematically equivalent to the Pauli-X gate?",
        "options": [
            "H · Z · H",
            "Z · H · Z",
            "S · S · S",
            "T · T"
        ],
        "a": 0,
        "why": "Conjugating the phase-flip Z gate with Hadamard gates flips the basis from Z to X, producing X.",
    },
    {
        "topic": "phase",
        "q": "How much phase shift does the S gate add to the |1⟩ state?",
        "options": [
            "π radians (180°)",
            "π/2 radians (90° or e^{iπ/2} = i)",
            "π/4 radians (45°)",
            "2π radians (360°)"
        ],
        "a": 1,
        "why": "The S gate (Phase gate) adds e^{iπ/2} = i phase shift to |1⟩, while leaving |0⟩ unchanged.",
    },
    {
        "topic": "entanglement",
        "q": "What is the standard circuit recipe to create the maximally entangled Bell pair (|00⟩ + |11⟩)/√2?",
        "options": [
            "X gate on q0, then X gate on q1",
            "H gate on q0, followed by CNOT with control q0 and target q1",
            "CNOT(q0, q1), followed by H on q1",
            "Z gate on q0 and S gate on q1"
        ],
        "a": 1,
        "why": "H on q0 creates (|0⟩+|1⟩)/√2 ⊗ |0⟩ = (|00⟩+|10⟩)/√2. CNOT flips the second qubit if the first is 1, yielding (|00⟩+|11⟩)/√2.",
    },
    {
        "topic": "entanglement",
        "q": "What is the length of the reduced Bloch vector for one qubit in an ideal Bell pair?",
        "options": [
            "1.0 (Pure state)",
            "0.0 (Maximally mixed state)",
            "0.7071",
            "Undefined"
        ],
        "a": 1,
        "why": "Because information is stored globally in the correlation, tracing out one qubit leaves a maximally mixed state with Bloch vector length 0.",
    },
    {
        "topic": "teleportation",
        "q": "Does Quantum Teleportation allow faster-than-light (superluminal) communication?",
        "options": [
            "Yes, because entanglement collapses instantaneously",
            "No, because Bob needs Alice's 2 classical measurement bits to apply corrections",
            "Yes, if using more than 3 qubits",
            "Only in vacuum"
        ],
        "a": 1,
        "why": "Teleportation requires transmitting Alice's measurement results over classical channels, bounded by the speed of light.",
    },
    {
        "topic": "deutsch",
        "q": "How many queries to a balanced/constant oracle does the Deutsch-Jozsa algorithm require?",
        "options": [
            "1 quantum query",
            "2^(n-1) + 1 queries",
            "n queries",
            "√n queries"
        ],
        "a": 0,
        "why": "Deutsch-Jozsa evaluates all inputs simultaneously in superposition and uses interference to determine the property in exactly 1 query.",
    },
    {
        "topic": "grover",
        "q": "For an unsorted database of N items, what is Grover search's time complexity?",
        "options": [
            "O(N) linear time",
            "O(log N) logarithmic time",
            "O(√N) quadratic speedup",
            "O(1) constant time"
        ],
        "a": 2,
        "why": "Grover's algorithm rotates the statevector in Hilbert space toward the target in ~ (π/4)√N steps.",
    },
    {
        "topic": "qft",
        "q": "What is the minimum number of control qubits in a standard Toffoli (CCX) gate?",
        "options": [
            "1 control qubit",
            "2 control qubits",
            "3 control qubits",
            "0 control qubits"
        ],
        "a": 1,
        "why": "The Toffoli (CCX) gate has 2 control qubits and 1 target qubit. It flips the target if and only if both controls are |1⟩.",
    },
]

KB = {
    "superposition": (
        "**Superposition** is the quantum principle where a qubit exists in a linear combination of basis states: "
        "|ψ⟩ = α|0⟩ + β|1⟩. Unlike classical probabilities, amplitudes α and β can be negative or complex, enabling constructive and destructive interference."
    ),
    "hadamard": (
        "The **Hadamard (H)** gate is the workhorse of quantum computing! It transforms basis states into symmetric superpositions: "
        "H|0⟩ = |+⟩ = (|0⟩ + |1⟩)/√2 and H|1⟩ = |-⟩ = (|0⟩ - |1⟩)/√2. Applying H twice returns the original state (H² = I)."
    ),
    "entanglement": (
        "**Quantum Entanglement** is a physical phenomenon where qubits become interconnected such that the state of one cannot be described independently of the others. "
        "In Zentum, notice how the individual Bloch vector purity drops below 1.0 when qubits become entangled."
    ),
    "cnot": (
        "The **Controlled-NOT (CNOT / CX)** gate performs a bit-flip (X) on the target qubit if and only if the control qubit is in state |1⟩. "
        "Combined with Hadamard, it is the primary gate used to generate quantum entanglement."
    ),
    "bloch": (
        "The **Bloch Sphere** provides a geometric visualization of single-qubit states. The z-axis represents |0⟩ (top) and |1⟩ (bottom). "
        "The x-axis represents |+⟩ and |-⟩. The y-axis represents |+i⟩ and |-i⟩. Mixed or entangled qubit states lie inside the sphere (radius < 1)."
    ),
    "phase": (
        "**Quantum Phase** is the relative angle between the amplitudes of |0⟩ and |1⟩. While direct measurement only observes |amplitude|², "
        "phase differences are converted into measurable probability differences using interference gates like Hadamard."
    ),
    "grover": (
        "**Grover's Algorithm** is an amplitude amplification search technique. It achieves a quadratic speedup (O(√N) vs O(N)) for unstructured search. "
        "It repeatedly applies an Oracle (marks target with negative phase) and a Diffusion operator (inverts amplitudes about the mean)."
    ),
    "deutsch": (
        "The **Deutsch-Jozsa Algorithm** was among the first examples of quantum parallelism proving an exponential separation over classical deterministic computing. "
        "It determines if a black-box oracle is constant or balanced in just 1 evaluation."
    ),
    "toffoli": (
        "The **Toffoli (CCX)** gate is a 3-qubit gate that flips the target qubit only when both control qubits are 1. "
        "It acts as a reversible AND gate and is universal for classical reversible computation and quantum arithmetic."
    ),
    "teleportation": (
        "**Quantum Teleportation** transports an exact quantum state from one qubit to another using a shared Bell pair and 2 bits of classical communication, "
        "preserving the No-Cloning theorem."
    ),
}
