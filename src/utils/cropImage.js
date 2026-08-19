// Recorta una imagen ya cargada en el navegador a partir del rectángulo que
// devuelve react-easy-crop (en píxeles reales de la imagen original), la
// redimensiona a un tamaño manejable y la comprime — así lo que viaja al
// backend (y se guarda en la base, ver GroupsController.SetGoal) es liviano
// sin perder nitidez visible en una imagen de premio chica.
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", reject);
    img.src = src;
  });
}

export async function getCroppedImageDataUrl(
  imageSrc,
  cropPixels,
  { maxSize = 480, quality = 0.85, mimeType = "image/jpeg" } = {}
) {
  const image = await loadImage(imageSrc);

  // Primer canvas: recorta exactamente el rectángulo elegido, a resolución original.
  const cropCanvas = document.createElement("canvas");
  cropCanvas.width = cropPixels.width;
  cropCanvas.height = cropPixels.height;
  cropCanvas
    .getContext("2d")
    .drawImage(image, cropPixels.x, cropPixels.y, cropPixels.width, cropPixels.height, 0, 0, cropPixels.width, cropPixels.height);

  // Segundo canvas: reescala para que el lado mayor no pase de maxSize — no
  // tiene sentido guardar la foto de un celular entera para un ícono chico.
  const scale = Math.min(1, maxSize / Math.max(cropPixels.width, cropPixels.height));
  const outWidth = Math.max(1, Math.round(cropPixels.width * scale));
  const outHeight = Math.max(1, Math.round(cropPixels.height * scale));
  const outCanvas = document.createElement("canvas");
  outCanvas.width = outWidth;
  outCanvas.height = outHeight;
  outCanvas.getContext("2d").drawImage(cropCanvas, 0, 0, outWidth, outHeight);

  return outCanvas.toDataURL(mimeType, quality);
}
