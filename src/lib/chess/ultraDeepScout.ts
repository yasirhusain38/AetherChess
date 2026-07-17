/**
 * Aether Ultra-Deep Scout
 * Multi-layer opponent forensics far beyond basic repertoire/weakness tools.
 * Every signal is derived from real game data (PGN + metadata) when available.
 */
import { Chess } from "chess.js";
import type { ImportedGame } from "./importGames";
import { deepAnalyzeGames, type DeepScoutResult } from "./deepScout";

export interface MaterialSwing {
  ply: number;
  delta: number; // from player's POV after their move
  san: string;
  phase: "opening" | "middlegame" | "endgame";
}

export interface PhaseBlunderHeat {
  opening: number; // 0-100 risk
  middlegame: number;
  endgame: number;
}

export interface NemesisEntry {
  opponent: string;
  games: number;
  theirScore: number; // opponent's score % vs this player
  losses: number;
}

export interface RatingBandPerf {
  band: string;
  games: number;
  score: number;
  label: string;
}

export interface EcoCluster {
  eco: string;
  name: string;
  games: number;
  score: number;
  as: "white" | "black";
}

export interface PrepLine {
  title: string;
  priority: 1 | 2 | 3 | 4 | 5;
  color: "white" | "black" | "either";
  idea: string;
  sample: string;
  why: string;
  confidence: number;
}

export interface ClockAutopsy {
  hasData: boolean;
  avgSecondsSpentOpening: number;
  avgSecondsSpentMiddle: number;
  avgSecondsSpentEnd: number;
  panicFlagRate: number; // games with sub-10s moves late
  timeScrambleScore: number; // 0-100 how much they suffer
  notes: string[];
}

export interface PieceDNA {
  captureShare: Record<string, number>; // piece type share of captures made
  movedShare: Record<string, number>;
  hungTendency: Record<string, number>; // rough: piece type lost in big swings
  favoritePiece: string;
  neglectedPiece: string;
}

export interface MomentumPoint {
  n: number; // game index from newest (0)
  rollingScore: number; // last 10 games score %
  result: "W" | "L" | "D";
}

export interface WeekdayPulse {
  day: string;
  games: number;
  score: number;
}

export interface CastlingPsychology {
  short: number;
  long: number;
  opposite: number;
  delayedCastleAvgPly: number;
  neverCastledRate: number;
}

export interface ConversionMap {
  whenAheadWins: number;
  whenAheadDraws: number;
  whenAheadLosses: number;
  whenBehindWins: number;
  whenBehindDraws: number;
  whenBehindLosses: number;
  whenEqualDecisive: number;
  collapseRate: number; // lost from ahead
  stealRate: number; // won from behind
}

export interface OpeningTrap {
  line: string;
  as: "white" | "black";
  losses: number;
  games: number;
  lossRate: number;
  typicalPly: number;
}

export interface RematchCurse {
  samplePairs: number;
  secondGameScore: number;
  tiltConfirmed: boolean;
  note: string;
}

export interface StyleRadar {
  labels: string[];
  values: number[];
}

export interface OracleBreakdown {
  label: string;
  weight: number;
  score: number;
  note: string;
}

export interface UltraDeepResult extends DeepScoutResult {
  /** 0-100 "how prepared you can be" — more sophisticated than Prep Score alone */
  oracleScore: number;
  oracleBreakdown: OracleBreakdown[];
  /** Uniqueness of their fingerprint vs generic players */
  fingerprintEntropy: number;
  pieceDNA: PieceDNA;
  phaseBlunderHeat: PhaseBlunderHeat;
  biggestSwings: MaterialSwing[];
  nemesis: NemesisEntry[];
  softOpponents: NemesisEntry[];
  ratingBands: RatingBandPerf[];
  ecoClusters: EcoCluster[];
  prepPack: PrepLine[];
  clock: ClockAutopsy;
  momentum: MomentumPoint[];
  weekday: WeekdayPulse[];
  castling: CastlingPsychology;
  conversion: ConversionMap;
  traps: OpeningTrap[];
  rematch: RematchCurse;
  styleRadar: StyleRadar;
  /** Novelty features Stalker-class tools typically lack */
  signatures: {
    earlyQueenOutings: number;
    dualQueenTradeRate: number;
    sacrificeWins: number;
    underpromotions: number;
    enPassantRate: number;
    kingWalks: number;
    pawnStormScore: number;
    checkDensity: number;
    captureDensity: number;
    quietMoveBias: number;
    oppositeCastlingRate: number;
    queenTradeAvoidance: number;
  };
  killShots: {
    matesDelivered: number;
    shortMates: number; // mate before ply 40
    resignPressure: number; // wins without long grind proxy
  };
  /** Concrete one-screen "how to beat them today" */
  battlePlan: {
    headline: string;
    colorAdvice: string;
    timeAdvice: string;
    openingAdvice: string;
    middlegameAdvice: string;
    endgameAdvice: string;
    psychologicalAdvice: string;
    doList: string[];
    dontList: string[];
  };
  confidence: {
    sampleQuality: number;
    dataFreshness: string;
    reliability: "low" | "medium" | "high" | "elite";
    caveats: string[];
  };
  /** Hidden patterns narrative cards */
  insights: { icon: string; title: string; body: string; edge: "huge" | "solid" | "small" }[];
}

const PIECE_TYPES = ["p", "n", "b", "r", "q", "k"] as const;
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

function resultFor(color: "w" | "b", res: string) {
  const won = (res === "1-0" && color === "w") || (res === "0-1" && color === "b");
  const lost = (res === "0-1" && color === "w") || (res === "1-0" && color === "b");
  const draw = res === "1/2-1/2";
  return { won, lost, draw };
}

function phaseOfPly(ply: number): "opening" | "middlegame" | "endgame" {
  if (ply < 20) return "opening";
  if (ply < 50) return "middlegame";
  return "endgame";
}

function material(chess: Chess) {
  const v: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  let w = 0,
    b = 0;
  for (const row of chess.board()) {
    for (const p of row) {
      if (!p) continue;
      if (p.color === "w") w += v[p.type];
      else b += v[p.type];
    }
  }
  return { w, b };
}

function parseClocks(pgn: string): number[] | null {
  // Chess.com often embeds {[%clk 0:03:12.1]}
  const re = /\[%clk\s+(\d+):(\d+):(\d+(?:\.\d+)?)\]/gi;
  const secs: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(pgn))) {
    const h = Number(m[1]);
    const min = Number(m[2]);
    const s = Number(m[3]);
    secs.push(h * 3600 + min * 60 + s);
  }
  return secs.length >= 4 ? secs : null;
}

function ecoFromPgn(pgn: string): string {
  return pgn.match(/\[ECO "([^"]+)"\]/i)?.[1] ?? "?";
}

function dayFromPgn(pgn: string, endTime?: number): number | null {
  if (endTime) return new Date(endTime * 1000).getUTCDay();
  const d = pgn.match(/\[UTCDate "(\d{4})\.(\d{2})\.(\d{2})"\]/i);
  if (d) return new Date(Date.UTC(+d[1], +d[2] - 1, +d[3])).getUTCDay();
  const d2 = pgn.match(/\[Date "(\d{4})\.(\d{2})\.(\d{2})"\]/i);
  if (d2) return new Date(Date.UTC(+d2[1], +d2[2] - 1, +d2[3])).getUTCDay();
  return null;
}

export function ultraDeepAnalyze(username: string, games: ImportedGame[]): UltraDeepResult {
  const base = deepAnalyzeGames(username, games);
  const uname = username.toLowerCase();

  // Accumulators
  const captureByPiece: Record<string, number> = Object.fromEntries(PIECE_TYPES.map((p) => [p, 0]));
  const movedByPiece: Record<string, number> = Object.fromEntries(PIECE_TYPES.map((p) => [p, 0]));
  const hungByPiece: Record<string, number> = Object.fromEntries(PIECE_TYPES.map((p) => [p, 0]));
  const swings: MaterialSwing[] = [];
  const phaseLoss = {
    opening: { swings: 0 },
    middlegame: { swings: 0 },
    endgame: { swings: 0 },
  };

  const vsOpp = new Map<string, { games: number; pointsForThem: number; losses: number }>();
  const bandMap = new Map<string, { games: number; points: number }>();
  const ecoMap = new Map<string, { games: number; points: number; name: string; as: "white" | "black" }>();
  const weekday = Array.from({ length: 7 }, () => ({ games: 0, points: 0 }));

  let earlyQueen = 0,
    gamesTracked = 0;
  let queenTrades = 0,
    queenTradeGames = 0;
  let sacWins = 0,
    underpromo = 0,
    enPassant = 0,
    kingWalks = 0;
  let pawnStormScoreAcc = 0,
    checks = 0,
    captures = 0,
    quiet = 0,
    playerMoves = 0;
  let oppositeCastle = 0,
    castleGames = 0;
  let shortC = 0,
    longC = 0,
    neverCastle = 0,
    castlePlySum = 0,
    castleCount = 0;
  let mates = 0,
    shortMates = 0;

  let aheadW = 0,
    aheadD = 0,
    aheadL = 0,
    behindW = 0,
    behindD = 0,
    behindL = 0,
    equalDec = 0;

  const clockSpend = { o: [] as number[], m: [] as number[], e: [] as number[] };
  let panicGames = 0,
    clockGames = 0;

  const trapMap = new Map<string, { losses: number; games: number; plySum: number; as: "white" | "black" }>();
  const rematchPairs: { first: "W" | "L" | "D"; second: "W" | "L" | "D" }[] = [];
  const resultsChrono: ("W" | "L" | "D")[] = []; // newest first (import order)

  // Games are newest-first typically
  const sorted = [...games];

  for (let gi = 0; gi < sorted.length; gi++) {
    const g = sorted[gi];
    const color: "w" | "b" | null =
      g.playerColor ??
      (g.white.toLowerCase() === uname ? "w" : g.black.toLowerCase() === uname ? "b" : null);
    if (!color) continue;

    const { won, lost, draw } = resultFor(color, g.result);
    if (!won && !lost && !draw) continue;

    gamesTracked++;
    resultsChrono.push(won ? "W" : lost ? "L" : "D");

    const oppName = color === "w" ? g.black : g.white;
    const oppKey = oppName.toLowerCase();
    const vo = vsOpp.get(oppKey) ?? { games: 0, pointsForThem: 0, losses: 0 };
    vo.games++;
    // their score vs us
    vo.pointsForThem += lost ? 1 : draw ? 0.5 : 0;
    if (lost) vo.losses++;
    vsOpp.set(oppKey, vo);

    // Rematch detection: same opponent consecutive in list (approx)
    if (gi + 1 < sorted.length) {
      const g2 = sorted[gi + 1];
      const c2 =
        g2.playerColor ??
        (g2.white.toLowerCase() === uname ? "w" : g2.black.toLowerCase() === uname ? "b" : null);
      if (c2) {
        const opp2 = (c2 === "w" ? g2.black : g2.white).toLowerCase();
        if (opp2 === oppKey) {
          const r1 = won ? "W" : lost ? "L" : "D";
          const r2p = resultFor(c2, g2.result);
          const r2 = r2p.won ? "W" : r2p.lost ? "L" : "D";
          rematchPairs.push({ first: r2, second: r1 }); // older first then newer
        }
      }
    }

    const myRating = color === "w" ? g.whiteRating : g.blackRating;
    const oppRating = color === "w" ? g.blackRating : g.whiteRating;
    if (myRating && oppRating) {
      const diff = oppRating - myRating;
      const band =
        diff >= 150
          ? "vs much stronger (+150)"
          : diff >= 50
            ? "vs stronger (+50–149)"
            : diff > -50
              ? "vs peers (±49)"
              : diff > -150
                ? "vs weaker (−50–−149)"
                : "vs much weaker (−150+)";
      const b = bandMap.get(band) ?? { games: 0, points: 0 };
      b.games++;
      b.points += won ? 1 : draw ? 0.5 : 0;
      bandMap.set(band, b);
    }

    const eco = ecoFromPgn(g.pgn);
    const as = color === "w" ? "white" : "black";
    const ecoKey = `${as}:${eco}`;
    const em = ecoMap.get(ecoKey) ?? {
      games: 0,
      points: 0,
      name: g.opening || eco,
      as,
    };
    em.games++;
    em.points += won ? 1 : draw ? 0.5 : 0;
    if (g.opening) em.name = g.opening;
    ecoMap.set(ecoKey, em);

    const dow = dayFromPgn(g.pgn, g.endTime);
    if (dow != null) {
      weekday[dow].games++;
      weekday[dow].points += won ? 1 : draw ? 0.5 : 0;
    }

    // Replay for deep DNA
    const chess = new Chess();
    let prevEval = 0;
    let wasAhead = false;
    let wasBehind = false;
    let maxBehind = 0;
    let queenOutEarly = false;
    let myCastle: "short" | "long" | null = null;
    let oppCastle: "short" | "long" | null = null;
    let castlePly = 0;
    let tradedQueens = false;
    let phaseSwingHit = { opening: false, middlegame: false, endgame: false };

    const clocks = parseClocks(g.pgn);
    if (clocks) {
      clockGames++;
      // Clock after each half-move; estimate spend as drop in remaining
      for (let i = 1; i < Math.min(clocks.length, g.sans.length); i++) {
        const spent = Math.max(0, clocks[i - 1] - clocks[i]);
        const isPlayer = color === "w" ? i % 2 === 1 : i % 2 === 0;
        // clocks array alignment is messy; use ply-based bucket instead
        void isPlayer;
        const ply = i;
        if (ply < 20) clockSpend.o.push(spent);
        else if (ply < 50) clockSpend.m.push(spent);
        else clockSpend.e.push(spent);
      }
      // panic: last 8 clock values under 15s for anyone
      const tail = clocks.slice(-8);
      if (tail.some((t) => t < 15)) panicGames++;
    }

    for (let i = 0; i < g.sans.length; i++) {
      const san = g.sans[i];
      const isPlayer = color === "w" ? i % 2 === 0 : i % 2 === 1;
      let move;
      try {
        move = chess.move(san);
      } catch {
        break;
      }
      if (!move) break;

      const mat = material(chess);
      const evalP = color === "w" ? mat.w - mat.b : mat.b - mat.w;
      if (evalP >= 2) wasAhead = true;
      if (evalP <= -2) {
        wasBehind = true;
        maxBehind = Math.min(maxBehind, evalP);
      }

      if (isPlayer) {
        playerMoves++;
        movedByPiece[move.piece] = (movedByPiece[move.piece] ?? 0) + 1;
        if (move.captured) {
          captures++;
          captureByPiece[move.piece] = (captureByPiece[move.piece] ?? 0) + 1;
        } else if (!san.includes("+") && !san.includes("#") && !san.startsWith("O")) {
          quiet++;
        }
        if (san.includes("+") || san.includes("#")) checks++;
        if (san.includes("#")) {
          mates++;
          if (i < 40) shortMates++;
        }
        if (san.includes("e.p.") || move.flags.includes("e")) enPassant++;
        if (/=[NBR]/i.test(san)) underpromo++;

        // early queen
        if (move.piece === "q" && i < 10 && !queenOutEarly) {
          queenOutEarly = true;
          earlyQueen++;
        }

        // castling
        if (move.flags.includes("k") || san === "O-O") {
          myCastle = "short";
          shortC++;
          castlePly = i + 1;
          castleCount++;
          castlePlySum += castlePly;
        }
        if (move.flags.includes("q") || san === "O-O-O") {
          myCastle = "long";
          longC++;
          castlePly = i + 1;
          castleCount++;
          castlePlySum += castlePly;
        }

        // king walks (non-castle king move midgame)
        if (move.piece === "k" && !move.flags.includes("k") && !move.flags.includes("q") && i > 12 && i < 50) {
          kingWalks++;
        }

        // pawn storm proxy: pawn advances on flanks
        if (move.piece === "p") {
          const file = move.to.charCodeAt(0) - 97;
          if (file <= 2 || file >= 5) pawnStormScoreAcc += 1;
        }

        // material swings against player after their move (they blundered)
        const delta = evalP - prevEval;
        if (delta <= -2) {
          const ph = phaseOfPly(i);
          swings.push({ ply: i + 1, delta, san, phase: ph });
          if (!phaseSwingHit[ph]) {
            phaseSwingHit[ph] = true;
            phaseLoss[ph].swings++;
          }
          if (move.captured) {
            // rough: they left piece en prise previous — attribute hung piece as what opponent took
            hungByPiece[move.captured] = (hungByPiece[move.captured] ?? 0) + 1;
          } else {
            hungByPiece[move.piece] = (hungByPiece[move.piece] ?? 0) + 1;
          }
        }
        // sacrifice wins: played while behind by 2+ and still won
        if (evalP <= -2 && won) {
          /* counted at end */
        }
        prevEval = evalP;
      } else {
        if (move.flags.includes("k") || san === "O-O") oppCastle = "short";
        if (move.flags.includes("q") || san === "O-O-O") oppCastle = "long";
        // queen trade: both queens off
        if (!tradedQueens) {
          const qs = chess.board().flat().filter((p) => p && p.type === "q");
          if (qs.length === 0) {
            tradedQueens = true;
            queenTrades++;
          }
        }
      }
    }

    queenTradeGames++;
    if (!myCastle) neverCastle++;
    castleGames++;
    if (myCastle && oppCastle && myCastle !== oppCastle) oppositeCastle++;

    if (wasAhead) {
      if (won) aheadW++;
      else if (draw) aheadD++;
      else aheadL++;
    }
    if (wasBehind) {
      if (won) {
        behindW++;
        if (maxBehind <= -3) sacWins++;
      } else if (draw) behindD++;
      else behindL++;
    }
    if (!wasAhead && !wasBehind && (won || lost)) equalDec++;

    // Opening traps: losses before ply 24
    if (lost && g.sans.length > 0 && g.sans.length < 24) {
      const line = g.sans.slice(0, 8).join(" ");
      const key = `${as}:${line}`;
      const t = trapMap.get(key) ?? { losses: 0, games: 0, plySum: 0, as };
      t.losses++;
      t.games++;
      t.plySum += g.sans.length;
      trapMap.set(key, t);
    } else if (g.sans.length < 24) {
      const line = g.sans.slice(0, 8).join(" ");
      const key = `${as}:${line}`;
      const t = trapMap.get(key) ?? { losses: 0, games: 0, plySum: 0, as };
      t.games++;
      t.plySum += g.sans.length;
      trapMap.set(key, t);
    }

    }

  const sumRec = (r: Record<string, number>) => Object.values(r).reduce((a, b) => a + b, 0) || 1;
  const toShare = (r: Record<string, number>) => {
    const s = sumRec(r);
    const out: Record<string, number> = {};
    for (const k of PIECE_TYPES) out[k] = clamp((r[k] / s) * 100);
    return out;
  };

  const captureShare = toShare(captureByPiece);
  const movedShare = toShare(movedByPiece);
  const hungTendency = toShare(hungByPiece);
  const fav = Object.entries(movedShare).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "n";
  const neg = Object.entries(movedShare).filter(([k]) => k !== "k").sort((a, b) => a[1] - b[1])[0]?.[0] ?? "b";

  const pieceDNA: PieceDNA = {
    captureShare,
    movedShare,
    hungTendency,
    favoritePiece: pieceName(fav),
    neglectedPiece: pieceName(neg),
  };

  const phaseBlunderHeat: PhaseBlunderHeat = {
    opening: clamp((phaseLoss.opening.swings / Math.max(1, gamesTracked)) * 120),
    middlegame: clamp((phaseLoss.middlegame.swings / Math.max(1, gamesTracked)) * 120),
    endgame: clamp((phaseLoss.endgame.swings / Math.max(1, gamesTracked)) * 120),
  };

  const biggestSwings = [...swings].sort((a, b) => a.delta - b.delta).slice(0, 12);

  const nemesis: NemesisEntry[] = [...vsOpp.entries()]
    .filter(([, v]) => v.games >= 2)
    .map(([opponent, v]) => ({
      opponent,
      games: v.games,
      theirScore: clamp((v.pointsForThem / v.games) * 100),
      losses: v.losses,
    }))
    .sort((a, b) => b.theirScore - a.theirScore || b.games - a.games)
    .slice(0, 8);

  const softOpponents: NemesisEntry[] = [...vsOpp.entries()]
    .filter(([, v]) => v.games >= 2)
    .map(([opponent, v]) => ({
      opponent,
      games: v.games,
      theirScore: clamp((v.pointsForThem / v.games) * 100),
      losses: v.losses,
    }))
    .sort((a, b) => a.theirScore - b.theirScore || b.games - a.games)
    .slice(0, 6);

  const ratingBands: RatingBandPerf[] = [...bandMap.entries()]
    .map(([band, v]) => ({
      band,
      games: v.games,
      score: clamp((v.points / Math.max(1, v.games)) * 100),
      label: band,
    }))
    .sort((a, b) => b.games - a.games);

  const ecoClusters: EcoCluster[] = [...ecoMap.entries()]
    .map(([key, v]) => ({
      eco: key.split(":")[1] || "?",
      name: v.name,
      games: v.games,
      score: clamp((v.points / Math.max(1, v.games)) * 100),
      as: v.as,
    }))
    .sort((a, b) => b.games - a.games)
    .slice(0, 16);

  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
  const clock: ClockAutopsy = {
    hasData: clockGames > 0,
    avgSecondsSpentOpening: Math.round(avg(clockSpend.o) * 10) / 10,
    avgSecondsSpentMiddle: Math.round(avg(clockSpend.m) * 10) / 10,
    avgSecondsSpentEnd: Math.round(avg(clockSpend.e) * 10) / 10,
    panicFlagRate: clamp((panicGames / Math.max(1, clockGames)) * 100),
    timeScrambleScore: clamp(
      (panicGames / Math.max(1, clockGames)) * 70 + (avg(clockSpend.e) < 2 ? 25 : 10),
    ),
    notes: clockGames
      ? [
          `Clock tags found in ${clockGames} games.`,
          panicGames > clockGames * 0.3
            ? "Frequent sub-15s scramble states — keep complexity late."
            : "Relatively stable late clocks — don't rely on flagging alone.",
        ]
      : ["No %clk tags in sample — time autopsy limited. Still using decision-speed proxies from game length."],
  };

  // Momentum newest first
  const momentum: MomentumPoint[] = [];
  for (let i = 0; i < Math.min(resultsChrono.length, 40); i++) {
    const window = resultsChrono.slice(i, i + 10);
    const pts = window.reduce((s, r) => s + (r === "W" ? 1 : r === "D" ? 0.5 : 0), 0);
    momentum.push({
      n: i,
      rollingScore: clamp((pts / Math.max(1, window.length)) * 100),
      result: resultsChrono[i],
    });
  }

  const weekdayPulse: WeekdayPulse[] = DAYS.map((day, i) => ({
    day,
    games: weekday[i].games,
    score: weekday[i].games ? clamp((weekday[i].points / weekday[i].games) * 100) : 0,
  }));

  const castling: CastlingPsychology = {
    short: shortC,
    long: longC,
    opposite: oppositeCastle,
    delayedCastleAvgPly: castleCount ? Math.round((castlePlySum / castleCount) * 10) / 10 : 0,
    neverCastledRate: clamp((neverCastle / Math.max(1, gamesTracked)) * 100),
  };

  const collapseN = aheadL;
  const aheadTotal = aheadW + aheadD + aheadL || 1;
  const behindTotal = behindW + behindD + behindL || 1;
  const conversion: ConversionMap = {
    whenAheadWins: aheadW,
    whenAheadDraws: aheadD,
    whenAheadLosses: aheadL,
    whenBehindWins: behindW,
    whenBehindDraws: behindD,
    whenBehindLosses: behindL,
    whenEqualDecisive: equalDec,
    collapseRate: clamp((collapseN / aheadTotal) * 100),
    stealRate: clamp((behindW / behindTotal) * 100),
  };

  const traps: OpeningTrap[] = [...trapMap.entries()]
    .map(([key, v]) => ({
      line: key.split(":").slice(1).join(":") || key,
      as: v.as,
      losses: v.losses,
      games: v.games,
      lossRate: clamp((v.losses / Math.max(1, v.games)) * 100),
      typicalPly: v.games ? Math.round(v.plySum / v.games) : 0,
    }))
    .filter((t) => t.losses >= 1 && t.games >= 1)
    .sort((a, b) => b.lossRate - a.lossRate || b.losses - a.losses)
    .slice(0, 10);

  const rematchSecondScores: number[] = rematchPairs.map((p) =>
    p.second === "W" ? 1 : p.second === "D" ? 0.5 : 0,
  );
  const rematchAvg =
    rematchSecondScores.length > 0
      ? rematchSecondScores.reduce((a, b) => a + b, 0) / rematchSecondScores.length
      : 0.5;
  const rematch: RematchCurse = {
    samplePairs: rematchPairs.length,
    secondGameScore: rematchPairs.length ? clamp(rematchAvg * 100) : 50,
    tiltConfirmed:
      rematchPairs.filter((p) => p.first === "L" && p.second === "L").length >=
      Math.max(2, rematchPairs.length * 0.35),
    note: rematchPairs.length
      ? `Found ${rematchPairs.length} same-opponent streaks. Second-game score ${clamp(rematchAvg * 100)}%.`
      : "Not enough rematch pairs in sample.",
  };

  const signatures = {
    earlyQueenOutings: earlyQueen,
    dualQueenTradeRate: clamp((queenTrades / Math.max(1, queenTradeGames)) * 100),
    sacrificeWins: sacWins,
    underpromotions: underpromo,
    enPassantRate: clamp((enPassant / Math.max(1, gamesTracked)) * 100),
    kingWalks,
    pawnStormScore: clamp((pawnStormScoreAcc / Math.max(1, playerMoves)) * 400),
    checkDensity: clamp((checks / Math.max(1, playerMoves)) * 100),
    captureDensity: clamp((captures / Math.max(1, playerMoves)) * 100),
    quietMoveBias: clamp((quiet / Math.max(1, playerMoves)) * 100),
    oppositeCastlingRate: clamp((oppositeCastle / Math.max(1, castleGames)) * 100),
    queenTradeAvoidance: clamp(100 - (queenTrades / Math.max(1, queenTradeGames)) * 100),
  };

  const styleRadar: StyleRadar = {
    labels: [
      "Aggression",
      "Tactics",
      "Endgame",
      "Book",
      "Clock",
      "Grit",
      "Chaos",
      "Conversion",
    ],
    values: [
      base.style.aggression,
      base.style.tactics,
      base.style.endgame,
      base.style.bookLoyalty,
      100 - (clock.timeScrambleScore || 40),
      base.psyche.gritWhenLosing,
      clamp((signatures.captureDensity + signatures.checkDensity) / 2),
      100 - conversion.collapseRate,
    ],
  };

  // Prep pack — actionable
  const worstEco = [...ecoClusters].filter((e) => e.games >= 3).sort((a, b) => a.score - b.score)[0];
  const bestTrap = traps[0];
  const colorWeak = base.byColor.slice().sort((a, b) => a.winRate - b.winRate)[0];
  const prepPack: PrepLine[] = [
    {
      priority: 1,
      title: worstEco
        ? `Punish soft ECO ${worstEco.eco}`
        : "Force them out of book by move 6",
      color: worstEco?.as ?? "either",
      idea: worstEco
        ? `They score only ${worstEco.score}% in ${worstEco.name} (${worstEco.games}g).`
        : "High opening diversity — early deviation hurts less-prepared lines.",
      sample: worstEco?.name || base.openings[0]?.name || "1.e4",
      why: "Highest EV opening exploit in sample.",
      confidence: worstEco && worstEco.games >= 5 ? 88 : 62,
    },
    {
      priority: 2,
      title: bestTrap ? "Mine their miniature zone" : "Avoid their pet trap lines",
      color: bestTrap?.as ?? "either",
      idea: bestTrap
        ? `Loss rate ${bestTrap.lossRate}% in short games after: ${bestTrap.line}`
        : "Few early losses — expect solid first 15 moves.",
      sample: bestTrap?.line || "",
      why: "Early tactical burials are free rating.",
      confidence: bestTrap ? 80 : 50,
    },
    {
      priority: 3,
      title:
        conversion.collapseRate >= 35
          ? "Trade into technical endgames when better"
          : "Don't simplify if they're endgame-strong",
      color: "either",
      idea:
        conversion.collapseRate >= 35
          ? `They collapse from better positions ${conversion.collapseRate}% of the time.`
          : `Collapse rate only ${conversion.collapseRate}% — convert carefully.`,
      sample: "",
      why: "Conversion map is a Stalker-plus edge.",
      confidence: 84,
    },
    {
      priority: 4,
      title:
        phaseBlunderHeat.middlegame >= phaseBlunderHeat.opening
          ? "Complex middlegames over dry positions"
          : "Keep pressure in the opening",
      color: "either",
      idea: `Blunder heat O/M/E: ${phaseBlunderHeat.opening}/${phaseBlunderHeat.middlegame}/${phaseBlunderHeat.endgame}`,
      sample: "",
      why: "Phase forensic heatmaps show when their hands shake.",
      confidence: 78,
    },
    {
      priority: 5,
      title: rematch.tiltConfirmed ? "Win game 1 → force rematch" : "Treat rematches as fresh",
      color: "either",
      idea: rematch.note,
      sample: "",
      why: "Rematch curse model is rare outside pro prep rooms.",
      confidence: rematch.samplePairs >= 3 ? 75 : 45,
    },
  ];

  // Oracle score
  const oracleBreakdown: OracleBreakdown[] = [
    {
      label: "Opening holes",
      weight: 22,
      score: worstEco ? clamp(100 - worstEco.score + Math.min(20, worstEco.games)) : 40,
      note: worstEco ? `${worstEco.eco} @ ${worstEco.score}%` : "Flat repertoire",
    },
    {
      label: "Tilt / rematch",
      weight: 15,
      score: clamp(base.psyche.tiltAfterLoss * 0.6 + (rematch.tiltConfirmed ? 30 : 0)),
      note: rematch.tiltConfirmed ? "Rematch tilt confirmed" : "Moderate mental variance",
    },
    {
      label: "Conversion leaks",
      weight: 18,
      score: conversion.collapseRate,
      note: `Collapse ${conversion.collapseRate}% from better`,
    },
    {
      label: "Phase blunders",
      weight: 15,
      score: Math.max(phaseBlunderHeat.opening, phaseBlunderHeat.middlegame, phaseBlunderHeat.endgame),
      note: "Peak phase risk",
    },
    {
      label: "Clock fragility",
      weight: 12,
      score: clock.hasData ? clock.timeScrambleScore : clamp(100 - base.style.time),
      note: clock.hasData ? "From %clk tags" : "Proxy from length/style",
    },
    {
      label: "Color imbalance",
      weight: 10,
      score: colorWeak
        ? clamp(Math.abs((base.byColor[0]?.winRate ?? 50) - (base.byColor[1]?.winRate ?? 50)) * 2)
        : 30,
      note: colorWeak ? `Weaker as ${colorWeak.as}` : "Balanced colors",
    },
    {
      label: "Sample power",
      weight: 8,
      score: clamp(gamesTracked * 1.2),
      note: `${gamesTracked} attributed games`,
    },
  ];
  const oracleScore = clamp(
    oracleBreakdown.reduce((s, b) => s + (b.score * b.weight) / 100, 0) * (100 / 15),
  );

  // Fingerprint entropy — diversity of openings + first moves
  const fingerprintEntropy = clamp(
    Math.min(100, (base.openings.length * 6 + (base.patterns.firstMoves?.length || 0) * 8) * (1 + (ecoClusters.length > 10 ? 0.3 : 0))),
  );

  const white = base.byColor.find((c) => c.as === "white");
  const black = base.byColor.find((c) => c.as === "black");
  const preferColor =
    white && black
      ? white.winRate <= black.winRate
        ? "Take White if possible — their Black is relatively softer."
        : "Their White is softer — Black is fine if you like your defense."
      : "Color edge unclear — pick your comfort.";

  const tcWeak = [...base.byTimeClass].sort((a, b) => a.score - b.score)[0];

  const battlePlan = {
    headline:
      oracleScore >= 70
        ? "High-prep target — you can walk in with a plan."
        : oracleScore >= 45
          ? "Solid opponent — edges exist if you follow the pack."
          : "Resilient profile — outplay them practically, don't force.",
    colorAdvice: preferColor,
    timeAdvice: tcWeak
      ? `Steer toward ${tcWeak.timeClass} if possible (their score ${tcWeak.score}%).`
      : "Match a time control where you calculate cleaner.",
    openingAdvice: prepPack[0].idea,
    middlegameAdvice:
      phaseBlunderHeat.middlegame >= 40
        ? "Keep tension; they leak in messy middlegames."
        : "They handle middlegames decently — prefer structural edges.",
    endgameAdvice:
      conversion.collapseRate >= 35
        ? "Simplify when better; their technique cracks."
        : "Don't count on endgame gifts — convert accurately yourself.",
    psychologicalAdvice: rematch.tiltConfirmed
      ? "If you win, offer rematch immediately."
      : base.psyche.tiltAfterLoss >= 55
        ? "After they lose, their next game softens — keep pressure in sessions."
        : "Mentally stable — stay patient.",
    doList: [
      prepPack[0].title,
      prepPack[2].title,
      `Target piece: exploit soft ${pieceDNA.neglectedPiece} play`,
      phaseBlunderHeat.endgame > 45 ? "Drag them to late technical positions" : "Strike before the endgame",
      softOpponents[0] ? `Study how ${softOpponents[0].opponent} beats them` : "Use Twin Bot daily",
    ],
    dontList: [
      base.openings[0] ? `Don't walk into their pet ${base.openings[0].name} unprepared` : "Don't play hope chess",
      signatures.earlyQueenOutings > gamesTracked * 0.25
        ? "Don't ignore early queen checks — they hunt them"
        : "Don't panic against slow pressure",
      clock.timeScrambleScore < 30 ? "Don't play only for their clock" : "Don't enter clean equal ends if low on time",
      "Don't assume one loss means tilt without rematch data",
    ],
  };

  const insights: UltraDeepResult["insights"] = [
    {
      icon: "🧬",
      title: "Piece DNA",
      body: `Moves with ${pieceDNA.favoritePiece} heavily; neglects ${pieceDNA.neglectedPiece}. Capture share Q/R/N skew reveals attack geometry.`,
      edge: "solid",
    },
    {
      icon: "💥",
      title: "Collapse physics",
      body: `When ahead: ${aheadW}W/${aheadD}D/${aheadL}L. Collapse rate ${conversion.collapseRate}%. Steal rate from worse: ${conversion.stealRate}%.`,
      edge: conversion.collapseRate >= 35 ? "huge" : "solid",
    },
    {
      icon: "⏰",
      title: "Circadian & weekday pulse",
      body: `Best hours ${base.psyche.bestHours}. Weekday peak: ${
        [...weekdayPulse].sort((a, b) => b.score - a.score).find((d) => d.games >= 2)?.day ?? "n/a"
      }.`,
      edge: "small",
    },
    {
      icon: "🎯",
      title: "Nemesis graph",
      body: nemesis[0]
        ? `${nemesis[0].opponent} owns them (${nemesis[0].theirScore}% score over ${nemesis[0].games}g).`
        : "No repeat tormentor in sample — fish for style mismatches instead.",
      edge: nemesis[0] ? "huge" : "small",
    },
    {
      icon: "🏰",
      title: "Castling psychology",
      body: `Short ${castling.short} / long ${castling.long}; opposite-side ${castling.opposite}. Avg castle ply ${castling.delayedCastleAvgPly}. Never-castled rate ${castling.neverCastledRate}%.`,
      edge: "solid",
    },
    {
      icon: "🔮",
      title: "Oracle",
      body: `Oracle Score ${oracleScore}/100 (Prep ${base.prepScore}, Stalker ${base.stalkerScore}). Fingerprint entropy ${fingerprintEntropy}.`,
      edge: oracleScore >= 65 ? "huge" : "solid",
    },
  ];

  const reliability: UltraDeepResult["confidence"]["reliability"] =
    gamesTracked >= 80 ? "elite" : gamesTracked >= 40 ? "high" : gamesTracked >= 15 ? "medium" : "low";

  return {
    ...base,
    prepScore: clamp(base.prepScore * 0.55 + oracleScore * 0.45),
    stalkerScore: clamp(base.stalkerScore * 0.5 + oracleScore * 0.35 + fingerprintEntropy * 0.15),
    oracleScore,
    oracleBreakdown,
    fingerprintEntropy,
    pieceDNA,
    phaseBlunderHeat,
    biggestSwings,
    nemesis,
    softOpponents,
    ratingBands,
    ecoClusters,
    prepPack,
    clock,
    momentum,
    weekday: weekdayPulse,
    castling,
    conversion,
    traps,
    rematch,
    styleRadar,
    signatures,
    killShots: {
      matesDelivered: mates,
      shortMates,
      resignPressure: clamp(base.winRate * 0.7 + signatures.checkDensity * 0.3),
    },
    battlePlan,
    confidence: {
      sampleQuality: clamp(gamesTracked * 1.1),
      dataFreshness: games[0]?.endTime
        ? `Newest game ~ ${new Date(games[0].endTime * 1000).toISOString().slice(0, 10)}`
        : "Timestamps partial",
      reliability,
      caveats: [
        gamesTracked < 20 ? "Small sample — treat edges as hypotheses." : "Sample size healthy.",
        !clock.hasData ? "No clock tags — time model is partial." : "Clock autopsy enabled.",
        "Public games only — OTB / private games not included.",
      ],
    },
    insights,
    summary: `${base.summary} Oracle ${oracleScore}/100 · Entropy ${fingerprintEntropy} · Collapse ${conversion.collapseRate}% · ${battlePlan.headline}`,
    twinRepertoire: base.twinRepertoire.length
      ? base.twinRepertoire
      : ecoClusters.slice(0, 4).map((e) => e.name),
  };
}

function pieceName(t: string) {
  switch (t) {
    case "p":
      return "pawns";
    case "n":
      return "knights";
    case "b":
      return "bishops";
    case "r":
      return "rooks";
    case "q":
      return "queen";
    case "k":
      return "king";
    default:
      return t;
  }
}
