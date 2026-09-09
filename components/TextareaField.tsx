import type { TextareaHTMLAttributes } from "react";

type TextareaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
};

export default function TextareaField({
  label,
  id,
  name,
  ...props
}: TextareaFieldProps) {
  const fieldId = id ?? name;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-sm text-ink">
        {label}
      </label>
      <textarea
        id={fieldId}
        name={name}
        rows={3}
        className="rounded-md border border-rule bg-paper px-3 py-2 text-sm text-ink outline-none focus-visible:border-signal"
        {...props}
      />
    </div>
  );
}
