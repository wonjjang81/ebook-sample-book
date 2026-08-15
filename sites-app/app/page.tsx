export default function Page() {
  return (
    <main className="app-shell">
      <iframe
        className="app-frame"
        src="/app/index.html"
        title="전자 샘플북"
        allow="camera; clipboard-read; clipboard-write"
      />
    </main>
  );
}
