"use client";

import { useEffect, useMemo, useState } from "react";
import hackathonsData from "../data/hackathons.json";

type Hackathon = {
  id: number;
  name: string;
  org: string;
  city: string;
  prize: string;
  size: string;
  votes: number;
  wins: number;
};

type ViewMode = "vote" | "rankings";

const DATA = hackathonsData as Hackathon[];

const winRate = (h: Hackathon) => (h.votes === 0 ? 0 : (h.wins / h.votes) * 100);

function pickPair(list: Hackathon[], exclude: number[] = []): [Hackathon, Hackathon] {
  const pool = list.filter((h) => !exclude.includes(h.id));
  const usePool = pool.length >= 2 ? pool : list;
  const shuffled = [...usePool].sort(() => Math.random() - 0.5);
  return [shuffled[0], shuffled[1]];
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-gradient-to-br from-slate-700 to-slate-900 text-xs font-bold tracking-wide text-slate-100 shadow-[0_6px_18px_rgba(0,0,0,0.4)]">
      {initials}
    </div>
  );
}

function VoteCard({ hackathon, onVote }: { hackathon: Hackathon; onVote: (id: number) => void }) {
  return (
    <button
      onClick={() => onVote(hackathon.id)}
      className="group relative w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 p-5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-600 hover:shadow-[0_12px_30px_rgba(0,0,0,0.45)]"
    >
      <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-r from-slate-800/80 to-slate-700/30" />
      <div className="relative">
        <div className="mb-4 flex items-start gap-3">
          <div className="mt-1">
            <Avatar name={hackathon.name} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs uppercase tracking-[0.12em] text-slate-400">{hackathon.org}</div>
            <div className="truncate text-2xl font-semibold text-slate-100">{hackathon.name}</div>
            <div className="truncate text-sm text-slate-400">{hackathon.city}</div>
          </div>
          <div className="rounded-md border border-emerald-700/40 bg-emerald-950/50 px-2 py-1 text-xs font-medium text-emerald-300">
            {winRate(hackathon).toFixed(1)}%
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-300">Prize {hackathon.prize}</span>
          <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-300">Size {hackathon.size}</span>
        </div>

        <div className="mt-4 text-xs text-slate-500 transition-colors group-hover:text-slate-300">Vote for {hackathon.name}</div>
      </div>
    </button>
  );
}

export default function RateHackathonsPage() {
  const [view, setView] = useState<ViewMode>("vote");
  const [hackathons, setHackathons] = useState<Hackathon[]>(DATA);
  const [pair, setPair] = useState<[Hackathon, Hackathon]>([DATA[0], DATA[1]]);
  const [streak, setStreak] = useState(0);
  const [myVotes, setMyVotes] = useState(0);
  const [streakPulse, setStreakPulse] = useState(0);

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
    const ids = new Set(pair.map((p) => p.id));

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
    setPair(pickPair(hackathons, [winnerId]));
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
      `}</style>

      <header className="sticky top-0 z-20 border-b border-slate-800/90 bg-[#161b22]/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center px-4">
          <div className="text-lg font-bold tracking-tight">RateHackathons</div>

          <div className="ml-6 flex gap-2 text-sm">
            <button
              onClick={() => setView("vote")}
              className={`rounded px-3 py-1 transition ${view === "vote" ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-800"}`}
            >
              Vote
            </button>
            <button
              onClick={() => setView("rankings")}
              className={`rounded px-3 py-1 transition ${view === "rankings" ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-800"}`}
            >
              Rankings
            </button>
          </div>

          <div className="ml-auto flex items-center gap-3 text-xs">
            <div
              key={streakPulse}
              style={{ animation: "floatUp 0.45s ease" }}
              className="rounded-full border border-orange-700/40 bg-orange-950/40 px-3 py-1 text-orange-300"
            >
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
              <p className="mt-2 text-sm text-slate-400">Head-to-head choices, community ranking. Premium UI pass v3.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <VoteCard hackathon={pair[0]} onVote={vote} />
              <VoteCard hackathon={pair[1]} onVote={vote} />
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
              <p className="text-sm text-slate-400">Sorted by win rate, then total votes.</p>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70">
              <div className="grid grid-cols-[56px_44px_1fr_96px_90px] border-b border-slate-800 bg-slate-950 px-4 py-2 text-xs uppercase tracking-wide text-slate-500">
                <div>Rank</div>
                <div />
                <div>Hackathon</div>
                <div className="text-right">Votes</div>
                <div className="text-right">Win Rate</div>
              </div>

              {rankings.map((h, idx) => (
                <div
                  key={h.id}
                  className="grid grid-cols-[56px_44px_1fr_96px_90px] items-center border-b border-slate-800 px-4 py-3 last:border-b-0 hover:bg-slate-800/20"
                >
                  <div className="text-sm text-slate-400">#{idx + 1}</div>
                  <div>
                    <Avatar name={h.name} />
                  </div>
                  <div className="min-w-0 pl-2">
                    <div className="truncate text-sm font-medium text-slate-100">{h.name}</div>
                    <div className="truncate text-xs text-slate-500">{h.city}</div>
                  </div>
                  <div className="text-right text-sm text-slate-300">{h.votes.toLocaleString()}</div>
                  <div className="text-right text-sm font-medium text-emerald-400">{winRate(h).toFixed(1)}%</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}