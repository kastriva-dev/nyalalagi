import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  const file = path.join(process.cwd(), "public", "sw.js");
  const source = fs.readFileSync(file, "utf8")
    .replace("%%FIREBASE_API_KEY%%", process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "")
    .replace("%%FIREBASE_AUTH_DOMAIN%%", process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "")
    .replace("%%FIREBASE_PROJECT_ID%%", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "")
    .replace("%%FIREBASE_STORAGE_BUCKET%%", process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "")
    .replace("%%FIREBASE_MESSAGING_SENDER_ID%%", process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "")
    .replace("%%FIREBASE_APP_ID%%", process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "");

  return new NextResponse(source, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate"
    }
  });
}
