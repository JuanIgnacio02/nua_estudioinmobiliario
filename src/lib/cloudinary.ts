import "server-only";
import { v2 as cloudinary } from "cloudinary";

/**
 * Cloudinary uploader (server-only). Returns null when not configured, so the
 * admin falls back to local filesystem storage in dev. On Vercel this is the
 * production image pipeline: compression + auto format/quality on delivery.
 */

let configured = false;

function client() {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = process.env.CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud_name || !api_key || !api_secret) return null;
  if (!configured) {
    cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
    configured = true;
  }
  return cloudinary;
}

export function cloudinaryEnabled() {
  return client() !== null;
}

/** Uploads a WebP buffer and returns its secure delivery URL. */
export async function uploadToCloudinary(
  buf: Buffer,
  folder = "nua"
): Promise<string | null> {
  const c = client();
  if (!c) return null;
  const dataUri = `data:image/webp;base64,${buf.toString("base64")}`;
  const res = await c.uploader.upload(dataUri, {
    folder,
    resource_type: "image",
  });
  return res.secure_url;
}
