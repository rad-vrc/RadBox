import fs from 'fs/promises';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function ensureDir(p) { await fs.mkdir(p, { recursive: true }); }
async function readFileSafe(p) { try { return await fs.readFile(p, 'utf8'); } catch { return null; } }
function extOf(p) { return path.extname(p).toLowerCase(); }
function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function toArray(x) { return Array.isArray(x) ? x : x != null ? [x] : []; }

async function findXmlGuideline(startDir = 'Reference') {
  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        const f = await walk(full);
        if (f) return f;
      } else if (e.isFile() && /\.xml$/i.test(e.name)) {
        if (/^claude\.xml$/i.test(e.name)) return full; // prioritize CLAUDE.xml
      }
    }
    // If CLAUDE.xml not found at this level, return first *.xml
    const entries2 = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries2) {
      const full = path.join(dir, e.name);
      if (e.isFile() && /\.xml$/i.test(e.name)) return full;
    }
    for (const e of entries2) {
      if (e.isDirectory()) {
        const f = await walk(path.join(dir, e.name));
        if (f) return f;
      }
    }
    return null;
  }
  try { return await walk(startDir); } catch { return null; }
}

function defaultGuidelines() {
  return { doNotTranslate: new Set(), mappings: [], tone: 'polite' };
}

async function loadGuidelinesXml(xmlPath) {
  if (!xmlPath) return defaultGuidelines();
  const xml = await readFileSafe(xmlPath);
  if (!xml) return defaultGuidelines();
  const { XMLParser } = await import('fast-xml-parser');
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
  let obj;
  try { obj = parser.parse(xml); } catch { return defaultGuidelines(); }
  const root = obj.guidelines || obj.Guidelines || obj.localization || obj.LocalizationGuidelines || obj;
  const doNotTranslate = toArray(
    (root.doNotTranslate && (root.doNotTranslate.term || root.doNotTranslate.entry)) ||
    (root.glossary && root.glossary.doNotTranslate && root.glossary.doNotTranslate.term) ||
    (root.DoNotTranslate && root.DoNotTranslate.term) ||
    []
  ).map(String);
  const mappingsArray = toArray(
    (root.termMappings && root.termMappings.mapping) ||
    (root.Mappings && root.Mappings.Mapping) ||
    (root.Glossary && root.Glossary.Term) ||
    []
  );
  const mappings = [];
  for (const m of mappingsArray) {
    if (m?.source && m?.target) mappings.push({ source: String(m.source), target: String(m.target) });
    else if (m?.from && m?.to) mappings.push({ source: String(m.from), target: String(m.to) });
    else if (m?.en && m?.ja) mappings.push({ source: String(m.en), target: String(m.ja) });
  }
  let tone = (root.style && root.style.tone) || (root.Style && root.Style.Tone) || '';
  tone = String(tone || '').toLowerCase();
  if (!['polite', 'casual'].includes(tone)) tone = 'polite';
  return { doNotTranslate: new Set(doNotTranslate), mappings, tone };
}

function maskPlaceholders(text) {
  const patterns = [
    /\{[^}]+\}/g,        // {name}, {0}
    /%\d*\$?[sd]/g,      // %s, %1$s
    /%\w/g,               // %d %S etc.
    /\$[A-Z_][A-Z0-9_]*/g, // $ENV_VAR
    /<[^>]+>/g,           // <b>...</b>
    /:\w+/g,            // :name
  ];
  const matches = [];
  let masked = text;
  for (const pat of patterns) {
    masked = masked.replace(pat, (m) => {
      const token = `__PH_${matches.length}__`;
      matches.push(m);
      return token;
    });
  }
  return { masked, matches };
}
function unmaskPlaceholders(text, matches) {
  let out = text;
  matches.forEach((m, i) => { out = out.replace(new RegExp(`__PH_${i}__`, 'g'), m); });
  return out;
}

function applyGuidelinesPost(ja, guidelines) {
  let out = ja;
  // If preferred target already present, avoid redundant mapping
  for (const { source, target } of guidelines.mappings) {
    if (new RegExp(escapeRegExp(target), 'g').test(out)) continue;
    out = out.replace(new RegExp(escapeRegExp(source), 'gi'), target);
  }
  if (guidelines.tone === 'polite') {
    out = out.replace(/([^\d.\n])\./g, '$1。');
    out = out.replace(/([^\d]),([^\d])/g, '$1、$2');
  }
  return out;
}

async function callProvider(text, provider) {
  if (provider === 'deepl') {
    const key = process.env.DEEPL_API_KEY;
    if (!key) throw new Error('DEEPL_API_KEY is not set');
    const endpoint = process.env.DEEPL_API_URL || 'https://api-free.deepl.com/v2/translate';
    const body = new URLSearchParams();
    body.append('text', text);
    body.append('target_lang', 'JA');
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${key}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    if (!res.ok) throw new Error(`DeepL error ${res.status}: ${await res.text()}`);
    const json = await res.json();
    const out = json?.translations?.[0]?.text;
    if (!out) throw new Error('DeepL returned no translation');
    return out;
  } else if (provider === 'azure') {
    const key = process.env.AZURE_TRANSLATOR_KEY;
    const endpoint = process.env.AZURE_TRANSLATOR_ENDPOINT;
    const region = process.env.AZURE_TRANSLATOR_REGION;
    if (!key || !endpoint || !region) throw new Error('Azure translator secrets not set');
    const url = `${endpoint.replace(/\/+$/, '')}/translate?api-version=3.0&to=ja`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Ocp-Apim-Subscription-Region': region,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{ Text: text }]),
    });
    if (!res.ok) throw new Error(`Azure Translator error ${res.status}: ${await res.text()}`);
    const json = await res.json();
    const out = json?.[0]?.translations?.[0]?.text;
    if (!out) throw new Error('Azure Translator returned no translation');
    return out;
  } else {
    throw new Error(`Unsupported provider: ${provider}`);
  }
}

async function translateText(text, guidelines, provider) {
  if (!text || !text.trim()) return text;
  // Protect do-not-translate terms
  let protectedText = text;
  const doNot = Array.from(guidelines.doNotTranslate.values()).filter(Boolean);
  const dnRe = doNot.length ? new RegExp(doNot.map(escapeRegExp).join('|'), 'g') : null;
  const dnMatches = [];
  if (dnRe) {
    protectedText = protectedText.replace(dnRe, (m) => {
      const token = `__DN_${dnMatches.length}__`;
      dnMatches.push(m);
      return token;
    });
  }
  const { masked, matches } = maskPlaceholders(protectedText);
  const raw = await callProvider(masked, provider);
  let unmasked = unmaskPlaceholders(raw, matches);
  if (dnMatches.length) {
    dnMatches.forEach((m, i) => { unmasked = unmasked.replace(new RegExp(`__DN_${i}__`, 'g'), m); });
  }
  return applyGuidelinesPost(unmasked, guidelines);
}

async function translateJsonObject(obj, guidelines, provider) {
  if (obj == null) return obj;
  if (typeof obj === 'string') return await translateText(obj, guidelines, provider);
  if (Array.isArray(obj)) {
    const out = [];
    for (const v of obj) out.push(await translateJsonObject(v, guidelines, provider));
    return out;
  }
  if (typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) out[k] = await translateJsonObject(v, guidelines, provider);
    return out;
  }
  return obj;
}

async function translateYaml(text, g, p) {
  const YAML = (await import('yaml')).default;
  const doc = YAML.parse(text);
  const translated = await translateJsonObject(doc, g, p);
  return YAML.stringify(translated);
}
async function translateJson(text, g, p) {
  const obj = JSON.parse(text);
  const translated = await translateJsonObject(obj, g, p);
  return JSON.stringify(translated, null, 2) + '\n';
}
async function translateProperties(text, g, p) {
  const lines = text.split(/\r?\n/);
  const out = [];
  for (const line of lines) {
    if (/^\s*[#!]/.test(line) || !line.includes('=')) { out.push(line); continue; }
    const idx = line.indexOf('=');
    const key = line.slice(0, idx);
    const value = line.slice(idx + 1);
    const t = await translateText(value, g, p);
    out.push(`${key}=${t}`);
  }
  return out.join('\n');
}
async function translatePlain(text, g, p) { return await translateText(text, g, p); }

function outPathFor(src) {
  const rel = path.relative('Reference', src);
  return path.join('i18n', 'ja', rel);
}

async function listReferenceTargets() {
  const all = [];
  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) await walk(full);
      else all.push(full);
    }
  }
  try { await walk('Reference'); } catch {}
  const targets = new Set(['.json', '.yml', '.yaml', '.properties', '.txt', '.md', '.hjson']);
  return all.filter((p) => targets.has(extOf(p)));
}

async function translateHjson(text, g, p) {
  // For hjson files, we need to handle the special format
  // Handle multi-line strings with ''' and simple key-value pairs
  const lines = text.split(/\r?\n/);
  const out = [];
  let inMultiLine = false;
  let multiLineContent = [];
  let multiLineStartIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Handle multi-line string start
    if (!inMultiLine && line.includes("'''")) {
      multiLineContent = [];
      multiLineStartIndex = out.length;
      inMultiLine = true;
      out.push(line); // Keep the opening line as-is
      continue;
    }
    
    // Handle multi-line string end
    if (inMultiLine && line.includes("'''")) {
      // Translate the collected multi-line content
      if (multiLineContent.length > 0) {
        const contentToTranslate = multiLineContent.join('\n');
        const translated = await translateText(contentToTranslate, g, p);
        
        // Replace the content in out array
        const translatedLines = translated.split('\n');
        for (let j = 0; j < translatedLines.length; j++) {
          const contentIndex = multiLineStartIndex + 1 + j;
          if (contentIndex < out.length) {
            // Preserve the original indentation but replace content
            const originalLine = out[contentIndex];
            const indentMatch = originalLine.match(/^(\s*)/);
            const indent = indentMatch ? indentMatch[1] : '';
            out[contentIndex] = indent + translatedLines[j];
          }
        }
      }
      
      out.push(line); // Keep the closing line as-is
      inMultiLine = false;
      multiLineContent = [];
      continue;
    }
    
    // Collect multi-line content
    if (inMultiLine) {
      multiLineContent.push(line.replace(/^\s*/, '')); // Remove indent for translation
      out.push(line); // Placeholder, will be replaced
      continue;
    }
    
    // Skip comments, empty lines, and structural lines
    if (/^\s*\/\//.test(line) || /^\s*[{}]/.test(line) || /^\s*$/.test(line)) {
      out.push(line);
      continue;
    }
    
    // Handle single-line key: value pairs
    const match = line.match(/^(\s*)([^:]+):\s*(.*)$/);
    if (match) {
      const [, indent, key, value] = match;
      
      // Skip if it's a structural line (opening object/array) or empty/multi-line marker
      if (/^\s*[{\[]/.test(value) || value.trim() === '' || value.includes("'''")) {
        out.push(line);
        continue;
      }
      
      // Translate the value
      let cleanValue = value.trim();
      let isQuoted = false;
      
      // Remove quotes for translation, remember if it was quoted
      if ((cleanValue.startsWith('"') && cleanValue.endsWith('"')) ||
          (cleanValue.startsWith("'") && cleanValue.endsWith("'"))) {
        isQuoted = true;
        cleanValue = cleanValue.slice(1, -1);
      }
      
      if (cleanValue) {
        const translated = await translateText(cleanValue, g, p);
        // Restore quotes if needed, ensuring proper quoting for placeholders at start
        if (isQuoted || /^\{/.test(translated)) {
          out.push(`${indent}${key}: "${translated}"`);
        } else {
          out.push(`${indent}${key}: ${translated}`);
        }
      } else {
        out.push(line);
      }
    } else {
      out.push(line);
    }
  }
  
  return out.join('\n');
}

async function main() {
  const provider = (process.env.TRANSLATOR_PROVIDER || '').toLowerCase();
  if (!['deepl', 'azure'].includes(provider)) {
    console.error('TRANSLATOR_PROVIDER must be set to "deepl" or "azure".');
    process.exit(1);
  }

  const args = process.argv.slice(2).filter(Boolean);
  const changed = args;

  // file extensions considered
  const targets = new Set(['.json', '.yml', '.yaml', '.properties', '.txt', '.md', '.hjson']);
  const changedTargets = changed
    .map((p) => p.trim())
    .filter((p) => p.startsWith('Reference/') || p.startsWith('./Reference/'))
    .filter((p) => targets.has(extOf(p)));

  // detect guideline changes (CLAUDE.xml or any .xml under Reference)
  const guidelineChanged = changed.some((p) =>
    /^\.?\/?Reference\//.test(p) && /\.xml$/i.test(p)
  );

  let targetFiles = changedTargets;
  if ((targetFiles.length === 0 && changed.length === 0) || guidelineChanged) {
    // No changed files, or only guidelines changed => retranslate all
    targetFiles = await listReferenceTargets();
    console.log(guidelineChanged
      ? 'Guideline changed: retranslating all targets under Reference.'
      : 'No changed files provided: translating all targets under Reference.');
  }

  if (targetFiles.length === 0) {
    console.log('No target files to translate.');
    return;
  }

  const guidelineXml = await findXmlGuideline('Reference');
  const guidelines = await loadGuidelinesXml(guidelineXml || '');
  
  console.log(`Found guideline XML: ${guidelineXml || 'none'}`);
  console.log(`Loaded ${guidelines.mappings.length} term mappings, ${guidelines.doNotTranslate.size} do-not-translate terms`);
  console.log(`Translation tone: ${guidelines.tone}`);

  for (const src of targetFiles) {
    try {
      const content = await readFileSafe(src);
      if (content == null) continue;

      let translated;
      const ext = extOf(src);
      if (ext === '.json') translated = await translateJson(content, guidelines, provider);
      else if (ext === '.yml' || ext === '.yaml') translated = await translateYaml(content, guidelines, provider);
      else if (ext === '.properties') translated = await translateProperties(content, guidelines, provider);
      else if (ext === '.hjson') translated = await translateHjson(content, guidelines, provider);
      else if (ext === '.txt' || ext === '.md') translated = await translatePlain(content, guidelines, provider);
      else continue;

      const outPath = outPathFor(src);
      await ensureDir(path.dirname(outPath));
      await fs.writeFile(outPath, translated, 'utf8');
      console.log(`Translated: ${src} -> ${outPath}`);
      // Light rate limiting
      await new Promise((r) => setTimeout(r, 150));
    } catch (e) {
      console.error(`Failed to translate ${src}:`, e.message);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });