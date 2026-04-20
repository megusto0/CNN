import { useState, useEffect } from "react";
import PageHeader from "../components/layout/PageHeader";
import { load, save, KEYS } from "../lib/storage";

interface CheckItem {
  id: string;
  title: string;
  hint: string;
}

const items: CheckItem[] = [
  {
    id: "task",
    title: "Постановка задачи с уравнениями размеров карт признаков",
    hint: "Опишите задачу классификации и покажите расчёт размеров карт признаков через формулу ((W − K + 2P) / S) + 1.",
  },
  {
    id: "cnn-scratch",
    title: "Реализация CNN с нуля (ноутбук, листинг, обучение)",
    hint: "Полный код вашей собственной архитектуры CNN, процесс обучения, выбранные гиперпараметры.",
  },
  {
    id: "feature-extractor",
    title: "Реализация feature extractor на базе предобученной сети",
    hint: "Замороженная предобученная модель + обучаемый классификатор сверху.",
  },
  {
    id: "fine-tuning",
    title: "Реализация fine-tuning с разморозкой последних блоков",
    hint: "Разморожены последние слои backbone, используется меньший learning rate.",
  },
  {
    id: "curves",
    title: "Графики train/val loss и accuracy за эпохи",
    hint: "Для каждого из трёх подходов — отдельные графики или совмещённые.",
  },
  {
    id: "confusion",
    title: "Матрица ошибок на тестовой выборке",
    hint: "Confusion matrix лучшей модели на удержанной тестовой выборке.",
  },
  {
    id: "summary-table",
    title: "Сводная таблица трёх решений по метрикам",
    hint: "CNN с нуля vs Feature extractor vs Fine-tuning: accuracy, F1, время обучения.",
  },
  {
    id: "failures",
    title: "Раздел «что не сработало» с честным разбором ошибок",
    hint: "Опишите неудачные эксперименты, переобучение, неверные гиперпараметры.",
  },
  {
    id: "questions",
    title: "Ответы на контрольные вопросы (минимум 10)",
    hint: "Развёрнутые ответы на контрольные вопросы из раздела «Задание».",
  },
  {
    id: "repo",
    title: "Ссылка на репозиторий с кодом",
    hint: "GitHub или GitLab репозиторий с ноутбуками и скриптами.",
  },
];

const URL_RE = /^https:\/\/(github|gitlab)\.com\/[^/]+\/[^/]+\/?$/;

export default function Submit() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [repoUrl, setRepoUrl] = useState("");
  const [urlError, setUrlError] = useState("");

  useEffect(() => {
    const saved = load<Record<string, boolean>>(KEYS.submission);
    if (saved) setChecked(saved);
  }, []);

  useEffect(() => {
    save(KEYS.submission, checked);
  }, [checked]);

  function toggle(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const done = Object.values(checked).filter(Boolean).length;
  const total = items.length;
  const pct = Math.round((done / total) * 100);
  const circumference = 2 * Math.PI * 20;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  function validateUrl() {
    if (!repoUrl) {
      setUrlError("");
      return;
    }
    setUrlError(URL_RE.test(repoUrl) ? "" : "Формат: https://github.com/owner/repo или https://gitlab.com/owner/repo");
  }

  function checkReadiness() {
    const unchecked = items.filter((item) => !checked[item.id]);
    if (unchecked.length === 0) {
      return "Все пункты отмечены. Отчёт готов к сдаче.";
    }
    return `Не выполнено: ${unchecked.map((i) => i.title).join(", ")}`;
  }

  return (
    <div>
      <PageHeader title="Проверка готовности отчёта" />
      <p
        className="text-sm max-w-prose mb-6"
        style={{ color: "var(--text-secondary)" }}
      >
        Отметьте выполненные пункты. Состояние сохраняется локально в браузере.
        Это самопроверка, а не сдача — работу вы сдаёте через репозиторий.
      </p>

      <div className="flex items-center gap-4 mb-8">
        <svg width="56" height="56" viewBox="0 0 56 56" aria-label={`Прогресс: ${pct}%`}>
          <circle
            cx="28"
            cy="28"
            r="20"
            fill="none"
            stroke="var(--border-subtle)"
            strokeWidth="4"
          />
          <circle
            cx="28"
            cy="28"
            r="20"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 28 28)"
            style={{ transition: "stroke-dashoffset 0.4s ease-out" }}
          />
          <text
            x="28"
            y="28"
            textAnchor="middle"
            dominantBaseline="central"
            fill="var(--text-primary)"
            fontSize="11"
            fontFamily="JetBrains Mono, monospace"
            fontWeight="500"
          >
            {pct}%
          </text>
        </svg>
        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {done} из {total} выполнено
        </span>
      </div>

      <div className="flex flex-col gap-3 mb-8">
        {items.map((item) => (
          <label
            key={item.id}
            className="flex items-start gap-3 p-4 rounded-md border cursor-pointer transition-colors"
            style={{
              backgroundColor: "var(--bg-raised)",
              borderColor: checked[item.id]
                ? "var(--accent)"
                : "var(--border-subtle)",
            }}
          >
            <input
              type="checkbox"
              checked={!!checked[item.id]}
              onChange={() => toggle(item.id)}
              className="mt-0.5 accent-[var(--accent)]"
            />
            <div className="flex-1">
              <div
                className="text-sm font-medium"
                style={{
                  color: checked[item.id]
                    ? "var(--text-primary)"
                    : "var(--text-secondary)",
                }}
              >
                {item.title}
              </div>
              <details className="mt-1">
                <summary
                  className="text-xs cursor-pointer"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Подсказка
                </summary>
                <p
                  className="text-xs mt-1"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {item.hint}
                </p>
              </details>
            </div>
          </label>
        ))}
      </div>

      <section className="mb-6">
        <label
          className="block text-sm font-medium mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          Ссылка на ваш репозиторий
        </label>
        <input
          type="url"
          value={repoUrl}
          onChange={(e) => {
            setRepoUrl(e.target.value);
            setUrlError("");
          }}
          onBlur={validateUrl}
          placeholder="https://github.com/owner/repo"
          className="w-full max-w-md px-3 py-2 rounded-md border text-sm"
          style={{
            backgroundColor: "var(--bg-sunken)",
            borderColor: urlError ? "var(--negative)" : "var(--border-subtle)",
            color: "var(--text-primary)",
          }}
        />
        {urlError && (
          <p className="mt-1 text-xs" style={{ color: "var(--negative)" }}>
            {urlError}
          </p>
        )}
      </section>

      <button
        onClick={() => alert(checkReadiness())}
        className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
        style={{
          backgroundColor: "var(--accent)",
          color: "var(--accent-fg)",
        }}
      >
        Проверить готовность
      </button>
    </div>
  );
}
