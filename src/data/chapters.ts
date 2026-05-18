import type { Question } from "../types";
import ch1 from "./chapters/ch1.json";
import ch2 from "./chapters/ch2.json";
import ch3 from "./chapters/ch3.json";
import ch4 from "./chapters/ch4.json";
import ch5 from "./chapters/ch5.json";
import ch6 from "./chapters/ch6.json";

export type ChapterMeta = {
  id: string;
  name: string;
};

export const CHAPTERS: ChapterMeta[] = [
  { id: "1", name: "テスト分析プロセス" },
  { id: "2", name: "テストマネジメントにおけるテストアナリストの責務" },
  { id: "3", name: "テスト技法" },
  { id: "4", name: "ソフトウェア品質特性のテスト" },
  { id: "5", name: "レビュー" },
  { id: "6", name: "テストツールと自動化" },
];

export const ALL_QUESTIONS: Question[] = [
  ...(ch1 as Question[]),
  ...(ch2 as Question[]),
  ...(ch3 as Question[]),
  ...(ch4 as Question[]),
  ...(ch5 as Question[]),
  ...(ch6 as Question[]),
];

export function questionsForChapter(chapterId: string): Question[] {
  return ALL_QUESTIONS.filter((q) => q.chapter === chapterId);
}
