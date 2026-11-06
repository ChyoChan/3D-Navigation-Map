import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const app = path.resolve(fileURLToPath(new URL('../app/', import.meta.url)));

function existsWithExactCase(file) {
    const parent = path.dirname(file);
    assert.ok(readdirSync(parent).includes(path.basename(file)), `Missing asset or wrong case: ${file}`);
    if (parent !== app) existsWithExactCase(parent);
}

test('canonical HTML, module, CSS and glTF references resolve with exact filename case', () => {
    const files = readdirSync(app, { recursive: true }).filter(file => /\.(html|js|css|gltf)$/.test(file));
    for (const name of files) {
        const file = path.join(app, name);
        const text = readFileSync(file, 'utf8');
        const refs = name.endsWith('.gltf')
            ? [...(JSON.parse(text).buffers ?? []), ...(JSON.parse(text).images ?? [])].map(asset => asset.uri).filter(Boolean)
            : [
                ...[...text.matchAll(/(?:src|href)=["']([^"']+)["']/g)].map(match => match[1]),
                ...[...text.matchAll(/url\(([^)]+)\)/g)].map(match => match[1].replace(/["']/g, '')),
                ...[...text.matchAll(/new URL\(['"]([^'"]+)['"], import\.meta\.url\)/g)].map(match => match[1]),
                ...[...text.matchAll(/(?:from\s*|import\()(['"])(\.\.?\/[^'"]+)\1/g)].map(match => match[2])
            ];
        for (const ref of refs) {
            if (/^(https?:|data:|#)/.test(ref)) continue;
            existsWithExactCase(path.resolve(path.dirname(file), ref));
        }
    }
    const html = readFileSync(path.join(app, 'index.html'), 'utf8');
    const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map(match => match[1]);
    assert.equal(new Set(ids).size, ids.length, 'HTML IDs must be unique');
    for (const match of html.matchAll(/\b(?:for|list)=["']([^"']+)["']/g)) {
        assert.ok(ids.includes(match[1]), `Missing label/list target: ${match[1]}`);
    }
    assert.doesNotMatch(html, /\bon(?:click|load)=/, 'Use module event listeners');
});
