"use client";

import { useMemo, useState } from "react";
import { Chess } from "chess.js";
import { BookOpen, Plus, Save, Trash2 } from "lucide-react";
import { ChessBoard } from "@/components/chess/ChessBoard";
import { useSettings } from "@/lib/hooks/useSettings";
import {
  createStudy,
  deleteStudy,
  listStudies,
  saveStudy,
  type Study,
} from "@/lib/storage";
import { cn } from "@/lib/utils";

export default function StudiesPage() {
  const { settings } = useSettings();
  const [studies, setStudies] = useState<Study[]>(() =>
    typeof window === "undefined" ? [] : listStudies(),
  );
  const [activeId, setActiveId] = useState<string | null>(() =>
    typeof window === "undefined" ? null : listStudies()[0]?.id ?? null,
  );
  const [chapterIdx, setChapterIdx] = useState(0);

  const active = studies.find((s) => s.id === activeId) ?? null;
  const chapter = active?.chapters[chapterIdx] ?? null;

  // Local draft tied to chapter id via remount key pattern
  const chapterKey = chapter?.id ?? "none";

  return (
    <div className="fade-up space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="section-title">Studies</div>
          <h1 className="text-2xl sm:text-3xl font-semibold mt-1 flex items-center gap-2">
            <BookOpen className="text-violet-300" size={28} />
            Collaborative notebooks
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Lichess-style studies saved locally. Chapters, notes, and board.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            const s = createStudy("Untitled study", "Personal notebook");
            setStudies(listStudies());
            setActiveId(s.id);
            setChapterIdx(0);
          }}
        >
          <Plus size={16} />
          New study
        </button>
      </div>

      <div className="grid lg:grid-cols-[240px_minmax(0,1fr)_300px] gap-4 items-start">
        <div className="panel p-3 space-y-2">
          <div className="section-title px-1">Your studies</div>
          {studies.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setActiveId(s.id);
                setChapterIdx(0);
              }}
              className={cn(
                "w-full text-left rounded-xl px-3 py-2 text-sm transition-colors",
                activeId === s.id ? "bg-white/10" : "hover:bg-white/5",
              )}
            >
              <div className="font-medium truncate">{s.title}</div>
              <div className="text-[10px] text-[var(--text-dim)]">
                {s.chapters.length} chapters
              </div>
            </button>
          ))}
        </div>

        {active && chapter ? (
          <ChapterEditor
            key={chapterKey}
            active={active}
            chapterIdx={chapterIdx}
            settings={settings}
            onStudiesChange={(all, id, ch) => {
              setStudies(all);
              if (id) setActiveId(id);
              if (typeof ch === "number") setChapterIdx(ch);
            }}
            onChapterIdx={setChapterIdx}
          />
        ) : (
          <div className="panel p-6 text-sm text-[var(--text-muted)]">
            Create or select a study to begin.
          </div>
        )}
      </div>
    </div>
  );
}

function ChapterEditor({
  active,
  chapterIdx,
  settings,
  onStudiesChange,
  onChapterIdx,
}: {
  active: Study;
  chapterIdx: number;
  settings: { boardTheme: string; showLegalMoves: boolean; coord: boolean };
  onStudiesChange: (all: Study[], id?: string, ch?: number) => void;
  onChapterIdx: (i: number) => void;
}) {
  const chapter = active.chapters[chapterIdx];
  const [title, setTitle] = useState(chapter.title);
  const [notes, setNotes] = useState(chapter.notes);
  const [pgn, setPgn] = useState(chapter.pgn);
  const [moveCursor, setMoveCursor] = useState(9999);

  const sans = useMemo(() => {
    const c = new Chess();
    try {
      if (pgn.trim()) {
        if (pgn.includes("[")) c.loadPgn(pgn);
        else {
          const tokens = pgn
            .replace(/\d+\./g, " ")
            .trim()
            .split(/\s+/)
            .filter((t) => t && !t.includes("…"));
          for (const t of tokens) {
            try {
              c.move(t);
            } catch {
              break;
            }
          }
        }
      }
    } catch {
      /* ignore */
    }
    return c.history();
  }, [pgn]);

  const fen = useMemo(() => {
    const c = new Chess();
    const n = Math.min(moveCursor, sans.length);
    for (let i = 0; i < n; i++) {
      try {
        c.move(sans[i]);
      } catch {
        break;
      }
    }
    return c.fen();
  }, [sans, moveCursor]);

  const lastMove = useMemo(() => {
    if (!sans.length || moveCursor <= 0) return null;
    const c = new Chess();
    let lm: { from: string; to: string } | null = null;
    const n = Math.min(moveCursor, sans.length);
    for (let i = 0; i < n; i++) {
      try {
        const m = c.move(sans[i]);
        if (m) lm = { from: m.from, to: m.to };
      } catch {
        break;
      }
    }
    return lm;
  }, [sans, moveCursor]);

  const persistChapter = () => {
    const chapters = active.chapters.map((ch, i) =>
      i === chapterIdx ? { ...ch, title, notes, pgn } : ch,
    );
    const next = saveStudy({ ...active, chapters });
    onStudiesChange(listStudies(), next.id);
  };

  const onBoardMove = (m: { from: string; to: string; promotion?: "q" | "r" | "b" | "n" }) => {
    const c = new Chess(fen);
    try {
      const moved = c.move({ from: m.from, to: m.to, promotion: m.promotion ?? "q" });
      if (!moved) return false;
      const base = sans.slice(0, Math.min(moveCursor, sans.length));
      const nextSans = [...base, moved.san];
      setPgn(nextSans.join(" "));
      setMoveCursor(nextSans.length);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <>
      <div className="space-y-3 max-w-[560px]">
        <ChessBoard
          fen={fen}
          lastMove={lastMove}
          onMove={onBoardMove}
          boardThemeId={settings.boardTheme}
          showLegalMoves={settings.showLegalMoves}
          showCoordinates={settings.coord}
        />
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-secondary !py-2" onClick={() => setMoveCursor(0)}>
            Start
          </button>
          <button
            type="button"
            className="btn btn-secondary !py-2"
            onClick={() => setMoveCursor((c) => Math.max(0, c - 1))}
          >
            Prev
          </button>
          <button
            type="button"
            className="btn btn-secondary !py-2"
            onClick={() => setMoveCursor((c) => Math.min(sans.length, c + 1))}
          >
            Next
          </button>
          <button
            type="button"
            className="btn btn-ghost !py-2"
            onClick={() => setMoveCursor(sans.length)}
          >
            End
          </button>
        </div>
        <div className="font-mono text-xs text-[var(--text-muted)] break-words">
          {sans.join(" ") || "Empty chapter — move pieces or paste PGN."}
        </div>
      </div>

      <div className="panel p-4 space-y-3">
        <input
          className="input !py-2 font-semibold"
          value={active.title}
          onChange={(e) => {
            const next = saveStudy({ ...active, title: e.target.value });
            onStudiesChange(listStudies(), next.id);
          }}
        />
        <div className="flex flex-wrap gap-1.5">
          {active.chapters.map((ch, i) => (
            <button
              key={ch.id}
              type="button"
              className={cn("chip", chapterIdx === i && "chip-active")}
              onClick={() => {
                persistChapter();
                onChapterIdx(i);
              }}
            >
              {ch.title || `Ch ${i + 1}`}
            </button>
          ))}
          <button
            type="button"
            className="chip"
            onClick={() => {
              persistChapter();
              const chapters = [
                ...active.chapters,
                {
                  id: `ch_${Date.now()}`,
                  title: `Chapter ${active.chapters.length + 1}`,
                  pgn: "",
                  notes: "",
                },
              ];
              const next = saveStudy({ ...active, chapters });
              onStudiesChange(listStudies(), next.id, chapters.length - 1);
            }}
          >
            + Chapter
          </button>
        </div>

        <div>
          <div className="section-title mb-1">Chapter title</div>
          <input className="input !py-2" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <div className="section-title mb-1">PGN / moves</div>
          <textarea
            className="input min-h-24 font-mono text-xs"
            value={pgn}
            onChange={(e) => {
              setPgn(e.target.value);
              setMoveCursor(9999);
            }}
          />
        </div>
        <div>
          <div className="section-title mb-1">Notes</div>
          <textarea
            className="input min-h-28 text-sm"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ideas, plans, traps…"
          />
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn btn-primary flex-1" onClick={persistChapter}>
            <Save size={16} />
            Save
          </button>
          {active.id !== "study_italian" && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                deleteStudy(active.id);
                const all = listStudies();
                onStudiesChange(all, all[0]?.id ?? undefined, 0);
              }}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
