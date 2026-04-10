"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
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

type HackathonScore = {
  id: number;
  rawVotes: number;      // integer count of votes cast (display)
  weightedVotes: number; // sum of weights (ranking)
  weightedWins: number;  // sum of winner weights (ranking)
  winRate: number;       // weightedWins/weightedVotes×100
};

type VoteWeight = { weight: number; tier: string };

const TIER_LABELS: Record<string, string> = {
  anon:               "Anonymous",
  verified_no_attend: "Verified · No Hackathons",
  verified_attended:  "Verified · Attended",
  same_state:         "Same State",
  same_org:           "Same University",
  attended_one:       "Attended One",
  attended_both:      "Attended Both",
};

const TIER_COLORS: Record<string, string> = {
  anon:               "#484f58",
  verified_no_attend: "#58a6ff",
  verified_attended:  "#79c0ff",
  same_state:         "#e3b341",
  same_org:           "#f0883e",
  attended_one:       "#3fb950",
  attended_both:      "#d29922",
};

const TIER_BG: Record<string, string> = {
  anon:               "#1c2128",
  verified_no_attend: "#051d4d",
  verified_attended:  "#051d4d",
  same_state:         "#2d1f00",
  same_org:           "#2d1700",
  attended_one:       "#0f2d1a",
  attended_both:      "#1c1507",
};

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

type AccountUser = {
  username: string;
  devpostUsername: string;
  createdAt: string;
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

function DevpostMark({ size = 14, opacity = 1 }: { size?: number; opacity?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity, flexShrink: 0 }}
    >
      <rect width="24" height="24" rx="5" fill="#003E54" />
      <rect width="24" height="24" rx="5" fill="url(#dp-grad)" />
      <path
        d="M7 6h4.5C14.5 6 17 8.5 17 12s-2.5 6-5.5 6H7V6zm2.5 9.5H11c1.8 0 3-1.2 3-3.5s-1.2-3.5-3-3.5H9.5v7z"
        fill="white"
      />
      <defs>
        <linearGradient id="dp-grad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00B4D8" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#003E54" stopOpacity="1" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function StepDot({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  const bg = done ? "#238636" : active ? "#1f6feb" : T.bgOverlay;
  const border = done ? T.greenBorder : active ? T.blueBorder : T.border;
  const color = done || active ? "#fff" : T.textSubtle;
  return (
    <div
      style={{
        width: 22,
        height: 22,
        borderRadius: "50%",
        background: bg,
        border: `1px solid ${border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 10,
        fontWeight: 700,
        color,
        flexShrink: 0,
        transition: "background 0.25s ease, border-color 0.25s ease",
      }}
    >
      {done ? (
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
          <polyline points="2 6 5 9 10 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        n
      )}
    </div>
  );
}

function StepRow({
  n,
  active,
  done,
  label,
  sub,
}: {
  n: number;
  active: boolean;
  done: boolean;
  label: string;
  sub?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
      <StepDot n={n} active={active} done={done} />
      <div style={{ paddingTop: 2 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: active ? T.text : done ? T.textMuted : T.textSubtle,
            transition: "color 0.2s",
          }}
        >
          {label}
        </div>
        {sub && (
          <div style={{ fontSize: 11, color: T.textSubtle, marginTop: 1, lineHeight: 1.4 }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

function generatePlatformToken(username: string): string {
  const payload = {
    sub: username,
    iat: Math.floor(Date.now() / 1000),
    jti: crypto.randomUUID(),
    iss: "hackrank",
  };

  const b64 = (value: string) => btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  const header = b64(JSON.stringify({ alg: "none", typ: "HR1" }));
  const body = b64(JSON.stringify(payload));
  const nonce = b64(String.fromCharCode(...Array.from(crypto.getRandomValues(new Uint8Array(16)))));

  return `hr1.${header}.${body}.${nonce}`;
}

function DevpostButton({ linked, onClick }: { linked: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        padding: "0 12px",
        height: 30,
        borderRadius: 6,
        border: linked ? "1px solid #005F73" : hovered ? "1px solid #00B4D855" : "1px solid #003E54aa",
        background: linked
          ? "linear-gradient(180deg,#004d64,#003344)"
          : hovered
            ? "linear-gradient(180deg,#003E54cc,#002a3aaa)"
            : "linear-gradient(180deg,#003E5499,#002a3a77)",
        cursor: "pointer",
        transition: "all 0.18s ease",
        boxShadow: linked
          ? "0 0 0 3px #00B4D822, inset 0 1px 0 rgba(255,255,255,0.07)"
          : hovered
            ? "0 0 0 2px #00B4D818, inset 0 1px 0 rgba(255,255,255,0.04)"
            : "inset 0 1px 0 rgba(255,255,255,0.04)",
        flexShrink: 0,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {hovered && !linked && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(105deg,transparent 30%,rgba(0,180,216,0.09) 50%,transparent 70%)",
            animation: "dp-shimmer 0.55s ease forwards",
            pointerEvents: "none",
          }}
        />
      )}

      <DevpostMark size={15} />

      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: linked ? "#7dd3fc" : hovered ? "#00B4D8dd" : "#00B4D888",
          letterSpacing: "-0.01em",
          transition: "color 0.18s ease",
          whiteSpace: "nowrap",
        }}
      >
        {linked ? "Devpost linked" : "Link Devpost"}
      </span>

      {linked && (
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "#00B4D825",
            border: "1px solid #00B4D855",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "dp-check-in 0.3s ease",
          }}
        >
          <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
            <polyline points="2 6 5 9 10 3" stroke="#00B4D8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </button>
  );
}

function DevpostLinkModal({
  open,
  onClose,
  onLinked,
}: {
  open: boolean;
  onClose: () => void;
  onLinked: (user: AccountUser) => void;
}) {
  type Stage = "input" | "challenge" | "success" | "registered" | "login";

  const [stage, setStage] = useState<Stage>("input");
  const [username, setUsername] = useState("");
  const [challenge, setChallenge] = useState<ChallengeResponse | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [loadingChallenge, setLoadingChallenge] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [error, setError] = useState("");
  const [verifyMsg, setVerifyMsg] = useState("");
  const [copied, setCopied] = useState(false);

  const [token, setToken] = useState("");
  const [signupUsername, setSignupUsername] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loadingSignup, setLoadingSignup] = useState(false);
  const [signupError, setSignupError] = useState("");
  const [createdUser, setCreatedUser] = useState<string>("");

  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const API_BASE = "http://localhost:8080";

  const handleClose = () => {
    setStage("input");
    setUsername("");
    setChallenge(null);
    setSecondsLeft(null);
    setError("");
    setVerifyMsg("");
    setCopied(false);
    setToken("");
    setSignupUsername("");
    setSignupPassword("");
    setSignupConfirm("");
    setSignupError("");
    setCreatedUser("");
    setShowPassword(false);
    setLoginUsername("");
    setLoginPassword("");
    setLoginError("");
    setShowLoginPassword(false);
    onClose();
  };

  useEffect(() => {
    if (open && stage === "input") {
      const id = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [open, stage]);

  useEffect(() => {
    if (!challenge || stage !== "challenge") return undefined;

    const tick = () =>
      setSecondsLeft(Math.max(0, Math.floor((new Date(challenge.expires_at).getTime() - Date.now()) / 1000)));

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [challenge, stage]);

  const expired = secondsLeft !== null && secondsLeft <= 0;
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const maskedToken = token ? `${token.slice(0, 8)}${"·".repeat(18)}${token.slice(-6)}` : "";

  const startChallenge = async (name = username.trim()) => {
    if (!name) {
      setError("Enter your Devpost username.");
      return;
    }

    setLoadingChallenge(true);
    setError("");
    setVerifyMsg("");

    try {
      const res = await fetch(`${API_BASE}/challenge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: name }),
      });
      if (!res.ok) throw new Error(`Server error (${res.status})`);

      const data = (await res.json()) as ChallengeResponse;
      setChallenge(data);
      setUsername(data.username);
      setStage("challenge");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate challenge.");
    } finally {
      setLoadingChallenge(false);
    }
  };

  const verify = async () => {
    setLoadingVerify(true);
    setError("");
    setVerifyMsg("");

    try {
      const res = await fetch(`${API_BASE}/verify?username=${encodeURIComponent(username.trim())}`);
      if (!res.ok) throw new Error(`Server error (${res.status})`);

      const data = (await res.json()) as VerifyResponse;
      if (data.verified) {
        const newToken = generatePlatformToken(data.username);
        setToken(newToken);
        setSignupUsername(data.username.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32));
        setStage("success");
      } else {
        setVerifyMsg(data.reason ?? "Phrase not found in bio yet.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setLoadingVerify(false);
    }
  };

  const copyPhrase = async () => {
    if (!challenge?.phrase) return;
    try {
      await navigator.clipboard.writeText(challenge.phrase);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      setError("Copy failed — please select manually.");
    }
  };

  const handleSignup = async () => {
    setSignupError("");

    if (!signupUsername.trim()) {
      setSignupError("Choose a username.");
      return;
    }
    if (signupPassword.length < 8) {
      setSignupError("Password must be at least 8 characters.");
      return;
    }
    if (signupPassword !== signupConfirm) {
      setSignupError("Passwords don't match.");
      return;
    }

    setLoadingSignup(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, username: signupUsername.trim(), password: signupPassword }),
      });

      const data = (await res.json()) as { ok?: boolean; user?: { username: string; devpostUsername: string; createdAt: string }; error?: string };

      if (!res.ok || !data.ok) {
        setSignupError(data.error ?? `Server error (${res.status})`);
        return;
      }

      setCreatedUser(data.user?.username ?? signupUsername.trim());
      setStage("registered");
      if (data.user) {
        onLinked({ username: data.user.username, devpostUsername: username, createdAt: data.user.createdAt });
      }
    } catch (err) {
      setSignupError(err instanceof Error ? err.message : "Signup failed.");
    } finally {
      setLoadingSignup(false);
    }
  };

  const handleLogin = async () => {
    setLoginError("");
    if (!loginUsername.trim() || !loginPassword) {
      setLoginError("Enter your username and password.");
      return;
    }
    setLoadingLogin(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUsername.trim(), password: loginPassword }),
      });
      const data = (await res.json()) as { ok?: boolean; user?: { username: string; devpostUsername: string; createdAt: string }; error?: string };
      if (!res.ok || !data.ok || !data.user) {
        setLoginError(data.error ?? `Server error (${res.status})`);
        return;
      }
      onLinked({ username: data.user.username, devpostUsername: data.user.devpostUsername, createdAt: data.user.createdAt });
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoadingLogin(false);
    }
  };

  if (!open) return null;

  const stepsDone = stage === "success" || stage === "registered" ? [1, 2, 3] : stage === "challenge" ? [1] : [];
  const stepsActive = stage === "challenge" ? 2 : stage === "input" ? 1 : 3;

  const passwordStrength = signupPassword.length >= 16 ? 3 : signupPassword.length >= 10 ? 2 : signupPassword.length > 0 ? 1 : 0;
  const passwordLabels = ["", "Weak", "Fair", "Strong"];
  const passwordColors = ["", "#f85149", T.orange, T.greenLight];

  return (
    <>
      <style>{`
        @keyframes dp-shimmer { from{left:-100%} to{left:160%} }
        @keyframes dp-check-in { from{opacity:0;transform:scale(0.6)} to{opacity:1;transform:scale(1)} }
        @keyframes dp-modal-in { from{opacity:0;transform:translateY(14px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes dp-fade-in { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes dp-success-ring {
          0% { box-shadow: 0 0 0 0 #23863640; }
          70% { box-shadow: 0 0 0 10px #23863600; }
          100% { box-shadow: 0 0 0 0 #23863600; }
        }
        @keyframes dp-registered-ring {
          0% { box-shadow: 0 0 0 0 #1f6feb40; }
          70% { box-shadow: 0 0 0 12px #1f6feb00; }
          100% { box-shadow: 0 0 0 0 #1f6feb00; }
        }
      `}</style>

      <div onClick={handleClose} style={{ position: "fixed", inset: 0, zIndex: 140, background: "rgba(1,4,9,0.72)", backdropFilter: "blur(5px)" }} />

      <div style={{ position: "fixed", inset: 0, zIndex: 141, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, pointerEvents: "none" }}>
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%",
            maxWidth: 500,
            borderRadius: 14,
            border: `1px solid ${T.border}`,
            background: T.bgElevated,
            boxShadow: "0 24px 64px rgba(0,0,0,0.6),0 0 0 1px rgba(255,255,255,0.04)",
            animation: "dp-modal-in 0.28s cubic-bezier(0.25,1,0.4,1) forwards",
            pointerEvents: "all",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: `1px solid ${T.borderMuted}`, background: T.bgOverlay }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <DevpostMark size={22} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text, letterSpacing: "-0.02em" }}>Link your Devpost</div>
                <div style={{ fontSize: 11, color: T.textSubtle, marginTop: 1 }}>Verify ownership · one-time setup</div>
              </div>
            </div>
            <button
              onClick={handleClose}
              style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${T.borderMuted}`, background: "transparent", color: T.textMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, lineHeight: 1, transition: "background 0.15s,color 0.15s" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = T.bgHover;
                e.currentTarget.style.color = T.text;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = T.textMuted;
              }}
            >
              ×
            </button>
          </div>

          <div style={{ padding: "20px 20px 22px", display: "flex", flexDirection: "column", gap: 18 }}>
            {stage === "input" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14, animation: "dp-fade-in 0.25s ease" }}>
                <div style={{ borderRadius: 10, border: "1px solid #003E54", background: "#001e2b", padding: "12px 14px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "#00B4D815", border: "1px solid #00B4D830", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <DevpostMark size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 3 }}>How it works</div>
                    <div style={{ fontSize: 11, color: T.textSubtle, lineHeight: 1.6 }}>We'll give you a short phrase. Paste it into your Devpost bio, then come back and hit verify. Takes 30 seconds.</div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, letterSpacing: "0.03em", textTransform: "uppercase" }}>Devpost username</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: T.textSubtle, pointerEvents: "none" }}>devpost.com/</span>
                    <input
                      ref={inputRef}
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setError("");
                      }}
                      onKeyDown={(e) => e.key === "Enter" && startChallenge()}
                      placeholder="jdoe"
                      style={{ width: "100%", height: 38, borderRadius: 8, border: `1px solid ${error ? T.redBorder : T.border}`, background: T.bg, color: T.text, fontSize: 13, padding: "0 12px 0 96px", outline: "none", transition: "border-color 0.15s" }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = T.blueBorder;
                        e.currentTarget.style.boxShadow = `0 0 0 3px ${T.blueBorder}33`;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = error ? T.redBorder : T.border;
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => startChallenge()}
                  disabled={loadingChallenge || !username.trim()}
                  style={{ height: 38, borderRadius: 8, border: `1px solid ${T.blueBorder}`, background: "linear-gradient(180deg,#1f6feb,#1158c7)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: loadingChallenge || !username.trim() ? "not-allowed" : "pointer", opacity: loadingChallenge || !username.trim() ? 0.65 : 1, transition: "opacity 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}
                >
                  {loadingChallenge ? (
                    <>
                      <Spinner /> Generating…
                    </>
                  ) : (
                    "Generate verification phrase →"
                  )}
                </button>

                <button
                  onClick={() => { setLoginError(""); setStage("login"); }}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: T.textMuted, padding: "2px 0", alignSelf: "center" }}
                >
                  Already have an account? <span style={{ color: T.blue, fontWeight: 600 }}>Sign in</span>
                </button>
              </div>
            )}

            {stage === "login" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14, animation: "dp-fade-in 0.25s ease" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, letterSpacing: "0.03em", textTransform: "uppercase" }}>Username</label>
                  <input
                    value={loginUsername}
                    onChange={(e) => { setLoginUsername(e.target.value); setLoginError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    placeholder="your-username"
                    style={{ height: 38, borderRadius: 8, border: `1px solid ${loginError ? T.redBorder : T.border}`, background: T.bg, color: T.text, fontSize: 13, padding: "0 12px", outline: "none", transition: "border-color 0.15s, box-shadow 0.15s" }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = T.blueBorder; e.currentTarget.style.boxShadow = `0 0 0 3px ${T.blueBorder}33`; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = loginError ? T.redBorder : T.border; e.currentTarget.style.boxShadow = "none"; }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, letterSpacing: "0.03em", textTransform: "uppercase" }}>Password</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => { setLoginPassword(e.target.value); setLoginError(""); }}
                      onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                      placeholder="••••••••"
                      style={{ width: "100%", height: 38, borderRadius: 8, border: `1px solid ${loginError ? T.redBorder : T.border}`, background: T.bg, color: T.text, fontSize: 13, padding: "0 38px 0 12px", outline: "none", transition: "border-color 0.15s, box-shadow 0.15s" }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = T.blueBorder; e.currentTarget.style.boxShadow = `0 0 0 3px ${T.blueBorder}33`; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = loginError ? T.redBorder : T.border; e.currentTarget.style.boxShadow = "none"; }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((v) => !v)}
                      style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: T.textSubtle, padding: 2, display: "flex", alignItems: "center" }}
                    >
                      {showLoginPassword
                        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      }
                    </button>
                  </div>
                </div>

                {loginError && (
                  <div style={{ fontSize: 11, color: "#f85149", background: T.redBg, border: `1px solid ${T.redBorder}`, borderRadius: 7, padding: "8px 10px" }}>
                    {loginError}
                  </div>
                )}

                <button
                  onClick={handleLogin}
                  disabled={loadingLogin || !loginUsername.trim() || !loginPassword}
                  style={{ height: 38, borderRadius: 8, border: `1px solid ${T.blueBorder}`, background: "linear-gradient(180deg,#1f6feb,#1158c7)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: loadingLogin || !loginUsername.trim() || !loginPassword ? "not-allowed" : "pointer", opacity: loadingLogin || !loginUsername.trim() || !loginPassword ? 0.65 : 1, transition: "opacity 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}
                >
                  {loadingLogin ? <><Spinner color="#fff" /> Signing in…</> : "Sign in →"}
                </button>

                <button
                  onClick={() => { setLoginError(""); setStage("input"); }}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: T.textMuted, padding: "2px 0", alignSelf: "center", transition: "color 0.15s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = T.text; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = T.textMuted; }}
                >
                  ← Back to sign up
                </button>
              </div>
            )}

            {stage === "challenge" && challenge && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "dp-fade-in 0.25s ease" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <StepRow n={1} done={stepsDone.includes(1)} active={stepsActive === 1} label="Phrase generated" sub={`For @${username}`} />
                  <div style={{ width: 1, height: 10, background: T.borderMuted, marginLeft: 11 }} />
                  <StepRow n={2} done={stepsDone.includes(2)} active={stepsActive === 2} label="Paste it in your Devpost bio" sub="devpost.com/settings → Bio → Save" />
                  <div style={{ width: 1, height: 10, background: T.borderMuted, marginLeft: 11 }} />
                  <StepRow n={3} done={stepsDone.includes(3)} active={stepsActive === 3} label="Verify & create your account" />
                </div>

                <div style={{ borderRadius: 10, border: `1px solid ${T.border}`, background: T.bg, overflow: "hidden" }}>
                  <div style={{ padding: "8px 12px", borderBottom: `1px solid ${T.borderMuted}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: T.textSubtle, textTransform: "uppercase", letterSpacing: "0.05em" }}>Verification phrase</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: expired ? "#f85149" : secondsLeft !== null && secondsLeft < 60 ? T.orange : T.textSubtle, background: expired ? T.redBg : T.bgOverlay, border: `1px solid ${expired ? T.redBorder : T.borderMuted}`, borderRadius: 6, padding: "2px 8px", transition: "color 0.3s,background 0.3s" }}>
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                      {secondsLeft === null ? "--:--" : expired ? "Expired" : formatTime(secondsLeft)}
                    </div>
                  </div>
                  <div style={{ padding: "14px 16px", cursor: "pointer" }} onClick={copyPhrase} title="Click to copy">
                    <div style={{ fontSize: 18, fontWeight: 700, color: T.text, letterSpacing: "0.025em", lineHeight: 1.5, fontFamily: "monospace" }}>{challenge.phrase}</div>
                  </div>
                  <div style={{ padding: "8px 12px", borderTop: `1px solid ${T.borderMuted}`, display: "flex", gap: 8 }}>
                    <button
                      onClick={copyPhrase}
                      style={{ flex: 1, height: 30, borderRadius: 6, border: `1px solid ${copied ? T.greenBorder : T.border}`, background: copied ? T.greenBg : T.bgOverlay, color: copied ? T.greenLight : T.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, transition: "all 0.2s ease" }}
                    >
                      {copied ? (
                        <>
                          <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><polyline points="2 6 5 9 10 3" stroke={T.greenLight} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg> Copied
                        </>
                      ) : (
                        <>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg> Copy phrase
                        </>
                      )}
                    </button>
                    <a
                      href="https://devpost.com/settings#custom-profiles"
                      target="_blank"
                      rel="noreferrer"
                      style={{ flex: 1, height: 30, borderRadius: 6, border: "1px solid #003E54", background: "#001e2b", color: "#00B4D8aa", fontSize: 11, fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, transition: "color 0.15s,border-color 0.15s" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#00B4D8";
                        e.currentTarget.style.borderColor = "#005F73";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "#00B4D8aa";
                        e.currentTarget.style.borderColor = "#003E54";
                      }}
                    >
                      <DevpostMark size={11} /> Open Devpost ↗
                    </a>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={verify}
                    disabled={loadingVerify || expired}
                    style={{ flex: 2, height: 38, borderRadius: 8, border: `1px solid ${T.greenBorder}`, background: "linear-gradient(180deg,#238636,#1c6f2a)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: loadingVerify || expired ? "not-allowed" : "pointer", opacity: loadingVerify || expired ? 0.65 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, transition: "opacity 0.15s" }}
                  >
                    {loadingVerify ? (
                      <>
                        <Spinner color="#fff" /> Checking bio…
                      </>
                    ) : (
                      "I've updated my bio  →"
                    )}
                  </button>
                  <button
                    onClick={() => startChallenge(username)}
                    disabled={loadingChallenge}
                    style={{ flex: 1, height: 38, borderRadius: 8, border: `1px solid ${T.border}`, background: T.bgOverlay, color: T.textMuted, fontSize: 12, fontWeight: 500, cursor: loadingChallenge ? "not-allowed" : "pointer", opacity: loadingChallenge ? 0.65 : 1, transition: "opacity 0.15s" }}
                  >
                    {loadingChallenge ? "…" : "New phrase"}
                  </button>
                </div>

                {verifyMsg && !error && (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", borderRadius: 8, background: "#2d1f09", border: "1px solid #6e4d14", fontSize: 12, color: T.orange, animation: "dp-fade-in 0.2s ease" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    <span>{verifyMsg} Make sure you saved your Devpost profile.</span>
                  </div>
                )}
              </div>
            )}

            {stage === "success" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "dp-fade-in 0.3s ease" }}>
                <div style={{ borderRadius: 12, border: `1px solid ${T.greenBorder}`, background: `linear-gradient(135deg,${T.greenBg},#0a1f0f)`, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, animation: "dp-success-ring 0.8s ease" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg,${T.green},${T.greenLight})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 0 8px ${T.green}22` }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.greenLight, marginBottom: 2 }}>Devpost verified — @{username}</div>
                    <div style={{ fontSize: 11, color: "#86efac", lineHeight: 1.4 }}>Now create your HackRank account below.</div>
                  </div>
                </div>

                <div style={{ borderRadius: 8, border: `1px solid ${T.borderMuted}`, background: T.bg, padding: "9px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: T.bgOverlay, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.textSubtle} strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 9, fontWeight: 600, color: T.textSubtle, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>Verified token</div>
                    <div style={{ fontSize: 11, fontFamily: "monospace", color: T.textSubtle, letterSpacing: "0.04em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{maskedToken}</div>
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 600, color: T.greenLight, background: T.greenBg, border: `1px solid ${T.greenBorder}`, borderRadius: 20, padding: "2px 8px", flexShrink: 0, whiteSpace: "nowrap" }}>✓ valid</div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1, height: 1, background: T.borderMuted }} />
                  <span style={{ fontSize: 10, color: T.textSubtle, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>Create your account</span>
                  <div style={{ flex: 1, height: 1, background: T.borderMuted }} />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, letterSpacing: "0.03em", textTransform: "uppercase" }}>Username</label>
                    <input
                      value={signupUsername}
                      onChange={(e) => {
                        setSignupUsername(e.target.value);
                        setSignupError("");
                      }}
                      placeholder="your-handle"
                      maxLength={32}
                      style={{ height: 36, borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.text, fontSize: 13, padding: "0 12px", outline: "none", transition: "border-color 0.15s,box-shadow 0.15s", width: "100%" }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = T.blueBorder;
                        e.currentTarget.style.boxShadow = `0 0 0 3px ${T.blueBorder}28`;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = T.border;
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, letterSpacing: "0.03em", textTransform: "uppercase" }}>Password</label>
                      <div style={{ position: "relative" }}>
                        <input
                          type={showPassword ? "text" : "password"}
                          value={signupPassword}
                          onChange={(e) => {
                            setSignupPassword(e.target.value);
                            setSignupError("");
                          }}
                          placeholder="min. 8 chars"
                          style={{ height: 36, borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.text, fontSize: 13, padding: "0 36px 0 12px", outline: "none", transition: "border-color 0.15s,box-shadow 0.15s", width: "100%" }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = T.blueBorder;
                            e.currentTarget.style.boxShadow = `0 0 0 3px ${T.blueBorder}28`;
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = T.border;
                            e.currentTarget.style.boxShadow = "none";
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: T.textSubtle, padding: 2, display: "flex", alignItems: "center" }}
                        >
                          {showPassword ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                          )}
                        </button>
                      </div>
                    </div>

                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, letterSpacing: "0.03em", textTransform: "uppercase" }}>Confirm</label>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={signupConfirm}
                        onChange={(e) => {
                          setSignupConfirm(e.target.value);
                          setSignupError("");
                        }}
                        placeholder="repeat password"
                        style={{ height: 36, borderRadius: 8, border: `1px solid ${signupConfirm && signupConfirm !== signupPassword ? T.redBorder : T.border}`, background: T.bg, color: T.text, fontSize: 13, padding: "0 12px", outline: "none", transition: "border-color 0.15s,box-shadow 0.15s", width: "100%" }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = T.blueBorder;
                          e.currentTarget.style.boxShadow = `0 0 0 3px ${T.blueBorder}28`;
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = signupConfirm && signupConfirm !== signupPassword ? T.redBorder : T.border;
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      />
                    </div>
                  </div>

                  {passwordStrength > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, display: "flex", gap: 3, height: 3 }}>
                        {[1, 2, 3].map((n) => (
                          <div key={n} style={{ flex: 1, height: "100%", borderRadius: 2, background: n <= passwordStrength ? passwordColors[passwordStrength] : T.bgOverlay, transition: "background 0.3s" }} />
                        ))}
                      </div>
                      <span style={{ fontSize: 10, color: passwordColors[passwordStrength], fontWeight: 600, minWidth: 36 }}>{passwordLabels[passwordStrength]}</span>
                    </div>
                  )}

                  <button
                    onClick={handleSignup}
                    disabled={loadingSignup || !signupUsername.trim() || !signupPassword || !signupConfirm || signupPassword !== signupConfirm || signupPassword.length < 8}
                    style={{ height: 38, borderRadius: 8, border: `1px solid ${T.blueBorder}`, background: "linear-gradient(180deg,#1f6feb,#1158c7)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: loadingSignup || !signupUsername.trim() || !signupPassword || !signupConfirm || signupPassword !== signupConfirm || signupPassword.length < 8 ? "not-allowed" : "pointer", opacity: loadingSignup || !signupUsername.trim() || !signupPassword || !signupConfirm || signupPassword !== signupConfirm || signupPassword.length < 8 ? 0.65 : 1, transition: "opacity 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 2 }}
                  >
                    {loadingSignup ? (
                      <>
                        <Spinner color="#fff" /> Creating account…
                      </>
                    ) : (
                      "Create account →"
                    )}
                  </button>

                  {signupError && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 8, background: T.redBg, border: `1px solid ${T.redBorder}`, fontSize: 12, color: "#fca5a5", animation: "dp-fade-in 0.2s ease" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fca5a5" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                      {signupError}
                    </div>
                  )}
                </div>
              </div>
            )}

            {stage === "registered" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "dp-fade-in 0.3s ease" }}>
                <div style={{ borderRadius: 14, border: `1px solid ${T.blueBorder}`, background: "linear-gradient(135deg,#051d4d,#03112e)", padding: "24px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, textAlign: "center", animation: "dp-registered-ring 0.9s ease" }}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,#1f6feb,#388bfd)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 10px #1f6feb22" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: T.text, letterSpacing: "-0.03em", marginBottom: 6 }}>Welcome, @{createdUser}</div>
                    <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.6, maxWidth: 300, margin: "0 auto" }}>
                      Your HackRank account is live and linked to Devpost <span style={{ color: "#00B4D8" }}>@{username}</span>. You're all set.
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, background: T.bgOverlay, border: `1px solid ${T.border}`, borderRadius: 20, padding: "5px 14px" }}>
                    <DevpostMark size={13} />
                    <span style={{ fontSize: 11, color: T.textSubtle }}>@{username}</span>
                    <span style={{ fontSize: 11, color: T.textSubtle, margin: "0 4px" }}>·</span>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={T.textSubtle} strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                    <span style={{ fontSize: 11, color: T.greenLight, fontWeight: 600 }}>Verified</span>
                  </div>
                </div>
                <button onClick={handleClose} style={{ height: 36, borderRadius: 8, border: `1px solid ${T.border}`, background: T.bgOverlay, color: T.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  Close
                </button>
              </div>
            )}

            {error && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 8, background: T.redBg, border: `1px solid ${T.redBorder}`, fontSize: 12, color: "#fca5a5", animation: "dp-fade-in 0.2s ease" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fca5a5" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function Spinner({ color = T.textSubtle }: { color?: string }) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      style={{ animation: "spin 0.7s linear infinite", flexShrink: 0 }}
    >
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
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

function RankingRow({ h, i, wr, expanded, onToggle }: { h: Hackathon; i: number; wr: number; expanded: boolean; onToggle: () => void }) {
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
            <span style={{ fontSize: 10.5, color: T.greenLight, fontWeight: 600 }}>{wr.toFixed(1)}%</span>
          </div>
          <div style={{ height: 4, borderRadius: 4, background: T.bgOverlay, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.min(wr, 100)}%`, background: `linear-gradient(90deg,${T.green},${T.greenLight})` }} />
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

// ── ProfileButton ─────────────────────────────────────────────────────────────

function ProfileButton({
  account,
  votes,
  onSignOut,
}: {
  account: AccountUser;
  votes: number;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: Event) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const initials = account.username.slice(0, 2).toUpperCase();
  const joined   = new Date(account.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" });

  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: 30,
          height: 30,
          borderRadius: "50%",
          border: `1.5px solid ${open ? T.blue : T.border}`,
          background: open
            ? "linear-gradient(135deg,#1f6feb,#1158c7)"
            : "linear-gradient(135deg,#21262d,#161b22)",
          color: open ? "#fff" : T.textMuted,
          fontSize: 11,
          fontWeight: 700,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          letterSpacing: "-0.02em",
          transition: "all 0.18s ease",
          boxShadow: open ? `0 0 0 3px ${T.blueBorder}33` : "none",
        }}
        onMouseEnter={(e) => {
          if (!open) {
            e.currentTarget.style.borderColor = T.blue;
            e.currentTarget.style.boxShadow   = `0 0 0 3px ${T.blueBorder}22`;
          }
        }}
        onMouseLeave={(e) => {
          if (!open) {
            e.currentTarget.style.borderColor = T.border;
            e.currentTarget.style.boxShadow   = "none";
          }
        }}
      >
        {initials}
      </button>

      {open && (
        <ProfileDropdown
          account={account}
          votes={votes}
          joined={joined}
          onSignOut={() => { setOpen(false); onSignOut(); }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

// ── ProfileDropdown ───────────────────────────────────────────────────────────

function ProfileDropdown({
  account,
  votes,
  joined,
  onSignOut,
  onClose,
}: {
  account: AccountUser;
  votes: number;
  joined: string;
  onSignOut: () => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const initials = account.username.slice(0, 2).toUpperCase();

  return (
    <>
      <style>{`
        @keyframes profile-drop-in {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>

      <div
        style={{
          position: "absolute",
          top: "calc(100% + 10px)",
          right: 0,
          width: 248,
          borderRadius: 12,
          border: `1px solid ${T.border}`,
          background: T.bgElevated,
          boxShadow: "0 16px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)",
          animation: "profile-drop-in 0.2s cubic-bezier(0.25,1,0.4,1) forwards",
          zIndex: 200,
          overflow: "hidden",
        }}
      >
        {/* Identity section */}
        <div
          style={{
            padding: "14px 14px 12px",
            borderBottom: `1px solid ${T.borderMuted}`,
            background: T.bgOverlay,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: "linear-gradient(135deg,#1f6feb,#388bfd)",
                border: `1.5px solid ${T.blueBorder}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 700,
                color: "#fff",
                flexShrink: 0,
                boxShadow: "0 0 0 3px #1f6feb18",
              }}
            >
              {initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: T.text,
                  letterSpacing: "-0.02em",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                @{account.username}
              </div>
              <div style={{ fontSize: 10, color: T.textSubtle, marginTop: 1 }}>
                Joined {joined}
              </div>
            </div>
          </div>

          {/* Devpost linked pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "6px 9px",
              borderRadius: 8,
              background: "#001e2b",
              border: "1px solid #003E54",
            }}
          >
            <DevpostMark size={14} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: T.textSubtle, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 1 }}>
                Devpost
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#00B4D8",
                  fontWeight: 600,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                @{account.devpostUsername}
              </div>
            </div>
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: "#00B4D820",
                border: "1px solid #00B4D850",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                <polyline points="2 6 5 9 10 3" stroke="#00B4D8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", borderBottom: `1px solid ${T.borderMuted}` }}>
          {[
            { label: "Votes cast", value: votes.toString() },
            { label: "Member since", value: joined },
          ].map(({ label, value }, i) => (
            <div
              key={label}
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRight: i === 0 ? `1px solid ${T.borderMuted}` : "none",
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 700, color: T.text, letterSpacing: "-0.02em" }}>
                {value}
              </div>
              <div style={{ fontSize: 9.5, color: T.textSubtle, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Menu items */}
        <div style={{ padding: "6px 0" }}>
          <DropdownItem
            icon={
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            }
            label="Your profile"
            onClick={() => { onClose(); router.push(`/profile/${account.username}`); }}
          />
          <DropdownItem
            icon={
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            }
            label="Your votes"
            onClick={onClose}
          />
          <div style={{ height: 1, background: T.borderMuted, margin: "5px 0" }} />
          <DropdownItem
            icon={
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            }
            label="Sign out"
            onClick={onSignOut}
            danger
          />
        </div>
      </div>
    </>
  );
}

// ── DropdownItem ──────────────────────────────────────────────────────────────

function DropdownItem({
  icon,
  label,
  onClick,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  const [hov, setHov] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: "100%",
        padding: "7px 14px",
        display: "flex",
        alignItems: "center",
        gap: 9,
        background: hov ? (danger ? T.redBg : T.bgHover) : "transparent",
        border: "none",
        cursor: "pointer",
        color: hov ? (danger ? "#f85149" : T.text) : danger ? "#f85149" : T.textMuted,
        fontSize: 12,
        fontWeight: 500,
        textAlign: "left",
        transition: "background 0.12s ease, color 0.12s ease",
      }}
    >
      <span style={{ opacity: 0.75, flexShrink: 0 }}>{icon}</span>
      {label}
    </button>
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
  const [devpostModalOpen, setDevpostModalOpen] = useState(false);
  const [account, setAccount] = useState<AccountUser | null>(null);
  const [lastVoteWeight, setLastVoteWeight] = useState<VoteWeight | null>(null);
  const [scoreMap, setScoreMap] = useState<Record<number, HackathonScore>>({});

  const saveAccount = (user: AccountUser | null) => {
    setAccount(user);
    if (user) localStorage.setItem("rh_account", JSON.stringify(user));
    else localStorage.removeItem("rh_account");
  };

  useEffect(() => {
    setPair(nextPair(DATA));
  }, []);

  // Restore session from localStorage after hydration (client-only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("rh_account");
      if (stored) setAccount(JSON.parse(stored) as AccountUser);
    } catch { /* ignore */ }
  }, []);

  // Fetch real weighted scores on mount.
  // scoreMap drives ranking (weighted win rate); rawVotes is added to display counts.
  useEffect(() => {
    fetch("/api/scores")
      .then((r) => r.json())
      .then((data: { scores?: HackathonScore[] }) => {
        if (!data.scores?.length) return;
        const map: Record<number, HackathonScore> = {};
        for (const s of data.scores) map[s.id] = s;
        setScoreMap(map);
        // Merge raw vote counts into display totals (one-time, seed+real)
        setHackathons((prev) =>
          prev.map((h) => {
            const s = map[h.id];
            if (!s?.rawVotes) return h;
            return { ...h, votes: h.votes + s.rawVotes };
          }),
        );
      })
      .catch(() => { /* graceful degradation — static data stays */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Weighted win rate: uses real weighted scores when available, falls back to seed data.
  const weightedWinRate = useCallback(
    (h: Hackathon) => {
      const s = scoreMap[h.id];
      if (s && s.weightedVotes > 0) return (s.weightedWins / s.weightedVotes) * 100;
      return winRate(h); // fallback to seed data when no real votes yet
    },
    [scoreMap],
  );

  const sorted = useMemo(
    () => [...hackathons].sort((a, b) => weightedWinRate(b) - weightedWinRate(a)),
    [hackathons, weightedWinRate],
  );

  const handleVote = useCallback(
    (id: number) => {
      if (phase !== "idle") return;

      setPhase("voted");
      setVotedId(id);

      const loserId = pair.find((p) => p.id !== id)?.id ?? 0;

      // Optimistic update — weight 1 in-session; real weighted value comes from API
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

      // Fire the weighted vote — update scoreMap + show tier indicator on success
      fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winnerId: id, loserId, voter: account?.username ?? "" }),
      })
        .then((r) => r.json())
        .then((data: { weight?: number; tier?: string }) => {
          if (data.weight === undefined || !data.tier) return;
          const w = data.weight;
          setLastVoteWeight({ weight: w, tier: data.tier });

          // Optimistically update scoreMap so ranking reflects the new vote immediately
          setScoreMap((prev) => {
            const empty = (hid: number): HackathonScore => ({
              id: hid, rawVotes: 0, weightedVotes: 0, weightedWins: 0, winRate: 0,
            });
            const winner = { ...(prev[id] ?? empty(id)) };
            const loser  = { ...(prev[loserId] ?? empty(loserId)) };

            winner.rawVotes      += 1;
            winner.weightedVotes += w;
            winner.weightedWins  += w;
            winner.winRate = winner.weightedVotes > 0
              ? (winner.weightedWins / winner.weightedVotes) * 100 : 0;

            loser.rawVotes      += 1;
            loser.weightedVotes += w;
            loser.winRate = loser.weightedVotes > 0
              ? (loser.weightedWins / loser.weightedVotes) * 100 : 0;

            return { ...prev, [id]: winner, [loserId]: loser };
          });
        })
        .catch(() => { /* graceful degradation */ });

      setTimeout(() => {
        setVisible(false);
        setTimeout(() => {
          setLastVoteWeight(null);
          setPair(nextPair(hackathons, [id]));
          setVotedId(null);
          setPhase("idle");
          setVisible(true);
        }, 320);
      }, 950);
    },
    [hackathons, pair, phase, account],
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

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${T.borderMuted}`, background: T.bgOverlay, fontSize: 11, color: T.textMuted }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Ico.Star s={11} c={T.textSubtle} />
                {hackathons.reduce((s, h) => s + h.votes, 0).toLocaleString()} votes
              </span>
            </div>
            {account
              ? <ProfileButton account={account} votes={streak} onSignOut={() => saveAccount(null)} />
              : <DevpostButton linked={false} onClick={() => setDevpostModalOpen(true)} />
            }
          </div>
        </div>
      </header>

      <DevpostLinkModal
        open={devpostModalOpen}
        onClose={() => setDevpostModalOpen(false)}
        onLinked={(user) => { saveAccount(user); setDevpostModalOpen(false); }}
      />

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

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: "20px 0" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: T.bgElevated, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: T.textSubtle }}>
                  vs
                </div>
                {lastVoteWeight && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, animation: "rh-fade-up 0.3s ease" }}>
                    <div style={{
                      fontSize: 12, fontWeight: 700,
                      color: TIER_COLORS[lastVoteWeight.tier] ?? T.textMuted,
                      background: TIER_BG[lastVoteWeight.tier] ?? T.bgOverlay,
                      border: `1px solid ${TIER_COLORS[lastVoteWeight.tier] ?? T.border}33`,
                      borderRadius: 20, padding: "3px 10px",
                      letterSpacing: "0.01em",
                    }}>
                      {lastVoteWeight.weight.toFixed(1)}× weight
                    </div>
                    <div style={{ fontSize: 10, color: T.textSubtle, textAlign: "center", maxWidth: 80 }}>
                      {TIER_LABELS[lastVoteWeight.tier] ?? lastVoteWeight.tier}
                    </div>
                  </div>
                )}
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
                <RankingRow key={h.id} h={h} i={i} wr={weightedWinRate(h)} expanded={expanded === h.id} onToggle={() => setExpanded(expanded === h.id ? null : h.id)} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}