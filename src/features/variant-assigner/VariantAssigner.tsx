import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { springs } from "../../design/motion";
import { load, save, KEYS } from "../../lib/storage";
import type { Variant } from "../../types";

export default function VariantAssigner() {
  const [input, setInput] = useState("");
  const [assigned, setAssigned] = useState<Variant | null>(null);
  const [animating, setAnimating] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);

  useEffect(() => {
    const saved = load<Variant>(KEYS.variant);
    if (saved) setAssigned(saved);
    fetch("/data/variants.json")
      .then((r) => r.json())
      .then(setVariants)
      .catch(() => {});
  }, []);

  const handleAssign = useCallback(() => {
    const num = parseInt(input);
    if (isNaN(num) || num < 1 || num > 16) return;

    setAnimating(true);

    const target = variants[num - 1];
    if (!target) return;

    let tick = 0;
    const interval = setInterval(() => {
      tick++;
      const randVariant = variants[Math.floor(Math.random() * variants.length)];
      setAssigned(randVariant);
      if (tick >= 12) {
        clearInterval(interval);
        setAssigned(target);
        save(KEYS.variant, target);
        setAnimating(false);
      }
    }, 33);
  }, [input, variants]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 items-center">
        <input
          type="number"
          min={1}
          max={16}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="1–16"
          className="w-20 px-3 py-2 rounded-md text-sm font-mono"
          style={{
            backgroundColor: "var(--bg-sunken)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-primary)",
          }}
        />
        <button
          onClick={handleAssign}
          disabled={animating || !input}
          className="px-4 py-2 rounded-md text-sm font-medium disabled:opacity-40"
          style={{ backgroundColor: "var(--accent)", color: "var(--accent-fg)" }}
        >
          Получить вариант
        </button>
      </div>

      <AnimatePresence mode="wait">
        {assigned && (
          <motion.div
            key={assigned.number}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={springs.smooth}
            className="p-4 rounded-md border max-w-md"
            style={{
              backgroundColor: "var(--bg-raised)",
              borderColor: "var(--accent)",
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className="px-2 py-0.5 rounded-sm text-xs font-mono font-medium"
                style={{ backgroundColor: "var(--feature-map)", color: "var(--accent)" }}
              >
                Вариант {assigned.number}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <span style={{ color: "var(--text-tertiary)" }}>Датасет</span>
              <span style={{ color: "var(--text-secondary)" }}>{assigned.dataset.name}</span>
              <span style={{ color: "var(--text-tertiary)" }}>Классы</span>
              <span className="font-mono" style={{ color: "var(--text-secondary)" }}>{assigned.dataset.classes}</span>
              <span style={{ color: "var(--text-tertiary)" }}>Backbone</span>
              <span className="font-mono" style={{ color: "var(--text-secondary)" }}>{assigned.backbone.name}</span>
              <span style={{ color: "var(--text-tertiary)" }}>Параметры</span>
              <span className="font-mono" style={{ color: "var(--text-secondary)" }}>{assigned.backbone.params_M}M</span>
            </div>
            {assigned.notes && (
              <p className="mt-2 text-xs" style={{ color: "var(--text-tertiary)" }}>
                {assigned.notes}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
