import { Chess } from "chess.js";

export function buildPgn(opts: {
  moves: string[];
  white: string;
  black: string;
  result: string;
  event?: string;
  timeControl?: string;
}): string {
  const headers: Record<string, string> = {
    Event: opts.event ?? "Aether Game",
    Site: "Aether",
    Date: new Date().toISOString().slice(0, 10).replace(/-/g, "."),
    White: opts.white,
    Black: opts.black,
    Result: opts.result,
  };
  if (opts.timeControl) headers.TimeControl = opts.timeControl;

  const headerStr = Object.entries(headers)
    .map(([k, v]) => `[${k} "${v}"]`)
    .join("\n");

  const chess = new Chess();
  for (const san of opts.moves) {
    try {
      chess.move(san);
    } catch {
      break;
    }
  }
  // chess.js history as PGN moves
  const history = chess.history();
  let body = "";
  for (let i = 0; i < history.length; i++) {
    if (i % 2 === 0) body += `${Math.floor(i / 2) + 1}. `;
    body += `${history[i]} `;
  }
  body += opts.result;
  return `${headerStr}\n\n${body.trim()}\n`;
}

export function resultFromChess(chess: Chess, resigned?: "w" | "b"): string {
  if (resigned === "w") return "0-1";
  if (resigned === "b") return "1-0";
  if (chess.isCheckmate()) return chess.turn() === "w" ? "0-1" : "1-0";
  if (chess.isDraw()) return "1/2-1/2";
  return "*";
}
