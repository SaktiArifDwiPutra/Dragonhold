import assert from "node:assert/strict";
import test from "node:test";
import { nextCitizenCode } from "./citizen-code";

test("nextCitizenCode formats numbers with 6 digits zero-padded", async () => {
  let counter = 1;
  const mockDb = {
    execute: async () => [{ n: String(counter++) }],
  };

  const code1 = await nextCitizenCode(mockDb as any);
  assert.equal(code1, "DH-000001");

  counter = 42;
  const code42 = await nextCitizenCode(mockDb as any);
  assert.equal(code42, "DH-000042");
});

test("nextCitizenCode concurrency: 100 simultaneous calls yield 100 unique IDs without collision", async () => {
  let seq = 1;
  // Simulasi atomic sequence PostgreSQL nextval
  const mockDb = {
    execute: async () => {
      // Jitter acak untuk mensimulasikan latensi database nyata
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 5));
      const n = seq++;
      return [{ n: String(n) }];
    },
  };

  const promises = Array.from({ length: 100 }, () =>
    nextCitizenCode(mockDb as any),
  );
  const results = await Promise.all(promises);

  assert.equal(results.length, 100);
  const uniqueCodes = new Set(results);
  assert.equal(
    uniqueCodes.size,
    100,
    "Semua citizen code yang dihasilkan secara konkuren harus unik",
  );

  for (const code of results) {
    assert.match(
      code,
      /^DH-\d{6}$/,
      `Format code ${code} harus sesuai DH-XXXXXX`,
    );
  }
});
