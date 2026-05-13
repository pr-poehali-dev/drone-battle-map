import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════
type Phase = "setup" | "battle" | "paused" | "result";
type Side = "ru" | "ua";
type Tab = "attack" | "pvo" | "log";

interface WeaponDef {
  id: string; side: Side; name: string;
  hp: number; speed: number; dmg: number; color: string;
  stealth?: boolean; ballistic?: boolean; hypersonic?: boolean; cruise?: boolean;
}
interface PVODef {
  id: string; side: Side; name: string;
  range: number; fireRate: number; dmg: number; color: string;
  detectsStealth?: boolean; antiballistic?: boolean;
}
interface SpawnPt { id: string; label: string; x: number; y: number; side: Side; }
interface City { id: string; label: string; x: number; y: number; maxHp: number; hp: number; }
interface ActiveUnit {
  uid: string; wid: string; x: number; y: number; tx: number; ty: number;
  hp: number; maxHp: number; speed: number; dmg: number; side: Side;
  color: string; dead: boolean; hit: boolean;
  stealth: boolean; ballistic: boolean; hypersonic: boolean;
}
interface ActivePVO {
  uid: string; pid: string; x: number; y: number;
  range: number; fireRate: number; dmg: number; side: Side;
  color: string; cd: number; dead: boolean;
  detectsStealth: boolean; antiballistic: boolean;
}
interface Boom { uid: string; x: number; y: number; age: number; }
interface Order { id: string; wid: string; count: number; spawnId: string; side: Side; isPVO: boolean; px?: number; py?: number; }

// ═══════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════
const RU_WEAPONS: WeaponDef[] = [
  { id: "shahed136", side: "ru", name: "Shahed-136/Герань-2", hp: 2, speed: 0.85, dmg: 22, color: "#f97316" },
  { id: "lancet3",   side: "ru", name: "Ланцет-3",             hp: 3, speed: 1.2,  dmg: 18, color: "#fb923c" },
  { id: "orlan10",   side: "ru", name: "Орлан-10",             hp: 1, speed: 1.4,  dmg: 5,  color: "#94a3b8", stealth: true },
  { id: "geran1m",   side: "ru", name: "Герань-1М",            hp: 2, speed: 0.9,  dmg: 20, color: "#ef4444" },
  { id: "kub",       side: "ru", name: "БПЛА КУБ-БЛА",         hp: 2, speed: 1.3,  dmg: 15, color: "#f59e0b" },
  { id: "kalibr",    side: "ru", name: "3М-14 Калибр",          hp: 5, speed: 1.5,  dmg: 45, color: "#dc2626", cruise: true },
  { id: "kh101",     side: "ru", name: "Х-101",                hp: 4, speed: 1.3,  dmg: 50, color: "#b91c1c", stealth: true, cruise: true },
  { id: "iskander",  side: "ru", name: "Искандер-М (9М723)",   hp: 6, speed: 2.5,  dmg: 60, color: "#7c3aed", ballistic: true },
  { id: "kinzhal",   side: "ru", name: "Кинжал (Х-47М2)",      hp: 8, speed: 4.0,  dmg: 75, color: "#6d28d9", ballistic: true, hypersonic: true },
  { id: "kh22",      side: "ru", name: "Х-22 «Буря»",          hp: 5, speed: 2.0,  dmg: 65, color: "#9333ea", ballistic: true },
  { id: "oniks",     side: "ru", name: "П-800 Оникс",           hp: 5, speed: 2.2,  dmg: 55, color: "#c026d3", cruise: true },
  { id: "kh55",      side: "ru", name: "Х-55/Х-555",           hp: 4, speed: 1.2,  dmg: 48, color: "#db2777", cruise: true, stealth: true },
  { id: "zircon",    side: "ru", name: "Циркон (3М22)",         hp: 8, speed: 5.0,  dmg: 80, color: "#4f46e5", ballistic: true, hypersonic: true },
];

const UA_WEAPONS: WeaponDef[] = [
  { id: "himars",    side: "ua", name: "HIMARS GMLRS",          hp: 4, speed: 1.8,  dmg: 35, color: "#3b82f6" },
  { id: "atacms",    side: "ua", name: "MGM-140 ATACMS",        hp: 6, speed: 2.2,  dmg: 60, color: "#1d4ed8", ballistic: true },
  { id: "tomahawk",  side: "ua", name: "BGM-109 Tomahawk",      hp: 5, speed: 1.3,  dmg: 45, color: "#2563eb", cruise: true },
  { id: "jassm",     side: "ua", name: "AGM-158B JASSM-ER",     hp: 5, speed: 1.4,  dmg: 50, color: "#0891b2", cruise: true, stealth: true },
  { id: "switchblade",side:"ua", name: "Switchblade 600",        hp: 2, speed: 1.0,  dmg: 18, color: "#60a5fa" },
  { id: "phoenix",   side: "ua", name: "Phoenix Ghost",         hp: 2, speed: 1.1,  dmg: 16, color: "#93c5fd", stealth: true },
  { id: "storm",     side: "ua", name: "Storm Shadow/SCALP-EG", hp: 5, speed: 1.3,  dmg: 50, color: "#38bdf8", cruise: true, stealth: true },
  { id: "naval",     side: "ua", name: "Морской БЛА (MAGURA)",  hp: 3, speed: 0.7,  dmg: 30, color: "#0284c7" },
];

const UA_PVO: PVODef[] = [
  { id: "patriot",  side: "ua", name: "MIM-104 Patriot PAC-3",        range: 200, fireRate: 22, dmg: 6, color: "#1d4ed8", detectsStealth: true, antiballistic: true },
  { id: "nasams",   side: "ua", name: "NASAMS 3",                      range: 140, fireRate: 14, dmg: 4, color: "#2563eb" },
  { id: "irist",    side: "ua", name: "IRIS-T SLM",                    range: 120, fireRate: 12, dmg: 3, color: "#0284c7" },
  { id: "aster30",  side: "ua", name: "Aster-30 SAMP/T",               range: 170, fireRate: 18, dmg: 5, color: "#6366f1", detectsStealth: true, antiballistic: true },
  { id: "s300ua",   side: "ua", name: "С-300ПС/ПМ (Укр.)",            range: 180, fireRate: 20, dmg: 5, color: "#3b82f6", detectsStealth: true },
  { id: "buk",      side: "ua", name: "Бук-М1/М2",                     range: 130, fireRate: 16, dmg: 4, color: "#06b6d4" },
  { id: "hawk",     side: "ua", name: "MIM-23 Hawk",                   range: 120, fireRate: 18, dmg: 3, color: "#0891b2" },
  { id: "gepard",   side: "ua", name: "Flakpanzer Gepard",             range: 60,  fireRate: 3,  dmg: 1, color: "#16a34a" },
  { id: "zu23",     side: "ua", name: "ЗУ-23-2М Зенит",               range: 45,  fireRate: 2,  dmg: 1, color: "#15803d" },
  { id: "stinger",  side: "ua", name: "FIM-92 Stinger MANPADS",        range: 50,  fireRate: 8,  dmg: 2, color: "#65a30d" },
  { id: "cram",     side: "ua", name: "C-RAM Centurion",               range: 55,  fireRate: 2,  dmg: 1, color: "#84cc16" },
  { id: "aim120",   side: "ua", name: "AMRAAM/AIM-120C (наземный)",    range: 160, fireRate: 16, dmg: 4, color: "#4f46e5" },
];

const RU_PVO: PVODef[] = [
  { id: "s400",     side: "ru", name: "С-400 Триумф",                  range: 220, fireRate: 20, dmg: 6, color: "#ef4444", detectsStealth: true, antiballistic: true },
  { id: "pantsir",  side: "ru", name: "Панцирь-С1/С2",                range: 90,  fireRate: 5,  dmg: 2, color: "#f97316" },
  { id: "tor",      side: "ru", name: "Тор-М2",                        range: 115, fireRate: 12, dmg: 3, color: "#eab308" },
  { id: "s350",     side: "ru", name: "С-350 Витязь",                  range: 150, fireRate: 16, dmg: 4, color: "#f59e0b" },
  { id: "tunguska", side: "ru", name: "2К22 Тунгуска-М1",             range: 70,  fireRate: 4,  dmg: 1, color: "#84cc16" },
  { id: "shilka",   side: "ru", name: "ЗСУ-23-4 Шилка",               range: 55,  fireRate: 3,  dmg: 1, color: "#4ade80" },
  { id: "s300ru",   side: "ru", name: "С-300В4 / Антей-2500",          range: 190, fireRate: 22, dmg: 5, color: "#dc2626", detectsStealth: true, antiballistic: true },
  { id: "buk3",     side: "ru", name: "Бук-М3",                        range: 140, fireRate: 14, dmg: 4, color: "#f59e0b" },
];

// Украинские точки входа (атакуют российские цели — к востоку)
// Российские точки входа (атакуют украинские цели — к западу)
const ALL_SPAWNS: SpawnPt[] = [
  // RU side — атакует с востока/севера/юга
  { id: "belgorod", label: "БЕЛГОРОД",  x: 920, y: 80,  side: "ru" },
  { id: "kursk",    label: "КУРСК",     x: 920, y: 200, side: "ru" },
  { id: "donbas",   label: "ДОНБАС",    x: 920, y: 340, side: "ru" },
  { id: "azov",     label: "АЗОВСКОЕ",  x: 820, y: 510, side: "ru" },
  { id: "belarus",  label: "БЕЛАРУСЬ",  x: 450, y: 5,   side: "ru" },
  { id: "crimea",   label: "КРЫМ",      x: 570, y: 510, side: "ru" },
  // UA side — контратаки
  { id: "poland",   label: "ПОЛЬША",    x: 10,  y: 180, side: "ua" },
  { id: "moldova",  label: "МОЛДОВА",   x: 10,  y: 370, side: "ua" },
  { id: "blacksea", label: "ЧЕРНОЕ М.", x: 380, y: 540, side: "ua" },
  { id: "romania",  label: "РУМЫНИЯ",   x: 180, y: 510, side: "ua" },
];

// Украинские города — цели для России
const UA_CITIES: City[] = [
  { id: "kyiv",         label: "Київ",        x: 430, y: 165, maxHp: 200, hp: 200 },
  { id: "kharkiv",      label: "Харків",      x: 665, y: 148, maxHp: 120, hp: 120 },
  { id: "dnipro",       label: "Дніпро",      x: 558, y: 292, maxHp: 120, hp: 120 },
  { id: "zaporizhzhia", label: "Запоріжжя",   x: 566, y: 360, maxHp: 100, hp: 100 },
  { id: "odesa",        label: "Одеса",       x: 365, y: 428, maxHp: 100, hp: 100 },
  { id: "lviv",         label: "Львів",       x: 178, y: 192, maxHp: 100, hp: 100 },
  { id: "mykolaiv",     label: "Миколаїв",    x: 440, y: 425, maxHp: 80,  hp: 80  },
  { id: "kherson",      label: "Херсон",      x: 490, y: 430, maxHp: 80,  hp: 80  },
];

let _id = 0;
const nid = () => `i${++_id}`;
const d2 = (ax: number, ay: number, bx: number, by: number) =>
  Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);

// ═══════════════════════════════════════════════════════════
// SVG ICONS
// ═══════════════════════════════════════════════════════════
function WIcon({ id, color, size = 22 }: { id: string; color: string; size?: number }) {
  const c = color; const s = size;
  // Delta-wing loitering (Shahed, Geran, Lancet-like)
  if (["shahed136","geran1m","kub","switchblade","phoenix"].includes(id))
    return <svg width={s} height={s} viewBox="0 0 32 32">
      <polygon points="16,3 30,26 16,21 2,26" fill={c} opacity={.92}/>
      <line x1="16" y1="3" x2="16" y2="22" stroke="rgba(0,0,0,.4)" strokeWidth="1"/>
      <rect x="13" y="21" width="6" height="5" rx="1" fill={c} opacity={.7}/>
    </svg>;
  // Cross-body loitering (Lancet, KUB precise)
  if (["lancet3"].includes(id))
    return <svg width={s} height={s} viewBox="0 0 32 32">
      <ellipse cx="16" cy="16" rx="3" ry="11" fill={c} opacity={.95}/>
      <ellipse cx="16" cy="16" rx="11" ry="3" fill={c} opacity={.7}/>
      <circle cx="16" cy="16" r="2.5" fill="#111" stroke={c} strokeWidth="1.2"/>
      <line x1="16" y1="5" x2="16" y2="3" stroke={c} strokeWidth="2" strokeLinecap="round"/>
    </svg>;
  // Pusher-prop UAV (Orlan-10)
  if (["orlan10"].includes(id))
    return <svg width={s} height={s} viewBox="0 0 32 32">
      <rect x="12" y="7" width="8" height="13" rx="2" fill={c} opacity={.9}/>
      <line x1="2" y1="13" x2="30" y2="13" stroke={c} strokeWidth="3" strokeLinecap="round"/>
      <line x1="8" y1="13" x2="8" y2="18" stroke={c} strokeWidth="1.5"/>
      <line x1="24" y1="13" x2="24" y2="18" stroke={c} strokeWidth="1.5"/>
      <circle cx="16" cy="22" r="2.5" fill="rgba(0,0,0,.5)" stroke={c} strokeWidth="1.2"/>
    </svg>;
  // Cruise missile (Kalibr, Kh-101, Tomahawk, Storm)
  if (["kalibr","kh101","kh55","oniks","tomahawk","storm","jassm"].includes(id))
    return <svg width={s} height={s} viewBox="0 0 32 32">
      <ellipse cx="16" cy="15" rx="2.5" ry="11" fill={c} opacity={.95}/>
      <polygon points="16,4 19,9 13,9" fill={c}/>
      <line x1="9" y1="19" x2="23" y2="19" stroke={c} strokeWidth="3" strokeLinecap="round"/>
      <line x1="11" y1="23" x2="21" y2="23" stroke={c} strokeWidth="2" strokeLinecap="round"/>
      <polygon points="14,26 16,29 18,26" fill={c} opacity={.7}/>
    </svg>;
  // Ballistic missile (Iskander, Kinzhal, Kh-22, Zircon, ATACMS, HIMARS)
  if (["iskander","kinzhal","kh22","zircon","atacms","himars"].includes(id))
    return <svg width={s} height={s} viewBox="0 0 32 32">
      <ellipse cx="16" cy="13" rx="3.5" ry="11" fill={c} opacity={.95}/>
      <polygon points="16,2 20,8 12,8" fill={c}/>
      <polygon points="10,24 16,28 22,24 20,20 12,20" fill={c} opacity={.7}/>
      <line x1="16" y1="2" x2="16" y2="25" stroke="rgba(0,0,0,.35)" strokeWidth="1"/>
    </svg>;
  // Naval drone (MAGURA)
  if (["naval"].includes(id))
    return <svg width={s} height={s} viewBox="0 0 32 32">
      <ellipse cx="16" cy="18" rx="10" ry="5" fill={c} opacity={.9}/>
      <ellipse cx="16" cy="18" rx="7" ry="3.5" fill={c} opacity={.6}/>
      <rect x="13" y="10" width="6" height="9" rx="2" fill={c} opacity={.8}/>
      <line x1="16" y1="10" x2="16" y2="5" stroke={c} strokeWidth="1.5"/>
    </svg>;
  // Default fallback
  return <svg width={s} height={s} viewBox="0 0 32 32">
    <polygon points="16,3 28,24 16,20 4,24" fill={c} opacity={.9}/>
  </svg>;
}

function PIcon({ id, color, size = 22 }: { id: string; color: string; size?: number }) {
  const c = color; const s = size;
  // Heavy long-range SAM (Patriot, S-400, S-300, Aster-30, S-350)
  if (["patriot","s400","s300ru","s300ua","aster30","s350"].includes(id))
    return <svg width={s} height={s} viewBox="0 0 32 32">
      <rect x="11" y="19" width="10" height="9" rx="1" fill={c} opacity={.85}/>
      <rect x="13" y="13" width="6" height="7" fill={c} opacity={.9}/>
      <path d="M9,9 Q16,15 23,9" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="16" y1="9" x2="16" y2="3" stroke={c} strokeWidth="2"/>
      <rect x="19" y="4" width="5" height="7" rx="1" fill={c} opacity={.75}/>
      <circle cx="21.5" cy="4.5" r="2" fill="#111" stroke={c} strokeWidth="1"/>
    </svg>;
  // SHORAD twin-gun (Pantsir, Gepard, Shilka, Tunguska)
  if (["pantsir","gepard","shilka","tunguska"].includes(id))
    return <svg width={s} height={s} viewBox="0 0 32 32">
      <rect x="7" y="17" width="18" height="11" rx="2" fill={c} opacity={.85}/>
      <rect x="10" y="11" width="12" height="8" rx="2" fill={c} opacity={.9}/>
      <line x1="5" y1="14" x2="10" y2="12" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="27" y1="14" x2="22" y2="12" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="5" cy="14" r="2.5" fill="#111" stroke={c} strokeWidth="1.2"/>
      <circle cx="27" cy="14" r="2.5" fill="#111" stroke={c} strokeWidth="1.2"/>
      <circle cx="16" cy="11" r="2" fill={c} opacity={.5}/>
    </svg>;
  // Medium SAM (Buk, Tor, Nasams, IRIS-T, Hawk, AIM-120)
  if (["buk","buk3","tor","nasams","irist","hawk","aim120"].includes(id))
    return <svg width={s} height={s} viewBox="0 0 32 32">
      <rect x="6" y="19" width="20" height="9" rx="2" fill={c} opacity={.85}/>
      <rect x="9" y="13" width="14" height="8" rx="1" fill={c} opacity={.9}/>
      <rect x="7" y="8" width="5" height="9" rx="1" fill={c} opacity={.7}/>
      <rect x="20" y="8" width="5" height="9" rx="1" fill={c} opacity={.7}/>
      <line x1="16" y1="13" x2="16" y2="5" stroke={c} strokeWidth="2"/>
      <circle cx="16" cy="6" r="3.5" fill="none" stroke={c} strokeWidth="1.5"/>
      <line x1="14" y1="4.5" x2="18" y2="7.5" stroke={c} strokeWidth="1"/>
    </svg>;
  // MANPADS / Small (Stinger, C-RAM, ZU-23)
  if (["stinger","cram","zu23"].includes(id))
    return <svg width={s} height={s} viewBox="0 0 32 32">
      <rect x="9" y="21" width="14" height="7" rx="2" fill={c} opacity={.85}/>
      <rect x="12" y="15" width="8" height="8" rx="1" fill={c} opacity={.9}/>
      <line x1="8" y1="17" x2="12" y2="15" stroke={c} strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="24" y1="17" x2="20" y2="15" stroke={c} strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="16" y1="15" x2="16" y2="7" stroke={c} strokeWidth="1.5"/>
      <circle cx="16" cy="6.5" r="2.5" fill="none" stroke={c} strokeWidth="1.5"/>
    </svg>;
  return <svg width={s} height={s} viewBox="0 0 32 32">
    <rect x="11" y="18" width="10" height="10" rx="1" fill={c} opacity={.85}/>
    <line x1="16" y1="18" x2="16" y2="3" stroke={c} strokeWidth="2"/>
    <path d="M10,8 Q16,13 22,8" fill="none" stroke={c} strokeWidth="2"/>
  </svg>;
}

// ═══════════════════════════════════════════════════════════
// UKRAINE MAP — точный SVG контур
// ═══════════════════════════════════════════════════════════
// Упрощённый но правдоподобный контур Украины в системе координат 0-920 x 0-520
const UA_PATH = `
  M 235,25
  L 270,18 L 315,22 L 358,15 L 400,18 L 445,12 L 490,16
  L 530,10 L 572,18 L 608,14 L 640,22 L 672,16
  L 705,25 L 735,20 L 762,28 L 790,38 L 808,55
  L 825,75 L 838,98 L 845,122 L 842,148 L 835,170
  L 820,190 L 810,215 L 818,238 L 822,262 L 818,285
  L 808,305 L 795,322 L 775,338 L 755,350 L 738,362
  L 718,372 L 700,368 L 680,378 L 658,388 L 635,400
  L 612,412 L 588,422 L 562,434 L 538,444 L 514,450
  L 490,456 L 465,452 L 440,458 L 415,462 L 388,468
  L 362,462 L 335,452 L 308,440 L 280,428 L 255,415
  L 228,400 L 205,385 L 185,368 L 165,348 L 148,325
  L 132,300 L 120,272 L 112,244 L 108,216 L 108,188
  L 112,162 L 118,138 L 125,115 L 135,92 L 148,72
  L 165,54 L 185,40 L 210,30 Z
`;

// Крым
const CRIMEA_PATH = `
  M 465,455 L 498,458 L 528,454 L 555,460 L 575,472
  L 580,490 L 568,506 L 548,516 L 520,520 L 495,518
  L 472,510 L 455,498 L 450,482 L 455,468 Z
`;

// Днепр
const DNIEPER_D = `
  M 498,18 C 496,55 500,90 494,125 C 488,160 480,188 476,222
  C 472,258 478,282 474,318 C 470,350 460,372 455,400
  C 450,420 452,440 450,456
`;

function UkraineMapSVG({
  cities, units, pvos, booms, onMapClick, placingPVO,
  zoom, panX, panY
}: {
  cities: City[]; units: ActiveUnit[]; pvos: ActivePVO[]; booms: Boom[];
  onMapClick: (x: number, y: number) => void;
  placingPVO: boolean; zoom: number; panX: number; panY: number;
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    if (!placingPVO) return;
    const rect = svgRef.current!.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / zoom - panX;
    const my = (e.clientY - rect.top)  / zoom - panY;
    onMapClick(mx, my);
  }

  const tx = `translate(${panX},${panY}) scale(${zoom})`;

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 930 540"
      style={{ width: "100%", height: "100%", display: "block",
               cursor: placingPVO ? "crosshair" : "default",
               background: "#060c06" }}
      onClick={handleClick}
    >
      <defs>
        <radialGradient id="cityGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#4ade80" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#4ade80" stopOpacity="0"/>
        </radialGradient>
        <filter id="blur3"><feGaussianBlur stdDeviation="3"/></filter>
        <filter id="glow2"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>

      <g transform={tx}>
        {/* === TERRAIN === */}
        {/* Surrounding region (dark grey-green) */}
        <rect x="-50" y="-50" width="1100" height="700" fill="#0a1208"/>

        {/* Forest zones around Ukraine */}
        <ellipse cx="130" cy="200" rx="100" ry="80" fill="#0c1a0c" opacity=".8"/>
        <ellipse cx="850" cy="200" rx="90" ry="75" fill="#0c1a0c" opacity=".75"/>
        <ellipse cx="200" cy="450" rx="80" ry="60" fill="#0c1a0c" opacity=".7"/>
        <ellipse cx="700" cy="460" rx="95" ry="65" fill="#0c1a0c" opacity=".75"/>

        {/* Black Sea */}
        <ellipse cx="480" cy="530" rx="280" ry="80" fill="#0a1e3a" opacity=".9"/>
        <ellipse cx="480" cy="535" rx="250" ry="65" fill="#0d2545" opacity=".7"/>
        <text x="480" y="535" textAnchor="middle" fontSize="11" fill="#1a4a7a"
          style={{fontFamily:"IBM Plex Mono"}}>ЧОРНЕ МОРЕ</text>

        {/* Ukraine territory */}
        <path d={UA_PATH} fill="#0e1e0e" stroke="#1e4a1e" strokeWidth="1.5"/>

        {/* Internal terrain shading */}
        <ellipse cx="250" cy="220" rx="130" ry="80" fill="#0f200f" opacity=".5"/>
        <ellipse cx="600" cy="180" rx="120" ry="70" fill="#0f200f" opacity=".45"/>
        <ellipse cx="420" cy="350" rx="100" ry="60" fill="#0f200f" opacity=".4"/>
        <ellipse cx="700" cy="300" rx="110" ry="65" fill="#0f200f" opacity=".45"/>

        {/* Crimea */}
        <path d={CRIMEA_PATH} fill="#1a0c0c" stroke="#3a1a1a" strokeWidth="1.2"/>
        <text x="510" y="494" textAnchor="middle" fontSize="8" fill="#4a2a2a"
          style={{fontFamily:"IBM Plex Mono"}}>КРИМ</text>

        {/* Dniper river */}
        <path d={DNIEPER_D} fill="none" stroke="#0c2855" strokeWidth="12" opacity=".8"/>
        <path d={DNIEPER_D} fill="none" stroke="#163d7a" strokeWidth="6" opacity=".6"/>
        <path d={DNIEPER_D} fill="none" stroke="#1e5098" strokeWidth="2" opacity=".4"/>

        {/* River labels */}
        <text x="465" y="300" textAnchor="middle" fontSize="8" fill="#1a3a6a" opacity=".7"
          style={{fontFamily:"IBM Plex Mono"}} transform="rotate(-88,465,300)">ДНІПРО</text>

        {/* Small rivers */}
        <path d="M200,90 C210,130 215,160 205,200" fill="none" stroke="#0c2855" strokeWidth="5" opacity=".5"/>
        <path d="M200,90 C210,130 215,160 205,200" fill="none" stroke="#163d7a" strokeWidth="2" opacity=".35"/>
        <path d="M350,420 C380,435 410,440 430,458" fill="none" stroke="#0c2855" strokeWidth="5" opacity=".5"/>
        <path d="M350,420 C380,435 410,440 430,458" fill="none" stroke="#163d7a" strokeWidth="2" opacity=".35"/>

        {/* Forest trees */}
        {([
          [155,148],[168,158],[142,165],[178,155],[162,168],
          [720,125],[735,138],[710,148],[748,132],[730,155],
          [158,385],[172,398],[148,405],[185,392],
          [748,402],[762,415],[738,422],[778,408],
        ] as [number,number][]).map(([cx,cy],i)=>(
          <g key={`t${i}`}>
            <circle cx={cx} cy={cy} r={9} fill="#0d3318" opacity={.75}/>
            <circle cx={cx} cy={cy-5} r={6} fill="#104020" opacity={.8}/>
            <polygon points={`${cx},${cy-13} ${cx-4},${cy-6} ${cx+4},${cy-6}`} fill="#15542a" opacity={.7}/>
          </g>
        ))}

        {/* Lakes */}
        <ellipse cx="298" cy="148" rx="18" ry="10" fill="#0c2855" opacity=".6"/>
        <ellipse cx="298" cy="148" rx="13" ry="7" fill="#163d7a" opacity=".4"/>
        <ellipse cx="660" cy="418" rx="22" ry="12" fill="#0c2855" opacity=".6"/>
        <ellipse cx="660" cy="418" rx="16" ry="8" fill="#163d7a" opacity=".4"/>

        {/* Grid overlay */}
        {Array.from({length:19},(_,i)=>(
          <line key={`gv${i}`} x1={i*50} y1={0} x2={i*50} y2={540} stroke="#1a3a1a" strokeWidth=".4" opacity=".2"/>
        ))}
        {Array.from({length:12},(_,i)=>(
          <line key={`gh${i}`} x1={0} y1={i*50} x2={930} y2={i*50} stroke="#1a3a1a" strokeWidth=".4" opacity=".2"/>
        ))}
        {/* Coord labels */}
        {Array.from({length:10},(_,i)=>(
          <text key={`cl${i}`} x={50+i*90} y={530} textAnchor="middle" fontSize="7" fill="#1a3a1a" opacity=".5"
            style={{fontFamily:"IBM Plex Mono"}}>{String.fromCharCode(65+i)}</text>
        ))}
        {Array.from({length:10},(_,i)=>(
          <text key={`rn${i}`} x={12} y={30+i*50} fontSize="7" fill="#1a3a1a" opacity=".5"
            style={{fontFamily:"IBM Plex Mono"}}>{i+1}</text>
        ))}

        {/* Spawn markers */}
        {ALL_SPAWNS.map(sp=>{
          const isRu = sp.side==="ru";
          const col = isRu ? "#ef4444" : "#3b82f6";
          return (
            <g key={sp.id}>
              <rect x={sp.x-22} y={sp.y-9} width={44} height={18} rx={3}
                fill="#0d130d" stroke={col} strokeWidth="1" opacity=".9"/>
              <text x={sp.x} y={sp.y+4} textAnchor="middle" fontSize="7"
                fill={col} style={{fontFamily:"IBM Plex Mono",fontWeight:"bold"}}>{sp.label}</text>
            </g>
          );
        })}

        {/* PVO range rings */}
        {pvos.filter(p=>!p.dead).map(p=>(
          <circle key={`pr${p.uid}`} cx={p.x} cy={p.y} r={p.range}
            fill={p.color+"0a"} stroke={p.color} strokeWidth=".8"
            strokeDasharray="5 7" opacity=".35"/>
        ))}

        {/* City glow halos */}
        {cities.map(c=>c.hp>0&&(
          <circle key={`ch${c.id}`} cx={c.x} cy={c.y} r={42}
            fill="url(#cityGlow)" opacity={.6}/>
        ))}

        {/* Cities */}
        {cities.map(c=>{
          const pct = c.hp/c.maxHp;
          const col = pct>0.6?"#4ade80":pct>0.3?"#facc15":"#ef4444";
          return (
            <g key={c.id}>
              <circle cx={c.x} cy={c.y} r={11}
                fill="#0d1a0d" stroke={col} strokeWidth="1.8" filter="url(#glow2)"/>
              <circle cx={c.x} cy={c.y} r={5} fill={col} opacity={.75}/>
              <text x={c.x} y={c.y-15} textAnchor="middle" fontSize="9" fill={col}
                style={{fontFamily:"IBM Plex Mono",fontWeight:"bold"}}>{c.label}</text>
              {/* HP bar */}
              <rect x={c.x-20} y={c.y+14} width={40} height={4} fill="#0a0f0a" rx={2}/>
              <rect x={c.x-20} y={c.y+14} width={40*pct} height={4} fill={col} rx={2}/>
              <text x={c.x} y={c.y+28} textAnchor="middle" fontSize="7" fill="#6b7a6b"
                style={{fontFamily:"IBM Plex Mono"}}>{c.hp}/{c.maxHp}</text>
            </g>
          );
        })}

        {/* PVO units */}
        {pvos.filter(p=>!p.dead).map(p=>{
          const pdef = [...UA_PVO,...RU_PVO].find(d=>d.id===p.pid);
          return (
            <g key={p.uid}>
              <circle cx={p.x} cy={p.y} r={14} fill="#0a130a" stroke={p.color} strokeWidth="1.5"/>
              <g transform={`translate(${p.x-8},${p.y-8})`}>
                <PIcon id={p.pid} color={p.color} size={16}/>
              </g>
            </g>
          );
        })}

        {/* Unit trails + units */}
        {units.filter(u=>!u.dead&&!u.hit).map(u=>{
          const ang = Math.atan2(u.ty-u.y, u.tx-u.x)*(180/Math.PI)+90;
          return (
            <g key={u.uid} transform={`translate(${u.x},${u.y}) rotate(${ang})`}>
              <g transform="translate(-9,-9)">
                <WIcon id={u.wid} color={u.color} size={18}/>
              </g>
            </g>
          );
        })}

        {/* Explosions */}
        {booms.map(b=>{
          const op = Math.max(0,1-b.age/35);
          const r = 6+b.age*0.9;
          return (
            <g key={b.uid}>
              <circle cx={b.x} cy={b.y} r={r*1.6} fill="#f97316" opacity={op*0.35}/>
              <circle cx={b.x} cy={b.y} r={r} fill="#fb923c" opacity={op*0.7}/>
              <circle cx={b.x} cy={b.y} r={r*0.5} fill="#fef08a" opacity={op*0.9}/>
              <circle cx={b.x} cy={b.y} r={r*0.2} fill="white" opacity={op}/>
            </g>
          );
        })}

        {/* Placing hint */}
        {placingPVO&&(
          <g>
            <rect x={300} y={245} width={330} height={32} rx={5}
              fill="#0d1a0d" stroke="#facc15" strokeWidth="1.2" opacity=".95"/>
            <text x={465} y={266} textAnchor="middle" fontSize="11" fill="#facc15"
              style={{fontFamily:"IBM Plex Mono"}}>КЛИКНИТЕ НА КАРТЕ ДЛЯ РАЗМЕЩЕНИЯ ПВО</text>
          </g>
        )}

        {/* Map title */}
        <text x="465" y="22" textAnchor="middle" fontSize="9" fill="#1e4a1e"
          style={{fontFamily:"IBM Plex Mono",letterSpacing:"3px"}}>
          ТЕАТР БОЕВИХ ДІЙ
        </text>
      </g>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════
// BADGE
// ═══════════════════════════════════════════════════════════
function Bdg({label,col}:{label:string;col:string}) {
  return <span style={{
    background:col+"22",border:`1px solid ${col}`,color:col,
    fontSize:8,padding:"1px 5px",borderRadius:2,
    fontFamily:"IBM Plex Mono",display:"inline-block",lineHeight:"14px",marginRight:2
  }}>{label}</span>;
}

// ═══════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════
export default function Index() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [side, setSide] = useState<Side>("ru");
  const [tab, setTab] = useState<Tab>("attack");

  const [selW, setSelW] = useState("shahed136");
  const [selP, setSelP] = useState("patriot");
  const [selSp, setSelSp] = useState("belgorod");
  const [cnt, setCnt] = useState(1);
  const [placingPVO, setPlacingPVO] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);

  const [cities, setCities] = useState<City[]>(UA_CITIES.map(c=>({...c})));
  const [units, setUnits] = useState<ActiveUnit[]>([]);
  const [pvos, setPvos] = useState<ActivePVO[]>([]);
  const [booms, setBooms] = useState<Boom[]>([]);
  const [log, setLog] = useState<{t:number;msg:string;kind:string}[]>([]);

  // Zoom / pan state
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const isDragging = useRef(false);
  const lastMouse = useRef({x:0,y:0});
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Refs for game loop (avoid stale closures)
  const unitsR  = useRef<ActiveUnit[]>([]);
  const pvosR   = useRef<ActivePVO[]>([]);
  const citiesR = useRef<City[]>(UA_CITIES.map(c=>({...c})));
  const boomsR  = useRef<Boom[]>([]);
  const phaseR  = useRef<Phase>("setup");
  const tickR   = useRef(0);
  const rafR    = useRef<number|null>(null);
  const lastT   = useRef(0);

  useEffect(()=>{unitsR.current=units;},[units]);
  useEffect(()=>{pvosR.current=pvos;},[pvos]);
  useEffect(()=>{citiesR.current=cities;},[cities]);
  useEffect(()=>{boomsR.current=booms;},[booms]);
  useEffect(()=>{phaseR.current=phase;},[phase]);

  // ── Zoom / Pan handlers ──
  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.min(4, Math.max(0.4, z * delta)));
  }
  function handleMouseDown(e: React.MouseEvent) {
    if (placingPVO) return;
    isDragging.current = true;
    lastMouse.current = {x: e.clientX, y: e.clientY};
  }
  function handleMouseMove(e: React.MouseEvent) {
    if (!isDragging.current) return;
    const dx = (e.clientX - lastMouse.current.x) / zoom;
    const dy = (e.clientY - lastMouse.current.y) / zoom;
    lastMouse.current = {x: e.clientX, y: e.clientY};
    setPanX(p => p + dx);
    setPanY(p => p + dy);
  }
  function handleMouseUp() { isDragging.current = false; }

  // ── PVO map click ──
  function handleMapClick(x: number, y: number) {
    if (!placingPVO || phase !== "setup") return;
    const plist = side === "ua" ? UA_PVO : RU_PVO;
    const def = plist.find(p => p.id === selP);
    if (!def) return;
    const newOrders: Order[] = [];
    for (let i = 0; i < cnt; i++) {
      newOrders.push({
        id: nid(), wid: def.id, count: 1, spawnId: "map",
        side, isPVO: true,
        px: x + (i - Math.floor(cnt/2)) * 22,
        py: y,
      });
    }
    setOrders(prev => [...prev, ...newOrders]);
    setPlacingPVO(false);
    addMsg(`${def.name} ×${cnt} размещена`, "info");
  }

  function addMsg(msg: string, kind: string) {
    setLog(prev => [{t: tickR.current, msg, kind}, ...prev].slice(0, 120));
  }

  // ── Add attack order ──
  function addOrder() {
    const sp = ALL_SPAWNS.find(s => s.id === selSp);
    if (!sp || sp.side !== side) {
      addMsg("Выберите точку входа своей стороны!", "info"); return;
    }
    const wlist = side === "ru" ? RU_WEAPONS : UA_WEAPONS;
    const def = wlist.find(w => w.id === selW);
    if (!def) return;
    setOrders(prev => {
      const ex = prev.find(o => !o.isPVO && o.wid === selW && o.spawnId === selSp && o.side === side);
      if (ex) return prev.map(o => o.id === ex.id ? {...o, count: o.count + cnt} : o);
      return [...prev, {id: nid(), wid: selW, count: cnt, spawnId: selSp, side, isPVO: false}];
    });
  }

  // ── Game loop ──
  const loop = useCallback(() => {
    if (phaseR.current !== "battle") return;
    const now = performance.now();
    if (now - lastT.current < 48) { rafR.current = requestAnimationFrame(loop); return; }
    lastT.current = now;
    tickR.current++;

    const cu = unitsR.current;
    const cp = pvosR.current;
    const cb = citiesR.current;
    const ce = boomsR.current;

    const newBooms: Boom[] = [];
    const newLog: {t:number;msg:string;kind:string}[] = [];

    // Move
    const moved: ActiveUnit[] = cu.map(u => {
      if (u.dead || u.hit) return u;
      const dd = d2(u.x, u.y, u.tx, u.ty);
      if (dd < 10) return u;
      const spd = u.speed * 1.4;
      return {...u, x: u.x + (u.tx-u.x)/dd*spd, y: u.y + (u.ty-u.y)/dd*spd};
    });

    // PVO fire
    const intercepted = new Set<string>();
    const updPvos: ActivePVO[] = cp.map(pvo => {
      if (pvo.dead) return pvo;
      if (pvo.cd > 0) return {...pvo, cd: pvo.cd - 1};
      for (const u of moved) {
        if (u.dead || u.hit || intercepted.has(u.uid)) continue;
        if (pvo.side === u.side) continue; // no friendly fire
        if (u.stealth && !pvo.detectsStealth) continue;
        if (u.ballistic && !pvo.antiballistic && pvo.range < 120) continue;
        if (d2(pvo.x, pvo.y, u.x, u.y) <= pvo.range) {
          intercepted.add(u.uid);
          newBooms.push({uid: nid(), x: u.x, y: u.y, age: 0});
          const wname = [...RU_WEAPONS,...UA_WEAPONS].find(w=>w.id===u.wid)?.name ?? u.wid;
          const pname = [...UA_PVO,...RU_PVO].find(p=>p.id===pvo.pid)?.name ?? pvo.pid;
          newLog.push({t:tickR.current, msg:`${pname} сбил ${wname}`, kind:"intercept"});
          return {...pvo, cd: Math.max(1, Math.round(55 / pvo.fireRate))};
        }
      }
      return pvo;
    });

    const postInt: ActiveUnit[] = moved.map(u =>
      intercepted.has(u.uid) ? {...u, hit: true} : u
    );

    // Hits on cities
    const hitMap: Record<string,number> = {};
    const hitUnits = new Set<string>();
    for (const u of postInt) {
      if (u.dead || u.hit) continue;
      for (const c of cb) {
        if (c.hp <= 0) continue;
        if (d2(u.x, u.y, c.x, c.y) < 14) {
          hitMap[c.id] = (hitMap[c.id] || 0) + u.dmg;
          hitUnits.add(u.uid);
          newBooms.push({uid: nid(), x: u.x, y: u.y, age: 0});
          newLog.push({t:tickR.current, msg:`${c.label} поражён! -${u.dmg} (${u.wid})`, kind:"hit"});
        }
      }
    }

    const finalUnits: ActiveUnit[] = postInt.map(u =>
      hitUnits.has(u.uid) ? {...u, dead: true} : u
    );

    const finalCities: City[] = cb.map(c => {
      const dmg = hitMap[c.id] || 0;
      const nhp = Math.max(0, c.hp - dmg);
      if (nhp <= 0 && c.hp > 0)
        newLog.push({t:tickR.current, msg:`${c.label} УНИЧТОЖЕН!`, kind:"destroy"});
      return {...c, hp: nhp};
    });

    // Age booms
    const updBooms = [...ce.map(b=>({...b,age:b.age+1})).filter(b=>b.age<35), ...newBooms];

    // Commit
    unitsR.current  = finalUnits;
    pvosR.current   = updPvos;
    citiesR.current = finalCities;
    boomsR.current  = updBooms;

    setUnits([...finalUnits]);
    setPvos([...updPvos]);
    setCities([...finalCities]);
    setBooms([...updBooms]);
    if (newLog.length) setLog(p => [...newLog, ...p].slice(0, 120));

    // End check
    const allGone = finalUnits.every(u => u.dead || u.hit);
    if (allGone) { setPhase("result"); phaseR.current = "result"; return; }

    rafR.current = requestAnimationFrame(loop);
  }, []);

  useEffect(() => {
    if (phase === "battle") {
      lastT.current = performance.now();
      rafR.current = requestAnimationFrame(loop);
    } else {
      if (rafR.current !== null) { cancelAnimationFrame(rafR.current); rafR.current = null; }
    }
    return () => { if (rafR.current !== null) { cancelAnimationFrame(rafR.current); rafR.current = null; } };
  }, [phase, loop]);

  function startBattle() {
    if (orders.length === 0) { addMsg("Добавьте войска!", "info"); return; }

    const newUnits: ActiveUnit[] = [];
    const newPvos: ActivePVO[] = [];
    const newCities = UA_CITIES.map(c=>({...c}));

    orders.forEach(o => {
      if (o.isPVO) {
        const def = [...UA_PVO,...RU_PVO].find(p=>p.id===o.wid);
        if (!def) return;
        newPvos.push({
          uid: nid(), pid: def.id, x: o.px??400, y: o.py??300,
          range: def.range, fireRate: def.fireRate, dmg: def.dmg,
          side: o.side, color: def.color, cd: 0, dead: false,
          detectsStealth: def.detectsStealth??false,
          antiballistic: def.antiballistic??false,
        });
      } else {
        const wdef = [...RU_WEAPONS,...UA_WEAPONS].find(w=>w.id===o.wid);
        if (!wdef) return;
        const sp = ALL_SPAWNS.find(s=>s.id===o.spawnId);
        if (!sp) return;
        for (let i=0; i<o.count; i++) {
          const tgt = newCities[Math.floor(Math.random()*newCities.length)];
          newUnits.push({
            uid: nid(), wid: wdef.id,
            x: sp.x + (Math.random()-0.5)*40,
            y: sp.y + (Math.random()-0.5)*40,
            tx: tgt.x, ty: tgt.y,
            hp: wdef.hp, maxHp: wdef.hp,
            speed: wdef.speed * (0.9 + Math.random()*0.2),
            dmg: wdef.dmg, side: o.side, color: wdef.color,
            dead: false, hit: false,
            stealth: wdef.stealth??false,
            ballistic: wdef.ballistic??false,
            hypersonic: wdef.hypersonic??false,
          });
        }
      }
    });

    unitsR.current  = newUnits;
    pvosR.current   = newPvos;
    citiesR.current = newCities;
    boomsR.current  = [];
    tickR.current   = 0;

    setUnits(newUnits); setPvos(newPvos); setCities(newCities);
    setBooms([]); setLog([]); lastT.current = performance.now();
    setPhase("battle");
    addMsg(`Запуск: ${newUnits.length} ед. атаки, ${newPvos.length} ПВО`, "info");
  }

  function reset() {
    if (rafR.current) { cancelAnimationFrame(rafR.current); rafR.current = null; }
    setPhase("setup"); setOrders([]); setUnits([]); setPvos([]);
    setBooms([]); setLog([]); tickR.current = 0;
    const nc = UA_CITIES.map(c=>({...c}));
    setCities(nc); citiesR.current = nc; unitsR.current = []; pvosR.current = [];
    setPlacingPVO(false);
  }

  function togglePause() {
    setPhase(p => {
      const np = p === "battle" ? "paused" : "battle";
      phaseR.current = np;
      return np;
    });
  }

  // Derived
  const wlist  = side === "ru" ? RU_WEAPONS : UA_WEAPONS;
  const plist  = side === "ua" ? UA_PVO : RU_PVO;
  const spawns = ALL_SPAWNS.filter(s => s.side === side);
  const acol   = side === "ru" ? "#ef4444" : "#3b82f6";

  const intercepted = units.filter(u=>u.hit).length;
  const reached     = units.filter(u=>u.dead&&!u.hit).length;
  const active      = units.filter(u=>!u.dead&&!u.hit).length;

  return (
    <div style={{width:"100vw",height:"100vh",background:"#060c06",
      fontFamily:"IBM Plex Mono,monospace",color:"#c8d4c8",
      display:"flex",flexDirection:"column",overflow:"hidden"}}>

      {/* ══ TOP BAR ══ */}
      <div style={{background:"#080e08",borderBottom:"1px solid #162416",
        padding:"5px 14px",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        <span style={{color:"#4ade80",fontSize:12,fontWeight:"bold",letterSpacing:3,whiteSpace:"nowrap"}}>
          ОПЕРАЦИЯ РУБЕЖ
        </span>
        <div style={{width:1,height:22,background:"#162416"}}/>

        {/* Side toggle */}
        {(["ru","ua"] as Side[]).map(s=>(
          <button key={s} onClick={()=>{
            setSide(s);
            setSelW(s==="ru"?"shahed136":"himars");
            setSelP(s==="ru"?"s400":"patriot");
            setSelSp(s==="ru"?"belgorod":"poland");
            setPlacingPVO(false);
          }} style={{
            background:side===s?(s==="ru"?"#ef444422":"#3b82f622"):"transparent",
            border:`1px solid ${side===s?(s==="ru"?"#ef4444":"#3b82f6"):"#162416"}`,
            color:side===s?(s==="ru"?"#fca5a5":"#93c5fd"):"#374151",
            fontSize:10,padding:"3px 12px",borderRadius:3,cursor:"pointer",
            fontWeight:side===s?"bold":"normal",
          }}>
            {s==="ru"?"🇷🇺 РОССИЯ":"🇺🇦 УКРАИНА/НАТО"}
          </button>
        ))}

        <div style={{width:1,height:22,background:"#162416"}}/>

        {/* Phase indicator */}
        <div style={{display:"flex",alignItems:"center",gap:6,fontSize:9,color:"#6b7280"}}>
          <div style={{width:8,height:8,borderRadius:"50%",
            background:phase==="battle"?"#4ade80":phase==="paused"?"#facc15":phase==="result"?"#ef4444":"#374151",
            boxShadow:phase==="battle"?"0 0 6px #4ade80":"none"}}/>
          <span>{phase==="setup"?"ПОДГОТОВКА":phase==="battle"?`ТИК ${tickR.current}`:phase==="paused"?"⏸ ПАУЗА":"ЗАВЕРШЕНО"}</span>
        </div>

        {phase==="battle"&&<>
          <span style={{fontSize:9,color:"#f97316"}}>✈ {active}</span>
          <span style={{fontSize:9,color:"#4ade80"}}>✕ {intercepted}</span>
          <span style={{fontSize:9,color:"#ef4444"}}>💥 {reached}</span>
        </>}

        <div style={{flex:1}}/>

        {/* Zoom controls */}
        <div style={{display:"flex",gap:4,alignItems:"center"}}>
          <button onClick={()=>setZoom(z=>Math.min(4,z*1.2))}
            style={{background:"#0d1a0d",border:"1px solid #162416",color:"#4ade80",
              fontSize:14,width:26,height:26,borderRadius:3,cursor:"pointer",lineHeight:1}}>+</button>
          <span style={{fontSize:9,color:"#374151",minWidth:32,textAlign:"center"}}>{Math.round(zoom*100)}%</span>
          <button onClick={()=>setZoom(z=>Math.max(0.4,z*0.8))}
            style={{background:"#0d1a0d",border:"1px solid #162416",color:"#4ade80",
              fontSize:14,width:26,height:26,borderRadius:3,cursor:"pointer",lineHeight:1}}>−</button>
          <button onClick={()=>{setZoom(1);setPanX(0);setPanY(0);}}
            style={{background:"#0d1a0d",border:"1px solid #162416",color:"#6b7280",
              fontSize:9,padding:"3px 6px",borderRadius:3,cursor:"pointer"}}>⌂</button>
        </div>

        <div style={{width:1,height:22,background:"#162416"}}/>

        {/* Action buttons */}
        {phase==="setup"&&(
          <button onClick={startBattle} disabled={orders.length===0} style={{
            background:orders.length>0?"#ef444420":"#0d130d",
            border:`1px solid ${orders.length>0?"#ef4444":"#162416"}`,
            color:orders.length>0?"#ef4444":"#2a3a2a",
            fontSize:10,padding:"4px 16px",borderRadius:3,cursor:"pointer",
            fontWeight:"bold",letterSpacing:1,
          }}>▶ ЗАПУСК</button>
        )}
        {(phase==="battle"||phase==="paused")&&(
          <button onClick={togglePause} style={{
            background:"#facc1520",border:"1px solid #facc15",
            color:"#facc15",fontSize:10,padding:"4px 12px",borderRadius:3,cursor:"pointer",
          }}>{phase==="battle"?"⏸ ПАУЗА":"▶ ПРОДОЛЖИТЬ"}</button>
        )}
        <button onClick={reset} style={{
          background:"transparent",border:"1px solid #162416",
          color:"#4b5563",fontSize:10,padding:"4px 10px",borderRadius:3,cursor:"pointer",
        }}>↺ СБРОС</button>
      </div>

      {/* ══ MAIN ══ */}
      <div style={{display:"flex",flex:1,overflow:"hidden"}}>

        {/* ── LEFT PANEL ── */}
        <div style={{width:295,minWidth:295,background:"#080e08",
          borderRight:"1px solid #162416",display:"flex",flexDirection:"column",overflow:"hidden"}}>

          {/* Tabs */}
          <div style={{display:"flex",borderBottom:"1px solid #162416",flexShrink:0}}>
            {(["attack","pvo","log"] as Tab[]).map(t=>(
              <button key={t} onClick={()=>setTab(t)} style={{
                flex:1,background:tab===t?"#0d1a0d":"transparent",
                border:"none",borderBottom:tab===t?`2px solid ${acol}`:"2px solid transparent",
                color:tab===t?acol:"#374151",fontSize:9,padding:"8px 0",cursor:"pointer",
                fontFamily:"IBM Plex Mono",letterSpacing:"0.1em",
              }}>
                {t==="attack"?"⚔ АТАКА":t==="pvo"?"🛡 ПВО":"📋 ЖУРНАЛ"}
              </button>
            ))}
          </div>

          <div style={{flex:1,overflowY:"auto",overflowX:"hidden"}}>

            {/* ── ATTACK TAB ── */}
            {tab==="attack"&&(
              <div style={{padding:"10px 8px"}}>
                <div style={{fontSize:9,color:"#374151",letterSpacing:"0.15em",marginBottom:8}}>
                  ВООРУЖЕНИЕ — {side==="ru"?"РОССИЯ":"УКРАИНА/НАТО"}
                </div>

                {/* Weapon list */}
                <div style={{marginBottom:8}}>
                  {wlist.map(w=>(
                    <div key={w.id} onClick={()=>setSelW(w.id)} style={{
                      background:selW===w.id?w.color+"1a":"#0d130d",
                      border:`1px solid ${selW===w.id?w.color:"#162416"}`,
                      borderRadius:4,padding:"6px 8px",cursor:"pointer",
                      marginBottom:3,display:"flex",alignItems:"center",gap:8,
                      transition:"all 0.12s",
                    }}>
                      <div style={{width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",
                        background:w.color+"14",borderRadius:3,flexShrink:0}}>
                        <WIcon id={w.id} color={w.color} size={20}/>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{color:selW===w.id?w.color:"#b0bab0",fontSize:9,
                          fontWeight:selW===w.id?"bold":"normal",
                          whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                          {w.name}
                        </div>
                        <div style={{marginTop:2,display:"flex",flexWrap:"wrap",gap:2}}>
                          {w.stealth&&<Bdg label="СТЕЛС" col="#7c3aed"/>}
                          {w.ballistic&&<Bdg label="БАЛЛИСТ" col="#dc2626"/>}
                          {w.hypersonic&&<Bdg label="ГИПЕР" col="#6d28d9"/>}
                          {w.cruise&&<Bdg label="КРЫЛАТ" col="#0891b2"/>}
                        </div>
                        <div style={{color:"#374151",fontSize:8,marginTop:2}}>
                          HP:{w.hp} СКР:{w.speed} УРН:{w.dmg}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Spawn selector */}
                <div style={{fontSize:9,color:"#374151",letterSpacing:"0.12em",marginBottom:6}}>
                  НАПРАВЛЕНИЕ АТАКИ
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
                  {spawns.map(sp=>(
                    <button key={sp.id} onClick={()=>setSelSp(sp.id)} style={{
                      background:selSp===sp.id?acol+"22":"#0d130d",
                      border:`1px solid ${selSp===sp.id?acol:"#162416"}`,
                      color:selSp===sp.id?acol:"#374151",
                      fontSize:8,padding:"4px 8px",borderRadius:3,cursor:"pointer",
                      transition:"all 0.1s",
                    }}>{sp.label}</button>
                  ))}
                </div>

                {/* Count + Add */}
                <div style={{fontSize:9,color:"#374151",letterSpacing:"0.12em",marginBottom:5}}>
                  КОЛИЧЕСТВО
                </div>
                <div style={{display:"flex",gap:3,marginBottom:8}}>
                  {[1,3,5,10,20,50].map(n=>(
                    <button key={n} onClick={()=>setCnt(n)} style={{
                      flex:1,background:cnt===n?"#4ade8022":"#0d130d",
                      border:`1px solid ${cnt===n?"#4ade80":"#162416"}`,
                      color:cnt===n?"#4ade80":"#374151",
                      fontSize:9,padding:"4px 0",borderRadius:3,cursor:"pointer",
                    }}>{n}</button>
                  ))}
                </div>
                <button onClick={addOrder} style={{
                  width:"100%",background:acol+"18",border:`1px solid ${acol}`,
                  color:acol,fontSize:10,padding:"7px 0",borderRadius:3,cursor:"pointer",
                  fontWeight:"bold",letterSpacing:1,marginBottom:10,
                }}>+ ДОБАВИТЬ В ОЧЕРЕДЬ</button>

                {/* Orders list */}
                {orders.filter(o=>!o.isPVO).length>0&&(
                  <div>
                    <div style={{fontSize:9,color:"#374151",letterSpacing:"0.12em",marginBottom:5}}>ОЧЕРЕДЬ АТАКИ</div>
                    {orders.filter(o=>!o.isPVO).map(o=>{
                      const wdef = [...RU_WEAPONS,...UA_WEAPONS].find(w=>w.id===o.wid);
                      if (!wdef) return null;
                      const ocol = o.side==="ru"?"#f97316":"#3b82f6";
                      const sp = ALL_SPAWNS.find(s=>s.id===o.spawnId);
                      return (
                        <div key={o.id} style={{display:"flex",alignItems:"center",gap:6,
                          padding:"3px 4px",borderBottom:"1px solid #0f1a0f",fontSize:8}}>
                          <WIcon id={o.wid} color={ocol} size={14}/>
                          <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",
                            whiteSpace:"nowrap",color:"#8aaa8a"}}>{wdef.name}</span>
                          <span style={{color:ocol}}>×{o.count}</span>
                          <span style={{color:"#374151"}}>{sp?.label}</span>
                          <button onClick={()=>setOrders(p=>p.filter(x=>x.id!==o.id))}
                            style={{background:"none",border:"none",color:"#ef4444",
                              cursor:"pointer",fontSize:11,lineHeight:1,padding:"0 2px"}}>×</button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── PVO TAB ── */}
            {tab==="pvo"&&(
              <div style={{padding:"10px 8px"}}>
                <div style={{fontSize:9,color:"#374151",letterSpacing:"0.15em",marginBottom:8}}>
                  ПВО — {side==="ru"?"РОССИЯ":"УКРАИНА/НАТО"}
                </div>

                {plist.map(p=>(
                  <div key={p.id} onClick={()=>setSelP(p.id)} style={{
                    background:selP===p.id?p.color+"1a":"#0d130d",
                    border:`1px solid ${selP===p.id?p.color:"#162416"}`,
                    borderRadius:4,padding:"6px 8px",cursor:"pointer",
                    marginBottom:3,display:"flex",alignItems:"center",gap:8,transition:"all 0.12s",
                  }}>
                    <div style={{width:28,height:28,display:"flex",alignItems:"center",
                      justifyContent:"center",background:p.color+"14",borderRadius:3,flexShrink:0}}>
                      <PIcon id={p.id} color={p.color} size={20}/>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{color:selP===p.id?p.color:"#b0bab0",fontSize:9,
                        fontWeight:selP===p.id?"bold":"normal",
                        whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                        {p.name}
                      </div>
                      <div style={{marginTop:2,display:"flex",gap:2}}>
                        {p.detectsStealth&&<Bdg label="АНТ-СТЛ" col="#7c3aed"/>}
                        {p.antiballistic&&<Bdg label="ЗПРР" col="#1d4ed8"/>}
                      </div>
                      <div style={{color:"#374151",fontSize:8,marginTop:2}}>
                        Р:{p.range} СК:{p.fireRate} УРН:{p.dmg}
                      </div>
                    </div>
                  </div>
                ))}

                <div style={{fontSize:9,color:"#374151",letterSpacing:"0.12em",marginBottom:5,marginTop:8}}>
                  КОЛИЧЕСТВО ПВО
                </div>
                <div style={{display:"flex",gap:3,marginBottom:8}}>
                  {[1,2,3,5].map(n=>(
                    <button key={n} onClick={()=>setCnt(n)} style={{
                      flex:1,background:cnt===n?"#4ade8022":"#0d130d",
                      border:`1px solid ${cnt===n?"#4ade80":"#162416"}`,
                      color:cnt===n?"#4ade80":"#374151",
                      fontSize:9,padding:"4px 0",borderRadius:3,cursor:"pointer",
                    }}>{n}</button>
                  ))}
                </div>

                {phase==="setup"&&(
                  <button onClick={()=>setPlacingPVO(p=>!p)} style={{
                    width:"100%",
                    background:placingPVO?"#facc1520":"#4ade8010",
                    border:`1px solid ${placingPVO?"#facc15":"#4ade80"}`,
                    color:placingPVO?"#facc15":"#4ade80",
                    fontSize:10,padding:"7px 0",borderRadius:3,cursor:"pointer",
                    fontWeight:"bold",letterSpacing:1,marginBottom:10,
                  }}>
                    {placingPVO?"✕ ОТМЕНА":"+ РАЗМЕСТИТЬ НА КАРТЕ"}
                  </button>
                )}

                {/* Placed PVOs */}
                {orders.filter(o=>o.isPVO).length>0&&(
                  <div>
                    <div style={{fontSize:9,color:"#374151",letterSpacing:"0.12em",marginBottom:5}}>
                      РАЗВЁРНУТО ({orders.filter(o=>o.isPVO).length})
                    </div>
                    {orders.filter(o=>o.isPVO).map(o=>{
                      const pdef = [...UA_PVO,...RU_PVO].find(p=>p.id===o.wid);
                      if (!pdef) return null;
                      const ocol = o.side==="ru"?"#ef4444":"#3b82f6";
                      return (
                        <div key={o.id} style={{display:"flex",alignItems:"center",gap:6,
                          padding:"3px 4px",borderBottom:"1px solid #0f1a0f",fontSize:8}}>
                          <PIcon id={o.wid} color={ocol} size={14}/>
                          <span style={{flex:1,color:"#8aaa8a",overflow:"hidden",
                            textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{pdef.name}</span>
                          <button onClick={()=>setOrders(p=>p.filter(x=>x.id!==o.id))}
                            style={{background:"none",border:"none",color:"#ef4444",
                              cursor:"pointer",fontSize:11,lineHeight:1}}>×</button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* City status */}
                <div style={{marginTop:12}}>
                  <div style={{fontSize:9,color:"#374151",letterSpacing:"0.12em",marginBottom:6}}>ГОРОДА</div>
                  {cities.map(c=>{
                    const pct=c.hp/c.maxHp;
                    const col=pct>0.6?"#4ade80":pct>0.3?"#facc15":"#ef4444";
                    return (
                      <div key={c.id} style={{marginBottom:6}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                          <span style={{fontSize:9,color:"#b0bab0"}}>{c.label}</span>
                          <span style={{fontSize:9,color:col,fontWeight:"bold"}}>{c.hp}/{c.maxHp}</span>
                        </div>
                        <div style={{height:4,background:"#0f1a0f",borderRadius:2}}>
                          <div style={{height:"100%",width:`${pct*100}%`,
                            background:col,borderRadius:2,transition:"width .3s"}}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── LOG TAB ── */}
            {tab==="log"&&(
              <div style={{padding:"10px 8px"}}>
                <div style={{fontSize:9,color:"#374151",letterSpacing:"0.15em",marginBottom:8}}>ЖУРНАЛ БОЕВЫХ ДЕЙСТВИЙ</div>
                {log.length===0&&<div style={{color:"#374151",fontSize:9}}>Нет событий</div>}
                {log.map((e,i)=>{
                  const col=e.kind==="intercept"?"#4ade80":e.kind==="hit"?"#f97316":e.kind==="destroy"?"#ef4444":"#6b7a6b";
                  return <div key={i} style={{fontSize:8,color:col,padding:"2px 2px",borderBottom:"1px solid #0f1a0f"}}>
                    [{e.t}] {e.msg}
                  </div>;
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── MAP ── */}
        <div
          ref={mapContainerRef}
          style={{flex:1,position:"relative",overflow:"hidden",userSelect:"none"}}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <UkraineMapSVG
            cities={cities} units={units} pvos={pvos} booms={booms}
            onMapClick={handleMapClick}
            placingPVO={placingPVO && phase === "setup"}
            zoom={zoom} panX={panX} panY={panY}
          />

          {/* Result overlay */}
          {phase==="result"&&(
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",
              justifyContent:"center",background:"rgba(6,12,6,0.8)",backdropFilter:"blur(4px)"}}>
              <div style={{background:"#0d1a0d",border:"1px solid #4ade80",borderRadius:6,
                padding:"32px 40px",textAlign:"center",minWidth:280}}>
                <div style={{fontSize:24,fontWeight:"bold",color:"#4ade80",
                  letterSpacing:4,marginBottom:12}}>ОПЕРАЦИЯ ЗАВЕРШЕНА</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20}}>
                  {[
                    ["Запущено",units.length,"#94a3b8"],
                    ["Сбито",intercepted,"#4ade80"],
                    ["Поразило",reached,"#ef4444"],
                    ["Уничтожено городов",cities.filter(c=>c.hp<=0).length,"#f97316"],
                  ].map(([l,v,c])=>(
                    <div key={l as string} style={{background:"#0f1a0f",border:"1px solid #162416",
                      padding:"8px 12px",borderRadius:4}}>
                      <div style={{fontSize:8,color:"#374151"}}>{l}</div>
                      <div style={{fontSize:18,fontWeight:"bold",color:c as string}}>{v}</div>
                    </div>
                  ))}
                </div>
                <button onClick={reset} style={{
                  background:"transparent",border:"1px solid #4ade80",color:"#4ade80",
                  fontSize:11,padding:"8px 24px",borderRadius:4,cursor:"pointer",
                  fontFamily:"IBM Plex Mono",letterSpacing:2,
                }}>↺ НОВАЯ ОПЕРАЦИЯ</button>
              </div>
            </div>
          )}

          {/* Mini zoom hint */}
          <div style={{position:"absolute",bottom:8,right:8,fontSize:8,
            color:"#1a3a1a",pointerEvents:"none"}}>
            Колёсико мыши — зум • Перетащить — перемещение
          </div>
        </div>
      </div>
    </div>
  );
}
