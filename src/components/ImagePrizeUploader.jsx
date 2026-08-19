import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import ImageCropModal from "./ImageCropModal";

// Selector de imagen genérico con recorte — se usa tanto para la foto del
// premio de un objetivo grupal como para las etapas de personaje en
// Personalización. Elegís un archivo, lo encuadrás en el modal, y queda
// como data URL lista para mandar. Los GIFs animados se saltean el recorte
// (un canvas solo captura un frame fijo, así que recortarlos les mataría la
// animación) y se suben directo, con el mismo tope de tamaño.
export default function ImagePrizeUploader({ value, onChange, aspect = 0.85, size = 64, hint }) {
  const inputRef = useRef(null);
  const [rawSrc, setRawSrc] = useState(null);

  function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite volver a elegir el mismo archivo más tarde
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (file.type === "image/gif") {
        onChange(reader.result); // sin recorte, para no perder la animación
      } else {
        setRawSrc(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex items-center gap-3">
      {value ? (
        <div className="relative shrink-0 overflow-hidden border border-maroon/30" style={{ width: size, height: size }}>
          <img src={value} alt="" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-0 top-0 bg-paper/90 p-0.5 text-maroon"
            title="Quitar imagen"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex shrink-0 flex-col items-center justify-center gap-1 border border-dashed border-maroon/30 text-maroon hover:bg-maroon/10"
          style={{ width: size, height: size }}
        >
          <ImagePlus size={18} />
          <span className="font-mono text-[8px] uppercase tracking-widest2">Foto</span>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      {hint !== null && (
        <p className="font-mono text-[10px] text-muted">
          {hint ?? (value ? "Imagen lista — tocá la X para sacarla." : "Imagen o GIF (los GIF se suben sin recortar).")}
        </p>
      )}

      {rawSrc && (
        <ImageCropModal
          imageSrc={rawSrc}
          aspect={aspect}
          onCancel={() => setRawSrc(null)}
          onConfirm={(dataUrl) => {
            onChange(dataUrl);
            setRawSrc(null);
          }}
        />
      )}
    </div>
  );
}
