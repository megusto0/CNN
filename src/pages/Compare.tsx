import { useState, useMemo } from "react";
import PageHeader from "../components/layout/PageHeader";
import type { TorchvisionModel } from "../types";

const modelsData: TorchvisionModel[] = [
  { model: "resnet18", params_M: 11.7, top1: 69.76, top5: 89.08, gflops: 1.8, size_MB: 44.7, year: 2015 },
  { model: "resnet34", params_M: 21.8, top1: 73.31, top5: 91.42, gflops: 3.7, size_MB: 83.3, year: 2015 },
  { model: "resnet50", params_M: 25.6, top1: 80.86, top5: 95.43, gflops: 4.1, size_MB: 97.8, year: 2015 },
  { model: "resnet101", params_M: 44.5, top1: 81.89, top5: 95.78, gflops: 7.9, size_MB: 170.5, year: 2015 },
  { model: "vgg16_bn", params_M: 138.4, top1: 71.59, top5: 90.38, gflops: 15.5, size_MB: 528, year: 2014 },
  { model: "vgg19_bn", params_M: 143.7, top1: 74.22, top5: 91.84, gflops: 19.6, size_MB: 548, year: 2014 },
  { model: "alexnet", params_M: 61.1, top1: 56.52, top5: 79.07, gflops: 0.7, size_MB: 233, year: 2012 },
  { model: "mobilenet_v3_small", params_M: 2.5, top1: 67.67, top5: 87.38, gflops: 0.06, size_MB: 9.6, year: 2019 },
  { model: "mobilenet_v3_large", params_M: 5.5, top1: 75.27, top5: 92.57, gflops: 0.22, size_MB: 21.1, year: 2019 },
  { model: "efficientnet_b0", params_M: 5.3, top1: 77.70, top5: 93.51, gflops: 0.4, size_MB: 20.3, year: 2019 },
  { model: "efficientnet_b3", params_M: 12.2, top1: 82.01, top5: 96.05, gflops: 1.8, size_MB: 46.6, year: 2019 },
  { model: "densenet121", params_M: 8.0, top1: 74.43, top5: 91.97, gflops: 2.9, size_MB: 30.6, year: 2017 },
  { model: "densenet161", params_M: 28.7, top1: 77.65, top5: 93.83, gflops: 7.8, size_MB: 109.6, year: 2017 },
  { model: "convnext_tiny", params_M: 28.6, top1: 82.52, top5: 96.15, gflops: 4.5, size_MB: 109.3, year: 2022 },
  { model: "convnext_base", params_M: 88.6, top1: 85.27, top5: 97.49, gflops: 15.4, size_MB: 338.3, year: 2022 },
];

type SortKey = keyof TorchvisionModel;
type SortDir = "asc" | "desc";

export default function Compare() {
  const [sortKey, setSortKey] = useState<SortKey>("top1");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showPareto, setShowPareto] = useState(false);

  const sorted = useMemo(() => {
    return [...modelsData].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const columns: { key: SortKey; label: string; align: "left" | "right" }[] = [
    { key: "model", label: "Модель", align: "left" },
    { key: "params_M", label: "Params (M)", align: "right" },
    { key: "top1", label: "Top-1", align: "right" },
    { key: "top5", label: "Top-5", align: "right" },
    { key: "gflops", label: "GFLOPs", align: "right" },
    { key: "size_MB", label: "Size (MB)", align: "right" },
    { key: "year", label: "Год", align: "right" },
  ];

  return (
    <div>
      <PageHeader title="Сравнение моделей torchvision" />
      <p
        className="text-sm max-w-prose mb-6"
        style={{ color: "var(--text-secondary)" }}
      >
        Данные из официальной документации torchvision.models: число параметров,
        точность на ImageNet, FLOPs. Кликните заголовок столбца для сортировки.
      </p>

      <button
        onClick={() => setShowPareto((v) => !v)}
        className="mb-4 px-3 py-1.5 text-xs rounded-sm font-medium transition-colors"
        style={{
          backgroundColor: showPareto ? "var(--feature-map)" : "var(--bg-sunken)",
          color: showPareto ? "var(--accent)" : "var(--text-secondary)",
          border: `1px solid ${showPareto ? "var(--accent)" : "var(--border-subtle)"}`,
        }}
      >
        {showPareto ? "Скрыть Pareto" : "Показать Pareto (accuracy vs params)"}
      </button>

      {showPareto && (
        <div
          className="mb-6 rounded-md border p-4"
          style={{
            backgroundColor: "var(--bg-raised)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            Диаграмма Pareto (accuracy vs params) будет добавлена в Phase 4.
          </p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr
              className="border-b"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`py-2 px-3 font-medium cursor-pointer select-none whitespace-nowrap ${
                    col.align === "right" ? "text-right" : "text-left"
                  }`}
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span className="ml-1 text-xs">
                      {sortDir === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((m) => (
              <tr
                key={m.model}
                className="border-b transition-colors"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <td className="py-2 px-3 font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                  {m.model}
                </td>
                <td className="py-2 px-3 text-right font-mono text-xs" style={{ color: "var(--text-secondary)" }}>
                  {m.params_M}
                </td>
                <td className="py-2 px-3 text-right font-mono text-xs" style={{ color: "var(--text-secondary)" }}>
                  {m.top1}
                </td>
                <td className="py-2 px-3 text-right font-mono text-xs" style={{ color: "var(--text-secondary)" }}>
                  {m.top5}
                </td>
                <td className="py-2 px-3 text-right font-mono text-xs" style={{ color: "var(--text-secondary)" }}>
                  {m.gflops}
                </td>
                <td className="py-2 px-3 text-right font-mono text-xs" style={{ color: "var(--text-secondary)" }}>
                  {m.size_MB}
                </td>
                <td className="py-2 px-3 text-right font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>
                  {m.year}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
