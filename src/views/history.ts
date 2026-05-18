import { ALL_QUESTIONS, CHAPTERS } from "../data/chapters";
import { clearAllWrong, clearHistory, loadHistory } from "../lib/storage";

export function renderHistory(root: HTMLElement): void {
  const list = loadHistory().slice().reverse();

  const histRows = list.length
    ? list
        .map((r) => {
          const date = new Date(r.timestamp).toLocaleString("ja-JP", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          });
          const modeLabel = r.mode === "exam" ? "模試" : r.mode === "practice" ? "練習" : "復習";
          const rate = r.total === 0 ? 0 : Math.round((r.score / r.total) * 100);
          return `
            <tr>
              <td>${escapeHtml(date)}</td>
              <td><span class="mode-badge mode-${r.mode}">${modeLabel}</span></td>
              <td>${r.score} / ${r.total} (${rate}%)</td>
              <td>${formatDuration(r.durationSec)}</td>
            </tr>
          `;
        })
        .join("")
    : `<tr><td colspan="4" class="empty-cell">まだ記録がありません</td></tr>`;

  const wrongByChapter = countWrongsByChapter(list);
  const totalByChapter: Record<string, number> = {};
  for (const q of ALL_QUESTIONS) {
    totalByChapter[q.chapter] = (totalByChapter[q.chapter] ?? 0) + 1;
  }

  const chapterRows = CHAPTERS.map((ch) => {
    const wrong = wrongByChapter[ch.id] ?? 0;
    const total = totalByChapter[ch.id] ?? 0;
    return `
      <tr>
        <td>第${ch.id}章</td>
        <td>${escapeHtml(ch.name)}</td>
        <td>${wrong}</td>
        <td>${total}</td>
      </tr>
    `;
  }).join("");

  root.innerHTML = `
    <header class="app-header">
      <h1>学習履歴</h1>
      <p><a class="link-back" href="#/">← トップへ</a></p>
    </header>
    <main class="history">
      <section>
        <h2>セッション履歴（新しい順）</h2>
        <table class="hist-table">
          <thead><tr><th>日時</th><th>モード</th><th>スコア</th><th>所要</th></tr></thead>
          <tbody>${histRows}</tbody>
        </table>
      </section>

      <section>
        <h2>章ごとの累積誤答数（要復習の目安）</h2>
        <table class="chapter-table">
          <thead><tr><th>章</th><th>分野</th><th>累積誤答数</th><th>登録問題数</th></tr></thead>
          <tbody>${chapterRows}</tbody>
        </table>
      </section>

      <section class="danger-zone">
        <h2>データ管理</h2>
        <button class="btn btn-danger" id="btn-clear-hist">履歴をすべて削除</button>
        <button class="btn btn-danger" id="btn-clear-wrong">誤答ストックを削除</button>
      </section>
    </main>
  `;

  document.getElementById("btn-clear-hist")?.addEventListener("click", () => {
    if (confirm("学習履歴をすべて削除します。よろしいですか？")) {
      clearHistory();
      renderHistory(root);
    }
  });
  document.getElementById("btn-clear-wrong")?.addEventListener("click", () => {
    if (confirm("誤答ストックを削除します。復習対象が空になります。よろしいですか？")) {
      clearAllWrong();
      renderHistory(root);
    }
  });
}

function countWrongsByChapter(records: { wrongIds: string[] }[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of records) {
    for (const id of r.wrongIds) {
      const m = /^ch(\d+)-/.exec(id);
      if (!m) continue;
      const ch = m[1];
      out[ch] = (out[ch] ?? 0) + 1;
    }
  }
  return out;
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
