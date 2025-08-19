import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API || "";

function useFetchJSON(url) {
  console.log("Fetching:", url);
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    //fetch(url, { credentials: "include" })
     fetch(url)
      .then((r) => r.json())
      .then((j) => alive && setData(j))
      .catch((e) => alive && setErr(e))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [url]);
  return { data, err, loading };
}

function Toolbar({ path, onBack }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 16 }}>
      <h1 style={{ fontSize: 20, margin: 0 }}>Family Photos</h1>
      <div style={{ marginLeft: "auto", opacity: 0.75 }}>{path || "/"}</div>
      {onBack && (
        <button onClick={onBack} style={{ padding: "6px 12px", borderRadius: 12, border: "1px solid #ccc" }}>
          ⬅ Back
        </button>
      )}
    </div>
  );
}

function Album({ path, setPath }) {
  const url = path ? `${API}/api/albums${path}` : `${API}/api/albums`;
  
  const { data, loading, err } = useFetchJSON(url);

  const [selectedPhotos, setSelectedPhotos] = useState([]);

  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;
  if (err || !data) return <div style={{ padding: 16 }}>Error loading.</div>;

  const canBack = path && path !== "/";
  const back = canBack ? (path.split("/").slice(0, -1).join("/") || "/") : null;

  const handlePhotoClick = (photo) => {
    setSelectedPhotos((prev) =>
      prev.some((p) => p.full === photo.full)
        ? prev.filter((p) => p.full !== photo.full)
        : [...prev, photo]
    );
  };

  const handleZoom = (photoFull, delta) => {
    setSelectedPhotos((prev) =>
      prev.map((p) =>
        p.full === photoFull
          ? { ...p, zoom: Math.max(0.5, Math.min((p.zoom || 1) + delta, 3)) }
          : p
      )
    );
  };

  return (
    <div>
      <Toolbar path={path || "/"} onBack={back ? () => setPath(back) : null} />

      {data.folders?.length > 0 && (
        <>
          <h2 style={{ padding: "0 16px" }}>Albums</h2>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", padding: 16 }}>
            {data.folders.map((f) => (
              <button
                key={f.path}
                onClick={() => setPath(f.path)}
                style={{ textAlign: "left", border: "1px solid #ddd", borderRadius: 16, padding: 12 }}
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

      <div style={{ display: "flex", alignItems: "flex-start", gap: 24, padding: 16 }}>
        <div style={{ flex: 1 }}>
          {data?.length > 0 && (
            <>
              <h2 style={{ padding: "0 0 8px 0" }}>Photos</h2>
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))" }}>
                {data.map((p) => (
                  <div
                    key={API + p.full}
                    onClick={() => handlePhotoClick(p)}
                    style={{
                      border: selectedPhotos.some((sp) => sp.full === p.full) ? "2px solid #0078d4" : "1px solid #ddd",
                      borderRadius: 16,
                      overflow: "hidden",
                      cursor: "pointer",
                      background: selectedPhotos.some((sp) => sp.full === p.full) ? "#e6f7ff" : "#fff",
                    }}
                  >
                    <img
                      src={API + p.thumb}
                      alt={p.name}
                      loading="lazy"
                      style={{ width: "100%", height: 100, objectFit: "cover", display: "block" }}
                    />
                    <div style={{ padding: 8, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {p.name}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {selectedPhotos.length > 0 && (
          <div style={{ flex: 2, minWidth: 0 }}>
            <h2 style={{ marginBottom: 8 }}>Selected Photos</h2>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {selectedPhotos.map((p) => (
                <div key={p.full} style={{ position: "relative", background: "#fff", borderRadius: 16, boxShadow: "0 2px 8px #0001", padding: 8 }}>
                  <img
                    src={API + p.full}
                    alt={p.name}
                    style={{
                      width: 320 * (p.zoom || 1),
                      height: 240 * (p.zoom || 1),
                      objectFit: "contain",
                      borderRadius: 12,
                      transition: "transform 0.2s",
                    }}
                  />
                  <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 8 }}>
                    <button onClick={() => handleZoom(p.full, 0.2)} style={{ padding: "4px 8px", borderRadius: 8 }}>Zoom In</button>
                    <button onClick={() => handleZoom(p.full, -0.2)} style={{ padding: "4px 8px", borderRadius: 8 }}>Zoom Out</button>
                    <button onClick={() => handlePhotoClick(p)} style={{ padding: "4px 8px", borderRadius: 8 }}>Close</button>
                  </div>
                  <div style={{ textAlign: "center", fontSize: 13, marginTop: 4 }}>{p.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {(!data.folders || data.folders.length === 0) && (!data.photos || data.photos.length === 0) && (
        <div style={{ padding: 16 }}>No items here.</div>
      )}
    </div>
  );
}

export default function App() {
  const [path, setPath] = useState("");

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa" }}>
      <Album path={path} setPath={setPath} />
    </div>
  );
}
