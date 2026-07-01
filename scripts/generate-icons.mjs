// Generate all PWA / favicon sizes from src/assets/logo.png.
// Run: node scripts/generate-icons.mjs
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src/assets/logo.png");
const PUB = path.join(ROOT, "public");
const ICONS = path.join(PUB, "icons");

fs.mkdirSync(ICONS, { recursive: true });

const BG = { r: 0, g: 0, b: 0, alpha: 1 }; // dark background — matches manifest

async function makeSquare(size, out, { padding = 0.16, background = BG } = {}) {
  const inner = Math.round(size * (1 - padding * 2));
  const buf = await sharp(SRC)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background },
  })
    .composite([{ input: buf, gravity: "center" }])
    .png()
    .toFile(out);
  console.log("✓", path.relative(ROOT, out), `(${size}×${size})`);
}

async function makeTransparent(size, out) {
  await sharp(SRC)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(out);
  console.log("✓", path.relative(ROOT, out), `(${size}×${size} transparent)`);
}

// Favicons (transparent)
await makeTransparent(16, path.join(PUB, "favicon-16.png"));
await makeTransparent(32, path.join(PUB, "favicon-32.png"));
await makeTransparent(48, path.join(PUB, "favicon-48.png"));

// Apple touch (opaque — Safari requires it)
await makeSquare(180, path.join(PUB, "apple-touch-icon.png"), { padding: 0.12 });

// PWA icons
await makeSquare(192, path.join(ICONS, "icon-192.png"), { padding: 0.1 });
await makeSquare(512, path.join(ICONS, "icon-512.png"), { padding: 0.1 });
await makeSquare(512, path.join(ICONS, "icon-512-maskable.png"), { padding: 0.22 });

// Canonical logo referenced in manifest / og / fallback
await makeSquare(512, path.join(PUB, "logo.png"), { padding: 0.1 });

// favicon.ico — multi-size (16, 32, 48) via png-to-ico
try {
  const [b16, b32, b48] = await Promise.all([
    fs.promises.readFile(path.join(PUB, "favicon-16.png")),
    fs.promises.readFile(path.join(PUB, "favicon-32.png")),
    fs.promises.readFile(path.join(PUB, "favicon-48.png")),
  ]);
  const { default: pngToIco } = await import("png-to-ico");
  const ico = await pngToIco([b16, b32, b48]);
  fs.writeFileSync(path.join(PUB, "favicon.ico"), ico);
  console.log("✓ public/favicon.ico (16/32/48)");
} catch (e) {
  console.warn("skip favicon.ico — install png-to-ico to enable:", e.message);
}
