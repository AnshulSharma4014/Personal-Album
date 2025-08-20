import { useEffect, useMemo, useRef, useState } from "react";
import LoginPage from "./components/LoginPage.jsx";

const API = import.meta.env.VITE_API ?? "";

/* ---------- helpers ---------- */
function absUrl(u) {
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  const base = API.replace(/\/+$/, "");
  const path = (`${u}`).startsWith("/") ? u : `/${u}`;
  return `${base}${path}`;
}

// Add ?token=... to media/watch URLs so <img>/<video> and /watch authorize
function withToken(u, token) {
  if (!token) return u;
  try {
    const url = new URL(u, API || window.location.origin);
    const p = url.pathname;
    if (p.startsWith("/api/photo/") || p.startsWith("/api/thumb/") || p.startsWith("/api/vthumb/") || p.startsWith("/api/video/") || p.startsWith("/watch/")) {
      url.searchParams.set("token", token);
    }
    return url.toString();
  } catch {
    const needs = u.startsWith("/api/") || u.startsWith("/watch/");
    return needs ? `${u}${u.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}` : u;
  }
}

function useFetchJSON(url, token) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    fetch(url, {
      headers,
      credentials: "include", // allows cookie fallback if you’re same-origin
    })
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return r.json();
      })
      .then((j) => alive && setData(j))
      .catch((e) => alive && setErr(e))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [url, token]);

  return { data, err, loading };
}

/* Detect mobile by viewport width */
function useIsMobile(breakpointPx = 900) {
  const get = () =>
    typeof window !== "undefined" &&
    window.matchMedia(`(max-width:${breakpointPx}px)`).matches;
  const [isMobile, setIsMobile] = useState(get);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width:${breakpointPx}px)`);
    const handler = (e) => setIsMobile(e.matches);
    if (mql.addEventListener) mql.addEventListener("change", handler);
    else mql.addListener(handler);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", handler);
      else mql.removeListener(handler);
    };
  }, [breakpointPx]);
  return isMobile;
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
          style={{ padding: "6px 12px", borderRadius: 12, border: "1px solid #000", background: "#000", color: "#fff", cursor: "pointer" }}
        >
          ⬅ Back
        </button>
      )}
    </div>
  );
}

function FolderIcon({ size = 20, color = "#888" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect x="2" y="6" width="16" height="10" rx="2" fill={color} />
      <path d="M2 6V4a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v2" stroke={color} strokeWidth="1.5" fill="none"/>
    </svg>
  );
}

function FolderButton({ folder, onClick }) {
  return (
    <button
      key={folder.path}
      onClick={() => onClick(folder.path)}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        textAlign: "left", border: "1px solid #000", borderRadius: 12, padding: 10,
        background: "#fafafa", cursor: "pointer",
      }}
    >
      <FolderIcon />
      <div style={{ flex: 1, color: "black" }}>
        <div style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {decodeURIComponent(folder.name)}
        </div>
      </div>
    </button>
  );
}

function PhotoButton({ photo, isActive, onClick }) {
  return (
    <button
      key={photo.key}
      onClick={onClick}
      style={{
        border: isActive ? "2px solid #4b8bfd" : "1px solid #ddd",
        borderRadius: 16, padding: 0, overflow: "hidden",
        cursor: "pointer", background: "#fff", minHeight: 140,
      }}
      title={photo.name}
    >
      <img
        src={photo.thumbUrl}
        alt={photo.name}
        loading="lazy"
        style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }}
        onError={(e) => { e.currentTarget.style.opacity = 0.2; }}
      />
    </button>
  );
}

function VideoButton({ video, isActive, onClick }) {
  return (
    <button
      key={video.key}
      onClick={onClick}
      style={{
        border: isActive ? "2px solid #4b8bfd" : "1px solid #ddd",
        borderRadius: 16, padding: 0, overflow: "hidden",
        cursor: "pointer", background: "#fff", minHeight: 140, position: "relative",
      }}
      title={video.name}
    >
      {video.thumbUrl ? (
        <img
          src={video.thumbUrl}
          alt={video.name}
          loading="lazy"
          style={{ width: "100%", height: 140, objectFit: "cover", display: "block", filter: "brightness(0.85)" }}
          onError={(e) => { e.currentTarget.style.opacity = 0.2; }}
        />
      ) : (
        <div style={{ width: "100%", height: 140, display: "flex", alignItems: "center", justifyContent: "center", background: "#eee" }}>
          🎬
        </div>
      )}
      <div style={{
        position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        pointerEvents: "none"
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: "50%", background: "rgba(0,0,0,.6)",
          display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 16
        }}>▶</div>
      </div>
    </button>
  );
}

/* ---------- main ---------- */
function Album({ path, setPath, token }) {
  const isMobile = useIsMobile(900);

  const url = path ? `${API}/api/albums${path}` : `${API}/api/albums`;
  const { data, loading, err } = useFetchJSON(url, token);

  const folders = useMemo(() => (Array.isArray(data) ? [] : data?.folders ?? []), [data]);

  const photos = useMemo(() => {
    const raw = Array.isArray(data) ? (data ?? []) : (data?.photos ?? []);
    return raw.map((p) => ({
      type: "photo",
      name: p.name || p.fileName || "",
      thumbUrl: withToken(absUrl(p.thumb || p.thumbnail || p.url || p.full), token),
      fullUrl: withToken(absUrl(p.full || p.url || p.src || p.thumb), token),
      key: (p.full || p.thumb || p.url || p.name || Math.random().toString(36)),
    }));
  }, [data, token]);

  const videos = useMemo(() => {
    const raw = Array.isArray(data) ? [] : (data?.videos ?? []);
    return raw.map((v) => {
      const full = withToken(absUrl(v.full || v.url || v.src || ""), token);
      const watch = withToken(full.replace("/api/video/", "/watch/"), token);
      return {
        type: "video",
        name: v.name || v.fileName || "",
        thumbUrl: withToken(absUrl(v.thumb || v.poster || v.thumbnail || ""), token),
        fullUrl: full,
        watchUrl: watch,
        key: (v.full || v.url || v.name || Math.random().toString(36)),
      };
    });
  }, [data, token]);

  // selection + zoom (desktop)
  const [selected, setSelected] = useState(null); // {type, ...}
  useEffect(() => {
    if (photos.length) setSelected(photos[0]);
    else if (videos.length) setSelected(videos[0]);
    else setSelected(null);
  }, [url, photos, videos]);

  const [zoom, setZoom] = useState(1);
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
  const zoomIn = () => setZoom((z) => clamp(z + 0.25, 0.25, 4));
  const zoomOut = () => setZoom((z) => clamp(z - 0.25, 0.25, 4));
  const zoomReset = () => setZoom(1);

  // video controls
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  useEffect(() => {
    setZoom(1);
    setIsPlaying(false);
    setMuted(false);
    setVolume(1);
    if (videoRef.current) { videoRef.current.pause(); videoRef.current.currentTime = 0; }
  }, [selected?.key]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setIsPlaying(true); } else { v.pause(); setIsPlaying(false); }
  };
  const toggleMute = () => { if (!videoRef.current) return; videoRef.current.muted = !videoRef.current.muted; setMuted(videoRef.current.muted); };
  const changeVol = (x) => { const v = Math.min(Math.max(x, 0), 1); setVolume(v); if (videoRef.current) videoRef.current.volume = v; };

  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;
  if (err || !data) return <div style={{ padding: 16 }}>Error loading.</div>;

  const canBack = path && path !== "/";
  const back = canBack ? (path.split("/").slice(0, -1).join("/") || "/") : null;

  const items = [
    ...folders.map((f) => ({ type: "folder", data: f })),
    ...photos.map((p) => ({ type: "photo", data: p })),
    ...videos.map((v) => ({ type: "video", data: v })),
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        minHeight: "100vh",
        minWidth: "100vw",
        background: isMobile ? "#fff" : "#111",
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: isMobile ? "100%" : 340,
          background: "#fff",
          borderRight: isMobile ? "none" : "1px solid #eee",
          display: "flex",
          flexDirection: "column",
          height: isMobile ? "auto" : "100vh",
        }}
      >
        <Toolbar path={path || "/"} onBack={back ? () => setPath(back) : null} />

        <div
          style={{
            padding: 12,
            display: "grid",
            gap: 12,
            gridTemplateColumns: isMobile ? "repeat(3, minmax(0,1fr))" : "repeat(2, minmax(0,1fr))",
            overflowY: isMobile ? "visible" : "auto",
            flex: 1,
          }}
        >
          {items.map((item) => {
            if (item.type === "folder") {
              return <FolderButton key={item.data.path} folder={item.data} onClick={setPath} />;
            }
            if (item.type === "photo") {
              const isActive = !isMobile && selected && selected.key === item.data.key;
              return (
                <PhotoButton
                  key={item.data.key}
                  photo={item.data}
                  isActive={isActive}
                  onClick={() => {
                    if (isMobile) window.open(item.data.fullUrl, "_blank", "noopener,noreferrer");
                    else setSelected(item.data);
                  }}
                />
              );
            }
            const isActive = !isMobile && selected && selected.key === item.data.key;
            return (
              <VideoButton
                key={item.data.key}
                video={item.data}
                isActive={isActive}
                onClick={() => {
                  if (isMobile) window.open(item.data.fullUrl, "_blank", "noopener,noreferrer");
                  else setSelected(item.data);
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Viewer (desktop only) */}
      {!isMobile && (
        <div style={{ flex: 1, position: "relative", background: "#111", height: "100vh" }}>
          {/* controls */}
          {selected?.type === "photo" ? (
            <div style={{ position: "absolute", top: 12, left: 12, zIndex: 2, display: "flex", gap: 8 }}>
              <button onClick={zoomOut} style={ctlBtn}>−</button>
              <button onClick={zoomIn} style={ctlBtn}>+</button>
              <button onClick={zoomReset} style={ctlBtn}>Reset</button>
            </div>
          ) : selected?.type === "video" ? (
            <div style={{ position: "absolute", top: 12, left: 12, zIndex: 2, display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={togglePlay} style={ctlBtn}>{isPlaying ? "Pause" : "Play"}</button>
              <button onClick={toggleMute} style={ctlBtn}>{muted ? "Unmute" : "Mute"}</button>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#fff" }}>
                <span style={{ fontSize: 12 }}>Vol</span>
                <input type="range" min="0" max="1" step="0.05" value={volume} onChange={(e) => changeVol(parseFloat(e.target.value))} />
              </div>
            </div>
          ) : null}

          {/* media */}
          <div
            style={{
              position: "relative",
              inset: 0,
              overflow: "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100vh",
            }}
          >
            {!selected ? (
              <div style={{ color: "#aaa" }}>Select a photo or video on the left</div>
            ) : selected.type === "photo" ? (
              <img
                src={selected.fullUrl}
                alt={selected.name}
                style={{
                  maxWidth: "92%",
                  maxHeight: "92vh",
                  transform: `scale(${zoom})`,
                  transformOrigin: "center center",
                  transition: "transform 120ms ease",
                  borderRadius: 8,
                  boxShadow: "0 10px 30px rgba(0,0,0,.5)",
                  objectFit: "contain",
                  display: "block",
                }}
                onDoubleClick={zoomReset}
                onError={(e) => { e.currentTarget.style.opacity = 0.2; }}
              />
            ) : (
              <video
                ref={videoRef}
                src={selected.fullUrl}
                poster={selected.thumbUrl || undefined}
                controls
                style={{
                  maxWidth: "92%",
                  maxHeight: "92vh",
                  borderRadius: 8,
                  boxShadow: "0 10px 30px rgba(0,0,0,.5)",
                  background: "#000",
                }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onVolumeChange={(e) => setVolume(e.currentTarget.volume)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const ctlBtn = {
  padding: "6px 10px",
  borderRadius: 10,
  border: "1px solid #444",
  background: "#1e1e1e",
  color: "#fff",
  cursor: "pointer",
};

export default function App() {
  const [loggedIn, setLoggedIn] = useState(() => !!localStorage.getItem("pa_token"));
  const [token, setToken] = useState(() => localStorage.getItem("pa_token") || "");
  const [path, setPath] = useState(""); // "" = top-level

  async function handleLogin(username, password) {
    const base = API || "";
    const res = await fetch(`${base}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // ok to keep; cookie if same-origin
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new Error("Invalid credentials");
    const j = await res.json();
    if (j?.token) {
      setToken(j.token);
      localStorage.setItem("pa_token", j.token);
    }
    setLoggedIn(true);
  }

  if (!loggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <Album path={path} setPath={setPath} token={token} />;
}
