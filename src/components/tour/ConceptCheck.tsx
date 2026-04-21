import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { answerKey, useProgress } from "../../tour/progress";
import type { Question } from "../../tour/types";

type ConceptCheckProps = {
  stepId: number;
  questions: Question[];
};

type LocalAnswer = string | number | number[] | null;

export default function ConceptCheck({ stepId, questions }: ConceptCheckProps) {
  const { progress, setAnswer, setStepCompleted } = useProgress();
  const initial = useMemo(
    () => questions.map((_, index) => progress.answers[answerKey(stepId, index)] as LocalAnswer | undefined ?? null),
    [progress.answers, questions, stepId],
  );
  const [answers, setAnswers] = useState<LocalAnswer[]>(() => initial);
  const [submitted, setSubmitted] = useState<boolean[]>(() => questions.map((_, index) => initial[index] != null));

  useEffect(() => {
    setStepCompleted(stepId, questions.length > 0 && submitted.every(Boolean));
  }, [questions.length, setStepCompleted, stepId, submitted]);

  function updateAnswer(index: number, value: LocalAnswer) {
    setAnswers((current) => current.map((answer, i) => (i === index ? value : answer)));
  }

  function submit(index: number) {
    const value = answers[index];
    if (value == null || value === "") return;
    setSubmitted((current) => current.map((state, i) => (i === index ? true : state)));
    setAnswer(stepId, index, value);
  }

  function reset(index: number) {
    setSubmitted((current) => current.map((state, i) => (i === index ? false : state)));
  }

  return (
    <div className="grid gap-3">
      {questions.map((question, index) => {
        const value = answers[index];
        const wasSubmitted = submitted[index];
        const correct = wasSubmitted ? isCorrect(question, value) : null;
        return (
          <article
            key={question.prompt}
            className="rounded-md border p-4"
            style={{
              backgroundColor: "var(--bg-raised)",
              borderColor: correct == null
                ? "var(--border-subtle)"
                : correct
                  ? "rgba(74,222,128,0.45)"
                  : "rgba(251,191,36,0.45)",
            }}
          >
            <div className="mb-3 flex items-start justify-between gap-4">
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {index + 1}. {question.prompt}
              </p>
              {correct != null && (
                <span style={{ color: correct ? "var(--positive)" : "var(--warning)" }}>
                  {correct ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                </span>
              )}
            </div>

            {question.kind === "choice" && (
              <div className="grid gap-2 sm:grid-cols-2">
                {question.options.map((option, optionIndex) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => updateAnswer(index, optionIndex)}
                    className="rounded-md border px-3 py-2 text-left text-sm"
                    style={{
                      backgroundColor: value === optionIndex ? "rgba(124,155,255,0.12)" : "var(--bg-sunken)",
                      borderColor: value === optionIndex ? "rgba(124,155,255,0.45)" : "var(--border-subtle)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {question.kind === "number" && (
              <input
                type="number"
                value={typeof value === "number" || typeof value === "string" ? value : ""}
                onChange={(event) => updateAnswer(index, event.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
                style={{
                  backgroundColor: "var(--bg-sunken)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
              />
            )}

            {question.kind === "shape" && (
              <div className="grid grid-cols-4 gap-2">
                {["B", "C", "H", "W"].map((label, shapeIndex) => {
                  const shapeValue = Array.isArray(value) ? value[shapeIndex] ?? "" : "";
                  return (
                    <label key={label} className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                      {label}
                      <input
                        type="number"
                        value={shapeValue}
                        onChange={(event) => {
                          const next = Array.isArray(value) ? [...value] : [1, 0, 0, 0];
                          next[shapeIndex] = Number(event.target.value);
                          updateAnswer(index, next);
                        }}
                        className="mt-1 w-full rounded-md border px-2 py-2 text-sm"
                        style={{
                          backgroundColor: "var(--bg-sunken)",
                          borderColor: "var(--border-subtle)",
                          color: "var(--text-primary)",
                        }}
                      />
                    </label>
                  );
                })}
              </div>
            )}

            {question.kind === "open" && (
              <textarea
                value={typeof value === "string" ? value : ""}
                onChange={(event) => updateAnswer(index, event.target.value)}
                rows={4}
                className="w-full resize-y rounded-md border px-3 py-2 text-sm"
                style={{
                  backgroundColor: "var(--bg-sunken)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
              />
            )}

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => submit(index)}
                className="rounded-md px-3 py-1.5 text-sm font-medium"
                style={{ backgroundColor: "var(--accent)", color: "var(--accent-fg)" }}
              >
                Ответить
              </button>
              {wasSubmitted && !correct && (
                <button
                  type="button"
                  onClick={() => reset(index)}
                  className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <RotateCcw size={14} />
                  Еще раз
                </button>
              )}
            </div>

            {wasSubmitted && (
              <p className="mt-3 text-sm" style={{ color: correct ? "var(--positive)" : "var(--warning)" }}>
                {question.kind === "open" ? question.rubric : question.explanation}
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
}

function isCorrect(question: Question, value: LocalAnswer): boolean {
  if (value == null) return false;
  if (question.kind === "choice") {
    return Number(value) === question.correct;
  }
  if (question.kind === "number") {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return false;
    return Math.abs(parsed - question.correct) <= (question.tolerance ?? 0);
  }
  if (question.kind === "shape") {
    if (!Array.isArray(value)) return false;
    return question.correct.every((target, index) => Number(value[index]) === target);
  }
  if (question.kind === "open") {
    return typeof value === "string" && value.trim().length >= (question.minLength ?? 1);
  }
  return false;
}
