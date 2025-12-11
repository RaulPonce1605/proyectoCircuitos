import React, { useState, useEffect } from "react";
import {
  Calculator,
  Plus,
  Minus,
  X,
  Divide,
  RotateCcw,
  Power,
  Zap,
  Trash2,
  Play,
  Grid3x3,
  Link,
  RotateCw,
} from "lucide-react";

const ComplexCalculator = () => {
  const [activeTab, setActiveTab] = useState("calculator");

  // Estado para calculadora
  const [z1Real, setZ1Real] = useState(3);
  const [z1Imag, setZ1Imag] = useState(4);
  const [z2Real, setZ2Real] = useState(2);
  const [z2Imag, setZ2Imag] = useState(-1);
  const [operation, setOperation] = useState("add");
  const [result, setResult] = useState(null);
  const [showPolar, setShowPolar] = useState(false);

  // Estado para circuitos
  const [components, setComponents] = useState([]);
  const [wires, setWires] = useState([]);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [connectingMode, setConnectingMode] = useState(false);
  const [firstNode, setFirstNode] = useState(null);
  const [frequency, setFrequency] = useState(60);
  const [circuitResult, setCircuitResult] = useState(null);
  const [meshEquations, setMeshEquations] = useState([]);
  const gridSize = 40;

  // Operaciones con números complejos
  const add = (a, b, c, d) => ({ real: a + c, imag: b + d });
  const subtract = (a, b, c, d) => ({ real: a - c, imag: b - d });
  const multiply = (a, b, c, d) => ({
    real: a * c - b * d,
    imag: a * d + b * c,
  });
  const divide = (a, b, c, d) => {
    const denom = c * c + d * d;
    if (denom === 0) return { real: 0, imag: 0 };
    return {
      real: (a * c + b * d) / denom,
      imag: (b * c - a * d) / denom,
    };
  };
  const conjugate = (a, b) => ({ real: a, imag: -b });
  const power = (a, b, n) => {
    const r = Math.sqrt(a * a + b * b);
    const theta = Math.atan2(b, a);
    const newR = Math.pow(r, n);
    const newTheta = theta * n;
    return {
      real: newR * Math.cos(newTheta),
      imag: newR * Math.sin(newTheta),
    };
  };

  const toPolar = (real, imag) => {
    const r = Math.sqrt(real * real + imag * imag);
    const theta = Math.atan2(imag, real) * (180 / Math.PI);
    return { r, theta };
  };

  useEffect(() => {
    let res;
    switch (operation) {
      case "add":
        res = add(z1Real, z1Imag, z2Real, z2Imag);
        break;
      case "subtract":
        res = subtract(z1Real, z1Imag, z2Real, z2Imag);
        break;
      case "multiply":
        res = multiply(z1Real, z1Imag, z2Real, z2Imag);
        break;
      case "divide":
        res = divide(z1Real, z1Imag, z2Real, z2Imag);
        break;
      case "conjugate":
        res = conjugate(z1Real, z1Imag);
        break;
      case "power":
        res = power(z1Real, z1Imag, 2);
        break;
      default:
        res = { real: 0, imag: 0 };
    }
    setResult(res);
  }, [z1Real, z1Imag, z2Real, z2Imag, operation]);

  const formatComplex = (num) => {
    if (!num) return "";
    const real = num.real.toFixed(2);
    const imag = Math.abs(num.imag).toFixed(2);
    const sign = num.imag >= 0 ? "+" : "-";
    return `${real} ${sign} ${imag}j`;
  };

  const formatPolar = (num) => {
    if (!num) return "";
    const polar = toPolar(num.real, num.imag);
    return `${polar.r.toFixed(2)} ∠ ${polar.theta.toFixed(2)}°`;
  };

  // Funciones para circuitos
  const snapToGrid = (value) => {
    return Math.round(value / gridSize) * gridSize;
  };

  const addComponentToGrid = (type) => {
    const newComponent = {
      id: Date.now(),
      type,
      value:
        type === "resistor"
          ? 10
          : type === "capacitor"
          ? -2
          : type === "inductor"
          ? 1
          : type === "ac_source"
          ? 120
          : type === "voltage_source"  
          ? 120
          : type === "current_source"
          ? 10
          : type === "current_source_dc"
          ? 10
          : 10,
      phase: (type === "ac_source" || type === "current_source") ? 0 : undefined, // Ángulo de fase para AC
      x: 240,
      y: 240,
      rotation: 0, // 0=horizontal derecha, 90=vertical abajo, 180=horizontal izquierda, 270=vertical arriba
    };
    setComponents([...components, newComponent]);
  };

  const updateComponentValue = (id, value) => {
    setComponents(
      components.map((c) =>
        c.id === id ? { ...c, value: parseFloat(value) || 0 } : c
      )
    );
  };

  const updateComponentPhase = (id, phase) => {
    setComponents(
      components.map((c) =>
        c.id === id ? { ...c, phase: parseFloat(phase) || 0 } : c
      )
    );
  };

  const rotateComponent = (id) => {
    setComponents(
      components.map((c) =>
        c.id === id ? { ...c, rotation: (c.rotation + 90) % 360 } : c
      )
    );
  };

  const removeComponent = (id) => {
    setWires(wires.filter((w) => w.fromComp !== id && w.toComp !== id));
    setComponents(components.filter((c) => c.id !== id));
  };

  const getNodePosition = (comp, nodeNum) => {
    const offset = 35;
    const { x, y, rotation } = comp;

    switch (rotation) {
      case 0: // Horizontal →
        return nodeNum === 1 ? { x: x - offset, y } : { x: x + offset, y };
      case 90: // Vertical ↓
        return nodeNum === 1 ? { x, y: y - offset } : { x, y: y + offset };
      case 180: // Horizontal ←
        return nodeNum === 1 ? { x: x + offset, y } : { x: x - offset, y };
      case 270: // Vertical ↑
        return nodeNum === 1 ? { x, y: y + offset } : { x, y: y - offset };
      default:
        return { x, y };
    }
  };

  // Manejo de drag & drop CORREGIDO
  const handleComponentMouseDown = (e, comp) => {
    if (connectingMode) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const svg = e.currentTarget.ownerSVGElement;
    const rect = svg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setDraggingId(comp.id);
    setDragStart({
      x: mouseX - comp.x,
      y: mouseY - comp.y,
    });
  };

  const handleCanvasMouseMove = (e) => {
    if (!draggingId) return;

    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newX = snapToGrid(mouseX - dragStart.x);
    const newY = snapToGrid(mouseY - dragStart.y);

    setComponents(
      components.map((c) =>
        c.id === draggingId ? { ...c, x: newX, y: newY } : c
      )
    );
  };

  const handleCanvasMouseUp = () => {
    setDraggingId(null);
  };

  const handleNodeClick = (e, comp, nodeNum) => {
    e.stopPropagation();
    e.preventDefault();

    if (!connectingMode) return;

    const nodeId = `${comp.id}-${nodeNum}`;

    if (!firstNode) {
      setFirstNode({ compId: comp.id, nodeNum, nodeId });
    } else {
      if (firstNode.nodeId !== nodeId) {
        const newWire = {
          id: Date.now(),
          fromComp: firstNode.compId,
          fromNode: firstNode.nodeNum,
          toComp: comp.id,
          toNode: nodeNum,
        };
        setWires([...wires, newWire]);
      }
      setFirstNode(null);
      setConnectingMode(false);
    }
  };

  // Análisis de circuitos
  const solveCircuitByMesh = () => {
    if (components.length === 0) {
      alert("Agrega componentes al circuito primero");
      return;
    }

    const omega = 2 * Math.PI * frequency;
    let totalZ = { real: 0, imag: 0 };
    let totalVoltage = 0;

    components.forEach((comp) => {
      let z = { real: 0, imag: 0 };

      switch (comp.type) {
        case "resistor":
          z = { real: comp.value, imag: 0 };
          break;
        case "capacitor":
          z = { real: 0, imag: comp.value };
          break;
        case "inductor":
          z = { real: 0, imag: comp.value };
          break;
        case "voltage_source":
        case "ac_source":
          totalVoltage += comp.value;
          break;
      }

      totalZ = add(totalZ.real, totalZ.imag, z.real, z.imag);
    });

    const current = divide(totalVoltage, 0, totalZ.real, totalZ.imag);
    const currentMag = Math.sqrt(
      current.real * current.real + current.imag * current.imag
    );
    const impedanceMag = Math.sqrt(
      totalZ.real * totalZ.real + totalZ.imag * totalZ.imag
    );
    const phase = Math.atan2(totalZ.imag, totalZ.real) * (180 / Math.PI);
    const currentPhase =
      Math.atan2(current.imag, current.real) * (180 / Math.PI);
    const powerFactor = Math.cos((phase * Math.PI) / 180);

    const apparentPower = totalVoltage * currentMag;
    const activePower = apparentPower * powerFactor;
    const reactivePower = apparentPower * Math.sin((phase * Math.PI) / 180);

    const equation = `${totalVoltage}V = I × (${formatComplex(totalZ)}) Ω`;

    setMeshEquations([
      {
        mesh: 1,
        equation: equation,
        current: current,
      },
    ]);

    setCircuitResult({
      impedance: totalZ,
      impedanceMag: impedanceMag,
      current: current,
      currentMag: currentMag,
      phase: phase,
      currentPhase: currentPhase,
      powerFactor: powerFactor,
      apparentPower: apparentPower,
      activePower: activePower,
      reactivePower: reactivePower,
      voltage: totalVoltage,
    });
  };

  // Componente del plano complejo
  const ComplexPlane = () => {
    const width = 500;
    const height = 500;
    const center = { x: width / 2, y: height / 2 };
    const scale = 40;

    const toScreen = (real, imag) => ({
      x: center.x + real * scale,
      y: center.y - imag * scale,
    });

    const z1Pos = toScreen(z1Real, z1Imag);
    const z2Pos = toScreen(z2Real, z2Imag);
    const resPos = result ? toScreen(result.real, result.imag) : center;

    return (
      <svg
        width={width}
        height={height}
        className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl shadow-2xl"
      >
        <defs>
          <pattern
            id="grid"
            width={scale}
            height={scale}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${scale} 0 L 0 0 0 ${scale}`}
              fill="none"
              stroke="rgba(100,116,139,0.3)"
              strokeWidth="0.5"
            />
          </pattern>
          <marker
            id="arrowhead1"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#3b82f6" />
          </marker>
          <marker
            id="arrowhead2"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#10b981" />
          </marker>
          <marker
            id="arrowhead3"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#f59e0b" />
          </marker>
        </defs>
        <rect width={width} height={height} fill="url(#grid)" />

        <line
          x1="0"
          y1={center.y}
          x2={width}
          y2={center.y}
          stroke="rgba(148,163,184,0.5)"
          strokeWidth="2"
        />
        <line
          x1={center.x}
          y1="0"
          x2={center.x}
          y2={height}
          stroke="rgba(148,163,184,0.5)"
          strokeWidth="2"
        />

        <text
          x={width - 30}
          y={center.y - 10}
          fill="#94a3b8"
          fontSize="14"
          fontWeight="bold"
        >
          Re
        </text>
        <text
          x={center.x + 10}
          y="20"
          fill="#94a3b8"
          fontSize="14"
          fontWeight="bold"
        >
          Im
        </text>

        <line
          x1={center.x}
          y1={center.y}
          x2={z1Pos.x}
          y2={z1Pos.y}
          stroke="#3b82f6"
          strokeWidth="3"
          markerEnd="url(#arrowhead1)"
        />
        <text x={z1Pos.x + 10} y={z1Pos.y - 5} fill="#3b82f6" fontWeight="bold">
          z₁
        </text>

        {operation !== "conjugate" && (
          <>
            <line
              x1={center.x}
              y1={center.y}
              x2={z2Pos.x}
              y2={z2Pos.y}
              stroke="#10b981"
              strokeWidth="3"
              markerEnd="url(#arrowhead2)"
            />
            <text
              x={z2Pos.x + 10}
              y={z2Pos.y - 5}
              fill="#10b981"
              fontWeight="bold"
            >
              z₂
            </text>
          </>
        )}

        {result && (
          <>
            <line
              x1={center.x}
              y1={center.y}
              x2={resPos.x}
              y2={resPos.y}
              stroke="#f59e0b"
              strokeWidth="4"
              markerEnd="url(#arrowhead3)"
              strokeDasharray="5,5"
            />
            <text
              x={resPos.x + 10}
              y={resPos.y + 20}
              fill="#f59e0b"
              fontWeight="bold"
              fontSize="16"
            >
              Resultado
            </text>
          </>
        )}

        {[...Array(10)].map((_, i) => {
          const val = i + 1;
          return (
            <g key={i}>
              <circle
                cx={center.x + val * scale}
                cy={center.y}
                r="2"
                fill="#64748b"
              />
              <circle
                cx={center.x - val * scale}
                cy={center.y}
                r="2"
                fill="#64748b"
              />
              <circle
                cx={center.x}
                cy={center.y + val * scale}
                r="2"
                fill="#64748b"
              />
              <circle
                cx={center.x}
                cy={center.y - val * scale}
                r="2"
                fill="#64748b"
              />
            </g>
          );
        })}
      </svg>
    );
  };

  // Renderizar orientaciones
  const getOrientationText = (rotation) => {
    switch (rotation) {
      case 0:
        return "→";
      case 90:
        return "↓";
      case 180:
        return "←";
      case 270:
        return "↑";
      default:
        return "→";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-8">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-4">
            Calculadora de Números Complejos
          </h1>
          <p className="text-xl text-cyan-300">
            Operaciones y Análisis de Circuitos AC - Método de Mallas
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setActiveTab("calculator")}
            className={`flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all ${
              activeTab === "calculator"
                ? "bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/50 scale-105"
                : "bg-slate-800/50 hover:bg-slate-700/50"
            }`}
          >
            <Calculator size={24} />
            Calculadora
          </button>
          <button
            onClick={() => setActiveTab("circuits")}
            className={`flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all ${
              activeTab === "circuits"
                ? "bg-gradient-to-r from-purple-500 to-pink-600 shadow-lg shadow-purple-500/50 scale-105"
                : "bg-slate-800/50 hover:bg-slate-700/50"
            }`}
          >
            <Zap size={24} />
            Circuitos AC
          </button>
        </div>

        {/* Calculadora Tab */}
        {activeTab === "calculator" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/30 shadow-xl">
                <h2 className="text-3xl font-bold text-cyan-300 mb-6 flex items-center gap-2">
                  <Calculator className="w-8 h-8" />
                  Números Complejos
                </h2>

                <div className="mb-6 p-4 bg-blue-900/30 rounded-xl border border-blue-500/30">
                  <label className="block text-xl font-bold text-blue-300 mb-3">
                    z₁ = a + bj
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-blue-200 mb-2">
                        Parte Real (a)
                      </label>
                      <input
                        type="number"
                        value={z1Real}
                        onChange={(e) => setZ1Real(parseFloat(e.target.value))}
                        className="w-full px-4 py-3 bg-slate-900 border-2 border-blue-500 rounded-lg text-white font-mono text-lg focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-blue-200 mb-2">
                        Parte Imaginaria (b)
                      </label>
                      <input
                        type="number"
                        value={z1Imag}
                        onChange={(e) => setZ1Imag(parseFloat(e.target.value))}
                        className="w-full px-4 py-3 bg-slate-900 border-2 border-blue-500 rounded-lg text-white font-mono text-lg focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  </div>
                </div>

                {operation !== "conjugate" && (
                  <div className="mb-6 p-4 bg-green-900/30 rounded-xl border border-green-500/30">
                    <label className="block text-xl font-bold text-green-300 mb-3">
                      z₂ = c + dj
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-green-200 mb-2">
                          Parte Real (c)
                        </label>
                        <input
                          type="number"
                          value={z2Real}
                          onChange={(e) =>
                            setZ2Real(parseFloat(e.target.value))
                          }
                          className="w-full px-4 py-3 bg-slate-900 border-2 border-green-500 rounded-lg text-white font-mono text-lg focus:ring-2 focus:ring-green-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-green-200 mb-2">
                          Parte Imaginaria (d)
                        </label>
                        <input
                          type="number"
                          value={z2Imag}
                          onChange={(e) =>
                            setZ2Imag(parseFloat(e.target.value))
                          }
                          className="w-full px-4 py-3 bg-slate-900 border-2 border-green-500 rounded-lg text-white font-mono text-lg focus:ring-2 focus:ring-green-400"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <label className="block text-xl font-bold text-purple-300 mb-3">
                    Operación
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { op: "add", icon: Plus, label: "Suma" },
                      { op: "subtract", icon: Minus, label: "Resta" },
                      { op: "multiply", icon: X, label: "Multiplicación" },
                      { op: "divide", icon: Divide, label: "División" },
                      { op: "conjugate", icon: RotateCcw, label: "Conjugado" },
                      { op: "power", icon: Power, label: "Potencia²" },
                    ].map(({ op, icon: Icon, label }) => (
                      <button
                        key={op}
                        onClick={() => setOperation(op)}
                        className={`p-4 rounded-xl font-bold transition-all flex flex-col items-center gap-2 ${
                          operation === op
                            ? "bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg scale-105"
                            : "bg-slate-700/50 hover:bg-slate-600/50"
                        }`}
                      >
                        <Icon size={24} />
                        <span className="text-xs">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setShowPolar(!showPolar)}
                  className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl font-bold hover:from-amber-500 hover:to-orange-500 transition-all"
                >
                  {showPolar ? "Mostrar Rectangular" : "Mostrar Polar"}
                </button>
              </div>

              {result && (
                <div className="bg-gradient-to-br from-amber-900/40 to-orange-800/40 backdrop-blur-sm rounded-2xl p-6 border border-amber-500/30 shadow-xl">
                  <h3 className="text-2xl font-bold text-amber-300 mb-4">
                    Resultado
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-900/50 rounded-lg">
                      <p className="text-sm text-amber-200 mb-2">
                        Forma Rectangular:
                      </p>
                      <p className="text-amber-100 font-mono text-2xl font-bold">
                        {formatComplex(result)}
                      </p>
                    </div>
                    <div className="p-4 bg-slate-900/50 rounded-lg">
                      <p className="text-sm text-amber-200 mb-2">Forma Polar:</p>
                      <p className="text-amber-100 font-mono text-2xl font-bold">
                        {formatPolar(result)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/30 shadow-xl">
              <h3 className="text-2xl font-bold text-cyan-300 mb-4 text-center">
                Representación Gráfica
              </h3>
              <div className="flex justify-center">
                <ComplexPlane />
              </div>
              <div className="mt-4 flex justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-blue-500"></div>
                  <span className="text-blue-300">z₁</span>
                </div>
                {operation !== "conjugate" && (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-1 bg-green-500"></div>
                    <span className="text-green-300">z₂</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-amber-500"></div>
                  <span className="text-amber-300">Resultado</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Circuitos Tab */}
        {activeTab === "circuits" && (
          <div className="space-y-6">
            {/* Instrucciones */}
            <div className="bg-gradient-to-r from-cyan-900/40 to-blue-900/40 backdrop-blur-sm rounded-xl p-4 border border-cyan-500/30">
              <p className="text-cyan-200 text-center font-bold">
                💡 <span className="text-white">Arrastra componentes</span> para moverlos • 
                <span className="text-white"> Click en "Conectar Nodos"</span> → Click en nodos azules para conectar • 
                <span className="text-white"> Botón ↻</span> rota componentes
              </p>
            </div>

            {/* Menú de componentes */}
            <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30 shadow-xl">
              <h2 className="text-2xl font-bold text-purple-300 mb-4 flex items-center gap-2">
                <Grid3x3 className="w-6 h-6" />
                Componentes del Circuito
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-7 gap-3 mb-6">
                <button
                  onClick={() => addComponentToGrid("resistor")}
                  className="p-4 bg-red-600/20 hover:bg-red-600/40 border-2 border-red-500 rounded-xl transition-all flex flex-col items-center gap-2"
                >
                  <div className="w-12 h-6 border-2 border-red-500"></div>
                  <span className="text-red-300 font-bold text-xs text-center">
                    RESISTENCIA<br/>(R)
                  </span>
                </button>

                <button
                  onClick={() => addComponentToGrid("capacitor")}
                  className="p-4 bg-blue-600/20 hover:bg-blue-600/40 border-2 border-blue-500 rounded-xl transition-all flex flex-col items-center gap-2"
                >
                  <div className="flex gap-1">
                    <div className="w-1 h-6 bg-blue-500"></div>
                    <div className="w-1 h-6 bg-blue-500"></div>
                  </div>
                  <span className="text-blue-300 font-bold text-xs text-center">
                    CAPACITOR<br/>(C)
                  </span>
                </button>

                <button
                  onClick={() => addComponentToGrid("inductor")}
                  className="p-4 bg-green-600/20 hover:bg-green-600/40 border-2 border-green-500 rounded-xl transition-all flex flex-col items-center gap-2"
                >
                  <svg width="40" height="20" className="stroke-green-500">
                    <path
                      d="M0,10 Q5,0 10,10 T20,10 T30,10 T40,10"
                      fill="none"
                      strokeWidth="2"
                    />
                  </svg>
                  <span className="text-green-300 font-bold text-xs text-center">
                    INDUCTOR<br/>(L)
                  </span>
                </button>

                <button
                  onClick={() => addComponentToGrid("voltage_source")}
                  className="p-4 bg-purple-600/20 hover:bg-purple-600/40 border-2 border-purple-500 rounded-xl transition-all flex flex-col items-center gap-2"
                >
                  <div className="relative w-8 h-8 rounded-full border-2 border-purple-500 flex items-center justify-center text-purple-300 font-bold">
                    <span className="text-xs absolute -top-1">+</span>
                    <span className="text-2xl">─</span>
                    <span className="text-xs absolute -bottom-1">─</span>
                  </div>
                  <span className="text-purple-300 font-bold text-xs text-center">
                    VOLTAJE DC<br/>(VDC)
                  </span>
                </button>

                <button
                  onClick={() => addComponentToGrid("ac_source")}
                  className="p-4 bg-amber-600/20 hover:bg-amber-600/40 border-2 border-amber-500 rounded-xl transition-all flex flex-col items-center gap-2"
                >
                  <div className="w-8 h-8 rounded-full border-2 border-amber-500 flex items-center justify-center text-amber-300 font-bold text-xl">
                    ~
                  </div>
                  <span className="text-amber-300 font-bold text-xs text-center">
                    VOLTAJE AC<br/>(VAC)
                  </span>
                </button>

                <button
                  onClick={() => addComponentToGrid("current_source_dc")}
                  className="p-4 bg-teal-600/20 hover:bg-teal-600/40 border-2 border-teal-500 rounded-xl transition-all flex flex-col items-center gap-2"
                >
                  <div className="w-8 h-8 rounded-full border-2 border-teal-500 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 16 16">
                      <line x1="8" y1="2" x2="8" y2="14" stroke="#14b8a6" strokeWidth="2"/>
                      <polygon points="8,2 6,5 10,5" fill="#14b8a6"/>
                    </svg>
                  </div>
                  <span className="text-teal-300 font-bold text-xs text-center">
                    CORRIENTE DC<br/>(IDC)
                  </span>
                </button>

                <button
                  onClick={() => addComponentToGrid("current_source")}
                  className="p-4 bg-pink-600/20 hover:bg-pink-600/40 border-2 border-pink-500 rounded-xl transition-all flex flex-col items-center gap-2"
                >
                  <div className="w-8 h-8 rounded-full border-2 border-pink-500 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 16 16">
                      <line x1="8" y1="2" x2="8" y2="14" stroke="#ec4899" strokeWidth="2"/>
                      <polygon points="8,2 6,5 10,5" fill="#ec4899"/>
                    </svg>
                  </div>
                  <span className="text-pink-300 font-bold text-xs text-center">
                    CORRIENTE AC<br/>(IAC)
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-cyan-200 mb-2">
                    Frecuencia (Hz)
                  </label>
                  <input
                    type="number"
                    value={frequency}
                    onChange={(e) => setFrequency(parseFloat(e.target.value))}
                    className="w-full px-4 py-2 bg-slate-900 border-2 border-cyan-500 rounded-lg text-white"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setConnectingMode(!connectingMode);
                      setFirstNode(null);
                    }}
                    className={`w-full flex items-center justify-center gap-2 px-6 py-2 rounded-xl font-bold transition-all ${
                      connectingMode
                        ? "bg-cyan-600 hover:bg-cyan-500 ring-4 ring-cyan-300 animate-pulse"
                        : "bg-cyan-600/50 hover:bg-cyan-600"
                    }`}
                  >
                    <Link size={20} />
                    {connectingMode ? "✓ Modo Conexión" : "Conectar Nodos"}
                  </button>
                </div>
                <div className="flex items-end gap-2">
                  <button
                    onClick={solveCircuitByMesh}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl font-bold hover:from-green-500 hover:to-emerald-500 transition-all"
                  >
                    <Play size={20} />
                    Resolver
                  </button>
                  <button
                    onClick={() => {
                      setComponents([]);
                      setWires([]);
                      setCircuitResult(null);
                      setMeshEquations([]);
                      setFirstNode(null);
                      setConnectingMode(false);
                    }}
                    className="px-4 py-2 bg-red-600/20 border-2 border-red-500 rounded-xl font-bold hover:bg-red-600/40 transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Canvas del circuito */}
            <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/30 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-cyan-300">
                  Editor de Circuitos
                </h3>
                {connectingMode && (
                  <div className="bg-cyan-500 text-white px-4 py-2 rounded-lg font-bold animate-pulse">
                    {firstNode
                      ? "🎯 Haz clic en el segundo nodo"
                      : "🎯 Haz clic en el primer nodo"}
                  </div>
                )}
              </div>

              <div 
                className="relative"
                style={{ userSelect: 'none' }}
              >
                <svg
                  width="1000"
                  height="700"
                  className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border-2 border-cyan-500/30"
                  style={{ cursor: draggingId ? 'grabbing' : (connectingMode ? 'crosshair' : 'default') }}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                >
                  <defs>
                    <pattern
                      id="circuitGrid"
                      width={gridSize}
                      height={gridSize}
                      patternUnits="userSpaceOnUse"
                    >
                      <circle
                        cx={gridSize / 2}
                        cy={gridSize / 2}
                        r="1.5"
                        fill="#334155"
                      />
                      <path
                        d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
                        fill="none"
                        stroke="rgba(51,65,85,0.3)"
                        strokeWidth="0.5"
                      />
                    </pattern>
                  </defs>
                  <rect width="1000" height="700" fill="url(#circuitGrid)" />

                  {/* Dibujar cables */}
                  {wires.map((wire) => {
                    const fromComp = components.find((c) => c.id === wire.fromComp);
                    const toComp = components.find((c) => c.id === wire.toComp);

                    if (!fromComp || !toComp) return null;

                    const fromPos = getNodePosition(fromComp, wire.fromNode);
                    const toPos = getNodePosition(toComp, wire.toNode);

                    return (
                      <line
                        key={wire.id}
                        x1={fromPos.x}
                        y1={fromPos.y}
                        x2={toPos.x}
                        y2={toPos.y}
                        stroke="#3b82f6"
                        strokeWidth="3"
                      />
                    );
                  })}

                  {/* Dibujar componentes */}
                  {components.map((comp) => {
                    const node1Pos = getNodePosition(comp, 1);
                    const node2Pos = getNodePosition(comp, 2);

                    return (
                      <g key={comp.id}>
                        {/* Componente - DRAGGABLE */}
                        <g
                          transform={`translate(${comp.x}, ${comp.y}) rotate(${comp.rotation})`}
                          onMouseDown={(e) => handleComponentMouseDown(e, comp)}
                          style={{ 
                            cursor: connectingMode ? 'crosshair' : (draggingId === comp.id ? 'grabbing' : 'grab'),
                            pointerEvents: 'all'
                          }}
                        >
                          {comp.type === "resistor" && (
                            <>
                              <rect
                                x="-25"
                                y="-8"
                                width="50"
                                height="16"
                                fill="none"
                                stroke="#ef4444"
                                strokeWidth="3"
                              />
                              <line
                                x1="-35"
                                y1="0"
                                x2="-25"
                                y2="0"
                                stroke="#ef4444"
                                strokeWidth="2"
                              />
                              <line
                                x1="25"
                                y1="0"
                                x2="35"
                                y2="0"
                                stroke="#ef4444"
                                strokeWidth="2"
                              />
                              <text
                                y="30"
                                textAnchor="middle"
                                fill="#ef4444"
                                fontSize="12"
                                fontWeight="bold"
                                style={{ pointerEvents: 'none' }}
                              >
                                {comp.value}Ω
                              </text>
                            </>
                          )}
                          {comp.type === "capacitor" && (
                            <>
                              <line
                                x1="-35"
                                y1="0"
                                x2="-5"
                                y2="0"
                                stroke="#3b82f6"
                                strokeWidth="2"
                              />
                              <line
                                x1="-5"
                                y1="-15"
                                x2="-5"
                                y2="15"
                                stroke="#3b82f6"
                                strokeWidth="3"
                              />
                              <line
                                x1="5"
                                y1="-15"
                                x2="5"
                                y2="15"
                                stroke="#3b82f6"
                                strokeWidth="3"
                              />
                              <line
                                x1="5"
                                y1="0"
                                x2="35"
                                y2="0"
                                stroke="#3b82f6"
                                strokeWidth="2"
                              />
                              <text
                                y="30"
                                textAnchor="middle"
                                fill="#3b82f6"
                                fontSize="12"
                                fontWeight="bold"
                                style={{ pointerEvents: 'none' }}
                              >
                                {comp.value}j
                              </text>
                            </>
                          )}
                          {comp.type === "inductor" && (
                            <>
                              <line
                                x1="-35"
                                y1="0"
                                x2="-20"
                                y2="0"
                                stroke="#10b981"
                                strokeWidth="2"
                              />
                              {[0, 1, 2, 3].map((i) => (
                                <circle
                                  key={i}
                                  cx={-20 + i * 10}
                                  cy="-5"
                                  r="5"
                                  fill="none"
                                  stroke="#10b981"
                                  strokeWidth="2"
                                />
                              ))}
                              <line
                                x1="20"
                                y1="0"
                                x2="35"
                                y2="0"
                                stroke="#10b981"
                                strokeWidth="2"
                              />
                              <text
                                y="30"
                                textAnchor="middle"
                                fill="#10b981"
                                fontSize="12"
                                fontWeight="bold"
                                style={{ pointerEvents: 'none' }}
                              >
                                {comp.value}j
                              </text>
                            </>
                          )}
                          {(comp.type === "voltage_source" ||
                            comp.type === "ac_source") && (
                            <>
                              <circle
                                cx="0"
                                cy="0"
                                r="18"
                                fill="none"
                                stroke={
                                  comp.type === "voltage_source"
                                    ? "#a855f7"
                                    : "#f59e0b"
                                }
                                strokeWidth="3"
                              />
                              {comp.type === "voltage_source" ? (
                                <>
                                  {/* Símbolo DC estándar: líneas paralelas */}
                                  <line
                                    x1="-8"
                                    y1="-5"
                                    x2="-8"
                                    y2="5"
                                    stroke="#a855f7"
                                    strokeWidth="3"
                                  />
                                  <line
                                    x1="8"
                                    y1="-2"
                                    x2="8"
                                    y2="2"
                                    stroke="#a855f7"
                                    strokeWidth="3"
                                  />
                                  {/* Símbolo + */}
                                  <text
                                    x="-13"
                                    y="3"
                                    fill="#a855f7"
                                    fontSize="10"
                                    fontWeight="bold"
                                  >
                                    +
                                  </text>
                                  {/* Símbolo - */}
                                  <text
                                    x="10"
                                    y="3"
                                    fill="#a855f7"
                                    fontSize="10"
                                    fontWeight="bold"
                                  >
                                    −
                                  </text>
                                </>
                              ) : (
                                <>
                                  {/* Símbolo AC estándar: onda sinusoidal clara */}
                                  <path
                                    d="M -12 0 Q -9 -8 -6 0 T 0 0 Q 3 8 6 0 T 12 0"
                                    fill="none"
                                    stroke="#f59e0b"
                                    strokeWidth="2.5"
                                  />
                                  <text
                                    x="-4"
                                    y="-13"
                                    fill="#f59e0b"
                                    fontSize="9"
                                    fontWeight="bold"
                                  >
                                    AC
                                  </text>
                                </>
                              )}
                              <line
                                x1="-35"
                                y1="0"
                                x2="-18"
                                y2="0"
                                stroke={
                                  comp.type === "voltage_source"
                                    ? "#a855f7"
                                    : "#f59e0b"
                                }
                                strokeWidth="2"
                              />
                              <line
                                x1="18"
                                y1="0"
                                x2="35"
                                y2="0"
                                stroke={
                                  comp.type === "voltage_source"
                                    ? "#a855f7"
                                    : "#f59e0b"
                                }
                                strokeWidth="2"
                              />
                              <text
                                y="35"
                                textAnchor="middle"
                                fill={
                                  comp.type === "voltage_source"
                                    ? "#a855f7"
                                    : "#f59e0b"
                                }
                                fontSize="12"
                                fontWeight="bold"
                                style={{ pointerEvents: 'none' }}
                              >
                                {comp.type === "voltage_source" 
                                  ? `${comp.value}V DC`
                                  : `${comp.value}∠${comp.phase || 0}° V`
                                }
                              </text>
                            </>
                          )}
                          {(comp.type === "current_source" || comp.type === "current_source_dc") && (
                            <>
                              <circle
                                cx="0"
                                cy="0"
                                r="18"
                                fill="none"
                                stroke={comp.type === "current_source_dc" ? "#14b8a6" : "#ec4899"}
                                strokeWidth="3"
                              />
                              <defs>
                                <marker
                                  id={`arrow-${comp.id}`}
                                  markerWidth="10"
                                  markerHeight="10"
                                  refX="5"
                                  refY="3"
                                  orient="auto"
                                >
                                  <path d="M0,0 L0,6 L9,3 z" fill={comp.type === "current_source_dc" ? "#14b8a6" : "#ec4899"} />
                                </marker>
                              </defs>
                              <line
                                x1="0"
                                y1="-10"
                                x2="0"
                                y2="10"
                                stroke={comp.type === "current_source_dc" ? "#14b8a6" : "#ec4899"}
                                strokeWidth="2"
                                markerEnd={`url(#arrow-${comp.id})`}
                              />
                              {comp.type === "current_source_dc" && (
                                <text
                                  x="-4"
                                  y="-13"
                                  fill="#14b8a6"
                                  fontSize="9"
                                  fontWeight="bold"
                                >
                                  DC
                                </text>
                              )}
                              {comp.type === "current_source" && (
                                <text
                                  x="-4"
                                  y="-13"
                                  fill="#ec4899"
                                  fontSize="9"
                                  fontWeight="bold"
                                >
                                  AC
                                </text>
                              )}
                              <line
                                x1="-35"
                                y1="0"
                                x2="-18"
                                y2="0"
                                stroke={comp.type === "current_source_dc" ? "#14b8a6" : "#ec4899"}
                                strokeWidth="2"
                              />
                              <line
                                x1="18"
                                y1="0"
                                x2="35"
                                y2="0"
                                stroke={comp.type === "current_source_dc" ? "#14b8a6" : "#ec4899"}
                                strokeWidth="2"
                              />
                              <text
                                y="35"
                                textAnchor="middle"
                                fill={comp.type === "current_source_dc" ? "#14b8a6" : "#ec4899"}
                                fontSize="12"
                                fontWeight="bold"
                                style={{ pointerEvents: 'none' }}
                              >
                                {comp.type === "current_source_dc" 
                                  ? `${comp.value}A DC`
                                  : `${comp.value}∠${comp.phase || 0}° A`
                                }
                              </text>
                            </>
                          )}
                        </g>

                        {/* Nodos de conexión - CLICKABLES */}
                        <circle
                          cx={node1Pos.x}
                          cy={node1Pos.y}
                          r="7"
                          fill={
                            firstNode?.compId === comp.id && firstNode?.nodeNum === 1
                              ? "#22d3ee"
                              : "#0ea5e9"
                          }
                          stroke="#fff"
                          strokeWidth="2"
                          style={{ cursor: "pointer", pointerEvents: 'all' }}
                          onClick={(e) => handleNodeClick(e, comp, 1)}
                        />
                        <circle
                          cx={node2Pos.x}
                          cy={node2Pos.y}
                          r="7"
                          fill={
                            firstNode?.compId === comp.id && firstNode?.nodeNum === 2
                              ? "#22d3ee"
                              : "#0ea5e9"
                          }
                          stroke="#fff"
                          strokeWidth="2"
                          style={{ cursor: "pointer", pointerEvents: 'all' }}
                          onClick={(e) => handleNodeClick(e, comp, 2)}
                        />
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Lista de componentes - SIEMPRE VISIBLE */}
              <div className="mt-4 space-y-2 bg-cyan-900/20 p-4 rounded-xl border-2 border-cyan-500">
                <h4 className="font-bold text-cyan-300 text-xl">
                  ⚙️ Componentes en el circuito ({components.length}):
                </h4>
                {components.length === 0 ? (
                  <p className="text-cyan-200 text-center py-4">
                    👆 Agrega componentes usando los botones de arriba
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {components.map((comp) => (
                      <div
                        key={comp.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 hover:bg-slate-800/50 transition-all"
                      >
                        <span className="flex-1 text-sm">
                          {comp.type === "resistor" && "Resistencia:"}
                          {comp.type === "capacitor" && "Capacitor:"}
                          {comp.type === "inductor" && "Inductor:"}
                          {comp.type === "voltage_source" && "Fuente VDC:"}
                          {comp.type === "ac_source" && "Fuente VAC:"}
                          {comp.type === "current_source_dc" && "Fuente IDC:"}
                          {comp.type === "current_source" && "Fuente IAC:"}
                        </span>
                        <input
                          type="number"
                          value={comp.value}
                          onChange={(e) =>
                            updateComponentValue(comp.id, e.target.value)
                          }
                          className="w-20 px-2 py-1 bg-slate-800 border border-cyan-500 rounded text-sm"
                          step="0.1"
                          placeholder="Magnitud"
                        />
                        <span className="text-xs text-cyan-300 w-8">
                          {comp.type === "resistor" && "Ω"}
                          {comp.type === "capacitor" && "j"}
                          {comp.type === "inductor" && "j"}
                          {(comp.type === "voltage_source" ||
                            comp.type === "ac_source") &&
                            "V"}
                          {(comp.type === "current_source" ||
                            comp.type === "current_source_dc") &&
                            "A"}
                        </span>
                        {(comp.type === "ac_source" || comp.type === "current_source") && (
                          <>
                            <span className="text-xs text-amber-300">∠</span>
                            <input
                              type="number"
                              value={comp.phase || 0}
                              onChange={(e) =>
                                updateComponentPhase(comp.id, e.target.value)
                              }
                              className="w-16 px-2 py-1 bg-slate-800 border border-amber-500 rounded text-sm"
                              step="1"
                              placeholder="Fase"
                            />
                            <span className="text-xs text-amber-300">°</span>
                          </>
                        )}
                        <button
                          onClick={() => rotateComponent(comp.id)}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg hover:from-blue-500 hover:to-blue-400 text-2xl font-bold shadow-lg transform hover:scale-110 transition-all"
                          title="Rotar 90° - Click aquí para cambiar orientación"
                        >
                          {getOrientationText(comp.rotation)}
                        </button>
                        <button
                          onClick={() => removeComponent(comp.id)}
                          className="px-2 py-1 bg-red-600 rounded hover:bg-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Ecuaciones y Resultados - igual que antes */}
            {meshEquations.length > 0 && (
              <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/30 shadow-xl">
                <h3 className="text-2xl font-bold text-cyan-300 mb-4">
                  Ecuaciones de Malla
                </h3>
                {meshEquations.map((eq, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-900/50 rounded-lg mb-3"
                  >
                    <p className="text-cyan-200 font-mono text-sm mb-2">
                      Malla {eq.mesh}: {eq.equation}
                    </p>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <p className="text-green-300 font-mono text-sm">
                          Rectangular: {formatComplex(eq.current)} A
                        </p>
                      </div>
                      <div>
                        <p className="text-purple-300 font-mono text-sm">
                          Polar: {formatPolar(eq.current)} A
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {circuitResult && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-cyan-900/40 to-cyan-800/40 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/30 shadow-xl">
                    <h3 className="text-xl font-bold text-cyan-300 mb-3">
                      Impedancia Total
                    </h3>
                    <div className="space-y-2">
                      <p className="text-cyan-200 font-mono text-sm">
                        Rectangular:
                      </p>
                      <p className="text-cyan-100 font-mono font-bold">
                        {formatComplex(circuitResult.impedance)} Ω
                      </p>
                      <p className="text-cyan-200 font-mono text-sm">Polar:</p>
                      <p className="text-cyan-100 font-mono font-bold">
                        {formatPolar(circuitResult.impedance)} Ω
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/40 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/30 shadow-xl">
                    <h3 className="text-xl font-bold text-blue-300 mb-3">
                      Corriente
                    </h3>
                    <div className="space-y-2">
                      <p className="text-blue-200 font-mono text-sm">
                        Rectangular:
                      </p>
                      <p className="text-blue-100 font-mono font-bold">
                        {formatComplex(circuitResult.current)} A
                      </p>
                      <p className="text-blue-200 font-mono text-sm">Polar:</p>
                      <p className="text-blue-100 font-mono font-bold">
                        {formatPolar(circuitResult.current)} A
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30 shadow-xl">
                    <h3 className="text-xl font-bold text-purple-300 mb-3">
                      Ángulo de Fase
                    </h3>
                    <div className="p-4 bg-purple-950/50 rounded-lg">
                      <p className="text-purple-200 font-mono text-2xl font-bold text-center">
                        {circuitResult.phase.toFixed(2)}°
                      </p>
                      <p className="text-purple-300 text-sm text-center mt-2">
                        {circuitResult.phase > 0
                          ? "Inductivo"
                          : circuitResult.phase < 0
                          ? "Capacitivo"
                          : "Resistivo"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-900/40 to-green-800/40 backdrop-blur-sm rounded-2xl p-6 border border-green-500/30 shadow-xl">
                    <h3 className="text-xl font-bold text-green-300 mb-3">
                      Factor de Potencia
                    </h3>
                    <div className="p-4 bg-green-950/50 rounded-lg">
                      <p className="text-green-200 font-mono text-2xl font-bold text-center">
                        {circuitResult.powerFactor.toFixed(4)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Diagrama Fasorial */}
                <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/30 shadow-xl">
                  <h3 className="text-2xl font-bold text-cyan-300 mb-4 text-center">
                    Diagrama Fasorial
                  </h3>
                  <div className="flex justify-center">
                    <svg
                      width="600"
                      height="600"
                      className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl"
                    >
                      <defs>
                        <pattern
                          id="gridFasor"
                          width="40"
                          height="40"
                          patternUnits="userSpaceOnUse"
                        >
                          <path
                            d="M 40 0 L 0 0 0 40"
                            fill="none"
                            stroke="rgba(100,116,139,0.3)"
                            strokeWidth="0.5"
                          />
                        </pattern>
                        <marker
                          id="arrowVoltage"
                          markerWidth="10"
                          markerHeight="10"
                          refX="9"
                          refY="3"
                          orient="auto"
                        >
                          <path d="M0,0 L0,6 L9,3 z" fill="#ef4444" />
                        </marker>
                        <marker
                          id="arrowCurrent"
                          markerWidth="10"
                          markerHeight="10"
                          refX="9"
                          refY="3"
                          orient="auto"
                        >
                          <path d="M0,0 L0,6 L9,3 z" fill="#3b82f6" />
                        </marker>
                      </defs>

                      <rect width="600" height="600" fill="url(#gridFasor)" />

                      <line
                        x1="0"
                        y1="300"
                        x2="600"
                        y2="300"
                        stroke="rgba(148,163,184,0.5)"
                        strokeWidth="2"
                      />
                      <line
                        x1="300"
                        y1="0"
                        x2="300"
                        y2="600"
                        stroke="rgba(148,163,184,0.5)"
                        strokeWidth="2"
                      />

                      {[50, 100, 150, 200].map((r) => (
                        <circle
                          key={r}
                          cx="300"
                          cy="300"
                          r={r}
                          fill="none"
                          stroke="rgba(100,116,139,0.2)"
                          strokeWidth="1"
                          strokeDasharray="3,3"
                        />
                      ))}

                      <line
                        x1="300"
                        y1="300"
                        x2="500"
                        y2="300"
                        stroke="#ef4444"
                        strokeWidth="4"
                        markerEnd="url(#arrowVoltage)"
                      />
                      <text
                        x="510"
                        y="300"
                        fill="#ef4444"
                        fontSize="16"
                        fontWeight="bold"
                      >
                        V = {circuitResult.voltage}V∠0°
                      </text>

                      {(() => {
                        const angle =
                          (-circuitResult.currentPhase * Math.PI) / 180;
                        const length = 180;
                        const x2 = 300 + length * Math.cos(angle);
                        const y2 = 300 - length * Math.sin(angle);
                        return (
                          <>
                            <line
                              x1="300"
                              y1="300"
                              x2={x2}
                              y2={y2}
                              stroke="#3b82f6"
                              strokeWidth="4"
                              markerEnd="url(#arrowCurrent)"
                            />
                            <text
                              x={x2 + 15}
                              y={y2 + 5}
                              fill="#3b82f6"
                              fontSize="16"
                              fontWeight="bold"
                            >
                              I = {circuitResult.currentMag.toFixed(2)}A∠
                              {circuitResult.currentPhase.toFixed(1)}°
                            </text>

                            {circuitResult.currentPhase !== 0 && (
                              <>
                                <path
                                  d={`M ${300 + 60} 300 A 60 60 0 0 ${
                                    circuitResult.currentPhase < 0 ? 1 : 0
                                  } ${300 + 60 * Math.cos(angle)} ${
                                    300 - 60 * Math.sin(angle)
                                  }`}
                                  fill="none"
                                  stroke="#a855f7"
                                  strokeWidth="2"
                                  strokeDasharray="3,3"
                                />
                                <text
                                  x="370"
                                  y={
                                    circuitResult.currentPhase < 0
                                      ? "315"
                                      : "285"
                                  }
                                  fill="#a855f7"
                                  fontSize="14"
                                  fontWeight="bold"
                                >
                                  φ ={" "}
                                  {Math.abs(circuitResult.currentPhase).toFixed(
                                    1
                                  )}
                                  °
                                </text>
                              </>
                            )}
                          </>
                        );
                      })()}

                      <text
                        x="580"
                        y="310"
                        fill="#94a3b8"
                        fontSize="14"
                        fontWeight="bold"
                      >
                        Re
                      </text>
                      <text
                        x="310"
                        y="20"
                        fill="#94a3b8"
                        fontSize="14"
                        fontWeight="bold"
                      >
                        Im
                      </text>
                    </svg>
                  </div>
                  <div className="mt-6 flex justify-center gap-8 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-1 bg-red-500"></div>
                      <span className="text-red-300 font-bold">
                        Voltaje
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-1 bg-blue-500"></div>
                      <span className="text-blue-300 font-bold">Corriente</span>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-4">
                    <div className="bg-amber-900/30 p-4 rounded-xl border border-amber-500/30">
                      <p className="text-amber-300 text-sm mb-1">
                        Potencia Aparente
                      </p>
                      <p className="text-amber-100 font-mono font-bold text-xl">
                        {circuitResult.apparentPower.toFixed(2)} VA
                      </p>
                    </div>
                    <div className="bg-green-900/30 p-4 rounded-xl border border-green-500/30">
                      <p className="text-green-300 text-sm mb-1">
                        Potencia Activa
                      </p>
                      <p className="text-green-100 font-mono font-bold text-xl">
                        {circuitResult.activePower.toFixed(2)} W
                      </p>
                    </div>
                    <div className="bg-purple-900/30 p-4 rounded-xl border border-purple-500/30">
                      <p className="text-purple-300 text-sm mb-1">
                        Potencia Reactiva
                      </p>
                      <p className="text-purple-100 font-mono font-bold text-xl">
                        {circuitResult.reactivePower.toFixed(2)} VAR
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplexCalculator;