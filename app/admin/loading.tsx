export default function AdminLoading() {
  return (
    <div className="adm-content" aria-busy="true" aria-label="Loading admin page">
      <div style={{ height: 24, width: 180, background: "var(--n-100)", borderRadius: 8, marginBottom: 20 }} />
      <div style={{ height: 320, background: "var(--n-50)", border: "1.5px solid var(--border)", borderRadius: 12 }} />
    </div>
  );
}
