// Proof that web push works end to end locally: real VAPID + aes128gcm encryption via `web-push`,
// delivered to a local push service that verifies the VAPID JWT and decrypts the payload
// exactly like a browser would (RFC 8291 / RFC 8292).
import { createECDH, createPublicKey, createDecipheriv, hkdfSync, randomBytes, verify } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { Agent, createServer } from "node:https";
import type { IncomingMessage } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import webpush from "web-push";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readConfig } from "./env";
import { createWebPushSender, sendDuePushes } from "./push";
import { createStore } from "./store";
import { createDatabase } from "./db";
import { PHASE_PUSH_TEXT } from "../shared/texts";

const b64u = (b: Buffer) => b.toString("base64url");

function decryptAes128gcm(body: Buffer, uaPrivate: ReturnType<typeof createECDH>, authSecret: Buffer): string {
  const salt = body.subarray(0, 16);
  const idlen = body.readUInt8(20);
  const asPublic = body.subarray(21, 21 + idlen);
  const ciphertext = body.subarray(21 + idlen);
  const uaPublic = uaPrivate.getPublicKey();
  const ecdhSecret = uaPrivate.computeSecret(asPublic);
  const keyInfo = Buffer.concat([Buffer.from("WebPush: info\0"), uaPublic, asPublic]);
  const ikm = Buffer.from(hkdfSync("sha256", ecdhSecret, authSecret, keyInfo, 32));
  const cek = Buffer.from(hkdfSync("sha256", ikm, salt, Buffer.from("Content-Encoding: aes128gcm\0"), 16));
  const nonce = Buffer.from(hkdfSync("sha256", ikm, salt, Buffer.from("Content-Encoding: nonce\0"), 12));
  const decipher = createDecipheriv("aes-128-gcm", cek, nonce);
  decipher.setAuthTag(ciphertext.subarray(ciphertext.length - 16));
  const padded = Buffer.concat([decipher.update(ciphertext.subarray(0, ciphertext.length - 16)), decipher.final()]);
  let end = padded.length - 1;
  while (end >= 0 && padded[end] === 0) end--;
  expect(padded[end]).toBe(2); // last-record delimiter
  return padded.subarray(0, end).toString("utf8");
}

function verifyVapid(header: string, vapidPublic: string, audience: string) {
  const m = /^vapid t=([^,]+),\s*k=(.+)$/.exec(header);
  expect(m).not.toBeNull();
  const [, jwt, k] = m!;
  expect(k).toBe(vapidPublic);
  const [h, p, s] = jwt.split(".");
  const raw = Buffer.from(k, "base64url");
  const key = createPublicKey({ key: { kty: "EC", crv: "P-256", x: b64u(raw.subarray(1, 33)), y: b64u(raw.subarray(33, 65)) }, format: "jwk" });
  const ok = verify("sha256", Buffer.from(`${h}.${p}`), { key, dsaEncoding: "ieee-p1363" }, Buffer.from(s, "base64url"));
  expect(ok).toBe(true);
  const claims = JSON.parse(Buffer.from(p, "base64url").toString());
  expect(claims.aud).toBe(audience);
  expect(claims.sub).toMatch(/^mailto:/);
}

describe("web push (local push service)", () => {
  const received: { headers: IncomingMessage["headers"]; body: Buffer }[] = [];
  let endpoint = "";
  const dir = mkdtempSync(join(tmpdir(), "push-"));
  execFileSync("openssl", ["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-keyout", join(dir, "k.pem"), "-out", join(dir, "c.pem"), "-days", "1", "-subj", "/CN=127.0.0.1"], { stdio: "ignore" });
  const server = createServer({ key: readFileSync(join(dir, "k.pem")), cert: readFileSync(join(dir, "c.pem")) }, async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    received.push({ headers: req.headers, body: Buffer.concat(chunks) });
    res.writeHead(201).end();
  });
  beforeAll(async () => {
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    endpoint = `https://127.0.0.1:${(server.address() as AddressInfo).port}/push/device-1`;
  });
  afterAll(() => server.close());

  it("schedules, sends via cron, browser-side decrypts the exact phase text", async () => {
    const vapid = webpush.generateVAPIDKeys();
    const config = readConfig({ VAPID_PUBLIC_KEY: vapid.publicKey, VAPID_PRIVATE_KEY: vapid.privateKey });
    const ua = createECDH("prime256v1");
    ua.generateKeys();
    const authSecret = randomBytes(16);

    const store = createStore(await createDatabase(":memory:"));
    await store.seed();
    const now = Date.now();
    await store.saveSchedule(
      "device-0000-test",
      { endpoint, p256dh: b64u(ua.getPublicKey()), auth: b64u(authSecret) },
      false,
      [{ at: new Date(now + 5 * 60_000).toISOString(), kind: "phase", key: "red2" }],
      now,
    );
    const result = await sendDuePushes(store, createWebPushSender(config, { agent: new Agent({ rejectUnauthorized: false }) }), config, now);
    expect(result).toMatchObject({ due: 1, delivered: 1, failed: 0 });

    expect(received).toHaveLength(1);
    const { headers, body } = received[0];
    expect(headers["content-encoding"]).toBe("aes128gcm");
    expect(Number(headers.ttl)).toBeGreaterThan(0);
    verifyVapid(String(headers.authorization), vapid.publicKey, new URL(endpoint).origin);
    const payload = JSON.parse(decryptAes128gcm(body, ua, authSecret));
    expect(payload).toEqual({ title: "Cyclemax", body: PHASE_PUSH_TEXT.red2, tag: "cyclemax", url: "/heute/" });
  });
});
