import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";

// ─── Types ───────────────────────────────────────────────────────────────────

type Phase = "prep" | "wave" | "gameover" | "victory";

interface Base {
  id: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  label: string;
}

interface PVO {
  id: string;
  x: number;
  y: number;
  range: number;
  ammo: number;
  maxAmmo: number;
  cooldown: number;
  label: string;
  active: boolean;
}

interface Enemy {
  id: string;
  x: number;
  y: number;
  tx: number;
  ty: number;
  hp: number;
  maxHp: number;
  speed: number;
  destroyed: boolean;
  reached: boolean;
}

interface Explosion {
  id: string;
  x: number;
  y: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MAP_W = 900;
const MAP_H = 560;
const TICK_MS = 80;
const PREP_TIME = 15;

const INITIAL_BASES: Base[] = [
  { id: "b1", x: 420, y: 280, hp: 100, maxHp: 100, label: "Штаб" },
  { id: "b2", x: 260, y: 340, hp: 80, maxHp: 80, label: "Арсенал" },
  { id: "b3", x: 580, y: 220, hp: 80, maxHp: 80, label: "Радар" },
];

const INITIAL_PVOS: PVO[] = [
  { id: "p1", x: 320, y: 250, range: 130, ammo: 12, maxAmmo: 12, cooldown: 0, label: "ПВО-1", active: true },
  { id: "p2", x: 500, y: 310, range: 130, ammo: 12, maxAmmo: 12, cooldown: 0, label: "ПВО-2", active: true },
  { id: "p3", x: 380, y: 180, range: 110, ammo: 8, maxAmmo: 8, cooldown: 0, label: "ПВО-3", active: true },
];

const SPAWN_POINTS = [
  { x: 30, y: 60 }, { x: 860, y: 80 }, { x: 40, y: 480 },
  { x: 840, y: 460 }, { x: 30, y: 250 }, { x: 870, y: 260 },
];

function getWaveConfig(wave: number) {
  const count = 3 + wave * 2;
  const speed = 0.5 + wave * 0.15;
  const hp = 2 + wave;
  return { count, speed, hp };
}

function dist(ax: number, ay: number, bx: number, by: number) {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

let eid = 0;
let xid = 0;

// ─── SVG helpers ─────────────────────────────────────────────────────────────

function IsoTile({ x, y, w = 40, h = 20, fill, stroke, opacity = 1 }: {
  x: number; y: number; w?: number; h?: number;
  fill: string; stroke?: string; opacity?: number;
}) {
  const pts = [
    `${x},${y - h / 2}`,
    `${x + w / 2},${y}`,
    `${x},${y + h / 2}`,
    `${x - w / 2},${y}`,
  ].join(" ");
  return <polygon points={pts} fill={fill} stroke={stroke || fill} strokeWidth={0.5} opacity={opacity} />;
}

function StatBox({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="flex flex-col items-end">
      <span className="terminal-text text-[9px] text-muted-foreground uppercase tracking-widest">{label}</span>
      <span className={`terminal-text text-base font-semibold leading-tight ${color}`}>{value}</span>
    </div>
  );
}

function IsometricMap() {
  return (
    <>
      {Array.from({ length: 12 }, (_, row) =>
        Array.from({ length: 20 }, (_, col) => (
          <circle key={`d${row}-${col}`}
            cx={50 + col * 44} cy={40 + row * 46}
            r={1} fill="hsl(120 30% 25%)" opacity={0.4} />
        ))
      )}
      <IsoTile x={150} y={150} w={80} h={40} fill="hsl(220 18% 13%)" stroke="hsl(120 20% 20%)" opacity={0.6} />
      <IsoTile x={700} y={130} w={80} h={40} fill="hsl(220 18% 13%)" stroke="hsl(120 20% 20%)" opacity={0.6} />
      <IsoTile x={420} y={100} w={100} h={50} fill="hsl(220 18% 14%)" stroke="hsl(120 20% 22%)" opacity={0.6} />
      <IsoTile x={200} y={400} w={90} h={45} fill="hsl(220 18% 13%)" stroke="hsl(120 20% 20%)" opacity={0.6} />
      <IsoTile x={650} y={380} w={80} h={40} fill="hsl(220 18% 13%)" stroke="hsl(120 20% 20%)" opacity={0.6} />
      <IsoTile x={420} y={460} w={110} h={55} fill="hsl(220 18% 14%)" stroke="hsl(120 20% 22%)" opacity={0.6} />
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Index() {
  const [phase, setPhase] = useState<Phase>("prep");
  const [wave, setWave] = useState(1);
  const [prepTimer, setPrepTimer] = useState(PREP_TIME);
  const [bases, setBases] = useState<Base[]>(INITIAL_BASES);
  const [pvos, setPvos] = useState<PVO[]>(INITIAL_PVOS);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const [score, setScore] = useState(0);
  const [log, setLog] = useState<string[]>(["Система запущена", "Ожидание волны 1"]);

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prepRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveRef = useRef(wave);
  waveRef.current = wave;

  const addLog = useCallback((msg: string) => {
    setLog(prev => [
      `[${new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}] ${msg}`,
      ...prev.slice(0, 9)
    ]);
  }, []);

  const spawnEnemies = useCallback((waveNum: number) => {
    const cfg = getWaveConfig(waveNum);
    const spawned: Enemy[] = Array.from({ length: cfg.count }, (_, i) => {
      const sp = SPAWN_POINTS[i % SPAWN_POINTS.length];
      const target = INITIAL_BASES[i % INITIAL_BASES.length];
      return {
        id: `e${++eid}`,
        x: sp.x + (Math.random() - 0.5) * 30,
        y: sp.y + (Math.random() - 0.5) * 30,
        tx: target.x,
        ty: target.y,
        hp: cfg.hp,
        maxHp: cfg.hp,
        speed: cfg.speed + Math.random() * 0.2,
        destroyed: false,
        reached: false,
      };
    });
    setEnemies(spawned);
  }, []);

  // Prep countdown
  useEffect(() => {
    if (phase !== "prep") return;
    setPrepTimer(PREP_TIME);
    prepRef.current = setInterval(() => {
      setPrepTimer(t => {
        if (t <= 1) {
          clearInterval(prepRef.current!);
          setPhase("wave");
          spawnEnemies(waveRef.current);
          addLog(`Волна ${waveRef.current} началась!`);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(prepRef.current!);
  }, [phase, spawnEnemies, addLog]);

  // Game tick
  useEffect(() => {
    if (phase !== "wave") return;
    tickRef.current = setInterval(() => {
      // Move enemies
      setEnemies(prev =>
        prev.map(e => {
          if (e.destroyed || e.reached) return e;
          const d = dist(e.x, e.y, e.tx, e.ty);
          if (d < 12) return { ...e, reached: true };
          return { ...e, x: e.x + (e.tx - e.x) / d * e.speed, y: e.y + (e.ty - e.y) / d * e.speed };
        })
      );

      // PVO shooting
      setPvos(pvoPrev => {
        const updatedPvos = pvoPrev.map(p => ({ ...p }));
        setEnemies(enPrev => {
          const updatedEn = enPrev.map(e => ({ ...e }));
          const newExplosions: Explosion[] = [];

          updatedPvos.forEach(pvo => {
            if (pvo.cooldown > 0) { pvo.cooldown--; return; }
            if (!pvo.active || pvo.ammo <= 0) return;
            for (const en of updatedEn) {
              if (en.destroyed || en.reached) continue;
              if (dist(pvo.x, pvo.y, en.x, en.y) <= pvo.range) {
                en.hp--;
                pvo.ammo--;
                pvo.cooldown = 8;
                if (en.hp <= 0) {
                  en.destroyed = true;
                  newExplosions.push({ id: `x${++xid}`, x: en.x, y: en.y });
                  setScore(s => s + 10);
                  addLog("Цель уничтожена");
                }
                break;
              }
            }
          });

          if (newExplosions.length > 0) {
            setExplosions(prev => [...prev, ...newExplosions]);
            setTimeout(() => {
              setExplosions(prev => prev.filter(x => !newExplosions.find(n => n.id === x.id)));
            }, 600);
          }

          return updatedEn;
        });
        return updatedPvos;
      });

      // Base damage
      setEnemies(en => {
        const reached = en.filter(e => e.reached && !e.destroyed);
        if (reached.length > 0) {
          setBases(bs => bs.map(b => {
            const hit = reached.filter(e => dist(e.tx, e.ty, b.x, b.y) < 15);
            if (hit.length > 0) {
              addLog(`${b.label} получила урон!`);
              return { ...b, hp: Math.max(0, b.hp - hit.length * 8) };
            }
            return b;
          }));
        }
        return en.map(e => e.reached ? { ...e, destroyed: true } : e);
      });
    }, TICK_MS);

    return () => clearInterval(tickRef.current!);
  }, [phase, addLog]);

  // Check wave end
  useEffect(() => {
    if (phase !== "wave" || enemies.length === 0) return;
    if (!enemies.every(e => e.destroyed || e.reached)) return;

    if (!bases.some(b => b.hp > 0)) {
      setPhase("gameover");
      addLog("КРИТИЧЕСКИЙ УРОН — ОБОРОНА ПРОРВАНА");
      return;
    }

    const nextWave = waveRef.current + 1;
    if (nextWave > 5) {
      setPhase("victory");
      addLog("Все волны отражены! Победа!");
      return;
    }

    setTimeout(() => {
      setWave(nextWave);
      addLog(`Волна ${nextWave - 1} отражена. Подготовка к волне ${nextWave}`);
      setPvos(p => p.map(pv => ({ ...pv, ammo: pv.maxAmmo })));
      setPhase("prep");
    }, 1200);
  }, [enemies, phase, bases, addLog]);

  const handleRestart = () => {
    setBases(INITIAL_BASES.map(b => ({ ...b, hp: b.maxHp })));
    setPvos(INITIAL_PVOS.map(p => ({ ...p, ammo: p.maxAmmo, cooldown: 0 })));
    setEnemies([]);
    setExplosions([]);
    setWave(1);
    setScore(0);
    setLog(["Система перезапущена", "Ожидание волны 1"]);
    setPhase("prep");
  };

  const totalHp = bases.reduce((a, b) => a + b.hp, 0);
  const totalMaxHp = bases.reduce((a, b) => a + b.maxHp, 0);
  const defPercent = Math.round((totalHp / totalMaxHp) * 100);
  const activeEnemies = enemies.filter(e => !e.destroyed && !e.reached).length;

  return (
    <div className="w-screen h-screen bg-background flex flex-col overflow-hidden scanlines">
      {/* Top HUD */}
      <header className="flex items-center justify-between px-5 py-2.5 border-b border-border bg-card/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-4">
          <span className="terminal-text text-xs text-primary font-semibold tracking-widest uppercase">РУБЕЖ v1.0</span>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${phase === "wave" ? "bg-destructive animate-wave-alert" : phase === "victory" ? "bg-primary" : phase === "gameover" ? "bg-destructive" : "bg-accent"}`} />
            <span className="terminal-text text-xs text-muted-foreground">
              {phase === "prep" && `ПОДГОТОВКА — ВОЛНА ${wave}/5`}
              {phase === "wave" && `ВОЛНА ${wave}/5 — ОТРАЖЕНИЕ АТАКИ`}
              {phase === "gameover" && "ОБОРОНА ПРОРВАНА"}
              {phase === "victory" && "МИССИЯ ВЫПОЛНЕНА"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <StatBox label="ОЧКИ" value={score} color="text-accent" />
          <StatBox label="ОБОРОНА" value={`${defPercent}%`}
            color={defPercent > 60 ? "text-primary" : defPercent > 30 ? "text-accent" : "text-destructive"} />
          <StatBox label="УГРОЗЫ" value={activeEnemies} color="text-destructive" />
          {phase === "prep" && (
            <div className="flex items-center gap-2 px-3 py-1 border border-accent/40 rounded-sm bg-accent/10">
              <Icon name="Clock" size={12} className="text-accent" />
              <span className="terminal-text text-sm font-semibold text-accent" key={prepTimer}>{prepTimer}с</span>
            </div>
          )}
        </div>
      </header>

      {/* Main */}
      <div className="flex flex-1 min-h-0">
        {/* Map */}
        <div className="flex-1 relative map-bg overflow-hidden">
          <svg width="100%" height="100%" viewBox={`0 0 ${MAP_W} ${MAP_H}`} preserveAspectRatio="xMidYMid meet">
            <defs>
              <radialGradient id="baseGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="hsl(120 60% 45%)" stopOpacity="0.35" />
                <stop offset="100%" stopColor="hsl(120 60% 45%)" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="pvoGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="hsl(200 80% 55%)" stopOpacity="0.25" />
                <stop offset="100%" stopColor="hsl(200 80% 55%)" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="enemyGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="hsl(0 75% 55%)" stopOpacity="0.5" />
                <stop offset="100%" stopColor="hsl(0 75% 55%)" stopOpacity="0" />
              </radialGradient>
            </defs>

            <IsometricMap />

            {/* PVO range rings */}
            {pvos.map(pvo => pvo.active && (
              <circle key={`r${pvo.id}`} cx={pvo.x} cy={pvo.y} r={pvo.range}
                fill="none" stroke="hsl(200 80% 55%)" strokeWidth={0.8}
                strokeDasharray="4 6" opacity={0.3} />
            ))}

            {/* Base glow */}
            {bases.map(b => b.hp > 0 && (
              <circle key={`bg${b.id}`} cx={b.x} cy={b.y} r={50} fill="url(#baseGlow)" />
            ))}

            {/* Enemy trail lines */}
            {enemies.filter(e => !e.destroyed && !e.reached).map(e => (
              <line key={`l${e.id}`} x1={e.x} y1={e.y} x2={e.tx} y2={e.ty}
                stroke="hsl(0 75% 55%)" strokeWidth={0.4} strokeDasharray="3 8" opacity={0.2} />
            ))}

            {/* Bases */}
            {bases.map(b => (
              <g key={b.id}>
                {b.hp > 0 ? (
                  <>
                    <IsoTile x={b.x} y={b.y} w={52} h={26} fill="hsl(220 18% 16%)" stroke="hsl(120 60% 35%)" />
                    <IsoTile x={b.x} y={b.y - 10} w={36} h={18} fill="hsl(220 18% 22%)" stroke="hsl(120 60% 45%)" />
                    <text x={b.x} y={b.y + 30} textAnchor="middle" fontSize="9"
                      fill="hsl(120 20% 70%)" style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.05em" }}>
                      {b.label}
                    </text>
                    <rect x={b.x - 20} y={b.y + 34} width={40} height={3} fill="hsl(220 15% 18%)" rx={1} />
                    <rect x={b.x - 20} y={b.y + 34} width={40 * (b.hp / b.maxHp)} height={3}
                      fill={b.hp / b.maxHp > 0.5 ? "hsl(120 60% 45%)" : b.hp / b.maxHp > 0.25 ? "hsl(45 90% 55%)" : "hsl(0 75% 55%)"}
                      rx={1} />
                  </>
                ) : (
                  <>
                    <IsoTile x={b.x} y={b.y} w={52} h={26} fill="hsl(0 20% 12%)" stroke="hsl(0 50% 25%)" opacity={0.6} />
                    <text x={b.x} y={b.y + 6} textAnchor="middle" fontSize="14">💀</text>
                    <text x={b.x} y={b.y + 30} textAnchor="middle" fontSize="8"
                      fill="hsl(0 50% 50%)" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                      УНИЧТОЖЕНА
                    </text>
                  </>
                )}
              </g>
            ))}

            {/* PVO */}
            {pvos.map(pvo => (
              <g key={pvo.id} onClick={() => setPvos(p => p.map(pv => pv.id === pvo.id ? { ...pv, active: !pv.active } : pv))}
                style={{ cursor: "pointer" }}>
                <circle cx={pvo.x} cy={pvo.y} r={20} fill="url(#pvoGlow)" />
                <IsoTile x={pvo.x} y={pvo.y} w={28} h={14}
                  fill={pvo.active ? "hsl(220 18% 18%)" : "hsl(220 15% 12%)"}
                  stroke={pvo.active ? "hsl(200 80% 55%)" : "hsl(220 10% 30%)"} />
                <circle cx={pvo.x} cy={pvo.y - 6} r={5} fill="none"
                  stroke={pvo.active ? "hsl(200 80% 55%)" : "hsl(220 10% 30%)"}
                  strokeWidth={1.5} opacity={pvo.active ? 1 : 0.4} />
                {pvo.active && (
                  <line x1={pvo.x} y1={pvo.y - 6} x2={pvo.x + 5} y2={pvo.y - 6}
                    stroke="hsl(200 80% 55%)" strokeWidth={1.5}
                    style={{ transformOrigin: `${pvo.x}px ${pvo.y - 6}px` }}
                    className="animate-pvo-rotate" />
                )}
                <text x={pvo.x} y={pvo.y + 18} textAnchor="middle" fontSize="8"
                  fill={pvo.active ? "hsl(200 60% 70%)" : "hsl(220 10% 40%)"}
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  {pvo.label}
                </text>
              </g>
            ))}

            {/* Enemies */}
            {enemies.filter(e => !e.destroyed && !e.reached).map(e => (
              <g key={e.id}>
                <circle cx={e.x} cy={e.y} r={10} fill="url(#enemyGlow)" />
                <polygon
                  points={`${e.x},${e.y - 7} ${e.x + 6},${e.y + 5} ${e.x - 6},${e.y + 5}`}
                  fill="hsl(0 75% 40%)" stroke="hsl(0 75% 65%)" strokeWidth={1} />
                <rect x={e.x - 8} y={e.y - 13} width={16} height={2.5} fill="hsl(220 15% 15%)" rx={1} />
                <rect x={e.x - 8} y={e.y - 13} width={16 * (e.hp / e.maxHp)} height={2.5}
                  fill="hsl(0 75% 55%)" rx={1} />
              </g>
            ))}

            {/* Explosions */}
            {explosions.map(ex => (
              <g key={ex.id} className="animate-explosion"
                style={{ transformOrigin: `${ex.x}px ${ex.y}px` }}>
                <circle cx={ex.x} cy={ex.y} r={16} fill="hsl(45 90% 55%)" opacity={0.6} />
                <circle cx={ex.x} cy={ex.y} r={9} fill="hsl(0 90% 70%)" opacity={0.85} />
                <circle cx={ex.x} cy={ex.y} r={3} fill="white" />
              </g>
            ))}
          </svg>

          {/* Overlays */}
          {(phase === "gameover" || phase === "victory") && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/75 backdrop-blur-sm animate-fade-in-up">
              <div className={`text-center space-y-5 p-10 border rounded-sm bg-card/95
                ${phase === "victory" ? "border-primary/40" : "border-destructive/40"}`}>
                <div className={`terminal-text text-5xl font-semibold tracking-widest
                  ${phase === "victory" ? "text-primary" : "text-destructive"}`}>
                  {phase === "victory" ? "ПОБЕДА" : "ПРОВАЛ"}
                </div>
                <div className="terminal-text text-muted-foreground text-sm">
                  {phase === "victory" ? "Все волны отражены." : "Оборона прорвана."} Очки: {score}
                </div>
                <button onClick={handleRestart}
                  className="terminal-text px-8 py-2.5 border border-primary text-primary text-sm hover:bg-primary hover:text-background transition-colors rounded-sm">
                  ПЕРЕЗАПУСК
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel */}
        <aside className="w-64 border-l border-border bg-card/60 backdrop-blur-sm flex flex-col overflow-hidden shrink-0">
          {/* Wave indicator */}
          <div className="px-4 pt-4 pb-3 border-b border-border">
            <div className="terminal-text text-xs text-muted-foreground uppercase tracking-widest mb-3">Волны</div>
            <div className="flex gap-1.5">
              {Array.from({ length: 5 }, (_, i) => {
                const n = i + 1;
                const done = n < wave;
                const active = n === wave;
                return (
                  <div key={n} className={`flex-1 h-7 rounded-sm flex items-center justify-center terminal-text text-xs font-semibold border transition-all
                    ${active && phase === "wave" ? "border-destructive bg-destructive/20 text-destructive animate-wave-alert" :
                      active && phase === "prep" ? "border-accent bg-accent/15 text-accent" :
                      done ? "border-primary/40 bg-primary/10 text-primary/50" :
                      "border-border bg-muted/20 text-muted-foreground"}`}>
                    {done ? "✓" : n}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bases */}
          <div className="px-4 pt-3 pb-3 border-b border-border">
            <div className="terminal-text text-xs text-muted-foreground uppercase tracking-widest mb-3">Объекты</div>
            <div className="space-y-3">
              {bases.map(b => (
                <div key={b.id}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="terminal-text text-xs text-foreground/80">{b.label}</span>
                    <span className={`terminal-text text-xs font-semibold
                      ${b.hp > b.maxHp * 0.5 ? "text-primary" : b.hp > b.maxHp * 0.25 ? "text-accent" : "text-destructive"}`}>
                      {b.hp}/{b.maxHp}
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${(b.hp / b.maxHp) * 100}%`,
                        backgroundColor: b.hp / b.maxHp > 0.5 ? "hsl(120 60% 45%)" :
                          b.hp / b.maxHp > 0.25 ? "hsl(45 90% 55%)" : "hsl(0 75% 55%)"
                      }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PVO */}
          <div className="px-4 pt-3 pb-3 border-b border-border">
            <div className="terminal-text text-xs text-muted-foreground uppercase tracking-widest mb-2">
              ПВО — нажми для вкл/выкл
            </div>
            <div className="space-y-2">
              {pvos.map(pvo => (
                <button key={pvo.id}
                  onClick={() => setPvos(p => p.map(pv => pv.id === pvo.id ? { ...pv, active: !pv.active } : pv))}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-sm border transition-all text-left
                    ${pvo.active ? "border-sky-500/40 bg-sky-900/20 hover:bg-sky-900/35" : "border-border bg-muted/20 opacity-50 hover:opacity-70"}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${pvo.active ? "bg-sky-400 animate-pulse" : "bg-muted-foreground"}`} />
                    <span className="terminal-text text-xs text-foreground/80">{pvo.label}</span>
                  </div>
                  <div className="flex gap-0.5 items-center">
                    {Array.from({ length: pvo.maxAmmo }, (_, i) => (
                      <div key={i} className={`w-1 h-2.5 rounded-full ${i < pvo.ammo ? "bg-sky-400" : "bg-muted"}`} />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Log */}
          <div className="flex-1 px-4 pt-3 overflow-hidden flex flex-col min-h-0">
            <div className="terminal-text text-xs text-muted-foreground uppercase tracking-widest mb-2">Журнал</div>
            <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
              {log.map((entry, i) => (
                <div key={i} className={`terminal-text text-xs leading-relaxed
                  ${i === 0 ? "text-foreground/80" : "text-muted-foreground/55"}`}>
                  {entry}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
