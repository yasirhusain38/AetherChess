"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bot,
  Crosshair,
  Search,
  Share2,
  Wifi,
  WifiOff,
  AlertTriangle,
} from "lucide-react";
import {
  DEMO_USERNAMES,
  generateScoutReport,
  platformLabel,
  type ScoutReport,
} from "@/lib/chess/scout";
import { ultraDeepAnalyze, type UltraDeepResult } from "@/lib/chess/ultraDeepScout";
import {
  fetchChesscomGames,
  fetchChesscomProfile,
  fetchLichessGames,
  fetchLichessProfile,
  type ImportedGame,
  type LiveProfile,
} from "@/lib/chess/importGames";
import { UltraReport } from "@/components/scout/UltraReport";
import { RadarChart } from "@/components/ui/Charts";
import { PageLoading } from "@/components/ui/Skeleton";
import { SeverityBadge, StatBar } from "@/components/ui/StatBar";
import { emitRewardToast } from "@/components/growth/ToastReward";
import { trackScout } from "@/lib/engagement";
import { bumpStats, saveGame } from "@/lib/storage";
import { cn } from "@/lib/utils";

type SourceMode = "chesscom" | "lichess" | "auto" | "demo";

export default function ScoutPage() {
  const router = useRouter();
  const [query, setQuery] = useState("hikaru");
  const [source, setSource] = useState<SourceMode>("chesscom");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ScoutReport | null>(null);
  const [ultra, setUltra] = useState<UltraDeepResult | null>(null);
  const [live, setLive] = useState<LiveProfile | null>(null);
  const [gameSample, setGameSample] = useState<ImportedGame[]>([]);
  const [dataMode, setDataMode] = useState<"live" | "demo">("demo");
  const [error, setError] = useState<string | null>(null);
  const [statusLine, setStatusLine] = useState("");
  const [meta, setMeta] = useState<string>("");

  const runScout = async (name?: string) => {
    const q = (name ?? query).trim().replace(/^@/, "").replace(/\/+$/, "");
    // allow chess.com profile URLs
    const cleaned =
      q.match(/chess\.com\/member\/([^/?#]+)/i)?.[1] ||
      q.match(/lichess\.org\/@\/([^/?#]+)/i)?.[1] ||
      q;

    if (!cleaned) {
      setError("Enter a Chess.com or Lichess username.");
      return;
    }

    setQuery(cleaned);
    setError(null);
    setLoading(true);
    setReport(null);
    setUltra(null);
    setLive(null);
    setGameSample([]);
    setMeta("");
    setStatusLine("Looking up player…");

    try {
      let profile: LiveProfile | null = null;
      let games: ImportedGame[] = [];
      let used: "lichess" | "chesscom" | "demo" = "demo";
      let fetchError: string | undefined;

      const tryChesscom = source === "auto" || source === "chesscom";
      const tryLichess = source === "auto" || source === "lichess";

      // Prefer Chess.com when selected or auto
      if (source !== "demo" && tryChesscom) {
        setStatusLine("Fetching Chess.com profile…");
        profile = await fetchChesscomProfile(cleaned);
        if (profile) {
          setStatusLine("Downloading Chess.com games (recent months)…");
          const packed = await fetchChesscomGames(cleaned, 200);
          games = packed.games;
          fetchError = packed.error;
          if (packed.meta) {
            setMeta(
              `Archives: ${packed.meta.archivesUsed ?? "?"} months · fetched ${packed.meta.totalFetched ?? games.length}`,
            );
          }
          used = "chesscom";
          if (!games.length && fetchError) {
            setStatusLine(fetchError);
          }
        } else if (source === "chesscom") {
          fetchError = "Chess.com user not found. Check the exact username.";
        }
      }

      if (
        source !== "demo" &&
        tryLichess &&
        (!profile || games.length < 5)
      ) {
        setStatusLine(
          profile
            ? "Few Chess.com games — trying Lichess…"
            : "Fetching Lichess profile…",
        );
        const lp = await fetchLichessProfile(cleaned);
        if (lp) {
          if (!profile) profile = lp;
          setStatusLine("Downloading Lichess games…");
          const lg = await fetchLichessGames(cleaned, 120);
          if (lg.length > games.length) {
            games = lg;
            used = "lichess";
            profile = lp;
            setMeta(`${lg.length} Lichess games`);
          }
        } else if (source === "lichess") {
          fetchError = "Lichess user not found.";
        }
      }

      if (source === "demo" || !profile || games.length === 0) {
        setStatusLine("Building demo report…");
        await new Promise((r) => setTimeout(r, 400));
        const demo = generateScoutReport(cleaned);
        setReport(demo);
        setUltra(null);
        setDataMode("demo");
        setLive(null);
        bumpStats({ scoutReports: 1 });
        try {
          const r = trackScout();
          emitRewardToast({ gain: r.gain, bonus: r.bonus, reason: "Scout report" });
        } catch {
          /* ignore */
        }
        if (source !== "demo") {
          setError(
            fetchError ||
              "Could not load live games for that username. Showing demo model — double-check spelling on Chess.com.",
          );
        }
        setLoading(false);
        setStatusLine("");
        return;
      }

      setStatusLine(`Ultra-deep forensics on ${games.length} games (Oracle · DNA · traps · clocks)…`);
      // yield to UI so status paints
      await new Promise((r) => setTimeout(r, 40));
      const analysis = ultraDeepAnalyze(profile.username, games);
      const base = generateScoutReport(profile.username);

      const merged: ScoutReport = {
        ...base,
        username: profile.username,
        platforms: [
          used === "chesscom" ? "chesscom" : "lichess",
          "aether",
        ],
        ratings: {
          bullet: profile.ratings.bullet ?? base.ratings.bullet,
          blitz: profile.ratings.blitz ?? base.ratings.blitz,
          rapid: profile.ratings.rapid ?? base.ratings.rapid,
          classical: profile.ratings.classical ?? base.ratings.classical,
        },
        gamesAnalyzed: analysis.attributed || games.length,
        openings: analysis.openings.map((o) => ({
          name: o.name,
          moves: o.sampleLine,
          games: o.games,
          score: o.score,
          as: o.as,
        })),
        twinRepertoire: analysis.twinRepertoire,
        style: analysis.style,
        psyche: {
          tiltAfterLoss: analysis.psyche.tiltAfterLoss,
          timePressureBlunders: analysis.psyche.timePressureBlunders,
          conversionWhenWinning: analysis.psyche.conversionWhenWinning,
          gritWhenLosing: analysis.psyche.gritWhenLosing,
          bestHours: analysis.psyche.bestHours,
          worstHours: analysis.psyche.worstHours,
        },
        weaknesses: analysis.weaknesses,
        prepTips: analysis.prepTips,
        prepScore: analysis.prepScore,
        stalkerScore: analysis.stalkerScore,
        summary: analysis.summary,
        nemesisNote: analysis.strengths.join(" · "),
      };

      setReport(merged);
      setUltra(analysis);
      setLive(profile);
      setGameSample(games.slice(0, 20));
      setDataMode("live");
      bumpStats({ scoutReports: 1 });
      try {
        const r = trackScout();
        emitRewardToast({ gain: r.gain, bonus: r.bonus, reason: "Oracle dossier ready" });
      } catch {
        /* ignore */
      }
    } catch (e) {
      console.error(e);
      setError("Scout failed unexpectedly. Try again or use Demo.");
      setReport(generateScoutReport(cleaned));
      setDataMode("demo");
    } finally {
      setLoading(false);
      setStatusLine("");
    }
  };

  const twinHref = useMemo(() => {
    if (!report) return "/play";
    const rep = encodeURIComponent(report.twinRepertoire.join("|"));
    return `/play?twin=${encodeURIComponent(report.username)}&rep=${rep}`;
  }, [report]);

  const importGame = (g: ImportedGame) => {
    if (!g.pgn) return;
    const saved = saveGame({
      pgn: g.pgn,
      result: g.result,
      white: g.white,
      black: g.black,
      timeControl: g.timeClass || "imported",
      mode: "import",
    });
    router.push(`/analyze?game=${saved.id}`);
  };

  return (
    <div className="fade-up space-y-6">
      <div>
        <div className="section-title">Analyze & Scout</div>
        <h1 className="text-2xl sm:text-3xl font-semibold mt-1 flex items-center gap-2">
          <Crosshair className="text-amber-400" size={28} />
          Opponent Scout
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1 max-w-2xl">
          Type any <strong>Chess.com</strong> username → live games →{" "}
          <strong className="text-amber-400">Ultra-Deep Oracle dossier</strong> (beyond Chess Stalker:
          piece DNA, conversion physics, nemesis graphs, rematch curse, clock autopsy, ECO clusters,
          trap maps, battle plan) + Twin Bot.
        </p>
      </div>

      <div className="panel p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)]"
            />
            <input
              className="input !pl-9"
              placeholder="Chess.com username (e.g. hikaru) or profile URL"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runScout()}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => runScout()}
            disabled={loading}
          >
            {loading ? "Scouting…" : "Generate report"}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              ["chesscom", "Chess.com"],
              ["lichess", "Lichess"],
              ["auto", "Auto"],
              ["demo", "Demo"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={cn("chip", source === id && "chip-active")}
              onClick={() => setSource(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {["hikaru", "gothamchess", "magnuscarlsen", "danielnaroditsky", "nihalsarin"].map(
            (u) => (
              <button
                key={u}
                type="button"
                className="chip"
                onClick={() => {
                  setQuery(u);
                  setSource("chesscom");
                  void runScout(u);
                }}
              >
                {u}
              </button>
            ),
          )}
          {DEMO_USERNAMES.slice(0, 2).map((u) => (
            <button
              key={u}
              type="button"
              className="chip"
              onClick={() => {
                setQuery(u);
                setSource("lichess");
                void runScout(u);
              }}
            >
              {u} (L)
            </button>
          ))}
        </div>

        {error && (
          <p className="text-sm text-[var(--danger)] flex items-start gap-2">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            {error}
          </p>
        )}
        {statusLine && (
          <p className="text-sm text-amber-400/90 animate-pulse-soft">{statusLine}</p>
        )}
        {meta && !loading && (
          <p className="text-xs text-[var(--text-dim)]">{meta}</p>
        )}
      </div>

      {loading && (
        <div className="space-y-3">
          <p className="text-sm text-amber-400 animate-pulse-soft">
            Building opponent intelligence dossier…
          </p>
          <PageLoading variant="scout" />
        </div>
      )}

      {report && !loading && (
        <div className="space-y-4">
          {/* Header */}
          <div className="panel p-5 sm:p-6 space-y-4 glow-ring">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
              <div className="flex gap-4 min-w-0">
                {live?.avatar && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={live.avatar}
                    alt=""
                    className="h-16 w-16 rounded-2xl object-cover border border-white/10 shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-semibold truncate">
                      {live?.title ? `${live.title} ` : ""}
                      {report.username}
                    </h2>
                    {report.platforms.map((p) => (
                      <span key={p} className="chip !cursor-default text-[11px]">
                        {platformLabel(p)}
                      </span>
                    ))}
                    <span
                      className={cn(
                        "chip !cursor-default text-[11px] gap-1",
                        dataMode === "live"
                          ? "border-emerald-400/30 text-emerald-300"
                          : "border-white/10",
                      )}
                    >
                      {dataMode === "live" ? <Wifi size={12} /> : <WifiOff size={12} />}
                      {dataMode === "live" ? "Live API" : "Demo"}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-muted)] mt-2 max-w-2xl leading-relaxed">
                    {report.summary}
                  </p>
                  <div className="mt-2 text-xs text-[var(--text-dim)]">
                    {report.gamesAnalyzed.toLocaleString()} games analyzed
                    {live?.country ? ` · ${live.country}` : ""}
                    {live?.url && (
                      <>
                        {" · "}
                        <a
                          href={live.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-amber-400 hover:underline"
                        >
                          Open profile
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <Link href={twinHref} className="btn btn-primary">
                  <Bot size={16} />
                  Train Twin Bot
                </Link>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    void navigator.clipboard?.writeText(
                      `Aether Scout @${report.username} — Prep ${report.prepScore}/100 · ${report.prepTips[0]}`,
                    );
                  }}
                >
                  <Share2 size={16} />
                  Copy
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(
                [
                  ["Bullet", report.ratings.bullet],
                  ["Blitz", report.ratings.blitz],
                  ["Rapid", report.ratings.rapid],
                  ["Daily", report.ratings.classical],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="glass rounded-2xl px-3 py-3">
                  <div className="text-[10px] uppercase tracking-wide text-[var(--text-dim)]">
                    {k}
                  </div>
                  <div className="text-xl font-semibold font-mono">{v ?? "—"}</div>
                </div>
              ))}
            </div>

            {live?.record && (
              <div className="flex flex-wrap gap-3 text-xs text-[var(--text-muted)]">
                {live.record.blitz && (
                  <span>
                    Blitz W/L/D: {live.record.blitz.win}/{live.record.blitz.loss}/
                    {live.record.blitz.draw}
                  </span>
                )}
                {live.record.rapid && (
                  <span>
                    Rapid W/L/D: {live.record.rapid.win}/{live.record.rapid.loss}/
                    {live.record.rapid.draw}
                  </span>
                )}
                {live.record.bullet && (
                  <span>
                    Bullet W/L/D: {live.record.bullet.win}/{live.record.bullet.loss}/
                    {live.record.bullet.draw}
                  </span>
                )}
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-3">
              <ScoreRing label="Prep Score" value={report.prepScore} hint="Exploitable prep value" />
              <ScoreRing
                label="Stalker+ Score"
                value={report.stalkerScore}
                hint="Pattern clarity (enhanced)"
                accent="violet"
              />
            </div>
          </div>

          {ultra && (
            <div className="grid lg:grid-cols-3 gap-3">
              <div className="panel p-4 lg:col-span-1 flex flex-col justify-center items-center text-center gap-2">
                <div className="text-[10px] uppercase text-[var(--text-dim)]">Win probability edge</div>
                <div
                  className="relative h-28 w-28 rounded-full grid place-items-center"
                  style={{
                    background: `conic-gradient(var(--success) ${ultra.oracleScore * 3.6}deg, rgba(255,255,255,0.08) 0)`,
                  }}
                >
                  <div className="h-20 w-20 rounded-full bg-[var(--bg-panel)] grid place-items-center">
                    <span className="font-mono text-2xl font-semibold text-emerald-300">
                      {Math.min(92, Math.round(40 + ultra.oracleScore * 0.45))}%
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] px-2">
                  Estimated prep-driven edge if you follow the battle plan (not a match prediction).
                </p>
              </div>
              <RadarChart
                className="lg:col-span-2"
                labels={ultra.styleRadar.labels}
                values={ultra.styleRadar.values}
              />
            </div>
          )}

          {ultra ? (
            <UltraReport ultra={ultra} twinHref={twinHref} username={report.username} />
          ) : (
            <>
              <div className="grid lg:grid-cols-2 gap-4">
                <div className="panel p-5 space-y-4">
                  <div className="section-title">Style DNA (demo)</div>
                  <StatBar label="Aggression" value={report.style.aggression} color="var(--danger)" />
                  <StatBar label="Tactics" value={report.style.tactics} color="var(--accent)" />
                  <StatBar label="Endgame" value={report.style.endgame} color="var(--success)" />
                  <StatBar label="Time" value={report.style.time} color="var(--warning)" />
                </div>
                <div className="panel p-5 space-y-3">
                  <div className="section-title">Weaknesses (demo)</div>
                  {report.weaknesses.map((w) => (
                    <div key={w.title} className="rounded-xl border border-white/8 p-3 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium text-sm">{w.title}</div>
                        <SeverityBadge severity={w.severity} />
                      </div>
                      <p className="text-xs text-[var(--text-muted)]">{w.detail}</p>
                    </div>
                  ))}
                  <Link href={twinHref} className="btn btn-primary w-full">
                    <Bot size={16} /> Twin Bot
                  </Link>
                </div>
              </div>
              <div className="panel p-4 text-xs text-[var(--text-dim)]">
                Load a live Chess.com / Lichess username to unlock the full Ultra-Deep Oracle (DNA,
                conversion physics, nemesis, clocks, ECO, traps, battle plan).
              </div>
            </>
          )}

          <div className="panel p-5 space-y-3">
            <div className="section-title">Opening repertoire heatmap</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[var(--text-dim)] text-xs">
                    <th className="pb-2 font-medium">Opening</th>
                    <th className="pb-2 font-medium">Color</th>
                    <th className="pb-2 font-medium">Games</th>
                    <th className="pb-2 font-medium">Score</th>
                    <th className="pb-2 font-medium hidden md:table-cell">Sample line</th>
                  </tr>
                </thead>
                <tbody>
                  {report.openings.map((o) => (
                    <tr key={o.name + o.as + o.games} className="border-t border-white/5">
                      <td className="py-2.5 font-medium max-w-[200px] truncate">{o.name}</td>
                      <td className="py-2.5 capitalize text-[var(--text-muted)]">{o.as}</td>
                      <td className="py-2.5 font-mono">{o.games}</td>
                      <td
                        className={cn(
                          "py-2.5 font-mono",
                          o.score >= 55
                            ? "text-[var(--success)]"
                            : o.score < 45
                              ? "text-[var(--danger)]"
                              : "",
                        )}
                      >
                        {o.score}%
                      </td>
                      <td className="py-2.5 text-xs text-[var(--text-dim)] hidden md:table-cell font-mono truncate max-w-[220px]">
                        {o.moves}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {gameSample.length > 0 && (
            <div className="panel p-5 space-y-3">
              <div className="section-title">Recent live games → Analyze</div>
              <div className="space-y-2">
                {gameSample.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => importGame(g)}
                    disabled={!g.pgn}
                    className="w-full text-left rounded-xl border border-white/8 px-3 py-2.5 hover:border-emerald-500/30 transition-colors disabled:opacity-40"
                  >
                    <div className="text-sm font-medium">
                      {g.white}
                      {g.whiteRating ? ` (${g.whiteRating})` : ""} vs {g.black}
                      {g.blackRating ? ` (${g.blackRating})` : ""}
                    </div>
                    <div className="text-[11px] text-[var(--text-dim)]">
                      {g.result} · {g.timeClass || g.source}
                      {g.opening ? ` · ${g.opening}` : ""}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ScoreRing({
  label,
  value,
  hint,
  accent = "cyan",
}: {
  label: string;
  value: number;
  hint: string;
  accent?: "cyan" | "violet";
}) {
  return (
    <div className="glass rounded-2xl p-4 flex items-center gap-4">
      <div
        className="relative h-16 w-16 shrink-0 rounded-full grid place-items-center"
        style={{
          background: `conic-gradient(${
            accent === "cyan" ? "var(--accent)" : "var(--accent-2)"
          } ${value * 3.6}deg, rgba(255,255,255,0.08) 0)`,
        }}
      >
        <div className="h-12 w-12 rounded-full bg-[var(--bg-panel)] grid place-items-center font-mono font-semibold">
          {value}
        </div>
      </div>
      <div>
        <div className="font-semibold">{label}</div>
        <div className="text-xs text-[var(--text-dim)]">{hint}</div>
      </div>
    </div>
  );
}
