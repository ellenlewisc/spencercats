import type { NextConfig } from "next";
import { BUCKET } from "./lib/storage";

const supabaseUrl = new URL(requireEnv("NEXT_PUBLIC_SUPABASE_URL"));
assertBrowserKeyIsPublic(requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"));

const isDev = process.env.NODE_ENV !== "production";

const contentSecurityPolicy = [
  "default-src 'self'",
  // Next's inline bootstrap scripts need 'unsafe-inline' unless every page is rendered with a per-request nonce.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabaseUrl.origin}`,
  "font-src 'self'",
  `connect-src 'self' ${supabaseUrl.origin} wss://${supabaseUrl.host}`,
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseUrl.hostname,
        pathname: `/storage/v1/object/public/${BUCKET}/**`,
      },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}. See README.md > Getting started.`);
  return value;
}

// NEXT_PUBLIC_ values are shipped to every visitor, so a privileged key here would be public.
function assertBrowserKeyIsPublic(key: string): void {
  if (key.startsWith("sb_secret_")) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is a secret key. Use the publishable/anon key instead.");
  }
  const payload = key.split(".")[1];
  if (!payload) return;
  try {
    const { role } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { role?: string };
    if (role && role !== "anon") {
      throw new Error(`NEXT_PUBLIC_SUPABASE_ANON_KEY has role "${role}". Use the anon/publishable key instead.`);
    }
  } catch (error) {
    if (error instanceof SyntaxError) return;
    throw error;
  }
}
