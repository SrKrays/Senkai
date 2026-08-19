import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import Cropper from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { getCroppedImageDataUrl } from "../utils/cropImage";

// Modal de encuadre estilo Instagram — arrastrás y hacés zoom hasta que la
// foto (la remera, el objeto que sea) quede recortada como querés, antes de
// que se comprima y suba como data URL junto con el resto del objetivo.
export default function ImageCropModal({ imageSrc, aspect = 0.85, onCancel, onConfirm }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [busy, setBusy] = useState(false);

  const onCropComplete = useCallback((_, pixels) => setCroppedAreaPixels(pixels), []);

  async function handleConfirm() {
    if (!croppedAreaPixels) return;
    setBusy(true);
    try {
      const dataUrl = await getCroppedImageDataUrl(imageSrc, croppedAreaPixels);
      onConfirm(dataUrl);
    } finally {
      setBusy(false);
    }
  }

  // Portal directo a <body> — si este modal quedara anidado dentro de una
  // Card animada por framer-motion, el `transform` que motion le aplica crea
  // un "containing block" nuevo y el `position: fixed` deja de tomar la
  // pantalla completa como referencia (se ve empujado/recortado dentro de la
  // card). Montándolo en el body de una nos salteamos ese problema entero.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
      <div className="hud w-full max-w-sm border border-maroon/30 bg-card p-4">
        <p className="eyebrow mb-3">Encuadrá la imagen</p>
        <div className="relative h-72 w-full overflow-hidden bg-paper">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="mt-4 w-full accent-maroon"
        />
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            className="flex-1 bg-maroon py-2 font-mono text-[10px] uppercase tracking-widest2 text-paper transition-all duration-250 hover:shadow-glow disabled:opacity-50"
          >
            {busy ? "Procesando..." : "Usar esta imagen"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border border-maroon/25 py-2 font-mono text-[10px] uppercase tracking-widest2 text-maroon hover:bg-maroon/10"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
