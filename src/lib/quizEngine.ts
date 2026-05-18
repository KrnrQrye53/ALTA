import type { Question, QuizMode } from "../types";
import { ALL_QUESTIONS, questionsForChapter } from "../data/chapters";
import { shuffle, sample } from "./shuffle";
import { wrongIds } from "./storage";

export const EXAM_DEFAULTS = {
  questionCount: 40,
  timeLimitSec: 180 * 60,
};

export type ChoiceOrder = number[];

export type PreparedQuestion = {
  question: Question;
  choiceOrder: ChoiceOrder;
};

export type QuizSession = {
  mode: QuizMode;
  chapter?: string;
  items: PreparedQuestion[];
  timeLimitSec: number;
  startedAt: number;
};

function prepare(questions: Question[]): PreparedQuestion[] {
  return questions.map((q) => {
    const order = shuffle(q.choices.map((_, i) => i));
    return { question: q, choiceOrder: order };
  });
}

export function buildExam(count = EXAM_DEFAULTS.questionCount): QuizSession {
  const pool = ALL_QUESTIONS;
  const picked = sample(pool, Math.min(count, pool.length));
  return {
    mode: "exam",
    items: prepare(picked),
    timeLimitSec: EXAM_DEFAULTS.timeLimitSec,
    startedAt: Date.now(),
  };
}

export function buildPractice(chapterId: string, count?: number): QuizSession {
  const pool = questionsForChapter(chapterId);
  const picked = count ? sample(pool, Math.min(count, pool.length)) : shuffle(pool);
  return {
    mode: "practice",
    chapter: chapterId,
    items: prepare(picked),
    timeLimitSec: 0,
    startedAt: Date.now(),
  };
}

export function buildReview(): QuizSession | null {
  const ids = new Set(wrongIds());
  const pool = ALL_QUESTIONS.filter((q) => ids.has(q.id));
  if (pool.length === 0) return null;
  return {
    mode: "review",
    items: prepare(shuffle(pool)),
    timeLimitSec: 0,
    startedAt: Date.now(),
  };
}

export function isCorrect(q: Question, selectedOriginalIndexes: number[]): boolean {
  const a = [...q.correctAnswers].sort();
  const b = [...selectedOriginalIndexes].sort();
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

export function displayedToOriginal(order: ChoiceOrder, displayedIdx: number): number {
  return order[displayedIdx];
}
