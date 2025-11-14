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
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [voltage, setVoltage] = useState(10);
  const [frequency, setFrequency] = useState(60);
  const [circuitResult, setCircuitResult] = useState(null);

  // Operaciones con números complejos
  const add = (a, b, c, d) => ({ real: a + c, imag: b + d });
  const subtract = (a, b, c, d) => ({ real: a - c, imag: b - d });
  const multiply = (a, b, c, d) => ({
    real: a * c - b * d,
    imag: a * d + b * c,
  });
  const divide = (a, b, c, d) => {
    const denom = c * c + d * d;
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
    return `${real} ${sign} ${imag}i`;
  };

  const formatPolar = (num) => {
    if (!num) return "";
    const polar = toPolar(num.real, num.imag);
    return `${polar.r.toFixed(2)} ∠ ${polar.theta.toFixed(2)}°`;
  };

  // Funciones para circuitos
  const addComponent = (type) => {
    const newComponent = {
      id: Date.now(),
      type,
      value: type === "resistor" ? 100 : type === "capacitor" ? 0.001 : 0.1,
      x: 150 + components.length * 80,
      y: 200,
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

  const removeComponent = (id) => {
    setComponents(components.filter((c) => c.id !== id));
  };

  const solveCircuit = () => {
    if (components.length === 0) return;

    const omega = 2 * Math.PI * frequency;
    let totalZ = { real: 0, imag: 0 };

    components.forEach((comp) => {
      let z = { real: 0, imag: 0 };

      switch (comp.type) {
        case "resistor":
          z = { real: comp.value, imag: 0 };
          break;
        case "capacitor":
          const Xc = -1 / (omega * comp.value);
          z = { real: 0, imag: Xc };
          break;
        case "inductor":
          const Xl = omega * comp.value;
          z = { real: 0, imag: Xl };
          break;
      }

      totalZ = add(totalZ.real, totalZ.imag, z.real, z.imag);
    });

    const magnitude = Math.sqrt(
      totalZ.real * totalZ.real + totalZ.imag * totalZ.imag
    );
    const current = divide(voltage, 0, totalZ.real, totalZ.imag);
    const currentMag = Math.sqrt(
      current.real * current.real + current.imag * current.imag
    );
    const phase = Math.atan2(totalZ.imag, totalZ.real) * (180 / Math.PI);
    const powerFactor = Math.cos((phase * Math.PI) / 180);

    setCircuitResult({
      impedance: totalZ,
      impedanceMag: magnitude,
      current,
      currentMag,
      phase,
      powerFactor,
    });
  };

  // Componente de gráfica para calculadora
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
          opacity="0.8"
          markerEnd="url(#arrowblue)"
        />
        <circle
          cx={z1Pos.x}
          cy={z1Pos.y}
          r="6"
          fill="#3b82f6"
          className="drop-shadow-lg"
        />
        <text
          x={z1Pos.x + 12}
          y={z1Pos.y - 8}
          fill="#3b82f6"
          fontSize="14"
          fontWeight="bold"
        >
          z₁
        </text>

        {operation !== "conjugate" && operation !== "power" && (
          <>
            <line
              x1={center.x}
              y1={center.y}
              x2={z2Pos.x}
              y2={z2Pos.y}
              stroke="#10b981"
              strokeWidth="3"
              opacity="0.8"
              markerEnd="url(#arrowgreen)"
            />
            <circle
              cx={z2Pos.x}
              cy={z2Pos.y}
              r="6"
              fill="#10b981"
              className="drop-shadow-lg"
            />
            <text
              x={z2Pos.x + 12}
              y={z2Pos.y - 8}
              fill="#10b981"
              fontSize="14"
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
              opacity="0.9"
              markerEnd="url(#arroworange)"
              strokeDasharray="5,5"
            />
            <circle
              cx={resPos.x}
              cy={resPos.y}
              r="8"
              fill="#f59e0b"
              className="drop-shadow-xl"
            />
            <text
              x={resPos.x + 12}
              y={resPos.y + 20}
              fill="#f59e0b"
              fontSize="16"
              fontWeight="bold"
            >
              Resultado
            </text>
          </>
        )}

        <defs>
          <marker
            id="arrowblue"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#3b82f6" />
          </marker>
          <marker
            id="arrowgreen"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#10b981" />
          </marker>
          <marker
            id="arroworange"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#f59e0b" />
          </marker>
        </defs>

        <circle
          cx={center.x}
          cy={center.y}
          r={scale}
          fill="none"
          stroke="rgba(139,92,246,0.3)"
          strokeWidth="2"
          strokeDasharray="4,4"
        />
      </svg>
    );
  };

  // Componente de circuito
  const CircuitCanvas = () => {
    return (
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-8 min-h-[500px] relative border-2 border-cyan-500/30">
        {/* Fuente de voltaje */}
        <div className="absolute left-8 top-1/2 transform -translate-y-1/2">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-red-500 bg-red-500/20 flex items-center justify-center">
              <span className="text-red-400 font-bold text-xl">~</span>
            </div>
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-red-400 font-semibold whitespace-nowrap">
              {voltage}V
            </div>
          </div>
        </div>

        {/* Cables */}
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{ width: "100%", height: "100%" }}
        >
          {/* Cable superior */}
          <line
            x1="90"
            y1="250"
            x2="700"
            y2="250"
            stroke="#fbbf24"
            strokeWidth="4"
          />
          {/* Cable inferior */}
          <line
            x1="90"
            y1="250"
            x2="700"
            y2="250"
            stroke="#fbbf24"
            strokeWidth="4"
            transform="translate(0, 100)"
          />
          {/* Cables verticales de componentes */}
          {components.map((comp, idx) => (
            <g key={comp.id}>
              <line
                x1={comp.x}
                y1="250"
                x2={comp.x}
                y2="290"
                stroke="#fbbf24"
                strokeWidth="3"
              />
              <line
                x1={comp.x}
                y1="310"
                x2={comp.x}
                y2="350"
                stroke="#fbbf24"
                strokeWidth="3"
              />
            </g>
          ))}
        </svg>

        {/* Componentes */}
        {components.map((comp, idx) => (
          <div
            key={comp.id}
            className="absolute"
            style={{ left: comp.x - 30, top: comp.y + 40 }}
          >
            <div className="relative group">
              {comp.type === "resistor" && (
                <div className="w-16 h-8 bg-yellow-600 border-2 border-yellow-400 rounded flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-700 via-yellow-500 to-yellow-700 opacity-50 rounded"></div>
                  <span className="text-yellow-100 font-bold text-xs z-10">
                    R
                  </span>
                </div>
              )}
              {comp.type === "capacitor" && (
                <div className="flex items-center gap-1">
                  <div className="w-1 h-12 bg-blue-500"></div>
                  <div className="w-1 h-12 bg-blue-500"></div>
                  <span className="absolute left-6 text-blue-400 font-bold text-xs">
                    C
                  </span>
                </div>
              )}
              {comp.type === "inductor" && (
                <div className="relative w-16 h-8">
                  <svg width="64" height="32" viewBox="0 0 64 32">
                    <path
                      d="M 0,16 Q 8,0 16,16 T 32,16 T 48,16 T 64,16"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3"
                    />
                  </svg>
                  <span className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-green-400 font-bold text-xs">
                    L
                  </span>
                </div>
              )}

              <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-slate-800 p-1 rounded shadow-lg flex gap-1 items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <input
                  type="number"
                  value={comp.value}
                  onChange={(e) =>
                    updateComponentValue(comp.id, e.target.value)
                  }
                  className="w-20 px-2 py-1 bg-slate-700 text-white text-xs rounded"
                  step="0.001"
                />
                <span className="text-xs text-gray-300">
                  {comp.type === "resistor"
                    ? "Ω"
                    : comp.type === "capacitor"
                    ? "F"
                    : "H"}
                </span>
                <button
                  onClick={() => removeComponent(comp.id)}
                  className="p-1 bg-red-500 hover:bg-red-600 rounded"
                >
                  <Trash2 className="w-3 h-3 text-white" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {components.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-500 text-lg">
              Agrega componentes para construir tu circuito
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Calculator className="w-12 h-12 text-purple-400" />
            <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Números Complejos & Circuitos AC
            </h1>
          </div>
          <p className="text-purple-300 text-lg">
            Calculadora y simulador de circuitos con análisis fasorial
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 justify-center">
          <button
            onClick={() => setActiveTab("calculator")}
            className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
              activeTab === "calculator"
                ? "bg-purple-500 text-white shadow-lg scale-105"
                : "bg-slate-800/50 text-purple-200 hover:bg-slate-700/50"
            }`}
          >
            <Calculator className="w-5 h-5" />
            Calculadora
          </button>
          <button
            onClick={() => setActiveTab("circuit")}
            className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
              activeTab === "circuit"
                ? "bg-cyan-500 text-white shadow-lg scale-105"
                : "bg-slate-800/50 text-cyan-200 hover:bg-slate-700/50"
            }`}
          >
            <Zap className="w-5 h-5" />
            Simulador de Circuitos
          </button>
        </div>

        {/* Contenido de Calculadora */}
        {activeTab === "calculator" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/40 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/30 shadow-xl">
                <h3 className="text-2xl font-bold text-blue-300 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
                    1
                  </span>
                  Número z₁
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-blue-200 mb-2 font-semibold">
                      Parte Real
                    </label>
                    <input
                      type="number"
                      value={z1Real}
                      onChange={(e) =>
                        setZ1Real(parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-4 py-3 bg-slate-800/50 border border-blue-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-blue-200 mb-2 font-semibold">
                      Parte Imaginaria
                    </label>
                    <input
                      type="number"
                      value={z1Imag}
                      onChange={(e) =>
                        setZ1Imag(parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-4 py-3 bg-slate-800/50 border border-blue-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      step="0.1"
                    />
                  </div>
                </div>
                <div className="mt-4 p-3 bg-blue-950/50 rounded-lg">
                  <p className="text-blue-200 font-mono text-lg">
                    z₁ = {formatComplex({ real: z1Real, imag: z1Imag })}
                  </p>
                </div>
              </div>

              {operation !== "conjugate" && operation !== "power" && (
                <div className="bg-gradient-to-br from-green-900/40 to-green-800/40 backdrop-blur-sm rounded-2xl p-6 border border-green-500/30 shadow-xl">
                  <h3 className="text-2xl font-bold text-green-300 mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white">
                      2
                    </span>
                    Número z₂
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-green-200 mb-2 font-semibold">
                        Parte Real
                      </label>
                      <input
                        type="number"
                        value={z2Real}
                        onChange={(e) =>
                          setZ2Real(parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-4 py-3 bg-slate-800/50 border border-green-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-green-200 mb-2 font-semibold">
                        Parte Imaginaria
                      </label>
                      <input
                        type="number"
                        value={z2Imag}
                        onChange={(e) =>
                          setZ2Imag(parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-4 py-3 bg-slate-800/50 border border-green-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                        step="0.1"
                      />
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-green-950/50 rounded-lg">
                    <p className="text-green-200 font-mono text-lg">
                      z₂ = {formatComplex({ real: z2Real, imag: z2Imag })}
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30 shadow-xl">
                <h3 className="text-2xl font-bold text-purple-300 mb-4">
                  Operación
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setOperation("add")}
                    className={`p-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                      operation === "add"
                        ? "bg-purple-500 text-white shadow-lg scale-105"
                        : "bg-slate-800/50 text-purple-200 hover:bg-slate-700/50"
                    }`}
                  >
                    <Plus className="w-5 h-5" /> Suma
                  </button>
                  <button
                    onClick={() => setOperation("subtract")}
                    className={`p-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                      operation === "subtract"
                        ? "bg-purple-500 text-white shadow-lg scale-105"
                        : "bg-slate-800/50 text-purple-200 hover:bg-slate-700/50"
                    }`}
                  >
                    <Minus className="w-5 h-5" /> Resta
                  </button>
                  <button
                    onClick={() => setOperation("multiply")}
                    className={`p-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                      operation === "multiply"
                        ? "bg-purple-500 text-white shadow-lg scale-105"
                        : "bg-slate-800/50 text-purple-200 hover:bg-slate-700/50"
                    }`}
                  >
                    <X className="w-5 h-5" /> Multiplicación
                  </button>
                  <button
                    onClick={() => setOperation("divide")}
                    className={`p-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                      operation === "divide"
                        ? "bg-purple-500 text-white shadow-lg scale-105"
                        : "bg-slate-800/50 text-purple-200 hover:bg-slate-700/50"
                    }`}
                  >
                    <Divide className="w-5 h-5" /> División
                  </button>
                  <button
                    onClick={() => setOperation("conjugate")}
                    className={`p-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                      operation === "conjugate"
                        ? "bg-purple-500 text-white shadow-lg scale-105"
                        : "bg-slate-800/50 text-purple-200 hover:bg-slate-700/50"
                    }`}
                  >
                    <RotateCcw className="w-5 h-5" /> Conjugado
                  </button>
                  <button
                    onClick={() => setOperation("power")}
                    className={`p-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                      operation === "power"
                        ? "bg-purple-500 text-white shadow-lg scale-105"
                        : "bg-slate-800/50 text-purple-200 hover:bg-slate-700/50"
                    }`}
                  >
                    <Power className="w-5 h-5" /> Potencia²
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-900/40 to-orange-800/40 backdrop-blur-sm rounded-2xl p-6 border border-orange-500/30 shadow-xl">
                <h3 className="text-2xl font-bold text-orange-300 mb-4">
                  Resultado
                </h3>
                <div className="space-y-3">
                  <div className="p-4 bg-orange-950/50 rounded-lg">
                    <p className="text-orange-200 font-mono text-xl font-bold">
                      {result ? formatComplex(result) : "---"}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPolar(!showPolar)}
                    className="w-full p-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-all"
                  >
                    {showPolar ? "Forma Rectangular" : "Forma Polar"}
                  </button>
                  {showPolar && result && (
                    <div className="p-4 bg-orange-950/50 rounded-lg">
                      <p className="text-orange-200 font-mono text-lg">
                        {formatPolar(result)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl p-4 border border-purple-500/30 shadow-2xl">
                <h3 className="text-2xl font-bold text-purple-300 mb-4 text-center">
                  Plano Complejo
                </h3>
                <ComplexPlane />
                <div className="mt-4 flex justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                    <span className="text-blue-300">z₁</span>
                  </div>
                  {operation !== "conjugate" && operation !== "power" && (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      <span className="text-green-300">z₂</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                    <span className="text-orange-300">Resultado</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contenido de Circuitos */}
        {activeTab === "circuit" && (
          <div className="space-y-6">
            {/* Controles de configuración */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-red-900/40 to-red-800/40 backdrop-blur-sm rounded-2xl p-6 border border-red-500/30 shadow-xl">
                <h3 className="text-xl font-bold text-red-300 mb-3">
                  Fuente de Voltaje
                </h3>
                <label className="block text-red-200 mb-2">Voltaje (V)</label>
                <input
                  type="number"
                  value={voltage}
                  onChange={(e) => setVoltage(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-red-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  step="1"
                />
              </div>

              <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30 shadow-xl">
                <h3 className="text-xl font-bold text-purple-300 mb-3">
                  Frecuencia
                </h3>
                <label className="block text-purple-200 mb-2">
                  Frecuencia (Hz)
                </label>
                <input
                  type="number"
                  value={frequency}
                  onChange={(e) =>
                    setFrequency(parseFloat(e.target.value) || 0)
                  }
                  className="w-full px-4 py-2 bg-slate-800/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  step="1"
                />
              </div>

              <div className="bg-gradient-to-br from-cyan-900/40 to-cyan-800/40 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/30 shadow-xl">
                <h3 className="text-xl font-bold text-cyan-300 mb-3">
                  Agregar Componentes
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => addComponent("resistor")}
                    className="flex-1 p-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition-all text-sm"
                  >
                    Resistor
                  </button>
                  <button
                    onClick={() => addComponent("capacitor")}
                    className="flex-1 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all text-sm"
                  >
                    Capacitor
                  </button>
                  <button
                    onClick={() => addComponent("inductor")}
                    className="flex-1 p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all text-sm"
                  >
                    Inductor
                  </button>
                </div>
              </div>
            </div>

            {/* Canvas del circuito */}
            <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl p-4 border border-cyan-500/30 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-cyan-300">
                  Circuito en Serie
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={solveCircuit}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
                  >
                    <Play className="w-5 h-5" />
                    Analizar
                  </button>
                  <button
                    onClick={() => {
                      setComponents([]);
                      setCircuitResult(null);
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
                  >
                    <Trash2 className="w-5 h-5" />
                    Limpiar
                  </button>
                </div>
              </div>
              <CircuitCanvas />
            </div>

            {/* Resultados del análisis */}
            {circuitResult && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-orange-900/40 to-orange-800/40 backdrop-blur-sm rounded-2xl p-6 border border-orange-500/30 shadow-xl">
                  <h3 className="text-2xl font-bold text-orange-300 mb-4">
                    Impedancia Total (Z)
                  </h3>
                  <div className="space-y-3">
                    <div className="p-4 bg-orange-950/50 rounded-lg">
                      <p className="text-sm text-orange-200 mb-1">
                        Forma Rectangular:
                      </p>
                      <p className="text-orange-200 font-mono text-xl font-bold">
                        {formatComplex(circuitResult.impedance)} Ω
                      </p>
                    </div>
                    <div className="p-4 bg-orange-950/50 rounded-lg">
                      <p className="text-sm text-orange-200 mb-1">
                        Forma Polar:
                      </p>
                      <p className="text-orange-200 font-mono text-xl font-bold">
                        {formatPolar(circuitResult.impedance)} Ω
                      </p>
                    </div>
                    <div className="p-4 bg-orange-950/50 rounded-lg">
                      <p className="text-sm text-orange-200 mb-1">Magnitud:</p>
                      <p className="text-orange-200 font-mono text-xl font-bold">
                        {circuitResult.impedanceMag.toFixed(2)} Ω
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/40 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/30 shadow-xl">
                  <h3 className="text-2xl font-bold text-blue-300 mb-4">
                    Corriente (I)
                  </h3>
                  <div className="space-y-3">
                    <div className="p-4 bg-blue-950/50 rounded-lg">
                      <p className="text-sm text-blue-200 mb-1">
                        Forma Rectangular:
                      </p>
                      <p className="text-blue-200 font-mono text-xl font-bold">
                        {formatComplex(circuitResult.current)} A
                      </p>
                    </div>
                    <div className="p-4 bg-blue-950/50 rounded-lg">
                      <p className="text-sm text-blue-200 mb-1">Forma Polar:</p>
                      <p className="text-blue-200 font-mono text-xl font-bold">
                        {formatPolar(circuitResult.current)} A
                      </p>
                    </div>
                    <div className="p-4 bg-blue-950/50 rounded-lg">
                      <p className="text-sm text-blue-200 mb-1">Magnitud:</p>
                      <p className="text-blue-200 font-mono text-xl font-bold">
                        {circuitResult.currentMag.toFixed(4)} A
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30 shadow-xl">
                  <h3 className="text-2xl font-bold text-purple-300 mb-4">
                    Ángulo de Fase
                  </h3>
                  <div className="p-4 bg-purple-950/50 rounded-lg">
                    <p className="text-purple-200 font-mono text-3xl font-bold text-center">
                      {circuitResult.phase.toFixed(2)}°
                    </p>
                    <p className="text-purple-300 text-sm text-center mt-2">
                      {circuitResult.phase > 0
                        ? "Inductivo (corriente retrasada)"
                        : circuitResult.phase < 0
                        ? "Capacitivo (corriente adelantada)"
                        : "Resistivo puro"}
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-900/40 to-green-800/40 backdrop-blur-sm rounded-2xl p-6 border border-green-500/30 shadow-xl">
                  <h3 className="text-2xl font-bold text-green-300 mb-4">
                    Factor de Potencia
                  </h3>
                  <div className="p-4 bg-green-950/50 rounded-lg">
                    <p className="text-green-200 font-mono text-3xl font-bold text-center">
                      {circuitResult.powerFactor.toFixed(4)}
                    </p>
                    <p className="text-green-300 text-sm text-center mt-2">
                      cos(φ) ={" "}
                      {circuitResult.powerFactor > 0.95
                        ? "Excelente"
                        : circuitResult.powerFactor > 0.85
                        ? "Bueno"
                        : circuitResult.powerFactor > 0.7
                        ? "Aceptable"
                        : "Necesita corrección"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Diagrama fasorial */}
            {circuitResult && (
              <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl p-4 border border-cyan-500/30 shadow-2xl">
                <h3 className="text-2xl font-bold text-cyan-300 mb-4 text-center">
                  Diagrama Fasorial
                </h3>
                <div className="flex justify-center">
                  <svg
                    width="500"
                    height="500"
                    className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl"
                  >
                    <defs>
                      <pattern
                        id="gridCircuit"
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

                    <rect width="500" height="500" fill="url(#gridCircuit)" />

                    {/* Ejes */}
                    <line
                      x1="0"
                      y1="250"
                      x2="500"
                      y2="250"
                      stroke="rgba(148,163,184,0.5)"
                      strokeWidth="2"
                    />
                    <line
                      x1="250"
                      y1="0"
                      x2="250"
                      y2="500"
                      stroke="rgba(148,163,184,0.5)"
                      strokeWidth="2"
                    />

                    {/* Fasor de voltaje (referencia horizontal) */}
                    <line
                      x1="250"
                      y1="250"
                      x2="450"
                      y2="250"
                      stroke="#ef4444"
                      strokeWidth="4"
                      markerEnd="url(#arrowVoltage)"
                    />
                    <text
                      x="460"
                      y="250"
                      fill="#ef4444"
                      fontSize="16"
                      fontWeight="bold"
                    >
                      V
                    </text>

                    {/* Fasor de corriente */}
                    {(() => {
                      const angle = (-circuitResult.phase * Math.PI) / 180;
                      const length = 150;
                      const x2 = 250 + length * Math.cos(angle);
                      const y2 = 250 - length * Math.sin(angle);
                      return (
                        <>
                          <line
                            x1="250"
                            y1="250"
                            x2={x2}
                            y2={y2}
                            stroke="#3b82f6"
                            strokeWidth="4"
                            markerEnd="url(#arrowCurrent)"
                          />
                          <text
                            x={x2 + 10}
                            y={y2}
                            fill="#3b82f6"
                            fontSize="16"
                            fontWeight="bold"
                          >
                            I
                          </text>

                          {/* Arco del ángulo */}
                          {circuitResult.phase !== 0 && (
                            <>
                              <path
                                d={`M ${250 + 50} 250 A 50 50 0 0 ${
                                  circuitResult.phase > 0 ? 1 : 0
                                } ${250 + 50 * Math.cos(angle)} ${
                                  250 - 50 * Math.sin(angle)
                                }`}
                                fill="none"
                                stroke="#a855f7"
                                strokeWidth="2"
                                strokeDasharray="3,3"
                              />
                              <text
                                x="310"
                                y={circuitResult.phase > 0 ? "235" : "265"}
                                fill="#a855f7"
                                fontSize="14"
                              >
                                {Math.abs(circuitResult.phase).toFixed(1)}°
                              </text>
                            </>
                          )}
                        </>
                      );
                    })()}

                    <circle
                      cx="250"
                      cy="250"
                      r="40"
                      fill="none"
                      stroke="rgba(139,92,246,0.3)"
                      strokeWidth="2"
                    />

                    <text
                      x="480"
                      y="260"
                      fill="#94a3b8"
                      fontSize="14"
                      fontWeight="bold"
                    >
                      Re
                    </text>
                    <text
                      x="260"
                      y="20"
                      fill="#94a3b8"
                      fontSize="14"
                      fontWeight="bold"
                    >
                      Im
                    </text>
                  </svg>
                </div>
                <div className="mt-4 flex justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-1 bg-red-500"></div>
                    <span className="text-red-300">Voltaje (referencia)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-1 bg-blue-500"></div>
                    <span className="text-blue-300">Corriente</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplexCalculator;
