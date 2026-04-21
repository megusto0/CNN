import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getStepMeta } from "../tour/steps";

const titles: Record<string, string> = {
  "": "Лабораторная №N — CNN Lab Stand",
  glossary: "Глоссарий — CNN Lab Stand",
  legacy: "Legacy — CNN Lab Stand",
  theory: "Теория — CNN Lab Stand",
  assignment: "Задание — CNN Lab Stand",
  playground: "Песочница — CNN Lab Stand",
  transfer: "Transfer Learning — CNN Lab Stand",
  training: "Обучение — CNN Lab Stand",
  compare: "Сравнение моделей — CNN Lab Stand",
  submit: "Проверка — CNN Lab Stand",
};

export default function usePageTitle() {
  const location = useLocation();
  useEffect(() => {
    const segment = location.pathname.split("/").filter(Boolean)[0] ?? "";
    const step = getStepMeta(Number(segment));
    document.title = step ? `Шаг ${step.id}: ${step.title} — CNN Lab Stand` : titles[segment] ?? "CNN Lab Stand";
  }, [location.pathname]);
}
