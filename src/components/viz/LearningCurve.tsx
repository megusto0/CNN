import { useEffect, useRef } from "react";
import { select, type Selection } from "d3-selection";
import { scaleLinear } from "d3-scale";
import { line } from "d3-shape";
import { axisBottom, axisLeft } from "d3-axis";
import { extent } from "d3-array";

interface DataPoint {
  x: number;
  yTrain: number;
  yVal: number;
}

interface LearningCurveProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  yLabel?: string;
}

export default function LearningCurve({
  data,
  width = 480,
  height = 240,
  yLabel = "Loss",
}: LearningCurveProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 16, right: 16, bottom: 32, left: 48 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = scaleLinear()
      .domain(extent(data, (d: DataPoint) => d.x) as [number, number])
      .range([0, w]);

    const allY = data.flatMap((d: DataPoint) => [d.yTrain, d.yVal]);
    const yScale = scaleLinear()
      .domain(extent(allY) as [number, number])
      .range([h, 0]);

    g.append("g")
      .attr("transform", `translate(0,${h})`)
      .call(axisBottom(xScale).ticks(5).tickSize(-h))
      .call(styleAxis);

    g.append("g")
      .call(axisLeft(yScale).ticks(5).tickSize(-w))
      .call(styleAxis);

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -36)
      .attr("x", -h / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "var(--text-tertiary)")
      .attr("font-size", "11px")
      .text(yLabel);

    const trainLine = line<DataPoint>()
      .x((d: DataPoint) => xScale(d.x))
      .y((d: DataPoint) => yScale(d.yTrain));

    const valLine = line<DataPoint>()
      .x((d: DataPoint) => xScale(d.x))
      .y((d: DataPoint) => yScale(d.yVal));

    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "var(--accent)")
      .attr("stroke-width", 1.5)
      .attr("d", trainLine);

    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "var(--positive)")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "4 2")
      .attr("d", valLine);

    const legend = g.append("g").attr("transform", `translate(${w - 100}, 0)`);
    legend
      .append("line")
      .attr("x1", 0)
      .attr("x2", 16)
      .attr("y1", 4)
      .attr("y2", 4)
      .attr("stroke", "var(--accent)")
      .attr("stroke-width", 1.5);
    legend
      .append("text")
      .attr("x", 20)
      .attr("y", 8)
      .attr("fill", "var(--text-tertiary)")
      .attr("font-size", "10px")
      .text("Train");
    legend
      .append("line")
      .attr("x1", 0)
      .attr("x2", 16)
      .attr("y1", 18)
      .attr("y2", 18)
      .attr("stroke", "var(--positive)")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "4 2");
    legend
      .append("text")
      .attr("x", 20)
      .attr("y", 22)
      .attr("fill", "var(--text-tertiary)")
      .attr("font-size", "10px")
      .text("Val");
  }, [data, width, height, yLabel]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      style={{ overflow: "visible" }}
    />
  );
}

function styleAxis(g: Selection<SVGGElement, unknown, null, undefined>) {
  g.select(".domain").attr("stroke", "var(--border-subtle)");
  g.selectAll(".tick line").attr("stroke", "var(--border-subtle)");
  g.selectAll(".tick text")
    .attr("fill", "var(--text-tertiary)")
    .attr("font-size", "10px")
    .attr("font-family", "JetBrains Mono, monospace");
}
