import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const source = path.join(root, "assets", "studio-vault-icon-512.png");

const appDir = path.join(root, "app");
const publicDir = path.join(root, "public");

async function main() {
  const input = await readFile(source);

  await writeFile(path.join(appDir, "icon.png"), await sharp(input).resize(512, 512).png().toBuffer());

  await writeFile(
    path.join(appDir, "apple-icon.png"),
    await sharp(input).resize(180, 180).png().toBuffer(),
  );

  const faviconSizes = [16, 32, 48];
  const faviconPngs = await Promise.all(
    faviconSizes.map((size) => sharp(input).resize(size, size).png().toBuffer()),
  );

  const ico = await pngToIco(faviconPngs);
  await writeFile(path.join(appDir, "favicon.ico"), ico);

  await mkdir(publicDir, { recursive: true });
  await writeFile(path.join(publicDir, "icon.svg"), SVG_ICON);
  await writeFile(path.join(publicDir, "favicon.svg"), SVG_ICON);

  console.log("Generated app/icon.png, app/apple-icon.png, app/favicon.ico, public/icon.svg");
}

const SVG_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" role="img" aria-label="Studio Vault">
  <rect width="32" height="32" rx="7" fill="#111114"/>
  <rect x="0.5" y="0.5" width="31" height="31" rx="6.5" stroke="#27272a"/>
  <rect x="7" y="7" width="7.5" height="7.5" rx="1.75" fill="#3b82f6"/>
  <rect x="17.5" y="7" width="7.5" height="7.5" rx="1.75" fill="#3b82f6" opacity="0.55"/>
  <rect x="7" y="17.5" width="7.5" height="7.5" rx="1.75" fill="#3b82f6" opacity="0.55"/>
  <rect x="17.5" y="17.5" width="7.5" height="7.5" rx="1.75" fill="#3b82f6" opacity="0.3"/>
</svg>
`;

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
