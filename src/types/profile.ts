export type StressLevel =
  | "never"
  | "few_times_a_week"
  | "few_times_a_day"
  | "everyday";

export type UserProfile = {
  id: string;
  userId: string;
  createdAt: Date;
  yearsRunning: number | null;
  weeklyKilometrage: number | null;
  personalBest5kSeconds: number | null;
  personalBest5kDate: Date | null;
  personalBest10kSeconds: number | null;
  personalBest10kDate: Date | null;
  averageDailyCalories: number | null;
  sleepHours: number | null;
  sleepConsistencyScore: number | null;
  stressLevel: StressLevel | null;
};

export type RunningGoal = {
  id: string;
  userId: string;
  createdAt: Date;
  targetDistanceKm: number;
  targetPaceSecondsPerKm: number;
  targetDate: Date;
};

export type AnalysisResult = {
  id: string;
  userId: string;
  sessionId: string;
  createdAt: Date;
  summaryText: string;
  qualityLabel: 'easy' | 'moderate' | 'hard' | 'inconclusive';
  focusRecommendations: string[];
};
