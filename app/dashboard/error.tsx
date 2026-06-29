"use client";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="db-content" role="alert">
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", marginBottom: "0.5rem" }}>Something went wrong</h1>
      <p style={{ color: "var(--muted)", marginBottom: "1rem", maxWidth: "40ch" }}>
        We could not load this page. Please try again.
      </p>
      <button type="button" className="db-btn-book" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
