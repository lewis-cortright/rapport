import styles from './SectionHeading.module.css';

export type RapSectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export function RapSectionHeading({ eyebrow, title, description }: RapSectionHeadingProps) {
  return (
    <div className={styles.wrapper}>
      {eyebrow ? <span className={styles.eyebrow}>{eyebrow}</span> : null}
      <h1 className={styles.title}>{title}</h1>
      {description ? <p className={styles.description}>{description}</p> : null}
    </div>
  );
}


