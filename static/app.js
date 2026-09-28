/**
 * Zentum - Quantum Algorithm Studio & Learning Platform
 * Next-Generation Interactive Quantum Simulator Frontend
 */

// Configuration Constants
const COLS = 12;
const MAX_QUBITS = 5;
const SINGLE_GATES = ["H", "X", "Y", "Z", "S", "Sdg", "T", "Tdg"];
const TWO_QUBIT_GATES = ["CX", "CZ", "SWAP"];
const THREE_QUBIT_GATES = ["CCX"];

// Gate Help Descriptions
const GATE_DESCRIPTIONS = {
  H: "Hadamard (H): Creates an equal superposition (|0⟩ + |1⟩)/√2.",
  X: "Pauli-X: Bit-flip gate (NOT). Flips |0⟩ ↔ |1⟩.",
  Y: "Pauli-Y: Bit-flip and phase-flip rotation around Y-axis.",
  Z: "Pauli-Z: Phase-flip gate. Flips phase of |1⟩ to -|1⟩.",
  S: "S Gate: Phase rotation by π/2 (90°).",
  Sdg: "S† Gate: Phase rotation by -π/2 (-90°).",
  T: "T Gate: Phase rotation by π/4 (45°).",
  Tdg: "T† Gate: Phase rotation by -π/4 (-45°).",
  CX: "CNOT (CX): Flips target qubit if control qubit is |1⟩. (Click Control, then Target)",
  CZ: "Controlled-Z: Applies Z to target if control is |1⟩. (Click Control, then Target)",
  CCX: "Toffoli (CCX): Reversible AND gate. (Click Control 1, Control 2, then Target)",
  SWAP: "SWAP Gate: Swaps quantum states of two qubits. (Click Qubit 1, then Qubit 2)",
};

// Application State
let appData = { lessons: [], quiz: [], presets: {} };
let circuitOps = [];
let selectedGate = "H";
let pendingMulti = null; // { g, q: [], c }
let lastSimResult = null;
let activeStepIndex = 0;
let isPlayingTimeline = false;
let timelineInterval = null;
let activeVizMode = "probs";
let activeExportFormat = "qiskit";
let activeLessonIndex = 0;
let quizIndex = 0;
let blochRotations = [
  { rotX: -0.3, rotY: 0.5 },
  { rotX: -0.3, rotY: 0.5 },
  { rotX: -0.3, rotY: 0.5 },
  { rotX: -0.3, rotY: 0.5 },
  { rotX: -0.3, rotY: 0.5 },
];

// Local Storage Manager
const Storage = {
  get: () => {
    try {
      return JSON.parse(localStorage.getItem("zentum_v2") || localStorage.getItem("ariyas_iq_v2") || localStorage.getItem("qlearn_v2") || '{"done":[],"score":{},"muted":false}');
    } catch {
      return { done: [], score: {}, muted: false };
    }
  },
  set: data => localStorage.setItem("zentum_v2", JSON.stringify(data)),
};

// DOM Selector Helper
const $ = id => document.getElementById(id);

// ============================================================================
// Web Audio Sound FX Engine
// ============================================================================
class QuantumSoundFX {
  constructor() {
    this.ctx = null;
    this.muted = Storage.get().muted || false;
  }

  init() {
    if (!this.ctx && typeof AudioContext !== "undefined") {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  playTone(freq, type = "sine", duration = 0.08, gainVal = 0.05) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }

  gatePlaced() { this.playTone(587.33, "triangle", 0.09, 0.06); } // D5
  gateRemoved() { this.playTone(329.63, "sine", 0.08, 0.04); }    // E4
  simRan() {
    this.playTone(440, "sine", 0.06, 0.04);
    setTimeout(() => this.playTone(880, "sine", 0.12, 0.05), 60);
  }
  stepTick() { this.playTone(700, "sine", 0.03, 0.02); }
  quizCorrect() {
    this.playTone(523.25, "sine", 0.1, 0.06);
    setTimeout(() => this.playTone(659.25, "sine", 0.1, 0.06), 80);
    setTimeout(() => this.playTone(783.99, "sine", 0.18, 0.07), 160);
  }
  quizWrong() {
    this.playTone(220, "sawtooth", 0.15, 0.04);
  }
}
const sound = new QuantumSoundFX();

// ============================================================================
// Particle Background Animation Canvas
// ============================================================================
// Quantum Wave & Particle Field Canvas
// ============================================================================
function initBackgroundCanvas() {
  const canvas = $("bg-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let width, height, particles = [];
  let mouse = { x: -1000, y: -1000, radius: 150 };

  window.addEventListener("mousemove", e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener("mouseleave", () => {
    mouse.x = -1000;
    mouse.y = -1000;
  });

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    particles = [];
    const count = Math.min(width > 1200 ? 65 : 35, 75);
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        originX: Math.random() * width,
        originY: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 2.2 + 1,
        color: Math.random() > 0.6 ? "#00f2fe" : (Math.random() > 0.3 ? "#a855f7" : "#ec4899"),
        alpha: Math.random() * 0.5 + 0.25,
      });
    }
  }

  window.addEventListener("resize", resize);
  resize();

  function render() {
    ctx.clearRect(0, 0, width, height);

    // Draw Quantum Entanglement Nodes / Connecting Lines
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 140) {
          ctx.beginPath();
          const opacity = (1 - dist / 140) * 0.16;
          ctx.strokeStyle = `rgba(0, 242, 254, ${opacity})`;
          ctx.lineWidth = 0.85;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    // Update and Draw Particles with Subtle Mouse Gravitational Wave
    for (const p of particles) {
      // Mouse interaction
      const mdx = mouse.x - p.x;
      const mdy = mouse.y - p.y;
      const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
      if (mDist < mouse.radius && mDist > 0) {
        const force = (1 - mDist / mouse.radius) * 1.5;
        p.x -= (mdx / mDist) * force;
        p.y -= (mdy / mDist) * force;
      }

      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

// ============================================================================
// Keyboard Shortcuts Engine
// ============================================================================
function setupKeyboardShortcuts() {
  window.addEventListener("keydown", e => {
    // Skip if typing in an input or textarea
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") {
      return;
    }

    const key = e.key.toUpperCase();
    const gateMap = {
      H: "H",
      X: "X",
      Y: "Y",
      Z: "Z",
      S: "S",
      T: "T",
      C: "CX",
      W: "SWAP",
    };

    if (gateMap[key]) {
      const btn = document.querySelector(`.gate-btn[data-g="${gateMap[key]}"]`);
      if (btn) btn.click();
    } else if (e.key === " " || e.code === "Space") {
      e.preventDefault();
      // Step timeline forward
      const stepNext = $("stepNext");
      if (stepNext) stepNext.click();
    } else if (e.key === "Enter" || key === "R") {
      const runBtn = $("runBtn");
      if (runBtn) runBtn.click();
    } else if (key === "M") {
      const soundBtn = $("soundToggle");
      if (soundBtn) soundBtn.click();
    }
  });
}

// ============================================================================
// Application Initialization
// ============================================================================
async function initApp() {
  initBackgroundCanvas();
  setupNavTabs();
  setupSoundToggle();
  setupKeyboardShortcuts();

  // Load Content from Backend API
  try {
    const res = await fetch("/api/content");
    appData = await res.json();
    populatePresetsDropdown();
    setupGatePalette();
    setupQubitSegmentedControls();
    setupTimelineControls();
    setupChatTutor();
    setupCurriculum();
    setupQuiz();
    setupExportTab();

    // Initial render
    renderCircuitGrid();
    updateProgressDisplay();

    // Auto run default state
    await runSimulation();
  } catch (err) {
    console.error("Initialization Error:", err);
  }
}

// ============================================================================
// Navigation Tabs
// ============================================================================
function setupNavTabs() {
  const tabs = document.querySelectorAll(".nav-tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));

      tab.classList.add("active");
      const targetId = tab.dataset.tab;
      const pane = $(targetId);
      if (pane) pane.classList.add("active");

      // Auto trigger view updates if switching to export
      if (targetId === "export-tab") updateCodeExport();
    });
  });
}

function setupSoundToggle() {
  const btn = $("soundToggle");
  const icon = $("soundIcon");
  const s = Storage.get();
  sound.muted = s.muted || false;
  icon.textContent = sound.muted ? "🔇" : "🔊";

  btn.onclick = () => {
    sound.muted = !sound.muted;
    const cur = Storage.get();
    cur.muted = sound.muted;
    Storage.set(cur);
    icon.textContent = sound.muted ? "🔇" : "🔊";
  };

  $("resetApp").onclick = () => {
    if (confirm("Reset your quantum course progress and clear the circuit?")) {
      Storage.set({ done: [], score: {}, muted: sound.muted });
      circuitOps = [];
      pendingMulti = null;
      updateProgressDisplay();
      setupCurriculum();
      renderCircuitGrid();
      runSimulation();
    }
  };
}

// ============================================================================
// Presets & Qubits Controls
// ============================================================================
function populatePresetsDropdown() {
  const select = $("presetsSelect");
  select.innerHTML = '<option value="">-- Choose Algorithm Preset --</option>';

  const grouped = {};
  for (const [key, preset] of Object.entries(appData.presets)) {
    const cat = preset.category || "General";
    grouped[cat] = grouped[cat] || [];
    grouped[cat].push({ key, ...preset });
  }

  for (const [category, list] of Object.entries(grouped)) {
    const optgroup = document.createElement("optgroup");
    optgroup.label = `── ${category} ──`;
    list.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.key;
      opt.textContent = `${p.name} (${p.n}Q)`;
      optgroup.appendChild(opt);
    });
    select.appendChild(optgroup);
  }

  select.onchange = e => {
    if (e.target.value) {
      loadPreset(e.target.value);
    }
  };
}

function loadPreset(key) {
  const preset = appData.presets[key];
  if (!preset) return;
  setQubitCount(preset.n);
  circuitOps = JSON.parse(JSON.stringify(preset.ops));
  pendingMulti = null;
  $("presetsSelect").value = key;
  renderCircuitGrid();
  runSimulation();
  sound.simRan();

  // Explain in tutor
  addTutorChatMessage("tutor", `Loaded **${preset.name}**: ${preset.description}`);
}

function setupGatePalette() {
  const allButtons = document.querySelectorAll(".gate-btn");
  allButtons.forEach(btn => {
    btn.onclick = () => {
      allButtons.forEach(b => b.classList.remove("sel"));
      btn.classList.add("sel");
      selectedGate = btn.dataset.g;
      pendingMulti = null;

      // Update tooltip
      const desc = GATE_DESCRIPTIONS[selectedGate] || selectedGate;
      $("gateHelpChip").innerHTML = `💡 Active Gate: <strong>${desc}</strong>`;
      renderCircuitGrid();
    };
  });
}

function setupQubitSegmentedControls() {
  const btns = document.querySelectorAll("#qubitCountBtns .seg-btn");
  btns.forEach(b => {
    b.onclick = () => {
      const n = parseInt(b.dataset.nq);
      setQubitCount(n);
    };
  });

  $("runBtn").onclick = () => {
    runSimulation();
    sound.simRan();
  };

  $("clearBtn").onclick = () => {
    circuitOps = [];
    pendingMulti = null;
    lastSimResult = null;
    sound.gateRemoved();
    renderCircuitGrid();
    runSimulation();
  };

  $("shotsSelect").onchange = () => runSimulation();
}

function setQubitCount(n) {
  n = Math.max(1, Math.min(n, MAX_QUBITS));
  $("nq").value = n;
  document.querySelectorAll("#qubitCountBtns .seg-btn").forEach(b => {
    b.classList.toggle("active", parseInt(b.dataset.nq) === n);
  });
  // Filter ops that exceed new qubit count
  circuitOps = circuitOps.filter(o => o.q.every(q => q < n));
  pendingMulti = null;
  renderCircuitGrid();
  runSimulation();
}

const getNQubits = () => parseInt($("nq").value) || 2;

// ============================================================================
// Circuit Grid Rendering & SVG Multi-Qubit Connectors
// ============================================================================
function renderCircuitGrid() {
  const n = getNQubits();
  let html = "";

  for (let r = 0; r < n; r++) {
    html += `<tr><td class="qubit-lbl">q${r} |0⟩</td>`;
    for (let c = 0; c < COLS; c++) {
      const op = circuitOps.find(o => o.c === c && o.q.includes(r));
      let gateMarkup = "";

      if (op) {
        const qIndex = op.q.indexOf(r);
        if (op.g === "CX") {
          gateMarkup = qIndex === 0 ? `<span class="placed-gate ctl-node" title="Control (q${r})"></span>` : `<span class="placed-gate target-cnot" title="Target (q${r})">⊕</span>`;
        } else if (op.g === "CZ") {
          gateMarkup = `<span class="placed-gate ctl-node" title="Controlled-Z (q${r})"></span>`;
        } else if (op.g === "CCX") {
          gateMarkup = qIndex < 2 ? `<span class="placed-gate ctl-node" title="Control (q${r})"></span>` : `<span class="placed-gate target-cnot" title="Target (q${r})">⊕</span>`;
        } else if (op.g === "SWAP") {
          gateMarkup = `<span class="placed-gate target-swap" title="SWAP (q${r})">✕</span>`;
        } else {
          const cls = SINGLE_GATES.includes(op.g) ? `${op.g.toLowerCase()}-gate` : "gate-btn";
          gateMarkup = `<span class="placed-gate ${cls}">${op.g}</span>`;
        }
      } else if (pendingMulti && pendingMulti.c === c && pendingMulti.q.includes(r)) {
        gateMarkup = `<span class="placed-gate ctl-node pending-node">?</span>`;
      }

      const isActiveCol = activeStepIndex > 0 && lastSimResult && lastSimResult.steps && lastSimResult.steps[activeStepIndex] && lastSimResult.steps[activeStepIndex].col === c;
      html += `<td class="cell ${isActiveCol ? "active-col" : ""}" data-r="${r}" data-c="${c}">${gateMarkup}</td>`;
    }
    html += "</tr>";
  }

  $("circuitGrid").innerHTML = html;

  // Click Handler for circuit cells
  $("circuitGrid").onclick = e => {
    const td = e.target.closest("td.cell");
    if (td) handleCellClick(parseInt(td.dataset.r), parseInt(td.dataset.c));
  };

  drawWireConnectors();
  updateCodeExport();
}

function handleCellClick(r, c) {
  // Check if existing gate at (r, c) -> Delete it
  const existingIndex = circuitOps.findIndex(o => o.c === c && o.q.includes(r));
  if (existingIndex >= 0) {
    circuitOps.splice(existingIndex, 1);
    pendingMulti = null;
    sound.gateRemoved();
    renderCircuitGrid();
    runSimulation();
    return;
  }

  // Single-Qubit Gate Placement
  if (SINGLE_GATES.includes(selectedGate)) {
    circuitOps.push({ g: selectedGate, q: [r], c });
    sound.gatePlaced();
    renderCircuitGrid();
    runSimulation();
    return;
  }

  // Two-Qubit Gates (CX, CZ, SWAP)
  if (TWO_QUBIT_GATES.includes(selectedGate)) {
    if (!pendingMulti || pendingMulti.c !== c || pendingMulti.g !== selectedGate) {
      pendingMulti = { g: selectedGate, q: [r], c };
      sound.playTone(493.88, "sine", 0.05); // B4
      renderCircuitGrid();
    } else {
      if (pendingMulti.q[0] !== r) {
        circuitOps.push({ g: selectedGate, q: [pendingMulti.q[0], r], c });
        pendingMulti = null;
        sound.gatePlaced();
        renderCircuitGrid();
        runSimulation();
      } else {
        pendingMulti = null;
        renderCircuitGrid();
      }
    }
    return;
  }

  // Three-Qubit Gate (CCX / Toffoli)
  if (THREE_QUBIT_GATES.includes(selectedGate)) {
    if (!pendingMulti || pendingMulti.c !== c || pendingMulti.g !== selectedGate) {
      pendingMulti = { g: selectedGate, q: [r], c };
      sound.playTone(493.88, "sine", 0.05);
      renderCircuitGrid();
    } else if (pendingMulti.q.length === 1) {
      if (!pendingMulti.q.includes(r)) {
        pendingMulti.q.push(r);
        sound.playTone(554.37, "sine", 0.05);
        renderCircuitGrid();
      }
    } else if (pendingMulti.q.length === 2) {
      if (!pendingMulti.q.includes(r)) {
        circuitOps.push({ g: selectedGate, q: [pendingMulti.q[0], pendingMulti.q[1], r], c });
        pendingMulti = null;
        sound.gatePlaced();
        renderCircuitGrid();
        runSimulation();
      } else {
        pendingMulti = null;
        renderCircuitGrid();
      }
    }
  }
}

// Draw dynamic SVG bus connection lines between control and target nodes
function drawWireConnectors() {
  const svg = $("wireOverlay");
  if (!svg) return;
  svg.innerHTML = "";

  const multiOps = circuitOps.filter(o => o.q.length > 1);
  multiOps.forEach(op => {
    const minQ = Math.min(...op.q);
    const maxQ = Math.max(...op.q);

    const cellTop = document.querySelector(`td.cell[data-r="${minQ}"][data-c="${op.c}"]`);
    const cellBottom = document.querySelector(`td.cell[data-r="${maxQ}"][data-c="${op.c}"]`);

    if (cellTop && cellBottom) {
      const topRect = cellTop.getBoundingClientRect();
      const btmRect = cellBottom.getBoundingClientRect();
      const boardRect = $("circuitBoard").getBoundingClientRect();

      const x = topRect.left - boardRect.left + topRect.width / 2;
      const y1 = topRect.top - boardRect.top + topRect.height / 2;
      const y2 = btmRect.top - boardRect.top + btmRect.height / 2;

      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", x);
      line.setAttribute("y1", y1);
      line.setAttribute("x2", x);
      line.setAttribute("y2", y2);
      line.setAttribute("stroke", op.g === "SWAP" ? "#ec4899" : "#00f2fe");
      line.setAttribute("stroke-width", "2");
      line.setAttribute("stroke-linecap", "round");
      svg.appendChild(line);
    }
  });
}

// ============================================================================
// Simulation Execution & Results Display
// ============================================================================
const getOrderedOps = () => [...circuitOps].sort((a, b) => a.c - b.c);

async function runSimulation() {
  $("simError").style.display = "none";
  const n = getNQubits();
  const shots = parseInt($("shotsSelect").value) || 1024;
  const ops = getOrderedOps();

  try {
    const res = await fetch("/api/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ n, ops, shots }),
    });

    const data = await res.json();
    if (data.error) {
      $("simError").textContent = `Simulation Error: ${data.error}`;
      $("simError").style.display = "block";
      return;
    }

    lastSimResult = data;
    activeStepIndex = data.steps.length - 1;

    updateTimelineSlider();
    renderStepView(activeStepIndex);
    updateCodeExport();
  } catch (err) {
    console.error("Simulation request failed:", err);
  }
}

function renderStepView(stepIdx) {
  if (!lastSimResult || !lastSimResult.steps || !lastSimResult.steps[stepIdx]) return;
  const step = lastSimResult.steps[stepIdx];
  activeStepIndex = stepIdx;

  // Update HUD
  $("hudDirac").textContent = step.dirac || "|0...0⟩";
  $("hudEntangled").textContent = step.entangled ? "Entangled State detected! 🔗" : "Separable (Pure) ✓";
  $("hudEntangled").className = `hud-value ${step.entangled ? "status-entangled" : "status-separable"}`;
  $("hudEntropy").textContent = lastSimResult.entropy !== undefined ? lastSimResult.entropy.toFixed(4) : "0.0000";

  // Update Timeline Badge & Slider
  $("currentStepBadge").textContent = `Step ${stepIdx} / ${lastSimResult.steps.length - 1} (${step.name})`;
  $("timelineSlider").value = stepIdx;

  // Render Bloch Spheres
  renderBlochSpheres(step.bloch);

  // Render Probabilities / Amplitudes
  renderStateDistributions(step.probs, step.amps);

  // Highlight active column
  renderCircuitGrid();
}

// ============================================================================
// Interactive 3D Bloch Sphere Visualizer (HTML5 3D Canvas Engine)
// ============================================================================
function renderBlochSpheres(blochs) {
  const container = $("blochContainer");
  if (!container || !blochs) return;
  container.innerHTML = "";

  blochs.forEach((b, i) => {
    const item = document.createElement("div");
    item.className = "bloch-item";

    const canvas = document.createElement("canvas");
    canvas.className = "bloch-canvas";
    canvas.width = 280;
    canvas.height = 280;
    canvas.style.width = "140px";
    canvas.style.height = "140px";

    const qubitLbl = document.createElement("div");
    qubitLbl.className = "bloch-qubit-lbl";
    qubitLbl.textContent = `Qubit q${i} [|ψ⟩]`;

    const stats = document.createElement("div");
    stats.className = "bloch-stats";
    stats.innerHTML = `x: ${b.x.toFixed(2)} | y: ${b.y.toFixed(2)} | z: ${b.z.toFixed(2)}<br>` +
      `<span style="color:${b.purity < 0.99 ? '#f43f5e' : '#34d399'}">Purity: ${b.purity.toFixed(3)} ${b.purity < 0.99 ? '(Mixed/Entangled)' : '(Pure)'}</span>`;

    item.appendChild(canvas);
    item.appendChild(qubitLbl);
    item.appendChild(stats);
    container.appendChild(item);

    // Initialize 3D renderer on canvas
    initBloch3DCanvas(canvas, b, i);
  });
}

function initBloch3DCanvas(canvas, bData, qIndex) {
  const ctx = canvas.getContext("2d");
  const size = canvas.width;
  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.38;

  let isDragging = false;
  let lastMouseX = 0;
  let lastMouseY = 0;

  function project(x, y, z) {
    const rot = blochRotations[qIndex] || { rotX: -0.3, rotY: 0.5 };
    // Rotate Y (azimuth)
    const cosY = Math.cos(rot.rotY), sinY = Math.sin(rot.rotY);
    const x1 = x * cosY + z * sinY;
    const y1 = y;
    const z1 = -x * sinY + z * cosY;

    // Rotate X (elevation)
    const cosX = Math.cos(rot.rotX), sinX = Math.sin(rot.rotX);
    const x2 = x1;
    const y2 = y1 * cosX - z1 * sinX;
    const z2 = y1 * sinX + z1 * cosX;

    return {
      px: cx + x2 * R,
      py: cy - y2 * R,
      z: z2,
    };
  }

  function draw() {
    ctx.clearRect(0, 0, size, size);

    // Sphere Silhouette
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(10, 18, 48, 0.4)";
    ctx.fill();
    ctx.strokeStyle = "rgba(0, 242, 254, 0.3)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Latitude & Equator circles
    function drawRing(axis, radiusRatio, elevation) {
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1;
      const segs = 36;
      for (let s = 0; s <= segs; s++) {
        const phi = (s / segs) * Math.PI * 2;
        let p;
        if (axis === "z") {
          const rx = Math.cos(phi) * radiusRatio;
          const ry = Math.sin(phi) * radiusRatio;
          p = project(rx, ry, elevation);
        }
        if (s === 0) ctx.moveTo(p.px, p.py);
        else ctx.lineTo(p.px, p.py);
      }
      ctx.stroke();
    }
    drawRing("z", 1.0, 0); // Equator

    // Coordinate Axes (X: Red, Y: Green, Z: Blue)
    function drawAxis(x, y, z, label, color) {
      const p0 = project(0, 0, 0);
      const p1 = project(x * 1.15, y * 1.15, z * 1.15);
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.moveTo(p0.px, p0.py);
      ctx.lineTo(p1.px, p1.py);
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.font = "bold 18px 'Outfit', sans-serif";
      ctx.fillText(label, p1.px - 6, p1.py + 5);
    }
    drawAxis(1, 0, 0, "+X", "#f43f5e");
    drawAxis(0, 1, 0, "+Y", "#10b981");
    drawAxis(0, 0, 1, "|0⟩", "#38bdf8");
    drawAxis(0, 0, -1, "|1⟩", "#818cf8");

    // State Vector Arrow (x, y, z)
    const pOrigin = project(0, 0, 0);
    const pState = project(bData.x, bData.y, bData.z);

    // Glowing Arrow
    ctx.beginPath();
    ctx.strokeStyle = "#00f2fe";
    ctx.lineWidth = 3.5;
    ctx.shadowColor = "#00f2fe";
    ctx.shadowBlur = 10;
    ctx.moveTo(pOrigin.px, pOrigin.py);
    ctx.lineTo(pState.px, pState.py);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Arrowhead Tip
    ctx.beginPath();
    ctx.arc(pState.px, pState.py, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.strokeStyle = "#00f2fe";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Mouse Drag Interaction for 3D Orbiting
  canvas.onmousedown = e => {
    isDragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  };
  window.addEventListener("mouseup", () => { isDragging = false; });
  window.addEventListener("mousemove", e => {
    if (!isDragging) return;
    const dx = e.clientX - lastMouseX;
    const dy = e.clientY - lastMouseY;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;

    blochRotations[qIndex].rotY += dx * 0.015;
    blochRotations[qIndex].rotX += dy * 0.015;
    blochRotations[qIndex].rotX = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, blochRotations[qIndex].rotX));
    draw();
  });

  draw();
}

// ============================================================================
// State Distributions & Amplitudes (Phasors)
// ============================================================================
function renderStateDistributions(probs, amps) {
  const probsContainer = $("probsContainer");
  const ampsContainer = $("amplitudesContainer");
  if (!probsContainer || !lastSimResult) return;

  const labels = lastSimResult.labels;
  const counts = lastSimResult.counts || {};
  const shots = lastSimResult.shots || 1024;

  // Probabilities Bar Histogram
  let probHtml = "";
  labels.forEach((lbl, i) => {
    const p = probs[i] || 0;
    const pct = (p * 100).toFixed(1);
    const measuredCount = counts[lbl] || 0;
    probHtml += `
      <div class="prob-bar-row">
        <span class="basis-label">|${lbl}⟩</span>
        <div class="bar-track">
          <div class="bar-fill" style="width: ${pct}%" title="|${lbl}⟩: ${pct}% (${measuredCount} shots)"></div>
        </div>
        <span class="prob-pct-val">${pct}%</span>
      </div>
    `;
  });
  probsContainer.innerHTML = probHtml;

  $("shotsCountLabel").textContent = `Measured distribution across ${shots} shots (Counts: ${Object.entries(counts).map(([k, v]) => `|${k}⟩: ${v}`).join(", ") || "none"})`;

  // Complex Amplitudes Grid (Phasors)
  let ampHtml = "";
  labels.forEach((lbl, i) => {
    const [real, imag] = amps[i] || [0, 0];
    const mag = Math.sqrt(real * real + imag * imag);
    const angle = Math.atan2(imag, real);
    const deg = (angle * 180 / Math.PI).toFixed(0);

    ampHtml += `
      <div class="amp-card">
        <div class="phasor-circle">
          <div class="phasor-needle" style="width: ${Math.min(14, mag * 14)}px; transform: rotate(${angle}rad)"></div>
        </div>
        <div class="amp-info">
          <strong>|${lbl}⟩</strong>: ${(mag * mag * 100).toFixed(1)}%<br>
          <small>θ: ${deg}° | (${real.toFixed(2)} + ${imag.toFixed(2)}i)</small>
        </div>
      </div>
    `;
  });
  ampsContainer.innerHTML = ampHtml;

  // Viz Toggle pills
  document.querySelectorAll("#vizModeToggle .pill-btn").forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll("#vizModeToggle .pill-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeVizMode = btn.dataset.mode;
      probsContainer.style.display = activeVizMode === "probs" ? "flex" : "none";
      ampsContainer.style.display = activeVizMode === "amplitudes" ? "grid" : "none";
    };
  });
}

// ============================================================================
// Step-by-Step Circuit Timeline Controls
// ============================================================================
function setupTimelineControls() {
  $("stepFirst").onclick = () => { stopTimelinePlay(); renderStepView(0); sound.stepTick(); };
  $("stepPrev").onclick = () => {
    stopTimelinePlay();
    if (activeStepIndex > 0) { renderStepView(activeStepIndex - 1); sound.stepTick(); }
  };
  $("stepNext").onclick = () => {
    stopTimelinePlay();
    if (lastSimResult && activeStepIndex < lastSimResult.steps.length - 1) {
      renderStepView(activeStepIndex + 1);
      sound.stepTick();
    }
  };
  $("stepLast").onclick = () => {
    stopTimelinePlay();
    if (lastSimResult) { renderStepView(lastSimResult.steps.length - 1); sound.stepTick(); }
  };

  $("stepPlay").onclick = toggleTimelinePlay;

  $("timelineSlider").oninput = e => {
    stopTimelinePlay();
    renderStepView(parseInt(e.target.value));
    sound.stepTick();
  };
}

function updateTimelineSlider() {
  if (!lastSimResult || !lastSimResult.steps) return;
  const slider = $("timelineSlider");
  slider.max = lastSimResult.steps.length - 1;
  slider.value = activeStepIndex;
}

function toggleTimelinePlay() {
  if (isPlayingTimeline) {
    stopTimelinePlay();
  } else {
    isPlayingTimeline = true;
    $("stepPlay").textContent = "⏸ Pause";
    if (lastSimResult && activeStepIndex >= lastSimResult.steps.length - 1) {
      activeStepIndex = 0;
      renderStepView(0);
    }
    timelineInterval = setInterval(() => {
      if (lastSimResult && activeStepIndex < lastSimResult.steps.length - 1) {
        renderStepView(activeStepIndex + 1);
        sound.stepTick();
      } else {
        stopTimelinePlay();
      }
    }, 900);
  }
}

function stopTimelinePlay() {
  isPlayingTimeline = false;
  if (timelineInterval) clearInterval(timelineInterval);
  $("stepPlay").textContent = "▶ Play";
}

// ============================================================================
// AI Quantum Tutor & Chat
// ============================================================================
function setupChatTutor() {
  $("tutorSendBtn").onclick = () => sendTutorMessage($("tutorInput").value);
  $("tutorInput").onkeydown = e => { if (e.key === "Enter") sendTutorMessage($("tutorInput").value); };

  document.querySelectorAll(".prompt-chip").forEach(chip => {
    chip.onclick = () => sendTutorMessage(chip.dataset.query);
  });
}

function addTutorChatMessage(sender, text) {
  const box = $("chatMessages");
  const msgDiv = document.createElement("div");
  msgDiv.className = `chat-msg ${sender === "user" ? "user-msg" : "tutor-msg"}`;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = sender === "user" ? "👤" : "⚛️";

  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";
  bubble.innerHTML = formatMarkdown(text);

  msgDiv.appendChild(avatar);
  msgDiv.appendChild(bubble);
  box.appendChild(msgDiv);
  box.scrollTop = box.scrollHeight;
}

function formatMarkdown(txt) {
  return txt
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br>");
}

async function sendTutorMessage(text) {
  if (!text || !text.trim()) return;
  $("tutorInput").value = "";
  addTutorChatMessage("user", text);

  try {
    const res = await fetch("/api/tutor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        circuit: { n: getNQubits(), ops: getOrderedOps() },
        result: lastSimResult,
      }),
    });
    const data = await res.json();
    addTutorChatMessage("tutor", data.reply);
  } catch (err) {
    addTutorChatMessage("tutor", "I encountered an error analyzing that question. Please try again!");
  }
}

// ============================================================================
// TAB 2: Curriculum Modules & Lessons
// ============================================================================
function setupCurriculum() {
  const list = $("modulesList");
  if (!list || !appData.lessons) return;
  list.innerHTML = "";

  const store = Storage.get();

  appData.lessons.forEach((l, idx) => {
    const isDone = store.done.includes(l.id);
    const item = document.createElement("div");
    item.className = `module-nav-item ${idx === activeLessonIndex ? "active" : ""}`;
    item.dataset.index = idx;
    item.innerHTML = `
      <span class="module-nav-title">${l.title}</span>
      <span class="module-nav-status">${isDone ? "✅" : "⭕"}</span>
    `;
    item.onclick = () => displayLesson(idx);
    list.appendChild(item);
  });

  displayLesson(activeLessonIndex);

  $("loadLessonPresetBtn").onclick = () => {
    const lesson = appData.lessons[activeLessonIndex];
    if (lesson && lesson.preset) {
      loadPreset(lesson.preset);
      // Switch tab to studio
      document.querySelector('.nav-tab[data-tab="studio"]').click();
    }
  };

  $("markLessonCompleteBtn").onclick = () => {
    const lesson = appData.lessons[activeLessonIndex];
    if (lesson) {
      const s = Storage.get();
      if (!s.done.includes(lesson.id)) {
        s.done.push(lesson.id);
        Storage.set(s);
      }
      updateProgressDisplay();
      setupCurriculum();

      // Go to next lesson if available
      if (activeLessonIndex < appData.lessons.length - 1) {
        displayLesson(activeLessonIndex + 1);
      }
    }
  };

  $("prevLessonBtn").onclick = () => {
    if (activeLessonIndex > 0) displayLesson(activeLessonIndex - 1);
  };
}

function displayLesson(idx) {
  activeLessonIndex = idx;
  const lesson = appData.lessons[idx];
  if (!lesson) return;

  $("lessonCategory").textContent = lesson.tag || `Module ${idx + 1}`;
  $("lessonTitle").textContent = lesson.title;
  $("lessonSummary").textContent = lesson.summary || "";
  $("lessonText").textContent = lesson.text;
  $("lessonTaskText").textContent = lesson.task || "Experiment with this algorithm in the circuit canvas.";

  $("loadLessonPresetBtn").style.display = lesson.preset ? "inline-flex" : "none";

  document.querySelectorAll(".module-nav-item").forEach((el, i) => {
    el.classList.toggle("active", i === idx);
  });
}

function updateProgressDisplay() {
  const store = Storage.get();
  const total = appData.lessons ? appData.lessons.length : 1;
  const doneCount = store.done ? store.done.length : 0;
  const pct = Math.round((doneCount / Math.max(1, total)) * 100);

  $("overallProgressBar").style.width = `${pct}%`;
  $("overallProgressPct").textContent = `${pct}%`;
}

// ============================================================================
// TAB 3: Adaptive Mastery Quiz
// ============================================================================
function setupQuiz() {
  if (!appData.quiz || appData.quiz.length === 0) return;
  displayQuizQuestion(quizIndex);

  $("nextQBtn").onclick = () => {
    quizIndex = (quizIndex + 1) % appData.quiz.length;
    displayQuizQuestion(quizIndex);
  };

  $("skipQBtn").onclick = () => {
    quizIndex = (quizIndex + 1) % appData.quiz.length;
    displayQuizQuestion(quizIndex);
  };
}

function displayQuizQuestion(idx) {
  const q = appData.quiz[idx];
  if (!q) return;

  $("qTopicBadge").textContent = `Topic: ${q.topic.toUpperCase()}`;
  $("quizQuestionText").textContent = q.q;
  $("quizFeedbackBox").style.display = "none";
  $("nextQBtn").style.display = "none";
  $("skipQBtn").style.display = "inline-flex";

  const list = $("quizOptionsList");
  list.innerHTML = "";

  q.options.forEach((optText, optIdx) => {
    const btn = document.createElement("button");
    btn.className = "quiz-option-btn";
    btn.dataset.idx = optIdx;
    btn.textContent = `${String.fromCharCode(65 + optIdx)}. ${optText}`;

    btn.onclick = () => handleQuizAnswer(optIdx, q);
    list.appendChild(btn);
  });

  updateQuizScoreDisplay();
}

function handleQuizAnswer(selectedIdx, question) {
  const isCorrect = selectedIdx === question.a;
  const s = Storage.get();
  s.score = s.score || { correct: 0, total: 0 };
  s.score.total++;
  if (isCorrect) s.score.correct++;
  Storage.set(s);

  // Disable buttons & highlight
  const allBtns = document.querySelectorAll(".quiz-option-btn");
  allBtns.forEach((btn, i) => {
    btn.disabled = true;
    if (i === question.a) btn.classList.add("correct");
    if (i === selectedIdx && !isCorrect) btn.classList.add("incorrect");
  });

  // Sound & Feedback
  if (isCorrect) sound.quizCorrect();
  else sound.quizWrong();

  const feedbackBox = $("quizFeedbackBox");
  feedbackBox.className = `quiz-feedback-box ${isCorrect ? "correct" : "incorrect"}`;
  $("feedbackTitle").textContent = isCorrect ? "🎉 Correct!" : "❌ Incorrect";
  $("feedbackExplanation").textContent = question.why;
  feedbackBox.style.display = "block";

  $("nextQBtn").style.display = "inline-flex";
  $("skipQBtn").style.display = "none";
  updateQuizScoreDisplay();
}

function updateQuizScoreDisplay() {
  const s = Storage.get();
  const score = s.score || { correct: 0, total: 0 };
  $("quizScoreDisplay").textContent = `${score.correct} / ${score.total}`;
}

// ============================================================================
// TAB 4: Code Export & Hardware Guides
// ============================================================================
function setupExportTab() {
  document.querySelectorAll("#exportFormatPills .pill-btn").forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll("#exportFormatPills .pill-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeExportFormat = btn.dataset.fmt;
      updateCodeExport();
    };
  });

  $("copyCodeBtn").onclick = () => {
    const code = $("codeOutput").textContent;
    navigator.clipboard.writeText(code).then(() => {
      const toast = $("copyToast");
      toast.style.display = "block";
      setTimeout(() => { toast.style.display = "none"; }, 2500);
    });
  };
}

function updateCodeExport() {
  if (!lastSimResult) return;
  const n = getNQubits();
  const ops = getOrderedOps();

  if (activeExportFormat === "qiskit") {
    $("codeLangLabel").textContent = "Python 3 (Qiskit v1.0+)";
    $("codeOutput").textContent = lastSimResult.qiskit || generateClientQiskit(n, ops);
  } else if (activeExportFormat === "qasm") {
    $("codeLangLabel").textContent = "OpenQASM 2.0";
    $("codeOutput").textContent = lastSimResult.qasm || generateClientQasm(n, ops);
  } else if (activeExportFormat === "cirq") {
    $("codeLangLabel").textContent = "Python 3 (Google Cirq)";
    $("codeOutput").textContent = generateCirqCode(n, ops);
  }
}

function generateCirqCode(n, ops) {
  const lines = [
    "import cirq",
    "",
    `# Initialize ${n} qubits`,
    `qubits = cirq.LineQubit.range(${n})`,
    "circuit = cirq.Circuit()",
    "",
  ];
  ops.forEach(op => {
    const g = op.g;
    const q = op.q;
    if (g === "H") lines.push(`circuit.append(cirq.H(qubits[${q[0]}]))`);
    else if (g === "X") lines.push(`circuit.append(cirq.X(qubits[${q[0]}]))`);
    else if (g === "Y") lines.push(`circuit.append(cirq.Y(qubits[${q[0]}]))`);
    else if (g === "Z") lines.push(`circuit.append(cirq.Z(qubits[${q[0]}]))`);
    else if (g === "S") lines.push(`circuit.append(cirq.S(qubits[${q[0]}]))`);
    else if (g === "T") lines.push(`circuit.append(cirq.T(qubits[${q[0]}]))`);
    else if (g === "CX") lines.push(`circuit.append(cirq.CNOT(qubits[${q[0]}], qubits[${q[1]}]))`);
    else if (g === "CZ") lines.push(`circuit.append(cirq.CZ(qubits[${q[0]}], qubits[${q[1]}]))`);
    else if (g === "CCX") lines.push(`circuit.append(cirq.TOFFOLI(qubits[${q[0]}], qubits[${q[1]}], qubits[${q[2]}]))`);
    else if (g === "SWAP") lines.push(`circuit.append(cirq.SWAP(qubits[${q[0]}], qubits[${q[1]}]))`);
  });
  lines.push("", "circuit.append(cirq.measure(*qubits, key='result'))", "print('Cirq Circuit:')", "print(circuit)");
  return lines.join("\n");
}

function generateClientQiskit(n, ops) {
  return `# Qiskit Code for ${n} qubits\nfrom qiskit import QuantumCircuit\nqc = QuantumCircuit(${n}, ${n})\n`;
}

function generateClientQasm(n, ops) {
  return `OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[${n}];\ncreg c[${n}];\n`;
}

// Kickoff application on load
window.addEventListener("DOMContentLoaded", initApp);
