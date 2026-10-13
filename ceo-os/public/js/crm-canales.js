// Temporal (aprobado por el CEO): «CRM ligero + automatizaciones» por canales.
// Nivel 3: un canal (correo o WhatsApp) · nivel 5: más seguimientos · nivel 10: correo + WhatsApp + DMs de Instagram.
// Cambia lo que incluye, la descripción, lo que pide al cliente y su SOP. Horas, precio y categoría no se tocan.
export const N3 = ['Lista de contactos con su etapa: nuevo, contactado, en negociación, ganado o perdido.', 'Formulario que guarda solo a cada interesado nuevo.', 'Un canal automático a elegir: correo o WhatsApp.', 'Mensaje de bienvenida que sale solo.', '1 seguimiento automático a quien no respondió.'];
export const N5 = ['3 mensajes de seguimiento en secuencia.', 'Aviso a tu equipo cuando alguien responde.', 'De dónde llegó cada contacto.'];
export const N10 = ['Correo + WhatsApp + DMs de Instagram en una sola bandeja.', 'Secuencias distintas según la etapa de cada contacto.', 'Mensajes para quien ya compró: gracias, reseña y volver a comprar.', 'Reporte mensual de respuestas y ventas.'];

export const DESC = 'Ordenamos a todos tus interesados en un solo lugar y les damos seguimiento solo, para que ninguno se enfríe por falta de respuesta. En básico trabajamos un canal (correo o WhatsApp); en fuerte, correo, WhatsApp y los mensajes de Instagram en una sola bandeja, con mensajes distintos según en qué va cada persona. Solo les escribimos a quienes ya te contactaron o te dejaron sus datos.';

export const ONB = ['Tu número de WhatsApp Business (el que ya usas) y el teléfono a la mano para escanear un código', 'Acceso a tu cuenta de Meta (Facebook e Instagram del negocio)', 'Una tarjeta en tu cuenta de WhatsApp Business para los mensajes que cobra Meta', 'Tu correo del negocio', 'Lista de contactos actual, si tienes una', 'Qué vendes, a qué precio y las preguntas que más te hacen'];

export const SOP = `# SOP · CRM ligero + automatizaciones

> **Para qué sirve:** que ningún interesado se enfríe por falta de respuesta: todos en un solo lugar y con seguimiento que sale solo.
> **Dueño:** COO · **Lo ejecuta:** Operador de agentes, con Dev / Tech · **Cuándo se usa:** cuando el cliente contrata este servicio
> **Tiempo y precio:** en Sales → Catálogo de servicios · **Herramienta:** Zernio (bandeja, contactos, secuencias y envíos)

## La regla que no se rompe
Solo se le escribe automático a quien **ya contactó al cliente o dejó sus datos**. A desconocidos no: WhatsApp bloquea el número. Para contactar empresas nuevas se usa el servicio de Prospección B2B.

## Qué entregamos
**Básico (3) · un canal: correo o WhatsApp**
${N3.map((x) => `- [ ] ${x}`).join('\n')}

**Sencillo (5) · lo del 3, más:**
${N5.map((x) => `- [ ] ${x}`).join('\n')}

**Fuerte (10) · correo + WhatsApp + DMs de Instagram, más:**
${N10.map((x) => `- [ ] ${x}`).join('\n')}

## Antes de empezar
- [ ] El servicio está en una cotización pagada y se sabe el nivel (3 a 10)
- [ ] En nivel 3: el cliente eligió el canal (correo o WhatsApp)
- [ ] El cliente entregó lo del onboarding:
${ONB.map((x) => `  - [ ] ${x}`).join('\n')}

## Cuánto cuesta y cuánto tarda (para explicarle al cliente)
- **Conectar su WhatsApp Business actual:** gratis, unos 15 minutos con su teléfono. Sigue usando la app normal.
- **Nombre del negocio aprobado por Meta:** normalmente 1 a 3 días.
- **Respuestas dentro de las 24 h desde que la persona escribió:** Meta no cobra.
- **Mensajes después de 24 h (plantillas):** los cobra Meta a la tarjeta del cliente. Nosotros no pagamos ni revendemos eso.
- **Zernio:** ya lo paga Inherent. Los primeros 10,000 mensajes al mes son gratis.
- **Número nuevo** (solo si el cliente no quiere usar el suyo): de $3 a $30 al mes y de 1 a 3 días hábiles.

## Cómo lo hacemos
1. **Perfil del cliente en Zernio** — quién: Operador · dónde: Zernio → Profiles · crear el perfil con el nombre del cliente.
2. **Conectar los canales del nivel** — quién: Operador con el cliente en llamada.
   - WhatsApp: Zernio → Connect → WhatsApp → usar su número de WhatsApp Business → escanear el QR desde la app (Ajustes → Dispositivos vinculados).
   - Correo: conectar el correo del negocio.
   - Instagram (nivel 10): conectar la cuenta de Instagram del negocio con su acceso de Meta.
3. **Etapas y contactos** — quién: Operador · cargar la lista actual con su etapa (nuevo, contactado, en negociación, ganado, perdido) y su origen.
4. **Formulario de captación** — quién: Dev / Tech · cada envío entra solo como contacto «nuevo», con su origen.
5. **Mensajes** — quién: Operador, con la voz de la marca · bienvenida y seguimientos. Para WhatsApp después de 24 h, las plantillas se mandan a aprobar a Meta (tarda horas o 1 día).
6. **Secuencias** — quién: Operador · dónde: Zernio → Sequences.
   - Nivel 3: bienvenida + 1 seguimiento a los 2 días si no respondió.
   - Nivel 5: bienvenida + 3 seguimientos (día 2, 4 y 7) y aviso al equipo cuando alguien responde.
   - Nivel 10: una secuencia por etapa, y otra para quien ya compró (gracias → reseña → volver a comprar).
7. **Prueba completa** — quién: Operador · llenar el formulario con un contacto de prueba y confirmar que llega cada mensaje a tiempo y por el canal correcto.
8. **Entrega y capacitación** — quién: Operador · 30 min con el equipo del cliente: cómo ver la bandeja, mover etapas y responder.
9. **Reporte mensual (nivel 10)** — quién: Operador · respuestas, conversaciones y ventas del mes.

## Checklist de calidad
- [ ] Todo lo de «Qué entregamos» para el nivel contratado está hecho
- [ ] Ningún mensaje automático va a gente que no contactó al cliente
- [ ] La prueba completa pasó en cada canal
- [ ] Lo revisó el COO antes de entregar
- [ ] El cliente sabe usar la bandeja y mover etapas

## Errores comunes
- **Escribirle a una lista comprada o a desconocidos por WhatsApp:** bloquean el número. No se hace.
- **Plantillas sin aprobar:** los seguimientos después de 24 h no salen. Mandarlas a aprobar en el paso 5.
- **Un número nuevo enviando mucho de golpe:** Meta lo limita. Usar el número que el cliente ya tiene.
- **El teléfono del cliente sin usar WhatsApp Business por semanas:** Meta desconecta el número. Avisarle que lo abra seguido.

## Si algo falla
Precio, alcance y fechas → el CEO · lo demás → el COO.
`;

// Aplica todo: servicio (lo que incluye, descripción, onboarding) y su SOP en la Library.
export async function aplicar(S, sv, D) {
  const r = await S.save({ ...sv, crm_v2: true, description: DESC, includes3: N3.join('\n'), includes5: [...N3, ...N5].join('\n'), includes10: N10.join('\n'), onboarding: ONB.join('\n') });
  let sop = 'sin acceso a la Library';
  try {
    const docs = await D.list(), title = `SOP · ${sv.name}`, cur = docs.find((d) => d.kind === 'SOP' && d.title.trim().toLowerCase() === title.trim().toLowerCase());
    if (cur) { await D.save({ ...cur, body: SOP }); sop = 'SOP actualizado'; }
    else { const f = docs.find((d) => d.kind === 'SOP' && /^SOP · /.test(d.title))?.folder_id || ''; await D.create({ title, kind: 'SOP', folder_id: f, roles: ['coo'], body: SOP }); sop = 'SOP creado'; }
  } catch {}
  return { service: r, sop };
}
