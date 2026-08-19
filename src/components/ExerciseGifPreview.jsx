import { useEffect, useState } from "react";
import { apiFetchBlob } from "../utils/apiClient";
import { useAuth } from "../context/AuthContext";

// Gif de un ejercicio de WorkoutX. Se pide como blob (con el Bearer token)
// en vez de poner la URL directo en un <img src> porque el endpoint del
// backend exige auth — un <img> no puede mandar headers.
export default function ExerciseGifPreview({ exerciseId, alt, className }) {
  const { token } = useAuth();
  const [url, setUrl] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!exerciseId) {
      setUrl(null);
      return;
    }
    let objectUrl;
    let cancelled = false;
    setFailed(false);

    apiFetchBlob(`/api/external/exercises/${exerciseId}/gif`, { token })
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [exerciseId, token]);

  if (!exerciseId || failed) return null;
  if (!url) {
    return <div className={`animate-pulse bg-maroon/10 ${className ?? "h-28 w-28"}`} />;
  }
  return <img src={url} alt={alt || "Vista previa del ejercicio"} className={`object-cover ${className ?? "h-28 w-28"}`} />;
}
