import { getConnInfo } from "@hono/node-server/conninfo";
import type { Context } from "hono";

// Hanya entri yang ditulis proxy tepercaya (sisi kanan daftar) yang dipakai.
// Entri di sisi kiri bisa dipalsukan klien, jadi tidak pernah dipercaya.
export function getClientIp(c: Context, trustedProxyHops: number): string {
  let socketAddress = "unknown";
  try {
    socketAddress = getConnInfo(c).remote.address ?? "unknown";
  } catch {
    // di luar server Node (misalnya saat tes) alamat koneksi tidak tersedia
  }

  if (trustedProxyHops <= 0) return socketAddress;

  const entries = (c.req.header("x-forwarded-for") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return entries[entries.length - trustedProxyHops] ?? socketAddress;
}