"use client";

import { useRef, useState } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Camera, X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  photos: string[];
  auditId: string;
  itemId: string;
  disabled?: boolean;
  onPhotosChange: (photos: string[]) => void;
};

export function PhotoUploader({ photos, auditId, itemId, disabled, onPhotosChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [annotating, setAnnotating] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0 || disabled) return;
    setUploading(true);

    try {
      const { default: compress } = await import("browser-image-compression");
      const supabase = createClient();
      const newPhotos: string[] = [];

      for (const file of Array.from(files)) {
        const compressed = await compress(file, {
          maxWidthOrHeight: 1920,
          maxSizeMB: 0.3,
          useWebWorker: true,
        });

        const path = `${auditId}/${itemId}/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
        const { error } = await supabase.storage
          .from("audit-photos")
          .upload(path, compressed, { contentType: "image/jpeg", upsert: false });

        if (!error) {
          const { data } = supabase.storage.from("audit-photos").getPublicUrl(path);
          newPhotos.push(data.publicUrl);
        }
      }

      onPhotosChange([...photos, ...newPhotos]);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removePhoto(url: string) {
    onPhotosChange(photos.filter((p) => p !== url));
  }

  return (
    <div className="space-y-2">
      {/* Grid de fotos */}
      {photos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {photos.map((url) => (
            <div key={url} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt="Evidência"
                className="h-20 w-20 object-cover rounded border border-border cursor-pointer"
                onClick={() => setAnnotating(url)}
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removePhoto(url); }}
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Botão de adicionar foto */}
      {!disabled && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-dashed border-border rounded px-3 py-1.5 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Camera className="h-3.5 w-3.5" />
            )}
            {uploading ? "Enviando…" : "Adicionar foto"}
          </button>
        </>
      )}

      {/* Anotação de foto (canvas overlay) */}
      {annotating && (
        <PhotoAnnotator
          url={annotating}
          auditId={auditId}
          itemId={itemId}
          onSave={(annotatedUrl) => {
            const updated = photos.map((p) => (p === annotating ? annotatedUrl : p));
            onPhotosChange(updated);
            setAnnotating(null);
          }}
          onClose={() => setAnnotating(null)}
        />
      )}
    </div>
  );
}

// ── Anotador de foto (canvas) ────────────────────────────────

type AnnotatorProps = {
  url: string;
  auditId: string;
  itemId: string;
  onSave: (url: string) => void;
  onClose: () => void;
};

function PhotoAnnotator({ url, auditId, itemId, onSave, onClose }: AnnotatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tool, setTool] = useState<"freehand" | "circle" | "arrow">("freehand");
  const startPoint = useRef<{ x: number; y: number } | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const snapshotRef = useRef<ImageData | null>(null);

  function initCanvas(img: HTMLImageElement) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const scale = Math.min(window.innerWidth * 0.9 / img.naturalWidth, 560 / img.naturalHeight);
    canvas.width = img.naturalWidth * scale;
    canvas.height = img.naturalHeight * scale;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    imageRef.current = img;
  }

  function getPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const pos = getPos(e);
    setDrawing(true);
    startPoint.current = pos;
    snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#B3261E"; // --nc
    ctx.lineWidth = 3;
    ctx.lineCap = "round";

    if (tool === "freehand") {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing || !startPoint.current) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const pos = getPos(e);

    if (tool === "freehand") {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (snapshotRef.current) {
      ctx.putImageData(snapshotRef.current, 0, 0);
      ctx.strokeStyle = "#B3261E"; // --nc
      ctx.lineWidth = 3;
      const { x: sx, y: sy } = startPoint.current;

      if (tool === "circle") {
        const r = Math.hypot(pos.x - sx, pos.y - sy);
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (tool === "arrow") {
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        // Ponta da seta
        const angle = Math.atan2(pos.y - sy, pos.x - sx);
        const len = 16;
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(pos.x - len * Math.cos(angle - 0.4), pos.y - len * Math.sin(angle - 0.4));
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(pos.x - len * Math.cos(angle + 0.4), pos.y - len * Math.sin(angle + 0.4));
        ctx.stroke();
      }
    }
  }

  function onPointerUp() {
    setDrawing(false);
    startPoint.current = null;
  }

  async function handleSave() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSaving(true);
    try {
      const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/jpeg", 0.85));
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const path = `${auditId}/${itemId}/annotated_${Date.now()}.jpg`;
      await supabase.storage.from("audit-photos").upload(path, blob, { contentType: "image/jpeg" });
      const { data } = supabase.storage.from("audit-photos").getPublicUrl(path);
      onSave(data.publicUrl);
    } finally {
      setSaving(false);
    }
  }

  return (
    <DialogPrimitive.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Popup
          className="fixed inset-0 z-60 flex flex-col bg-black/90 outline-none"
          data-slot="photo-annotator"
        >
          <DialogPrimitive.Title className="sr-only">Anotar foto</DialogPrimitive.Title>

          {/* Toolbar */}
          <div className="flex items-center gap-2 p-3 bg-black/60">
            {(["freehand", "circle", "arrow"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTool(t)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  tool === t ? "bg-[var(--nc)] text-white" : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {t === "freehand" ? "Traço livre" : t === "circle" ? "Círculo" : "Seta"}
              </button>
            ))}
            <div className="flex-1" />
            <button onClick={onClose} className="text-white/70 hover:text-white text-xs px-3 py-1.5">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-primary text-white text-xs px-3 py-1.5 rounded font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? "Salvando…" : "Salvar"}
            </button>
          </div>

          {/* Canvas */}
          <div className="flex-1 flex items-center justify-center overflow-auto p-4">
            <canvas
              ref={canvasRef}
              className="max-w-full touch-none cursor-crosshair"
              style={{ touchAction: "none" }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            />
            {/* Carrega a imagem no canvas */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt=""
              className="hidden"
              onLoad={(e) => initCanvas(e.currentTarget)}
              crossOrigin="anonymous"
            />
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
