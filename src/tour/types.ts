export type StatusKind = "live" | "interactive" | "replay";

export type ChoiceQuestion = {
  kind: "choice";
  prompt: string;
  options: string[];
  correct: number;
  explanation: string;
};

export type NumberQuestion = {
  kind: "number";
  prompt: string;
  correct: number;
  tolerance?: number;
  explanation: string;
};

export type ShapeQuestion = {
  kind: "shape";
  prompt: string;
  correct: [number, number, number, number];
  explanation: string;
};

export type OpenQuestion = {
  kind: "open";
  prompt: string;
  rubric: string;
  minLength?: number;
};

export type Question = ChoiceQuestion | NumberQuestion | ShapeQuestion | OpenQuestion;

export type StepMeta = {
  id: number;
  title: string;
  goal: string;
  idea: string[];
  codeTitle?: "ФОРМУЛА И КОД" | "КОД" | "В ДЕТАЛЯХ";
  code?: string;
  codeLanguage?: string;
  codeNotes?: string[];
  checks: Question[];
  statuses: StatusKind[];
};

export type ProgressState = {
  currentStep: number;
  stepsVisited: number[];
  stepsCompleted: number[];
  answers: Record<string, unknown>;
};
