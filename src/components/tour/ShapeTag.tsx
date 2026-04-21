type ShapeTagProps = {
  shape: number[] | string;
};

export default function ShapeTag({ shape }: ShapeTagProps) {
  const value = Array.isArray(shape) ? `(${shape.join(", ")})` : shape;
  return (
    <span
      className="inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-xs"
      style={{
        backgroundColor: "rgba(124,155,255,0.08)",
        borderColor: "rgba(124,155,255,0.2)",
        color: "var(--accent)",
      }}
    >
      {value}
    </span>
  );
}
