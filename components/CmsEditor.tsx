"use client";

import { useState } from "react";
import { Check, ImagePlus, Loader2, Save, X } from "lucide-react";
import { SiteContent, saveSiteContent, uploadCMSImage, mergeContent } from "@/lib/cms";

type Target = { kind: "text" | "image"; path: string; label: string; imageSection?: string; imageIndex?: number };

function getAt(obj: any, path: string) {
  return path.split(".").reduce((v, k) => v?.[k], obj);
}

function setAt(obj: any, path: string, value: any) {
  const keys = path.split(".");
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!(keys[i] in cur)) cur[keys[i]] = {};
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
}

export default function CmsEditor({ initialContent }: { initialContent: SiteContent }) {
  const [content, setContent] = useState<SiteContent>(initialContent);
  const [editingTarget, setEditingTarget] = useState<Target | null>(null);
  const [tempValue, setTempValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const targets: Target[] = [
    { kind: "text", path: "hero.headline", label: "Hero Headline" },
    { kind: "text", path: "hero.subheading", label: "Hero Subheading" },
    { kind: "image", path: "hero.backgroundImage", label: "Hero Background", imageSection: "hero", imageIndex: 0 },
    { kind: "text", path: "features.title", label: "Features Title" },
    { kind: "text", path: "services.title", label: "Services Title" },
    { kind: "text", path: "testimonials.title", label: "Testimonials Title" },
  ];

  const handleEditClick = (target: Target) => {
    const value = getAt(content, target.path);
    setTempValue(typeof value === "string" ? value : "");
    setEditingTarget(target);
  };

  const handleSaveEdit = async () => {
    if (!editingTarget) return;

    const updated = { ...content };
    setAt(updated, editingTarget.path, tempValue);
    setContent(updated);
    setEditingTarget(null);
    setMessage({ type: "success", text: "Perubahan disimpan secara lokal." });

    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingTarget) return;

    setUploading(true);
    try {
      const section = editingTarget.imageSection || "general";
      const index = editingTarget.imageIndex;
      const url = await uploadCMSImage(file, section, index);
      const updated = { ...content };
      setAt(updated, editingTarget.path, url);
      setContent(updated);
      setEditingTarget(null);
      setMessage({ type: "success", text: "Gambar berhasil diunggah." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Gagal mengunggah gambar" });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const merged = mergeContent(content);
      await saveSiteContent(merged);
      setMessage({ type: "success", text: "Semua perubahan berhasil disimpan!" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Gagal menyimpan perubahan" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "var(--space-2xl) 0" }}>
      <h1 style={{ marginBottom: "var(--space-md)" }}>CMS Editor</h1>
      <p style={{ color: "var(--gray-400)", marginBottom: "var(--space-2xl)" }}>
        Edit konten situs langsung dari dashboard ini.
      </p>

      {message.text && (
        <div
          className={`alert ${message.type === "success" ? "alert-success" : "alert-error"}`}
          style={{ marginBottom: "var(--space-2xl)" }}
        >
          {message.text}
        </div>
      )}

      <div style={{ display: "grid", gap: "var(--space-2xl)" }}>
        {/* Edit Modal */}
        {editingTarget && (
          <div className="glass-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-lg)" }}>
              <h3 style={{ margin: 0 }}>Edit: {editingTarget.label}</h3>
              <button onClick={() => setEditingTarget(null)} className="btn btn-ghost btn-icon">
                <X size={20} />
              </button>
            </div>

            {editingTarget.kind === "text" ? (
              <>
                <textarea
                  className="form-textarea"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  style={{ marginBottom: "var(--space-lg)" }}
                  rows={5}
                />
                <button onClick={handleSaveEdit} className="btn btn-primary">
                  <Check size={18} />
                  Simpan Perubahan
                </button>
              </>
            ) : (
              <>
                <label
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "var(--space-3xl) var(--space-lg)",
                    border: "2px dashed var(--glass-border)",
                    borderRadius: "var(--radius-lg)",
                    cursor: "pointer",
                    transition: "all var(--transition-base)",
                    backgroundColor: "rgba(59, 130, 246, 0.05)",
                    marginBottom: "var(--space-lg)",
                  }}
                >
                  <ImagePlus size={32} style={{ color: "var(--accent-blue)", marginBottom: "var(--space-md)" }} />
                  <span style={{ fontWeight: "600", marginBottom: "var(--space-sm)" }}>Klik untuk pilih gambar</span>
                  <span style={{ fontSize: "0.875rem", color: "var(--gray-400)" }}>
                    JPG, PNG, atau GIF (Max 5MB)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    style={{ display: "none" }}
                  />
                </label>
              </>
            )}
          </div>
        )}

        {/* Edit Targets */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "var(--space-lg)" }}>
          {targets.map((target) => (
            <div key={`${target.path}`} className="glass-card">
              <p style={{ fontSize: "0.875rem", color: "var(--gray-400)", margin: "0 0 var(--space-md) 0" }}>
                {target.label}
              </p>
              <p style={{ color: "var(--gray-300)", marginBottom: "var(--space-lg)", minHeight: "3em", overflow: "hidden", textOverflow: "ellipsis" }}>
                {getAt(content, target.path)?.toString().substring(0, 100)}...
              </p>
              <button onClick={() => handleEditClick(target)} className="btn btn-secondary btn-sm" style={{ width: "100%" }}>
                {target.kind === "text" ? "Edit Teks" : "Ganti Gambar"}
              </button>
            </div>
          ))}
        </div>

        {/* Save All */}
        <div style={{ textAlign: "center", paddingTop: "var(--space-2xl)", borderTop: "1px solid var(--glass-border)" }}>
          <button onClick={handleSaveAll} disabled={saving} className="btn btn-primary btn-lg">
            {saving ? (
              <>
                <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
                Menyimpan...
              </>
            ) : (
              <>
                <Save size={20} />
                Simpan Semua Perubahan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
