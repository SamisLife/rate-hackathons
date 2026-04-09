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

const INITIAL_DATA = hackathonsData as Hackathon[];

const winRate = (h: Hackathon) => (h.votes === 0 ? 0 : (h.wins / h.votes) * 100);

function pickNextPair(list: Hackathon[], used: number[] = []): [Hackathon, Hackathon] {
  const candidates = list.filter((h) => !used.includes(h.id));
  const pool = candidates.length >= 2 ? candidates : list;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return [shuffled[0], shuffled[1]];
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-300">
      <span className="text-slate-400">{label}</span> {value}
    </div>
  );
}

function VoteCard({ h, onVote }: { h: Hackathon; onVote: (id: number) => void }) {
  return (
    <button
      onClick={() => onVote(h.id)}
      className="group w-full rounded-2xl border border-slate-800 bg-slate-900 p-5 text-left transition hover:-translate-y-0.5 hover:border-slate-600"
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-400">{h.org}</div>
          <div className="text-2xl font-semibold text-white">{h.name}</div>
          <div className="text-sm text-slate-400">{h.city}</div>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-300">
          {winRate(h).toFixed(1)}%
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <StatPill label="Prize" value={h.prize} />
        <StatPill label="Size" value={h.size} />
      </div>

      <div className="mt-4 text-xs text-slate-500 transition group-hover:text-slate-300">Vote for {h.name}</div>
    </button>
  );
}

export default function RateHackathonsPage() {
  const [hackathons, setHackathons] = useState<Hackathon[]>(INITIAL_DATA);
  const [view, setView] = useState<ViewMode>("vote");
  const [pair, setPair] = useState<[Hackathon, Hackathon]>([INITIAL_DATA[0], INITIAL_DATA[1]]);
  const [streak, setStreak] = useState(0);
  const [myVotes, setMyVotes] = useState(0);
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    setPair(pickNextPair(INITIAL_DATA));
  }, []);

  const totalVotes = useMemo(() => hackathons.reduce((sum, h) => sum + h.votes, 0), [hackathons]);

  const rankings = useMemo(() => {
    return [...hackathons].sort((a, b) => winRate(b) - winRate(a));
  }, [hackathons]);

  const onVote = (winnerId: number) => {
    const pairIds = new Set(pair.map((h) => h.id));

    setHackathons((prev) =>
      prev.map((h) => {
        if (!pairIds.has(h.id)) return h;
        if (h.id === winnerId) return { ...h, wins: h.wins + 1, votes: h.votes + 1 };
        return { ...h, votes: h.votes + 1 };
      }),
    );

    setStreak((s) => s + 1);
    setMyVotes((v) => v + 1);
    setPulseKey((k) => k + 1);
    setPair(pickNextPair(hackathons, [winnerId]));
  };

  const skipPair = () => {
    setStreak(0);
    setPair(pickNextPair(hackathons));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center px-4">
          <h1 className="text-lg font-bold">RateHackathons</h1>

          <div className="ml-6 flex gap-2 text-sm">
            <button
              className={`rounded px-3 py-1 transition ${view === "vote" ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-800"}`}
              onClick={() => setView("vote")}
            >
              Vote
            </button>
            <button
              className={`rounded px-3 py-1 transition ${view === "rankings" ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-800"}`}
              onClick={() => setView("rankings")}
            >
              Rankings
            </button>
          </div>

          <div className="ml-auto flex items-center gap-3 text-xs">
            <div key={pulseKey} className="rounded-full border border-orange-700/40 bg-orange-950/50 px-3 py-1 text-orange-300 animate-pulse">
              🔥 {streak} streak
            </div>
            <div className="text-slate-400">{myVotes} by you</div>
            <div className="text-slate-400">{totalVotes.toLocaleString()} total</div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-10">
        {view === "vote" ? (
          <section>
            <div className="mb-8 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-rose-700/40 bg-rose-950/40 px-3 py-1 text-xs uppercase tracking-wide text-rose-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-rose-400" />
                Hackathon Season 2026
              </div>
              <h2 className="text-4xl font-extrabold tracking-tight">Pick the better hackathon</h2>
              <p className="mt-2 text-sm text-slate-400">Simple v2: polished cards, live streak, and clearer rankings.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <VoteCard h={pair[0]} onVote={onVote} />
              <VoteCard h={pair[1]} onVote={onVote} />
            </div>

            <div className="mt-5 text-center">
              <button onClick={skipPair} className="rounded border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-900">
                Skip pair
              </button>
            </div>
          </section>
        ) : (
          <section>
            <h2 className="mb-2 text-3xl font-extrabold">Rankings</h2>
            <p className="mb-6 text-sm text-slate-400">Sorted by community win rate.</p>

            <div className="overflow-hidden rounded-xl border border-slate-800">
              <div className="grid grid-cols-[56px_1fr_96px_90px] border-b border-slate-800 bg-slate-950 px-4 py-2 text-xs uppercase tracking-wide text-slate-500">
                <div>Rank</div>
                <div>Name</div>
                <div className="text-right">Votes</div>
                <div className="text-right">Win Rate</div>
              </div>

              {rankings.map((h, idx) => (
                <div
                  key={h.id}
                  className="grid grid-cols-[56px_1fr_96px_90px] items-center border-b border-slate-800 bg-slate-900 px-4 py-3 last:border-b-0"
                >
                  <div className="text-sm text-slate-400">#{idx + 1}</div>
                  <div className="min-w-0 pr-5">
                    <div className="truncate font-medium text-slate-100">{h.name}</div>
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