// Los conectores (MCPs) que el OS sabe conectar, con su logo. Puro: lo usan la pantalla (Inherent AI → MCPs), el servidor
// (api/_lib/conectores.js) y las pruebas.
//   tipo 'mcp'    → servidor MCP remoto con OAuth: el OS hace de puente (registra su app, abre el login del servicio, guarda
//                   el permiso cifrado) y los agentes usan sus herramientas desde el servidor.
//   tipo 'token'  → servidor MCP remoto que pide un token personal (se pega una vez).
//   tipo 'google' → ya viene con tu cuenta de Google del OS (Drive, Calendar, Gmail).
//   tipo 'os'     → integraciones propias del OS (Inherent OS, Zernio, Windsor, Apify, Meta): las configura el CEO.
//   tipo 'pronto' → todavía sin un MCP remoto público que el OS pueda conectar directo (antes iban por Hermes, que se retiró).
export const CATEGORIAS = [['todo', 'Todo'], ['docs', 'Docs y archivos'], ['trabajo', 'Proyectos y equipo'], ['diseno', 'Diseño'], ['marketing', 'Marketing y ventas'], ['dev', 'Datos y desarrollo']];

export const CONECTORES = [
  { id: 'inherent', nombre: 'Inherent OS', sub: 'Clientes, proyectos, tareas, Library y notas', de: 'Inherent', logo: 'inherent', tipo: 'os', cat: 'trabajo', destacado: true },
  { id: 'google-drive', nombre: 'Google Drive', sub: 'Busca, lee y sube archivos', de: 'Google', logo: 'googledrive', tipo: 'google', scope: 'drive', cat: 'docs', destacado: true },
  { id: 'gmail', nombre: 'Gmail', sub: 'Redacta respuestas, resume hilos y busca en tu bandeja', de: 'Google', logo: 'gmail', tipo: 'google', scope: 'gmail', cat: 'docs', destacado: true },
  { id: 'google-calendar', nombre: 'Google Calendar', sub: 'Agenda y coordina reuniones', de: 'Google', logo: 'googlecalendar', tipo: 'google', scope: 'calendar', cat: 'trabajo', destacado: true },
  { id: 'notion', nombre: 'Notion', sub: 'Busca, crea y actualiza páginas y bases', de: 'Notion', logo: 'notion', tipo: 'mcp', url: 'https://mcp.notion.com/mcp', cat: 'docs', destacado: true },
  { id: 'canva', nombre: 'Canva', sub: 'Busca, crea, autollena y exporta diseños', de: 'Canva', logo: 'canva', tipo: 'mcp', url: 'https://mcp.canva.com/mcp', cat: 'diseno', destacado: true },
  { id: 'figma', nombre: 'Figma', sub: 'Lee diseños y genera diagramas', de: 'Figma', logo: 'figma', tipo: 'mcp', url: 'https://mcp.figma.com/mcp', cat: 'diseno', destacado: true },
  { id: 'atlassian', nombre: 'Atlassian', sub: 'Jira, Confluence y más', de: 'Atlassian', logo: 'atlassian', tipo: 'mcp', url: 'https://mcp.atlassian.com/v1/mcp', cat: 'trabajo' },
  { id: 'linear', nombre: 'Linear', sub: 'Issues, proyectos y ciclos', de: 'Linear', logo: 'linear', tipo: 'mcp', url: 'https://mcp.linear.app/mcp', cat: 'trabajo' },
  { id: 'asana', nombre: 'Asana', sub: 'Tareas y proyectos del equipo', de: 'Asana', logo: 'asana', tipo: 'mcp', url: 'https://mcp.asana.com/v2/mcp', cat: 'trabajo' },
  { id: 'monday', nombre: 'monday.com', sub: 'Tableros y flujos de trabajo', de: 'monday.com', logo: 'custom', tipo: 'mcp', url: 'https://mcp.monday.com/mcp', cat: 'trabajo' },
  { id: 'miro', nombre: 'Miro', sub: 'Pizarras y diagramas', de: 'Miro', logo: 'miro', tipo: 'mcp', url: 'https://mcp.miro.com/', cat: 'diseno' },
  { id: 'webflow', nombre: 'Webflow', sub: 'Sitios, CMS y contenido', de: 'Webflow', logo: 'webflow', tipo: 'mcp', url: 'https://mcp.webflow.com/mcp', cat: 'marketing' },
  { id: 'hubspot', nombre: 'HubSpot', sub: 'Contactos, empresas y negocios', de: 'HubSpot', logo: 'hubspot', tipo: 'mcp', url: 'https://mcp.hubspot.com/', cat: 'marketing' },
  { id: 'intercom', nombre: 'Intercom', sub: 'Conversaciones y clientes', de: 'Intercom', logo: 'intercom', tipo: 'mcp', url: 'https://mcp.intercom.com/mcp', cat: 'marketing' },
  { id: 'supabase', nombre: 'Supabase', sub: 'Bases de datos, auth y storage', de: 'Supabase', logo: 'supabase', tipo: 'mcp', url: 'https://mcp.supabase.com/mcp', cat: 'dev' },
  { id: 'vercel', nombre: 'Vercel', sub: 'Proyectos, deploys y logs', de: 'Vercel', logo: 'vercel', tipo: 'mcp', url: 'https://mcp.vercel.com', cat: 'dev' },
  { id: 'sentry', nombre: 'Sentry', sub: 'Errores y rendimiento', de: 'Sentry', logo: 'sentry', tipo: 'mcp', url: 'https://mcp.sentry.dev/mcp', cat: 'dev' },
  { id: 'cloudflare', nombre: 'Cloudflare', sub: 'Docs, Workers y observabilidad', de: 'Cloudflare', logo: 'cloudflare', tipo: 'mcp', url: 'https://docs.mcp.cloudflare.com/mcp', cat: 'dev' },
  { id: 'github', nombre: 'GitHub', sub: 'Repos, issues y pull requests', de: 'GitHub', logo: 'github', tipo: 'token', url: 'https://api.githubcopilot.com/mcp/', ayuda: 'https://github.com/settings/personal-access-tokens/new', cat: 'dev' },
  { id: 'zapier', nombre: 'Zapier', sub: 'Miles de apps a través de tus Zaps', de: 'Zapier', logo: 'zapier', tipo: 'token', url: 'https://mcp.zapier.com/api/mcp/mcp', ayuda: 'https://mcp.zapier.com', cat: 'trabajo' },
  { id: 'apify', nombre: 'Apify', sub: 'Scraping de redes y sitios', de: 'Apify', logo: 'apify', tipo: 'os', env: 'APIFY_TOKEN', cat: 'marketing' },
  { id: 'windsor', nombre: 'Windsor.ai', sub: 'Métricas de ads y analytics', de: 'Windsor', logo: 'custom', tipo: 'os', env: 'WINDSOR_API_KEY', cat: 'marketing' },
  { id: 'zernio', nombre: 'Zernio', sub: 'Publicar y medir en redes', de: 'Zernio', logo: 'custom', tipo: 'os', env: 'ZERNIO_API_KEY', cat: 'marketing' },
  { id: 'slack', nombre: 'Slack', sub: 'Mensajes, canales y canvases', de: 'Slack', logo: 'slack', tipo: 'pronto', cat: 'trabajo' },
  { id: 'microsoft365', nombre: 'Microsoft 365', sub: 'SharePoint, OneDrive, Outlook y Teams', de: 'Microsoft', logo: 'microsoft365', tipo: 'pronto', cat: 'docs' },
  { id: 'airtable', nombre: 'Airtable', sub: 'Bases y registros', de: 'Airtable', logo: 'airtable', tipo: 'pronto', cat: 'dev' },
  { id: 'shopify', nombre: 'Shopify', sub: 'Productos, pedidos y tiendas', de: 'Shopify', logo: 'shopify', tipo: 'pronto', cat: 'marketing' },
];
export const conectorDe = (id) => CONECTORES.find((c) => c.id === id) || null;
export const logoConector = (c) => `/brand/mcp/${c?.logo || 'inherent'}.svg`;
export const TIPO_TEXTO = { mcp: 'Conexión directa', token: 'Con token', google: 'Con tu Google', os: 'Integración del OS', pronto: 'Próximamente' };

// Un nombre de herramienta MCP seguro para la IA: «notion__search» (letras, números, _ y -; máx. 64).
export const nombreTool = (conector, tool) => `${conector}__${tool}`.replace(/[^\w-]/g, '_').slice(0, 64);
export const leerNombreTool = (n) => { const i = String(n).indexOf('__'); return i < 0 ? null : { conector: n.slice(0, i), tool: n.slice(i + 2) }; };
