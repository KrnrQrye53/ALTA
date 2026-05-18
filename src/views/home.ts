import { ALL_QUESTIONS, CHAPTERS, questionsForChapter } from "../data/chapters";
import { wrongIds } from "../lib/storage";

export function renderHome(root: HTMLElement): void {
  const wrongCount = wrongIds().length;
  const total = ALL_QUESTIONS.length;

  const chapterRows = CHAPTERS.map((ch) => {
    const count = questionsForChapter(ch.id).length;
    return `
      <li class="chapter-row">
        <a class="chapter-link" href="#/quiz?mode=practice&chapter=${encodeURIComponent(ch.id)}">
          <span class="chapter-id">第${ch.id}章</span>
          <span class="chapter-name">${escapeHtml(ch.name)}</span>
          <span class="chapter-count">${count}問</span>
        </a>
      </li>
    `;
  }).join("");

  root.innerHTML = `
    <header class="app-header">
      <h1>JSTQB AL TA 模擬試験</h1>
      <p class="subtitle">登録問題数: ${total}問 / 誤答ストック: ${wrongCount}問</p>
    </header>
    <main class="home">
      <section class="mode-grid">
        <a class="mode-card mode-exam" href="#/quiz?mode=exam">
          <h2>模擬試験を始める</h2>
          <p>40問 / 180分（本番形式・時間制限あり）</p>
        </a>
        <a class="mode-card mode-review ${wrongCount === 0 ? "is-disabled" : ""}"
           href="${wrongCount === 0 ? "#/" : "#/quiz?mode=review"}">
          <h2>誤答を復習する</h2>
          <p>${wrongCount === 0 ? "誤答ストックはまだありません" : `${wrongCount}問を再出題`}</p>
        </a>
        <a class="mode-card mode-history" href="#/history">
          <h2>学習履歴を見る</h2>
          <p>過去のスコアと章別正答率</p>
        </a>
      </section>

      <section class="chapters">
        <h2>分野別練習</h2>
        <ul class="chapter-list">${chapterRows}</ul>
      </section>
    </main>
    <footer class="app-footer">
      <small>© JSTQB AL TA 自習用クイズ</small>
    </footer>
  `;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
