import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { STEP_COUNT } from "./steps";
import type { ProgressState } from "./types";

const PROGRESS_KEY = "cnn-lab/progress";
const listeners = new Set<() => void>();

const emptyProgress: ProgressState = {
  currentStep: 1,
  stepsVisited: [],
  stepsCompleted: [],
  answers: {},
};

function normalizeProgress(value: Partial<ProgressState> | null): ProgressState {
  const currentStep = clampStep(value?.currentStep ?? 1);
  const stepsVisited = uniqueSteps(value?.stepsVisited ?? []);
  const stepsCompleted = uniqueSteps(value?.stepsCompleted ?? []);
  const answers = value?.answers && typeof value.answers === "object" ? value.answers : {};
  return { currentStep, stepsVisited, stepsCompleted, answers };
}

function clampStep(step: number): number {
  if (!Number.isFinite(step)) return 1;
  return Math.min(STEP_COUNT, Math.max(1, Math.round(step)));
}

function uniqueSteps(steps: number[]): number[] {
  return Array.from(new Set(steps.map(clampStep))).sort((a, b) => a - b);
}

function readProgress(): ProgressState {
  if (typeof localStorage === "undefined") return emptyProgress;
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return normalizeProgress(raw ? (JSON.parse(raw) as Partial<ProgressState>) : emptyProgress);
  } catch {
    return emptyProgress;
  }
}

function writeProgress(progress: ProgressState): void {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function snapshot(): string {
  return JSON.stringify(readProgress());
}

export function useProgress(): {
  progress: ProgressState;
  visitStep: (step: number) => void;
  setAnswer: (step: number, question: number, value: unknown) => void;
  setStepCompleted: (step: number, complete: boolean) => void;
} {
  const serialized = useSyncExternalStore(subscribe, snapshot, snapshot);
  const progress = useMemo(() => JSON.parse(serialized) as ProgressState, [serialized]);

  const update = useCallback((fn: (current: ProgressState) => ProgressState) => {
    writeProgress(fn(readProgress()));
  }, []);

  const visitStep = useCallback((step: number) => {
    update((current) => {
      const nextStep = clampStep(step);
      return normalizeProgress({
        ...current,
        currentStep: nextStep,
        stepsVisited: [...current.stepsVisited, nextStep],
      });
    });
  }, [update]);

  const setAnswer = useCallback((step: number, question: number, value: unknown) => {
    update((current) => ({
      ...current,
      answers: {
        ...current.answers,
        [`${step}:${question}`]: value,
      },
    }));
  }, [update]);

  const setStepCompleted = useCallback((step: number, complete: boolean) => {
    update((current) => {
      const currentSet = new Set(current.stepsCompleted);
      if (complete) {
        currentSet.add(clampStep(step));
      } else {
        currentSet.delete(clampStep(step));
      }
      return normalizeProgress({
        ...current,
        stepsCompleted: Array.from(currentSet),
      });
    });
  }, [update]);

  return { progress, visitStep, setAnswer, setStepCompleted };
}

export function useVisitStep(step: number): void {
  const { visitStep } = useProgress();
  useEffect(() => {
    visitStep(step);
  }, [step, visitStep]);
}

export function answerKey(step: number, question: number): string {
  return `${step}:${question}`;
}
