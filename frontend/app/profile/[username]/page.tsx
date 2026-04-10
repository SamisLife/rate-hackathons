"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type ProfileUser = {
  username: string;
  devpostUsername: string;
  createdAt: string;
};

type ScrapedHackathon = {
  id: string;
  name: string;
  url: string;
  imageUrl: string;
  imageAlt: string;
  location: string;
  description: string;
  prize: string;
  dateRange: string;
  participants: string;
};

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
  blue: "#58a6ff",
  blueBg: "#051d4d",
  blueBorder: "#1f6feb",
  green: "#2ea043",
  greenLight: "#3fb950",
  orange: "#e3b341",
};

function DevpostMark({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M6 3H12.5C16.09 3 19 5.91 19 9.5V14.5C19 18.09 16.09 21 12.5 21H6V3Z"
        fill="#003E54"
        stroke="#003E54"
        strokeWidth="1"
      />
      <path
        d="M10 8H12.5C13.88 8 15 9.12 15 10.5V13.5C15 14.88 13.88 16 12.5 16H10V8Z"
        fill="#00B4D8"
      />
    </svg>
  );
}

function Skeleton({ w, h, radius = 6 }: { w: number | string; h: number; radius?: number }) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: radius,
        background: `linear-gradient(90deg, ${T.bgOverlay} 25%, ${T.bgHover} 50%, ${T.bgOverlay} 75%)`,
        backgroundSize: "200% 100%",
        animation: "skeleton-shimmer 1.4s ease infinite",
      }}
    />
  );
}

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const router = useRouter();

  const [user, setUser] = useState<ProfileUser | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  const [loggedInUser, setLoggedInUser] = useState<string | null>(null);

  const [hackathons, setHackathons] = useState<ScrapedHackathon[] | null>(null);
  const [hackathonsLoading, setHackathonsLoading] = useState(false);
  const [hackathonsError, setHackathonsError] = useState<string | null>(null);
  const [hackathonsCachedAt, setHackathonsCachedAt] = useState<string | null>(null);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem("rh_account");
      if (stored) {
        const parsed = JSON.parse(stored) as { username: string };
        setLoggedInUser(parsed.username);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    fetch(`/api/users/${encodeURIComponent(username)}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json() as Promise<ProfileUser>;
      })
      .then((data) => { if (data) setUser(data); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [username]);

  const fetchHackathons = (refresh = false) => {
    if (!username) return;
    setHackathonsLoading(true);
    setHackathonsError(null);
    const url = `/api/users/${encodeURIComponent(username)}/hackathons${refresh ? "?refresh=true" : ""}`;
    fetch(url)
      .then(async (r) => {
        const data = (await r.json()) as { hackathons?: ScrapedHackathon[]; cachedAt?: string; error?: string };
        if (!r.ok || data.error) { setHackathonsError(data.error ?? "Failed to load hackathons."); return; }
        setHackathons(data.hackathons ?? []);
        setHackathonsCachedAt(data.cachedAt ?? null);
      })
      .catch(() => setHackathonsError("Network error — could not load hackathons."))
      .finally(() => setHackathonsLoading(false));
  };

  useEffect(() => {
    if (username) fetchHackathons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  const isOwn = loggedInUser?.toLowerCase() === username?.toLowerCase();
  const joined = user
    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;
  const initials = username ? username.slice(0, 2).toUpperCase() : "??";

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${T.bg}; color: ${T.text}; font-family: var(--font-plus-jakarta, system-ui, sans-serif); }
        @keyframes skeleton-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes profile-glow {
          0%, 100% { box-shadow: 0 0 0 0 #1f6feb22; }
          50%       { box-shadow: 0 0 0 8px #1f6feb08; }
        }
      `}</style>

      {/* Header */}
      <header style={{ borderBottom: `1px solid ${T.borderMuted}`, background: `${T.bg}ee`, backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 20px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button
            onClick={() => router.push("/")}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", color: T.textMuted, fontSize: 13, fontWeight: 500, padding: "4px 0", transition: "color 0.15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = T.text; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = T.textMuted; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            HackRank
          </button>

          <span style={{ fontSize: 12, color: T.textSubtle, fontWeight: 500 }}>Profile</span>
        </div>
      </header>

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "48px 20px 80px", animation: "fade-up 0.35s ease" }}>
        {notFound ? (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <div style={{ fontSize: 48, fontWeight: 800, color: T.textSubtle, letterSpacing: "-0.04em", marginBottom: 12 }}>404</div>
            <div style={{ fontSize: 15, color: T.textMuted, marginBottom: 24 }}>No user found with that username.</div>
            <button
              onClick={() => router.push("/")}
              style={{ padding: "8px 18px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bgElevated, color: T.text, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              Back to home
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Hero card */}
            <div style={{ borderRadius: 14, border: `1px solid ${T.border}`, background: T.bgElevated, overflow: "hidden" }}>
              {/* Banner */}
              <div style={{ height: 90, background: "linear-gradient(135deg, #0d1117 0%, #1a2744 50%, #0d2137 100%)", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 30% 50%, #1f6feb18 0%, transparent 60%), radial-gradient(circle at 70% 50%, #00B4D812 0%, transparent 60%)" }} />
              </div>

              {/* Avatar + name row */}
              <div style={{ padding: "0 24px 24px", position: "relative" }}>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 16 }}>
                  {/* Avatar */}
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg,#1f6feb,#388bfd)",
                      border: `3px solid ${T.bg}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 24,
                      fontWeight: 800,
                      color: "#fff",
                      letterSpacing: "-0.03em",
                      marginTop: -36,
                      flexShrink: 0,
                      animation: "profile-glow 3s ease infinite",
                    }}
                  >
                    {initials}
                  </div>

                  {/* Badges */}
                  <div style={{ display: "flex", gap: 8, paddingBottom: 2 }}>
                    {isOwn && (
                      <div style={{ fontSize: 10, fontWeight: 700, color: T.blue, background: T.blueBg, border: `1px solid ${T.blueBorder}40`, borderRadius: 20, padding: "3px 10px", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                        You
                      </div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 700, color: "#00B4D8", background: "#001e2b", border: "1px solid #003E54", borderRadius: 20, padding: "3px 10px", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                      <DevpostMark size={10} /> Verified
                    </div>
                  </div>
                </div>

                {/* Name */}
                {loading ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <Skeleton w={160} h={26} radius={6} />
                    <Skeleton w={110} h={14} radius={4} />
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: "-0.03em", marginBottom: 4 }}>
                      @{user?.username ?? username}
                    </div>
                    <div style={{ fontSize: 12, color: T.textSubtle }}>
                      Joined {joined}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Linked accounts card */}
            <div style={{ borderRadius: 14, border: `1px solid ${T.border}`, background: T.bgElevated, overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.borderMuted}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Linked accounts</div>
              </div>

              <div style={{ padding: "16px 20px" }}>
                {loading ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Skeleton w={36} h={36} radius={8} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <Skeleton w={80} h={12} radius={4} />
                      <Skeleton w={120} h={14} radius={4} />
                    </div>
                  </div>
                ) : (
                  <a
                    href={`https://devpost.com/${user?.devpostUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, border: "1px solid #003E54", background: "#001e2b", textDecoration: "none", transition: "border-color 0.15s, background 0.15s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#00B4D850"; e.currentTarget.style.background = "#002535"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#003E54"; e.currentTarget.style.background = "#001e2b"; }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: "#00B4D815", border: "1px solid #00B4D830", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <DevpostMark size={20} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: T.textSubtle, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>Devpost</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#00B4D8" }}>@{user?.devpostUsername}</div>
                    </div>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.textSubtle} strokeWidth="2" strokeLinecap="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                )}
              </div>
            </div>

            {/* Info row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                {
                  label: "Member since",
                  value: loading ? null : new Date(user?.createdAt ?? "").toLocaleDateString("en-US", { month: "short", year: "numeric" }),
                  icon: (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  ),
                },
                {
                  label: "Identity",
                  value: loading ? null : "Devpost verified",
                  icon: (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  ),
                  accent: T.greenLight,
                },
              ].map(({ label, value, icon, accent }) => (
                <div
                  key={label}
                  style={{ borderRadius: 12, border: `1px solid ${T.border}`, background: T.bgElevated, padding: "16px 18px" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 7, color: T.textSubtle, marginBottom: 10 }}>
                    {icon}
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
                  </div>
                  {loading ? (
                    <Skeleton w="60%" h={18} radius={4} />
                  ) : (
                    <div style={{ fontSize: 14, fontWeight: 700, color: accent ?? T.text, letterSpacing: "-0.02em" }}>{value}</div>
                  )}
                </div>
              ))}
            </div>

            {/* ── Hackathons section ─────────────────────────────────── */}
            <div style={{ borderRadius: 14, border: `1px solid ${T.border}`, background: T.bgElevated, overflow: "hidden" }}>
              {/* Header */}
              <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.borderMuted}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Hackathons attended
                  </div>
                  {hackathons !== null && !hackathonsLoading && (
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.textSubtle, background: T.bgOverlay, border: `1px solid ${T.borderMuted}`, borderRadius: 20, padding: "1px 8px" }}>
                      {hackathons.length}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {hackathonsCachedAt && !hackathonsLoading && (
                    <span style={{ fontSize: 10, color: T.textSubtle }}>
                      Updated {new Date(hackathonsCachedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  )}
                  <button
                    onClick={() => fetchHackathons(true)}
                    disabled={hackathonsLoading}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.bgOverlay, color: T.textMuted, fontSize: 11, fontWeight: 600, cursor: hackathonsLoading ? "not-allowed" : "pointer", opacity: hackathonsLoading ? 0.6 : 1, transition: "border-color 0.15s, color 0.15s" }}
                    onMouseEnter={(e) => { if (!hackathonsLoading) { e.currentTarget.style.borderColor = T.blue; e.currentTarget.style.color = T.blue; } }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: hackathonsLoading ? "spin 1s linear infinite" : "none" }}>
                      <polyline points="23 4 23 10 17 10" />
                      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                    </svg>
                    {hackathonsLoading ? "Syncing…" : "Refresh"}
                  </button>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: hackathonsLoading || hackathonsError || (hackathons !== null && hackathons.length === 0) ? "32px 20px" : "8px 0" }}>
                {hackathonsLoading && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {[1, 2, 3].map((i) => (
                      <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "0 20px" }}>
                        <Skeleton w={52} h={52} radius={10} />
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
                          <Skeleton w="45%" h={14} radius={4} />
                          <Skeleton w="30%" h={11} radius={4} />
                          <Skeleton w="70%" h={11} radius={4} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!hackathonsLoading && hackathonsError && (
                  <div style={{ textAlign: "center", color: "#f85149", fontSize: 12 }}>
                    {hackathonsError}
                  </div>
                )}

                {!hackathonsLoading && hackathons !== null && hackathons.length === 0 && (
                  <div style={{ textAlign: "center", color: T.textSubtle, fontSize: 12 }}>
                    No hackathons found on this Devpost profile.
                  </div>
                )}

                {!hackathonsLoading && hackathons !== null && hackathons.length > 0 && (
                  <div>
                    {hackathons.map((h, i) => (
                      <a
                        key={h.id || i}
                        href={h.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "14px 20px", borderBottom: i < hackathons.length - 1 ? `1px solid ${T.borderMuted}` : "none", textDecoration: "none", transition: "background 0.12s ease" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = T.bgOverlay; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                      >
                        {/* Logo */}
                        <div style={{ width: 52, height: 52, borderRadius: 10, border: `1px solid ${T.border}`, background: T.bgOverlay, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {h.imageUrl && !imgErrors[h.id] ? (
                            <img
                              src={h.imageUrl}
                              alt={h.imageAlt}
                              width={52}
                              height={52}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              onError={() => setImgErrors((prev) => ({ ...prev, [h.id]: true }))}
                            />
                          ) : (
                            <span style={{ fontSize: 16, fontWeight: 800, color: T.textSubtle, letterSpacing: "-0.02em" }}>
                              {h.name.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: T.text, letterSpacing: "-0.02em" }}>{h.name}</span>
                            {h.location && (
                              <span style={{ fontSize: 10, color: T.textSubtle, fontWeight: 500, display: "flex", alignItems: "center", gap: 3 }}>
                                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                {h.location}
                              </span>
                            )}
                          </div>

                          {h.description && (
                            <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.5, marginBottom: 8, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                              {h.description}
                            </div>
                          )}

                          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                            {h.prize && (
                              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: T.orange, fontWeight: 600 }}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>
                                {h.prize}
                              </span>
                            )}
                            {h.dateRange && (
                              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: T.textSubtle, fontWeight: 500 }}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                {h.dateRange}
                              </span>
                            )}
                            {h.participants && (
                              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: T.textSubtle, fontWeight: 500 }}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                {h.participants}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Arrow */}
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.textSubtle} strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 4 }}>
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                          <polyline points="15 3 21 3 21 9"/>
                          <line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </main>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
