import { useState, useEffect, useCallback, useRef } from "react";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
type GamePhase = "setup" | "battle" | "paused" | "result";
type ActiveSide = "ru" | "ua";
type MapView = "ukraine" | "russia";
type SpawnDir =
  | "belgorod"
  | "kursk"
  | "donbas"
  | "azov"
  | "belarus"
  | "voronezh"
  | "poland"
  | "moldova"
  | "bsouth"
  | "blacksea";
type PanelTab = "attack" | "pvo" | "log";

interface WeaponDef {
  id: string;
  name: string;
  hp: number;
  speed: number;
  dmg: number;
  color: string;
  stealth?: boolean;
  ballistic?: boolean;
  hypersonic?: boolean;
  cruise?: boolean;
}

interface PVODef {
  id: string;
  name: string;
  range: number;
  fireRate: number;
  dmg: number;
  color: string;
  detectsStealth?: boolean;
  antiballistic?: boolean;
}

interface SpawnPoint {
  id: SpawnDir;
  label: string;
  x: number;
  y: number;
  side: "ru" | "ua";
}

interface BaseCity {
  id: string;
  label: string;
  x: number;
  y: number;
  maxHp: number;
  hp: number;
}

interface OrderEntry {
  id: string;
  weaponId: string;
  count: number;
  spawnDir: SpawnDir;
  side: "ru" | "ua";
  isPVO: boolean;
  pvoX?: number;
  pvoY?: number;
}

interface ActiveUnit {
  uid: string;
  weaponId: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  hp: number;
  maxHp: number;
  dead: boolean;
  intercepted: boolean;
  side: "ru" | "ua";
  isPVO: false;
  color: string;
  speed: number;
  dmg: number;
  stealth: boolean;
  ballistic: boolean;
  hypersonic: boolean;
}

interface ActivePVO {
  uid: string;
  defId: string;
  x: number;
  y: number;
  hp: number;
  dead: boolean;
  side: "ru" | "ua";
  isPVO: true;
  color: string;
  range: number;
  fireRate: number;
  dmg: number;
  cooldown: number;
  detectsStealth: boolean;
  antiballistic: boolean;
}

interface Explosion {
  uid: string;
  x: number;
  y: number;
  t: number;
}

interface LogEntry {
  t: number;
  msg: string;
  kind: "intercept" | "hit" | "destroy" | "info";
}

// ─────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────
const RU_WEAPONS: WeaponDef[] = [
  { id: "shahed136", name: "Shahed-136/Герань-2", hp: 2, speed: 0.8, dmg: 22, color: "#f97316" },
  { id: "lancet3", name: "Ланцет-3", hp: 3, speed: 1.2, dmg: 18, color: "#fb923c" },
  { id: "orlan10", name: "Орлан-10", hp: 1, speed: 1.4, dmg: 5, color: "#94a3b8", stealth: true },
  { id: "geran", name: "Герань-1М", hp: 2, speed: 0.9, dmg: 20, color: "#ef4444" },
  { id: "kub", name: "БПЛА КУБ-БЛА", hp: 2, speed: 1.3, dmg: 15, color: "#f59e0b" },
  { id: "superkam", name: "SuperCam S350", hp: 1, speed: 1.1, dmg: 3, color: "#a78bfa", stealth: true },
  { id: "kalibr", name: "3М-14 Калибр", hp: 5, speed: 1.5, dmg: 45, color: "#dc2626", cruise: true },
  { id: "kh101", name: "Х-101", hp: 4, speed: 1.3, dmg: 50, color: "#b91c1c", stealth: true, cruise: true },
  { id: "iskander", name: "Искандер-М (9М723)", hp: 6, speed: 2.5, dmg: 60, color: "#7c3aed", ballistic: true },
  { id: "kinzhal", name: "Кинжал (Х-47М2)", hp: 8, speed: 4.0, dmg: 75, color: "#6d28d9", ballistic: true, hypersonic: true },
  { id: "kh22", name: "Х-22 «Буря»", hp: 5, speed: 2.0, dmg: 65, color: "#9333ea", ballistic: true },
  { id: "oniks", name: "П-800 Оникс", hp: 5, speed: 2.2, dmg: 55, color: "#c026d3", cruise: true },
  { id: "kh55", name: "Х-55/Х-555", hp: 4, speed: 1.2, dmg: 48, color: "#db2777", cruise: true, stealth: true },
  { id: "zircon", name: "Циркон (3М22)", hp: 8, speed: 5.0, dmg: 80, color: "#4f46e5", hypersonic: true, ballistic: true },
];

const UA_PVO: PVODef[] = [
  { id: "s300", name: "С-300ПС/ПМ", range: 180, fireRate: 20, dmg: 5, color: "#3b82f6", detectsStealth: true },
  { id: "buk", name: "Бук-М2/М3", range: 130, fireRate: 16, dmg: 4, color: "#06b6d4" },
  { id: "hawk", name: "MIM-23 Hawk", range: 120, fireRate: 18, dmg: 3, color: "#0891b2" },
  { id: "patriot", name: "MIM-104 Patriot PAC-3", range: 200, fireRate: 22, dmg: 6, color: "#1d4ed8", detectsStealth: true, antiballistic: true },
  { id: "nasams", name: "NASAMS 3", range: 140, fireRate: 14, dmg: 4, color: "#2563eb" },
  { id: "irist", name: "IRIS-T SLM", range: 120, fireRate: 12, dmg: 3, color: "#0284c7" },
  { id: "gepard", name: "Flakpanzer Gepard", range: 60, fireRate: 3, dmg: 1, color: "#16a34a" },
  { id: "zu23", name: "ЗУ-23-2М Зенит", range: 45, fireRate: 2, dmg: 1, color: "#15803d" },
  { id: "stinger", name: "FIM-92 Stinger MANPADS", range: 50, fireRate: 8, dmg: 2, color: "#65a30d" },
  { id: "cram", name: "C-RAM Centurion", range: 55, fireRate: 2, dmg: 1, color: "#84cc16" },
  { id: "aim120", name: "AMRAAM / AIM-120C", range: 160, fireRate: 16, dmg: 4, color: "#3b82f6" },
  { id: "aster30", name: "Aster-30 SAMP/T", range: 170, fireRate: 18, dmg: 5, color: "#6366f1", detectsStealth: true, antiballistic: true },
];

const RU_PVO: PVODef[] = [
  { id: "s400", name: "С-400 Триумф", range: 220, fireRate: 20, dmg: 6, color: "#ef4444", detectsStealth: true, antiballistic: true },
  { id: "pantsir", name: "Панцирь-С1/С2", range: 90, fireRate: 5, dmg: 2, color: "#f97316" },
  { id: "tor", name: "Тор-М2", range: 115, fireRate: 12, dmg: 3, color: "#eab308" },
  { id: "s350", name: "С-350 Витязь", range: 150, fireRate: 16, dmg: 4, color: "#f59e0b" },
  { id: "tunguska", name: "2К22 Тунгуска-М1", range: 70, fireRate: 4, dmg: 1, color: "#84cc16" },
  { id: "shilka", name: "ЗСУ-23-4 Шилка", range: 55, fireRate: 3, dmg: 1, color: "#4ade80" },
];

const SPAWN_POINTS: SpawnPoint[] = [
  { id: "belgorod", label: "БЕЛГОРОД", x: 900, y: 100, side: "ru" },
  { id: "kursk", label: "КУРСК", x: 900, y: 250, side: "ru" },
  { id: "donbas", label: "ДОНБАС", x: 900, y: 380, side: "ru" },
  { id: "azov", label: "АЗОВ", x: 900, y: 480, side: "ru" },
  { id: "belarus", label: "БЕЛАРУСЬ", x: 430, y: 15, side: "ru" },
  { id: "voronezh", label: "ВОРОНЕЖ", x: 600, y: 15, side: "ru" },
  { id: "poland", label: "ПОЛЬША", x: 15, y: 200, side: "ua" },
  { id: "moldova", label: "МОЛДОВА", x: 15, y: 350, side: "ua" },
  { id: "bsouth", label: "ЧС", x: 200, y: 550, side: "ua" },
  { id: "blacksea", label: "ЧЕРНОЕ МОРЕ", x: 550, y: 550, side: "ua" },
];

const INITIAL_BASES: BaseCity[] = [
  { id: "kyiv", label: "Київ", x: 430, y: 160, maxHp: 200, hp: 200 },
  { id: "kharkiv", label: "Харків", x: 670, y: 145, maxHp: 120, hp: 120 },
  { id: "dnipro", label: "Дніпро", x: 550, y: 280, maxHp: 120, hp: 120 },
  { id: "zaporizhzhia", label: "Запоріжжя", x: 560, y: 355, maxHp: 100, hp: 100 },
  { id: "odesa", label: "Одеса", x: 375, y: 425, maxHp: 100, hp: 100 },
  { id: "lviv", label: "Львів", x: 185, y: 185, maxHp: 100, hp: 100 },
];

// ─────────────────────────────────────────────
// WEAPON ICON
// ─────────────────────────────────────────────
function WeaponIcon({ id, color, size = 32 }: { id: string; color: string; size?: number }) {
  const s: React.CSSProperties = { width: size, height: size, display: "block" };
  const isDrone = ["shahed136", "geran", "lancet3", "kub", "orlan10", "superkam"].includes(id);
  const isCruise = ["kalibr", "kh101", "kh55", "oniks"].includes(id);
  const isBallistic = ["iskander", "kinzhal", "kh22", "zircon"].includes(id);

  if (id === "shahed136" || id === "geran") {
    return (
      <svg viewBox="0 0 32 32" style={s} fill={color} stroke={color} strokeWidth="0.5">
        <polygon points="16,3 29,25 16,20 3,25" opacity="0.95" />
        <line x1="16" y1="3" x2="16" y2="21" stroke="#000" strokeWidth="1" />
        <rect x="14" y="20" width="4" height="5" rx="1" fill="#222" stroke={color} strokeWidth="0.8" />
      </svg>
    );
  }
  if (id === "lancet3" || id === "kub") {
    return (
      <svg viewBox="0 0 32 32" style={s} fill={color} stroke={color} strokeWidth="0.5">
        <ellipse cx="16" cy="16" rx="3" ry="10" opacity="0.95" />
        <ellipse cx="16" cy="16" rx="10" ry="3" opacity="0.7" />
        <circle cx="16" cy="16" r="2.5" fill="#222" stroke={color} strokeWidth="1" />
      </svg>
    );
  }
  if (id === "orlan10" || id === "superkam") {
    return (
      <svg viewBox="0 0 32 32" style={s} fill={color} stroke={color} strokeWidth="0.5">
        <rect x="12" y="8" width="8" height="12" rx="2" opacity="0.9" />
        <line x1="2" y1="13" x2="30" y2="13" strokeWidth="3" strokeLinecap="round" stroke={color} fill="none" />
        <circle cx="16" cy="23" r="3" fill="#222" stroke={color} strokeWidth="1" />
      </svg>
    );
  }
  if (isCruise) {
    return (
      <svg viewBox="0 0 32 32" style={s} fill={color} stroke={color} strokeWidth="0.5">
        <ellipse cx="16" cy="16" rx="2.5" ry="12" opacity="0.95" />
        <polygon points="16,4 18,9 14,9" fill={color} />
        <line x1="10" y1="18" x2="22" y2="18" strokeWidth="3" strokeLinecap="round" stroke={color} fill="none" />
        <line x1="12" y1="22" x2="20" y2="22" strokeWidth="2" stroke={color} fill="none" />
      </svg>
    );
  }
  if (isBallistic) {
    return (
      <svg viewBox="0 0 32 32" style={s} fill={color} stroke={color} strokeWidth="0.5">
        <ellipse cx="16" cy="14" rx="3.5" ry="11" opacity="0.95" />
        <polygon points="16,3 20,10 12,10" fill={color} />
        <polygon points="10,25 16,29 22,25 20,21 12,21" fill={color} opacity="0.7" />
        <line x1="16" y1="3" x2="16" y2="26" stroke="#000" strokeWidth="0.8" />
      </svg>
    );
  }
  // fallback generic
  if (isDrone) {
    return (
      <svg viewBox="0 0 32 32" style={s} fill={color} stroke={color} strokeWidth="0.5">
        <polygon points="16,3 29,25 16,20 3,25" opacity="0.9" />
        <line x1="16" y1="3" x2="16" y2="21" stroke="#000" strokeWidth="1" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 32 32" style={s} fill={color} stroke={color} strokeWidth="0.5">
      <ellipse cx="16" cy="16" rx="2.5" ry="12" opacity="0.95" />
      <polygon points="16,4 18,9 14,9" fill={color} />
      <line x1="8" y1="19" x2="24" y2="19" strokeWidth="3" strokeLinecap="round" stroke={color} fill="none" />
    </svg>
  );
}

// ─────────────────────────────────────────────
// PVO ICON
// ─────────────────────────────────────────────
function PVOIcon({ id, color, size = 32 }: { id: string; color: string; size?: number }) {
  const s: React.CSSProperties = { width: size, height: size, display: "block" };
  const isHeavy = ["patriot", "s300", "s400", "nasams", "aster30", "aim120"].includes(id);
  const isTwin = ["pantsir", "gepard", "shilka", "tunguska"].includes(id);
  const isMed = ["buk", "tor", "s350", "hawk", "irist"].includes(id);
  const isSmall = ["stinger", "cram", "zu23"].includes(id);

  if (isHeavy) {
    return (
      <svg viewBox="0 0 32 32" style={s} fill={color} stroke={color} strokeWidth="0.5">
        <rect x="12" y="18" width="8" height="10" rx="1" opacity="0.9" />
        <rect x="14" y="12" width="4" height="7" opacity="0.8" />
        <path d="M10,8 Q16,14 22,8" fill="none" stroke={color} strokeWidth="2.5" />
        <line x1="16" y1="8" x2="16" y2="3" strokeWidth="2" stroke={color} />
        <rect x="20" y="5" width="4" height="7" rx="1" opacity="0.8" />
        <circle cx="22" cy="5" r="2" fill="#222" stroke={color} strokeWidth="1" />
      </svg>
    );
  }
  if (isTwin) {
    return (
      <svg viewBox="0 0 32 32" style={s} fill={color} stroke={color} strokeWidth="0.5">
        <rect x="8" y="16" width="16" height="12" rx="2" opacity="0.9" />
        <rect x="11" y="10" width="10" height="8" rx="2" opacity="0.8" />
        <line x1="6" y1="13" x2="11" y2="11" strokeWidth="2.5" strokeLinecap="round" stroke={color} />
        <line x1="26" y1="13" x2="21" y2="11" strokeWidth="2.5" strokeLinecap="round" stroke={color} />
        <circle cx="6" cy="13" r="2" fill="#222" stroke={color} strokeWidth="1" />
        <circle cx="26" cy="13" r="2" fill="#222" stroke={color} strokeWidth="1" />
      </svg>
    );
  }
  if (isMed) {
    return (
      <svg viewBox="0 0 32 32" style={s} fill={color} stroke={color} strokeWidth="0.5">
        <rect x="7" y="18" width="18" height="10" rx="2" opacity="0.9" />
        <rect x="10" y="12" width="12" height="8" rx="1" opacity="0.8" />
        <rect x="8" y="8" width="5" height="8" rx="1" opacity="0.7" />
        <rect x="19" y="8" width="5" height="8" rx="1" opacity="0.7" />
        <line x1="16" y1="12" x2="16" y2="4" strokeWidth="2" stroke={color} />
        <circle cx="16" cy="6" r="3" fill="none" stroke={color} strokeWidth="1.5" />
      </svg>
    );
  }
  if (isSmall) {
    return (
      <svg viewBox="0 0 32 32" style={s} fill={color} stroke={color} strokeWidth="0.5">
        <rect x="9" y="20" width="14" height="8" rx="2" opacity="0.9" />
        <rect x="12" y="14" width="8" height="8" rx="1" opacity="0.8" />
        <line x1="8" y1="16" x2="12" y2="14" strokeWidth="2" strokeLinecap="round" stroke={color} />
        <line x1="24" y1="16" x2="20" y2="14" strokeWidth="2" strokeLinecap="round" stroke={color} />
        <line x1="16" y1="14" x2="16" y2="6" strokeWidth="1.5" stroke={color} />
        <circle cx="16" cy="5" r="2.5" fill="none" stroke={color} strokeWidth="1.5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 32 32" style={s} fill={color} stroke={color} strokeWidth="0.5">
      <rect x="10" y="18" width="12" height="10" rx="1" opacity="0.9" />
      <rect x="13" y="12" width="6" height="8" opacity="0.8" />
      <path d="M10,8 Q16,13 22,8" fill="none" stroke={color} strokeWidth="2" />
      <line x1="16" y1="8" x2="16" y2="3" strokeWidth="2" stroke={color} />
    </svg>
  );
}

// ─────────────────────────────────────────────
// UKRAINE MAP
// ─────────────────────────────────────────────
function UkraineMap({
  bases,
  units,
  pvos,
  explosions,
  onMapClick,
  phase,
  placingPVO,
}: {
  bases: BaseCity[];
  units: ActiveUnit[];
  pvos: ActivePVO[];
  explosions: Explosion[];
  onMapClick: (x: number, y: number) => void;
  phase: GamePhase;
  placingPVO: boolean;
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    if (!placingPVO) return;
    const rect = svgRef.current!.getBoundingClientRect();
    const scaleX = 920 / rect.width;
    const scaleY = 560 / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    onMapClick(x, y);
  }

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 920 560"
      style={{
        width: "100%",
        height: "100%",
        cursor: placingPVO ? "crosshair" : "default",
        background: "#070d07",
      }}
      onClick={handleClick}
    >
      {/* Grid */}
      {Array.from({ length: 19 }).map((_, i) => (
        <line
          key={`gv${i}`}
          x1={i * 50}
          y1={0}
          x2={i * 50}
          y2={560}
          stroke="#1a3a1a"
          strokeWidth="0.5"
          opacity="0.15"
        />
      ))}
      {Array.from({ length: 12 }).map((_, i) => (
        <line
          key={`gh${i}`}
          x1={0}
          y1={i * 50}
          x2={920}
          y2={i * 50}
          stroke="#1a3a1a"
          strokeWidth="0.5"
          opacity="0.15"
        />
      ))}

      {/* Ukraine map body */}
      <path
        d="M 120,80 L 180,60 L 260,55 L 340,70 L 420,60 L 500,65 L 580,55 L 650,70 L 720,60 L 790,75 L 840,100 L 860,140 L 850,180 L 820,220 L 800,260 L 820,300 L 810,340 L 780,370 L 740,390 L 700,380 L 660,400 L 620,420 L 580,430 L 540,450 L 500,460 L 460,455 L 420,465 L 380,470 L 340,460 L 300,440 L 260,430 L 220,410 L 180,390 L 150,360 L 130,320 L 110,280 L 100,240 L 105,200 L 110,160 L 115,120 Z"
        fill="#0d1f0d"
        stroke="#1a4a1a"
        strokeWidth="1.5"
      />

      {/* Dnipro river */}
      <path
        d="M 490,65 C 488,110 492,140 485,180 C 478,220 470,250 468,290 C 466,330 475,350 470,390 C 465,420 455,445 450,460"
        fill="none"
        stroke="#0f3060"
        strokeWidth="8"
        opacity="0.7"
      />
      <path
        d="M 490,65 C 488,110 492,140 485,180 C 478,220 470,250 468,290 C 466,330 475,350 470,390 C 465,420 455,445 450,460"
        fill="none"
        stroke="#1a5090"
        strokeWidth="3"
        opacity="0.5"
      />

      {/* Crimea */}
      <path
        d="M 430,462 L 460,455 L 500,460 L 520,475 L 510,495 L 490,510 L 460,515 L 435,505 L 415,490 L 420,475 Z"
        fill="#1a0a0a"
        stroke="#4a1a1a"
        strokeWidth="1.5"
      />
      <text x="465" y="490" fontSize="7" fill="#6b2a2a" fontFamily="IBM Plex Mono" textAnchor="middle">
        КРИМ
      </text>

      {/* Spawn point labels */}
      {SPAWN_POINTS.map((sp) => {
        const isRu = sp.side === "ru";
        return (
          <g key={sp.id}>
            <circle
              cx={sp.x}
              cy={sp.y}
              r={6}
              fill={isRu ? "#ef444440" : "#3b82f640"}
              stroke={isRu ? "#ef4444" : "#3b82f6"}
              strokeWidth="1"
            />
            <text
              x={sp.x}
              y={sp.y - 10}
              fontSize="6"
              fill={isRu ? "#ef4444" : "#3b82f6"}
              fontFamily="IBM Plex Mono"
              textAnchor="middle"
              opacity="0.8"
            >
              {sp.label}
            </text>
          </g>
        );
      })}

      {/* City bases */}
      {bases.map((b) => {
        const pct = b.hp / b.maxHp;
        const col = pct > 0.6 ? "#4ade80" : pct > 0.3 ? "#facc15" : "#ef4444";
        return (
          <g key={b.id}>
            <circle cx={b.x} cy={b.y} r={10} fill="#0a1a0a" stroke={col} strokeWidth="1.5" />
            <circle cx={b.x} cy={b.y} r={5} fill={col} opacity="0.7" />
            <text
              x={b.x}
              y={b.y - 14}
              fontSize="8"
              fill={col}
              fontFamily="IBM Plex Mono"
              textAnchor="middle"
            >
              {b.label}
            </text>
            <text
              x={b.x}
              y={b.y + 20}
              fontSize="6"
              fill={col}
              fontFamily="IBM Plex Mono"
              textAnchor="middle"
            >
              {b.hp}/{b.maxHp}
            </text>
          </g>
        );
      })}

      {/* PVO units on map */}
      {pvos.map((pvo) => {
        if (pvo.dead) return null;
        const isRu = pvo.side === "ru";
        return (
          <g key={pvo.uid}>
            <circle
              cx={pvo.x}
              cy={pvo.y}
              r={pvo.range}
              fill={pvo.color + "15"}
              stroke={pvo.color + "50"}
              strokeWidth="1"
              strokeDasharray="4 3"
            />
            <circle cx={pvo.x} cy={pvo.y} r={7} fill="#0a1a0a" stroke={pvo.color} strokeWidth="1.5" />
            <text
              x={pvo.x}
              y={pvo.y + 2}
              fontSize="6"
              fill={pvo.color}
              textAnchor="middle"
              fontFamily="IBM Plex Mono"
            >
              {isRu ? "Д" : "П"}
            </text>
          </g>
        );
      })}

      {/* Active weapon units */}
      {units.map((u) => {
        if (u.dead || u.intercepted) return null;
        const isRu = u.side === "ru";
        const angle =
          (Math.atan2(u.targetY - u.y, u.targetX - u.x) * 180) / Math.PI + 90;
        return (
          <g
            key={u.uid}
            transform={`translate(${u.x},${u.y}) rotate(${angle})`}
          >
            <polygon
              points="0,-7 4,5 0,2 -4,5"
              fill={u.color}
              opacity="0.9"
              stroke={isRu ? "#ff000040" : "#0000ff40"}
              strokeWidth="0.5"
            />
          </g>
        );
      })}

      {/* Explosions */}
      {explosions.map((ex) => {
        const opacity = Math.max(0, 1 - ex.t / 40);
        const r = 5 + ex.t * 0.8;
        return (
          <g key={ex.uid}>
            <circle cx={ex.x} cy={ex.y} r={r} fill="#ff6600" opacity={opacity * 0.6} />
            <circle cx={ex.x} cy={ex.y} r={r * 0.5} fill="#ffcc00" opacity={opacity} />
          </g>
        );
      })}

      {/* Placing PVO hint */}
      {placingPVO && phase === "setup" && (
        <text
          x="460"
          y="30"
          fontSize="10"
          fill="#facc15"
          textAnchor="middle"
          fontFamily="IBM Plex Mono"
        >
          КЛИКНИТЕ НА КАРТЕ ДЛЯ РАЗМЕЩЕНИЯ ПВО
        </text>
      )}

      {/* Title */}
      <text
        x="460"
        y="14"
        fontSize="9"
        fill="#1a4a1a"
        textAnchor="middle"
        fontFamily="IBM Plex Mono"
        letterSpacing="2"
      >
        ТЕАТР БОЕВЫХ ДЕЙСТВИЙ
      </text>
    </svg>
  );
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

function getWeaponDef(id: string): WeaponDef | undefined {
  return RU_WEAPONS.find((w) => w.id === id);
}

function getPVODef(id: string, side: "ru" | "ua"): PVODef | undefined {
  const list = side === "ua" ? UA_PVO : RU_PVO;
  return list.find((p) => p.id === id);
}

function getSpawnPoint(dir: SpawnDir): SpawnPoint {
  return SPAWN_POINTS.find((sp) => sp.id === dir)!;
}

// ─────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────
function Badge({ label, variant }: { label: string; variant: "stealth" | "ballistic" | "hyper" | "antiball" | "cruise" }) {
  const colors: Record<string, string> = {
    stealth: "#7c3aed",
    ballistic: "#dc2626",
    hyper: "#6d28d9",
    antiball: "#1d4ed8",
    cruise: "#0891b2",
  };
  return (
    <span
      style={{
        background: colors[variant] + "33",
        border: `1px solid ${colors[variant]}`,
        color: colors[variant],
        fontSize: 8,
        padding: "1px 4px",
        borderRadius: 2,
        fontFamily: "IBM Plex Mono",
        marginRight: 2,
        display: "inline-block",
        lineHeight: "14px",
      }}
    >
      {label}
    </span>
  );
}

function WeaponCard({
  w,
  selected,
  onSelect,
}: {
  w: WeaponDef;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      style={{
        background: selected ? w.color + "22" : "#0d160d",
        border: `1px solid ${selected ? w.color : "#1a3a1a"}`,
        borderRadius: 4,
        padding: "6px 8px",
        cursor: "pointer",
        marginBottom: 4,
        display: "flex",
        alignItems: "center",
        gap: 8,
        transition: "all 0.15s",
      }}
    >
      <WeaponIcon id={w.id} color={w.color} size={24} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            color: selected ? w.color : "#c8d4c8",
            fontSize: 9,
            fontFamily: "IBM Plex Mono",
            fontWeight: selected ? "bold" : "normal",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {w.name}
        </div>
        <div style={{ display: "flex", gap: 4, marginTop: 2, flexWrap: "wrap" }}>
          {w.stealth && <Badge label="СТЕЛС" variant="stealth" />}
          {w.ballistic && <Badge label="БАЛЛИСТ" variant="ballistic" />}
          {w.hypersonic && <Badge label="ГИПЕР" variant="hyper" />}
          {w.cruise && <Badge label="КРЫЛАТ" variant="cruise" />}
        </div>
        <div
          style={{
            color: "#4a6a4a",
            fontSize: 8,
            fontFamily: "IBM Plex Mono",
            marginTop: 2,
          }}
        >
          HP:{w.hp} СКР:{w.speed} УРН:{w.dmg}
        </div>
      </div>
    </div>
  );
}

function PVOCard({
  p,
  selected,
  onSelect,
  side,
}: {
  p: PVODef;
  selected: boolean;
  onSelect: () => void;
  side: "ru" | "ua";
}) {
  return (
    <div
      onClick={onSelect}
      style={{
        background: selected ? p.color + "22" : "#0d160d",
        border: `1px solid ${selected ? p.color : "#1a3a1a"}`,
        borderRadius: 4,
        padding: "6px 8px",
        cursor: "pointer",
        marginBottom: 4,
        display: "flex",
        alignItems: "center",
        gap: 8,
        transition: "all 0.15s",
      }}
    >
      <PVOIcon id={p.id} color={p.color} size={24} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            color: selected ? p.color : "#c8d4c8",
            fontSize: 9,
            fontFamily: "IBM Plex Mono",
            fontWeight: selected ? "bold" : "normal",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {p.name}
        </div>
        <div style={{ display: "flex", gap: 4, marginTop: 2, flexWrap: "wrap" }}>
          {p.detectsStealth && <Badge label="СТЕЛС" variant="stealth" />}
          {p.antiballistic && <Badge label="ЗПРР" variant="antiball" />}
        </div>
        <div
          style={{
            color: "#4a6a4a",
            fontSize: 8,
            fontFamily: "IBM Plex Mono",
            marginTop: 2,
          }}
        >
          РД:{p.range} СКС:{p.fireRate} УРН:{p.dmg}
        </div>
      </div>
      <div
        style={{
          fontSize: 7,
          color: side === "ru" ? "#ef4444" : "#3b82f6",
          fontFamily: "IBM Plex Mono",
          textAlign: "right",
          lineHeight: "12px",
        }}
      >
        {side === "ru" ? "РУС" : "НАТ"}
        <br />
        ПВО
      </div>
    </div>
  );
}

function SpawnBtn({
  sp,
  selected,
  onSelect,
  side,
}: {
  sp: SpawnPoint;
  selected: boolean;
  onSelect: () => void;
  side: "ru" | "ua";
}) {
  const isOwnSide = sp.side === side;
  if (!isOwnSide) return null;
  const col = side === "ru" ? "#ef4444" : "#3b82f6";
  return (
    <button
      onClick={onSelect}
      style={{
        background: selected ? col + "33" : "#0d160d",
        border: `1px solid ${selected ? col : "#1a3a1a"}`,
        borderRadius: 3,
        padding: "4px 6px",
        color: selected ? col : "#4a6a4a",
        fontSize: 8,
        fontFamily: "IBM Plex Mono",
        cursor: "pointer",
        margin: 2,
        minWidth: 60,
        transition: "all 0.12s",
      }}
    >
      {sp.label}
    </button>
  );
}

function OrderRow({ o, onRemove }: { o: OrderEntry; onRemove: () => void }) {
  const wdef = o.isPVO
    ? (o.side === "ua" ? UA_PVO : RU_PVO).find((p) => p.id === o.weaponId)
    : RU_WEAPONS.find((w) => w.id === o.weaponId);
  if (!wdef) return null;
  const col = o.side === "ru" ? "#f97316" : "#3b82f6";
  const spLabel = o.isPVO ? "КАРТА" : (SPAWN_POINTS.find((s) => s.id === o.spawnDir)?.label ?? "—");

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 6px",
        borderBottom: "1px solid #1a2a1a",
        fontSize: 8,
        fontFamily: "IBM Plex Mono",
        color: "#8aaa8a",
      }}
    >
      {o.isPVO ? (
        <PVOIcon id={o.weaponId} color={col} size={16} />
      ) : (
        <WeaponIcon id={o.weaponId} color={col} size={16} />
      )}
      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {wdef.name}
      </span>
      <span style={{ color: col }}>×{o.count}</span>
      <span style={{ color: "#4a5a4a" }}>{spLabel}</span>
      <button
        onClick={onRemove}
        style={{
          background: "none",
          border: "none",
          color: "#ef4444",
          cursor: "pointer",
          fontSize: 10,
          padding: "0 2px",
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}

function LogLine({ entry }: { entry: LogEntry }) {
  const colors: Record<string, string> = {
    intercept: "#4ade80",
    hit: "#f97316",
    destroy: "#ef4444",
    info: "#6b8a6b",
  };
  return (
    <div
      style={{
        fontSize: 8,
        fontFamily: "IBM Plex Mono",
        color: colors[entry.kind],
        padding: "1px 4px",
        borderBottom: "1px solid #0f1f0f",
      }}
    >
      [{entry.t}с] {entry.msg}
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function Index() {
  const [phase, setPhase] = useState<GamePhase>("setup");
  const [activeSide, setActiveSide] = useState<ActiveSide>("ru");
  const [mapView] = useState<MapView>("ukraine");
  const [panelTab, setPanelTab] = useState<PanelTab>("attack");

  // Selection state
  const [selectedWeapon, setSelectedWeapon] = useState<string>("shahed136");
  const [selectedPVO, setSelectedPVO] = useState<string>("patriot");
  const [selectedSpawn, setSelectedSpawn] = useState<SpawnDir>("belgorod");
  const [spawnCount, setSpawnCount] = useState<number>(1);
  const [placingPVO, setPlacingPVO] = useState<boolean>(false);

  // Orders
  const [orders, setOrders] = useState<OrderEntry[]>([]);

  // Simulation state
  const [bases, setBases] = useState<BaseCity[]>(INITIAL_BASES.map((b) => ({ ...b })));
  const [units, setUnits] = useState<ActiveUnit[]>([]);
  const [pvos, setPvos] = useState<ActivePVO[]>([]);
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [tick, setTick] = useState<number>(0);

  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  const tickRef = useRef<number>(0);
  const logRef = useRef<LogEntry[]>([]);

  // Sync tick ref
  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);
  useEffect(() => {
    logRef.current = log;
  }, [log]);

  // ── Add order
  function addAttackOrder() {
    if (panelTab !== "attack") return;
    const sp = SPAWN_POINTS.find((s) => s.id === selectedSpawn);
    if (!sp || sp.side !== activeSide) return;
    const existing = orders.find(
      (o) => !o.isPVO && o.weaponId === selectedWeapon && o.spawnDir === selectedSpawn && o.side === activeSide
    );
    if (existing) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === existing.id ? { ...o, count: o.count + spawnCount } : o
        )
      );
    } else {
      setOrders((prev) => [
        ...prev,
        {
          id: uid(),
          weaponId: selectedWeapon,
          count: spawnCount,
          spawnDir: selectedSpawn,
          side: activeSide,
          isPVO: false,
        },
      ]);
    }
  }

  // ── Add PVO by map click
  function handleMapClick(x: number, y: number) {
    if (phase !== "setup" || !placingPVO) return;
    const pvoList = activeSide === "ua" ? UA_PVO : RU_PVO;
    const def = pvoList.find((p) => p.id === selectedPVO);
    if (!def) return;
    for (let i = 0; i < spawnCount; i++) {
      setOrders((prev) => [
        ...prev,
        {
          id: uid(),
          weaponId: def.id,
          count: 1,
          spawnDir: "poland" as SpawnDir,
          side: activeSide,
          isPVO: true,
          pvoX: x + (i * 20 - (spawnCount * 10) / 2),
          pvoY: y,
        },
      ]);
    }
    setPlacingPVO(false);
  }

  // ── Start battle
  const startBattle = useCallback(() => {
    const newUnits: ActiveUnit[] = [];
    const newPvos: ActivePVO[] = [];

    orders.forEach((order) => {
      if (order.isPVO) {
        const def = getPVODef(order.weaponId, order.side);
        if (!def) return;
        const x = order.pvoX ?? 400;
        const y = order.pvoY ?? 300;
        newPvos.push({
          uid: uid(),
          defId: def.id,
          x,
          y,
          hp: 30,
          dead: false,
          side: order.side,
          isPVO: true,
          color: def.color,
          range: def.range,
          fireRate: def.fireRate,
          dmg: def.dmg,
          cooldown: 0,
          detectsStealth: def.detectsStealth ?? false,
          antiballistic: def.antiballistic ?? false,
        });
      } else {
        const wdef = getWeaponDef(order.weaponId);
        if (!wdef) return;
        const sp = getSpawnPoint(order.spawnDir);
        const uaBases = bases.filter((b) => b.hp > 0);
        for (let i = 0; i < order.count; i++) {
          if (uaBases.length === 0) break;
          const target = uaBases[Math.floor(Math.random() * uaBases.length)];
          newUnits.push({
            uid: uid(),
            weaponId: wdef.id,
            x: sp.x + (Math.random() - 0.5) * 30,
            y: sp.y + (Math.random() - 0.5) * 30,
            targetX: target.x,
            targetY: target.y,
            hp: wdef.hp,
            maxHp: wdef.hp,
            dead: false,
            intercepted: false,
            side: order.side,
            isPVO: false,
            color: wdef.color,
            speed: wdef.speed * (1 + (Math.random() - 0.5) * 0.2),
            dmg: wdef.dmg,
            stealth: wdef.stealth ?? false,
            ballistic: wdef.ballistic ?? false,
            hypersonic: wdef.hypersonic ?? false,
          });
        }
      }
    });

    setUnits(newUnits);
    setPvos(newPvos);
    setExplosions([]);
    setLog([]);
    setTick(0);
    lastTickRef.current = performance.now();
    setPhase("battle");
  }, [orders, bases]);

  // ── Game loop
  const gameLoop = useCallback(() => {
    const now = performance.now();
    if (now - lastTickRef.current < 50) {
      rafRef.current = requestAnimationFrame(gameLoop);
      return;
    }
    lastTickRef.current = now;

    setTick((t) => t + 1);

    setUnits((prevUnits) => {
      setPvos((prevPvos) => {
        setBases((prevBases) => {
          const newExplosions: Explosion[] = [];
          const newLog: LogEntry[] = [];
          const currentTick = tickRef.current;

          // Move units
          const movedUnits = prevUnits.map((u) => {
            if (u.dead || u.intercepted) return u;
            const d = dist(u.x, u.y, u.targetX, u.targetY);
            if (d < 8) return u; // will be handled below
            const vx = ((u.targetX - u.x) / d) * u.speed * 1.2;
            const vy = ((u.targetY - u.y) / d) * u.speed * 1.2;
            return { ...u, x: u.x + vx, y: u.y + vy };
          });

          // PVO fire
          const updatedPvos = prevPvos.map((pvo) => {
            if (pvo.dead) return pvo;
            if (pvo.cooldown > 0) return { ...pvo, cooldown: pvo.cooldown - 1 };
            return pvo;
          });

          // Check intercepts
          const interceptedIds = new Set<string>();
          const updatedPvos2 = updatedPvos.map((pvo) => {
            if (pvo.dead || pvo.cooldown > 0) return pvo;
            for (const u of movedUnits) {
              if (u.dead || u.intercepted || interceptedIds.has(u.uid)) continue;
              // stealth check
              if (u.stealth && !pvo.detectsStealth) continue;
              // ballistic check
              if (u.ballistic && !pvo.antiballistic && pvo.range < 120) continue;
              const d = dist(pvo.x, pvo.y, u.x, u.y);
              if (d <= pvo.range) {
                interceptedIds.add(u.uid);
                newExplosions.push({ uid: uid(), x: u.x, y: u.y, t: 0 });
                newLog.push({
                  t: currentTick,
                  msg: `ПВО уничтожило ${u.weaponId} [${Math.round(u.x)},${Math.round(u.y)}]`,
                  kind: "intercept",
                });
                return { ...pvo, cooldown: Math.max(1, Math.round(60 / pvo.fireRate)) };
              }
            }
            return pvo;
          });

          // Apply intercepts
          const finalUnits = movedUnits.map((u) =>
            interceptedIds.has(u.uid) ? { ...u, intercepted: true } : u
          );

          // Check hits on bases
          const hitBaseIds = new Set<string>();
          const hitByUnit: { uid: string; baseId: string; dmg: number }[] = [];
          for (const u of finalUnits) {
            if (u.dead || u.intercepted) continue;
            for (const b of prevBases) {
              if (b.hp <= 0) continue;
              const d = dist(u.x, u.y, b.x, b.y);
              if (d < 12) {
                hitByUnit.push({ uid: u.uid, baseId: b.id, dmg: u.dmg });
                hitBaseIds.add(b.id);
                newExplosions.push({ uid: uid(), x: u.x, y: u.y, t: 0 });
                newLog.push({
                  t: currentTick,
                  msg: `${b.label} поражена! -${u.dmg} HP (${u.weaponId})`,
                  kind: "hit",
                });
              }
            }
          }

          // Update bases
          const updatedBases = prevBases.map((b) => {
            const hits = hitByUnit.filter((h) => h.baseId === b.id);
            const totalDmg = hits.reduce((acc, h) => acc + h.dmg, 0);
            const newHp = Math.max(0, b.hp - totalDmg);
            if (newHp <= 0 && b.hp > 0) {
              newLog.push({ t: currentTick, msg: `${b.label} УНИЧТОЖЕНА!`, kind: "destroy" });
            }
            return { ...b, hp: newHp };
          });

          // Mark hit units as dead
          const hitUnitIds = new Set(hitByUnit.map((h) => h.uid));
          const finalUnits2 = finalUnits.map((u) =>
            hitUnitIds.has(u.uid) ? { ...u, dead: true } : u
          );

          // Expire explosions
          setExplosions((prev) => {
            const alive = prev
              .map((e) => ({ ...e, t: e.t + 1 }))
              .filter((e) => e.t < 40);
            return [...alive, ...newExplosions];
          });

          if (newLog.length > 0) {
            setLog((prev) => [...newLog, ...prev].slice(0, 80));
          }

          // Check end condition
          const allDead = finalUnits2.every((u) => u.dead || u.intercepted);
          const allDestroyed = updatedBases.every((b) => b.hp <= 0);
          if (allDead || allDestroyed) {
            setTimeout(() => setPhase("result"), 600);
          }

          // Write back pvos
          setTimeout(() => setPvos(updatedPvos2), 0);

          return updatedBases;
        });
        return prevPvos; // will be overwritten by setTimeout above
      });
      return prevUnits; // will be overwritten
    });

    rafRef.current = requestAnimationFrame(gameLoop);
  }, []);

  // Proper game loop with direct state refs
  const unitsRef = useRef<ActiveUnit[]>([]);
  const pvosRef = useRef<ActivePVO[]>([]);
  const basesRef = useRef<BaseCity[]>(INITIAL_BASES.map((b) => ({ ...b })));
  const explosionsRef = useRef<Explosion[]>([]);

  useEffect(() => {
    unitsRef.current = units;
  }, [units]);
  useEffect(() => {
    pvosRef.current = pvos;
  }, [pvos]);
  useEffect(() => {
    basesRef.current = bases;
  }, [bases]);
  useEffect(() => {
    explosionsRef.current = explosions;
  }, [explosions]);

  const runLoop = useCallback(() => {
    const now = performance.now();
    if (now - lastTickRef.current < 50) {
      rafRef.current = requestAnimationFrame(runLoop);
      return;
    }
    lastTickRef.current = now;

    const curUnits = unitsRef.current;
    const curPvos = pvosRef.current;
    const curBases = basesRef.current;
    const curTick = tickRef.current + 1;
    tickRef.current = curTick;

    const newExplosions: Explosion[] = [];
    const newLogEntries: LogEntry[] = [];

    // Move units toward targets
    const movedUnits: ActiveUnit[] = curUnits.map((u) => {
      if (u.dead || u.intercepted) return u;
      const d = dist(u.x, u.y, u.targetX, u.targetY);
      if (d < 8) return u;
      const vx = ((u.targetX - u.x) / d) * u.speed * 1.5;
      const vy = ((u.targetY - u.y) / d) * u.speed * 1.5;
      return { ...u, x: u.x + vx, y: u.y + vy };
    });

    // PVO fire at units in range
    const interceptedIds = new Set<string>();
    const updatedPvos: ActivePVO[] = curPvos.map((pvo) => {
      if (pvo.dead) return pvo;
      let cd = pvo.cooldown;
      if (cd > 0) return { ...pvo, cooldown: cd - 1 };
      for (const u of movedUnits) {
        if (u.dead || u.intercepted || interceptedIds.has(u.uid)) continue;
        if (u.stealth && !pvo.detectsStealth) continue;
        if (u.ballistic && !pvo.antiballistic && pvo.range < 120) continue;
        if (pvo.side === u.side) continue; // don't shoot own units
        const d = dist(pvo.x, pvo.y, u.x, u.y);
        if (d <= pvo.range) {
          interceptedIds.add(u.uid);
          newExplosions.push({ uid: uid(), x: u.x, y: u.y, t: 0 });
          newLogEntries.push({
            t: curTick,
            msg: `[ПВО] ${pvo.defId} сбил ${u.weaponId}`,
            kind: "intercept",
          });
          cd = Math.max(1, Math.round(60 / pvo.fireRate));
          return { ...pvo, cooldown: cd };
        }
      }
      return pvo;
    });

    // Apply intercepts to units
    const postInterceptUnits: ActiveUnit[] = movedUnits.map((u) =>
      interceptedIds.has(u.uid) ? { ...u, intercepted: true } : u
    );

    // Check hits on bases
    const hitByUnit: { uid: string; baseId: string; dmg: number }[] = [];
    for (const u of postInterceptUnits) {
      if (u.dead || u.intercepted) continue;
      for (const b of curBases) {
        if (b.hp <= 0) continue;
        if (u.side !== "ru") continue; // only Russia targets UA bases
        const d = dist(u.x, u.y, b.x, b.y);
        if (d < 12) {
          hitByUnit.push({ uid: u.uid, baseId: b.id, dmg: u.dmg });
          newExplosions.push({ uid: uid(), x: u.x, y: u.y, t: 0 });
          newLogEntries.push({
            t: curTick,
            msg: `[УДАР] ${b.label} -${u.dmg}HP (${u.weaponId})`,
            kind: "hit",
          });
        }
      }
    }

    const hitUnitIds = new Set(hitByUnit.map((h) => h.uid));
    const finalUnits: ActiveUnit[] = postInterceptUnits.map((u) =>
      hitUnitIds.has(u.uid) ? { ...u, dead: true } : u
    );

    // Update bases
    const updatedBases: BaseCity[] = curBases.map((b) => {
      const dmg = hitByUnit.filter((h) => h.baseId === b.id).reduce((a, h) => a + h.dmg, 0);
      const newHp = Math.max(0, b.hp - dmg);
      if (newHp <= 0 && b.hp > 0) {
        newLogEntries.push({ t: curTick, msg: `[!] ${b.label} УНИЧТОЖЕНА`, kind: "destroy" });
      }
      return { ...b, hp: newHp };
    });

    // Update explosions
    const updatedExplosions = [
      ...explosionsRef.current.map((e) => ({ ...e, t: e.t + 1 })).filter((e) => e.t < 40),
      ...newExplosions,
    ];

    // Commit state
    unitsRef.current = finalUnits;
    pvosRef.current = updatedPvos;
    basesRef.current = updatedBases;
    explosionsRef.current = updatedExplosions;

    setUnits([...finalUnits]);
    setPvos([...updatedPvos]);
    setBases([...updatedBases]);
    setExplosions([...updatedExplosions]);
    setTick(curTick);

    if (newLogEntries.length > 0) {
      setLog((prev) => [...newLogEntries, ...prev].slice(0, 100));
    }

    // End check
    const allGone = finalUnits.every((u) => u.dead || u.intercepted);
    const allDestroyed = updatedBases.every((b) => b.hp <= 0);
    if (allGone || allDestroyed) {
      setPhase("result");
      return;
    }

    rafRef.current = requestAnimationFrame(runLoop);
  }, []);

  useEffect(() => {
    if (phase === "battle") {
      lastTickRef.current = performance.now();
      rafRef.current = requestAnimationFrame(runLoop);
    } else {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [phase, runLoop]);

  // Suppress unused warning for gameLoop
  void gameLoop;

  function pauseResume() {
    setPhase((p) => (p === "battle" ? "paused" : "battle"));
  }

  function reset() {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setPhase("setup");
    setOrders([]);
    setBases(INITIAL_BASES.map((b) => ({ ...b })));
    basesRef.current = INITIAL_BASES.map((b) => ({ ...b }));
    setUnits([]);
    unitsRef.current = [];
    setPvos([]);
    pvosRef.current = [];
    setExplosions([]);
    explosionsRef.current = [];
    setLog([]);
    setTick(0);
    tickRef.current = 0;
    setPlacingPVO(false);
  }

  function handleStartBattle() {
    // Initialize refs before starting
    const newUnits: ActiveUnit[] = [];
    const newPvos: ActivePVO[] = [];
    const newBases = INITIAL_BASES.map((b) => ({ ...b }));

    orders.forEach((order) => {
      if (order.isPVO) {
        const def = getPVODef(order.weaponId, order.side);
        if (!def) return;
        newPvos.push({
          uid: uid(),
          defId: def.id,
          x: order.pvoX ?? 400,
          y: order.pvoY ?? 300,
          hp: 30,
          dead: false,
          side: order.side,
          isPVO: true,
          color: def.color,
          range: def.range,
          fireRate: def.fireRate,
          dmg: def.dmg,
          cooldown: 0,
          detectsStealth: def.detectsStealth ?? false,
          antiballistic: def.antiballistic ?? false,
        });
      } else {
        const wdef = getWeaponDef(order.weaponId);
        if (!wdef) return;
        const sp = getSpawnPoint(order.spawnDir);
        for (let i = 0; i < order.count; i++) {
          const target = newBases[Math.floor(Math.random() * newBases.length)];
          newUnits.push({
            uid: uid(),
            weaponId: wdef.id,
            x: sp.x + (Math.random() - 0.5) * 40,
            y: sp.y + (Math.random() - 0.5) * 40,
            targetX: target.x,
            targetY: target.y,
            hp: wdef.hp,
            maxHp: wdef.hp,
            dead: false,
            intercepted: false,
            side: order.side,
            isPVO: false,
            color: wdef.color,
            speed: wdef.speed * (0.9 + Math.random() * 0.2),
            dmg: wdef.dmg,
            stealth: wdef.stealth ?? false,
            ballistic: wdef.ballistic ?? false,
            hypersonic: wdef.hypersonic ?? false,
          });
        }
      }
    });

    unitsRef.current = newUnits;
    pvosRef.current = newPvos;
    basesRef.current = newBases;
    explosionsRef.current = [];
    tickRef.current = 0;

    setUnits(newUnits);
    setPvos(newPvos);
    setBases(newBases);
    setExplosions([]);
    setLog([]);
    setTick(0);
    lastTickRef.current = performance.now();
    setPhase("battle");
  }

  // Stats for result screen
  const totalIntercepted = units.filter((u) => u.intercepted).length;
  const totalHit = units.filter((u) => u.dead && !u.intercepted).length;
  const basesDestroyed = bases.filter((b) => b.hp <= 0).length;
  const totalDmgDealt = INITIAL_BASES.reduce((acc, b) => {
    const cur = bases.find((bb) => bb.id === b.id);
    return acc + (b.maxHp - (cur?.hp ?? 0));
  }, 0);

  const ruSpawns = SPAWN_POINTS.filter((s) => s.side === "ru");
  const uaSpawns = SPAWN_POINTS.filter((s) => s.side === "ua");

  const activeWeaponList = RU_WEAPONS;
  const activePVOList = activeSide === "ua" ? UA_PVO : RU_PVO;

  const accentColor = activeSide === "ru" ? "#ef4444" : "#3b82f6";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#070d07",
        fontFamily: "IBM Plex Mono, monospace",
        color: "#c8d4c8",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* ── TOP BAR ── */}
      <div
        style={{
          background: "#090f09",
          borderBottom: "1px solid #1a3a1a",
          padding: "6px 12px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        {/* Title */}
        <div
          style={{
            color: "#4ade80",
            fontSize: 12,
            fontWeight: "bold",
            letterSpacing: 3,
            whiteSpace: "nowrap",
          }}
        >
          ОПЕРАЦИЯ РУБЕЖ 2.0
        </div>

        <div style={{ width: 1, height: 24, background: "#1a3a1a" }} />

        {/* Map selector */}
        <div style={{ display: "flex", gap: 4 }}>
          <button
            style={{
              background: mapView === "ukraine" ? "#1a3a1a" : "transparent",
              border: "1px solid #1a3a1a",
              color: mapView === "ukraine" ? "#4ade80" : "#4a6a4a",
              fontSize: 9,
              padding: "3px 8px",
              borderRadius: 3,
              cursor: "pointer",
              fontFamily: "IBM Plex Mono",
            }}
          >
            УКРАИНА
          </button>
          <button
            style={{
              background: mapView === "russia" ? "#1a3a1a" : "transparent",
              border: "1px solid #1a3a1a",
              color: mapView === "russia" ? "#4ade80" : "#4a6a4a",
              fontSize: 9,
              padding: "3px 8px",
              borderRadius: 3,
              cursor: "pointer",
              fontFamily: "IBM Plex Mono",
            }}
          >
            РОССИЯ
          </button>
        </div>

        <div style={{ width: 1, height: 24, background: "#1a3a1a" }} />

        {/* Side selector */}
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={() => {
              setActiveSide("ru");
              setSelectedSpawn("belgorod");
            }}
            style={{
              background: activeSide === "ru" ? "#ef444422" : "transparent",
              border: `1px solid ${activeSide === "ru" ? "#ef4444" : "#1a3a1a"}`,
              color: activeSide === "ru" ? "#ef4444" : "#4a6a4a",
              fontSize: 9,
              padding: "3px 10px",
              borderRadius: 3,
              cursor: "pointer",
              fontFamily: "IBM Plex Mono",
              fontWeight: activeSide === "ru" ? "bold" : "normal",
            }}
          >
            РОССИЯ
          </button>
          <button
            onClick={() => {
              setActiveSide("ua");
              setSelectedSpawn("poland");
            }}
            style={{
              background: activeSide === "ua" ? "#3b82f622" : "transparent",
              border: `1px solid ${activeSide === "ua" ? "#3b82f6" : "#1a3a1a"}`,
              color: activeSide === "ua" ? "#3b82f6" : "#4a6a4a",
              fontSize: 9,
              padding: "3px 10px",
              borderRadius: 3,
              cursor: "pointer",
              fontFamily: "IBM Plex Mono",
              fontWeight: activeSide === "ua" ? "bold" : "normal",
            }}
          >
            УКРАИНА/НАТО
          </button>
        </div>

        <div style={{ flex: 1 }} />

        {/* Status */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 9,
            color: "#4a6a4a",
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background:
                phase === "battle"
                  ? "#4ade80"
                  : phase === "result"
                  ? "#ef4444"
                  : phase === "paused"
                  ? "#facc15"
                  : "#4a6a4a",
              boxShadow:
                phase === "battle" ? "0 0 6px #4ade80" : "none",
            }}
          />
          <span>
            {phase === "setup"
              ? "ПОДГОТОВКА"
              : phase === "battle"
              ? `ТИК: ${tick}`
              : phase === "paused"
              ? "ПАУЗА"
              : "ЗАВЕРШЕНО"}
          </span>
        </div>

        <div style={{ width: 1, height: 24, background: "#1a3a1a" }} />

        {/* Control buttons */}
        {phase === "setup" && (
          <button
            onClick={handleStartBattle}
            disabled={orders.length === 0}
            style={{
              background: orders.length > 0 ? "#ef444422" : "#0d160d",
              border: `1px solid ${orders.length > 0 ? "#ef4444" : "#1a3a1a"}`,
              color: orders.length > 0 ? "#ef4444" : "#2a4a2a",
              fontSize: 10,
              padding: "4px 14px",
              borderRadius: 3,
              cursor: orders.length > 0 ? "pointer" : "not-allowed",
              fontFamily: "IBM Plex Mono",
              fontWeight: "bold",
              letterSpacing: 1,
            }}
          >
            ЗАПУСК
          </button>
        )}
        {(phase === "battle" || phase === "paused") && (
          <button
            onClick={pauseResume}
            style={{
              background: "#facc1522",
              border: "1px solid #facc15",
              color: "#facc15",
              fontSize: 10,
              padding: "4px 12px",
              borderRadius: 3,
              cursor: "pointer",
              fontFamily: "IBM Plex Mono",
            }}
          >
            {phase === "battle" ? "ПАУЗА" : "ПРОДОЛЖ"}
          </button>
        )}
        <button
          onClick={reset}
          style={{
            background: "transparent",
            border: "1px solid #1a3a1a",
            color: "#4a6a4a",
            fontSize: 10,
            padding: "4px 10px",
            borderRadius: 3,
            cursor: "pointer",
            fontFamily: "IBM Plex Mono",
          }}
        >
          СБРОС
        </button>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", height: "calc(100vh - 44px)" }}>
        {/* ── LEFT PANEL ── */}
        <div
          style={{
            width: 300,
            minWidth: 300,
            background: "#090f09",
            borderRight: "1px solid #1a3a1a",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Tabs */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid #1a3a1a",
            }}
          >
            {(["attack", "pvo", "log"] as PanelTab[]).map((tab) => {
              const labels: Record<PanelTab, string> = {
                attack: "АТАКА",
                pvo: "ПВО",
                log: "ЖУРНАЛ",
              };
              return (
                <button
                  key={tab}
                  onClick={() => setPanelTab(tab)}
                  style={{
                    flex: 1,
                    background: panelTab === tab ? "#0d1a0d" : "transparent",
                    border: "none",
                    borderBottom: `2px solid ${panelTab === tab ? accentColor : "transparent"}`,
                    color: panelTab === tab ? accentColor : "#4a6a4a",
                    fontSize: 9,
                    padding: "6px 0",
                    cursor: "pointer",
                    fontFamily: "IBM Plex Mono",
                    letterSpacing: 1,
                  }}
                >
                  {labels[tab]}
                </button>
              );
            })}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
            {/* ATTACK TAB */}
            {panelTab === "attack" && (
              <div>
                <div
                  style={{
                    fontSize: 8,
                    color: "#4a6a4a",
                    letterSpacing: 2,
                    marginBottom: 6,
                    textTransform: "uppercase",
                  }}
                >
                  ВЫБЕРИТЕ ОРУЖИЕ
                </div>
                {activeWeaponList.map((w) => (
                  <WeaponCard
                    key={w.id}
                    w={w}
                    selected={selectedWeapon === w.id}
                    onSelect={() => setSelectedWeapon(w.id)}
                  />
                ))}

                <div
                  style={{
                    fontSize: 8,
                    color: "#4a6a4a",
                    letterSpacing: 2,
                    margin: "10px 0 6px",
                    textTransform: "uppercase",
                  }}
                >
                  ТОЧКА ВЫЛЕТА
                </div>
                <div style={{ display: "flex", flexWrap: "wrap" }}>
                  {(activeSide === "ru" ? ruSpawns : uaSpawns).map((sp) => (
                    <SpawnBtn
                      key={sp.id}
                      sp={sp}
                      selected={selectedSpawn === sp.id}
                      onSelect={() => setSelectedSpawn(sp.id)}
                      side={activeSide}
                    />
                  ))}
                </div>

                <div
                  style={{
                    fontSize: 8,
                    color: "#4a6a4a",
                    letterSpacing: 2,
                    margin: "10px 0 6px",
                  }}
                >
                  КОЛИЧЕСТВО
                </div>
                <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                  {[1, 5, 10, 25].map((n) => (
                    <button
                      key={n}
                      onClick={() => setSpawnCount(n)}
                      style={{
                        background: spawnCount === n ? accentColor + "22" : "#0d160d",
                        border: `1px solid ${spawnCount === n ? accentColor : "#1a3a1a"}`,
                        color: spawnCount === n ? accentColor : "#4a6a4a",
                        fontSize: 9,
                        padding: "3px 8px",
                        borderRadius: 3,
                        cursor: "pointer",
                        fontFamily: "IBM Plex Mono",
                      }}
                    >
                      +{n}
                    </button>
                  ))}
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={spawnCount}
                    onChange={(e) => setSpawnCount(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{
                      width: 44,
                      background: "#0d160d",
                      border: "1px solid #1a3a1a",
                      color: "#c8d4c8",
                      fontSize: 9,
                      padding: "3px 4px",
                      borderRadius: 3,
                      fontFamily: "IBM Plex Mono",
                    }}
                  />
                </div>

                <button
                  onClick={addAttackOrder}
                  disabled={phase !== "setup"}
                  style={{
                    width: "100%",
                    background: phase === "setup" ? accentColor + "22" : "#0d160d",
                    border: `1px solid ${phase === "setup" ? accentColor : "#1a3a1a"}`,
                    color: phase === "setup" ? accentColor : "#2a4a2a",
                    fontSize: 9,
                    padding: "5px",
                    borderRadius: 3,
                    cursor: phase === "setup" ? "pointer" : "not-allowed",
                    fontFamily: "IBM Plex Mono",
                    letterSpacing: 1,
                    marginBottom: 8,
                  }}
                >
                  + ДОБАВИТЬ В ВОЛНУ
                </button>

                {/* Orders list */}
                {orders.filter((o) => !o.isPVO && o.side === activeSide).length > 0 && (
                  <div>
                    <div style={{ fontSize: 8, color: "#4a6a4a", letterSpacing: 2, marginBottom: 4 }}>
                      ОЧЕРЕДЬ АТАКИ
                    </div>
                    <div
                      style={{
                        border: "1px solid #1a3a1a",
                        borderRadius: 3,
                        overflow: "hidden",
                      }}
                    >
                      {orders
                        .filter((o) => !o.isPVO && o.side === activeSide)
                        .map((o) => (
                          <OrderRow
                            key={o.id}
                            o={o}
                            onRemove={() => setOrders((prev) => prev.filter((x) => x.id !== o.id))}
                          />
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PVO TAB */}
            {panelTab === "pvo" && (
              <div>
                <div
                  style={{
                    fontSize: 8,
                    color: "#4a6a4a",
                    letterSpacing: 2,
                    marginBottom: 6,
                  }}
                >
                  СИСТЕМЫ ПВО ({activeSide === "ua" ? "НАТО/УКРАИНА" : "РОССИЯ"})
                </div>
                {activePVOList.map((p) => (
                  <PVOCard
                    key={p.id}
                    p={p}
                    selected={selectedPVO === p.id}
                    onSelect={() => setSelectedPVO(p.id)}
                    side={activeSide}
                  />
                ))}

                <div
                  style={{
                    fontSize: 8,
                    color: "#4a6a4a",
                    letterSpacing: 2,
                    margin: "10px 0 6px",
                  }}
                >
                  КОЛИЧЕСТВО
                </div>
                <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                  {[1, 3, 5, 10].map((n) => (
                    <button
                      key={n}
                      onClick={() => setSpawnCount(n)}
                      style={{
                        background: spawnCount === n ? accentColor + "22" : "#0d160d",
                        border: `1px solid ${spawnCount === n ? accentColor : "#1a3a1a"}`,
                        color: spawnCount === n ? accentColor : "#4a6a4a",
                        fontSize: 9,
                        padding: "3px 8px",
                        borderRadius: 3,
                        cursor: "pointer",
                        fontFamily: "IBM Plex Mono",
                      }}
                    >
                      ×{n}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setPlacingPVO((v) => !v)}
                  disabled={phase !== "setup"}
                  style={{
                    width: "100%",
                    background:
                      placingPVO
                        ? "#facc1522"
                        : phase === "setup"
                        ? accentColor + "22"
                        : "#0d160d",
                    border: `1px solid ${placingPVO ? "#facc15" : phase === "setup" ? accentColor : "#1a3a1a"}`,
                    color: placingPVO ? "#facc15" : phase === "setup" ? accentColor : "#2a4a2a",
                    fontSize: 9,
                    padding: "5px",
                    borderRadius: 3,
                    cursor: phase === "setup" ? "pointer" : "not-allowed",
                    fontFamily: "IBM Plex Mono",
                    letterSpacing: 1,
                    marginBottom: 8,
                  }}
                >
                  {placingPVO ? "КЛИКНИТЕ НА КАРТЕ..." : "РАЗМЕСТИТЬ НА КАРТЕ"}
                </button>

                {/* PVO Orders list */}
                {orders.filter((o) => o.isPVO && o.side === activeSide).length > 0 && (
                  <div>
                    <div style={{ fontSize: 8, color: "#4a6a4a", letterSpacing: 2, marginBottom: 4 }}>
                      РАЗМЕЩЁННЫЕ ПВО
                    </div>
                    <div
                      style={{
                        border: "1px solid #1a3a1a",
                        borderRadius: 3,
                        overflow: "hidden",
                      }}
                    >
                      {orders
                        .filter((o) => o.isPVO && o.side === activeSide)
                        .map((o) => (
                          <OrderRow
                            key={o.id}
                            o={o}
                            onRemove={() => setOrders((prev) => prev.filter((x) => x.id !== o.id))}
                          />
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* LOG TAB */}
            {panelTab === "log" && (
              <div>
                <div style={{ fontSize: 8, color: "#4a6a4a", letterSpacing: 2, marginBottom: 6 }}>
                  БОЕВОЙ ЖУРНАЛ
                </div>
                {log.length === 0 && (
                  <div style={{ fontSize: 9, color: "#2a4a2a", fontFamily: "IBM Plex Mono" }}>
                    Журнал пуст
                  </div>
                )}
                {log.map((entry, i) => (
                  <LogLine key={i} entry={entry} />
                ))}
              </div>
            )}
          </div>

          {/* Bottom status bar */}
          <div
            style={{
              borderTop: "1px solid #1a3a1a",
              padding: "6px 8px",
              fontSize: 8,
              color: "#4a6a4a",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>
              АТАК: {orders.filter((o) => !o.isPVO).reduce((a, o) => a + o.count, 0)}
            </span>
            <span>
              ПВО: {orders.filter((o) => o.isPVO).length}
            </span>
            <span>
              ЦЕЛЕЙ: {orders.filter((o) => !o.isPVO).length}
            </span>
          </div>
        </div>

        {/* ── MAP ── */}
        <div
          style={{
            flex: 1,
            position: "relative",
            overflow: "hidden",
            background: "#070d07",
          }}
        >
          <UkraineMap
            bases={bases}
            units={units}
            pvos={pvos}
            explosions={explosions}
            onMapClick={handleMapClick}
            phase={phase}
            placingPVO={placingPVO}
          />

          {/* Result overlay */}
          {phase === "result" && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "#070d07dd",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div
                style={{
                  fontSize: 22,
                  fontWeight: "bold",
                  letterSpacing: 4,
                  color: basesDestroyed > 2 ? "#ef4444" : "#4ade80",
                  fontFamily: "IBM Plex Mono",
                  textShadow: `0 0 20px ${basesDestroyed > 2 ? "#ef4444" : "#4ade80"}`,
                }}
              >
                {basesDestroyed > 2 ? "РОССИЯ ПОБЕДИЛА" : "УКРАИНА УСТОЯЛА"}
              </div>

              <div
                style={{
                  background: "#0d160d",
                  border: "1px solid #1a3a1a",
                  borderRadius: 6,
                  padding: "16px 24px",
                  minWidth: 320,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: "#4a6a4a",
                    letterSpacing: 2,
                    marginBottom: 12,
                    textAlign: "center",
                  }}
                >
                  ИТОГИ ОПЕРАЦИИ
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    { label: "Перехвачено целей", value: totalIntercepted, color: "#4ade80" },
                    { label: "Целей прорвалось", value: totalHit, color: "#f97316" },
                    { label: "Городов поражено", value: basesDestroyed, color: "#ef4444" },
                    { label: "Нанесено урона", value: totalDmgDealt, color: "#facc15" },
                    { label: "Тактических тиков", value: tick, color: "#3b82f6" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 10,
                        fontFamily: "IBM Plex Mono",
                      }}
                    >
                      <span style={{ color: "#8aaa8a" }}>{stat.label}</span>
                      <span style={{ color: stat.color, fontWeight: "bold" }}>{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={reset}
                style={{
                  background: "#1a3a1a",
                  border: "1px solid #4ade80",
                  color: "#4ade80",
                  fontSize: 11,
                  padding: "8px 24px",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontFamily: "IBM Plex Mono",
                  letterSpacing: 2,
                }}
              >
                НОВАЯ ОПЕРАЦИЯ
              </button>
            </div>
          )}

          {/* Live stats overlay (during battle) */}
          {(phase === "battle" || phase === "paused") && (
            <div
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                background: "#090f09cc",
                border: "1px solid #1a3a1a",
                borderRadius: 4,
                padding: "6px 10px",
                fontSize: 8,
                fontFamily: "IBM Plex Mono",
                color: "#4a6a4a",
                minWidth: 140,
              }}
            >
              <div style={{ color: "#facc15", marginBottom: 4, letterSpacing: 1 }}>
                {phase === "paused" ? "■ ПАУЗА" : "▶ БОЕВЫЕ ДЕЙСТВИЯ"}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span>Активных целей:</span>
                <span style={{ color: "#ef4444" }}>
                  {units.filter((u) => !u.dead && !u.intercepted).length}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span>Перехвачено:</span>
                <span style={{ color: "#4ade80" }}>{totalIntercepted}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span>Поражено:</span>
                <span style={{ color: "#f97316" }}>{totalHit}</span>
              </div>
              <div style={{ marginTop: 6, borderTop: "1px solid #1a3a1a", paddingTop: 4 }}>
                {bases.map((b) => {
                  const pct = b.hp / b.maxHp;
                  const col = pct > 0.6 ? "#4ade80" : pct > 0.3 ? "#facc15" : "#ef4444";
                  return (
                    <div
                      key={b.id}
                      style={{ display: "flex", justifyContent: "space-between", marginBottom: 1 }}
                    >
                      <span>{b.label}</span>
                      <span style={{ color: col }}>
                        {b.hp}/{b.maxHp}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT SIDE PANEL (summary) ── */}
        <div
          style={{
            width: 200,
            minWidth: 200,
            background: "#090f09",
            borderLeft: "1px solid #1a3a1a",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              borderBottom: "1px solid #1a3a1a",
              padding: "6px 8px",
              fontSize: 8,
              color: "#4a6a4a",
              letterSpacing: 2,
            }}
          >
            СОСТОЯНИЕ ЦЕЛЕЙ
          </div>

          <div style={{ padding: "8px", flex: 1, overflowY: "auto" }}>
            {bases.map((b) => {
              const pct = b.hp / b.maxHp;
              const col = pct > 0.6 ? "#4ade80" : pct > 0.3 ? "#facc15" : "#ef4444";
              return (
                <div
                  key={b.id}
                  style={{
                    marginBottom: 10,
                    borderBottom: "1px solid #0f1f0f",
                    paddingBottom: 8,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 9,
                      fontFamily: "IBM Plex Mono",
                      marginBottom: 3,
                    }}
                  >
                    <span style={{ color: col }}>{b.label}</span>
                    <span style={{ color: col }}>
                      {Math.round(pct * 100)}%
                    </span>
                  </div>
                  <div
                    style={{
                      height: 4,
                      background: "#0d160d",
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${pct * 100}%`,
                        background: col,
                        borderRadius: 2,
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                  <div
                    style={{ fontSize: 7, color: "#2a4a2a", marginTop: 2, fontFamily: "IBM Plex Mono" }}
                  >
                    {b.hp} / {b.maxHp} HP
                  </div>
                </div>
              );
            })}
          </div>

          {/* Spawn info */}
          <div
            style={{
              borderTop: "1px solid #1a3a1a",
              padding: "6px 8px",
              fontSize: 7,
              color: "#2a4a2a",
              fontFamily: "IBM Plex Mono",
            }}
          >
            <div style={{ marginBottom: 4, color: "#4a6a4a", letterSpacing: 1 }}>ТОЧКИ ВЫЛЕТА</div>
            {SPAWN_POINTS.map((sp) => (
              <div
                key={sp.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 2,
                  color: sp.side === "ru" ? "#ef444460" : "#3b82f660",
                }}
              >
                <span>{sp.label}</span>
                <span style={{ color: sp.side === "ru" ? "#ef4444" : "#3b82f6" }}>
                  {sp.side === "ru" ? "РУС" : "НАТ"}
                </span>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div
            style={{
              borderTop: "1px solid #1a3a1a",
              padding: "6px 8px",
              fontSize: 7,
              color: "#2a4a2a",
              fontFamily: "IBM Plex Mono",
            }}
          >
            <div style={{ marginBottom: 4, color: "#4a6a4a", letterSpacing: 1 }}>ЛЕГЕНДА</div>
            {[
              { col: "#f97316", label: "Дроны RU" },
              { col: "#dc2626", label: "Ракеты RU" },
              { col: "#3b82f6", label: "ПВО NATO" },
              { col: "#ef4444", label: "ПВО RUS" },
              { col: "#4ade80", label: "Цели" },
            ].map((item) => (
              <div
                key={item.label}
                style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: item.col,
                  }}
                />
                <span style={{ color: "#4a6a4a" }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
