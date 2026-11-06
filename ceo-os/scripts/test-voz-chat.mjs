import assert from 'node:assert/strict';
delete process.env.DATABASE_URL; delete process.env.POSTGRES_URL; delete process.env.VERCEL;
process.env.LOCAL_DB = 'memory://'; process.env.ALLOWED_DOMAIN = 'example.test'; process.env.ADMIN_EMAILS = 'prueba@example.test'; process.env.SESSION_SECRET = 'fixture-local-sin-secretos-reales';
const { rutas } = await import('../api/_lib/chat.js'), session = await import('../api/_lib/session.js');
const rutasPrueba = new Map(); rutas((m,p,fn)=>rutasPrueba.set(`${m} ${p}`,fn));
const req = { method: 'POST', headers: { 'x-ceoos':'1', 'user-agent':'prueba' }, body: {} };
const headers={}, res={ code:200, status(n){this.code=n;return this;}, json(x){this.body=x;}, setHeader(k,v){headers[k]=v;}, getHeader(k){return headers[k];} };
await rutasPrueba.get('POST chat/voz/token')(req,res); assert.equal(res.code,401);
session.issue(req,res,{email:'prueba@example.test'});req.headers.cookie=[].concat(headers['Set-Cookie']).map(x=>x.split(';')[0]).join('; ');
const original=globalThis.fetch;let llamadas=0;globalThis.fetch=async()=>{llamadas++;throw new Error('No debe abrir otra IA');};
try { await rutasPrueba.get('POST chat/voz/token')(req,res);assert.equal(res.code,503);assert.equal(res.body.code,'NO_VOZ');assert.equal(llamadas,0);assert.ok(!res.body.token&&!res.body.contexto); }
finally { globalThis.fetch=original; }
console.log('2 pruebas OK: autenticación y fallback sin otra IA ni contexto separado');
