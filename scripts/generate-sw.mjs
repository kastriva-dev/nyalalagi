import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const templatePath = path.join(root, "lib", "sw-template.js");
const outputPath = path.join(root, "public", "sw.js");
const template = fs.readFileSync(templatePath, "utf8");

const replacements = {
  "%%PWA_VERSION%%": process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) || process.env.NEXT_PUBLIC_APP_VERSION || `local-${Date.now()}`,
  "%%FIREBASE_API_KEY%%": process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  "%%FIREBASE_AUTH_DOMAIN%%": process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  "%%FIREBASE_PROJECT_ID%%": process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  "%%FIREBASE_STORAGE_BUCKET%%": process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  "%%FIREBASE_MESSAGING_SENDER_ID%%": process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  "%%FIREBASE_APP_ID%%": process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ""
};

let source = template;
for (const [needle, value] of Object.entries(replacements)) {
  source = source.split(needle).join(String(value).replaceAll("\\", "\\\\").replaceAll('"', '\\"'));
}

fs.writeFileSync(outputPath, source, "utf8");
console.log(`Generated public/sw.js (${replacements["%%PWA_VERSION%%"]})`);
