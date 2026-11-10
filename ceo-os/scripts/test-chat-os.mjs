import assert from 'node:assert/strict';
delete process.env.DATABASE_URL; delete process.env.POSTGRES_URL; delete process.env.VERCEL;
process.env.LOCAL_DB='memory://'; process.env.ADMIN_EMAILS='ceo@example.test'; process.env.GATEWAY_TOKEN='fixture-local-gateway-de-32-caracteres';
const db=await import('../api/_lib/db.js'), {leerOS}=await import('../api/_lib/chat-os.js'), {userOf}=await import('../api/_lib/mcp.js'), {rutas}=await import('../api/_lib/agentes.js');
const ceo=await userOf('ceo@example.test'); const own={id:'chat',owner:ceo.email,cliente:'alpha',turno:{estado:'trabajando'}};
let n=0;const test=async(name,fn)=>{await fn();n++;console.log('✓',name);};
for(const slug of ['alpha','beta']) {
 await db.create('accounts',{slug,name:slug,accesos:[{secreto:'NO_SALE'}]},ceo.email,'acc-'+slug);
 await db.create('projects',{name:'Proyecto '+slug,client_slug:slug,people:slug==='alpha'?['equipo@example.test']:[]},ceo.email,'p-'+slug);
 await db.create('tasks',{title:'Tarea '+slug,project_id:'p-'+slug,assignee:slug==='alpha'?'equipo@example.test':'otra@example.test',status:'En curso'},ceo.email,'t-'+slug);
 await db.create('movimientos',{titulo:'Movimiento '+slug,client_slug:slug,costo:55},ceo.email,'m-'+slug);
 await db.create('embudos',{client_slug:slug,mes:'2026-11',ticket:150,margen_pct:30,etapas:[{nombre:'Clientes',n:2}],lineas:[{nombre:'Oferta',costo:90}]},ceo.email,'e-'+slug);
 await db.create('leads',{client_slug:slug,name:'Lead '+slug,stage:'Propuesta',phone:'NO_SALE'},ceo.email,'l-'+slug);
}
await test('las seis lecturas se limitan al cliente del hilo y solo devuelven campos permitidos',async()=>{
 for(const accion of ['clientes','proyectos','tareas','leads','movimientos','embudo']) { const r=await leerOS(ceo,own,{accion});assert.equal(r.items.length,1);assert.equal(r.cliente,'alpha');assert.ok(!JSON.stringify(r).includes('beta'));assert.ok(!JSON.stringify(r).includes('NO_SALE')); }
});
await test('sin cambio arbitrario de cliente, dueño, acción ni página',async()=>{
 for(const args of [{accion:'tareas',cliente:'beta'},{accion:'borrar'},{accion:'tareas',desde:-1}]) await assert.rejects(leerOS(ceo,own,args));
 await assert.rejects(leerOS(ceo,{...own,owner:'otra@example.test'},{accion:'tareas'}));
});
await test('perfil limitado conserva su alcance; un área oculta no se puede leer',async()=>{
 const u={...ceo,email:'equipo@example.test',role:'team',scope:'asignados',views:{work:'edita',operations:'edita',clients:'completo'},areas:['work','operations','clients']};
 assert.equal((await leerOS(u,{...own,owner:u.email},{accion:'proyectos'})).items.length,1);
 assert.equal((await leerOS(u,{...own,owner:u.email,cliente:'beta'},{accion:'proyectos'})).items.length,0);
 await assert.rejects(leerOS({...u,views:{},areas:[]},{...own,owner:u.email},{accion:'proyectos'}));
});
await test('Personal respeta al dueño y no aparece en el hilo del cliente',async()=>{
 await db.create('tasks',{title:'Personal propia',tipo:'Personal',assignee:ceo.email},ceo.email,'personal-1');
 await db.create('tasks',{title:'Personal ajena',tipo:'Personal',assignee:'otra@example.test'},'otra@example.test','personal-2');
 assert.equal((await leerOS(ceo,{...own,cliente:'personal'},{accion:'tareas'})).items.length,1);
 assert.equal((await leerOS(ceo,own,{accion:'tareas'})).items.length,1);
});
await test('los costos y márgenes se omiten fuera del CEO; el embudo de Inherent queda oculto',async()=>{
 const u={...ceo,role:'coo',scope:'todos'};
 assert.ok(!JSON.stringify(await leerOS(u,own,{accion:'embudo'})).includes('margen_pct'));
 assert.ok(!JSON.stringify(await leerOS(u,own,{accion:'movimientos'})).includes('costo'));
 await db.create('embudos',{client_slug:'inherent',margen_pct:50},ceo.email,'e-inherent');
 assert.equal((await leerOS(u,{...own,cliente:'inherent'},{accion:'embudo'})).items.length,0);
});
await test('página acotada y siguiente sin truncar JSON',async()=>{
 for(let i=0;i<25;i++)await db.create('projects',{name:'Proyecto '+i,client_slug:'alpha'},ceo.email,'pagina-'+i);
 const r=await leerOS(ceo,own,{accion:'proyectos'}),r2=await leerOS(ceo,own,{accion:'proyectos',desde:r.siguiente});
 assert.equal(r.items.length,20);assert.equal(r2.items.length,6);assert.equal(r2.siguiente,null);assert.ok(JSON.stringify(r).length<6000);
});
await test('ruta real exige Gateway, conversación activa y permisos actuales del dueño',async()=>{
 const routes=new Map();rutas((m,p,f)=>routes.set(m+' '+p,f));const f=routes.get('POST agentes/gateway/mcp');
 await db.create('chat_sesiones',own,ceo.email,own.id);
 const call=async(header,body)=>{const res={code:200,status(c){this.code=c;return this;},json(x){this.body=x;}};await f({headers:header?{authorization:'Bearer '+process.env.GATEWAY_TOKEN}:{},body},res);return res;};
 assert.equal((await call(false,{chat:own.id,accion:'leer_os',args:{accion:'clientes'}})).code,401);
 const r=await call(true,{chat:own.id,accion:'leer_os',args:{accion:'clientes'}});assert.equal(r.code,200);assert.equal(JSON.parse(r.body.texto).items[0].slug,'alpha');
 await db.upsert('chat_sesiones',own.id,{turno:{estado:'listo'}},ceo.email);
 assert.equal((await call(true,{chat:own.id,accion:'leer_os',args:{accion:'clientes'}})).code,409);
});
console.log(`${n} pruebas de lectura del OS OK`);
