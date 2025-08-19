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
    fetch(url, { credentials: "include" })
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
  console.log("Album URL:", url);
  const { data, loading, err } = useFetchJSON(url);

  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;
  if (err || !data) return <div style={{ padding: 16 }}>Error loading.</div>;

  const canBack = path && path !== "/";
  const back = canBack ? (path.split("/").slice(0, -1).join("/") || "/") : null;

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

      {data.photos?.length > 0 && (
        <>
          <h2 style={{ padding: "0 16px" }}>Photos</h2>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", padding: 16 }}>
            {data.photos.map((p) => (
              <a
                key={p.full}
                href={p.full}
                target="_blank"
                rel="noreferrer"
                style={{ border: "1px solid #ddd", borderRadius: 16, overflow: "hidden", textDecoration: "none", color: "inherit" }}
              >
                <img
                  src={p.thumb}
                  alt={p.name}
                  loading="lazy"
                  style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }}
                />
                <div style={{ padding: 8, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {p.name}
                </div>
              </a>
            ))}
          </div>
        </>
      )}

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
