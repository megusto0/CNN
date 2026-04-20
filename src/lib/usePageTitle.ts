import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const titles: Record<string, string> = {
  "": "Обзор — CNN Lab Stand",
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
    document.title = titles[segment] ?? "CNN Lab Stand";
  }, [location.pathname]);
}
