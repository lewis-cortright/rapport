import type { InputHTMLAttributes, PropsWithChildren, TextareaHTMLAttributes } from 'react';
import styles from './Field.module.css';

export type RapFormFieldProps = PropsWithChildren<{
  label: string;
  hint?: string;
  htmlFor?: string;
}>;

export function RapFormField({ label, hint, htmlFor, children }: RapFormFieldProps) {
  return (
    <label htmlFor={htmlFor} className={styles.field}>
      <span className={styles.label}>{label}</span>
      {children}
      {hint ? <span className={styles.hint}>{hint}</span> : null}
    </label>
  );
}

export function RapTextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className, style, ...inputProps } = props;
  return <input {...inputProps} className={[styles.control, className].filter(Boolean).join(' ')} style={style} />;
}

export function RapTextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, style, ...textAreaProps } = props;
  return <textarea {...textAreaProps} className={[styles.control, styles.textArea, className].filter(Boolean).join(' ')} style={style} />;
}

