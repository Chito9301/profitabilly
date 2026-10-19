import type { SelectHTMLAttributes } from "react";
import { FIELD_CONTROL_STYLES, FIELD_LABEL_STYLES } from "./fieldStyles";

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: readonly string[];
  // Optional display text per option value (Mini-Sprint 48). The
  // submitted value is always the original option string.
  optionLabels?: Readonly<Record<string, string>>;
};

export default function SelectField({
  label,
  id,
  name,
  options,
  optionLabels,
  ...props
}: SelectFieldProps) {
  const fieldId = id ?? name;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className={FIELD_LABEL_STYLES}>
        {label}
      </label>
      <select
        id={fieldId}
        name={name}
        className={FIELD_CONTROL_STYLES}
        {...props}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {optionLabels?.[option] ?? option}
          </option>
        ))}
      </select>
    </div>
  );
}
