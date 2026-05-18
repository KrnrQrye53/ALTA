import type { SessionRecord, WrongStat } from "../types";

const KEY_HISTORY = "alta:history";
const KEY_WRONG = "alta:wrong";

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadHistory(): SessionRecord[] {
  return readJSON<SessionRecord[]>(KEY_HISTORY, []);
}

export function appendHistory(record: SessionRecord): void {
  const list = loadHistory();
  list.push(record);
  writeJSON(KEY_HISTORY, list);
}

export function clearHistory(): void {
  localStorage.removeItem(KEY_HISTORY);
}

export function loadWrong(): Record<string, WrongStat> {
  return readJSON<Record<string, WrongStat>>(KEY_WRONG, {});
}

export function markWrong(id: string): void {
  const map = loadWrong();
  const now = Date.now();
  const prev = map[id];
  map[id] = {
    count: (prev?.count ?? 0) + 1,
    lastWrongAt: now,
  };
  writeJSON(KEY_WRONG, map);
}

export function clearWrong(id: string): void {
  const map = loadWrong();
  if (id in map) {
    delete map[id];
    writeJSON(KEY_WRONG, map);
  }
}

export function clearAllWrong(): void {
  localStorage.removeItem(KEY_WRONG);
}

export function wrongIds(): string[] {
  return Object.keys(loadWrong());
}
