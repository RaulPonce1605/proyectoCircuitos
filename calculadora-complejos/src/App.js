import React, { useState, useEffect } from "react";
import {
  Calculator,
  Plus,
  Minus,
  X,
  Divide,
  RotateCcw,
  Power,
} from "lucide-react";

const ComplexCalculator = () => {
  const [z1Real, setZ1Real] = useState(3);
  const [z1Imag, setZ1Imag] = useState(4);
  const [z2Real, setZ2Real] = useState(2);
  const [z2Imag, setZ2Imag] = useState(-1);
  const [operation, setOperation] = useState("add");
  const [result, setResult] = useState(null);
  const [showPolar, setShowPolar] = useState(false);

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

  // Componente de gráfica
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
        {/* Grid */}
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

        {/* Ejes */}
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

        {/* Etiquetas de ejes */}
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

        {/* Vector z1 */}
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

        {/* Vector z2 */}
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

        {/* Vector resultado */}
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

        {/* Definiciones de flechas */}
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

        {/* Círculo unitario */}
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Calculator className="w-12 h-12 text-purple-400" />
            <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Calculadora de Números Complejos
            </h1>
          </div>
          <p className="text-purple-300 text-lg">
            Visualiza y opera con números complejos en el plano de Argand
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Panel de control */}
          <div className="space-y-6">
            {/* Número z1 */}
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
                    onChange={(e) => setZ1Real(parseFloat(e.target.value) || 0)}
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
                    onChange={(e) => setZ1Imag(parseFloat(e.target.value) || 0)}
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

            {/* Número z2 */}
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

            {/* Operaciones */}
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

            {/* Resultado */}
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

          {/* Gráfica */}
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
      </div>
    </div>
  );
};

export default ComplexCalculator;
