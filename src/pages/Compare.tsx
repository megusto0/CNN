import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { select } from "d3-selection";
import { scaleLog, scaleLinear } from "d3-scale";
import { axisBottom, axisLeft } from "d3-axis";
import { extent } from "d3-array";
import PageHeader from "../components/layout/PageHeader";
import type { TorchvisionModel } from "../types";

const modelsData: TorchvisionModel[] = [
  { model: "resnet18", params_M: 11.7, top1: 69.76, top5: 89.08, gflops: 1.8, size_MB: 44.7, year: 2015 },
  { model: "resnet34", params_M: 21.8, top1: 73.31, top5: 91.42, gflops: 3.7, size_MB: 83.3, year: 2015 },
  { model: "resnet50", params_M: 25.6, top1: 80.86, top5: 95.43, gflops: 4.1, size_MB: 97.8, year: 2015 },
  { model: "resnet101", params_M: 44.5, top1: 81.89, top5: 95.78, gflops: 7.9, size_MB: 170.5, year: 2015 },
  { model: "resnet152", params_M: 60.2, top1: 82.28, top5: 96.05, gflops: 11.5, size_MB: 230.0, year: 2015 },
  { model: "vgg11_bn", params_M: 132.9, top1: 70.45, top5: 90.09, gflops: 7.6, size_MB: 507.0, year: 2014 },
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

const MARGIN = { top: 10, right: 20, bottom: 30, left: 50 };
const HEIGHT = 240;

function computePareto(data: TorchvisionModel[]): Set<string> {
  const optimal = new Set<string>();
  for (const a of data) {
    let dominated = false;
    for (const b of data) {
      if (b.params_M <= a.params_M && b.top1 >= a.top1) {
        if (b.params_M < a.params_M || b.top1 > a.top1) {
          dominated = true;
          break;
        }
      }
    }
    if (!dominated) optimal.add(a.model);
  }
  return optimal;
}

export default function Compare() {
  const [sortKey, setSortKey] = useState<SortKey>("top1");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showPareto, setShowPareto] = useState(false);
  const [hoveredModel, setHoveredModel] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);

  const paretoSet = useMemo(() => computePareto(modelsData), []);

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

  const drawChart = useCallback(() => {
    if (!svgRef.current) return;

    const svg = select(svgRef.current);
    svg.selectAll("*").remove();

    const rect = svgRef.current.parentElement!.getBoundingClientRect();
    const width = Math.max(rect.width, 400);
    const innerW = width - MARGIN.left - MARGIN.right;
    const innerH = HEIGHT - MARGIN.top - MARGIN.bottom;

    const g = svg
      .attr("width", width)
      .attr("height", HEIGHT)
      .append("g")
      .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    const x = scaleLog<number, number>()
      .domain(extent(modelsData, (d) => d.params_M) as [number, number])
      .range([0, innerW])
      .nice();

    const y = scaleLinear()
      .domain(extent(modelsData, (d) => d.top1) as [number, number])
      .range([innerH, 0])
      .nice();

    g.append("g")
      .attr("transform", `translate(0,${innerH})`)
      .call(axisBottom(x).ticks(5, ".0f"))
      .selectAll("text")
      .style("fill", "var(--text-tertiary)")
      .style("font-size", "10px");

    g.selectAll(".domain, .tick line").style("stroke", "var(--border-subtle)");

    g.append("g")
      .call(axisLeft(y).ticks(5))
      .selectAll("text")
      .style("fill", "var(--text-tertiary)")
      .style("font-size", "10px");

    g.append("text")
      .attr("x", innerW / 2)
      .attr("y", innerH + 26)
      .attr("text-anchor", "middle")
      .style("fill", "var(--text-tertiary)")
      .style("font-size", "10px")
      .text("Params (M)");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerH / 2)
      .attr("y", -40)
      .attr("text-anchor", "middle")
      .style("fill", "var(--text-tertiary)")
      .style("font-size", "10px")
      .text("Top-1 (%)");

    g.selectAll("circle")
      .data(modelsData)
      .enter()
      .append("circle")
      .attr("cx", (d) => x(d.params_M))
      .attr("cy", (d) => y(d.top1))
      .attr("r", (d) => (d.model === hoveredModel ? 7 : 5))
      .attr("fill", (d) =>
        d.model === hoveredModel
          ? "var(--accent)"
          : paretoSet.has(d.model)
            ? "var(--positive)"
            : "var(--text-tertiary)"
      )
      .attr("opacity", (d) => (d.model === hoveredModel ? 1 : 0.75))
      .attr("stroke", (d) => (d.model === hoveredModel ? "var(--accent)" : "none"))
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .style("transition", "r 0.15s, fill 0.15s")
      .on("mouseenter", (_event, d) => setHoveredModel(d.model))
      .on("mouseleave", () => setHoveredModel(null));

    g.selectAll("text.label")
      .data(modelsData.filter((d) => d.model === hoveredModel))
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("x", (d) => x(d.params_M))
      .attr("y", (d) => y(d.top1) - 10)
      .attr("text-anchor", "middle")
      .style("fill", "var(--accent)")
      .style("font-size", "10px")
      .style("font-weight", "600")
      .text((d) => d.model);
  }, [hoveredModel, paretoSet]);

  useEffect(() => {
    if (showPareto) drawChart();
  }, [showPareto, drawChart]);

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
          <svg ref={svgRef} />
          <div className="flex gap-4 mt-2 text-xs" style={{ color: "var(--text-tertiary)" }}>
            <span className="flex items-center gap-1">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: "var(--positive)" }}
              />
              Pareto-optimal
            </span>
            <span className="flex items-center gap-1">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: "var(--text-tertiary)" }}
              />
              Dominated
            </span>
          </div>
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
                style={{
                  borderColor: "var(--border-subtle)",
                  backgroundColor:
                    hoveredModel === m.model
                      ? "var(--feature-map)"
                      : "transparent",
                }}
                onMouseEnter={() => setHoveredModel(m.model)}
                onMouseLeave={() => setHoveredModel(null)}
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
