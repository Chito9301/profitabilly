import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

type ButtonVariant = "primary" | "secondary" | "destructive";

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary: "bg-ink text-white hover:bg-ink-hover",
  secondary:
    "border border-rule-strong bg-surface text-ink hover:border-ink-soft hover:bg-paper",
  // Filled red for irreversible actions. No screen uses it yet — the
  // existing Delete buttons are small text links (see ARCHITECTURE.md).
  destructive: "bg-danger text-white hover:bg-danger/90",
};

// min-h-12 = 48px touch target on mobile; 40px from `sm` up so desktop
// buttons aren't oversized.
const BASE_STYLES =
  "inline-flex min-h-12 items-center justify-center rounded-lg px-6 py-2 text-sm font-medium tracking-normal transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none sm:min-h-10";

type CommonProps = {
  variant?: ButtonVariant;
  className?: string;
};

type ButtonAsButton = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type ButtonAsLink = CommonProps & {
  href: string;
  children?: ReactNode;
};

type ButtonProps = ButtonAsButton | ButtonAsLink;

// Shared button primitive. `href` renders it as a styled Link (for
// navigation, e.g. the homepage CTAs) instead of a <button> — same
// look, so the two never visually drift apart.
export default function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  const styles = `${BASE_STYLES} ${VARIANT_STYLES[variant]} ${className}`;

  if ("href" in props && props.href !== undefined) {
    const { href, children } = props;
    return (
      <Link href={href} className={styles}>
        {children}
      </Link>
    );
  }

  return (
    <button
      className={styles}
      {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}
    />
  );
}
