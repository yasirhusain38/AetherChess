import { Chess } from "chess.js";
import type { ImportedGame } from "./importGames";

export interface PhaseStats {
  games: number;
  wins: number;
  draws: number;
  losses: number;
  avgPlies: number;
}

export interface TimeClassStats {
  timeClass: string;
  games: number;
  winRate: number;
  score: number;
}

export interface ColorStats {
  as: "white" | "black";
  games: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
}

export interface OpeningDetail {
  name: string;
  as: "white" | "black";
  games: number;
  wins: number;
  draws: number;
  losses: number;
  score: number;
  sampleLine: string;
}

export interface DeepScoutResult {
  sampleSize: number;
  attributed: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  scoreRate: number;
  openings: OpeningDetail[];
  twinRepertoire: string[];
  byColor: ColorStats[];
  byTimeClass: TimeClassStats[];
  phases: {
    ultraShort: PhaseStats; // <20 plies
    short: PhaseStats; // 20-40
    medium: PhaseStats; // 40-70
    long: PhaseStats; // 70+
  };
  style: {
    aggression: number;
    tactics: number;
    endgame: number;
    time: number;
    bookLoyalty: number;
    consistency: number;
  };
  psyche: {
    tiltAfterLoss: number;
    timePressureBlunders: number;
    conversionWhenWinning: number;
    gritWhenLosing: number;
    bestHours: string;
    worstHours: string;
    currentStreak: string;
    bounceBackRate: number;
  };
  patterns: {
    firstMoves: { move: string; count: number; pct: number }[];
    castlesShort: number;
    castlesLong: number;
    avgGameLength: number;
    decisiveRate: number;
    comebackWins: number;
    lostFromBetter: number;
  };
  weaknesses: {
    title: string;
    detail: string;
    severity: "low" | "medium" | "high";
    exploit: string;
  }[];
  strengths: string[];
  prepTips: string[];
  prepScore: number;
  stalkerScore: number;
  summary: string;
  hourlyPerformance: { hour: string; games: number; score: number }[];
}

function emptyPhase(): PhaseStats {
  return { games: 0, wins: 0, draws: 0, losses: 0, avgPlies: 0 };
}

function resultFor(color: "w" | "b", res: string) {
  const won = (res === "1-0" && color === "w") || (res === "0-1" && color === "b");
  const lost = (res === "0-1" && color === "w") || (res === "1-0" && color === "b");
  const draw = res === "1/2-1/2";
  return { won, lost, draw };
}

function openingFromPgn(pgn: string, sans: string[]): string {
  const m =
    pgn.match(/\[Opening "([^"]+)"\]/i) ||
    pgn.match(/\[ECO "([^"]+)"\]/i);
  if (m?.[1] && m[1] !== "?") return m[1];
  if (sans.length >= 4) return sans.slice(0, 4).join(" ");
  if (sans.length) return sans.join(" ");
  return "Unknown";
}

function lineFromSans(sans: string[], n = 6) {
  return sans.slice(0, n).join(" ");
}

function hourFromPgn(pgn: string): number | null {
  // Chess.com often has [UTCDate "YYYY.MM.DD"] [UTCTime "HH:MM:SS"]
  const t = pgn.match(/\[UTCTime "(\d{2}):/i);
  if (t) return Number(t[1]);
  const end = pgn.match(/\[EndDate[^\]]*\]/i);
  void end;
  return null;
}

function addPhase(p: PhaseStats, won: boolean, lost: boolean, draw: boolean, plies: number) {
  p.games++;
  if (won) p.wins++;
  if (lost) p.losses++;
  if (draw) p.draws++;
  p.avgPlies += plies;
}

export function deepAnalyzeGames(username: string, games: ImportedGame[]): DeepScoutResult {
  const uname = username.toLowerCase();
  const openings = new Map<
    string,
    {
      name: string;
      as: "white" | "black";
      games: number;
      wins: number;
      draws: number;
      losses: number;
      sampleLine: string;
    }
  >();

  let wins = 0,
    losses = 0,
    draws = 0,
    attributed = 0;
  let castlesShort = 0,
    castlesLong = 0,
    totalPlies = 0;
  const firstMoves = new Map<string, number>();
  const timeMap = new Map<string, { games: number; points: number }>();
  const colorAcc = {
    white: { games: 0, wins: 0, draws: 0, losses: 0 },
    black: { games: 0, wins: 0, draws: 0, losses: 0 },
  };
  const phases = {
    ultraShort: emptyPhase(),
    short: emptyPhase(),
    medium: emptyPhase(),
    long: emptyPhase(),
  };
  const hourMap = new Map<number, { games: number; points: number }>();
  const sequence: ("W" | "L" | "D")[] = [];
  let bounceBack = 0;
  let bounceOpps = 0;
  let comebackWins = 0;
  let lostFromBetter = 0;
  let capturesByPlayer = 0;
  let checksByPlayer = 0;
  let playerMoves = 0;

  for (const g of games) {
    const color: "w" | "b" | null =
      g.playerColor ??
      (g.white.toLowerCase() === uname ? "w" : g.black.toLowerCase() === uname ? "b" : null);
    if (!color) continue;
    attributed++;

    const { won, lost, draw } = resultFor(color, g.result);
    if (won) wins++;
    else if (lost) losses++;
    else if (draw) draws++;
    else continue;

    sequence.push(won ? "W" : lost ? "L" : "D");
    const plies = g.sans.length || estimatePlies(g.pgn);
    totalPlies += plies;

    const as = color === "w" ? "white" : "black";
    colorAcc[as].games++;
    if (won) colorAcc[as].wins++;
    if (lost) colorAcc[as].losses++;
    if (draw) colorAcc[as].draws++;

    const tc = (g.timeClass || "unknown").toLowerCase();
    const tm = timeMap.get(tc) ?? { games: 0, points: 0 };
    tm.games++;
    tm.points += won ? 1 : draw ? 0.5 : 0;
    timeMap.set(tc, tm);

    if (plies < 20) addPhase(phases.ultraShort, won, lost, draw, plies);
    else if (plies < 40) addPhase(phases.short, won, lost, draw, plies);
    else if (plies < 70) addPhase(phases.medium, won, lost, draw, plies);
    else addPhase(phases.long, won, lost, draw, plies);

    const openName = g.opening && g.opening.length > 2 ? g.opening : openingFromPgn(g.pgn, g.sans);
    const key = `${as}:${openName}`;
    const cur = openings.get(key) ?? {
      name: openName,
      as,
      games: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      sampleLine: lineFromSans(g.sans, 8),
    };
    cur.games++;
    if (won) cur.wins++;
    if (draw) cur.draws++;
    if (lost) cur.losses++;
    if (!cur.sampleLine) cur.sampleLine = lineFromSans(g.sans, 8);
    openings.set(key, cur);

    // first move from player perspective
    if (color === "w" && g.sans[0]) {
      firstMoves.set(g.sans[0], (firstMoves.get(g.sans[0]) ?? 0) + 1);
    } else if (color === "b" && g.sans[1]) {
      firstMoves.set(g.sans[1], (firstMoves.get(g.sans[1]) ?? 0) + 1);
    } else if (g.sans[0]) {
      firstMoves.set(g.sans[0], (firstMoves.get(g.sans[0]) ?? 0) + 1);
    }

    for (let i = 0; i < g.sans.length; i++) {
      const isPlayerMove = color === "w" ? i % 2 === 0 : i % 2 === 1;
      if (!isPlayerMove) continue;
      playerMoves++;
      const san = g.sans[i];
      if (san.includes("x")) capturesByPlayer++;
      if (san.includes("+") || san.includes("#")) checksByPlayer++;
      if (san.startsWith("O-O-O")) castlesLong++;
      else if (san.startsWith("O-O")) castlesShort++;
    }

    const hour = hourFromPgn(g.pgn);
    if (hour != null) {
      const h = hourMap.get(hour) ?? { games: 0, points: 0 };
      h.games++;
      h.points += won ? 1 : draw ? 0.5 : 0;
      hourMap.set(hour, h);
    }

    // rough "comeback" / conversion via simple material snapshots
    try {
      const snap = materialStory(g.sans, color);
      if (snap.wonFromBehind) comebackWins++;
      if (snap.lostFromAhead) lostFromBetter++;
    } catch {
      /* ignore bad pgns */
    }
  }

  // tilt: loss followed by loss
  for (let i = 0; i < sequence.length - 1; i++) {
    if (sequence[i] === "L") {
      bounceOpps++;
      if (sequence[i + 1] === "W") bounceBack++;
    }
  }

  for (const p of Object.values(phases)) {
    if (p.games) p.avgPlies = Math.round(p.avgPlies / p.games);
  }

  const total = wins + losses + draws || 1;
  const winRate = Math.round((wins / total) * 100);
  const scoreRate = Math.round(((wins + draws * 0.5) / total) * 100);
  const avgGameLength = attributed ? Math.round(totalPlies / attributed) : 0;
  const decisiveRate = Math.round(((wins + losses) / total) * 100);

  const openingList: OpeningDetail[] = [...openings.values()]
    .sort((a, b) => b.games - a.games)
    .slice(0, 12)
    .map((o) => ({
      name: o.name.length > 56 ? o.name.slice(0, 53) + "…" : o.name,
      as: o.as,
      games: o.games,
      wins: o.wins,
      draws: o.draws,
      losses: o.losses,
      score: Math.round(((o.wins + o.draws * 0.5) / Math.max(1, o.games)) * 100),
      sampleLine: o.sampleLine,
    }));

  const twinRepertoire = openingList.slice(0, 5).map((o) => o.sampleLine || o.name);

  const firstMoveList = [...firstMoves.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([move, count]) => ({
      move,
      count,
      pct: Math.round((count / Math.max(1, attributed)) * 100),
    }));

  const byTimeClass: TimeClassStats[] = [...timeMap.entries()]
    .map(([timeClass, v]) => ({
      timeClass,
      games: v.games,
      winRate: Math.round((v.points / Math.max(1, v.games)) * 100),
      score: Math.round((v.points / Math.max(1, v.games)) * 100),
    }))
    .sort((a, b) => b.games - a.games);

  const byColor: ColorStats[] = (["white", "black"] as const).map((as) => {
    const c = colorAcc[as];
    const t = c.games || 1;
    return {
      as,
      games: c.games,
      wins: c.wins,
      draws: c.draws,
      losses: c.losses,
      winRate: Math.round((c.wins / t) * 100),
    };
  });

  const hourlyPerformance = [...hourMap.entries()]
    .map(([h, v]) => ({
      hour: `${String(h).padStart(2, "0")}:00 UTC`,
      games: v.games,
      score: Math.round((v.points / Math.max(1, v.games)) * 100),
    }))
    .sort((a, b) => b.games - a.games);

  const bestHour = hourlyPerformance[0];
  const worstHour = [...hourlyPerformance].sort((a, b) => a.score - b.score)[0];

  const captureRate = playerMoves ? capturesByPlayer / playerMoves : 0;
  const checkRate = playerMoves ? checksByPlayer / playerMoves : 0;
  const shortShare = attributed ? phases.ultraShort.games / attributed : 0;
  const longShare = attributed ? phases.long.games / attributed : 0;
  const openDiversity = openings.size;

  const style = {
    aggression: clamp(Math.round(30 + captureRate * 120 + checkRate * 80 + shortShare * 40)),
    tactics: clamp(Math.round(35 + checkRate * 150 + captureRate * 60)),
    endgame: clamp(Math.round(25 + longShare * 90 + (phases.long.wins / Math.max(1, phases.long.games)) * 40)),
    time: clamp(Math.round(55 - shortShare * 35 + (byTimeClass.find((t) => t.timeClass.includes("bullet")) ? -10 : 10))),
    bookLoyalty: clamp(Math.round(90 - Math.min(50, openDiversity * 2.5))),
    consistency: clamp(Math.round(100 - Math.abs(50 - winRate) * 0.8 - (decisiveRate > 85 ? 10 : 0))),
  };

  const tiltAfterLoss = clamp(
    Math.round(100 - (bounceOpps ? (bounceBack / bounceOpps) * 100 : 55)),
  );
  const bounceBackRate = bounceOpps ? Math.round((bounceBack / bounceOpps) * 100) : 50;

  // streak from most recent games (sequence is chronological if games sorted newest first — reverse for streak from recent)
  const recent = [...sequence]; // assume newest first from importer
  let streak = 1;
  for (let i = 1; i < recent.length; i++) {
    if (recent[i] === recent[0]) streak++;
    else break;
  }
  const currentStreak =
    recent.length === 0
      ? "n/a"
      : `${streak} ${recent[0] === "W" ? "wins" : recent[0] === "L" ? "losses" : "draws"} (recent)`;

  const weaknesses: DeepScoutResult["weaknesses"] = [];
  const black = byColor.find((c) => c.as === "black");
  const white = byColor.find((c) => c.as === "white");
  if (black && white && black.games >= 5 && black.winRate + 12 < white.winRate) {
    weaknesses.push({
      title: "Weaker with Black",
      detail: `Scores ${black.winRate}% wins as Black vs ${white.winRate}% as White across ${black.games} Black games.`,
      severity: black.winRate < 35 ? "high" : "medium",
      exploit: "Prefer to keep the initiative; meet their Black defenses with early pressure sidelines.",
    });
  }
  if (phases.long.games >= 5 && phases.long.wins / phases.long.games < 0.35) {
    weaknesses.push({
      title: "Long-game conversion issues",
      detail: `In ${phases.long.games} long games (70+ plies), win rate is only ${Math.round((phases.long.wins / phases.long.games) * 100)}%.`,
      severity: "high",
      exploit: "Steer into technical endgames when equal/better; they often fail to convert or overpress.",
    });
  }
  if (phases.ultraShort.games >= 5 && phases.ultraShort.losses >= phases.ultraShort.wins) {
    weaknesses.push({
      title: "Fragile in short decisive games",
      detail: `Many games end before move 20 (${phases.ultraShort.games} sample) with poor results.`,
      severity: "medium",
      exploit: "Play solid opening systems and punish early adventures.",
    });
  }
  if (tiltAfterLoss >= 60 && bounceOpps >= 4) {
    weaknesses.push({
      title: "Tilt after losses",
      detail: `After a loss, bounce-back win rate is only ${bounceBackRate}%.`,
      severity: "high",
      exploit: "If you win the first game, rematch immediately — their next game is softer.",
    });
  }
  if (style.aggression >= 70) {
    weaknesses.push({
      title: "Over-aggression",
      detail: "High capture/check rates and short games suggest over-pressing.",
      severity: "medium",
      exploit: "Invite attacks, defend accurately, then counterpunch.",
    });
  }
  if (openingList[0] && openingList[0].games >= 6 && openingList[0].score <= 45) {
    weaknesses.push({
      title: `Soft main line: ${openingList[0].name}`,
      detail: `Their most common line scores only ${openingList[0].score}% for them.`,
      severity: "high",
      exploit: `Prepare specifically against ${openingList[0].name} (${openingList[0].as}).`,
    });
  }
  if (!weaknesses.length) {
    weaknesses.push({
      title: "Few glaring statistical holes",
      detail: "Sample looks balanced — edges are smaller; rely on practical pressure and clock.",
      severity: "low",
      exploit: "Use Twin Bot to probe rare sidelines they may not know deeply.",
    });
  }

  const strengths: string[] = [];
  if (white && white.winRate >= 55) strengths.push(`Strong as White (${white.winRate}% wins)`);
  if (black && black.winRate >= 48) strengths.push(`Reliable as Black (${black.winRate}% wins)`);
  if (phases.long.games >= 4 && phases.long.wins / phases.long.games >= 0.5) {
    strengths.push("Converts long games well");
  }
  if (style.bookLoyalty >= 60) strengths.push("Consistent opening repertoire");
  if (bounceBackRate >= 55) strengths.push("Good mental bounce-back after losses");
  if (!strengths.length) strengths.push("Practical fighter — keep them under novelty pressure");

  const prepTips = [
    openingList[0]
      ? `Primary target: ${openingList[0].name} as ${openingList[0].as} (${openingList[0].games} games, ${openingList[0].score}% score). Line: ${openingList[0].sampleLine || "n/a"}`
      : "Build a flexible sideline before move 8.",
    weaknesses[0]?.exploit ?? "Keep positions practical.",
    byTimeClass[0]
      ? `Most games are ${byTimeClass[0].timeClass} (${byTimeClass[0].games}) — prep at that speed.`
      : "Match their usual time control.",
    style.aggression >= 60
      ? "They create chaos — value king safety and don't grab poisoned pawns."
      : "They play solid — create imbalances early (opposite castling / pawn breaks).",
    firstMoveList[0]
      ? `Expect ${firstMoveList[0].move} often (${firstMoveList[0].pct}% of sample).`
      : "Stay flexible on move one.",
  ];

  // Prep score: higher = more preparable / exploitable
  const prepScore = clamp(
    Math.round(
      25 +
        (100 - style.consistency) * 0.25 +
        tiltAfterLoss * 0.15 +
        (openingList[0] && openingList[0].score < 50 ? 15 : 5) +
        (weaknesses.filter((w) => w.severity === "high").length * 8) +
        (attributed < 15 ? 10 : 0),
    ),
  );
  const stalkerScore = clamp(prepScore + Math.round((openDiversity > 20 ? -5 : 8) + attributed / 20));

  const summary = `${username}: ${wins}W–${draws}D–${losses}L in ${attributed} attributed games (win ${winRate}%, score ${scoreRate}%). Avg length ${avgGameLength} plies. ${
    openingList[0] ? `Main weapon: ${openingList[0].name}. ` : ""
  }Style leans ${style.aggression >= 60 ? "aggressive" : style.endgame >= 60 ? "technical" : "practical"}. Prep Score ${prepScore}/100.`;

  return {
    sampleSize: games.length,
    attributed,
    wins,
    losses,
    draws,
    winRate,
    scoreRate,
    openings: openingList,
    twinRepertoire: twinRepertoire.filter(Boolean).length
      ? twinRepertoire
      : firstMoveList[0]
        ? [firstMoveList[0].move]
        : ["e4"],
    byColor,
    byTimeClass,
    phases,
    style,
    psyche: {
      tiltAfterLoss,
      timePressureBlunders: clamp(Math.round(40 + shortShare * 50)),
      conversionWhenWinning: clamp(Math.round(55 + (phases.long.wins / Math.max(1, phases.long.games)) * 40)),
      gritWhenLosing: clamp(bounceBackRate),
      bestHours: bestHour ? `${bestHour.hour} (${bestHour.score}%)` : "Insufficient clock data",
      worstHours: worstHour ? `${worstHour.hour} (${worstHour.score}%)` : "Insufficient clock data",
      currentStreak,
      bounceBackRate,
    },
    patterns: {
      firstMoves: firstMoveList,
      castlesShort,
      castlesLong,
      avgGameLength,
      decisiveRate,
      comebackWins,
      lostFromBetter,
    },
    weaknesses: weaknesses.slice(0, 6),
    strengths,
    prepTips,
    prepScore,
    stalkerScore,
    summary,
    hourlyPerformance: hourlyPerformance.slice(0, 8),
  };
}

function clamp(n: number) {
  return Math.max(5, Math.min(98, n));
}

function estimatePlies(pgn: string) {
  const moves = pgn.replace(/\[[^\]]*\]/g, " ").match(/\b([NBRQK]?[a-h]?[1-8]?x?[a-h][1-8](?:=[NBRQ])?[+#]?|O-O-O|O-O)\b/g);
  return moves?.length ?? 0;
}

function materialStory(sans: string[], color: "w" | "b") {
  const chess = new Chess();
  let wasBehind = false;
  let wasAhead = false;
  let wonFromBehind = false;
  let lostFromAhead = false;
  const values: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

  const mat = () => {
    let w = 0,
      b = 0;
    for (const row of chess.board()) {
      for (const p of row) {
        if (!p) continue;
        if (p.color === "w") w += values[p.type];
        else b += values[p.type];
      }
    }
    return color === "w" ? w - b : b - w;
  };

  for (const san of sans) {
    try {
      chess.move(san);
    } catch {
      break;
    }
    const d = mat();
    if (d <= -2) wasBehind = true;
    if (d >= 2) wasAhead = true;
  }

  const res = chess.isCheckmate()
    ? chess.turn() === "w"
      ? "0-1"
      : "1-0"
    : chess.isDraw()
      ? "1/2-1/2"
      : "*";
  const { won, lost } = resultFor(color, res === "*" ? inferResultFromSans(sans, color) : res);
  if (won && wasBehind) wonFromBehind = true;
  if (lost && wasAhead) lostFromAhead = true;
  return { wonFromBehind, lostFromAhead };
}

function inferResultFromSans(_sans: string[], _color: "w" | "b"): string {
  void _sans;
  void _color;
  return "*";
}
