import { springs } from "../../design/motion";
import { motion, type HTMLMotionProps } from "motion/react";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: Variant;
}

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary: {
    backgroundColor: "var(--accent)",
    color: "var(--accent-fg)",
  },
  secondary: {
    backgroundColor: "var(--bg-sunken)",
    color: "var(--text-primary)",
    border: "1px solid var(--border-subtle)",
  },
  ghost: {
    backgroundColor: "transparent",
    color: "var(--text-secondary)",
  },
};

export default function Button({
  variant = "primary",
  children,
  disabled,
  style,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      {...props}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={springs.snappy}
      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none"
      style={{
        ...variantStyles[variant],
        cursor: disabled ? "not-allowed" : "pointer",
        ...style,
      }}
    >
      {children}
    </motion.button>
  );
}
