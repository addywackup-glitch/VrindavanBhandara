export default function DashboardLoading() {
  return (
    <div className="db-content" style={{ padding: "2rem" }} aria-busy="true" aria-label="Loading dashboard">
      <div style={{ height: 28, width: 220, background: "var(--n-100)", borderRadius: 8, marginBottom: 24 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16, marginBottom: 24 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ height: 96, background: "var(--n-50)", border: "1.5px solid var(--border)", borderRadius: 12 }} />
        ))}
      </div>
      <div style={{ height: 280, background: "var(--n-50)", border: "1.5px solid var(--border)", borderRadius: 12 }} />
    </div>
  );
}
