import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";

// ══════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════

type GamePhase = "setup" | "battle" | "result";
type PanelTab = "attack" | "defense" | "log";

interface DroneType {
  id: string;
  name: string;
  emoji: string;
  hp: number;
  speed: number;
  damage: number;
  cost: number;
  color: string;
  desc: string;
  size: number;
}

interface PVOType {
  id: string;
  name: string;
  emoji: string;
  range: number;
  fireRate: number; // ticks between shots
  damage: number;
  cost: number;
  color: string;
  desc: string;
}

interface DroneOrder {
  typeId: string;
  count: number;
  spawnIdx: number; // which spawn point
}

interface ActiveDrone {
  uid: string;
  typeId: string;
  x: number;
  y: number;
  tx: number;
  ty: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  destroyed: boolean;
  reached: boolean;
  trail: { x: number; y: number }[];
}

interface PlacedPVO {
  uid: string;
  typeId: string;
  x: number;
  y: number;
  ammo: number;
  maxAmmo: number;
  cooldown: number;
  active: boolean;
}

interface Base {
  id: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  label: string;
  icon: string;
  priority: number;
}

interface Explosion {
  uid: string;
  x: number;
  y: number;
  t: number;
}

interface Projectile {
  uid: string;
  x: number;
  y: number;
  tx: number;
  ty: number;
  done: boolean;
}

// ══════════════════════════════════════════════════════════════════
// STATIC DATA
// ══════════════════════════════════════════════════════════════════

const DRONE_TYPES: DroneType[] = [
  {
    id: "scout",
    name: "Разведчик",
    emoji: "◆",
    hp: 1,
    speed: 1.6,
    damage: 5,
    cost: 10,
    color: "#60a5fa",
    desc: "Быстрый, слабый, дешёвый",
    size: 5,
  },
  {
    id: "kamikaze",
    name: "Камикадзе",
    emoji: "▲",
    hp: 2,
    speed: 1.1,
    damage: 25,
    cost: 20,
    color: "#f97316",
    desc: "Средняя скорость, высокий урон",
    size: 6,
  },
  {
    id: "heavy",
    name: "Тяжёлый",
    emoji: "■",
    hp: 6,
    speed: 0.6,
    damage: 15,
    cost: 35,
    color: "#a855f7",
    desc: "Медленный, очень живучий",
    size: 8,
  },
  {
    id: "stealth",
    name: "Стелс",
    emoji: "●",
    hp: 2,
    speed: 0.9,
    damage: 20,
    cost: 45,
    color: "#22d3ee",
    desc: "Невидим для ПВО в 50% случаев",
    size: 5,
  },
];

const PVO_TYPES: PVOType[] = [
  {
    id: "autocannon",
    name: "Автопушка",
    emoji: "⚙",
    range: 90,
    fireRate: 6,
    damage: 1,
    cost: 40,
    color: "#4ade80",
    desc: "Быстрая стрельба, малый урон",
  },
  {
    id: "missile",
    name: "Ракетный ком.",
    emoji: "✦",
    range: 160,
    fireRate: 18,
    damage: 4,
    cost: 80,
    color: "#facc15",
    desc: "Большой радиус, тяжёлые ракеты",
  },
  {
    id: "laser",
    name: "Лазерный",
    emoji: "◉",
    range: 120,
    fireRate: 3,
    damage: 1,
    cost: 120,
    color: "#f43f5e",
    desc: "Непрерывный огонь, не промахивается",
  },
  {
    id: "radar",
    name: "РЛС + Пушка",
    emoji: "⊕",
    range: 200,
    fireRate: 12,
    damage: 3,
    cost: 150,
    color: "#38bdf8",
    desc: "Видит стелс, огромный радиус",
  },
];

const BASES: Base[] = [
  { id: "b1", x: 430, y: 290, hp: 120, maxHp: 120, label: "Штаб", icon: "🏛", priority: 1 },
  { id: "b2", x: 270, y: 350, hp: 80, maxHp: 80, label: "Арсенал", icon: "🏭", priority: 2 },
  { id: "b3", x: 590, y: 230, hp: 80, maxHp: 80, label: "Радар", icon: "📡", priority: 3 },
  { id: "b4", x: 340, y: 200, hp: 60, maxHp: 60, label: "Склад", icon: "🏗", priority: 4 },
];

const SPAWN_POINTS = [
  { x: 28, y: 55, label: "СЗ" },
  { x: 870, y: 75, label: "СВ" },
  { x: 28, y: 490, label: "ЮЗ" },
  { x: 860, y: 470, label: "ЮВ" },
  { x: 450, y: 20, label: "С" },
  { x: 450, y: 540, label: "Ю" },
];

const ATTACK_BUDGET = 300;
const DEFENSE_BUDGET = 500;
const MAP_W = 920;
const MAP_H = 560;
const TICK_MS = 60;

let _uid = 0;
const uid = () => `u${++_uid}`;

function dist(ax: number, ay: number, bx: number, by: number) {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

// ══════════════════════════════════════════════════════════════════
// MAP ELEMENTS (static terrain)
// ══════════════════════════════════════════════════════════════════

function TerrainMap() {
  return (
    <g>
      {/* Sky gradient base handled in CSS */}

      {/* Ground zones */}
      <ellipse cx={200} cy={180} rx={130} ry={70} fill="#1a2e1a" opacity={0.55} />
      <ellipse cx={720} cy={160} rx={110} ry={60} fill="#1a2e1a" opacity={0.5} />
      <ellipse cx={150} cy={430} rx={100} ry={55} fill="#1a2e1a" opacity={0.45} />
      <ellipse cx={760} cy={420} rx={120} ry={65} fill="#1a2e1a" opacity={0.5} />
      <ellipse cx={450} cy={480} rx={140} ry={50} fill="#1a2e1a" opacity={0.45} />

      {/* Hill shading */}
      <ellipse cx={200} cy={170} rx={80} ry={40} fill="#243824" opacity={0.6} />
      <ellipse cx={720} cy={152} rx={70} ry={35} fill="#243824" opacity={0.55} />
      <ellipse cx={150} cy={422} rx={60} ry={30} fill="#243824" opacity={0.5} />
      <ellipse cx={760} cy={412} rx={75} ry={38} fill="#243824" opacity={0.55} />

      {/* River */}
      <path
        d="M 0 320 Q 80 310 140 325 Q 200 340 280 330 Q 360 318 440 335 Q 520 352 600 340 Q 680 328 760 345 Q 840 360 920 350"
        fill="none"
        stroke="#1e3a5f"
        strokeWidth={14}
        opacity={0.7}
      />
      <path
        d="M 0 320 Q 80 310 140 325 Q 200 340 280 330 Q 360 318 440 335 Q 520 352 600 340 Q 680 328 760 345 Q 840 360 920 350"
        fill="none"
        stroke="#2563a8"
        strokeWidth={7}
        opacity={0.5}
      />
      {/* River shimmer */}
      <path
        d="M 60 318 Q 150 308 230 322"
        fill="none" stroke="#3b82f6" strokeWidth={2} opacity={0.35} />
      <path
        d="M 500 338 Q 600 328 700 342"
        fill="none" stroke="#3b82f6" strokeWidth={2} opacity={0.35} />

      {/* Roads */}
      <path d="M 430 290 L 80 80" stroke="#2d3748" strokeWidth={5} opacity={0.6} strokeDasharray="8 4" />
      <path d="M 430 290 L 860 90" stroke="#2d3748" strokeWidth={5} opacity={0.6} strokeDasharray="8 4" />
      <path d="M 430 290 L 80 500" stroke="#2d3748" strokeWidth={5} opacity={0.6} strokeDasharray="8 4" />
      <path d="M 430 290 L 860 480" stroke="#2d3748" strokeWidth={5} opacity={0.6} strokeDasharray="8 4" />
      <path d="M 430 290 L 450 20" stroke="#2d3748" strokeWidth={4} opacity={0.5} strokeDasharray="6 4" />
      <path d="M 430 290 L 450 545" stroke="#2d3748" strokeWidth={4} opacity={0.5} strokeDasharray="6 4" />

      {/* Road centres */}
      <path d="M 430 290 L 80 80" stroke="#4a5568" strokeWidth={2} opacity={0.4} strokeDasharray="12 6" />
      <path d="M 430 290 L 860 90" stroke="#4a5568" strokeWidth={2} opacity={0.4} strokeDasharray="12 6" />
      <path d="M 430 290 L 80 500" stroke="#4a5568" strokeWidth={2} opacity={0.4} strokeDasharray="12 6" />
      <path d="M 430 290 L 860 480" stroke="#4a5568" strokeWidth={2} opacity={0.4} strokeDasharray="12 6" />

      {/* Forest patches */}
      {[
        [185, 168], [200, 178], [175, 182], [215, 172], [195, 158],
        [715, 148], [730, 158], [705, 162], [745, 152],
        [145, 420], [160, 430], [135, 435],
        [755, 410], [770, 420], [748, 428], [780, 415],
      ].map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r={8} fill="#14532d" opacity={0.7} />
          <circle cx={cx} cy={cy - 5} r={5} fill="#166534" opacity={0.8} />
        </g>
      ))}

      {/* Grid dots */}
      {Array.from({ length: 10 }, (_, row) =>
        Array.from({ length: 18 }, (_, col) => (
          <circle
            key={`g${row}-${col}`}
            cx={50 + col * 48}
            cy={30 + row * 56}
            r={0.8}
            fill="#2d5a2d"
            opacity={0.35}
          />
        ))
      )}

      {/* Border zone markers */}
      {SPAWN_POINTS.map((sp) => (
        <g key={sp.label}>
          <rect x={sp.x - 14} y={sp.y - 8} width={28} height={16} rx={2}
            fill="#1a1a2e" stroke="#dc2626" strokeWidth={1} opacity={0.85} />
          <text x={sp.x} y={sp.y + 5} textAnchor="middle" fontSize={9}
            fill="#ef4444" style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }}>
            {sp.label}
          </text>
        </g>
      ))}
    </g>
  );
}

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════

export default function Index() {
  const [phase, setPhase] = useState<GamePhase>("setup");
  const [tab, setTab] = useState<PanelTab>("attack");

  // Budget
  const [attackBudget, setAttackBudget] = useState(ATTACK_BUDGET);
  const [defenseBudget, setDefenseBudget] = useState(DEFENSE_BUDGET);

  // Attack setup
  const [droneOrders, setDroneOrders] = useState<DroneOrder[]>([]);
  const [selectedDroneType, setSelectedDroneType] = useState<string>("kamikaze");
  const [selectedSpawn, setSelectedSpawn] = useState<number>(0);

  // Defense setup
  const [placedPVOs, setPlacedPVOs] = useState<PlacedPVO[]>([]);
  const [selectedPVOType, setSelectedPVOType] = useState<string>("missile");
  const [placingPVO, setPlacingPVO] = useState(false);

  // Battle state
  const [bases, setBases] = useState<Base[]>(BASES.map(b => ({ ...b })));
  const [drones, setDrones] = useState<ActiveDrone[]>([]);
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [log, setLog] = useState<string[]>(["Система запущена. Настройте атаку и оборону."]);
  const [stats, setStats] = useState({ dronesLost: 0, dronesReached: 0, shotsFired: 0 });

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addLog = useCallback((msg: string) => {
    const t = new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLog(prev => [`[${t}] ${msg}`, ...prev.slice(0, 14)]);
  }, []);

  // ── Attack budget helpers ──────────────────────────────────────
  const attackSpent = droneOrders.reduce((sum, o) => {
    const dt = DRONE_TYPES.find(d => d.id === o.typeId)!;
    return sum + dt.cost * o.count;
  }, 0);
  const attackLeft = attackBudget - attackSpent;

  const addDroneOrder = (typeId: string, spawnIdx: number, count: number) => {
    const dt = DRONE_TYPES.find(d => d.id === typeId)!;
    if (dt.cost * count > attackLeft) return;
    setDroneOrders(prev => {
      const existing = prev.find(o => o.typeId === typeId && o.spawnIdx === spawnIdx);
      if (existing) {
        return prev.map(o =>
          o.typeId === typeId && o.spawnIdx === spawnIdx
            ? { ...o, count: o.count + count }
            : o
        );
      }
      return [...prev, { typeId, spawnIdx, count }];
    });
  };

  const removeDroneOrder = (typeId: string, spawnIdx: number) => {
    setDroneOrders(prev => prev.filter(o => !(o.typeId === typeId && o.spawnIdx === spawnIdx)));
  };

  // ── Defense budget helpers ─────────────────────────────────────
  const defenseSpent = placedPVOs.reduce((sum, p) => {
    const pt = PVO_TYPES.find(t => t.id === p.typeId)!;
    return sum + pt.cost;
  }, 0);
  const defenseLeft = defenseBudget - defenseSpent;

  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!placingPVO || phase !== "setup") return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const scaleX = MAP_W / rect.width;
    const scaleY = MAP_H / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const pt = PVO_TYPES.find(t => t.id === selectedPVOType)!;
    if (pt.cost > defenseLeft) { addLog("Недостаточно бюджета для ПВО"); return; }

    setPlacedPVOs(prev => [...prev, {
      uid: uid(),
      typeId: selectedPVOType,
      x, y,
      ammo: 999,
      maxAmmo: 999,
      cooldown: 0,
      active: true,
    }]);
    addLog(`${pt.name} размещена`);
    setPlacingPVO(false);
  };

  const removePVO = (puid: string) => {
    setPlacedPVOs(prev => prev.filter(p => p.uid !== puid));
  };

  // ── Start battle ───────────────────────────────────────────────
  const startBattle = () => {
    if (droneOrders.length === 0) { addLog("Добавьте хотя бы один отряд дронов"); return; }

    // Spawn drones
    const allDrones: ActiveDrone[] = [];
    droneOrders.forEach(order => {
      const dt = DRONE_TYPES.find(d => d.id === order.typeId)!;
      const sp = SPAWN_POINTS[order.spawnIdx];
      for (let i = 0; i < order.count; i++) {
        // Pick target base by priority
        const target = BASES[i % BASES.length];
        allDrones.push({
          uid: uid(),
          typeId: order.typeId,
          x: sp.x + (Math.random() - 0.5) * 40,
          y: sp.y + (Math.random() - 0.5) * 40,
          tx: target.x,
          ty: target.y,
          hp: dt.hp,
          maxHp: dt.hp,
          speed: dt.speed + (Math.random() - 0.5) * 0.2,
          damage: dt.damage,
          destroyed: false,
          reached: false,
          trail: [],
        });
      }
    });

    setBases(BASES.map(b => ({ ...b })));
    setDrones(allDrones);
    setExplosions([]);
    setProjectiles([]);
    setStats({ dronesLost: 0, dronesReached: 0, shotsFired: 0 });
    addLog(`Атака начата: ${allDrones.length} дронов в воздухе`);
    setPhase("battle");
    setTab("log");
  };

  // ── Game tick ──────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "battle") return;

    tickRef.current = setInterval(() => {
      // Move drones
      setDrones(prev =>
        prev.map(d => {
          if (d.destroyed || d.reached) return d;
          const dd = dist(d.x, d.y, d.tx, d.ty);
          if (dd < 14) return { ...d, reached: true };
          const nx = d.x + (d.tx - d.x) / dd * d.speed;
          const ny = d.y + (d.ty - d.y) / dd * d.speed;
          const trail = [...d.trail.slice(-8), { x: d.x, y: d.y }];
          return { ...d, x: nx, y: ny, trail };
        })
      );

      // PVO shoot
      setPlacedPVOs(pvoPrev => {
        const pvos = pvoPrev.map(p => ({ ...p }));
        const newExp: Explosion[] = [];
        const newProj: Projectile[] = [];

        setDrones(dPrev => {
          const ds = dPrev.map(d => ({ ...d }));

          pvos.forEach(pvo => {
            if (!pvo.active) return;
            if (pvo.cooldown > 0) { pvo.cooldown--; return; }
            const pt = PVO_TYPES.find(t => t.id === pvo.typeId)!;

            for (const d of ds) {
              if (d.destroyed || d.reached) continue;
              // Stealth evasion
              if (d.typeId === "stealth") {
                // RLS radar sees stealth
                if (pvo.typeId !== "radar" && Math.random() < 0.5) continue;
              }
              if (dist(pvo.x, pvo.y, d.x, d.y) <= pt.range) {
                d.hp -= pt.damage;
                pvo.cooldown = pt.fireRate;
                newProj.push({ uid: uid(), x: pvo.x, y: pvo.y, tx: d.x, ty: d.y, done: false });
                setStats(s => ({ ...s, shotsFired: s.shotsFired + 1 }));
                if (d.hp <= 0) {
                  d.destroyed = true;
                  newExp.push({ uid: uid(), x: d.x, y: d.y, t: Date.now() });
                  setStats(s => ({ ...s, dronesLost: s.dronesLost + 1 }));
                  addLog(`${DRONE_TYPES.find(t => t.id === d.typeId)!.name} уничтожен`);
                }
                break;
              }
            }
          });

          if (newExp.length > 0) {
            setExplosions(prev => [...prev, ...newExp]);
            setTimeout(() => {
              const ids = newExp.map(e => e.uid);
              setExplosions(prev => prev.filter(e => !ids.includes(e.uid)));
            }, 700);
          }
          if (newProj.length > 0) {
            setProjectiles(prev => [...prev, ...newProj]);
            setTimeout(() => {
              const ids = newProj.map(p => p.uid);
              setProjectiles(prev => prev.filter(p => !ids.includes(p.uid)));
            }, 200);
          }

          return ds;
        });

        return pvos;
      });

      // Base damage
      setDrones(dPrev => {
        const reached = dPrev.filter(d => d.reached && !d.destroyed);
        if (reached.length > 0) {
          setBases(prev => prev.map(b => {
            const hits = reached.filter(d => dist(d.tx, d.ty, b.x, b.y) < 18);
            if (hits.length > 0) {
              const totalDmg = hits.reduce((s, d) => s + d.damage, 0);
              addLog(`${b.label}: урон ${totalDmg}`);
              setStats(s => ({ ...s, dronesReached: s.dronesReached + hits.length }));
              const newHp = Math.max(0, b.hp - totalDmg);
              if (newHp === 0 && b.hp > 0) addLog(`⚠ ${b.label} УНИЧТОЖЕНА`);
              return { ...b, hp: newHp };
            }
            return b;
          }));
        }
        return dPrev.map(d => d.reached ? { ...d, destroyed: true } : d);
      });

    }, TICK_MS);

    return () => clearInterval(tickRef.current!);
  }, [phase, addLog]);

  // Check battle end
  useEffect(() => {
    if (phase !== "battle") return;
    if (drones.length === 0) return;
    if (drones.every(d => d.destroyed || d.reached)) {
      setTimeout(() => {
        setPhase("result");
        addLog("Атака завершена");
      }, 800);
    }
  }, [drones, phase]);

  const resetGame = () => {
    setPhase("setup");
    setDroneOrders([]);
    setPlacedPVOs([]);
    setDrones([]);
    setExplosions([]);
    setProjectiles([]);
    setBases(BASES.map(b => ({ ...b })));
    setLog(["Система перезапущена"]);
    setTab("attack");
    setPlacingPVO(false);
    setStats({ dronesLost: 0, dronesReached: 0, shotsFired: 0 });
  };

  const totalBasesHp = bases.reduce((s, b) => s + b.hp, 0);
  const totalBasesMax = bases.reduce((s, b) => s + b.maxHp, 0);
  const defenseIntegrity = Math.round((totalBasesHp / totalBasesMax) * 100);
  const activeDrones = drones.filter(d => !d.destroyed && !d.reached).length;

  return (
    <div className="w-screen h-screen bg-[#0a0f0a] flex flex-col overflow-hidden" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>

      {/* ══ TOP BAR ══ */}
      <header className="flex items-center justify-between px-5 py-2 border-b border-[#1a3a1a] bg-[#0d130d]/90 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-[#4ade80] text-xs font-semibold tracking-[0.2em] uppercase">РУБЕЖ 2.0</span>
          <div className="w-px h-4 bg-[#1a3a1a]" />
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              phase === "battle" ? "bg-red-500 animate-pulse" :
              phase === "result" ? "bg-yellow-400" : "bg-[#4ade80]"
            }`} />
            <span className="text-[10px] text-[#6b7280]">
              {phase === "setup" && "ПЛАНИРОВАНИЕ ОПЕРАЦИИ"}
              {phase === "battle" && "АТАКА В ПРОЦЕССЕ"}
              {phase === "result" && "ОПЕРАЦИЯ ЗАВЕРШЕНА"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          {phase === "battle" && (
            <>
              <MiniStat label="В ВОЗДУХЕ" value={activeDrones} color="#f97316" />
              <MiniStat label="СБИТО" value={stats.dronesLost} color="#4ade80" />
              <MiniStat label="ЦЕЛОСТНОСТЬ" value={`${defenseIntegrity}%`}
                color={defenseIntegrity > 60 ? "#4ade80" : defenseIntegrity > 30 ? "#facc15" : "#ef4444"} />
            </>
          )}
          {phase === "setup" && (
            <>
              <MiniStat label="БЮДЖЕТ АТАКИ" value={`${attackLeft}₽`} color="#60a5fa" />
              <MiniStat label="БЮДЖЕТ ОБОР." value={`${defenseLeft}₽`} color="#4ade80" />
            </>
          )}
        </div>
      </header>

      {/* ══ MAIN ══ */}
      <div className="flex flex-1 min-h-0">

        {/* ══ MAP ══ */}
        <div className={`flex-1 relative overflow-hidden ${placingPVO ? "cursor-crosshair" : ""}`}
          style={{ background: "radial-gradient(ellipse at 50% 50%, #0d1a0d 0%, #060c06 100%)" }}>
          <svg
            width="100%" height="100%"
            viewBox={`0 0 ${MAP_W} ${MAP_H}`}
            preserveAspectRatio="xMidYMid meet"
            onClick={handleMapClick}
          >
            <defs>
              <radialGradient id="baseGlow">
                <stop offset="0%" stopColor="#4ade80" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
              </radialGradient>
              <filter id="blur2">
                <feGaussianBlur stdDeviation="2" />
              </filter>
            </defs>

            <TerrainMap />

            {/* PVO range rings */}
            {placedPVOs.map(pvo => {
              const pt = PVO_TYPES.find(t => t.id === pvo.typeId)!;
              return (
                <circle key={`r${pvo.uid}`} cx={pvo.x} cy={pvo.y} r={pt.range}
                  fill="none" stroke={pt.color} strokeWidth={0.7}
                  strokeDasharray="5 7" opacity={0.25} />
              );
            })}

            {/* Preview ring when placing */}
            {placingPVO && (
              <text x={MAP_W / 2} y={MAP_H / 2} textAnchor="middle" fontSize={12}
                fill="#facc15" opacity={0.6}>Кликните на карте для размещения ПВО</text>
            )}

            {/* Bases */}
            {bases.map(b => (
              <g key={b.id}>
                <circle cx={b.x} cy={b.y} r={45} fill="url(#baseGlow)" />
                <circle cx={b.x} cy={b.y} r={18}
                  fill={b.hp > 0 ? "#0f2010" : "#200808"}
                  stroke={b.hp > 0 ? "#4ade80" : "#ef4444"}
                  strokeWidth={1.5} />
                <text x={b.x} y={b.y + 6} textAnchor="middle" fontSize={14}>{b.icon}</text>
                <text x={b.x} y={b.y + 30} textAnchor="middle" fontSize={9}
                  fill={b.hp > 0 ? "#86efac" : "#f87171"}>
                  {b.label}
                </text>
                {/* HP bar */}
                <rect x={b.x - 22} y={b.y + 34} width={44} height={4} fill="#111" rx={2} />
                <rect x={b.x - 22} y={b.y + 34}
                  width={44 * (b.hp / b.maxHp)} height={4}
                  fill={b.hp / b.maxHp > 0.5 ? "#4ade80" : b.hp / b.maxHp > 0.25 ? "#facc15" : "#ef4444"}
                  rx={2} />
                <text x={b.x} y={b.y + 47} textAnchor="middle" fontSize={8} fill="#6b7280">
                  {b.hp}/{b.maxHp}
                </text>
              </g>
            ))}

            {/* Placed PVOs */}
            {placedPVOs.map(pvo => {
              const pt = PVO_TYPES.find(t => t.id === pvo.typeId)!;
              return (
                <g key={pvo.uid} onClick={(e) => { e.stopPropagation(); if (phase === "setup") removePVO(pvo.uid); }}
                  style={{ cursor: phase === "setup" ? "pointer" : "default" }}>
                  <circle cx={pvo.x} cy={pvo.y} r={14} fill="#0a1a0a" stroke={pt.color} strokeWidth={1.5} />
                  <text x={pvo.x} y={pvo.y + 5} textAnchor="middle" fontSize={10} fill={pt.color}>{pt.emoji}</text>
                  <text x={pvo.x} y={pvo.y + 22} textAnchor="middle" fontSize={7} fill="#6b7280">
                    {pt.name.slice(0, 8)}
                  </text>
                  {/* Rotating radar line */}
                  {pvo.typeId === "radar" && (
                    <line x1={pvo.x} y1={pvo.y} x2={pvo.x + 12} y2={pvo.y}
                      stroke={pt.color} strokeWidth={1.5} opacity={0.7}
                      style={{ transformOrigin: `${pvo.x}px ${pvo.y}px` }}
                      className="animate-pvo-rotate" />
                  )}
                  {phase === "setup" && (
                    <circle cx={pvo.x + 10} cy={pvo.y - 10} r={6}
                      fill="#ef4444" opacity={0.8} style={{ cursor: "pointer" }} />
                  )}
                  {phase === "setup" && (
                    <text x={pvo.x + 10} y={pvo.y - 7} textAnchor="middle" fontSize={8} fill="white">✕</text>
                  )}
                </g>
              );
            })}

            {/* Drone trails */}
            {drones.filter(d => !d.destroyed && d.trail.length > 1).map(d => {
              const dt = DRONE_TYPES.find(t => t.id === d.typeId)!;
              const pts = d.trail.map((p, i) => `${p.x},${p.y}`).join(" ");
              return (
                <polyline key={`t${d.uid}`} points={pts}
                  fill="none" stroke={dt.color} strokeWidth={0.8} opacity={0.3} />
              );
            })}

            {/* Active drones */}
            {drones.filter(d => !d.destroyed && !d.reached).map(d => {
              const dt = DRONE_TYPES.find(t => t.id === d.typeId)!;
              return (
                <g key={d.uid}>
                  <circle cx={d.x} cy={d.y} r={dt.size + 4} fill={dt.color} opacity={0.08} />
                  <circle cx={d.x} cy={d.y} r={dt.size}
                    fill={dt.color} fillOpacity={0.85}
                    stroke={dt.color} strokeWidth={0.8} />
                  {d.maxHp > 1 && (
                    <>
                      <rect x={d.x - 6} y={d.y - dt.size - 6} width={12} height={2} fill="#111" rx={1} />
                      <rect x={d.x - 6} y={d.y - dt.size - 6}
                        width={12 * (d.hp / d.maxHp)} height={2}
                        fill={d.hp / d.maxHp > 0.5 ? "#4ade80" : "#f97316"} rx={1} />
                    </>
                  )}
                </g>
              );
            })}

            {/* Projectiles */}
            {projectiles.map(p => (
              <circle key={p.uid} cx={(p.x + p.tx) / 2} cy={(p.y + p.ty) / 2}
                r={2} fill="#facc15" opacity={0.9} />
            ))}

            {/* Explosions */}
            {explosions.map(ex => (
              <g key={ex.uid} className="animate-explosion"
                style={{ transformOrigin: `${ex.x}px ${ex.y}px` }}>
                <circle cx={ex.x} cy={ex.y} r={18} fill="#f97316" opacity={0.5} />
                <circle cx={ex.x} cy={ex.y} r={10} fill="#fbbf24" opacity={0.7} />
                <circle cx={ex.x} cy={ex.y} r={4} fill="white" opacity={0.9} />
              </g>
            ))}

            {/* Spawn point labels in setup */}
            {phase === "setup" && tab === "attack" && droneOrders.map((order, i) => {
              const sp = SPAWN_POINTS[order.spawnIdx];
              const dt = DRONE_TYPES.find(d => d.id === order.typeId)!;
              return (
                <g key={i}>
                  <circle cx={sp.x} cy={sp.y} r={12} fill={dt.color} opacity={0.25}
                    stroke={dt.color} strokeWidth={1} />
                  <text x={sp.x} y={sp.y + 4} textAnchor="middle" fontSize={9}
                    fill={dt.color} fontWeight="bold">{order.count}</text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* ══ SIDE PANEL ══ */}
        <aside className="w-72 border-l border-[#1a3a1a] bg-[#0d130d]/95 flex flex-col overflow-hidden shrink-0">

          {/* Tabs */}
          <div className="flex border-b border-[#1a3a1a] shrink-0">
            {(["attack", "defense", "log"] as PanelTab[]).map(t => (
              <button key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 text-[10px] uppercase tracking-widest transition-colors
                  ${tab === t ? "text-[#4ade80] border-b border-[#4ade80]" : "text-[#4b5563] hover:text-[#9ca3af]"}`}>
                {t === "attack" ? "Атака" : t === "defense" ? "Оборона" : "Журнал"}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">

            {/* ── ATTACK TAB ── */}
            {tab === "attack" && (
              <div className="p-3 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-[#6b7280] uppercase tracking-widest">Бюджет атаки</span>
                  <span className="text-sm font-semibold text-[#60a5fa]">{attackLeft}/{ATTACK_BUDGET}₽</span>
                </div>
                <div className="h-1.5 bg-[#1a1a1a] rounded-full">
                  <div className="h-full bg-[#3b82f6] rounded-full transition-all"
                    style={{ width: `${(attackLeft / ATTACK_BUDGET) * 100}%` }} />
                </div>

                {/* Drone type selector */}
                <div>
                  <div className="text-[10px] text-[#6b7280] uppercase tracking-widest mb-2">Тип дрона</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {DRONE_TYPES.map(dt => (
                      <button key={dt.id}
                        onClick={() => setSelectedDroneType(dt.id)}
                        className={`p-2 rounded-sm border text-left transition-all ${
                          selectedDroneType === dt.id
                            ? "border-opacity-80 bg-opacity-15"
                            : "border-[#1a3a1a] bg-transparent hover:border-[#2a4a2a]"
                        }`}
                        style={selectedDroneType === dt.id ? {
                          borderColor: dt.color,
                          backgroundColor: dt.color + "18"
                        } : {}}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span style={{ color: dt.color, fontSize: 12 }}>{dt.emoji}</span>
                          <span className="text-[10px] font-semibold text-[#e5e7eb]">{dt.name}</span>
                        </div>
                        <div className="text-[9px] text-[#6b7280] leading-tight">{dt.desc}</div>
                        <div className="flex gap-2 mt-1">
                          <span className="text-[9px] text-[#4b5563]">💰 {dt.cost}₽</span>
                          <span className="text-[9px] text-[#4b5563]">❤ {dt.hp}</span>
                          <span className="text-[9px] text-[#4b5563]">⚡ {dt.speed.toFixed(1)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Spawn selector */}
                <div>
                  <div className="text-[10px] text-[#6b7280] uppercase tracking-widest mb-2">Точка входа</div>
                  <div className="grid grid-cols-3 gap-1">
                    {SPAWN_POINTS.map((sp, i) => (
                      <button key={i}
                        onClick={() => setSelectedSpawn(i)}
                        className={`py-1.5 text-[10px] rounded-sm border transition-all ${
                          selectedSpawn === i
                            ? "border-[#dc2626] bg-[#dc2626]/15 text-[#f87171]"
                            : "border-[#1a3a1a] text-[#6b7280] hover:border-[#dc2626]/40"
                        }`}>
                        {sp.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Count + Add */}
                <div className="flex gap-2">
                  {[1, 3, 5, 10].map(n => (
                    <button key={n}
                      onClick={() => addDroneOrder(selectedDroneType, selectedSpawn, n)}
                      className="flex-1 py-1.5 text-[10px] border border-[#1a3a1a] text-[#9ca3af]
                        hover:border-[#4ade80] hover:text-[#4ade80] rounded-sm transition-all">
                      +{n}
                    </button>
                  ))}
                </div>

                {/* Order list */}
                {droneOrders.length > 0 && (
                  <div>
                    <div className="text-[10px] text-[#6b7280] uppercase tracking-widest mb-2">Отряды</div>
                    <div className="space-y-1">
                      {droneOrders.map((o, i) => {
                        const dt = DRONE_TYPES.find(d => d.id === o.typeId)!;
                        const sp = SPAWN_POINTS[o.spawnIdx];
                        return (
                          <div key={i} className="flex items-center justify-between px-2.5 py-1.5 rounded-sm"
                            style={{ background: dt.color + "10", border: `1px solid ${dt.color}30` }}>
                            <div className="flex items-center gap-2">
                              <span style={{ color: dt.color }}>{dt.emoji}</span>
                              <span className="text-[10px] text-[#e5e7eb]">{dt.name} × {o.count}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] text-[#6b7280]">{sp.label}</span>
                              <button onClick={() => removeDroneOrder(o.typeId, o.spawnIdx)}
                                className="text-[#ef4444] text-[10px] hover:opacity-80">✕</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-2 text-right text-[10px] text-[#6b7280]">
                      Итого: {droneOrders.reduce((s, o) => s + o.count, 0)} дронов · {attackSpent}₽
                    </div>
                  </div>
                )}

                {phase === "setup" && (
                  <button
                    onClick={startBattle}
                    disabled={droneOrders.length === 0}
                    className="w-full py-2.5 text-xs font-semibold uppercase tracking-widest border border-[#ef4444] text-[#ef4444]
                      hover:bg-[#ef4444] hover:text-white transition-all rounded-sm disabled:opacity-30 disabled:cursor-not-allowed">
                    Начать атаку →
                  </button>
                )}
              </div>
            )}

            {/* ── DEFENSE TAB ── */}
            {tab === "defense" && (
              <div className="p-3 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-[#6b7280] uppercase tracking-widest">Бюджет обороны</span>
                  <span className="text-sm font-semibold text-[#4ade80]">{defenseLeft}/{DEFENSE_BUDGET}₽</span>
                </div>
                <div className="h-1.5 bg-[#1a1a1a] rounded-full">
                  <div className="h-full bg-[#4ade80] rounded-full transition-all"
                    style={{ width: `${(defenseLeft / DEFENSE_BUDGET) * 100}%` }} />
                </div>

                {/* PVO type selector */}
                <div>
                  <div className="text-[10px] text-[#6b7280] uppercase tracking-widest mb-2">Тип ПВО</div>
                  <div className="space-y-1.5">
                    {PVO_TYPES.map(pt => (
                      <button key={pt.id}
                        onClick={() => setSelectedPVOType(pt.id)}
                        className={`w-full p-2.5 rounded-sm border text-left transition-all`}
                        style={selectedPVOType === pt.id ? {
                          borderColor: pt.color,
                          backgroundColor: pt.color + "15"
                        } : { borderColor: "#1a3a1a", background: "transparent" }}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span style={{ color: pt.color, fontSize: 12 }}>{pt.emoji}</span>
                            <span className="text-[11px] font-semibold text-[#e5e7eb]">{pt.name}</span>
                          </div>
                          <span className="text-[10px] font-semibold" style={{ color: pt.color }}>
                            {pt.cost}₽
                          </span>
                        </div>
                        <div className="text-[9px] text-[#6b7280] mt-0.5">{pt.desc}</div>
                        <div className="flex gap-3 mt-1">
                          <span className="text-[9px] text-[#4b5563]">📡 {pt.range}м</span>
                          <span className="text-[9px] text-[#4b5563]">⚡ {pt.fireRate} тик</span>
                          <span className="text-[9px] text-[#4b5563]">💥 {pt.damage} урон</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {phase === "setup" && (
                  <button
                    onClick={() => setPlacingPVO(p => !p)}
                    className={`w-full py-2.5 text-xs font-semibold uppercase tracking-widest border rounded-sm transition-all
                      ${placingPVO
                        ? "border-[#facc15] text-[#facc15] bg-[#facc15]/10"
                        : "border-[#4ade80] text-[#4ade80] hover:bg-[#4ade80]/10"
                      }`}>
                    {placingPVO ? "✕ Отмена размещения" : "+ Разместить ПВО на карте"}
                  </button>
                )}

                {/* Placed PVOs list */}
                {placedPVOs.length > 0 && (
                  <div>
                    <div className="text-[10px] text-[#6b7280] uppercase tracking-widest mb-2">
                      Размещено ({placedPVOs.length})
                    </div>
                    <div className="space-y-1">
                      {placedPVOs.map(pvo => {
                        const pt = PVO_TYPES.find(t => t.id === pvo.typeId)!;
                        return (
                          <div key={pvo.uid} className="flex items-center justify-between px-2.5 py-1.5 rounded-sm"
                            style={{ background: pt.color + "10", border: `1px solid ${pt.color}30` }}>
                            <div className="flex items-center gap-2">
                              <span style={{ color: pt.color }}>{pt.emoji}</span>
                              <span className="text-[10px] text-[#e5e7eb]">{pt.name}</span>
                            </div>
                            {phase === "setup" && (
                              <button onClick={() => removePVO(pvo.uid)}
                                className="text-[#ef4444] text-[10px] hover:opacity-80">✕</button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-2 text-right text-[10px] text-[#6b7280]">
                      Итого: {defenseSpent}₽
                    </div>
                  </div>
                )}

                {/* Bases status */}
                <div>
                  <div className="text-[10px] text-[#6b7280] uppercase tracking-widest mb-2">Объекты</div>
                  <div className="space-y-2">
                    {bases.map(b => (
                      <div key={b.id}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] text-[#d1d5db]">{b.icon} {b.label}</span>
                          <span className="text-[10px] font-semibold"
                            style={{ color: b.hp / b.maxHp > 0.5 ? "#4ade80" : b.hp / b.maxHp > 0.2 ? "#facc15" : "#ef4444" }}>
                            {b.hp}/{b.maxHp}
                          </span>
                        </div>
                        <div className="h-1.5 bg-[#111] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${(b.hp / b.maxHp) * 100}%`,
                              backgroundColor: b.hp / b.maxHp > 0.5 ? "#4ade80" : b.hp / b.maxHp > 0.2 ? "#facc15" : "#ef4444"
                            }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── LOG TAB ── */}
            {tab === "log" && (
              <div className="p-3">
                <div className="text-[10px] text-[#6b7280] uppercase tracking-widest mb-3">Боевой журнал</div>
                <div className="space-y-1.5">
                  {log.map((entry, i) => (
                    <div key={i} className={`text-[10px] leading-relaxed ${i === 0 ? "text-[#d1d5db]" : "text-[#4b5563]"}`}>
                      {entry}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Result summary */}
          {phase === "result" && (
            <div className="border-t border-[#1a3a1a] p-4 space-y-3 shrink-0">
              <div className="text-[10px] text-[#6b7280] uppercase tracking-widest">Итог операции</div>
              <div className="grid grid-cols-2 gap-2">
                <ResultStat label="Дронов сбито" value={stats.dronesLost} color="#4ade80" />
                <ResultStat label="Целей поражено" value={stats.dronesReached} color="#f97316" />
                <ResultStat label="Выстрелов ПВО" value={stats.shotsFired} color="#60a5fa" />
                <ResultStat label="Целостность" value={`${defenseIntegrity}%`}
                  color={defenseIntegrity > 60 ? "#4ade80" : defenseIntegrity > 30 ? "#facc15" : "#ef4444"} />
              </div>
              <button onClick={resetGame}
                className="w-full py-2 text-xs font-semibold uppercase tracking-widest border border-[#4ade80] text-[#4ade80]
                  hover:bg-[#4ade80] hover:text-black transition-all rounded-sm">
                Новая операция
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

// ══ Helpers ══
function MiniStat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="flex flex-col items-end">
      <span className="text-[8px] text-[#4b5563] uppercase tracking-widest">{label}</span>
      <span className="text-sm font-semibold" style={{ color }}>{value}</span>
    </div>
  );
}

function ResultStat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="px-2.5 py-2 rounded-sm bg-[#0f1a0f] border border-[#1a3a1a]">
      <div className="text-[9px] text-[#4b5563] mb-0.5">{label}</div>
      <div className="text-sm font-semibold" style={{ color }}>{value}</div>
    </div>
  );
}
