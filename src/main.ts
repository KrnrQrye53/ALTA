import "./styles.css";
import { renderHome } from "./views/home";
import { renderQuiz } from "./views/quiz";
import { renderHistory } from "./views/history";
import type { QuizMode } from "./types";

const root = document.getElementById("app")!;

type Route =
  | { name: "home" }
  | { name: "quiz"; mode: QuizMode; chapter?: string }
  | { name: "history" };

function parseRoute(hash: string): Route {
  const cleaned = hash.replace(/^#/, "").replace(/^\//, "");
  if (cleaned === "" || cleaned === "home") return { name: "home" };
  const [path, query = ""] = cleaned.split("?");
  if (path === "history") return { name: "history" };
  if (path === "quiz") {
    const params = new URLSearchParams(query);
    const mode = (params.get("mode") ?? "exam") as QuizMode;
    const chapter = params.get("chapter") ?? undefined;
    return { name: "quiz", mode, chapter };
  }
  return { name: "home" };
}

function render(): void {
  window.scrollTo(0, 0);
  const route = parseRoute(window.location.hash);
  switch (route.name) {
    case "home":
      renderHome(root);
      break;
    case "quiz":
      renderQuiz(root, { mode: route.mode, chapter: route.chapter });
      break;
    case "history":
      renderHistory(root);
      break;
  }
}

window.addEventListener("hashchange", render);
window.addEventListener("DOMContentLoaded", render);
if (document.readyState !== "loading") {
  render();
}
