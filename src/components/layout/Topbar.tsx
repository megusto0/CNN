import { useLocation, Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { load, KEYS } from "../../lib/storage";
import type { Variant } from "../../types";

const routeLabels: Record<string, string> = {
  "": "Обзор",
  theory: "Теория",
  assignment: "Задание",
  variant: "Задание",
  playground: "Песочница",
  transfer: "Transfer learning",
  training: "Обучение",
  compare: "Сравнение",
  submit: "Проверка",
};

export default function Topbar() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);
  const variant = load<Variant>(KEYS.variant);

  const breadcrumbs = segments.length === 0
    ? [{ label: "Обзор", path: "/" }]
    : [
        { label: "Обзор", path: "/" },
        ...segments.map((seg, i) => ({
          label: routeLabels[seg] ?? seg,
          path: "/" + segments.slice(0, i + 1).join("/"),
        })),
      ];

  return (
    <header
      className="flex items-center justify-between px-6 py-3 border-b lg:px-10"
      style={{
        backgroundColor: "var(--bg-raised)",
        borderColor: "var(--border-subtle)",
      }}
    >
      <nav className="flex items-center gap-1 text-sm" aria-label="Хлебные крошки">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.path} className="flex items-center gap-1">
            {i > 0 && (
              <ChevronRight
                size={12}
                style={{ color: "var(--text-tertiary)" }}
              />
            )}
            {i < breadcrumbs.length - 1 ? (
              <Link
                to={crumb.path}
                style={{ color: "var(--text-tertiary)" }}
                className="hover:underline"
              >
                {crumb.label}
              </Link>
            ) : (
              <span style={{ color: "var(--text-primary)" }}>
                {crumb.label}
              </span>
            )}
          </span>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        {variant && (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-mono font-medium"
            style={{
              backgroundColor: "var(--feature-map)",
              color: "var(--accent)",
            }}
          >
            Вариант {variant.number}
          </span>
        )}
      </div>
    </header>
  );
}
