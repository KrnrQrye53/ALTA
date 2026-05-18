export type KLevel = "K2" | "K3" | "K4";

export type Question = {
  id: string;
  chapter: string;
  chapterName: string;
  kLevel?: KLevel;
  question: string;
  choices: string[];
  correctAnswers: number[];
  explanation: string;
};

export type QuizMode = "exam" | "practice" | "review";

export type AnswerRecord = {
  questionId: string;
  selected: number[];
  isCorrect: boolean;
};

export type SessionRecord = {
  timestamp: number;
  mode: QuizMode;
  chapter?: string;
  score: number;
  total: number;
  durationSec: number;
  wrongIds: string[];
};

export type WrongStat = {
  count: number;
  lastWrongAt: number;
};
