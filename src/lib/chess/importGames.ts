import { Chess } from "chess.js";

export interface ImportedGame {
  id: string;
  source: "lichess" | "chesscom";
  pgn: string;
  white: string;
  black: string;
  result: string;
  opening?: string;
  timeClass?: string;
  playerColor: "w" | "b" | null;
  sans: string[];
  whiteRating?: number;
  blackRating?: number;
  endTime?: number;
}

export interface LiveProfile {
  source: "lichess" | "chesscom";
  username: string;
  url?: string;
  title?: string;
  avatar?: string;
  country?: string;
  ratings: {
    bullet?: number;
    blitz?: number;
    rapid?: number;
    classical?: number;
  };
  record?: {
    bullet?: { win: number; loss: number; draw: number };
    blitz?: { win: number; loss: number; draw: number };
    rapid?: { win: number; loss: number; draw: number };
  };
  gamesAnalyzed: number;
  joined?: number;
  lastOnline?: number;
}

function extractMovesFromPgn(pgn: string): string[] {
  if (!pgn?.trim()) return [];
  try {
    const c = new Chess();
    c.loadPgn(pgn, { strict: false } as never);
    return c.history();
  } catch {
    try {
      // strip headers / comments / NAGs and replay
      const body = pgn
        .replace(/\[[^\]]*\]/g, " ")
        .replace(/\{[^}]*\}/g, " ")
        .replace(/\$\d+/g, " ")
        .replace(/\d+\.(\.\.)?/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      const c = new Chess();
      const tokens = body.split(" ").filter((t) => t && !["1-0", "0-1", "1/2-1/2", "*"].includes(t));
      for (const t of tokens) {
        try {
          c.move(t);
        } catch {
          break;
        }
      }
      return c.history();
    } catch {
      return [];
    }
  }
}

function openingHeader(pgn: string): string | undefined {
  const o = pgn.match(/\[Opening "([^"]+)"\]/i);
  if (o?.[1] && o[1] !== "?") return o[1];
  const eco = pgn.match(/\[ECO "([^"]+)"\]/i);
  if (eco?.[1]) return eco[1];
  return undefined;
}

function resultFromChesscom(whiteResult?: string, blackResult?: string): string {
  if (whiteResult === "win") return "1-0";
  if (blackResult === "win") return "0-1";
  if (
    whiteResult &&
    [
      "agreed",
      "stalemate",
      "repetition",
      "insufficient",
      "50move",
      "timevsinsufficient",
    ].includes(whiteResult)
  ) {
    return "1/2-1/2";
  }
  if (whiteResult === "timeout" || whiteResult === "abandoned" || whiteResult === "checkmated") {
    return "0-1";
  }
  if (blackResult === "timeout" || blackResult === "abandoned" || blackResult === "checkmated") {
    return "1-0";
  }
  return "*";
}

export async function fetchLichessProfile(username: string): Promise<LiveProfile | null> {
  const res = await fetch(`/api/lichess/user/${encodeURIComponent(username)}`);
  if (!res.ok) return null;
  const data = await res.json();
  const perfs = data.perfs ?? {};
  return {
    source: "lichess",
    username: data.username ?? username,
    url: data.url,
    title: data.title,
    ratings: {
      bullet: perfs.bullet?.rating,
      blitz: perfs.blitz?.rating,
      rapid: perfs.rapid?.rating,
      classical: perfs.classical?.rating,
    },
    gamesAnalyzed: 0,
  };
}

export async function fetchLichessGames(username: string, max = 60): Promise<ImportedGame[]> {
  const res = await fetch(
    `/api/lichess/games/${encodeURIComponent(username)}?max=${max}`,
  );
  if (!res.ok) return [];
  const data = await res.json();
  const uname = username.toLowerCase();
  return (data.games as Record<string, unknown>[]).map((g, i) => {
    const players = g.players as {
      white?: { user?: { name?: string }; name?: string; rating?: number };
      black?: { user?: { name?: string }; name?: string; rating?: number };
    };
    const white =
      players?.white?.user?.name ?? players?.white?.name ?? "White";
    const black =
      players?.black?.user?.name ?? players?.black?.name ?? "Black";
    const pgn = String(g.pgn ?? "");
    const winner = g.winner as string | undefined;
    const result =
      winner === "white"
        ? "1-0"
        : winner === "black"
          ? "0-1"
          : g.status === "draw" || g.status === "stalemate"
            ? "1/2-1/2"
            : "*";
    const opening = (g.opening as { name?: string } | undefined)?.name ?? openingHeader(pgn);
    const playerColor =
      white.toLowerCase() === uname ? "w" : black.toLowerCase() === uname ? "b" : null;
    return {
      id: String(g.id ?? `lichess_${i}`),
      source: "lichess" as const,
      pgn,
      white,
      black,
      result,
      opening,
      timeClass: String(g.speed ?? ""),
      playerColor,
      sans: extractMovesFromPgn(pgn),
      whiteRating: players?.white?.rating,
      blackRating: players?.black?.rating,
    };
  });
}

export async function fetchChesscomProfile(username: string): Promise<LiveProfile | null> {
  const res = await fetch(`/api/chesscom/player/${encodeURIComponent(username.trim())}`);
  if (!res.ok) return null;
  const data = await res.json();
  if (data.error && !data.profile) return null;
  const stats = data.stats ?? {};
  const profile = data.profile ?? {};
  const pack = (key: string) => {
    const s = stats[key];
    if (!s?.record) return undefined;
    return { win: s.record.win ?? 0, loss: s.record.loss ?? 0, draw: s.record.draw ?? 0 };
  };
  return {
    source: "chesscom",
    username: profile.username ?? username,
    url: profile.url,
    title: profile.title,
    avatar: profile.avatar,
    country: typeof profile.country === "string" ? profile.country.split("/").pop() : undefined,
    ratings: {
      bullet: stats.chess_bullet?.last?.rating,
      blitz: stats.chess_blitz?.last?.rating,
      rapid: stats.chess_rapid?.last?.rating,
      classical: stats.chess_daily?.last?.rating,
    },
    record: {
      bullet: pack("chess_bullet"),
      blitz: pack("chess_blitz"),
      rapid: pack("chess_rapid"),
    },
    gamesAnalyzed: 0,
    joined: profile.joined,
    lastOnline: profile.last_online,
  };
}

export async function fetchChesscomGames(
  username: string,
  max = 180,
): Promise<{ games: ImportedGame[]; error?: string; meta?: Record<string, unknown> }> {
  const res = await fetch(
    `/api/chesscom/games/${encodeURIComponent(username.trim())}?max=${max}&months=8`,
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { games: [], error: data.error || `Chess.com games failed (${res.status})` };
  }
  const uname = username.trim().toLowerCase();
  const games = (data.games as Record<string, unknown>[] | undefined)?.map((g, i) => {
    const whiteObj = g.white as
      | { username?: string; result?: string; rating?: number }
      | undefined;
    const blackObj = g.black as
      | { username?: string; result?: string; rating?: number }
      | undefined;
    const white = whiteObj?.username ?? "White";
    const black = blackObj?.username ?? "Black";
    const pgn = String(g.pgn ?? "");
    const playerColor: "w" | "b" | null =
      white.toLowerCase() === uname ? "w" : black.toLowerCase() === uname ? "b" : null;
    return {
      id: String(g.url ?? `chesscom_${i}`),
      source: "chesscom" as const,
      pgn,
      white,
      black,
      result: resultFromChesscom(whiteObj?.result, blackObj?.result),
      opening: openingHeader(pgn) || (typeof g.eco === "string" ? g.eco : undefined),
      timeClass: String(g.time_class ?? ""),
      playerColor,
      sans: extractMovesFromPgn(pgn),
      whiteRating: whiteObj?.rating,
      blackRating: blackObj?.rating,
      endTime: typeof g.end_time === "number" ? g.end_time : undefined,
    };
  }) ?? [];

  return {
    games,
    meta: {
      archivesUsed: data.archivesUsed,
      totalFetched: data.totalFetched,
    },
  };
}

/** @deprecated use deepAnalyzeGames — kept for compatibility */
export function analyzeImportedGames(username: string, games: ImportedGame[]) {
  const uname = username.toLowerCase();
  let wins = 0,
    losses = 0,
    draws = 0;
  for (const g of games) {
    const color =
      g.playerColor ??
      (g.white.toLowerCase() === uname ? "w" : g.black.toLowerCase() === uname ? "b" : null);
    if (!color) continue;
    if ((g.result === "1-0" && color === "w") || (g.result === "0-1" && color === "b")) wins++;
    else if ((g.result === "0-1" && color === "w") || (g.result === "1-0" && color === "b"))
      losses++;
    else if (g.result === "1/2-1/2") draws++;
  }
  const total = wins + losses + draws || 1;
  return {
    wins,
    losses,
    draws,
    winRate: Math.round((wins / total) * 100),
    openings: [] as {
      name: string;
      moves: string;
      games: number;
      score: number;
      as: "white" | "black";
    }[],
    twinRepertoire: ["e4"] as string[],
    aggression: 50,
    solidity: 50,
    summaryBits: { sample: games.length, topFirst: undefined as string | undefined },
  };
}
