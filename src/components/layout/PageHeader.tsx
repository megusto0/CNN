interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <header className="mb-8">
      <h1
        className="text-2xl font-semibold tracking-tight"
        style={{
          color: "var(--text-primary)",
          letterSpacing: "-0.015em",
        }}
      >
        {title}
      </h1>
      {subtitle && (
        <p
          className="mt-2 text-base max-w-prose"
          style={{ color: "var(--text-secondary)" }}
        >
          {subtitle}
        </p>
      )}
    </header>
  );
}
