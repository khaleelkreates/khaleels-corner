import {createHmac, randomBytes} from 'node:crypto';

const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
export function generateAccessCode(businessName) {
  const prefix = businessName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) || 'MARKET';
  const bytes = randomBytes(12);
  const suffix = [...bytes].map(value => alphabet[value % alphabet.length]).join('');
  return prefix + '-' + suffix.match(/.{4}/g).join('-');
}
export function normalizeCode(value) {
  return typeof value === 'string' ? value.trim().toUpperCase() : '';
}
export function digest(value, secret) {
  return createHmac('sha256', secret).update(value).digest('hex');
}
export async function database(path, options = {}) {
  const url = process.env.MARKET_SUPABASE_URL?.trim();
  const key = process.env.MARKET_SUPABASE_SECRET?.trim();
  if (!url || !key || !process.env.MARKET_ACCESS_SECRET) throw Error('Market access is not configured.');
  const response = await fetch(url.replace(/\/$/, '') + '/rest/v1/' + path, {
    ...options,
    headers: {apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', ...options.headers},
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) {
    const problem = await response.json().catch(() => ({}));
    const error = Error('Market database HTTP ' + response.status + ' (' + (problem.code || 'request rejected') + ').');
    error.code = problem.code; error.detail = problem.message; error.status = response.status;
    throw error;
  }
  const body = await response.text();
  return body ? JSON.parse(body) : null;
}
export function rpc(name, parameters) {
  return database('rpc/' + name, {method: 'POST', body: JSON.stringify(parameters)});
}
export function cookieToken(req) {
  return (req.headers.cookie || '').split(';').map(value => value.trim()).find(value => value.startsWith('__Host-corner-market='))?.slice('__Host-corner-market='.length) || '';
}
export async function currentAccount(req) {
  const token = cookieToken(req);
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const accounts = await rpc('market_current_account', {session_hash: digest(token, process.env.MARKET_ACCESS_SECRET)});
  return accounts[0] || null;
}
export function setSessionCookie(res, token) {
  res.setHeader('Set-Cookie', '__Host-corner-market=' + token + '; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=' + (token ? 28800 : 0));
}
export async function issueCode(actor, target, businessName) {
  const code = generateAccessCode(businessName);
  await rpc('market_rotate_access', {
    actor_id: actor.id, target_id: target,
    new_hash: digest(code, process.env.MARKET_ACCESS_SECRET),
  });
  return code;
}
