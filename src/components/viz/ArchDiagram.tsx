import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { springs } from "../../design/motion";
import type { Architecture } from "../../types";

interface ArchDiagramProps {
  architectures: Architecture[];
}

const typeColors: Record<string, string> = {
  conv: "var(--accent)",
  bn: "var(--border-strong)",
  relu: "var(--text-tertiary)",
  maxpool: "var(--positive)",
  pool: "var(--positive)",
  avgpool: "var(--positive)",
  block_group: "var(--warning)",
  fc: "var(--negative)",
};

export default function ArchDiagram({ architectures }: ArchDiagramProps) {
  const [selected, setSelected] = useState(architectures[0]?.name ?? "");
  const arch = architectures.find((a) => a.name === selected);
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!arch) return null;

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        {architectures.map((a) => (
          <button
            key={a.name}
            onClick={() => {
              setSelected(a.name);
              setExpanded(null);
            }}
            className="px-3 py-1.5 text-sm rounded-sm transition-colors"
            style={{
              backgroundColor:
                selected === a.name ? "var(--bg-raised)" : "var(--bg-sunken)",
              color:
                selected === a.name
                  ? "var(--text-primary)"
                  : "var(--text-tertiary)",
              border: `1px solid ${selected === a.name ? "var(--accent)" : "var(--border-subtle)"}`,
            }}
          >
            {a.name}
          </button>
        ))}
      </div>

      <div className="flex gap-6 items-start flex-wrap">
        <div className="flex flex-col items-center gap-0">
          <div
            className="text-xs mb-2"
            style={{ color: "var(--text-tertiary)" }}
          >
            {arch.input.join("×")} → {arch.layers[arch.layers.length - 1]?.out_shape?.join("×") ?? "?"}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={selected}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-0.5 w-64"
            >
              {arch.layers.map((layer, i) => {
                const color = typeColors[layer.type] ?? "var(--text-tertiary)";
                const paramCount = layer.params ?? 0;
                const height = Math.max(
                  16,
                  paramCount > 0
                    ? 12 + Math.log2(paramCount + 1) * 2.5
                    : 14,
                );
                const isExpanded = expanded === `${i}`;
                return (
                  <motion.button
                    key={`${selected}-${i}`}
                    layout
                    onClick={() => setExpanded(isExpanded ? null : `${i}`)}
                    className="text-left rounded-sm transition-colors relative"
                    style={{
                      backgroundColor: `${color}18`,
                      borderLeft: `3px solid ${color}`,
                      paddingLeft: 8,
                      paddingRight: 8,
                    }}
                    transition={springs.snappy}
                  >
                    <div
                      className="flex items-center gap-2"
                      style={{ height }}
                    >
                      <span
                        className="text-xs font-mono font-medium"
                        style={{ color }}
                      >
                        {layer.type}
                      </span>
                      {layer.out && (
                        <span
                          className="text-xs"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          {layer.out}
                        </span>
                      )}
                      {paramCount > 0 && (
                        <span
                          className="text-xs font-mono ml-auto"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          {(paramCount / 1000).toFixed(1)}K
                        </span>
                      )}
                    </div>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={springs.smooth}
                          className="overflow-hidden"
                        >
                          <div
                            className="pb-2 text-xs"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            <div>
                              out_shape: [{layer.out_shape.join(", ")}]
                            </div>
                            {layer.kernel != null && (
                              <div>
                                kernel={layer.kernel}, stride={layer.stride}, pad={layer.pad}
                              </div>
                            )}
                            {layer.blocks != null && (
                              <div>blocks: {layer.blocks}</div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {arch && (
          <div
            className="flex flex-col gap-2 p-4 rounded-md border"
            style={{
              backgroundColor: "var(--bg-raised)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {arch.name}
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
              <span style={{ color: "var(--text-tertiary)" }}>Параметры</span>
              <span className="font-mono" style={{ color: "var(--text-secondary)" }}>
                {arch.total_params_M}M
              </span>
              <span style={{ color: "var(--text-tertiary)" }}>FLOPs</span>
              <span className="font-mono" style={{ color: "var(--text-secondary)" }}>
                {arch.flops_G}G
              </span>
              <span style={{ color: "var(--text-tertiary)" }}>Top-1 ImageNet</span>
              <span className="font-mono" style={{ color: "var(--text-secondary)" }}>
                {arch.top1_imagenet > 0 ? `${arch.top1_imagenet}%` : "N/A"}
              </span>
              <span style={{ color: "var(--text-tertiary)" }}>Вход</span>
              <span className="font-mono" style={{ color: "var(--text-secondary)" }}>
                {arch.input.join("×")}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
