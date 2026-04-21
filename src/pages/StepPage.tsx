import { Navigate, useParams } from "react-router-dom";
import CodeBlock from "../components/tour/CodeBlock";
import ConceptCheck from "../components/tour/ConceptCheck";
import StepChrome from "../components/tour/StepChrome";
import { StepVisualization } from "../features/guided/StepVisualizations";
import { useVisitStep } from "../tour/progress";
import { getStepMeta } from "../tour/steps";

export default function StepPage() {
  const params = useParams();
  const id = Number(params.stepId);
  const step = getStepMeta(id);
  useVisitStep(Number.isFinite(id) ? id : 1);

  if (!step) return <Navigate to="/1" replace />;

  return (
    <StepChrome step={step}>
      <div className="grid gap-8">
        <SectionCaption label="ИДЕЯ" />
        <div className="grid max-w-[68ch] gap-4 text-base" style={{ color: "var(--text-secondary)" }}>
          {step.idea.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <SectionCaption label="ВИЗУАЛИЗАЦИЯ" />
        <StepVisualization stepId={step.id} />

        <SectionCaption label={step.codeTitle ?? "ФОРМУЛА И КОД"} />
        {step.code ? (
          <CodeBlock code={step.code} language={step.codeLanguage} notes={step.codeNotes} />
        ) : (
          <div
            className="rounded-md border p-4 text-sm"
            style={{ backgroundColor: "var(--bg-raised)", borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}
          >
            Конкретные детали этого шага находятся в интерактивном блоке выше.
          </div>
        )}

        <SectionCaption label="ПРОВЕРЬ СЕБЯ" />
        <ConceptCheck key={step.id} stepId={step.id} questions={step.checks} />
      </div>
    </StepChrome>
  );
}

function SectionCaption({ label }: { label: string }) {
  return (
    <div className="mt-2 flex items-center gap-3">
      <span className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-tertiary)" }}>
        {label}
      </span>
      <span className="h-px flex-1" style={{ backgroundColor: "var(--border-subtle)" }} />
    </div>
  );
}
