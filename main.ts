// news-image-20261126 - entry runner.
//
// Copies the prebuilt entry.png into the output directory and checks it.
// Pure Node 22, standard library only, no network, no child processes.
// The grader runs this as `node main.ts` with MAKEFUN_OUTPUT_DIR set to
// a writable /output; the artwork was drawn by our Satori-based
// news-toolkit and ships here as a static file, so grading needs no
// Python at all (generate.mjs, the artwork's source, is kept in this
// repository for reference only).
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const EXPECTED_WIDTH = 1024;
const EXPECTED_HEIGHT = 1024;
const MAX_BYTES = 1048576;
const PNG_MAGIC = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

function fail(message: string): never {
  console.error(`entry check failed: ${message}`);
  process.exit(1);
}

function resolveOutputDir(here: string): string {
  const fromEnv = process.env.MAKEFUN_OUTPUT_DIR;
  if (fromEnv && fromEnv.length > 0) {
    return fromEnv;
  }
  if (existsSync("/output")) {
    return "/output";
  }
  return here;
}

function verifyPng(bytes: Buffer): { width: number; height: number } {
  if (bytes.length > MAX_BYTES) {
    fail(`entry.png is ${bytes.length} bytes, over the 1 MiB limit`);
  }
  if (bytes.length < 33 || !bytes.subarray(0, 8).equals(PNG_MAGIC)) {
    fail("entry.png does not start with the PNG signature");
  }
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  if (width !== EXPECTED_WIDTH || height !== EXPECTED_HEIGHT) {
    fail(
      `entry.png is ${width}x${height}, expected ` +
        `${EXPECTED_WIDTH}x${EXPECTED_HEIGHT}`,
    );
  }
  return { width, height };
}

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolveOutputDir(here);
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "entry.png");

copyFileSync(join(here, "entry.png"), outPath);

const png = readFileSync(outPath);
const { width, height } = verifyPng(png);
const sha256 = createHash("sha256").update(png).digest("hex");
console.log(
  `entry.png: ${png.length} bytes, ${width}x${height}, sha256=${sha256}`,
);
console.log(`OK ${outPath}`);
