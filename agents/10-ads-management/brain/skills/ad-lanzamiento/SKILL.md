---
name: ad-lanzamiento
description: >
  Capa 3 de ⑩ Ads Management — lanza lo aprobado. Verifica una última vez el tracking, el
  presupuesto diario y el destino de cada anuncio, lanza con AdWhispr y registra qué quedó
  corriendo con su fecha. Es acción destructiva: gasta dinero del cliente y no se puede
  deshacer, así que solo corre con el GATE 1 aprobado. Úsala cuando pidan "lanzá", "ponelo a
  correr", "activá las campañas". Nunca sin gate.
---

# Capa 3 · Lanzamiento — acá se empieza a gastar

| | |
|---|---|
| **Consume** | `plan-de-pauta.md` **con GATE 1** |
| **Produce** | Las campañas corriendo + la sección **§ Lo que corre** de `reporte-de-pauta.md` |

## 1 · 🔴 Es acción destructiva

🛑 **Gasta dinero del cliente y no se deshace.**
**Sin GATE 1 aprobado por escrito, esta capa no corre.**

## 2 · La verificación final — antes de apretar

| Chequeo | Si falla |
|---|---|
| **El tracking funciona** | 🛑 **No se lanza.** Gastar sin medir es tirar el presupuesto |
| **El presupuesto diario es el aprobado** | 🛑 Se corrige |
| **El destino abre** | Link, WhatsApp, formulario — **se prueba uno por uno** |
| **El destino es móvil** | La mayoría del tráfico es móvil |
| **El anuncio no tiene claim `⏸️`** | 🛑 No sale |
| **Hay 3+ variantes por campaña** | 🛑 El test no sirve con menos |

> 🔑 **Un destino roto convierte 0% y gasta 100%.** Es el error más caro y el más fácil de
> evitar.

## 3 · Con qué se lanza

| Plataforma | Acción |
|---|---|
| Meta | AdWhispr `launch_meta_ad` |
| TikTok | AdWhispr `launch_tiktok_campaign` |
| Google Search | AdWhispr `launch_search_campaign` |
| Performance Max | AdWhispr `launch_pmax_campaign` |

> ⚠️ **`/ads launch --draft` del plugin propone, no aplica.** Sirve para revisar el plan de
> cambios antes de ejecutarlo con AdWhispr.

## 4 · El registro

**Toda campaña lanzada se registra en el momento.**

| Campo | Por qué |
|---|---|
| Qué se lanzó, con su ID | Para poder pausarlo después |
| **Fecha y hora** | El pacing se mide desde acá |
| Presupuesto diario | Para detectar cambios no autorizados |
| Quién aprobó | Trazabilidad |

🛑 **Una campaña corriendo que nadie registró es una campaña que nadie va a pausar.**

## 5 · Las primeras 48 horas

| | |
|---|---|
| **No se toca nada.** La plataforma está aprendiendo |
| **Salvo:** gasto sin ninguna conversión, o un destino roto |
| **Se revisa a las 24 h** que el gasto esté corriendo y el tracking registrando |

## 6 · Checklist

- [ ] **GATE 1 aprobado por escrito**
- [ ] El **tracking funciona**, verificado
- [ ] Cada **destino se probó**, uno por uno, en móvil
- [ ] El presupuesto diario es **el aprobado**
- [ ] Ningún anuncio lleva claim `⏸️`
- [ ] **3 o más variantes** por campaña
- [ ] Todo quedó **registrado** con ID, fecha y quién aprobó
