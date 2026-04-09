"use client";

import { useEffect, useMemo, useState } from "react";
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
  color?: string;
  accent?: string;
  accommodation?: boolean;
  reimbursement?: boolean;
  ratings: Ratings;
};

type ViewMode = "vote" | "rankings";

const DATA = hackathonsData as Hackathon[];
const RATING_KEYS: (keyof Ratings)[] = ["food", "organization", "judging", "prizes", "mentorship"];

const winRate = (h: Hackathon) => (h.votes === 0 ? 0 : (h.wins / h.votes) * 100);
const avgRating = (h: Hackathon) => Object.values(h.ratings).reduce((a, b) => a + b, 0) / 5;

const Ico = {
  Zap: ({ s = 14 }: { s?: number }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Check: ({ s = 14 }: { s?: number }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Home: ({ s = 11 }: { s?: number }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Plane: ({ s = 11 }: { s?: number }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19 4c-1 0-2 .5-2.7 1.3L13 9 4.8 6.2c-.5-.2-1.1 0-1.4.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.5-.3.7-.9.5-1.4z" />
    </svg>
  ),
  Chevron: ({ up = false }: { up?: boolean }) => (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: up ? "rotate(180deg)" : "none" }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
};

function ratingColor(v: number) {
  if (v >= 4.5) return "#3fb950";
  if (v >= 4.0) return "#58a6ff";
  if (v >= 3.5) return "#e3b341";
  return "#f85149";
}

function pickPair(list: Hackathon[], exclude: number[] = []): [Hackathon, Hackathon] {
  const pool = list.filter((h) => !exclude.includes(h.id));
  const usePool = pool.length >= 2 ? pool : list;
  const shuffled = [...usePool].sort(() => Math.random() - 0.5);
  return [shuffled[0], shuffled[1]];
}

function Avatar({ name, color = "#334155" }: { name: string; color?: string }) {
  const initials = name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="flex h-10 w-10 items-center justify-center rounded-lg border text-xs font-bold tracking-wide text-slate-100 shadow-[0_6px_18px_rgba(0,0,0,0.4)]"
      style={{ borderColor: `${color}66`, background: `linear-gradient(140deg, ${color}cc, ${color}66)` }}
    >
      {initials}
    </div>
  );
}

function PerkPill({ label, enabled, icon }: { label: string; enabled: boolean; icon: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${enabled ? "border-emerald-700/60 bg-emerald-950/40 text-emerald-300" : "border-slate-700 bg-slate-900 text-slate-500"}`}
    >
      {icon}
      {label}
    </span>
  );
}

function VoteCard({
  hackathon,
  onVote,
  state,
  isIdle,
}: {
  hackathon: Hackathon;
  onVote: (id: number) => void;
  state: "idle" | "winner" | "loser";
  isIdle: boolean;
}) {
  const winner = state === "winner";
  const loser = state === "loser";
  const accent = hackathon.color ?? "#475569";

  return (
    <div
      className={`group relative w-full overflow-hidden rounded-2xl border bg-slate-900/90 p-5 text-left transition-all duration-300 ${
        winner
          ? "border-emerald-500/60 shadow-[0_0_0_1px_rgba(46,160,67,0.35),0_16px_34px_rgba(21,128,61,0.25)]"
          : "border-slate-800"
      } ${
        loser
          ? "scale-[0.985] opacity-55"
          : isIdle
            ? "hover:-translate-y-0.5 hover:border-slate-600 hover:shadow-[0_12px_30px_rgba(0,0,0,0.45)]"
            : ""
      }`}
    >
      <div className="absolute inset-x-0 top-0 h-14" style={{ background: `linear-gradient(90deg, ${accent}bb, ${accent}33)` }} />

      <div className="relative">
        <div className="mb-4 flex items-start gap-3">
          <div className="mt-1">
            <Avatar name={hackathon.name} color={hackathon.color} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs uppercase tracking-[0.12em] text-slate-300">{hackathon.org}</div>
            <div className="truncate text-2xl font-semibold text-slate-100">{hackathon.name}</div>
            <div className="truncate text-sm text-slate-300">{hackathon.city}</div>
          </div>
          <div className="rounded-md border border-emerald-700/40 bg-emerald-950/50 px-2 py-1 text-xs font-medium text-emerald-300">
            {avgRating(hackathon).toFixed(2)}
          </div>
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-300">Prize {hackathon.prize}</span>
          <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-300">Size {hackathon.size}</span>
          <PerkPill label="Housing" enabled={Boolean(hackathon.accommodation)} icon={<Ico.Home />} />
          <PerkPill label="Travel" enabled={Boolean(hackathon.reimbursement)} icon={<Ico.Plane />} />
        </div>

        <div className="mb-4">
          <div className="mb-1 flex gap-1">
            {RATING_KEYS.map((k) => (
              <div key={k} className="h-1.5 flex-1 rounded-sm" style={{ background: ratingColor(hackathon.ratings[k]) }} />
            ))}
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] text-slate-500">
            {RATING_KEYS.map((k) => (
              <span key={k}>
                {k.slice(0, 3)} {hackathon.ratings[k].toFixed(1)}
              </span>
            ))}
          </div>
        </div>

        <button
          disabled={!isIdle}
          onClick={() => onVote(hackathon.id)}
          className="inline-flex items-center gap-2 rounded-md border border-emerald-700 bg-gradient-to-b from-emerald-600 to-emerald-700 px-3 py-2 text-xs font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition hover:from-emerald-500 hover:to-emerald-600 disabled:cursor-not-allowed disabled:opacity-65"
        >
          <Ico.Zap s={12} /> Vote for {hackathon.name}
        </button>
      </div>

      {winner && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-emerald-500/10">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_0_20px_rgba(46,160,67,0.6)]">
            <Ico.Check />
          </div>
        </div>
      )}
    </div>
  );
}

export default function RateHackathonsPage() {
  const [view, setView] = useState<ViewMode>("vote");
  const [hackathons, setHackathons] = useState<Hackathon[]>(DATA);
  const [pair, setPair] = useState<[Hackathon, Hackathon]>([DATA[0], DATA[1]]);
  const [streak, setStreak] = useState(0);
  const [myVotes, setMyVotes] = useState(0);
  const [streakPulse, setStreakPulse] = useState(0);
  const [phase, setPhase] = useState<"idle" | "voted">("idle");
  const [votedId, setVotedId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    setPair(pickPair(DATA));
  }, []);

  const rankings = useMemo(
    () =>
      [...hackathons].sort((a, b) => {
        const wr = winRate(b) - winRate(a);
        if (wr !== 0) return wr;
        return b.votes - a.votes;
      }),
    [hackathons],
  );

  const totalVotes = useMemo(() => hackathons.reduce((sum, h) => sum + h.votes, 0), [hackathons]);

  const vote = (winnerId: number) => {
    if (phase !== "idle") return;
    const ids = new Set(pair.map((p) => p.id));

    setPhase("voted");
    setVotedId(winnerId);
    setHackathons((prev) =>
      prev.map((h) => {
        if (!ids.has(h.id)) return h;
        if (h.id === winnerId) return { ...h, votes: h.votes + 1, wins: h.wins + 1 };
        return { ...h, votes: h.votes + 1 };
      }),
    );

    setStreak((s) => s + 1);
    setMyVotes((v) => v + 1);
    setStreakPulse((p) => p + 1);
    setTimeout(() => {
      setPair(pickPair(hackathons, [winnerId]));
      setVotedId(null);
      setPhase("idle");
    }, 480);
  };

  const skip = () => {
    setStreak(0);
    setPair(pickPair(hackathons));
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-100">
      <style>{`
        @keyframes floatUp { 0% { transform: translateY(0px); opacity: 0.8; } 100% { transform: translateY(-8px); opacity: 1; } }
        @keyframes cardFade { from { opacity: 0; transform: translateY(6px);} to { opacity: 1; transform: translateY(0);} }
        @keyframes vsPulse { 0%,100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.04); opacity: 1; } }
      `}</style>

      <header className="sticky top-0 z-20 border-b border-slate-800/90 bg-[#161b22]/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center px-4">
          <div className="text-lg font-bold tracking-tight">RateHackathons</div>

          <div className="ml-6 flex gap-2 text-sm">
            <button onClick={() => setView("vote")} className={`rounded px-3 py-1 transition ${view === "vote" ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-800"}`}>
              Vote
            </button>
            <button onClick={() => setView("rankings")} className={`rounded px-3 py-1 transition ${view === "rankings" ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-800"}`}>
              Rankings
            </button>
          </div>

          <div className="ml-auto flex items-center gap-3 text-xs">
            <div key={streakPulse} style={{ animation: "floatUp 0.45s ease" }} className="rounded-full border border-orange-700/40 bg-orange-950/40 px-3 py-1 text-orange-300">
              🔥 {streak} streak
            </div>
            <div className="text-slate-400">{myVotes} by you</div>
            <div className="text-slate-400">{totalVotes.toLocaleString()} total</div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-10">
        {view === "vote" ? (
          <section style={{ animation: "cardFade 0.35s ease" }}>
            <div className="mb-8 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-rose-700/30 bg-rose-950/40 px-3 py-1 text-xs uppercase tracking-[0.1em] text-rose-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-rose-400" />
                Hackathon Season 2026
              </div>
              <h2 className="text-4xl font-extrabold tracking-tight text-slate-100">Which hackathon deserves your weekend?</h2>
              <p className="mt-2 text-sm text-slate-400">Closer to full version: perks, ratings, richer cards, and expanded rankings.</p>
            </div>

            <div className="grid items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
              <VoteCard hackathon={pair[0]} onVote={vote} isIdle={phase === "idle"} state={votedId === pair[0].id ? "winner" : votedId !== null ? "loser" : "idle"} />

              <div className="mx-auto hidden md:block">
                <div style={{ animation: "vsPulse 1.8s ease-in-out infinite" }} className="rounded-full border border-slate-700 bg-slate-900/90 px-4 py-3 text-xs font-semibold tracking-[0.2em] text-slate-400 shadow-[0_8px_18px_rgba(0,0,0,0.35)]">
                  VS
                </div>
              </div>

              <VoteCard hackathon={pair[1]} onVote={vote} isIdle={phase === "idle"} state={votedId === pair[1].id ? "winner" : votedId !== null ? "loser" : "idle"} />
            </div>

            <div className="mt-5 text-center">
              <button onClick={skip} className="rounded border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-900">
                Skip pair
              </button>
            </div>
          </section>
        ) : (
          <section style={{ animation: "cardFade 0.35s ease" }}>
            <div className="mb-6">
              <h2 className="mb-2 text-3xl font-extrabold">Rankings</h2>
              <p className="text-sm text-slate-400">Sorted by win rate, then total votes. Click a row for details.</p>
              <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-slate-500">
                <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#3fb950]" /> ≥ 4.5</span>
                <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#58a6ff]" /> ≥ 4.0</span>
                <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#e3b341]" /> ≥ 3.5</span>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70">
              <div className="grid grid-cols-[56px_44px_1fr_96px_90px] border-b border-slate-800 bg-slate-950 px-4 py-2 text-xs uppercase tracking-wide text-slate-500">
                <div>Rank</div>
                <div />
                <div>Hackathon</div>
                <div className="text-right">Votes</div>
                <div className="text-right">Win Rate</div>
              </div>

              {rankings.map((h, idx) => {
                const open = expandedId === h.id;
                return (
                  <div key={h.id} className="border-b border-slate-800 last:border-b-0">
                    <button
                      onClick={() => setExpandedId(open ? null : h.id)}
                      className="grid w-full grid-cols-[56px_44px_1fr_96px_90px] items-center px-4 py-3 text-left transition hover:bg-slate-800/20"
                    >
                      <div className="text-sm text-slate-400">{idx < 3 ? ["🥇", "🥈", "🥉"][idx] : `#${idx + 1}`}</div>
                      <div>
                        <Avatar name={h.name} color={h.color} />
                      </div>
                      <div className="min-w-0 pl-2">
                        <div className="truncate text-sm font-medium text-slate-100">{h.name}</div>
                        <div className="truncate text-xs text-slate-500">{h.city}</div>
                      </div>
                      <div className="text-right text-sm text-slate-300">{h.votes.toLocaleString()}</div>
                      <div className="flex items-center justify-end gap-2 text-right text-sm font-medium text-emerald-400">
                        <span>{winRate(h).toFixed(1)}%</span>
                        <span className="text-slate-500"><Ico.Chevron up={open} /></span>
                      </div>
                    </button>

                    {open && (
                      <div className="border-t border-slate-800 bg-slate-950/50 px-6 py-4">
                        <div className="mb-3 flex flex-wrap gap-2">
                          <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-xs text-slate-300">Prize {h.prize}</span>
                          <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-xs text-slate-300">Size {h.size}</span>
                          <PerkPill label="Housing" enabled={Boolean(h.accommodation)} icon={<Ico.Home />} />
                          <PerkPill label="Travel" enabled={Boolean(h.reimbursement)} icon={<Ico.Plane />} />
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                          {RATING_KEYS.map((k) => (
                            <div key={k}>
                              <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">{k}</div>
                              <div className="h-1.5 rounded-sm" style={{ background: ratingColor(h.ratings[k]) }} />
                              <div className="mt-1 text-xs text-slate-400">{h.ratings[k].toFixed(1)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}