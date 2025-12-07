import { NextResponse } from "next/server";

import { createCloudinarySignature, getCloudinaryConfig } from "@/lib/cloudinary";

export async function POST(request: Request) {
  try {
    const { folder } = (await request.json().catch(() => ({}))) as { folder?: string };
    const timestamp = Math.round(Date.now() / 1000);
    const params: Record<string, string> = { timestamp: timestamp.toString() };
    if (folder) {
      params.folder = folder;
    }
    const signature = createCloudinarySignature(params);
    const { cloudName, apiKey } = getCloudinaryConfig();

    return NextResponse.json({
      signature,
      timestamp,
      cloudName,
      apiKey,
      folder,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate Cloudinary signature.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

