import type { CSSProperties } from "react";
import type { StatusKind } from "../../tour/types";

const labels: Record<StatusKind, string> = {
  live: "Живой запуск",
  interactive: "Интерактив",
  replay: "Запись обучения",
};

const styles: Record<StatusKind, CSSProperties> = {
  live: {
    backgroundColor: "rgba(74,222,128,0.08)",
    color: "#4ADE80",
    borderColor: "rgba(74,222,128,0.2)",
  },
  interactive: {
    backgroundColor: "rgba(124,155,255,0.08)",
    color: "#7C9BFF",
    borderColor: "rgba(124,155,255,0.2)",
  },
  replay: {
    backgroundColor: "rgba(154,160,172,0.08)",
    color: "#9AA0AC",
    borderColor: "rgba(154,160,172,0.2)",
  },
};

export default function StatusTag({ kind }: { kind: StatusKind }) {
  return (
    <span
      className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium"
      style={styles[kind]}
    >
      {labels[kind]}
    </span>
  );
}
