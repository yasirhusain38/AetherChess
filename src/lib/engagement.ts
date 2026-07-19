/**
 * Growth / psychology engagement layer.
 * Techniques: streaks (loss aversion), endowed progress, variable rewards,
 * Zeigarnik (open loops), social proof seeds, commitment.
 */

const KEY = "aether.engagement.v2";

export interface EngagementState {
  firstVisitAt: number;
  lastVisitAt: number;
  visitDays: string[]; // YYYY-MM-DD UTC
  streak: number;
  bestStreak: number;
  xp: number;
  level: number;
  gamesToday: number;
  puzzlesToday: number;
  scoutsToday: number;
  dayKey: string;
  onboardingDone: boolean;
  questsClaimed: string[];
  lastRewardAt: number;
  totalSessions: number;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function defaultState(): EngagementState {
  const t = todayKey();
  return {
    firstVisitAt: Date.now(),
    lastVisitAt: Date.now(),
    visitDays: [t],
    streak: 1,
    bestStreak: 1,
    xp: 40, // endowed progress — not starting at zero
    level: 1,
    gamesToday: 0,
    puzzlesToday: 0,
    scoutsToday: 0,
    dayKey: t,
    onboardingDone: false,
    questsClaimed: [],
    lastRewardAt: 0,
    totalSessions: 1,
  };
}

export function loadEngagement(): EngagementState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const s = defaultState();
      saveEngagement(s);
      return s;
    }
    let s = { ...defaultState(), ...JSON.parse(raw) } as EngagementState;
    s = rollDay(s);
    return s;
  } catch {
    return defaultState();
  }
}

/** Call once per app shell mount */
export function touchSession(): EngagementState {
  let s = loadEngagement();
  s = updateStreakOnVisit(s);
  s.totalSessions = (s.totalSessions || 0) + 1;
  s.lastVisitAt = Date.now();
  saveEngagement(s);
  return s;
}

export function saveEngagement(s: EngagementState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(s));
  try {
    window.dispatchEvent(new Event("aether-engagement"));
  } catch {
    /* ignore */
  }
}

function rollDay(s: EngagementState): EngagementState {
  const t = todayKey();
  if (s.dayKey === t) return s;
  return {
    ...s,
    dayKey: t,
    gamesToday: 0,
    puzzlesToday: 0,
    scoutsToday: 0,
    questsClaimed: [],
  };
}

function updateStreakOnVisit(s: EngagementState): EngagementState {
  const t = todayKey();
  if (s.visitDays.includes(t)) return s;
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const yKey = y.toISOString().slice(0, 10);
  const last = s.visitDays[s.visitDays.length - 1];
  let streak = s.streak;
  if (last === yKey) streak += 1;
  else streak = 1;
  const visitDays = [...s.visitDays, t].slice(-60);
  return {
    ...s,
    visitDays,
    streak,
    bestStreak: Math.max(s.bestStreak, streak),
  };
}

function xpToLevel(xp: number) {
  return Math.max(1, Math.floor(Math.sqrt(xp / 50)) + 1);
}

export function addXp(amount: number, reason?: string) {
  const s = loadEngagement();
  // variable reward: 10% chance of bonus
  let gain = amount;
  let bonus = false;
  if (Math.random() < 0.12) {
    gain = Math.round(amount * 1.5);
    bonus = true;
  }
  s.xp += gain;
  s.level = xpToLevel(s.xp);
  s.lastRewardAt = Date.now();
  saveEngagement(s);
  return { gain, bonus, reason, state: s };
}

export function trackGamePlayed() {
  const s = rollDay(loadEngagement());
  s.gamesToday += 1;
  saveEngagement(s);
  return addXp(25, "Game played");
}

export function trackPuzzle() {
  const s = rollDay(loadEngagement());
  s.puzzlesToday += 1;
  saveEngagement(s);
  return addXp(8, "Puzzle solved");
}

export function trackScout() {
  const s = rollDay(loadEngagement());
  s.scoutsToday += 1;
  saveEngagement(s);
  return addXp(20, "Scout report");
}

export function completeOnboarding() {
  const s = loadEngagement();
  s.onboardingDone = true;
  saveEngagement(s);
  return addXp(50, "Welcome bonus");
}

export interface DailyQuest {
  id: string;
  title: string;
  detail: string;
  target: number;
  progress: number;
  xp: number;
  href: string;
  done: boolean;
}

export function getDailyQuests(s?: EngagementState): DailyQuest[] {
  const st = s ?? (typeof window !== "undefined" ? loadEngagement() : defaultState());
  const claimed = new Set(st.questsClaimed);
  const defs = [
    {
      id: "play1",
      title: "Play 1 game",
      detail: "Any bot or Twin — keep the streak alive",
      target: 1,
      progress: st.gamesToday,
      xp: 30,
      href: "/play",
    },
    {
      id: "puzzle3",
      title: "Solve 3 puzzles",
      detail: "Warm up tactics before your next match",
      target: 3,
      progress: st.puzzlesToday,
      xp: 25,
      href: "/train",
    },
    {
      id: "scout1",
      title: "Scout 1 opponent",
      detail: "Walk in prepared — Oracle dossier",
      target: 1,
      progress: st.scoutsToday,
      xp: 35,
      href: "/scout",
    },
  ];
  return defs.map((d) => ({
    ...d,
    progress: Math.min(d.target, d.progress),
    done: d.progress >= d.target || claimed.has(d.id),
  }));
}

export function claimQuest(id: string) {
  const s = rollDay(loadEngagement());
  const quests = getDailyQuests(s);
  const q = quests.find((x) => x.id === id);
  if (!q || q.progress < q.target || s.questsClaimed.includes(id)) return null;
  s.questsClaimed = [...s.questsClaimed, id];
  saveEngagement(s);
  return addXp(q.xp, `Quest: ${q.title}`);
}

/** Fake but sticky social proof numbers (stable per hour) */
export function socialProofStats() {
  const h = new Date().getUTCHours();
  const seed = h * 997 + new Date().getUTCDate() * 13;
  const online = 1200 + (seed % 800) + Math.floor((Date.now() / 60000) % 40);
  const scouts = 40 + (seed % 55);
  const games = 180 + (seed % 120);
  return {
    online,
    scoutsLastHour: scouts,
    gamesLastHour: games,
    improvingThisWeek: 8400 + (seed % 900),
  };
}

export function levelProgress(xp: number, level: number) {
  const curFloor = Math.pow(level - 1, 2) * 50;
  const nextFloor = Math.pow(level, 2) * 50;
  const span = Math.max(1, nextFloor - curFloor);
  const into = Math.max(0, xp - curFloor);
  return Math.min(100, Math.round((into / span) * 100));
}
