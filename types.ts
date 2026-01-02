
export enum Board {
  RAPHATORIA = 'RAPHATORIA',
  RAPHA_LIFELINE = 'RAPHA-LIFELINE',
  WHOLENESS_MISSIONS = 'WHOLENESS MISSIONS',
  EXCEL = 'EXCEL',
  RAPHA_CHOIR = 'RAPHA CHOIR',
  RAPHA_THEATER = 'RAPHA THEATER',
  BROTHERS_SISTERS_WELFARE = 'BROTHERS/SISTERS/WELFARE',
  FINANCIAL = 'FINANCIAL',
  SECRETARIAT = 'SECRETARIAT'
}

export const BoardColors: Record<Board, string> = {
  [Board.RAPHATORIA]: '#3B82F6', // Blue
  [Board.RAPHA_LIFELINE]: '#EF4444', // Red
  [Board.WHOLENESS_MISSIONS]: '#10B981', // Green
  [Board.EXCEL]: '#8B5CF6', // Purple
  [Board.RAPHA_CHOIR]: '#06B6D4', // Turquoise
  [Board.RAPHA_THEATER]: '#94a3b8', // Ash (Slate-400)
  [Board.BROTHERS_SISTERS_WELFARE]: '#000000', // Black
  [Board.FINANCIAL]: '#EC4899', // Pink
  [Board.SECRETARIAT]: '#D4AF37' // Gold
};

export enum Status {
  NATIONALS = 'NATIONALS',
  HOUSE = 'HOUSE',
  STATUTORY = 'STATUTORY'
}

export type RecurrenceFrequency = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';

export enum UpdateMode {
  SINGLE = 'SINGLE',
  FUTURE = 'FUTURE',
  ALL = 'ALL'
}

export interface RecurrenceConfig {
  frequency: RecurrenceFrequency;
  interval: number;
  daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
  endRecurrence?: string; // Date string
}

export interface Activity {
  id: string;
  startDate: string;
  endDate: string;
  activityName: string;
  board: Board;
  status: Status;
  isLocked?: boolean;
  recurrence?: RecurrenceConfig;
  parentId?: string; // For expanded recurring instances
  skippedDates?: string[]; // ISO strings of dates to ignore in expansion
}
