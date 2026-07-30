import Link from "next/link";

export default function NotFound() {
  return (
    <main className="legal-page" id="main-content">
      <div className="legal-shell">
        <p className="legal-kicker">404</p>
        <h1>That page is out of orbit.</h1>
        <p>The address may have changed, or the page may not exist.</p>
        <Link className="button button-small" href="/">Return home</Link>
      </div>
    </main>
  );
}
