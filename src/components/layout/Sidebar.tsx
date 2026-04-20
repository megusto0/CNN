import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  BookOpen,
  ClipboardList,
  Boxes,
  ArrowRightLeft,
  BrainCircuit,
  BarChart3,
  CheckSquare,
} from "lucide-react";

const navItems = [
  { to: "/", label: "Обзор", icon: Home },
  { to: "/theory", label: "Теория", icon: BookOpen },
  { to: "/assignment", label: "Задание", icon: ClipboardList },
  { to: "/playground", label: "Песочница", icon: Boxes },
  { to: "/transfer", label: "Transfer", icon: ArrowRightLeft },
  { to: "/training", label: "Обучение", icon: BrainCircuit },
  { to: "/compare", label: "Сравнение", icon: BarChart3 },
  { to: "/submit", label: "Проверка", icon: CheckSquare },
] as const;

export default function Sidebar() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <>
      <nav
        className="hidden lg:flex flex-col w-56 shrink-0 border-r"
        style={{
          backgroundColor: "var(--bg-raised)",
          borderColor: "var(--border-subtle)",
        }}
        aria-label="Основная навигация"
      >
        <div
          className="px-5 py-6 text-sm font-semibold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          CNN Lab Stand
        </div>
        <ul className="flex flex-col gap-0.5 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.to === "/"
                ? path === "/"
                : path.startsWith(item.to);
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors border-l-2 ${
                    isActive
                      ? "font-medium"
                      : ""
                  }`}
                  style={{
                    color: isActive
                      ? "var(--text-primary)"
                      : "var(--text-secondary)",
                    backgroundColor: isActive
                      ? "var(--bg-sunken)"
                      : "transparent",
                    borderLeftColor: isActive
                      ? "var(--accent)"
                      : "transparent",
                  }}
                >
                  <Icon size={16} strokeWidth={1.5} />
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Mobile: bottom bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex lg:hidden border-t"
        style={{
          backgroundColor: "var(--bg-raised)",
          borderColor: "var(--border-subtle)",
        }}
        aria-label="Основная навигация (мобильная)"
      >
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive =
            item.to === "/"
              ? path === "/"
              : path.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="flex flex-1 flex-col items-center gap-0.5 py-2 text-xs"
              style={{
                color: isActive
                  ? "var(--accent)"
                  : "var(--text-tertiary)",
              }}
            >
              <Icon size={18} strokeWidth={1.5} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
