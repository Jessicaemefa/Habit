import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin the tracing root to this project folder so Next.js doesn't
  // walk up to Documents/ and pick up the wrong lockfile.
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
