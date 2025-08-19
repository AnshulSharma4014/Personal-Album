import { useEffect, useMemo, useState } from "react";

const API = import.meta.env.VITE_API || "";

/* ---------- helpers ---------- */
function absUrl(u) {
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  // make sure there's exactly one slash between API and path
  const base = API.replace(/\/+$/, "");
  const path = (`${u}`).startsWith("/") ? u : `/${u}`;
  return `${base}${path}`;
}

function useFetchJSON(url) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return r.json();
      })
      .then((j) => alive && setData(j))
      .catch((e) => alive && setErr(e))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [url]);

  return { data, err, loading };
}

/* ---------- UI bits ---------- */
function Toolbar({ path, onBack }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 12 }}>
      <h1 style={{ fontSize: 18, margin: 0, opacity: 0.85 }}>Family Photos</h1>
      <div style={{ marginLeft: "auto", opacity: 0.6, fontSize: 13 }}>{path || "/"}</div>
      {onBack && (
        <button
          onClick={onBack}
          style={{ padding: "6px 12px", borderRadius: 12, border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}
        >
          ⬅ Back
        </button>
      )}
    </div>
  );
}

/* ---------- main ---------- */
function Album({ path, setPath }) {
  const url = path ? `${API}/api/albums${path}` : `${API}/api/albums`;
  const { data, loading, err } = useFetchJSON(url);

  // Normalize folders/photos for both payload shapes
  const folders = useMemo(() => (Array.isArray(data) ? [] : data?.folders ?? []), [data]);
  const photos = useMemo(() => {
    const raw = Array.isArray(data) ? data : (data?.photos ?? []);
    return raw.map((p) => ({
      name: p.name || p.fileName || "",
      thumbUrl: absUrl(p.thumb || p.thumbnail || p.url || p.full),
      fullUrl: absUrl(p.full || p.url || p.src || p.thumb),
      key: (p.full || p.thumb || p.url || p.name),
    }));
  }, [data]);

  // selection + zoom
  const [selected, setSelected] = useState(null);
  useEffect(() => { setSelected(photos[0] || null); }, [url, photos]);
  const [zoom, setZoom] = useState(1);
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
  const zoomIn = () => setZoom((z) => clamp(z + 0.25, 0.25, 4));
  const zoomOut = () => setZoom((z) => clamp(z - 0.25, 0.25, 4));
  const zoomReset = () => setZoom(1);

  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;
  if (err || !data) return <div style={{ padding: 16 }}>Error loading.</div>;

  const canBack = path && path !== "/";
  const back = canBack ? (path.split("/").slice(0, -1).join("/") || "/") : null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#111" }}>
      {/* LEFT: sidebar */}
      <div style={{
        width: 340, background: "#fff", borderRight: "1px solid #eee",
        display: "flex", flexDirection: "column", height: "100vh"
      }}>
        <Toolbar path={path || "/"} onBack={back ? () => setPath(back) : null} />

        {/* Albums */}
        {folders.length > 0 && (
          <>
            <h2 style={{ padding: "0 16px", fontSize: 16, margin: "6px 0" }}>Albums</h2>
            <div style={{ padding: 12, display: "grid", gap: 8 }}>
              {folders.map((f) => (
                <button
                  key={f.path}
                  onClick={() => setPath(f.path)}
                  style={{
                    textAlign: "left", border: "1px solid #ddd", borderRadius: 12, padding: 10,
                    background: "#fafafa", cursor: "pointer"
                  }}
                >
                  <div style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {decodeURIComponent(f.name)}
                  </div>
                  <div style={{ opacity: 0.7, fontSize: 12 }}>{f.path}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Thumbnails */}
        <h2 style={{ padding: "0 16px", fontSize: 16, margin: "6px 0" }}>Photos</h2>
        <div
          style={{
            padding: 12,
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(2, minmax(0,1fr))",
            overflowY: "auto",
            flex: 1
          }}
        >
          {photos.map((p) => {
            const isActive = selected && selected.key === p.key;
            return (
              <button
                key={p.key}
                onClick={() => { setSelected(p); setZoom(1); }}
                style={{
                  border: isActive ? "2px solid #4b8bfd" : "1px solid #ddd",
                  borderRadius: 16,
                  padding: 0,
                  overflow: "hidden",
                  cursor: "pointer",
                  background: "#fff",
                  minHeight: 140
                }}
                title={p.name}
              >
                <img
                  src={p.thumbUrl}
                  alt={p.name}
                  loading="lazy"
                  style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }}
                  onError={(e) => { e.currentTarget.style.opacity = 0.2; }}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT: viewer */}
      <div style={{ flex: 1, position: "relative", background: "#111", height: "100vh" }}>
        {/* controls */}
        <div style={{ position: "absolute", top: 12, left: 12, zIndex: 2, display: "flex", gap: 8 }}>
          <button onClick={zoomOut}  style={ctlBtn}>−</button>
          <button onClick={zoomIn}   style={ctlBtn}>+</button>
          <button onClick={zoomReset} style={ctlBtn}>Reset</button>
        </div>

        {/* image */}
        <div
          style={{
            position: "fixed", inset: 0,
            overflow: "auto",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}
        >
          {selected ? (
            <img
              src={selected.fullUrl}
              alt={selected.name}
              style={{
                maxWidth: "92%",
                maxHeight: "92%",
                transform: `scale(${zoom})`,
                transformOrigin: "center center",
                transition: "transform 120ms ease",
                borderRadius: 8,
                boxShadow: "0 10px 30px rgba(0,0,0,.5)"
              }}
              onDoubleClick={zoomReset}
              onError={(e) => { e.currentTarget.style.opacity = 0.2; }}
            />
          ) : (
            <div style={{ color: "#aaa" }}>Select a photo on the left</div>
          )}
        </div>
      </div>
    </div>
  );
}

const ctlBtn = {
  padding: "6px 10px",
  borderRadius: 10,
  border: "1px solid #444",
  background: "#1e1e1e",
  color: "#fff",
  cursor: "pointer"
};

export default function App() {
  const [path, setPath] = useState(""); // "" = top-level
  return <Album path={path} setPath={setPath} />;
}
