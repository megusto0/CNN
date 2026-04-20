import { useState, useEffect } from "react";
import PageHeader from "../components/layout/PageHeader";
import ConvPlayground from "../features/conv-playground/ConvPlayground";
import PoolVisualizer from "../features/pool-visualizer/PoolVisualizer";
import ArchDiagram from "../components/viz/ArchDiagram";
import type { Architecture } from "../types";

const tabs = [
  { key: "conv", label: "Свёртка" },
  { key: "pool", label: "Пулинг" },
  { key: "arch", label: "Архитектуры" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export default function Playground() {
  const [active, setActive] = useState<TabKey>("conv");
  const [architectures, setArchitectures] = useState<Architecture[]>([]);

  useEffect(() => {
    fetch("/data/architectures.json")
      .then((r) => r.json())
      .then(setArchitectures)
      .catch(() => {});
  }, []);

  return (
    <div>
      <PageHeader title="Песочница" />
      <div
        className="flex gap-1 mb-6 p-1 rounded-md w-fit"
        style={{ backgroundColor: "var(--bg-sunken)" }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className="px-3 py-1.5 text-sm rounded-sm transition-colors"
            style={{
              backgroundColor:
                active === tab.key ? "var(--bg-raised)" : "transparent",
              color:
                active === tab.key
                  ? "var(--text-primary)"
                  : "var(--text-tertiary)",
              boxShadow:
                active === tab.key
                  ? "0 1px 0 0 var(--border-subtle), 0 0 0 1px var(--border-subtle) inset"
                  : "none",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {active === "conv" && <ConvPlayground />}
      {active === "pool" && <PoolVisualizer />}
      {active === "arch" && architectures.length > 0 && (
        <ArchDiagram architectures={architectures} />
      )}
    </div>
  );
}
