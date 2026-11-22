import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const locales = {
  en: {
    skip: 'Skip to content', languages: 'Language', status: 'In development · informational preview',
    title: 'Play a little.', accent: 'Grow together.',
    intro: 'Play & Grow is a companion in development for parents and caregivers of children from birth through age five.',
    description: 'A planned bilingual play and development companion for caregivers. This is an informational preview, not the app.',
    cta: 'What we’re building', figure: 'Play & Grow · Field notes',
    plans: 'What we’re building',
    features: [
      ['Activity discovery', 'A way to find play ideas by age, available time, and materials you already have.'],
      ['Development observations', 'A private way to note what you notice as your child grows, without scores or comparisons.'],
    ],
    limits: 'Educational use', limitText: 'This preview contains no activity instructions or developmental checklists. Play & Grow is intended for general education, not screening, diagnosis, or treatment. For individual concerns, speak with a qualified healthcare professional.',
    privacy: 'Privacy', privacyText: 'This site has no accounts, forms, analytics, or app storage. It does not ask for or collect family information. The hosting provider may log technical request data such as IP addresses for operation and security.',
    footer: 'Informational preview · The application is not publicly available.',
  },
  'zh-Hans': {
    skip: '跳到主要内容', languages: '语言', status: '开发中 · 项目预览',
    title: '一起玩，', accent: '陪伴成长。',
    intro: 'Play & Grow 正在开发中，面向照护出生至 5 岁孩子的家长和照护者。',
    description: '为家长和照护者规划的双语游戏与成长陪伴工具。此页仅介绍项目，并非应用。',
    cta: '了解开发计划', figure: 'PLAY & GROW · 成长笔记',
    plans: '我们正在开发什么',
    features: [
      ['发现游戏灵感', '按孩子的年龄、手头的材料和可用时间寻找游戏点子。'],
      ['记录发育观察', '私下记录孩子成长中的点滴，不评分，也不做比较。'],
    ],
    limits: '教育用途说明', limitText: '本预览不提供游戏步骤或发育检查清单。Play & Grow 仅供一般教育参考，不用于筛查、诊断或治疗。如有个别发育疑虑，请咨询有资质的医疗专业人员。',
    privacy: '隐私', privacyText: '本网站不设账号或表单，不使用分析工具或应用存储，也不要求提供或收集家庭信息。托管服务商可能出于运行与安全目的记录 IP 地址等技术请求数据。',
    footer: '仅供了解项目 · 应用尚未公开开放。',
  },
};

// This is the entire source-to-artifact allowlist. Never scan or copy a source directory wholesale.
const copiedFiles = {
  'site.css': 'preview-site/site.css',
  'icon.svg': 'public/icon.svg',
  'images/journal.svg': 'public/images/field-guide/journal.svg',
  'fonts/fraunces-latin-wght-normal.woff2': 'public/fonts/fraunces-latin-wght-normal.woff2',
  'fonts/Fraunces-OFL.txt': 'public/fonts/Fraunces-OFL.txt',
};
const visualDigests = {
  'icon.svg': 'b2db104c204e03cedb196c60050ededec2f29c835eebd7e9d10b2f230d19884c',
  'images/journal.svg': '650c676ade3b9dd65a7ecb48efc5013067396a45ea38488524dd986ce121c444',
  'fonts/fraunces-latin-wght-normal.woff2': '7f9d191d999336d3b9790afa72e1358e50a13b06d4f289341e92a311967a80f9',
  'fonts/Fraunces-OFL.txt': 'cd3384cafac6f2bddc3955273958a2e029f97027c8037ac539ef5744a77b579e',
};
const pageFiles = { 'index.html': 'en', 'en/index.html': 'en', 'zh-Hans/index.html': 'zh-Hans' };
const allowedFiles = new Set([...Object.keys(copiedFiles), ...Object.keys(pageFiles), '404.html']);
const allowedDirs = new Set(['en', 'zh-Hans', 'images', 'fonts']);
const csp = "default-src 'none'; style-src 'self'; img-src 'self'; font-src 'self'; base-uri 'none'; form-action 'none'";

function page(locale, base) {
  const t = locales[locale];
  return `<!doctype html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="referrer" content="no-referrer">
  <meta name="description" content="${t.description}">
  <title>Play &amp; Grow · ${t.status}</title>
  <link rel="icon" type="image/svg+xml" href="${base}icon.svg">
  <link rel="stylesheet" href="${base}site.css">
  <link rel="alternate" hreflang="en" href="${base}en/">
  <link rel="alternate" hreflang="zh-Hans" href="${base}zh-Hans/">
</head>
<body>
  <a class="skip" href="#main">${t.skip}</a>
  <header class="site-head"><div class="wrap head-inner">
    <a class="brand" href="${base}${locale}/" aria-label="Play &amp; Grow"><img src="${base}icon.svg" width="38" height="38" alt=""><span>Play <i>&amp;</i> Grow</span></a>
    <nav class="languages" aria-label="${t.languages}">
      <a lang="en" hreflang="en" href="${base}en/"${locale === 'en' ? ' aria-current="page"' : ''}>English</a>
      <a lang="zh-Hans" hreflang="zh-Hans" href="${base}zh-Hans/"${locale === 'zh-Hans' ? ' aria-current="page"' : ''}>简体中文</a>
    </nav>
  </div></header>
  <main id="main" tabindex="-1">
    <section class="cover wrap" aria-labelledby="cover-title">
      <div class="cover-copy">
        <p class="label"><span aria-hidden="true"></span>${t.status}</p>
        <h1 id="cover-title">${t.title} <em>${t.accent}</em></h1>
        <p class="intro">${t.intro}</p>
        <a class="primary" href="#plans">${t.cta} <span aria-hidden="true">↓</span></a>
      </div>
      <figure><img src="${base}images/journal.svg" alt="" width="640" height="420"><figcaption>${t.figure}</figcaption></figure>
    </section>
    <section class="plans" aria-labelledby="plans"><div class="wrap">
      <h2 id="plans">${t.plans}</h2>
      <div class="features">${t.features.map(([title, description], i) => `
        <article><p class="number" aria-hidden="true">0${i + 1}</p><h3>${title}</h3><p>${description}</p></article>`).join('')}
      </div>
    </div></section>
    <div class="wrap notices">
      <section aria-labelledby="education"><h2 id="education">${t.limits}</h2><p>${t.limitText}</p></section>
      <section aria-labelledby="privacy"><h2 id="privacy">${t.privacy}</h2><p>${t.privacyText}</p></section>
    </div>
  </main>
  <footer><div class="wrap footer-inner"><b>Play &amp; Grow</b><p>${t.footer}</p></div></footer>
</body>
</html>\n`;
}

const notFound = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}"><meta name="viewport" content="width=device-width"><meta name="robots" content="noindex"><title>Page not found · Play &amp; Grow</title></head><body><main><h1>Page not found</h1><p>This page is not part of the Play &amp; Grow informational preview.</p><p lang="zh-Hans">找不到页面。此页面不属于 Play &amp; Grow 项目预览。</p></main></body></html>\n`;
const render = (file, locale) => page(locale, file === 'index.html' ? './' : '../');

async function inventory(target) {
  const entries = await readdir(target, { recursive: true, withFileTypes: true }).catch(error => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  const files = new Set();
  for (const entry of entries) {
    const name = relative(target, join(entry.parentPath, entry.name)).replaceAll('\\', '/');
    if (entry.isDirectory() && allowedDirs.has(name)) continue;
    if (!entry.isFile() || !allowedFiles.has(name)) throw new Error(`Unexpected public preview path: ${name}`);
    files.add(name);
  }
  return files;
}

export async function checkPreview(sourceRoot, target) {
  const files = await inventory(target);
  for (const file of allowedFiles) {
    if (!files.has(file)) throw new Error(`Missing public preview file: ${file}`);
    const expected = file === '404.html' ? Buffer.from(notFound) : Object.hasOwn(pageFiles, file)
      ? Buffer.from(render(file, pageFiles[file])) : await readFile(join(sourceRoot, copiedFiles[file]));
    if (Object.hasOwn(visualDigests, file) && createHash('sha256').update(expected).digest('hex') !== visualDigests[file]) {
      throw new Error(`Public preview asset changed without review: ${file}`);
    }
    if (!expected.equals(await readFile(join(target, file)))) throw new Error(`Public preview file differs from allowlist input: ${file}`);
  }
  return files.size;
}

export async function buildPreview(sourceRoot, target) {
  // Fail closed on a stale or contaminated target, without deleting its contents.
  await inventory(target);
  for (const dir of allowedDirs) await mkdir(join(target, dir), { recursive: true });
  for (const [destination, source] of Object.entries(copiedFiles)) await copyFile(join(sourceRoot, source), join(target, destination));
  for (const [file, locale] of Object.entries(pageFiles)) await writeFile(join(target, file), render(file, locale));
  await writeFile(join(target, '404.html'), notFound);
  return checkPreview(sourceRoot, target);
}

if (import.meta.main) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const target = join(root, 'out-preview');
  const mode = process.argv[2];
  if (process.argv.length > 3 || (mode !== undefined && mode !== '--check')) throw new Error('Use node preview-site/build.mjs [--check]');
  const count = await (mode === '--check' ? checkPreview : buildPreview)(root, target);
  console.log(`Public preview: ${count} allowlisted files in out-preview/`);
}
