import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildPreview, checkPreview } from './build.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
async function localTarget(t) {
  const target = await mkdtemp(join(tmpdir(), 'pg-preview-'));
  t.after(() => rm(target, { recursive: true, force: true }));
  return target;
}

test('both languages and all resources resolve under the repository prefix', async t => {
  const target = await localTarget(t);
  assert.equal(await buildPreview(root, target), 9);
  const base = new URL('https://example.test/GrowthFun/');
  for (const [page, lang] of [['', 'en'], ['en/', 'en'], ['zh-Hans/', 'zh-Hans']]) {
    const html = await readFile(join(target, page, 'index.html'), 'utf8');
    assert.match(html, new RegExp(`<html lang="${lang}">`, 'u'));
    assert.match(html, lang === 'en' ? /The application is not publicly available/u : /应用尚未公开开放/u);
    assert.doesNotMatch(html, /<(?:script|iframe|form|input)\b|data:|\b(?:app|catalog|incoming)\//iu);
    for (const [, path] of html.matchAll(/(?:src|href)="([^"]+)"/gu)) {
      const resolved = new URL(path, new URL(page, base));
      assert(resolved.href.startsWith(base.href), `Escaped preview root: ${path}`);
      const local = resolved.pathname.slice(base.pathname.length);
      await readFile(join(target, local.endsWith('/') || !local ? local + 'index.html' : local));
    }
  }
});

test('build and verification reject unexpected output rather than publishing or deleting it', async t => {
  const target = await localTarget(t);
  await buildPreview(root, target);
  const worker = join(target, 'sw.js');
  await writeFile(worker, 'unexpected cache worker');
  await assert.rejects(checkPreview(root, target), /Unexpected public preview path: sw\.js/u);
  await assert.rejects(buildPreview(root, target), /Unexpected public preview path: sw\.js/u);
  assert.equal(await readFile(worker, 'utf8'), 'unexpected cache worker');
});

test('a substituted file at an allowed path is not a valid deployment artifact', async t => {
  const target = await localTarget(t);
  await buildPreview(root, target);
  await writeFile(join(target, 'images', 'journal.svg'), '<svg><text>Not the approved first-party plate</text></svg>');
  await assert.rejects(checkPreview(root, target), /Public preview file differs from allowlist input: images\/journal\.svg/u);
});
