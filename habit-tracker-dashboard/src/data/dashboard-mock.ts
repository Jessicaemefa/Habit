export const MILESTONES = [3, 7, 14, 30, 100] as const;

export type HabitMock = {
  id: string;
  title: string;
  emoji: string;
  streak: number;
  bestStreak: number;
  dailyProgress: number;
};

export type TaskMock = {
  id: string;
  emoji: string;
  title: string;
};

export const dashboardMock = {
  header: {
    weekday: "Monday",
    titlePrefix: "Today,",
    dateHighlight: "Mar 2",
  },
  habits: [
    {
      id: "meditation",
      title: "Morning Meditation",
      emoji: "\u{1F9D8}",
      streak: 12,
      bestStreak: 18,
      dailyProgress: 0.75,
    },
    {
      id: "read",
      title: "Read 20 Pages",
      emoji: "\u{1F4D6}",
      streak: 5,
      bestStreak: 14,
      dailyProgress: 0.25,
    },
    {
      id: "exercise",
      title: "Exercise",
      emoji: "\u{1F3CB}\u{FE0F}",
      streak: 31,
      bestStreak: 31,
      dailyProgress: 1,
    },
    {
      id: "water",
      title: "Drink 8 Glasses of Water",
      emoji: "\u{1F4A7}",
      streak: 3,
      bestStreak: 10,
      dailyProgress: 0.15,
    },
  ] as HabitMock[],
  tasks: [
    { id: "garage", emoji: "\u{1F9F9}", title: "Clean the Garage" },
    { id: "groceries", emoji: "\u{1F6D2}", title: "Buy Groceries" },
  ] as TaskMock[],
};
