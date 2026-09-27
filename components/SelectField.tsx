import type { SelectHTMLAttributes } from "react";
import { FIELD_CONTROL_STYLES, FIELD_LABEL_STYLES } from "./fieldStyles";

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
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
