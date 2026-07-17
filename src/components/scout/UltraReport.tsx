"use client";

import Link from "next/link";
import { Bot, Crosshair, Flame, Shield, Swords, Target, Zap } from "lucide-react";
import type { UltraDeepResult } from "@/lib/chess/ultraDeepScout";
import { SeverityBadge, StatBar } from "@/components/ui/StatBar";
import { cn } from "@/lib/utils";

export function UltraReport({
  ultra,
  twinHref,
  username,
}: {
  ultra: UltraDeepResult;
  twinHref: string;
  username: string;
}) {
  return (
    <div className="space-y-4">
      {/* Oracle hero */}
      <div className="panel p-5 sm:p-6 space-y-4 glow-ring border-cyan-400/20">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="section-title flex items-center gap-2">
              <Zap size={12} className="text-cyan-300" /> Aether Oracle
            </div>
            <h2 className="text-xl font-semibold mt-1">Ultra-deep forensic dossier</h2>
            <p className="text-sm text-[var(--text-muted)] mt-1 max-w-2xl">{ultra.battlePlan.headline}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ScorePill label="Oracle" value={ultra.oracleScore} accent="cyan" />
            <ScorePill label="Prep" value={ultra.prepScore} accent="violet" />
            <ScorePill label="Stalker+" value={ultra.stalkerScore} accent="amber" />
            <ScorePill label="Entropy" value={ultra.fingerprintEntropy} accent="emerald" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {ultra.oracleBreakdown.map((b) => (
            <div key={b.label} className="glass rounded-xl p-3">
              <div className="flex justify-between text-[10px] uppercase text-[var(--text-dim)]">
                <span>{b.label}</span>
                <span>w{b.weight}</span>
              </div>
              <div className="font-mono text-lg font-semibold mt-0.5">{b.score}</div>
              <div className="text-[11px] text-[var(--text-muted)] truncate">{b.note}</div>
              <div className="progress-bar mt-2">
                <span style={{ width: `${b.score}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="text-xs text-[var(--text-dim)] flex flex-wrap gap-3">
          <span>
            Reliability:{" "}
            <strong className="text-cyan-300 capitalize">{ultra.confidence.reliability}</strong>
          </span>
          <span>{ultra.confidence.dataFreshness}</span>
          <span>Sample quality {ultra.confidence.sampleQuality}/100</span>
        </div>
      </div>

      {/* Battle plan */}
      <div className="panel p-5 space-y-4 border border-amber-400/20">
        <div className="section-title flex items-center gap-2">
          <Swords size={12} className="text-amber-300" /> Today&apos;s battle plan
        </div>
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <PlanRow title="Color" body={ultra.battlePlan.colorAdvice} />
          <PlanRow title="Time control" body={ultra.battlePlan.timeAdvice} />
          <PlanRow title="Opening" body={ultra.battlePlan.openingAdvice} />
          <PlanRow title="Middlegame" body={ultra.battlePlan.middlegameAdvice} />
          <PlanRow title="Endgame" body={ultra.battlePlan.endgameAdvice} />
          <PlanRow title="Psychology" body={ultra.battlePlan.psychologicalAdvice} />
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3">
            <div className="text-xs font-semibold text-emerald-300 mb-2">DO</div>
            <ul className="space-y-1.5 text-sm text-[var(--text-muted)]">
              {ultra.battlePlan.doList.map((x) => (
                <li key={x}>▸ {x}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-rose-400/20 bg-rose-400/5 p-3">
            <div className="text-xs font-semibold text-rose-300 mb-2">DON&apos;T</div>
            <ul className="space-y-1.5 text-sm text-[var(--text-muted)]">
              {ultra.battlePlan.dontList.map((x) => (
                <li key={x}>▸ {x}</li>
              ))}
            </ul>
          </div>
        </div>
        <Link href={twinHref} className="btn btn-primary">
          <Bot size={16} />
          Train Twin Bot · {username}
        </Link>
      </div>

      {/* Insights */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {ultra.insights.map((ins) => (
          <div
            key={ins.title}
            className={cn(
              "panel p-4 space-y-2",
              ins.edge === "huge" && "border-cyan-400/30",
              ins.edge === "solid" && "border-white/10",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="font-semibold text-sm">
                <span className="mr-1.5">{ins.icon}</span>
                {ins.title}
              </div>
              <span
                className={cn(
                  "text-[10px] uppercase font-bold",
                  ins.edge === "huge" && "text-cyan-300",
                  ins.edge === "solid" && "text-violet-300",
                  ins.edge === "small" && "text-[var(--text-dim)]",
                )}
              >
                {ins.edge} edge
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">{ins.body}</p>
          </div>
        ))}
      </div>

      {/* Style radar + conversion */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="panel p-5 space-y-3">
          <div className="section-title">Style radar (8-axis)</div>
          {ultra.styleRadar.labels.map((label, i) => (
            <StatBar
              key={label}
              label={label}
              value={ultra.styleRadar.values[i] ?? 0}
              color={i % 2 === 0 ? "var(--accent)" : "var(--accent-2)"}
            />
          ))}
        </div>
        <div className="panel p-5 space-y-3">
          <div className="section-title flex items-center gap-2">
            <Target size={12} /> Conversion physics
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Mini label="Collapse rate" value={`${ultra.conversion.collapseRate}%`} danger />
            <Mini label="Steal rate" value={`${ultra.conversion.stealRate}%`} good />
            <Mini
              label="When ahead"
              value={`${ultra.conversion.whenAheadWins}W ${ultra.conversion.whenAheadDraws}D ${ultra.conversion.whenAheadLosses}L`}
            />
            <Mini
              label="When behind"
              value={`${ultra.conversion.whenBehindWins}W ${ultra.conversion.whenBehindDraws}D ${ultra.conversion.whenBehindLosses}L`}
            />
          </div>
          <div className="section-title pt-2">Phase blunder heat</div>
          <StatBar label="Opening" value={ultra.phaseBlunderHeat.opening} color="var(--warning)" />
          <StatBar
            label="Middlegame"
            value={ultra.phaseBlunderHeat.middlegame}
            color="var(--danger)"
          />
          <StatBar label="Endgame" value={ultra.phaseBlunderHeat.endgame} color="#ff9f43" />
        </div>
      </div>

      {/* Piece DNA + signatures */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="panel p-5 space-y-3">
          <div className="section-title">Piece DNA</div>
          <p className="text-sm text-[var(--text-muted)]">
            Favorite: <strong className="text-white">{ultra.pieceDNA.favoritePiece}</strong> ·
            Neglected: <strong className="text-white">{ultra.pieceDNA.neglectedPiece}</strong>
          </p>
          <div className="section-title">Move share</div>
          {Object.entries(ultra.pieceDNA.movedShare).map(([k, v]) => (
            <StatBar key={k} label={k.toUpperCase()} value={v} color="var(--accent)" />
          ))}
          <div className="section-title pt-1">Hang tendency (approx)</div>
          {Object.entries(ultra.pieceDNA.hungTendency).map(([k, v]) => (
            <StatBar key={k} label={k.toUpperCase()} value={v} color="var(--danger)" />
          ))}
        </div>
        <div className="panel p-5 space-y-3">
          <div className="section-title">Signature metrics (Aether-only)</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {(
              [
                ["Early queen outings", ultra.signatures.earlyQueenOutings],
                ["Queen trade rate", `${ultra.signatures.dualQueenTradeRate}%`],
                ["Sac wins", ultra.signatures.sacrificeWins],
                ["King walks", ultra.signatures.kingWalks],
                ["Pawn storm", ultra.signatures.pawnStormScore],
                ["Check density", `${ultra.signatures.checkDensity}%`],
                ["Capture density", `${ultra.signatures.captureDensity}%`],
                ["Quiet bias", `${ultra.signatures.quietMoveBias}%`],
                ["Opp. castling", `${ultra.signatures.oppositeCastlingRate}%`],
                ["Q-trade avoid", `${ultra.signatures.queenTradeAvoidance}%`],
                ["En passant rate", `${ultra.signatures.enPassantRate}%`],
                ["Underpromos", ultra.signatures.underpromotions],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="glass rounded-lg px-2.5 py-2">
                <div className="text-[var(--text-dim)]">{k}</div>
                <div className="font-mono font-semibold text-sm mt-0.5">{v}</div>
              </div>
            ))}
          </div>
          <div className="text-xs text-[var(--text-muted)]">
            Kill shots: {ultra.killShots.matesDelivered} mates ({ultra.killShots.shortMates} early) ·
            Resign pressure {ultra.killShots.resignPressure}
          </div>
        </div>
      </div>

      {/* Prep pack */}
      <div className="panel p-5 space-y-3">
        <div className="section-title flex items-center gap-2">
          <Flame size={12} className="text-orange-300" /> 5-line prep pack
        </div>
        {ultra.prepPack.map((p) => (
          <div
            key={p.priority}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-1"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-400/15 text-cyan-300 text-xs font-bold">
                {p.priority}
              </span>
              <span className="font-semibold text-sm">{p.title}</span>
              <span className="chip !cursor-default !py-0.5 text-[10px] capitalize">{p.color}</span>
              <span className="ml-auto font-mono text-xs text-[var(--text-dim)]">
                conf {p.confidence}%
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">{p.idea}</p>
            {p.sample && (
              <p className="text-[11px] font-mono text-cyan-200/80 truncate">{p.sample}</p>
            )}
            <p className="text-[11px] text-[var(--text-dim)]">{p.why}</p>
          </div>
        ))}
      </div>

      {/* ECO + traps */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="panel p-5 space-y-2">
          <div className="section-title">ECO fingerprint clusters</div>
          <div className="max-h-64 overflow-y-auto space-y-1.5">
            {ultra.ecoClusters.map((e) => (
              <div
                key={e.eco + e.as + e.name}
                className="flex items-center gap-2 text-sm border-b border-white/5 pb-1.5"
              >
                <span className="font-mono text-cyan-300 w-10 shrink-0">{e.eco}</span>
                <span className="truncate flex-1 text-[var(--text-muted)]">{e.name}</span>
                <span className="text-[10px] capitalize text-[var(--text-dim)]">{e.as[0]}</span>
                <span className="font-mono w-12 text-right">{e.score}%</span>
                <span className="text-[var(--text-dim)] w-8 text-right text-xs">{e.games}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel p-5 space-y-2">
          <div className="section-title">Miniature / trap map</div>
          {ultra.traps.length === 0 && (
            <p className="text-sm text-[var(--text-dim)]">No short-loss clusters found.</p>
          )}
          {ultra.traps.map((t) => (
            <div key={t.line + t.as} className="rounded-lg border border-white/8 p-2.5 text-xs">
              <div className="flex justify-between gap-2">
                <span className="capitalize text-[var(--text-dim)]">{t.as}</span>
                <span className="text-[var(--danger)] font-mono">{t.lossRate}% losses</span>
              </div>
              <div className="font-mono text-[var(--text-muted)] mt-1 break-all">{t.line}</div>
              <div className="text-[var(--text-dim)] mt-1">
                {t.losses}/{t.games} · ~{t.typicalPly} plies
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Nemesis + rating bands */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="panel p-5 space-y-2">
          <div className="section-title flex items-center gap-2">
            <Crosshair size={12} /> Nemesis network
          </div>
          {ultra.nemesis.length === 0 && (
            <p className="text-sm text-[var(--text-dim)]">No repeat tormentors yet.</p>
          )}
          {ultra.nemesis.map((n) => (
            <div key={n.opponent} className="flex justify-between text-sm py-1 border-b border-white/5">
              <span className="truncate">{n.opponent}</span>
              <span className="font-mono text-[var(--danger)]">
                {n.theirScore}% · {n.games}g
              </span>
            </div>
          ))}
          {ultra.softOpponents[0] && (
            <p className="text-xs text-emerald-300/90 pt-2">
              Soft matchup: {ultra.softOpponents[0].opponent} (they only score{" "}
              {ultra.softOpponents[0].theirScore}% vs them)
            </p>
          )}
        </div>
        <div className="panel p-5 space-y-2">
          <div className="section-title">vs rating bands</div>
          {ultra.ratingBands.length === 0 && (
            <p className="text-sm text-[var(--text-dim)]">Need rated games with both ratings.</p>
          )}
          {ultra.ratingBands.map((b) => (
            <div key={b.band} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-muted)]">{b.label}</span>
                <span className="font-mono">
                  {b.score}% · {b.games}g
                </span>
              </div>
              <div className="progress-bar">
                <span style={{ width: `${b.score}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Clock + castling + rematch */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="panel p-4 space-y-2">
          <div className="section-title">Clock autopsy</div>
          {ultra.clock.hasData ? (
            <>
              <Mini label="Open spend" value={`${ultra.clock.avgSecondsSpentOpening}s`} />
              <Mini label="Middle spend" value={`${ultra.clock.avgSecondsSpentMiddle}s`} />
              <Mini label="End spend" value={`${ultra.clock.avgSecondsSpentEnd}s`} />
              <Mini label="Panic rate" value={`${ultra.clock.panicFlagRate}%`} />
              <Mini label="Scramble score" value={`${ultra.clock.timeScrambleScore}`} danger />
            </>
          ) : (
            <p className="text-xs text-[var(--text-dim)]">{ultra.clock.notes[0]}</p>
          )}
          {ultra.clock.notes.slice(1).map((n) => (
            <p key={n} className="text-[11px] text-[var(--text-muted)]">
              {n}
            </p>
          ))}
        </div>
        <div className="panel p-4 space-y-2">
          <div className="section-title">Castling psyche</div>
          <Mini label="Short" value={ultra.castling.short} />
          <Mini label="Long" value={ultra.castling.long} />
          <Mini label="Opposite" value={ultra.castling.opposite} />
          <Mini label="Avg castle ply" value={ultra.castling.delayedCastleAvgPly} />
          <Mini label="Never castled" value={`${ultra.castling.neverCastledRate}%`} />
        </div>
        <div className="panel p-4 space-y-2">
          <div className="section-title flex items-center gap-2">
            <Shield size={12} /> Rematch curse
          </div>
          <Mini label="Pairs" value={ultra.rematch.samplePairs} />
          <Mini label="2nd game score" value={`${ultra.rematch.secondGameScore}%`} />
          <p className="text-xs text-[var(--text-muted)]">{ultra.rematch.note}</p>
          {ultra.rematch.tiltConfirmed && (
            <p className="text-xs text-amber-300 font-medium">Tilt rematch pattern DETECTED</p>
          )}
        </div>
      </div>

      {/* Momentum + weekday */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="panel p-5 space-y-2">
          <div className="section-title">Momentum (rolling 10, newest→)</div>
          <div className="flex items-end gap-0.5 h-24">
            {ultra.momentum.slice(0, 30).map((m) => (
              <div
                key={m.n}
                title={`#${m.n} ${m.result} roll ${m.rollingScore}%`}
                className={cn(
                  "flex-1 min-w-[4px] rounded-t",
                  m.result === "W" && "bg-emerald-400/80",
                  m.result === "L" && "bg-rose-400/70",
                  m.result === "D" && "bg-white/30",
                )}
                style={{ height: `${Math.max(8, m.rollingScore)}%` }}
              />
            ))}
          </div>
          <p className="text-[11px] text-[var(--text-dim)]">Bar height = rolling score · color = result</p>
        </div>
        <div className="panel p-5 space-y-2">
          <div className="section-title">Weekday pulse (UTC)</div>
          {ultra.weekday.map((d) => (
            <div key={d.day} className="flex items-center gap-2 text-sm">
              <span className="w-8 text-[var(--text-dim)]">{d.day}</span>
              <div className="flex-1 progress-bar">
                <span style={{ width: `${d.games ? d.score : 0}%` }} />
              </div>
              <span className="font-mono text-xs w-16 text-right">
                {d.games ? `${d.score}%` : "—"}
              </span>
              <span className="text-[var(--text-dim)] text-xs w-8">{d.games}g</span>
            </div>
          ))}
        </div>
      </div>

      {/* Biggest swings */}
      <div className="panel p-5 space-y-2">
        <div className="section-title">Critical material swings (forensic)</div>
        {ultra.biggestSwings.length === 0 && (
          <p className="text-sm text-[var(--text-dim)]">No large swings detected in sample.</p>
        )}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {ultra.biggestSwings.map((s, i) => (
            <div key={i} className="glass rounded-lg px-3 py-2 text-xs font-mono">
              <span className="text-[var(--danger)]">{s.delta}</span> @ ply {s.ply} · {s.phase}
              <div className="text-[var(--text-muted)] mt-0.5">{s.san}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Weaknesses full */}
      <div className="panel p-5 space-y-3">
        <div className="section-title">Exploit dossier</div>
        <div className="grid md:grid-cols-2 gap-3">
          {ultra.weaknesses.map((w) => (
            <div key={w.title} className="rounded-xl border border-white/8 p-3 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium text-sm">{w.title}</div>
                <SeverityBadge severity={w.severity} />
              </div>
              <p className="text-xs text-[var(--text-muted)]">{w.detail}</p>
              <p className="text-xs text-cyan-200/90">Exploit: {w.exploit}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="panel p-4 text-[11px] text-[var(--text-dim)] space-y-1">
        <div className="section-title">Caveats</div>
        {ultra.confidence.caveats.map((c) => (
          <div key={c}>▸ {c}</div>
        ))}
        <div className="pt-1 text-[var(--text-muted)]">
          Built to surpass single-page stalker tools: Oracle multi-factor scoring, piece DNA, conversion
          physics, nemesis graphs, ECO clusters, rematch curse, clock autopsy, momentum, weekday
          pulse, trap maps, and a concrete battle plan — not just repertoire heatmaps.
        </div>
      </div>
    </div>
  );
}

function ScorePill({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "cyan" | "violet" | "amber" | "emerald";
}) {
  const ring =
    accent === "cyan"
      ? "var(--accent)"
      : accent === "violet"
        ? "var(--accent-2)"
        : accent === "amber"
          ? "var(--warning)"
          : "var(--success)";
  return (
    <div className="glass rounded-2xl px-3 py-2 min-w-[4.5rem] text-center">
      <div className="text-[9px] uppercase text-[var(--text-dim)]">{label}</div>
      <div className="text-xl font-mono font-semibold" style={{ color: ring }}>
        {value}
      </div>
    </div>
  );
}

function PlanRow({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
      <div className="text-[10px] uppercase tracking-wide text-[var(--text-dim)]">{title}</div>
      <p className="text-sm text-[var(--text-muted)] mt-1 leading-relaxed">{body}</p>
    </div>
  );
}

function Mini({
  label,
  value,
  danger,
  good,
}: {
  label: string;
  value: string | number;
  danger?: boolean;
  good?: boolean;
}) {
  return (
    <div className="flex justify-between text-xs py-0.5">
      <span className="text-[var(--text-dim)]">{label}</span>
      <span
        className={cn(
          "font-mono",
          danger && "text-[var(--danger)]",
          good && "text-[var(--success)]",
        )}
      >
        {value}
      </span>
    </div>
  );
}
