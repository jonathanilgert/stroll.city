#!/usr/bin/env node
import crypto from 'node:crypto';

const args = process.argv.slice(2);
function arg(name, fallback = '') {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] ?? fallback : fallback;
}

const label = arg('label', 'stroll-api-key');
const city = arg('city', 'calgary');
const scopes = arg('scopes', 'events:write,attractions:write').split(',').map((scope) => scope.trim()).filter(Boolean);
const pepper = process.env.STROLL_API_KEY_PEPPER;

if (!pepper) {
  console.error('Set STROLL_API_KEY_PEPPER before creating keys. The pepper is server-side and must not be committed.');
  process.exit(1);
}

const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const bytes = crypto.randomBytes(32);
let body = '';
for (const byte of bytes) body += alphabet[byte % alphabet.length];
const key = `sk_stroll_${body}`;
const hash = crypto.createHash('sha256').update(`${pepper}:${key}`).digest('hex');
const record = { label, city: city === 'all' ? null : city, scopes, hash };

console.log('Store this API key in a password manager now. It is shown only once:');
console.log(key);
console.log('\nAdd this record to STROLL_API_KEYS_JSON on the server:');
console.log(JSON.stringify([record], null, 2));
