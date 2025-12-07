import crypto from "node:crypto";

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

export function ensureCloudinaryCredentials() {
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary credentials are missing. Please define CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your environment.",
    );
  }
}

export function getCloudinaryConfig() {
  ensureCloudinaryCredentials();
  return {
    cloudName: cloudName!,
    apiKey: apiKey!,
  };
}

export function createCloudinarySignature(params: Record<string, string>) {
  ensureCloudinaryCredentials();
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return crypto.createHash("sha1").update(`${sortedParams}${apiSecret!}`).digest("hex");
}

