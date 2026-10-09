// Ideas de contenido con Claude: parte de lo que el scraper encontró (los ganadores del nicho,
// lo que suben los referentes y la competencia), los pilares y la audiencia de cada perfil.
import Anthropic from '@anthropic-ai/sdk';

export const ideasOn = () => Boolean(process.env.ANTHROPIC_API_KEY?.trim());

const SCHEMA = {
  type: 'object', additionalProperties: false, required: ['ideas'],
  properties: {
    ideas: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['format', 'title', 'hook', 'pillar', 'outline', 'why', 'inspired_by'],
        properties: {
          format: { type: 'string', enum: ['Reel', 'Carrusel'] },
          title: { type: 'string' },
          hook: { type: 'string' },
          pillar: { type: 'string' },
          outline: { type: 'array', items: { type: 'string' } },
          why: { type: 'string' },
          inspired_by: { type: 'string' },
        },
      },
    },
  },
};

const SYSTEM = `Eres el estratega creativo de Inherent, un growth operator en Guatemala. Propones ideas de contenido para redes sociales que una persona del equipo pueda producir esta semana.
Cómo trabajas:
- Partes de lo que está funcionando: los posts ganadores del nicho (rinden muchas veces el promedio de su propia cuenta), lo que publican los referentes y la competencia.
- Los referentes y la competencia son inspiración de formato, tema y estilo; nunca se copian. Cada idea es propia de la marca.
- Cada idea entra en uno de los pilares de la marca (si no hay pilares, propones el más lógico) y le habla a la audiencia descrita, del círculo más específico hacia afuera.
- Escribes en español de Guatemala, de «tú», directo y concreto. Nada genérico: un hook que se diga en los primeros 2 segundos y un desarrollo que se pueda grabar o diseñar.
- outline: para un Reel, las escenas en orden (4 a 6); para un Carrusel, el texto de cada slide (5 a 8).
- why: una frase con la razón, citando el patrón del ganador o referente que la inspira.
- inspired_by: el link del post que la inspira, o "" si no sale de uno en particular.`;

const list = (items, n) => items.slice(0, n).map((x) => `- @${x.handle} · ${x.views ? x.views + ' vistas' : x.likes + ' likes'}${x.x ? ` · ${x.x}× su promedio` : ''} · ${x.url}\n  ${String(x.text || '').replace(/\s+/g, ' ').slice(0, 280)}`).join('\n') || '(nada esta semana)';

export async function generate({ name, pillars = [], audience = {}, week = {}, own = [], reels = 5, carousels = 5 }) {
  const client = new Anthropic();
  const prompt = `Marca: ${name}
Pilares: ${pillars.map((p) => p.name).join(' · ') || '(sin definir)'}
Audiencia (de lo general a lo específico):
- General: ${audience.general || '(sin definir)'}
- Nicho: ${audience.nicho || '(sin definir)'}
- Exacto: ${audience.exacto || '(sin definir)'}

Ganadores del nicho esta semana:
${list(week.top || [], 10)}

Lo último de los referentes:
${list(week.refs || [], 10)}

Lo último de la competencia:
${list(week.comp || [], 8)}

Lo último de la marca (para no repetir):
${list(own, 8)}

Propón ${reels} ideas de Reel y ${carousels} de Carrusel.`;
  const res = await client.beta.messages.create({
    model: 'claude-opus-5-5',
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'medium', format: { type: 'json_schema', schema: SCHEMA } },
    system: SYSTEM,
    messages: [{ role: 'user', content: prompt }],
  });
  if (res.stop_reason === 'refusal') throw Object.assign(new Error('Claude no pudo generar ideas con esta información. Revisa las fuentes y vuelve a intentar.'), { status: 502 });
  const text = res.content.find((b) => b.type === 'text')?.text || '{}';
  const ideas = JSON.parse(text).ideas || [];
  return ideas.map((x, i) => ({ ...x, id: `${Date.now().toString(36)}-${i}`, inspired_by: /^https:\/\//.test(x.inspired_by) ? x.inspired_by : '' }));
}
