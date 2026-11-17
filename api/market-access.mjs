import {randomBytes} from 'node:crypto';
import {cookieToken, currentAccount, database, digest, issueCode, normalizeCode, rpc, setSessionCookie} from '../server/market-access.mjs';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  if (!process.env.MARKET_SUPABASE_SECRET || !process.env.MARKET_ACCESS_SECRET) return res.status(503).json({error: 'Seller access setup is in progress.'});
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({error: 'Unsupported method.'});
  try {
    if (req.method === 'GET') {
      const account = await currentAccount(req);
      if (!account) return res.status(401).json({error: 'Enter your access code.'});
      return res.json({account});
    }
    if (req.headers.origin !== 'https://' + req.headers.host || !/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) return res.status(403).json({error: 'Invalid request.'});
    const {action, code, targetId, businessId, label, role, active} = req.body || {};
    if (action === 'login') {
      const clean = normalizeCode(code);
      if (!/^[A-Z0-9]{1,10}(?:-[A-Z2-9]{4}){3}$/.test(clean)) return res.status(401).json({error: 'Invalid or inactive access code.'});
      const ip = req.headers['x-vercel-forwarded-for'] || req.socket.remoteAddress || 'unknown';
      const allowed = await rpc('market_allow_attempt', {
        bucket_key: digest(ip + '|' + Math.floor(Date.now() / 600000), process.env.MARKET_ACCESS_SECRET),
      });
      if (!allowed) return res.status(429).json({error: 'Too many attempts. Try again in ten minutes.'});
      const token = randomBytes(32).toString('hex');
      const accounts = await rpc('market_login', {
        access_hash: digest(clean, process.env.MARKET_ACCESS_SECRET),
        session_hash: digest(token, process.env.MARKET_ACCESS_SECRET),
      });
      if (!accounts.length) return res.status(401).json({error: 'Invalid or inactive access code.'});
      setSessionCookie(res, token);
      return res.json({account: accounts[0]});
    }
    const account = await currentAccount(req);
    if (!account) return res.status(401).json({error: 'Sign in again.'});
    if (action === 'logout') {
      await database('market_sessions?token_hash=eq.' + digest(cookieToken(req), process.env.MARKET_ACCESS_SECRET), {method: 'DELETE'});
      setSessionCookie(res, '');
      return res.json({ok: true});
    }
    if (action === 'directory' && ['owner', 'manager'].includes(account.role)) {
      const [businesses, accounts] = await Promise.all([
        database('market_businesses?select=id,name&order=name'),
        database('market_accounts?select=id,label,role,business_id,active&order=label'),
      ]);
      return res.json({businesses, accounts: account.role === 'owner' ? accounts : accounts.filter(item => item.role === 'seller')});
    }
    if (action === 'reset' && typeof targetId === 'string') {
      const target = (await database('market_accounts?id=eq.' + encodeURIComponent(targetId) + '&select=id,label,role,business_id'))[0];
      if (!target || account.role !== 'owner' && !(account.role === 'manager' && target.role === 'seller')) return res.status(403).json({error: 'Reset permission required.'});
      const prefix = target.business_id ? (await database('market_businesses?id=eq.' + encodeURIComponent(target.business_id) + '&select=name'))[0]?.name : target.label;
      const next = await issueCode(account, target.id, prefix || 'MARKET');
      return res.json({code: next});
    }
    if (action === 'set-active' && account.role === 'owner' && typeof targetId === 'string' && typeof active === 'boolean') {
      await rpc('market_set_active', {actor_id:account.id,target_id:targetId,enabled:active});
      return res.json({ok:true});
    }
    if (action === 'create' && account.role === 'owner') {
      if (!['seller', 'manager'].includes(role) || typeof label !== 'string' || !label.trim() || label.length > 100) return res.status(400).json({error: 'Enter a label and role.'});
      const target = await rpc('market_create_account', {actor_id: account.id, account_label: label.trim(), account_role: role, shop_id: role === 'seller' ? businessId : null});
      const prefix = role === 'seller' ? (await database('market_businesses?id=eq.' + encodeURIComponent(businessId) + '&select=name'))[0]?.name : label;
      return res.json({code: await issueCode(account, target, prefix || 'MARKET')});
    }
    return res.status(403).json({error: 'Action unavailable.'});
  } catch {
    return res.status(503).json({error: 'Seller access is temporarily unavailable.'});
  }
}
