import { useState, useEffect, useCallback, useRef } from "react";

// ══════════════════════════════════════════════════════════════════
// SVG ICONS — силуэты реальной техники
// ══════════════════════════════════════════════════════════════════

function DroneIcon({ type, color, size = 20 }: { type: string; color: string; size?: number }) {
  const s = size;
  switch (type) {
    case "shahed": // Shahed-136 — дельта-крыло
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <polygon points="12,2 22,20 12,16 2,20" fill={color} opacity={0.9} />
          <line x1="12" y1="2" x2="12" y2="18" stroke={color} strokeWidth="0.8" opacity={0.5} />
        </svg>
      );
    case "geran": // Герань-2 — тупое крыло
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <polygon points="12,3 20,18 12,15 4,18" fill={color} opacity={0.9} />
          <rect x="10" y="14" width="4" height="5" fill={color} opacity={0.7} />
        </svg>
      );
    case "lancet": // Ланцет — крестообразный
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <ellipse cx="12" cy="12" rx="3" ry="8" fill={color} opacity={0.9} />
          <ellipse cx="12" cy="12" rx="8" ry="2.5" fill={color} opacity={0.7} />
          <circle cx="12" cy="12" r="2" fill={color} />
        </svg>
      );
    case "orlan": // Орлан-10 — толкающий пропеллер
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <rect x="9" y="8" width="6" height="9" rx="1" fill={color} opacity={0.85} />
          <line x1="3" y1="11" x2="21" y2="11" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="12" cy="19" r="2" fill={color} opacity={0.6} />
        </svg>
      );
    case "switchblade": // Switchblade 600 — складное крыло
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <polygon points="12,3 19,17 12,14 5,17" fill={color} opacity={0.9} />
          <polygon points="12,8 17,14 12,12 7,14" fill={color} opacity={0.5} />
        </svg>
      );
    case "reaper": // MQ-9 Reaper — обратное крыло
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <ellipse cx="12" cy="11" rx="2.5" ry="7" fill={color} opacity={0.9} />
          <path d="M4,9 Q12,13 20,9" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M8,17 Q12,19 16,17" stroke={color} strokeWidth="1.5" fill="none" />
        </svg>
      );
    case "phoenix": // AeroVironment Phoenix Ghost
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <polygon points="12,2 21,19 12,15 3,19" fill={color} opacity={0.85} />
          <polygon points="12,6 18,16 12,13 6,16" fill={color} opacity={0.4} />
          <line x1="12" y1="2" x2="12" y2="16" stroke="#000" strokeWidth="0.5" opacity={0.4} />
        </svg>
      );
    case "kalibr": // Калибр — крылатая ракета
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <ellipse cx="12" cy="12" rx="2" ry="9" fill={color} opacity={0.9} />
          <polygon points="12,3 15,8 12,7 9,8" fill={color} />
          <line x1="8" y1="14" x2="16" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <polygon points="12,21 14,18 12,19 10,18" fill={color} opacity={0.7} />
        </svg>
      );
    case "iskander": // Искандер — баллистическая
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <ellipse cx="12" cy="11" rx="2.5" ry="8" fill={color} opacity={0.9} />
          <polygon points="12,3 15,7 12,6 9,7" fill={color} />
          <polygon points="8,19 12,22 16,19 14,16 10,16" fill={color} opacity={0.6} />
        </svg>
      );
    case "himars": // HIMARS ракета
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <rect x="9.5" y="4" width="5" height="14" rx="2.5" fill={color} opacity={0.9} />
          <polygon points="12,2 15,5 9,5" fill={color} />
          <line x1="7" y1="13" x2="17" y2="13" stroke={color} strokeWidth="1.5" />
          <polygon points="9,18 15,18 13,22 11,22" fill={color} opacity={0.6} />
        </svg>
      );
    case "tomahawk": // Tomahawk — крылатая
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <ellipse cx="12" cy="12" rx="2" ry="9" fill={color} opacity={0.9} />
          <polygon points="12,3 14.5,7 12,6 9.5,7" fill={color} />
          <line x1="7" y1="15" x2="17" y2="15" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="9" y1="18" x2="15" y2="18" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <polygon points="12,2 22,20 12,16 2,20" fill={color} opacity={0.9} />
        </svg>
      );
  }
}

function PVOIcon({ type, color, size = 20 }: { type: string; color: string; size?: number }) {
  const s = size;
  switch (type) {
    case "s400": // С-400 — большой комплекс
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <rect x="8" y="14" width="8" height="6" rx="1" fill={color} opacity={0.8} />
          <rect x="10" y="10" width="4" height="5" fill={color} opacity={0.9} />
          <line x1="12" y1="10" x2="12" y2="2" stroke={color} strokeWidth="2" />
          <line x1="9" y1="5" x2="15" y2="3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="15" cy="3" r="2" fill={color} />
        </svg>
      );
    case "pantsir": // Панцирь — пушка+ракеты
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <rect x="7" y="13" width="10" height="7" rx="1" fill={color} opacity={0.8} />
          <rect x="10" y="9" width="4" height="5" fill={color} opacity={0.9} />
          <line x1="6" y1="11" x2="10" y2="9" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <line x1="18" y1="11" x2="14" y2="9" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <circle cx="6" cy="11" r="1.5" fill={color} />
          <circle cx="18" cy="11" r="1.5" fill={color} />
          <line x1="12" y1="9" x2="12" y2="3" stroke={color} strokeWidth="1.5" />
        </svg>
      );
    case "tor": // Тор-М2
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <rect x="6" y="14" width="12" height="6" rx="1" fill={color} opacity={0.8} />
          <rect x="9" y="10" width="6" height="5" rx="1" fill={color} opacity={0.9} />
          <rect x="7" y="6" width="10" height="4" rx="2" fill={color} opacity={0.7} />
          <circle cx="12" cy="5" r="3" fill="none" stroke={color} strokeWidth="1.5" />
        </svg>
      );
    case "zsu": // ЗСУ-23-4 Шилка
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <rect x="5" y="14" width="14" height="6" rx="1" fill={color} opacity={0.75} />
          <rect x="8" y="10" width="8" height="5" rx="1" fill={color} opacity={0.9} />
          <line x1="7" y1="10" x2="5" y2="4" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <line x1="10" y1="10" x2="8" y2="4" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <line x1="14" y1="10" x2="16" y2="4" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <line x1="17" y1="10" x2="19" y2="4" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "patriot": // Patriot PAC-3
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <rect x="8" y="15" width="8" height="5" rx="1" fill={color} opacity={0.8} />
          <rect x="10" y="10" width="4" height="6" fill={color} opacity={0.9} />
          <line x1="12" y1="10" x2="12" y2="3" stroke={color} strokeWidth="2.5" />
          <line x1="8" y1="6" x2="16" y2="4" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <rect x="14" y="3" width="4" height="3" rx="1" fill={color} opacity={0.7} />
        </svg>
      );
    case "nasams": // NASAMS
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <rect x="7" y="14" width="10" height="6" rx="1" fill={color} opacity={0.8} />
          <rect x="10" y="9" width="4" height="6" fill={color} opacity={0.9} />
          <line x1="5" y1="10" x2="12" y2="8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="19" y1="10" x2="12" y2="8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <ellipse cx="5" cy="10" rx="2" ry="1.5" fill={color} opacity={0.8} />
          <ellipse cx="19" cy="10" rx="2" ry="1.5" fill={color} opacity={0.8} />
          <circle cx="12" cy="6" r="3" fill="none" stroke={color} strokeWidth="1.5" />
          <line x1="12" y1="3" x2="12" y2="1" stroke={color} strokeWidth="1.5" />
        </svg>
      );
    case "iris": // IRIS-T
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <rect x="8" y="14" width="8" height="6" rx="1" fill={color} opacity={0.8} />
          <circle cx="12" cy="10" r="4" fill="none" stroke={color} strokeWidth="1.5" />
          <circle cx="12" cy="10" r="2" fill={color} opacity={0.6} />
          <line x1="12" y1="6" x2="9" y2="2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="12" y1="6" x2="15" y2="2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "avenger": // Avenger (Stinger)
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <rect x="6" y="15" width="12" height="5" rx="1" fill={color} opacity={0.75} />
          <rect x="9" y="10" width="6" height="6" rx="1" fill={color} opacity={0.9} />
          <line x1="7" y1="11" x2="4" y2="6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="17" y1="11" x2="20" y2="6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <ellipse cx="4" cy="6" rx="2" ry="1" fill={color} opacity={0.8} />
          <ellipse cx="20" cy="6" rx="2" ry="1" fill={color} opacity={0.8} />
        </svg>
      );
    default:
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <rect x="8" y="14" width="8" height="6" rx="1" fill={color} />
          <line x1="12" y1="14" x2="12" y2="3" stroke={color} strokeWidth="2" />
        </svg>
      );
  }
}

// ══════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════

type GamePhase = "setup" | "battle" | "result";
type PanelTab = "attack" | "defense" | "log";
type Side = "ru" | "us";

interface DroneType {
  id: string; side: Side | "both";
  name: string; fullName: string;
  hp: number; speed: number; damage: number;
  color: string; desc: string; size: number;
  isStealth?: boolean; isBallistic?: boolean;
}

interface PVOType {
  id: string; side: Side | "both";
  name: string; fullName: string;
  range: number; fireRate: number; damage: number;
  color: string; desc: string;
  detectsStealth?: boolean;
}

interface DroneOrder { typeId: string; count: number; spawnIdx: number; }

interface ActiveDrone {
  uid: string; typeId: string;
  x: number; y: number; tx: number; ty: number;
  hp: number; maxHp: number; speed: number; damage: number;
  destroyed: boolean; reached: boolean;
  trail: { x: number; y: number }[];
  angle: number;
}

interface PlacedPVO {
  uid: string; typeId: string;
  x: number; y: number;
  cooldown: number; active: boolean;
}

interface Base {
  id: string; x: number; y: number;
  hp: number; maxHp: number;
  label: string; icon: string;
}

interface Explosion { uid: string; x: number; y: number; }
interface Projectile { uid: string; x: number; y: number; tx: number; ty: number; color: string; }

// ══════════════════════════════════════════════════════════════════
// STATIC DATA
// ══════════════════════════════════════════════════════════════════

const DRONE_TYPES: DroneType[] = [
  // RUSSIA
  { id: "shahed", side: "ru", name: "Shahed-136", fullName: "Shahed-136 (Герань-2)", hp: 2, speed: 0.9, damage: 20, color: "#f97316", desc: "Иранский барражирующий боеприпас, дельта-крыло", size: 7 },
  { id: "geran", side: "ru", name: "Герань-2", fullName: "БПЛА «Герань-2»", hp: 2, speed: 0.85, damage: 22, color: "#fb923c", desc: "Российский аналог Shahed, улучшенная навигация", size: 7 },
  { id: "lancet", side: "ru", name: "Ланцет-3", fullName: "БПЛА «Ланцет-3»", hp: 3, speed: 1.1, damage: 15, color: "#a855f7", desc: "Барражирующий боеприпас для точечных ударов", size: 6 },
  { id: "orlan", side: "ru", name: "Орлан-10", fullName: "БПЛА «Орлан-10»", hp: 2, speed: 1.3, damage: 8, color: "#94a3b8", desc: "Разведывательный БПЛА, корректировщик огня", size: 6, isStealth: false },
  { id: "kalibr", side: "ru", name: "Калибр", fullName: "Крылатая ракета 3М-14", hp: 5, speed: 1.4, damage: 40, color: "#ef4444", desc: "Высокоточная крылатая ракета (дальность 1500+ км)", size: 8 },
  { id: "iskander", side: "ru", name: "Искандер-М", fullName: "ОТРК «Искандер-М»", hp: 6, speed: 2.0, damage: 55, color: "#dc2626", desc: "Оперативно-тактический ракетный комплекс", size: 8, isBallistic: true },
  { id: "kh101", side: "ru", name: "Х-101", fullName: "Авиационная КР Х-101", hp: 5, speed: 1.2, damage: 45, color: "#c0392b", desc: "Стратегическая крылатая ракета, стелс", size: 7, isStealth: true },
  { id: "kinzhal", side: "ru", name: "Кинжал", fullName: "Авиационный ракетный комплекс «Кинжал»", hp: 8, speed: 3.0, damage: 70, color: "#7c3aed", desc: "Гиперзвуковая ракета, 10 Мах", size: 9, isBallistic: true },
  // USA / NATO
  { id: "switchblade", side: "us", name: "Switchblade 600", fullName: "AeroVironment Switchblade 600", hp: 2, speed: 1.0, damage: 18, color: "#3b82f6", desc: "Американский барражирующий боеприпас", size: 6 },
  { id: "reaper", side: "us", name: "MQ-9 Reaper", fullName: "General Atomics MQ-9 Reaper", hp: 4, speed: 1.2, damage: 12, color: "#60a5fa", desc: "Тяжёлый ударный БПЛА, носитель Hellfire", size: 8 },
  { id: "phoenix", side: "us", name: "Phoenix Ghost", fullName: "AeroVironment Phoenix Ghost", hp: 2, speed: 1.1, damage: 16, color: "#93c5fd", desc: "БПЛА для точечных ударов, сделан для Украины", size: 6, isStealth: true },
  { id: "himars", side: "us", name: "HIMARS", fullName: "M142 HIMARS GMLRS", hp: 4, speed: 1.8, damage: 35, color: "#16a34a", desc: "Высокоточная реактивная артиллерия", size: 8 },
  { id: "tomahawk", side: "us", name: "Tomahawk", fullName: "BGM-109 Tomahawk Block V", hp: 5, speed: 1.3, damage: 45, color: "#1d4ed8", desc: "Крылатая ракета морского и воздушного базирования", size: 8 },
  { id: "atacms", side: "us", name: "ATACMS", fullName: "MGM-140 ATACMS", hp: 6, speed: 2.2, damage: 60, color: "#1e40af", desc: "Оперативно-тактическая ракета (дальность 300 км)", size: 9, isBallistic: true },
  { id: "jassm", side: "us", name: "JASSM-ER", fullName: "AGM-158B JASSM-ER", hp: 5, speed: 1.4, damage: 50, color: "#2563eb", desc: "Авиационная крылатая ракета-невидимка", size: 8, isStealth: true },
];

const PVO_TYPES: PVOType[] = [
  // RUSSIA
  { id: "s400", side: "ru", name: "С-400", fullName: "С-400 «Триумф»", range: 220, fireRate: 20, damage: 6, color: "#ef4444", desc: "Зенитный ракетный комплекс большой дальности", detectsStealth: true },
  { id: "pantsir", side: "ru", name: "Панцирь-С1", fullName: "ЗРПК «Панцирь-С1»", range: 95, fireRate: 5, damage: 2, color: "#f97316", desc: "Зенитный ракетно-пушечный комплекс ближней зоны", detectsStealth: false },
  { id: "tor", side: "ru", name: "Тор-М2", fullName: "ЗРК «Тор-М2»", range: 120, fireRate: 14, damage: 3, color: "#eab308", desc: "Войсковой зенитный комплекс малой дальности", detectsStealth: false },
  { id: "zsu", side: "ru", name: "Шилка", fullName: "ЗСУ-23-4 «Шилка»", range: 70, fireRate: 3, damage: 1, color: "#84cc16", desc: "Зенитная самоходная установка, 4 пушки", detectsStealth: false },
  { id: "s300", side: "ru", name: "С-300ВМ", fullName: "С-300В4 «Антей»", range: 190, fireRate: 22, damage: 5, color: "#dc2626", desc: "Зенитный ракетный комплекс средней и большой дальности", detectsStealth: true },
  // USA / NATO
  { id: "patriot", side: "us", name: "Patriot PAC-3", fullName: "MIM-104F Patriot PAC-3 MSE", range: 200, fireRate: 22, damage: 6, color: "#3b82f6", desc: "Американский ЗРК большой дальности, перехватывает баллистические", detectsStealth: true },
  { id: "nasams", side: "us", name: "NASAMS", fullName: "National Advanced Surface-to-Air Missile System", range: 150, fireRate: 16, damage: 4, color: "#60a5fa", desc: "Норвежско-американский ЗРК, AMRAAM-ракеты", detectsStealth: false },
  { id: "iris", side: "us", name: "IRIS-T SLM", fullName: "IRIS-T SLM (Diehl Defence)", range: 130, fireRate: 12, damage: 3, color: "#22d3ee", desc: "Немецкий ЗРК средней дальности (поставки Украине)", detectsStealth: false },
  { id: "avenger", side: "us", name: "Avenger", fullName: "M1097 Avenger (Stinger)", range: 75, fireRate: 8, damage: 2, color: "#34d399", desc: "Мобильный ЗРК на базе HMMWV, ракеты Stinger", detectsStealth: false },
  { id: "gepard", side: "us", name: "Gepard", fullName: "Flakpanzer Gepard (Германия)", range: 65, fireRate: 4, damage: 1, color: "#4ade80", desc: "Немецкая ЗСУ, 2×35мм пушки Oerlikon", detectsStealth: false },
];

const BASES: Base[] = [
  { id: "b1", x: 450, y: 285, hp: 150, maxHp: 150, label: "Командный центр", icon: "★" },
  { id: "b2", x: 285, y: 355, hp: 100, maxHp: 100, label: "Арсенал", icon: "⬡" },
  { id: "b3", x: 610, y: 225, hp: 100, maxHp: 100, label: "РЛС", icon: "◎" },
  { id: "b4", x: 355, y: 195, hp: 80, maxHp: 80, label: "Склад ГСМ", icon: "▣" },
  { id: "b5", x: 540, y: 370, hp: 80, maxHp: 80, label: "Аэродром", icon: "⊕" },
];

const SPAWN_POINTS = [
  { x: 30, y: 50, label: "СЗ", angle: 135, dx: 1, dy: 1 },
  { x: 900, y: 65, label: "СВ", angle: 225, dx: -1, dy: 1 },
  { x: 30, y: 495, label: "ЮЗ", angle: 45, dx: 1, dy: -1 },
  { x: 890, y: 480, label: "ЮВ", angle: 315, dx: -1, dy: -1 },
  { x: 460, y: 18, label: "СЕВЕР", angle: 180, dx: 0, dy: 1 },
  { x: 460, y: 542, label: "ЮГ", angle: 0, dx: 0, dy: -1 },
  { x: 12, y: 275, label: "ЗАПАД", angle: 90, dx: 1, dy: 0 },
  { x: 910, y: 275, label: "ВОСТОК", angle: 270, dx: -1, dy: 0 },
];

const MAP_W = 940;
const MAP_H = 560;
const TICK_MS = 55;

let _uid = 0;
const mkuid = () => `u${++_uid}`;

function dist(ax: number, ay: number, bx: number, by: number) {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

function angleTo(x1: number, y1: number, x2: number, y2: number) {
  return Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
}

// ══════════════════════════════════════════════════════════════════
// REALISTIC MAP
// ══════════════════════════════════════════════════════════════════

function RealisticMap() {
  return (
    <g>
      {/* Terrain base */}
      <rect x={0} y={0} width={MAP_W} height={MAP_H} fill="#0c1a0c" />

      {/* Large ground regions */}
      <ellipse cx={200} cy={160} rx={170} ry={90} fill="#142014" opacity={0.8} />
      <ellipse cx={740} cy={145} rx={150} ry={80} fill="#142014" opacity={0.75} />
      <ellipse cx={140} cy={430} rx={130} ry={75} fill="#142014" opacity={0.7} />
      <ellipse cx={790} cy={415} rx={145} ry={80} fill="#142014" opacity={0.75} />
      <ellipse cx={470} cy={475} rx={180} ry={65} fill="#142014" opacity={0.7} />
      <ellipse cx={470} cy={290} rx={280} ry={180} fill="#101d10" opacity={0.4} />

      {/* Hills / elevation */}
      <ellipse cx={190} cy={150} rx={110} ry={55} fill="#1c2e1c" opacity={0.7} />
      <ellipse cx={735} cy={138} rx={100} ry={52} fill="#1c2e1c" opacity={0.65} />
      <ellipse cx={135} cy={422} rx={80} ry={45} fill="#1c2e1c" opacity={0.6} />
      <ellipse cx={785} cy={408} rx={95} ry={50} fill="#1c2e1c" opacity={0.65} />

      {/* Hill peaks */}
      <ellipse cx={185} cy={145} rx={60} ry={30} fill="#253d25" opacity={0.7} />
      <ellipse cx={730} cy={132} rx={55} ry={28} fill="#253d25" opacity={0.65} />

      {/* Main river — sinuous */}
      <path d="M 0 310 C 60 300, 120 325, 190 315 C 260 305, 320 330, 400 320 C 480 310, 530 335, 610 328 C 690 321, 760 340, 840 332 C 880 328, 910 335, 940 330"
        fill="none" stroke="#0f2744" strokeWidth={22} opacity={0.9} />
      <path d="M 0 310 C 60 300, 120 325, 190 315 C 260 305, 320 330, 400 320 C 480 310, 530 335, 610 328 C 690 321, 760 340, 840 332 C 880 328, 910 335, 940 330"
        fill="none" stroke="#153a6e" strokeWidth={14} opacity={0.6} />
      <path d="M 0 310 C 60 300, 120 325, 190 315 C 260 305, 320 330, 400 320 C 480 310, 530 335, 610 328 C 690 321, 760 340, 840 332"
        fill="none" stroke="#1d4f94" strokeWidth={5} opacity={0.4} />
      {/* River shimmer */}
      <path d="M 100 312 C 150 305, 200 318, 250 311" fill="none" stroke="#3b82f6" strokeWidth={1.5} opacity={0.3} />
      <path d="M 550 330 C 600 323, 650 335, 700 329" fill="none" stroke="#3b82f6" strokeWidth={1.5} opacity={0.3} />

      {/* Tributary */}
      <path d="M 285 355 C 290 340, 295 328, 300 318" fill="none" stroke="#0f2744" strokeWidth={10} opacity={0.7} />
      <path d="M 285 355 C 290 340, 295 328, 300 318" fill="none" stroke="#153a6e" strokeWidth={5} opacity={0.5} />

      {/* Roads */}
      {[
        "M 450 285 L 50 60", "M 450 285 L 880 75",
        "M 450 285 L 55 490", "M 450 285 L 880 472",
        "M 450 285 L 460 20", "M 450 285 L 460 540",
        "M 450 285 L 20 278", "M 450 285 L 920 278",
      ].map((d, i) => (
        <g key={i}>
          <path d={d} stroke="#1e2d1e" strokeWidth={7} opacity={0.8} fill="none" />
          <path d={d} stroke="#2d4020" strokeWidth={3} opacity={0.5} fill="none" strokeDasharray="10 6" />
          <path d={d} stroke="#3d5a2e" strokeWidth={1} opacity={0.3} fill="none" strokeDasharray="16 8" />
        </g>
      ))}

      {/* Forest clusters */}
      {[
        // NW forest
        [165,135],[178,148],[155,158],[185,162],[200,150],[195,138],[210,158],[170,165],
        // NE forest
        [710,128],[725,140],[705,150],[740,138],[755,150],[720,155],
        // SW
        [118,408],[132,420],[115,432],[148,418],[138,435],
        // SE
        [762,398],[778,410],[755,422],[793,415],[775,425],
      ].map(([cx, cy], i) => (
        <g key={`f${i}`}>
          <circle cx={cx} cy={cy} r={10} fill="#0d3b1a" opacity={0.8} />
          <circle cx={cx} cy={cy} r={7} fill="#0f4a1f" opacity={0.7} />
          <circle cx={cx} cy={cy - 4} r={5} fill="#145e26" opacity={0.75} />
          <polygon points={`${cx},${cy - 12} ${cx - 5},${cy - 4} ${cx + 5},${cy - 4}`}
            fill="#176b2a" opacity={0.65} />
        </g>
      ))}

      {/* Small lakes */}
      <ellipse cx={650} cy={430} rx={35} ry={18} fill="#0f2744" opacity={0.6} />
      <ellipse cx={650} cy={430} rx={28} ry={13} fill="#1a3d6b" opacity={0.4} />
      <ellipse cx={290} cy={140} rx={25} ry={13} fill="#0f2744" opacity={0.55} />
      <ellipse cx={290} cy={140} rx={20} ry={9} fill="#1a3d6b" opacity={0.35} />

      {/* Grid */}
      {Array.from({ length: 9 }, (_, row) =>
        Array.from({ length: 17 }, (_, col) => (
          <circle key={`g${row}-${col}`} cx={55 + col * 52} cy={32 + row * 62}
            r={0.9} fill="#2d5a2d" opacity={0.3} />
        ))
      )}

      {/* Coordinate labels */}
      {Array.from({ length: 9 }, (_, i) => (
        <text key={`cl${i}`} x={55 + i * 104} y={MAP_H - 5} textAnchor="middle"
          fontSize={8} fill="#2d4a2d" opacity={0.5}
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          {String.fromCharCode(65 + i)}
        </text>
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <text key={`rw${i}`} x={8} y={40 + i * 68} textAnchor="middle"
          fontSize={8} fill="#2d4a2d" opacity={0.5}
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          {i + 1}
        </text>
      ))}

      {/* Border tick marks */}
      {Array.from({ length: 20 }, (_, i) => (
        <g key={`bt${i}`}>
          <line x1={45 + i * 44} y1={0} x2={45 + i * 44} y2={5}
            stroke="#1a3a1a" strokeWidth={1} opacity={0.4} />
          <line x1={45 + i * 44} y1={MAP_H} x2={45 + i * 44} y2={MAP_H - 5}
            stroke="#1a3a1a" strokeWidth={1} opacity={0.4} />
        </g>
      ))}
    </g>
  );
}

// ══════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════

export default function Index() {
  const [phase, setPhase] = useState<GamePhase>("setup");
  const [tab, setTab] = useState<PanelTab>("attack");
  const [attackSide, setAttackSide] = useState<Side>("ru");
  const [defenseSide, setDefenseSide] = useState<Side>("us");

  // No budget limit
  const [droneOrders, setDroneOrders] = useState<DroneOrder[]>([]);
  const [selectedDroneType, setSelectedDroneType] = useState<string>("shahed");
  const [selectedSpawn, setSelectedSpawn] = useState<number>(0);

  const [placedPVOs, setPlacedPVOs] = useState<PlacedPVO[]>([]);
  const [selectedPVOType, setSelectedPVOType] = useState<string>("patriot");
  const [placingPVO, setPlacingPVO] = useState(false);

  const [bases, setBases] = useState<Base[]>(BASES.map(b => ({ ...b })));
  const [drones, setDrones] = useState<ActiveDrone[]>([]);
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [log, setLog] = useState<string[]>(["Оперативный центр активирован", "Настройте атаку и расставьте ПВО"]);
  const [stats, setStats] = useState({ dronesLost: 0, dronesReached: 0, shotsFired: 0 });

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addLog = useCallback((msg: string) => {
    const t = new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLog(prev => [`[${t}] ${msg}`, ...prev.slice(0, 19)]);
  }, []);

  const attackDrones = DRONE_TYPES.filter(d => d.side === attackSide || d.side === "both");
  const defensePVOs = PVO_TYPES.filter(p => p.side === defenseSide || p.side === "both");

  const totalDroneCount = droneOrders.reduce((s, o) => s + o.count, 0);

  const addDroneOrder = (typeId: string, spawnIdx: number, count: number) => {
    setDroneOrders(prev => {
      const existing = prev.find(o => o.typeId === typeId && o.spawnIdx === spawnIdx);
      if (existing) return prev.map(o => o.typeId === typeId && o.spawnIdx === spawnIdx ? { ...o, count: o.count + count } : o);
      return [...prev, { typeId, spawnIdx, count }];
    });
  };

  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!placingPVO || phase !== "setup") return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (MAP_W / rect.width);
    const y = (e.clientY - rect.top) * (MAP_H / rect.height);
    setPlacedPVOs(prev => [...prev, { uid: mkuid(), typeId: selectedPVOType, x, y, cooldown: 0, active: true }]);
    const pt = PVO_TYPES.find(t => t.id === selectedPVOType)!;
    addLog(`${pt.name} размещена на карте`);
    setPlacingPVO(false);
  };

  const startBattle = () => {
    if (droneOrders.length === 0) { addLog("Добавьте хотя бы один отряд!"); return; }
    const allDrones: ActiveDrone[] = [];
    droneOrders.forEach(order => {
      const dt = DRONE_TYPES.find(d => d.id === order.typeId)!;
      const sp = SPAWN_POINTS[order.spawnIdx];
      for (let i = 0; i < order.count; i++) {
        const target = BASES[i % BASES.length];
        const jx = sp.x + (Math.random() - 0.5) * 50;
        const jy = sp.y + (Math.random() - 0.5) * 50;
        allDrones.push({
          uid: mkuid(), typeId: order.typeId,
          x: jx, y: jy, tx: target.x, ty: target.y,
          hp: dt.hp, maxHp: dt.hp,
          speed: dt.speed + (Math.random() - 0.5) * 0.15,
          damage: dt.damage, destroyed: false, reached: false,
          trail: [], angle: angleTo(jx, jy, target.x, target.y),
        });
      }
    });
    setBases(BASES.map(b => ({ ...b })));
    setDrones(allDrones);
    setExplosions([]); setProjectiles([]);
    setStats({ dronesLost: 0, dronesReached: 0, shotsFired: 0 });
    addLog(`▶ Атака начата: ${allDrones.length} единиц в воздухе`);
    setPhase("battle"); setTab("log");
  };

  useEffect(() => {
    if (phase !== "battle") return;
    tickRef.current = setInterval(() => {
      setDrones(prev => prev.map(d => {
        if (d.destroyed || d.reached) return d;
        const dd = dist(d.x, d.y, d.tx, d.ty);
        if (dd < 15) return { ...d, reached: true };
        const nx = d.x + (d.tx - d.x) / dd * d.speed;
        const ny = d.y + (d.ty - d.y) / dd * d.speed;
        return { ...d, x: nx, y: ny, angle: angleTo(d.x, d.y, d.tx, d.ty), trail: [...d.trail.slice(-10), { x: d.x, y: d.y }] };
      }));

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
              const dt = DRONE_TYPES.find(t => t.id === d.typeId)!;
              if (dt.isStealth && !pt.detectsStealth && Math.random() < 0.6) continue;
              if (dist(pvo.x, pvo.y, d.x, d.y) <= pt.range) {
                d.hp -= pt.damage;
                pvo.cooldown = pt.fireRate;
                newProj.push({ uid: mkuid(), x: pvo.x, y: pvo.y, tx: d.x, ty: d.y, color: pt.color });
                setStats(s => ({ ...s, shotsFired: s.shotsFired + 1 }));
                if (d.hp <= 0) {
                  d.destroyed = true;
                  newExp.push({ uid: mkuid(), x: d.x, y: d.y });
                  setStats(s => ({ ...s, dronesLost: s.dronesLost + 1 }));
                  addLog(`✕ ${dt.name} сбит`);
                }
                break;
              }
            }
          });
          if (newExp.length) {
            setExplosions(p => [...p, ...newExp]);
            setTimeout(() => { const ids = newExp.map(e => e.uid); setExplosions(p => p.filter(e => !ids.includes(e.uid))); }, 700);
          }
          if (newProj.length) {
            setProjectiles(p => [...p, ...newProj]);
            setTimeout(() => { const ids = newProj.map(p => p.uid); setProjectiles(p => p.filter(pr => !ids.includes(pr.uid))); }, 180);
          }
          return ds;
        });
        return pvos;
      });

      setDrones(dPrev => {
        const reached = dPrev.filter(d => d.reached && !d.destroyed);
        if (reached.length > 0) {
          setBases(prev => prev.map(b => {
            const hits = reached.filter(d => dist(d.tx, d.ty, b.x, b.y) < 20);
            if (hits.length > 0) {
              const dmg = hits.reduce((s, d) => s + d.damage, 0);
              const newHp = Math.max(0, b.hp - dmg);
              if (newHp === 0 && b.hp > 0) addLog(`💥 ${b.label} УНИЧТОЖЕНА`);
              else addLog(`⚠ ${b.label}: -${dmg} HP`);
              setStats(s => ({ ...s, dronesReached: s.dronesReached + hits.length }));
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

  useEffect(() => {
    if (phase !== "battle" || drones.length === 0) return;
    if (drones.every(d => d.destroyed || d.reached)) {
      setTimeout(() => { setPhase("result"); addLog("━━ Операция завершена ━━"); }, 900);
    }
  }, [drones, phase]);

  const resetGame = () => {
    setPhase("setup"); setDroneOrders([]); setPlacedPVOs([]);
    setDrones([]); setExplosions([]); setProjectiles([]);
    setBases(BASES.map(b => ({ ...b }))); setPlacingPVO(false);
    setLog(["Система перезапущена"]); setTab("attack");
    setStats({ dronesLost: 0, dronesReached: 0, shotsFired: 0 });
  };

  const totalHp = bases.reduce((s, b) => s + b.hp, 0);
  const totalMax = bases.reduce((s, b) => s + b.maxHp, 0);
  const integrity = Math.round((totalHp / totalMax) * 100);
  const activeDrones = drones.filter(d => !d.destroyed && !d.reached).length;

  const RU_FLAG = "🇷🇺"; const US_FLAG = "🇺🇸";

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden"
      style={{ background: "#080e08", fontFamily: "'IBM Plex Mono', monospace" }}>

      {/* ══ TOP BAR ══ */}
      <header className="flex items-center justify-between px-4 py-2 border-b shrink-0"
        style={{ borderColor: "#162416", background: "linear-gradient(90deg, #0a120a 0%, #0d180d 100%)" }}>
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold tracking-[0.25em] uppercase" style={{ color: "#4ade80" }}>
            ОПЕРАЦИЯ РУБЕЖ
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-sm border"
            style={{ color: "#6b7280", borderColor: "#1a3a1a" }}>
            {phase === "setup" ? "ПЛАНИРОВАНИЕ" : phase === "battle" ? "⚡ БОЙ" : "ЗАВЕРШЕНО"}
          </span>
        </div>
        <div className="flex items-center gap-5">
          {phase === "battle" && <>
            <TopStat label="В ВОЗДУХЕ" v={activeDrones} c="#f97316" />
            <TopStat label="СБИТО" v={stats.dronesLost} c="#4ade80" />
            <TopStat label="ПРОРВАЛИСЬ" v={stats.dronesReached} c="#ef4444" />
            <TopStat label="ЦЕЛОСТНОСТЬ" v={`${integrity}%`}
              c={integrity > 60 ? "#4ade80" : integrity > 30 ? "#facc15" : "#ef4444"} />
          </>}
        </div>
      </header>

      {/* ══ MAIN ══ */}
      <div className="flex flex-1 min-h-0">

        {/* MAP */}
        <div className={`flex-1 relative overflow-hidden ${placingPVO ? "cursor-crosshair" : ""}`}>
          <svg width="100%" height="100%" viewBox={`0 0 ${MAP_W} ${MAP_H}`}
            preserveAspectRatio="xMidYMid meet" onClick={handleMapClick}>
            <defs>
              <radialGradient id="baseGlow"><stop offset="0%" stopColor="#4ade80" stopOpacity="0.25" /><stop offset="100%" stopColor="#4ade80" stopOpacity="0" /></radialGradient>
              <radialGradient id="explosionGrad"><stop offset="0%" stopColor="white" stopOpacity="1" /><stop offset="40%" stopColor="#fb923c" stopOpacity="0.9" /><stop offset="100%" stopColor="#dc2626" stopOpacity="0" /></radialGradient>
              <filter id="glow"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>

            <RealisticMap />

            {/* PVO ranges */}
            {placedPVOs.map(pvo => {
              const pt = PVO_TYPES.find(t => t.id === pvo.typeId)!;
              return (
                <circle key={`r${pvo.uid}`} cx={pvo.x} cy={pvo.y} r={pt.range}
                  fill={pt.color + "08"} stroke={pt.color} strokeWidth={0.6}
                  strokeDasharray="5 8" opacity={0.35} />
              );
            })}

            {/* Bases */}
            {bases.map(b => (
              <g key={b.id}>
                <circle cx={b.x} cy={b.y} r={50} fill="url(#baseGlow)" />
                <circle cx={b.x} cy={b.y} r={20} fill={b.hp > 0 ? "#0d1a0d" : "#1a0808"}
                  stroke={b.hp > 0 ? "#4ade80" : "#ef4444"} strokeWidth={1.5} filter="url(#glow)" />
                <text x={b.x} y={b.y + 6} textAnchor="middle" fontSize={12}
                  fill={b.hp > 0 ? "#4ade80" : "#ef4444"}>{b.icon}</text>
                <text x={b.x} y={b.y + 34} textAnchor="middle" fontSize={8}
                  fill={b.hp > 0 ? "#86efac" : "#fca5a5"} letterSpacing="0.05em">{b.label}</text>
                <rect x={b.x - 24} y={b.y + 38} width={48} height={4} fill="#111" rx={2} />
                <rect x={b.x - 24} y={b.y + 38} width={48 * (b.hp / b.maxHp)} height={4}
                  fill={b.hp / b.maxHp > 0.5 ? "#4ade80" : b.hp / b.maxHp > 0.2 ? "#facc15" : "#ef4444"} rx={2} />
              </g>
            ))}

            {/* PVO units */}
            {placedPVOs.map(pvo => {
              const pt = PVO_TYPES.find(t => t.id === pvo.typeId)!;
              return (
                <g key={pvo.uid} style={{ cursor: phase === "setup" ? "pointer" : "default" }}
                  onClick={(e) => { e.stopPropagation(); if (phase === "setup") setPlacedPVOs(p => p.filter(x => x.uid !== pvo.uid)); }}>
                  <circle cx={pvo.x} cy={pvo.y} r={18} fill="#0a1a0a"
                    stroke={pt.color} strokeWidth={1.5} />
                  <g transform={`translate(${pvo.x - 9},${pvo.y - 9})`}>
                    <PVOIcon type={pvo.typeId} color={pt.color} size={18} />
                  </g>
                  {phase === "battle" && pvo.typeId === "patriot" || pvo.typeId === "s400" || pvo.typeId === "s300" ? (
                    <line x1={pvo.x} y1={pvo.y} x2={pvo.x + 14} y2={pvo.y}
                      stroke={pt.color} strokeWidth={1.5} opacity={0.7}
                      style={{ transformOrigin: `${pvo.x}px ${pvo.y}px` }}
                      className="animate-pvo-rotate" />
                  ) : null}
                  {phase === "setup" && (
                    <circle cx={pvo.x + 13} cy={pvo.y - 13} r={7}
                      fill="#dc2626" opacity={0.9} />
                  )}
                  {phase === "setup" && (
                    <text x={pvo.x + 13} y={pvo.y - 10} textAnchor="middle"
                      fontSize={9} fill="white" fontWeight="bold">×</text>
                  )}
                </g>
              );
            })}

            {/* Drone trails */}
            {drones.filter(d => !d.destroyed && d.trail.length > 2).map(d => {
              const dt = DRONE_TYPES.find(t => t.id === d.typeId)!;
              return (
                <polyline key={`t${d.uid}`} points={d.trail.map(p => `${p.x},${p.y}`).join(" ")}
                  fill="none" stroke={dt.color} strokeWidth={0.7} opacity={0.25} />
              );
            })}

            {/* Drones */}
            {drones.filter(d => !d.destroyed && !d.reached).map(d => {
              const dt = DRONE_TYPES.find(t => t.id === d.typeId)!;
              return (
                <g key={d.uid} transform={`translate(${d.x},${d.y}) rotate(${d.angle + 90})`}>
                  <g transform="translate(-9,-9)">
                    <DroneIcon type={d.typeId} color={dt.color} size={18} />
                  </g>
                </g>
              );
            })}

            {/* Projectiles */}
            {projectiles.map(p => (
              <g key={p.uid}>
                <line x1={p.x} y1={p.y} x2={p.tx} y2={p.ty}
                  stroke={p.color} strokeWidth={1} opacity={0.5} />
                <circle cx={(p.x + p.tx) / 2} cy={(p.y + p.ty) / 2}
                  r={2.5} fill={p.color} opacity={0.9} />
              </g>
            ))}

            {/* Explosions */}
            {explosions.map(ex => (
              <g key={ex.uid} className="animate-explosion"
                style={{ transformOrigin: `${ex.x}px ${ex.y}px` }}>
                <circle cx={ex.x} cy={ex.y} r={22} fill="url(#explosionGrad)" />
                <circle cx={ex.x} cy={ex.y} r={10} fill="#fbbf24" opacity={0.8} />
              </g>
            ))}

            {/* Setup mode: spawn orders */}
            {phase === "setup" && tab === "attack" && droneOrders.map((order, i) => {
              const sp = SPAWN_POINTS[order.spawnIdx];
              const dt = DRONE_TYPES.find(d => d.id === order.typeId)!;
              return (
                <g key={i}>
                  <circle cx={sp.x} cy={sp.y} r={16} fill={dt.color + "22"} stroke={dt.color} strokeWidth={1.5} />
                  <text x={sp.x} y={sp.y + 5} textAnchor="middle" fontSize={11}
                    fill={dt.color} fontWeight="bold">{order.count}</text>
                </g>
              );
            })}

            {/* Placing hint */}
            {placingPVO && (
              <g>
                <rect x={MAP_W / 2 - 130} y={MAP_H / 2 - 14} width={260} height={28} rx={4}
                  fill="#0d1a0d" stroke="#facc15" strokeWidth={1} opacity={0.9} />
                <text x={MAP_W / 2} y={MAP_H / 2 + 5} textAnchor="middle" fontSize={11}
                  fill="#facc15">Кликните на карте для установки ПВО</text>
              </g>
            )}
          </svg>
        </div>

        {/* ══ PANEL ══ */}
        <aside className="w-80 flex flex-col overflow-hidden shrink-0 border-l"
          style={{ borderColor: "#162416", background: "linear-gradient(180deg, #0a120a 0%, #080e08 100%)" }}>

          {/* Tabs */}
          <div className="flex shrink-0 border-b" style={{ borderColor: "#162416" }}>
            {(["attack", "defense", "log"] as PanelTab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className="flex-1 py-2.5 text-[10px] uppercase tracking-[0.12em] transition-all relative"
                style={{
                  color: tab === t ? "#4ade80" : "#374151",
                  background: tab === t ? "#0d1a0d" : "transparent"
                }}>
                {t === "attack" ? "⚔ Атака" : t === "defense" ? "🛡 ПВО" : "📋 Журнал"}
                {tab === t && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-400" />}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin"
            style={{ scrollbarColor: "#1a3a1a transparent" }}>

            {/* ── ATTACK ── */}
            {tab === "attack" && (
              <div className="p-3 space-y-3">
                {/* Side selector */}
                <div className="flex gap-1.5">
                  {(["ru", "us"] as Side[]).map(s => (
                    <button key={s} onClick={() => { setAttackSide(s); setSelectedDroneType(DRONE_TYPES.find(d => d.side === s)!.id); }}
                      className="flex-1 py-2 text-xs font-semibold rounded-sm border transition-all"
                      style={{
                        borderColor: attackSide === s ? (s === "ru" ? "#ef4444" : "#3b82f6") : "#1a3a1a",
                        background: attackSide === s ? (s === "ru" ? "#ef444415" : "#3b82f615") : "transparent",
                        color: attackSide === s ? (s === "ru" ? "#fca5a5" : "#93c5fd") : "#4b5563"
                      }}>
                      {s === "ru" ? `${RU_FLAG} Россия` : `${US_FLAG} США/НАТО`}
                    </button>
                  ))}
                </div>

                {/* Total count */}
                {totalDroneCount > 0 && (
                  <div className="px-3 py-1.5 rounded-sm border text-center text-[10px]"
                    style={{ borderColor: "#1a3a1a", color: "#6b7280" }}>
                    В атаке: <span style={{ color: "#f97316", fontWeight: 600 }}>{totalDroneCount}</span> единиц
                  </div>
                )}

                {/* Drone cards */}
                <div className="space-y-1.5">
                  {attackDrones.map(dt => (
                    <button key={dt.id} onClick={() => setSelectedDroneType(dt.id)}
                      className="w-full text-left rounded-sm border transition-all overflow-hidden"
                      style={{
                        borderColor: selectedDroneType === dt.id ? dt.color : "#162416",
                        background: selectedDroneType === dt.id ? dt.color + "12" : "#0d130d",
                      }}>
                      <div className="flex items-center gap-2.5 px-2.5 py-2">
                        <div className="shrink-0 w-8 h-8 flex items-center justify-center rounded-sm"
                          style={{ background: dt.color + "18" }}>
                          <DroneIcon type={dt.id} color={dt.color} size={22} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[11px] font-semibold truncate" style={{ color: selectedDroneType === dt.id ? dt.color : "#d1d5db" }}>
                              {dt.name}
                            </span>
                            <div className="flex gap-1 shrink-0">
                              {dt.isStealth && <span className="text-[8px] px-1 py-0.5 rounded-sm bg-purple-900/40 text-purple-300 border border-purple-800/40">СТЕЛС</span>}
                              {dt.isBallistic && <span className="text-[8px] px-1 py-0.5 rounded-sm bg-red-900/40 text-red-300 border border-red-800/40">БАЛЛИСТ.</span>}
                            </div>
                          </div>
                          <div className="text-[9px] truncate mt-0.5" style={{ color: "#4b5563" }}>{dt.desc}</div>
                          <div className="flex gap-2.5 mt-1">
                            <span className="text-[9px]" style={{ color: "#6b7280" }}>❤ {dt.hp}</span>
                            <span className="text-[9px]" style={{ color: "#6b7280" }}>⚡ {dt.speed.toFixed(1)}</span>
                            <span className="text-[9px]" style={{ color: "#6b7280" }}>💥 {dt.damage}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Spawn grid */}
                <div>
                  <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "#4b5563" }}>Направление атаки</div>
                  <div className="grid grid-cols-4 gap-1">
                    {SPAWN_POINTS.map((sp, i) => (
                      <button key={i} onClick={() => setSelectedSpawn(i)}
                        className="py-2 rounded-sm border text-[10px] font-semibold transition-all"
                        style={{
                          borderColor: selectedSpawn === i ? "#ef4444" : "#162416",
                          background: selectedSpawn === i ? "#ef444418" : "#0d130d",
                          color: selectedSpawn === i ? "#fca5a5" : "#374151",
                        }}>
                        {sp.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Count buttons */}
                <div>
                  <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "#4b5563" }}>Добавить в отряд</div>
                  <div className="grid grid-cols-4 gap-1">
                    {[1, 5, 10, 25].map(n => (
                      <button key={n} onClick={() => addDroneOrder(selectedDroneType, selectedSpawn, n)}
                        className="py-2 rounded-sm border text-[11px] font-bold transition-all"
                        style={{ borderColor: "#1a4a1a", background: "#0d1a0d", color: "#4ade80" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#4ade8018"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#0d1a0d"; }}>
                        +{n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Orders list */}
                {droneOrders.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "#4b5563" }}>Состав атаки</div>
                    <div className="space-y-1">
                      {droneOrders.map((o, i) => {
                        const dt = DRONE_TYPES.find(d => d.id === o.typeId)!;
                        return (
                          <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-sm border"
                            style={{ background: dt.color + "0e", borderColor: dt.color + "30" }}>
                            <DroneIcon type={dt.id} color={dt.color} size={14} />
                            <span className="text-[10px] flex-1" style={{ color: "#d1d5db" }}>
                              {dt.name} × <span style={{ color: dt.color, fontWeight: 600 }}>{o.count}</span>
                            </span>
                            <span className="text-[9px]" style={{ color: "#4b5563" }}>{SPAWN_POINTS[o.spawnIdx].label}</span>
                            <button onClick={() => setDroneOrders(prev => prev.filter((_, idx) => idx !== i))}
                              className="text-[10px] ml-1" style={{ color: "#ef4444" }}>✕</button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {phase === "setup" && (
                  <button onClick={startBattle} disabled={droneOrders.length === 0}
                    className="w-full py-3 text-xs font-bold uppercase tracking-[0.15em] rounded-sm border transition-all disabled:opacity-25"
                    style={{ borderColor: "#ef4444", color: "#ef4444", background: "transparent" }}
                    onMouseEnter={e => { if (!droneOrders.length) return; (e.currentTarget as HTMLButtonElement).style.background = "#ef4444"; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "#ef4444"; }}>
                    ▶ НАЧАТЬ АТАКУ
                  </button>
                )}
              </div>
            )}

            {/* ── DEFENSE ── */}
            {tab === "defense" && (
              <div className="p-3 space-y-3">
                {/* Side */}
                <div className="flex gap-1.5">
                  {(["ru", "us"] as Side[]).map(s => (
                    <button key={s} onClick={() => { setDefenseSide(s); setSelectedPVOType(PVO_TYPES.find(p => p.side === s)!.id); }}
                      className="flex-1 py-2 text-xs font-semibold rounded-sm border transition-all"
                      style={{
                        borderColor: defenseSide === s ? (s === "ru" ? "#ef4444" : "#3b82f6") : "#1a3a1a",
                        background: defenseSide === s ? (s === "ru" ? "#ef444415" : "#3b82f615") : "transparent",
                        color: defenseSide === s ? (s === "ru" ? "#fca5a5" : "#93c5fd") : "#4b5563"
                      }}>
                      {s === "ru" ? `${RU_FLAG} Россия` : `${US_FLAG} США/НАТО`}
                    </button>
                  ))}
                </div>

                <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "#4b5563" }}>Выбор комплекса</div>
                <div className="space-y-1.5">
                  {defensePVOs.map(pt => (
                    <button key={pt.id} onClick={() => setSelectedPVOType(pt.id)}
                      className="w-full text-left rounded-sm border transition-all"
                      style={{
                        borderColor: selectedPVOType === pt.id ? pt.color : "#162416",
                        background: selectedPVOType === pt.id ? pt.color + "12" : "#0d130d",
                      }}>
                      <div className="flex items-center gap-2.5 px-2.5 py-2">
                        <div className="shrink-0 w-8 h-8 flex items-center justify-center rounded-sm"
                          style={{ background: pt.color + "18" }}>
                          <PVOIcon type={pt.id} color={pt.color} size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[11px] font-semibold" style={{ color: selectedPVOType === pt.id ? pt.color : "#d1d5db" }}>
                              {pt.name}
                            </span>
                            {pt.detectsStealth && (
                              <span className="text-[8px] px-1 py-0.5 rounded-sm bg-cyan-900/40 text-cyan-300 border border-cyan-800/40">СТЕЛС</span>
                            )}
                          </div>
                          <div className="text-[9px] mt-0.5 truncate" style={{ color: "#4b5563" }}>{pt.desc}</div>
                          <div className="flex gap-2.5 mt-1">
                            <span className="text-[9px]" style={{ color: "#6b7280" }}>📡 {pt.range}м</span>
                            <span className="text-[9px]" style={{ color: "#6b7280" }}>⚡ {pt.fireRate}тик</span>
                            <span className="text-[9px]" style={{ color: "#6b7280" }}>💥 {pt.damage}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {phase === "setup" && (
                  <button onClick={() => setPlacingPVO(p => !p)}
                    className="w-full py-2.5 text-xs font-semibold rounded-sm border transition-all"
                    style={{
                      borderColor: placingPVO ? "#facc15" : "#4ade80",
                      color: placingPVO ? "#facc15" : "#4ade80",
                      background: placingPVO ? "#facc1512" : "#4ade8008",
                    }}>
                    {placingPVO ? "✕ Отмена" : "+ Разместить на карте"}
                  </button>
                )}

                {/* Placed list */}
                {placedPVOs.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "#4b5563" }}>
                      Развёрнуто ({placedPVOs.length})
                    </div>
                    <div className="space-y-1">
                      {placedPVOs.map(pvo => {
                        const pt = PVO_TYPES.find(t => t.id === pvo.typeId)!;
                        return (
                          <div key={pvo.uid} className="flex items-center gap-2 px-2.5 py-1.5 rounded-sm border"
                            style={{ background: pt.color + "0e", borderColor: pt.color + "30" }}>
                            <PVOIcon type={pvo.typeId} color={pt.color} size={14} />
                            <span className="text-[10px] flex-1" style={{ color: "#d1d5db" }}>{pt.name}</span>
                            {phase === "setup" && (
                              <button onClick={() => setPlacedPVOs(p => p.filter(x => x.uid !== pvo.uid))}
                                style={{ color: "#ef4444", fontSize: 10 }}>✕</button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Base status */}
                <div>
                  <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "#4b5563" }}>Объекты обороны</div>
                  {bases.map(b => (
                    <div key={b.id} className="mb-2">
                      <div className="flex justify-between mb-1">
                        <span className="text-[10px]" style={{ color: "#d1d5db" }}>{b.icon} {b.label}</span>
                        <span className="text-[10px] font-semibold"
                          style={{ color: b.hp / b.maxHp > 0.5 ? "#4ade80" : b.hp / b.maxHp > 0.2 ? "#facc15" : "#ef4444" }}>
                          {b.hp}/{b.maxHp}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: "#111" }}>
                        <div className="h-full rounded-full transition-all duration-200"
                          style={{
                            width: `${(b.hp / b.maxHp) * 100}%`,
                            background: b.hp / b.maxHp > 0.5 ? "#4ade80" : b.hp / b.maxHp > 0.2 ? "#facc15" : "#ef4444"
                          }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── LOG ── */}
            {tab === "log" && (
              <div className="p-3">
                <div className="text-[10px] uppercase tracking-widest mb-3" style={{ color: "#4b5563" }}>Боевой журнал</div>
                <div className="space-y-1">
                  {log.map((entry, i) => (
                    <div key={i} className="text-[10px] leading-relaxed"
                      style={{ color: i === 0 ? "#e5e7eb" : "#374151" }}>
                      {entry}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Result panel */}
          {phase === "result" && (
            <div className="border-t p-4 space-y-3 shrink-0" style={{ borderColor: "#162416" }}>
              <div className="text-[10px] uppercase tracking-widest" style={{ color: "#6b7280" }}>
                Итог операции
              </div>
              <div className="grid grid-cols-2 gap-2">
                <ResStat label="Сбито" v={stats.dronesLost} c="#4ade80" />
                <ResStat label="Прорвалось" v={stats.dronesReached} c="#ef4444" />
                <ResStat label="Выстрелов" v={stats.shotsFired} c="#60a5fa" />
                <ResStat label="Целостность" v={`${integrity}%`} c={integrity > 60 ? "#4ade80" : integrity > 30 ? "#facc15" : "#ef4444"} />
              </div>
              <button onClick={resetGame}
                className="w-full py-2.5 text-xs font-bold uppercase tracking-widest rounded-sm border transition-all"
                style={{ borderColor: "#4ade80", color: "#4ade80", background: "transparent" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#4ade80"; (e.currentTarget as HTMLButtonElement).style.color = "#000"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "#4ade80"; }}>
                ↺ НОВАЯ ОПЕРАЦИЯ
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function TopStat({ label, v, c }: { label: string; v: string | number; c: string }) {
  return (
    <div className="flex flex-col items-end">
      <span className="text-[8px] uppercase tracking-widest" style={{ color: "#374151" }}>{label}</span>
      <span className="text-sm font-bold" style={{ color: c }}>{v}</span>
    </div>
  );
}

function ResStat({ label, v, c }: { label: string; v: string | number; c: string }) {
  return (
    <div className="px-2.5 py-2 rounded-sm border" style={{ background: "#0d1a0d", borderColor: "#162416" }}>
      <div className="text-[9px] mb-0.5" style={{ color: "#4b5563" }}>{label}</div>
      <div className="text-sm font-bold" style={{ color: c }}>{v}</div>
    </div>
  );
}
