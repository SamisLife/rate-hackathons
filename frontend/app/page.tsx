"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import hackathonsData from "../data/hackathons.json";

type Ratings = {
  food: number;
  organization: number;
  judging: number;
  prizes: number;
  mentorship: number;
};

type Hackathon = {
  id: number;
  name: string;
  org: string;
  city: string;
  prize: string;
  size: string;
  votes: number;
  wins: number;
  color: string;
  accent: string;
  accommodation: boolean;
  reimbursement: boolean;
  ratings: Ratings;
};

type ViewMode = "vote" | "rankings";
type VotePhase = "idle" | "voted";
type CardState = "idle" | "winner" | "loser";

type IconProps = {
  s?: number;
  c?: string;
};

type ChipProps = {
  icon: (props: IconProps) => JSX.Element;
  label: string;
  available?: boolean;
  type?: "neutral" | "green" | "blue";
  compact?: boolean;
};

const DATA = hackathonsData as Hackathon[];
const RATING_KEYS: (keyof Ratings)[] = [
  "food",
  "organization",
  "judging",
  "prizes",
  "mentorship",
];

const T = {
  bg: "#0d1117",
  bgElevated: "#161b22",
  bgOverlay: "#1c2128",
  bgHover: "#1f2937",
  border: "#30363d",
  borderMuted: "#21262d",
  text: "#e6edf3",
  textMuted: "#7d8590",
  textSubtle: "#484f58",
  green: "#2ea043",
  greenLight: "#3fb950",
  greenBg: "#0f2d1a",
  greenBorder: "#196c2e",
  blue: "#58a6ff",
  blueBg: "#051d4d",
  blueBorder: "#1f6feb",
  red: "#e31e3c",
  redBg: "#2d1316",
  redBorder: "#6e2630",
  orange: "#e3b341",
};

const winRate = (h: Hackathon) => (h.votes > 0 ? (h.wins / h.votes) * 100 : 0);
const avgRating = (h: Hackathon) => Object.values(h.ratings).reduce((a, b) => a + b, 0) / 5;

function ratingColor(v: number) {
  if (v >= 4.5) return T.greenLight;
  if (v >= 4.0) return T.blue;
  if (v >= 3.5) return T.orange;
  return "#f85149";
}

function shuffle<TValue>(arr: TValue[]) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function nextPair(list: Hackathon[], exclude: number[] = []): [Hackathon, Hackathon] {
  const pool = list.filter((h) => !exclude.includes(h.id));
  const picked = shuffle(pool.length >= 2 ? pool : list);
  return [picked[0], picked[1]];
}

function getInitials(name: string) {
  return name.replace(/[^A-Z]/g, "").slice(0, 2) || name.slice(0, 2).toUpperCase();
}

function FlameStreak({ streak }: { streak: number }) {
  const [phase, setPhase] = useState<"dormant" | "igniting" | "burning">("dormant");
  const [displayNum, setDisplayNum] = useState(streak);
  const [numBounce, setNumBounce] = useState(false);
  const prevStreak = useRef(streak);
  const burnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const numTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (streak > prevStreak.current) {
      setPhase("igniting");
      setNumBounce(true);

      if (bounceTimer.current) clearTimeout(bounceTimer.current);
      bounceTimer.current = setTimeout(() => setNumBounce(false), 500);

      if (burnTimer.current) clearTimeout(burnTimer.current);
      burnTimer.current = setTimeout(() => setPhase("burning"), 650);

      if (numTimer.current) clearTimeout(numTimer.current);
      numTimer.current = setTimeout(() => setDisplayNum(streak), 120);
    }

    prevStreak.current = streak;
  }, [streak]);

  useEffect(
    () => () => {
      if (burnTimer.current) clearTimeout(burnTimer.current);
      if (bounceTimer.current) clearTimeout(bounceTimer.current);
      if (numTimer.current) clearTimeout(numTimer.current);
    },
    [],
  );

  const isCold = phase === "dormant";
  const isIgniting = phase === "igniting";
  const flameColor = isCold ? "#3d444d" : isIgniting ? "#fbbf24" : "#f97316";
  const innerColor = isCold ? "#2d333b" : isIgniting ? "#fef08a" : "#fb923c";
  const glowSize = isCold ? "0px" : isIgniting ? "10px" : "5px";
  const glowColor = isCold ? "transparent" : isIgniting ? "#fbbf2466" : "#f9731644";
  const numColor = isCold ? T.textSubtle : isIgniting ? "#fef08a" : "#fdba74";

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "5px 10px",
        borderRadius: 999,
        background: isCold ? T.bgOverlay : isIgniting ? "#2d1a0a" : "#1e1208",
        border: `1px solid ${isCold ? T.borderMuted : isIgniting ? "#854d0e55" : "#78350f44"}`,
        transition: "background 0.6s ease, border-color 0.6s ease",
      }}
    >
      <div
        style={{
          position: "relative",
          width: 16,
          height: 20,
          flexShrink: 0,
          animation:
            isIgniting
              ? "flameIgnite 0.65s cubic-bezier(0.34,1.56,0.64,1) forwards"
              : phase === "burning"
                ? "flameBurn 2.4s ease-in-out infinite"
                : "none",
          transformOrigin: "50% 90%",
          filter: `drop-shadow(0 0 ${glowSize} ${glowColor})`,
          transition: "filter 0.4s ease",
        }}
      >
        <svg width="16" height="20" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M8 1C8 1 12.5 5.5 12 10.5C11.8 8.5 10.5 7.5 10.5 7.5C10.5 7.5 12 11 10 14C10 11.5 8.5 10.5 8.5 10.5C8.5 10.5 9 13 7.5 15.5C6 13 6.5 10.5 6.5 10.5C6.5 10.5 5 11.5 5 14C3 11 4.5 7.5 4.5 7.5C4.5 7.5 3.2 8.5 3 10.5C2.5 5.5 7 1 8 1Z"
            fill={flameColor}
            style={{ transition: "fill 0.45s ease" }}
          />
          <path
            d="M8 8C8 8 10 10.5 9.5 13C9.3 11.5 8.5 11 8.5 11C8.5 11 9 13 7.8 15C6.6 13 7.2 11 7.2 11C7.2 11 6.5 11.5 6.3 13C5.8 10.5 7.5 8 8 8Z"
            fill={innerColor}
            style={{ transition: "fill 0.35s ease" }}
          />
          <circle
            cx="8"
            cy="17.5"
            r="1.5"
            fill={isCold ? "#2d333b" : "#f97316"}
            opacity={isCold ? 0.3 : 0.6}
            style={{ transition: "fill 0.5s ease, opacity 0.5s ease" }}
          />
        </svg>
      </div>

      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: numColor,
          letterSpacing: "-0.02em",
          animation: numBounce ? "numPop 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards" : "none",
          display: "inline-block",
          transition: "color 0.45s ease",
          minWidth: 14,
          textAlign: "center",
        }}
      >
        {displayNum}
      </span>
    </div>
  );
}

const Ico = {
  Zap: ({ s = 14, c = "currentColor" }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  BarChart: ({ s = 14, c = "currentColor" }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  Home: ({ s = 12, c = "currentColor" }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Plane: ({ s = 12, c = "currentColor" }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19 4c-1 0-2 .5-2.7 1.3L13 9 4.8 6.2c-.5-.2-1.1 0-1.4.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.5-.3.7-.9.5-1.4z" />
    </svg>
  ),
  Trophy: ({ s = 12, c = "currentColor" }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
    </svg>
  ),
  Users: ({ s = 12, c = "currentColor" }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Star: ({ s = 12, c = "currentColor" }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  Check: ({ s = 12, c = "currentColor" }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  ChevronDown: ({ s = 14, c = "currentColor", up = false }: IconProps & { up?: boolean }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: up ? "rotate(180deg)" : "none", transition: "transform .2s ease" }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
};

function HackAvatar({ h, size = 40 }: { h: Hackathon; size?: number }) {
  const initials = getInitials(h.name);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.24),
        background: `linear-gradient(145deg, ${h.color}dd, ${h.color}99)`,
        border: `1.5px solid ${h.color}66`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: `0 0 0 1px ${T.border}, 0 2px 8px rgba(0,0,0,.5)`,
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(145deg, rgba(255,255,255,0.18), transparent 58%)" }} />
      <span style={{ position: "relative", color: "rgba(255,255,255,.95)", fontSize: size * 0.3, fontWeight: 700 }}>{initials}</span>
    </div>
  );
}

function Chip({ icon: Icon, label, available = true, type = "neutral", compact = false }: ChipProps) {
  const styles = {
    green: { color: T.greenLight, bg: T.greenBg, border: T.greenBorder },
    blue: { color: T.blue, bg: T.blueBg, border: T.blueBorder },
    neutral: { color: T.textMuted, bg: T.bgOverlay, border: T.border },
    off: { color: "#f85149", bg: T.redBg, border: T.redBorder },
  };

  const s = available ? styles[type] : styles.off;

  if (compact) {
    return (
      <div
        title={label}
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          border: `1px solid ${s.border}`,
          background: s.bg,
          color: s.color,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          opacity: available ? 1 : 0.8,
        }}
      >
        <Icon s={11} c={s.color} />
        {!available && <div style={{ position: "absolute", width: "130%", height: "1.5px", transform: "rotate(-32deg)", background: s.color, opacity: 0.7 }} />}
      </div>
    );
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        borderRadius: 999,
        border: `1px solid ${s.border}`,
        background: s.bg,
        color: s.color,
        fontSize: 11,
        position: "relative",
        opacity: available ? 1 : 0.82,
      }}
    >
      <Icon s={10} c={s.color} />
      {label}
      {!available && <div style={{ position: "absolute", left: 6, right: 6, top: "50%", height: 1, transform: "translateY(-50%)", background: s.color, opacity: 0.6 }} />}
    </span>
  );
}

function RatingStrip({ h }: { h: Hackathon }) {
  return (
    <div>
      <div style={{ display: "flex", height: 4, borderRadius: 4, overflow: "hidden", gap: 1, marginBottom: 6 }}>
        {RATING_KEYS.map((k) => (
          <div key={k} style={{ flex: h.ratings[k], background: ratingColor(h.ratings[k]) }} />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {RATING_KEYS.map((k) => (
          <span key={k} style={{ fontSize: 10, color: T.textSubtle }}>
            {k === "organization" ? "org" : k === "mentorship" ? "mentor" : k} {h.ratings[k].toFixed(1)}
          </span>
        ))}
      </div>
    </div>
  );
}

function VoteCard({ h, onVote, state, isIdle }: { h: Hackathon; onVote: (id: number) => void; state: CardState; isIdle: boolean }) {
  const [hovered, setHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement | null>(null);

  const onMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!ref.current || !isIdle) return;
      const r = ref.current.getBoundingClientRect();
      setTilt({
        x: ((e.clientY - (r.top + r.height / 2)) / (r.height / 2)) * -4,
        y: ((e.clientX - (r.left + r.width / 2)) / (r.width / 2)) * 4,
      });
    },
    [isIdle],
  );

  const isWinner = state === "winner";
  const isLoser = state === "loser";

  let transformBase = `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`;
  if (isWinner) transformBase = "perspective(1200px) scale(1.03) translateY(-4px)";
  if (isLoser) transformBase = "perspective(1200px) scale(.96) translateY(4px)";

  const dotSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20'><circle cx='2' cy='2' r='1.2' fill='${encodeURIComponent(h.accent)}' opacity='0.35'/></svg>`;

  return (
    <div
      ref={ref}
      onClick={() => isIdle && onVote(h.id)}
      onMouseEnter={() => isIdle && setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setTilt({ x: 0, y: 0 });
      }}
      onMouseMove={onMove}
      style={{
        flex: 1,
        maxWidth: 360,
        minWidth: 270,
        background: T.bgElevated,
        border: `1px solid ${isWinner ? T.green : hovered && isIdle ? T.border : T.borderMuted}`,
        borderRadius: 12,
        overflow: "hidden",
        cursor: isIdle ? "pointer" : "default",
        transform: `${transformBase} scale(${hovered && isIdle ? 1.01 : 1})`,
        opacity: isLoser ? 0.38 : 1,
        transition: "all .3s cubic-bezier(0.25,1,0.4,1)",
        boxShadow: isWinner ? `0 0 0 1px ${T.greenBorder}, 0 8px 32px rgba(46,160,67,0.25)` : hovered && isIdle ? "0 8px 32px rgba(0,0,0,0.5)" : "none",
      }}
    >
      <div style={{ height: 56, position: "relative", overflow: "hidden", backgroundImage: `url("data:image/svg+xml,${dotSvg}"), linear-gradient(135deg, ${h.color}ee 0%, ${h.color}88 100%)` }}>
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg,transparent 40%,${h.color}22 100%)` }} />
        <div style={{ position: "absolute", bottom: 8, right: 12, fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,.55)", letterSpacing: ".04em", textTransform: "uppercase" }}>{h.org}</div>
        {isWinner && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(46,160,67,.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.green, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 20px ${T.green}88` }}>
              <Ico.Check s={16} c="#fff" />
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: "16px 18px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <HackAvatar h={h} size={44} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: T.text, letterSpacing: "-.02em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{h.name}</h2>
              <span style={{ fontSize: 10, color: T.textSubtle, fontWeight: 600, background: T.bgOverlay, border: `1px solid ${T.borderMuted}`, borderRadius: 6, padding: "2px 7px" }}>{avgRating(h).toFixed(2)} avg</span>
            </div>
            <div style={{ marginTop: 3, fontSize: 11, color: T.textSubtle }}>{h.city}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <Chip icon={Ico.Trophy} label={h.prize} type="neutral" />
          <Chip icon={Ico.Users} label={h.size} type="neutral" />
          <Chip icon={Ico.Home} label="Housing" available={h.accommodation} type="green" />
          <Chip icon={Ico.Plane} label="Travel" available={h.reimbursement} type="blue" />
        </div>

        <RatingStrip h={h} />

        {isIdle && (
          <button
            style={{
              width: "100%",
              padding: "7px 14px",
              borderRadius: 6,
              border: `1px solid ${hovered ? "#3fb950" : T.greenBorder}`,
              background: hovered ? "linear-gradient(180deg,#2ea043,#238636)" : "linear-gradient(180deg,#238636,#1c6f2a)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              boxShadow: hovered ? "0 0 0 3px rgba(46,160,67,.4)" : "none",
            }}
          >
            <Ico.Zap s={13} c="#fff" />
            Vote for {h.name}
          </button>
        )}

        {isLoser && <div style={{ padding: "7px 14px", borderRadius: 6, border: `1px solid ${T.borderMuted}`, background: T.bgOverlay, color: T.textSubtle, fontSize: 12, textAlign: "center" }}>Not this time</div>}
      </div>
    </div>
  );
}

function RankingRow({ h, i, expanded, onToggle }: { h: Hackathon; i: number; expanded: boolean; onToggle: () => void }) {
  return (
    <div style={{ borderBottom: `1px solid ${T.borderMuted}`, background: expanded ? T.bgHover : "transparent" }}>
      <div onClick={onToggle} style={{ display: "flex", alignItems: "center", padding: "10px 16px", cursor: "pointer" }}>
        <div style={{ width: 36, textAlign: "center", fontSize: i < 3 ? 15 : 11, color: T.textSubtle }}>{i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}</div>
        <div style={{ marginRight: 10 }}><HackAvatar h={h} size={30} /></div>

        <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>{h.name}</div>
          <div style={{ fontSize: 10, color: T.textSubtle }}>{h.city}</div>
        </div>

        <div style={{ display: "flex", gap: 4, marginRight: 14 }}>
          <Chip icon={Ico.Home} label="Housing" available={h.accommodation} type="green" compact />
          <Chip icon={Ico.Plane} label="Travel" available={h.reimbursement} type="blue" compact />
        </div>

        <div style={{ width: 64, marginRight: 16, fontSize: 11, color: T.textSubtle }}>{(h.votes / 1000).toFixed(1)}k</div>

        <div style={{ width: 90, marginRight: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            <span style={{ fontSize: 9, color: T.textSubtle, textTransform: "uppercase" }}>win rate</span>
            <span style={{ fontSize: 10.5, color: T.greenLight, fontWeight: 600 }}>{winRate(h).toFixed(1)}%</span>
          </div>
          <div style={{ height: 4, borderRadius: 4, background: T.bgOverlay, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${winRate(h)}%`, background: `linear-gradient(90deg,${T.green},${T.greenLight})` }} />
          </div>
        </div>

        <Ico.ChevronDown s={14} c={T.textSubtle} up={expanded} />
      </div>

      {expanded && (
        <div style={{ padding: "0 16px 14px", paddingLeft: 62, animation: "rh-expand-down .22s ease" }}>
          <div style={{ borderTop: `1px solid ${T.borderMuted}`, paddingTop: 12, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={{ fontSize: 10, color: T.textSubtle, textTransform: "uppercase", marginBottom: 8 }}>Category Ratings</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {RATING_KEYS.map((k) => (
                  <div key={k} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 10, width: 58, color: T.textSubtle }}>{k === "organization" ? "org" : k}</span>
                    <div style={{ flex: 1, height: 4, borderRadius: 4, background: T.bgOverlay, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(h.ratings[k] / 5) * 100}%`, background: ratingColor(h.ratings[k]) }} />
                    </div>
                    <span style={{ fontSize: 11, color: ratingColor(h.ratings[k]), width: 28, textAlign: "right" }}>{h.ratings[k]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RateHackathonsPage() {
  const [hackathons, setHackathons] = useState<Hackathon[]>(DATA);
  const [view, setView] = useState<ViewMode>("vote");
  const [pair, setPair] = useState<[Hackathon, Hackathon]>([DATA[0], DATA[1]]);
  const [phase, setPhase] = useState<VotePhase>("idle");
  const [votedId, setVotedId] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [visible, setVisible] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    setPair(nextPair(DATA));
  }, []);

  const sorted = useMemo(() => [...hackathons].sort((a, b) => winRate(b) - winRate(a)), [hackathons]);

  const handleVote = useCallback(
    (id: number) => {
      if (phase !== "idle") return;

      setPhase("voted");
      setVotedId(id);

      setHackathons((prev) =>
        prev.map((h) =>
          h.id === id
            ? { ...h, votes: h.votes + 1, wins: h.wins + 1 }
            : pair.some((p) => p.id === h.id)
              ? { ...h, votes: h.votes + 1 }
              : h,
        ),
      );

      setStreak((s) => s + 1);

      setTimeout(() => {
        setVisible(false);
        setTimeout(() => {
          setPair(nextPair(hackathons, [id]));
          setVotedId(null);
          setPhase("idle");
          setVisible(true);
        }, 320);
      }, 950);
    },
    [hackathons, pair, phase],
  );

  const skip = () => {
    if (phase !== "idle") return;
    setVisible(false);
    setTimeout(() => {
      setPair(nextPair(hackathons));
      setVisible(true);
    }, 320);
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text }}>
      <header style={{ background: "#161b22", borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1012, margin: "0 auto", padding: "0 16px", display: "flex", alignItems: "center", height: 56, gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: T.red, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Ico.Zap s={15} c="#fff" />
            </div>
            <span style={{ fontSize: 15, fontWeight: 700 }}>RateHackathons</span>
          </div>

          <nav style={{ display: "flex", marginLeft: 4 }}>
            {[
              { key: "vote", label: "Vote", Icon: Ico.Zap },
              { key: "rankings", label: "Rankings", Icon: Ico.BarChart },
            ].map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setView(key as ViewMode)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  height: 56,
                  padding: "0 14px",
                  background: "transparent",
                  border: "none",
                  borderBottom: view === key ? `2px solid ${T.red}` : "2px solid transparent",
                  color: view === key ? T.text : T.textMuted,
                  cursor: "pointer",
                }}
              >
                <Icon s={13} c={view === key ? T.text : T.textSubtle} />
                {label}
              </button>
            ))}
          </nav>

          <div style={{ flex: 1 }} />

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${T.borderMuted}`, background: T.bgOverlay, fontSize: 11, color: T.textMuted }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Ico.Star s={11} c={T.textSubtle} />
                {hackathons.reduce((s, h) => s + h.votes, 0).toLocaleString()} votes
              </span>
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1012, margin: "0 auto", padding: "0 16px" }}>
        {view === "vote" ? (
          <div className="rh-fade-up" style={{ animation: "rh-fade-up .35s ease" }}>
            <div style={{ textAlign: "center", padding: "48px 0 36px" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: T.redBg, border: `1px solid ${T.redBorder}`, borderRadius: 999, padding: "4px 12px", marginBottom: 16 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.red }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: "#f85149", letterSpacing: ".03em", textTransform: "uppercase" }}>Hackathon Season 2026</span>
              </div>
              <h1 style={{ fontSize: 40, fontWeight: 800, marginBottom: 12, lineHeight: 1.1 }}>
                Which hackathon deserves
                <br />
                <span style={{ color: T.green }}>your weekend?</span>
              </h1>
              <p style={{ fontSize: 14, color: T.textMuted, maxWidth: 420, margin: "0 auto", lineHeight: 1.6 }}>
                Head-to-head voting builds the most trusted hackathon ranking on the internet.
              </p>
            </div>

            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
              <FlameStreak streak={streak} />
            </div>

            <div style={{ display: "flex", gap: 16, alignItems: "stretch", justifyContent: "center", flexWrap: "wrap", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(-6px)", transition: "opacity .28s ease, transform .28s ease" }}>
              <VoteCard h={pair[0]} onVote={handleVote} state={votedId === pair[0].id ? "winner" : votedId ? "loser" : "idle"} isIdle={phase === "idle"} />

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: "20px 0" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: T.bgElevated, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: T.textSubtle }}>
                  vs
                </div>
              </div>

              <VoteCard h={pair[1]} onVote={handleVote} state={votedId === pair[1].id ? "winner" : votedId ? "loser" : "idle"} isIdle={phase === "idle"} />
            </div>

            <div style={{ textAlign: "center", marginTop: 20, paddingBottom: 48 }}>
              <button onClick={skip} style={{ background: "none", border: "none", cursor: "pointer", color: T.textSubtle, fontSize: 12 }}>
                Skip this matchup
              </button>
            </div>
          </div>
        ) : (
          <div className="rh-fade-up" style={{ animation: "rh-fade-up .35s ease", paddingBottom: 48 }}>
            <div style={{ borderBottom: `1px solid ${T.borderMuted}`, paddingBottom: 16 }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, marginTop: 28 }}>Hackathon Rankings</h1>
              <p style={{ fontSize: 12, color: T.textSubtle }}>{hackathons.length} hackathons · ranked by community win rate · click to expand</p>
            </div>

            <div style={{ border: `1px solid ${T.border}`, borderRadius: 6, overflow: "hidden", marginTop: 16 }}>
              <div style={{ display: "flex", alignItems: "center", padding: "8px 16px", background: T.bgElevated, borderBottom: `1px solid ${T.border}` }}>
                <div style={{ width: 36 }} />
                <div style={{ width: 40, marginRight: 10 }} />
                <div style={{ flex: 1, fontSize: 10, color: T.textSubtle, textTransform: "uppercase" }}>Hackathon</div>
                <div style={{ width: 53, marginRight: 14, fontSize: 10, color: T.textSubtle, textTransform: "uppercase", textAlign: "center" }}>Perks</div>
                <div style={{ width: 64, marginRight: 16, fontSize: 10, color: T.textSubtle, textTransform: "uppercase" }}>Votes</div>
                <div style={{ width: 90, marginRight: 8, fontSize: 10, color: T.textSubtle, textTransform: "uppercase" }}>Win Rate</div>
                <div style={{ width: 14 }} />
              </div>

              {sorted.map((h, i) => (
                <RankingRow key={h.id} h={h} i={i} expanded={expanded === h.id} onToggle={() => setExpanded(expanded === h.id ? null : h.id)} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}