import { useState, useEffect, useRef, useCallback } from "react";
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
    title: "Постановка задачи и формулы размеров карт признаков",
    hint: "Опишите задачу классификации CIFAR-10 и покажите расчёт размеров карт признаков через формулу ((W − K + 2P) / S) + 1.",
  },
  {
    id: "cnn-scratch",
    title: "Реализация CNN с нуля (архитектура из методички, обучение на CIFAR-10)",
    hint: "Полный код SimpleCNN, процесс обучения, выбранные гиперпараметры.",
  },
  {
    id: "feature-extractor",
    title: "Реализация ResNet-18 как feature extractor (заморозка + новый fc)",
    hint: "Замороженный ResNet-18 + обучаемый fc на 10 классов.",
  },
  {
    id: "fine-tuning",
    title: "Реализация ResNet-18 с fine-tuning (разморозка layer4 + fc, две группы LR)",
    hint: "Разморожены layer4 и fc, две группы параметров с разными LR.",
  },
  {
    id: "curves",
    title: "Графики train/val loss и accuracy для всех трёх моделей",
    hint: "Для каждой из трёх моделей — отдельные графики или совмещённые.",
  },
  {
    id: "confusion",
    title: "Матрицы ошибок на тестовой выборке (3 штуки)",
    hint: "Confusion matrix каждой модели на тестовой выборке CIFAR-10.",
  },
  {
    id: "summary-table",
    title: "Сводная таблица: параметры, test acc, время/эпоху, эпох до сходимости",
    hint: "Сводная таблица трёх подходов: CNN, Feature extractor, Fine-tuning.",
  },
  {
    id: "failures",
    title: "Раздел «что не сработало» с честным разбором ошибок и тупиков",
    hint: "Опишите неудачные эксперименты, переобучение, неверные гиперпараметры.",
  },
  {
    id: "questions",
    title: "Ответы на 10 контрольных вопросов",
    hint: "Развёрнутые ответы на контрольные вопросы из раздела «Задание».",
  },
  {
    id: "repo",
    title: "Ссылка на репозиторий с кодом, ноутбуками и README",
    hint: "GitHub или GitLab репозиторий с ноутбуками и скриптами.",
  },
];

const URL_RE = /^https:\/\/(github|gitlab)\.com\/[^\/]+\/[^\/]+\/?$/;

export default function Submit() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [repoUrl, setRepoUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [pulseIds, setPulseIds] = useState<Set<string>>(new Set());
  const itemRefs = useRef<Record<string, HTMLLabelElement | null>>({});

  useEffect(() => {
    const saved = load<Record<string, boolean>>(KEYS.submission);
    if (saved) setChecked(saved);
  }, []);

  useEffect(() => {
    save(KEYS.submission, checked);
  }, [checked]);

  const toggle = useCallback((id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const done = Object.values(checked).filter(Boolean).length;
  const total = items.length;
  const pct = Math.round((done / total) * 100);
  const circumference = 2 * Math.PI * 20;
  const strokeDashoffset = circumference - (pct / 100) * circumference;
  const allDone = done === total;

  function validateUrl() {
    if (!repoUrl) {
      setUrlError("");
      return;
    }
    setUrlError(
      URL_RE.test(repoUrl)
        ? ""
        : "Формат: https://github.com/owner/repo или https://gitlab.com/owner/repo"
    );
  }

  function checkReadiness() {
    const unchecked = items.filter((item) => !checked[item.id]);
    if (unchecked.length === 0) return;
    const ids = unchecked.map((i) => i.id);
    setPulseIds(new Set(ids));
    setTimeout(() => setPulseIds(new Set()), 600);
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
        <svg
          width="56"
          height="56"
          viewBox="0 0 56 56"
          aria-label={`Прогресс: ${pct}%`}
        >
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
            stroke={allDone ? "var(--positive)" : "var(--accent)"}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 28 28)"
            style={{ transition: "stroke-dashoffset 0.4s ease-out, stroke 0.3s ease" }}
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

      <style>{`
        @keyframes pulse-red {
          0%, 100% { border-color: var(--border-subtle); }
          30% { border-color: var(--negative); }
          60% { border-color: var(--negative); }
        }
        .pulse-item {
          animation: pulse-red 600ms ease;
        }
      `}</style>

      <div className="flex flex-col gap-3 mb-8">
        {items.map((item) => (
          <label
            key={item.id}
            ref={(el) => { itemRefs.current[item.id] = el; }}
            className={[
              "flex items-start gap-3 p-4 rounded-md border cursor-pointer transition-colors",
              pulseIds.has(item.id) ? "pulse-item" : "",
            ].join(" ")}
            style={{
              backgroundColor: "var(--bg-raised)",
              borderColor: checked[item.id]
                ? allDone
                  ? "var(--positive)"
                  : "var(--accent)"
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
        onClick={checkReadiness}
        className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
        style={{
          backgroundColor: "var(--accent)",
          color: "var(--accent-fg)",
        }}
      >
        проверить готовность
      </button>
    </div>
  );
}
