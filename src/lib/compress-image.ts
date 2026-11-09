/**
 * Achica una foto en el navegador antes de subirla.
 *
 * Las fotos de celular pesan 4–12 MB y Vercel corta cualquier pedido de más
 * de 4,5 MB: sin esto, subir desde el teléfono fallaba. Además la subida es
 * mucho más rápida con datos móviles. El servidor la vuelve a optimizar.
 */
export async function compressImage(
  file: File,
  { maxSide = 2600, quality = 0.88 } = {}
): Promise<File> {
  if (!file.type.startsWith("image/") || /gif|svg/.test(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    // Ya es chica y liviana: se sube tal cual, sin recomprimir.
    if (scale === 1 && file.size <= 2.5 * 1024 * 1024) {
      bitmap.close();
      return file;
    }
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    // Fondo blanco: un PNG con transparencia no queda negro al pasar a JPEG.
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    const blob = await new Promise<Blob | null>((r) =>
      canvas.toBlob(r, "image/jpeg", quality)
    );
    if (!blob || blob.size >= file.size) return file;
    const name = file.name.replace(/\.[^.]+$/, "") || "foto";
    return new File([blob], `${name}.jpg`, { type: "image/jpeg" });
  } catch {
    // Formato que el navegador no sabe abrir (p. ej. HEIC en Windows):
    // se manda el original y que decida el servidor.
    return file;
  }
}
