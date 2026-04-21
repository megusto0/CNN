import { ChevronLeft, ChevronRight, HelpCircle, Save } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useProgress } from "../../tour/progress";
import { STEP_COUNT, stepMetas } from "../../tour/steps";
import type { StepMeta } from "../../tour/types";
import StatusTag from "./StatusTag";

type StepChromeProps = {
  step: StepMeta;
  children: ReactNode;
};

export default function StepChrome({ step, children }: StepChromeProps) {
  const navigate = useNavigate();
  const { progress } = useProgress();
  const previous = step.id > 1 ? step.id - 1 : null;
  const next = step.id < STEP_COUNT ? step.id + 1 : null;
  const completedSet = new Set(progress.stepsCompleted);
  const percent = Math.round((step.id / STEP_COUNT) * 100);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if ((event.key === "ArrowLeft" || event.key.toLowerCase() === "k") && previous) {
        navigate(`/${previous}`);
      }
      if ((event.key === "ArrowRight" || event.key.toLowerCase() === "j") && next) {
        navigate(`/${next}`);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigate, next, previous]);

  return (
    <div className="min-h-dvh" style={{ backgroundColor: "var(--bg-base)" }}>
      <header
        className="sticky top-0 z-30 flex items-center justify-between border-b px-4 py-3 lg:px-8"
        style={{ backgroundColor: "rgba(17,19,24,0.96)", borderColor: "var(--border-subtle)" }}
      >
        <Link to="/" className="flex items-center gap-3 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          <span
            className="grid h-8 w-8 place-items-center rounded-md border font-mono text-xs"
            style={{
              backgroundColor: "var(--bg-sunken)",
              borderColor: "var(--border-strong)",
              color: "var(--accent)",
            }}
          >
            CNN
          </span>
          <span>Лабораторная №N · CNN</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/glossary"
            aria-label="Глоссарий"
            className="rounded-md p-2"
            style={{ color: "var(--text-secondary)" }}
          >
            <HelpCircle size={18} />
          </Link>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
            style={{
              backgroundColor: "var(--bg-sunken)",
              borderColor: "var(--border-subtle)",
              color: "var(--text-secondary)",
            }}
            onClick={() => {
              const blob = new Blob([localStorage.getItem("cnn-lab/progress") ?? "{}"], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const anchor = document.createElement("a");
              anchor.href = url;
              anchor.download = "cnn-lab-progress.json";
              anchor.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Save size={16} />
            сохранить
          </button>
        </div>
      </header>

      <div className="grid lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside
          className="hidden min-h-[calc(100dvh-57px)] border-r px-4 py-6 lg:block"
          style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-sunken)" }}
        >
          <nav aria-label="Шаги лабораторной" className="sticky top-24 grid gap-1">
            {stepMetas.map((item) => {
              const active = item.id === step.id;
              const complete = completedSet.has(item.id);
              return (
                <Link
                  key={item.id}
                  to={`/${item.id}`}
                  className="grid grid-cols-[1rem_1fr] gap-3 rounded-md px-3 py-2 text-sm"
                  style={{
                    backgroundColor: active ? "rgba(124,155,255,0.12)" : "transparent",
                    color: active ? "var(--text-primary)" : "var(--text-secondary)",
                  }}
                >
                  <span
                    className="mt-1 h-2.5 w-2.5 rounded-full border"
                    style={{
                      backgroundColor: complete ? "var(--positive)" : "transparent",
                      borderColor: complete ? "var(--positive)" : "var(--border-strong)",
                    }}
                  />
                  <span>
                    <span className="block text-xs" style={{ color: active ? "var(--accent)" : "var(--text-tertiary)" }}>
                      Шаг {item.id}
                    </span>
                    {item.title}
                  </span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="mx-auto w-full max-w-6xl px-4 py-8 lg:px-10">
          <div className="mb-8">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {stepMetas.map((item) => {
                  const active = item.id === step.id;
                  const complete = completedSet.has(item.id);
                  return (
                    <Link
                      key={item.id}
                      to={`/${item.id}`}
                      aria-label={`Шаг ${item.id}: ${item.title}`}
                      className="rounded-full"
                      style={{
                        width: active ? 12 : 8,
                        height: active ? 12 : 8,
                        backgroundColor: active || complete ? "var(--accent)" : "var(--border-strong)",
                      }}
                    />
                  );
                })}
              </div>
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Шаг {step.id} из {STEP_COUNT} · {percent}%
              </span>
            </div>
            <div className="mb-3 flex flex-wrap gap-2">
              {step.statuses.map((kind) => (
                <StatusTag key={kind} kind={kind} />
              ))}
            </div>
            <h1 className="text-3xl font-semibold tracking-normal" style={{ color: "var(--text-primary)" }}>
              {step.title}
            </h1>
            <p className="mt-3 max-w-[68ch] text-base" style={{ color: "var(--text-secondary)" }}>
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>Цель шага:</span>{" "}
              {step.goal}
            </p>
          </div>

          {children}

          <div className="mt-10 flex items-center justify-between gap-4 border-t pt-6" style={{ borderColor: "var(--border-subtle)" }}>
            {previous ? (
              <Link
                to={`/${previous}`}
                className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm"
                style={{
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-secondary)",
                  backgroundColor: "var(--bg-sunken)",
                }}
              >
                <ChevronLeft size={16} />
                Шаг {previous}: {stepMetas[previous - 1].title}
              </Link>
            ) : <span />}
            {next ? (
              <Link
                to={`/${next}`}
                className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium"
                style={{ backgroundColor: "var(--accent)", color: "var(--accent-fg)" }}
              >
                Шаг {next}: {stepMetas[next - 1].title}
                <ChevronRight size={16} />
              </Link>
            ) : (
              <Link
                to="/11"
                className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium"
                style={{ backgroundColor: "var(--accent)", color: "var(--accent-fg)" }}
              >
                Отчет
              </Link>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
