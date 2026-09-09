import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

type ButtonVariant = "primary" | "secondary";

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary: "bg-signal text-ink hover:bg-signal/90",
  secondary:
    "bg-transparent text-ink border border-ink/30 hover:border-ink/60",
};

const BASE_STYLES =
  "inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-medium tracking-normal transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none";

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
