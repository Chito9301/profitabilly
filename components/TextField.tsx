import type { InputHTMLAttributes } from "react";
import { FIELD_CONTROL_STYLES, FIELD_LABEL_STYLES } from "./fieldStyles";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export default function TextField({ label, id, name, ...props }: TextFieldProps) {
  const fieldId = id ?? name;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className={FIELD_LABEL_STYLES}>
        {label}
      </label>
      <input
        id={fieldId}
        name={name}
        className={FIELD_CONTROL_STYLES}
        {...props}
      />
    </div>
  );
}
