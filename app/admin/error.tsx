"use client";

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="adm-content" role="alert">
      <div className="adm-empty">
        <div className="adm-empty-title">Unable to load this page</div>
        <p className="adm-empty-desc">An unexpected error occurred. You can retry or return to the dashboard.</p>
        <button type="button" className="adm-topbar-btn" style={{ marginTop: "1rem" }} onClick={reset}>
          Try again
        </button>
      </div>
    </div>
  );
}
