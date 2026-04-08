"use client";

import { useMemo, useState } from "react";
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

const initialHackathons = hackathonsData as Hackathon[];

const winRate = (h: Hackathon) => (h.votes === 0 ? 0 : (h.wins / h.votes) * 100);

export default function RateHackathonsPage() {
  const [hackathons, setHackathons] = useState<Hackathon[]>(initialHackathons);
  const [view, setView] = useState<ViewMode>("vote");
  const [pairIndex, setPairIndex] = useState(0);

  const pair = useMemo(() => {
    const first = hackathons[pairIndex % hackathons.length];
    const second = hackathons[(pairIndex + 1) % hackathons.length];
    return [first, second];
  }, [hackathons, pairIndex]);

  const totalVotes = useMemo(() => hackathons.reduce((sum, h) => sum + h.votes, 0), [hackathons]);

  const rankings = useMemo(() => {
    return [...hackathons].sort((a, b) => winRate(b) - winRate(a));
  }, [hackathons]);

  const handleVote = (winnerId: number) => {
    const idsInPair = new Set(pair.map((h) => h.id));

    setHackathons((prev) =>
      prev.map((h) => {
        if (!idsInPair.has(h.id)) return h;
        if (h.id === winnerId) return { ...h, votes: h.votes + 1, wins: h.wins + 1 };
        return { ...h, votes: h.votes + 1 };
      }),
    );

    setPairIndex((idx) => (idx + 2) % hackathons.length);
  };

  const nextPair = () => {
    setPairIndex((idx) => (idx + 1) % hackathons.length);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center px-4">
          <h1 className="text-lg font-bold">RateHackathons</h1>
          <div className="ml-6 flex gap-2 text-sm">
            <button
              className={`rounded px-3 py-1 ${view === "vote" ? "bg-slate-700 text-white" : "text-slate-300"}`}
              onClick={() => setView("vote")}
            >
              Vote
            </button>
            <button
              className={`rounded px-3 py-1 ${view === "rankings" ? "bg-slate-700 text-white" : "text-slate-300"}`}
              onClick={() => setView("rankings")}
            >
              Rankings
            </button>
          </div>
          <div className="ml-auto text-xs text-slate-400">{totalVotes.toLocaleString()} total votes</div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-8">
        {view === "vote" ? (
          <section>
            <h2 className="mb-2 text-3xl font-extrabold">Vote flow</h2>
            <p className="mb-8 text-sm text-slate-400">Minimal version of rate hackathons using JSON data.</p>

            <div className="grid gap-4 md:grid-cols-2">
              {pair.map((h) => (
                <button
                  key={h.id}
                  onClick={() => handleVote(h.id)}
                  className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-left transition hover:border-slate-600"
                >
                  <div className="mb-2 text-xs uppercase tracking-wide text-slate-400">{h.org}</div>
                  <div className="text-2xl font-semibold">{h.name}</div>
                  <div className="mt-1 text-sm text-slate-400">{h.city}</div>
                  <div className="mt-4 text-xs text-slate-500">
                    Prize {h.prize} · Size {h.size}
                  </div>
                </button>
              ))}
            </div>

            <button onClick={nextPair} className="mt-5 rounded border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-900">
              Skip pair
            </button>
          </section>
        ) : (
          <section>
            <h2 className="mb-2 text-3xl font-extrabold">Rankings</h2>
            <p className="mb-6 text-sm text-slate-400">Sorted by win rate from pairwise votes.</p>

            <div className="overflow-hidden rounded-xl border border-slate-800">
              {rankings.map((h, idx) => (
                <div key={h.id} className="grid grid-cols-[56px_1fr_110px] items-center border-b border-slate-800 bg-slate-900 px-4 py-3 last:border-b-0">
                  <div className="text-sm text-slate-400">#{idx + 1}</div>
                  <div className="min-w-0 pr-4">
                    <div className="truncate font-medium">{h.name}</div>
                    <div className="truncate text-xs text-slate-500">{h.city}</div>
                  </div>
                  <div className="text-right text-sm text-emerald-400">{winRate(h).toFixed(1)}%</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
