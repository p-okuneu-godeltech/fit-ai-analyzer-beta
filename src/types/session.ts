export type SessionRecord = {
  timestamp: Date;
  distanceMeters: number;
  speedMetersPerSecond: number | null;
  cadenceSpm: number | null;
  latitudeDeg: number | null;
  longitudeDeg: number | null;
};

export type SessionSummary = {
  id: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  averagePaceSecondsPerKm: number | null;
  averageCadenceSpm: number | null;
};

export type ParsedSession = {
  records: SessionRecord[];
  summary: SessionSummary;
};

export type Split = {
  index: number;
  startDistanceMeters: number;
  endDistanceMeters: number;
  distanceMeters: number;
  durationSeconds: number;
  paceSecondsPerKm: number | null;
  averageCadenceSpm: number | null;
};

export type PaceStats = {
  averagePaceSecondsPerKm: number | null;
  bestPaceSecondsPerKm: number | null;
  worstPaceSecondsPerKm: number | null;
  paceStdDevSecondsPerKm: number | null;
};

export type CadenceStats = {
  averageCadenceSpm: number | null;
  minCadenceSpm: number | null;
  maxCadenceSpm: number | null;
  cadenceStdDevSpm: number | null;
};

export type HalfComparison = {
  firstHalfDistanceMeters: number;
  secondHalfDistanceMeters: number;
  firstHalfDurationSeconds: number;
  secondHalfDurationSeconds: number;
  firstHalfPaceSecondsPerKm: number | null;
  secondHalfPaceSecondsPerKm: number | null;
  paceDifferenceSecondsPerKm: number | null;
};

export type DetectedPause = {
  startTime: Date;
  endTime: Date;
  durationSeconds: number;
  startDistanceMeters: number;
  endDistanceMeters: number;
};

export type ConsistencyMetrics = {
  paceStabilityScore: number | null;
  cadenceStabilityScore: number | null;
  negativeSplitScore: number | null;
  overallSessionScore: number | null;
};

export type SessionTotals = {
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  averagePaceSecondsPerKm: number | null;
  averageCadenceSpm: number | null;
};

export type SessionMetrics = {
  totals: SessionTotals;
  splits: Split[];
  paceStats: PaceStats;
  cadenceStats: CadenceStats;
  halfComparison: HalfComparison | null;
  pauses: DetectedPause[];
  consistency: ConsistencyMetrics;
};

export type SessionTimeSummary = {
  elapsedDurationSeconds: number;
  workoutDurationSeconds: number;
  totalPauseSeconds: number;
};
