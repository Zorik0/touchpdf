"use client";

import { useId, type ReactNode } from "react";

type FieldProps = { label: string; hint?: string; error?: string | null; children: (id: string) => ReactNode };

export function Field({ label, hint, error, children }: FieldProps) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {children(id)}
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="field-hint">{hint}</p>
      )}
    </div>
  );
}

type Choice<T extends string> = { value: T; label: string };

export function Segmented<T extends string>({
  label,
  value,
  choices,
  onChange,
}: {
  label: string;
  value: T;
  choices: Choice<T>[];
  onChange: (value: T) => void;
}) {
  const name = useId();
  return (
    <fieldset className="field">
      <legend className="field-label">{label}</legend>
      <div className="segmented">
        {choices.map((choice) => (
          <label key={choice.value} className="segment">
            <input
              type="radio"
              name={name}
              value={choice.value}
              checked={value === choice.value}
              onChange={() => onChange(choice.value)}
            />
            <span>{choice.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function TextField({
  label,
  value,
  onChange,
  hint,
  error,
  placeholder,
  type = "text",
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string | null;
  placeholder?: string;
  type?: "text" | "password";
  inputMode?: "text" | "numeric";
}) {
  return (
    <Field label={label} hint={hint} error={error}>
      {(id) => (
        <input
          id={id}
          className="input"
          type={type}
          value={value}
          placeholder={placeholder}
          inputMode={inputMode}
          aria-invalid={error ? true : undefined}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </Field>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  hint,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      {(id) => (
        <input
          id={id}
          className="input"
          type="number"
          value={Number.isFinite(value) ? value : ""}
          min={min}
          max={max}
          step={step}
          onChange={(event) => onChange(event.target.valueAsNumber)}
        />
      )}
    </Field>
  );
}

export function RangeField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  format = String,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  format?: (value: number) => string;
}) {
  return (
    <Field label={label}>
      {(id) => (
        <div className="range">
          <input
            id={id}
            type="range"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(event) => onChange(event.target.valueAsNumber)}
          />
          <output htmlFor={id}>{format(value)}</output>
        </div>
      )}
    </Field>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
}) {
  return (
    <div className="field">
      <label className="toggle">
        <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
        <span>{label}</span>
      </label>
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}
