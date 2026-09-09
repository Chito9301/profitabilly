import type { InputHTMLAttributes } from "react";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export default function TextField({ label, id, name, ...props }: TextFieldProps) {
  const fieldId = id ?? name;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-sm text-ink">
        {label}
      </label>
      <input
        id={fieldId}
        name={name}
        className="rounded-md border border-rule bg-paper px-3 py-2 text-sm text-ink outline-none focus-visible:border-signal"
        {...props}
      />
    </div>
  );
}
