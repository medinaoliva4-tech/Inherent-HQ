# ④ Producción — Cómo trabaja

> **Pre y Post en un mismo agente.** Pre deja todo listo para grabar; Post convierte lo grabado en
> reels y derivadas. **El primer corte lo hace el agente; el editor humano solo corrige.**

## 📅 Tu ventana en el ciclo

| Días | Qué corre | Rol |
|---|---|---|
| **3 – 5** | Pre: jornada, guiones, shot list, permisos, compras | Agente → **COO** coordina producción, fotografía y modelos |
| **6 – 11** | Grabar y fotografiar · 🔴 **día 11, último para producir** | Producción · Fotografía |
| **12 – 15** | Post: primer corte, marca, derivadas, export | Agente → **Editor de video** corrige |

## 1 · Los pasos

| # | Paso | Skill |
|---|---|---|
| 0 | Recepción | `recepcion` |
| 1 | **Pre** — jornada, briefs, guiones, shot list, permisos, compras, hooks alternos, presupuesto | `pr-pre` |
| 2 | Grabar | Las personas, con la hoja impresa |
| 3 | **Post** — recepción del material, primer corte, marca, derivadas, export y aprobación | `pr-post` |

Si el presupuesto pasa la referencia del onboarding, **se escala al CEO** y se sigue. Después del
día 11 no se graba nada del ciclo: se monta con lo que hay, el banco y las derivadas.

## 2 · Por nivel

| | **Brand Foundation** | **Brand Growth** | **Growth Partnership** |
|---|---|---|---|
| **Corre** | ⬜ Solo si el proyecto incluye sesión | Según la ficha | Según la ficha |
| **Volumen** | — | Horas, sesiones, videos y derivadas de la ficha | Igual |

## 3 · Lo que entrega

| Qué | Dónde |
|---|---|
| Hoja de jornada | `clients/<cliente>/04-contenido/<AAAA-MM>/produccion/` *(nodo `jornada`)* y la herramienta del OS |
| Material crudo | Drive del cliente · `03 Crudo` |
| Masters, derivadas y previews | Drive del cliente · `04 Por postear`, con el id de la pieza en el nombre |
| Página de aprobación del cliente | `brain/motor/aprobacion/vercel/` |

## 4 · Acciones

| Acción | Herramienta |
|---|---|
| Montar y renderizar | `brain/motor/remotion/` *(Remotion + Python + ffmpeg)* |
| Ver clips con tiempos exactos | La skill `/watch` |
| Bajar y subir material | Google Drive · `yt-dlp` |
| Publicar la página de aprobación | Vercel |

**El motor** *(`brain/motor/`)* se copia al proyecto de edición de cada cliente; cómo se instala y se
corre está en su `README.md`.

## 5 · Lo que NO hace

| No hace | Quién |
|---|---|
| Escribir o cambiar el copy | ③ Marketing y Creative |
| Generar video con IA o doblar | — *(edita material real)* |
| Validar la marca | ② Branding (`br-guardian`) |
| Publicar | ⑦ Posting |
