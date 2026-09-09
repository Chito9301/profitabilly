import type { SelectHTMLAttributes } from "react";

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: readonly string[];
};

export default function SelectField({
  label,
  id,
  name,
  options,
  ...props
}: SelectFieldProps) {
  const fieldId = id ?? name;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-sm text-ink">
        {label}
      </label>
      <select
        id={fieldId}
        name={name}
        className="rounded-md border border-rule bg-paper px-3 py-2 text-sm text-ink outline-none focus-visible:border-signal"
        {...props}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
