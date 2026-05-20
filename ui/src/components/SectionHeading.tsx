import styles from './SectionHeading.module.css';

export type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export function SectionHeading({ eyebrow, title, description }: SectionHeadingProps) {
  return (
    <div className={styles.wrapper}>
      {eyebrow ? <span className={styles.eyebrow}>{eyebrow}</span> : null}
      <h1 className={styles.title}>{title}</h1>
      {description ? <p className={styles.description}>{description}</p> : null}
    </div>
  );
}


