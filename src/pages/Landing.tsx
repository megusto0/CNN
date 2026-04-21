import { ArrowRight, Clock, GraduationCap, LineChart, PlayCircle } from "lucide-react";
import { Link } from "react-router-dom";
import StatusTag from "../components/tour/StatusTag";
import { stepMetas } from "../tour/steps";

export default function Landing() {
  return (
    <main className="min-h-dvh" style={{ backgroundColor: "var(--bg-base)" }}>
      <section className="mx-auto grid min-h-dvh max-w-6xl content-center gap-10 px-4 py-12 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_25rem] lg:items-end">
          <div>
            <div className="mb-5 flex flex-wrap gap-2">
              <StatusTag kind="interactive" />
              <StatusTag kind="live" />
              <StatusTag kind="replay" />
            </div>
            <h1 className="max-w-4xl text-4xl font-semibold leading-tight md:text-6xl" style={{ color: "var(--text-primary)" }}>
              Лабораторная №N · CNN
            </h1>
            <p className="mt-5 max-w-[68ch] text-lg" style={{ color: "var(--text-secondary)" }}>
              Линейный стенд по свёрточным сетям: от движения ядра по пикселям до transfer learning, записи реального обучения CIFAR-10 и готового Markdown-отчета.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/1"
                className="inline-flex items-center gap-2 rounded-md px-5 py-3 text-sm font-semibold"
                style={{ backgroundColor: "var(--accent)", color: "var(--accent-fg)" }}
              >
                <PlayCircle size={18} />
                Начать
              </Link>
              <Link
                to="/glossary"
                className="inline-flex items-center gap-2 rounded-md border px-5 py-3 text-sm"
                style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}
              >
                Глоссарий
              </Link>
            </div>
          </div>
          <div className="rounded-md border p-5" style={{ backgroundColor: "var(--bg-raised)", borderColor: "var(--border-subtle)" }}>
            <div className="grid gap-4">
              {[
                [Clock, "Время", "примерно 90 минут на стенд + 25 минут Colab"],
                [GraduationCap, "Задача", "CIFAR-10, 10 классов, три конфигурации"],
                [LineChart, "Выход", "results.json, анализ ошибок, report.md"],
              ].map(([Icon, title, text]) => {
                const Component = Icon as typeof Clock;
                return (
                  <div key={title as string} className="grid grid-cols-[2rem_1fr] gap-3">
                    <Component size={20} style={{ color: "var(--accent)" }} />
                    <div>
                      <p className="text-sm font-semibold">{title as string}</p>
                      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{text as string}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
          {stepMetas.map((step) => (
            <Link
              key={step.id}
              to={`/${step.id}`}
              className="group rounded-md border p-4"
              style={{ backgroundColor: "var(--bg-raised)", borderColor: "var(--border-subtle)" }}
            >
              <span className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>Шаг {step.id}</span>
              <h2 className="mt-1 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{step.title}</h2>
              <p className="mt-2 line-clamp-3 text-sm" style={{ color: "var(--text-secondary)" }}>{step.goal}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs" style={{ color: "var(--accent)" }}>
                открыть <ArrowRight size={13} />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
