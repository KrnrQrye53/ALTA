import type { AnswerRecord, QuizMode, SessionRecord } from "../types";
import {
  buildExam,
  buildPractice,
  buildReview,
  isCorrect,
  type QuizSession,
} from "../lib/quizEngine";
import { appendHistory, clearWrong, markWrong } from "../lib/storage";

type QuizState = {
  session: QuizSession;
  index: number;
  answers: Map<string, number[]>;
  revealed: Set<string>;
  flagged: Set<string>;
  timerHandle?: number;
  finished: boolean;
};

export function renderQuiz(
  root: HTMLElement,
  params: { mode: QuizMode; chapter?: string },
): void {
  let session: QuizSession | null;
  if (params.mode === "exam") {
    session = buildExam();
  } else if (params.mode === "practice") {
    if (!params.chapter) {
      root.innerHTML = `<p class="empty">章が指定されていません。<a href="#/">トップへ</a></p>`;
      return;
    }
    session = buildPractice(params.chapter);
  } else {
    session = buildReview();
  }

  if (!session || session.items.length === 0) {
    root.innerHTML = `
      <main class="empty">
        <p>出題できる問題がありません。</p>
        <p><a class="btn" href="#/">トップへ戻る</a></p>
      </main>`;
    return;
  }

  const state: QuizState = {
    session,
    index: 0,
    answers: new Map(),
    revealed: new Set(),
    flagged: new Set(),
    finished: false,
  };

  renderShell(root, state);
}

function renderShell(root: HTMLElement, state: QuizState): void {
  root.innerHTML = `
    <div class="quiz">
      <div class="quiz-topbar" id="quiz-topbar"></div>
      <main class="quiz-main" id="quiz-main"></main>
      <nav class="quiz-bottom" id="quiz-bottom"></nav>
    </div>
  `;
  updateView(state);
  if (state.session.mode === "exam" && state.session.timeLimitSec > 0) {
    startTimer(state);
  }
}

function startTimer(state: QuizState): void {
  const tick = () => {
    if (state.finished) return;
    const elapsed = Math.floor((Date.now() - state.session.startedAt) / 1000);
    const remain = state.session.timeLimitSec - elapsed;
    const el = document.getElementById("quiz-timer");
    if (el) el.textContent = formatTime(Math.max(0, remain));
    if (remain <= 0) {
      finishQuiz(state, true);
      return;
    }
    state.timerHandle = window.setTimeout(tick, 500);
  };
  tick();
}

function updateView(state: QuizState): void {
  const top = document.getElementById("quiz-topbar")!;
  const main = document.getElementById("quiz-main")!;
  const bottom = document.getElementById("quiz-bottom")!;

  top.innerHTML = renderTopbar(state);
  main.innerHTML = renderQuestion(state);
  bottom.innerHTML = renderBottom(state);

  bindEvents(state);
}

function renderTopbar(state: QuizState): string {
  const total = state.session.items.length;
  const idx = state.index + 1;
  const modeLabel = labelOf(state.session.mode);
  const timer =
    state.session.mode === "exam" && state.session.timeLimitSec > 0
      ? `<span class="timer" id="quiz-timer">${formatTime(state.session.timeLimitSec)}</span>`
      : "";
  return `
    <a class="link-back" href="#/">← 中断してトップへ</a>
    <span class="mode-badge mode-${state.session.mode}">${modeLabel}</span>
    <span class="progress">${idx} / ${total}</span>
    ${timer}
  `;
}

function renderQuestion(state: QuizState): string {
  const item = state.session.items[state.index];
  const q = item.question;
  const selected = state.answers.get(q.id) ?? [];
  const revealed = state.revealed.has(q.id);
  const isMulti = q.correctAnswers.length > 1;

  const choicesHtml = item.choiceOrder
    .map((origIdx, displayedIdx) => {
      const isSelected = selected.includes(origIdx);
      const isAnswer = q.correctAnswers.includes(origIdx);
      const classes = ["choice"];
      if (isSelected) classes.push("is-selected");
      if (revealed && isAnswer) classes.push("is-correct");
      if (revealed && isSelected && !isAnswer) classes.push("is-wrong");
      const inputType = isMulti ? "checkbox" : "radio";
      return `
        <li>
          <button class="${classes.join(" ")}" data-orig="${origIdx}" data-displayed="${displayedIdx}" ${revealed ? "disabled" : ""}>
            <span class="choice-marker">${String.fromCharCode(65 + displayedIdx)}</span>
            <span class="choice-text">${escapeHtml(q.choices[origIdx])}</span>
            <span class="choice-input" data-type="${inputType}"></span>
          </button>
        </li>
      `;
    })
    .join("");

  const meta = `
    <div class="qmeta">
      <span class="qmeta-chip">第${q.chapter}章 ${escapeHtml(q.chapterName)}</span>
      ${q.kLevel ? `<span class="qmeta-chip kl">${q.kLevel}</span>` : ""}
      ${isMulti ? `<span class="qmeta-chip warn">複数選択</span>` : ""}
    </div>
  `;

  const explanation = revealed
    ? `<div class="explanation">
         <h3>解説</h3>
         <p>${escapeHtml(q.explanation)}</p>
       </div>`
    : "";

  return `
    <article class="question">
      ${meta}
      <h2 class="qbody">${escapeHtml(q.question)}</h2>
      <ul class="choices">${choicesHtml}</ul>
      ${explanation}
    </article>
  `;
}

function renderBottom(state: QuizState): string {
  const last = state.index === state.session.items.length - 1;
  const item = state.session.items[state.index];
  const q = item.question;
  const selected = state.answers.get(q.id) ?? [];
  const revealed = state.revealed.has(q.id);
  const flagged = state.flagged.has(q.id);
  const mode = state.session.mode;

  const flagBtn =
    mode === "exam"
      ? `<button class="btn btn-ghost" id="btn-flag">${flagged ? "🚩 フラグ解除" : "🚩 後で見直す"}</button>`
      : "";

  if (mode === "exam") {
    return `
      ${flagBtn}
      <button class="btn btn-secondary" id="btn-prev" ${state.index === 0 ? "disabled" : ""}>← 前へ</button>
      ${
        last
          ? `<button class="btn btn-primary" id="btn-submit">採点する</button>`
          : `<button class="btn btn-primary" id="btn-next">次へ →</button>`
      }
    `;
  }

  if (!revealed) {
    return `
      <button class="btn btn-primary" id="btn-check" ${selected.length === 0 ? "disabled" : ""}>解答する</button>
    `;
  }
  return `
    ${
      last
        ? `<button class="btn btn-primary" id="btn-finish">結果を見る</button>`
        : `<button class="btn btn-primary" id="btn-next">次の問題 →</button>`
    }
  `;
}

function bindEvents(state: QuizState): void {
  const item = state.session.items[state.index];
  const q = item.question;
  const isMulti = q.correctAnswers.length > 1;
  const revealed = state.revealed.has(q.id);

  document.querySelectorAll<HTMLButtonElement>(".choice").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (revealed) return;
      const orig = Number(btn.dataset.orig);
      const current = state.answers.get(q.id) ?? [];
      let next: number[];
      if (isMulti) {
        next = current.includes(orig)
          ? current.filter((v) => v !== orig)
          : [...current, orig];
      } else {
        next = [orig];
      }
      state.answers.set(q.id, next);
      updateView(state);
    });
  });

  document.getElementById("btn-next")?.addEventListener("click", () => {
    state.index = Math.min(state.index + 1, state.session.items.length - 1);
    updateView(state);
  });
  document.getElementById("btn-prev")?.addEventListener("click", () => {
    state.index = Math.max(state.index - 1, 0);
    updateView(state);
  });
  document.getElementById("btn-flag")?.addEventListener("click", () => {
    if (state.flagged.has(q.id)) state.flagged.delete(q.id);
    else state.flagged.add(q.id);
    updateView(state);
  });
  document.getElementById("btn-check")?.addEventListener("click", () => {
    state.revealed.add(q.id);
    const selected = state.answers.get(q.id) ?? [];
    const correct = isCorrect(q, selected);
    if (correct) {
      clearWrong(q.id);
    } else {
      markWrong(q.id);
    }
    updateView(state);
  });
  document.getElementById("btn-submit")?.addEventListener("click", () => {
    if (confirm("解答を提出して採点しますか？")) {
      finishQuiz(state, false);
    }
  });
  document.getElementById("btn-finish")?.addEventListener("click", () => {
    finishQuiz(state, false);
  });
}

function finishQuiz(state: QuizState, timeUp: boolean): void {
  state.finished = true;
  if (state.timerHandle) {
    clearTimeout(state.timerHandle);
  }
  const records: AnswerRecord[] = state.session.items.map((it) => {
    const sel = state.answers.get(it.question.id) ?? [];
    const ok = isCorrect(it.question, sel);
    return { questionId: it.question.id, selected: sel, isCorrect: ok };
  });

  // update wrong store for exam mode (practice/review update per question)
  if (state.session.mode === "exam") {
    for (const r of records) {
      if (r.isCorrect) clearWrong(r.questionId);
      else markWrong(r.questionId);
    }
  }

  const score = records.filter((r) => r.isCorrect).length;
  const total = records.length;
  const durationSec = Math.floor((Date.now() - state.session.startedAt) / 1000);
  const wrongs = records.filter((r) => !r.isCorrect).map((r) => r.questionId);

  if (state.session.mode !== "review") {
    const rec: SessionRecord = {
      timestamp: Date.now(),
      mode: state.session.mode,
      chapter: state.session.chapter,
      score,
      total,
      durationSec,
      wrongIds: wrongs,
    };
    appendHistory(rec);
  }

  renderResult(state, records, score, total, durationSec, timeUp);
}

function renderResult(
  state: QuizState,
  records: AnswerRecord[],
  score: number,
  total: number,
  durationSec: number,
  timeUp: boolean,
): void {
  const root = document.getElementById("app")!;
  const rate = total === 0 ? 0 : Math.round((score / total) * 100);

  // breakdown per chapter
  const byChapter: Record<string, { name: string; correct: number; total: number }> = {};
  state.session.items.forEach((it, i) => {
    const q = it.question;
    const r = records[i];
    if (!byChapter[q.chapter]) {
      byChapter[q.chapter] = { name: q.chapterName, correct: 0, total: 0 };
    }
    byChapter[q.chapter].total += 1;
    if (r.isCorrect) byChapter[q.chapter].correct += 1;
  });
  const chapterRows = Object.entries(byChapter)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, v]) => {
      const pct = Math.round((v.correct / v.total) * 100);
      return `<tr><td>第${id}章</td><td>${escapeHtml(v.name)}</td><td>${v.correct} / ${v.total}</td><td>${pct}%</td></tr>`;
    })
    .join("");

  const wrongs = records
    .map((r, i) => ({ r, q: state.session.items[i].question }))
    .filter((x) => !x.r.isCorrect);
  const wrongsHtml = wrongs.length
    ? `
      <details class="wrong-list">
        <summary>誤答 ${wrongs.length} 問を確認する</summary>
        <ol>
          ${wrongs
            .map(
              (x) => `
            <li>
              <p class="wrong-q">${escapeHtml(x.q.question)}</p>
              <p class="wrong-a">正解: ${x.q.correctAnswers.map((i) => String.fromCharCode(65 + i)).join(", ")} - ${escapeHtml(x.q.correctAnswers.map((i) => x.q.choices[i]).join(" / "))}</p>
              <p class="wrong-exp">${escapeHtml(x.q.explanation)}</p>
            </li>
          `,
            )
            .join("")}
        </ol>
      </details>`
    : `<p class="all-correct">🎉 全問正解です！</p>`;

  root.innerHTML = `
    <header class="app-header">
      <h1>結果</h1>
    </header>
    <main class="result">
      ${timeUp ? `<p class="time-up">⏰ 時間切れで自動採点しました</p>` : ""}
      <div class="result-score">
        <div class="score-big">${score} <span>/ ${total}</span></div>
        <div class="score-pct">正答率 ${rate}% ・ 所要 ${formatDuration(durationSec)}</div>
      </div>
      <h2>章別の内訳</h2>
      <table class="chapter-table">
        <thead><tr><th>章</th><th>分野</th><th>正答</th><th>正答率</th></tr></thead>
        <tbody>${chapterRows}</tbody>
      </table>
      ${wrongsHtml}
      <div class="result-actions">
        <a class="btn btn-primary" href="#/">トップへ戻る</a>
        <a class="btn btn-secondary" href="#/history">学習履歴を見る</a>
      </div>
    </main>
  `;
}

function labelOf(mode: QuizMode): string {
  switch (mode) {
    case "exam":
      return "模擬試験";
    case "practice":
      return "分野別練習";
    case "review":
      return "誤答復習";
  }
}

function formatTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function formatDuration(sec: number): string {
  if (sec < 60) return `${sec}秒`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s === 0 ? `${m}分` : `${m}分${s}秒`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
