"use client";

import styles from "./brief.module.css";

export function PrintBrief() {
  return <button type="button" className={`button ${styles.printButton}`} onClick={() => window.print()}>Print or save as PDF</button>;
}
