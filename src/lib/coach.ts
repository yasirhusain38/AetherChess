export interface Quest {
  id: string;
  title: string;
  detail: string;
  minutes: number;
  xp: number;
  href: string;
  tag: string;
}

export interface CoachPlan {
  greeting: string;
  focus: string;
  streak: number;
  weeklyGoalMinutes: number;
  weeklyDoneMinutes: number;
  quests: Quest[];
  weaknesses: string[];
}

export function getCoachPlan(): CoachPlan {
  return {
    greeting: "Your living plan is ready.",
    focus: "Time-pressure tactics + Italian Game structures",
    streak: 4,
    weeklyGoalMinutes: 150,
    weeklyDoneMinutes: 72,
    weaknesses: [
      "Hanging pieces when under 20s",
      "Passive light-square bishop",
      "Missed back-rank patterns",
    ],
    quests: [
      {
        id: "q1",
        title: "Tactics: hanging piece radar",
        detail: "8 puzzles from your last blunder themes",
        minutes: 12,
        xp: 40,
        href: "/train?mode=puzzles",
        tag: "Tactics",
      },
      {
        id: "q2",
        title: "Opening drill: Italian sidelines",
        detail: "Play 2 games vs Nova focusing on …c5 breaks",
        minutes: 15,
        xp: 35,
        href: "/play?bot=nova",
        tag: "Openings",
      },
      {
        id: "q3",
        title: "Twin spar: your last opponent",
        detail: "Practice against their style before rematch",
        minutes: 10,
        xp: 45,
        href: "/scout",
        tag: "Scout",
      },
      {
        id: "q4",
        title: "Endgame: R+P vs R basics",
        detail: "Tablebase trainer — hold the draw / convert",
        minutes: 10,
        xp: 30,
        href: "/train?mode=endgame",
        tag: "Endgame",
      },
    ],
  };
}
