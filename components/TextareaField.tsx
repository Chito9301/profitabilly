import type { TextareaHTMLAttributes } from "react";
import { FIELD_CONTROL_STYLES, FIELD_LABEL_STYLES } from "./fieldStyles";

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
      <label htmlFor={fieldId} className={FIELD_LABEL_STYLES}>
        {label}
      </label>
      <textarea
        id={fieldId}
        name={name}
        rows={3}
        className={FIELD_CONTROL_STYLES}
        {...props}
      />
    </div>
  );
}
