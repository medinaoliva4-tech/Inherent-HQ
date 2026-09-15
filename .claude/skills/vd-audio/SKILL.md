---
name: vd-audio
description: >
  Disciplinas 8 y 9 — sound design y edición de audio/voz. Limpia la voz (ruido, EQ, compresión,
  volumen) y construye la capa sonora: música, efectos, whooshes, risers, golpes, ambientes y
  transiciones. Úsala cuando pidan "limpiá el audio", "se escucha mal", "ponele música", "agregá
  efectos", "falta impacto", "nivelá el volumen", "sacá el ruido de fondo", "mezclá". Corre después
  del picture lock; la mezcla final se cierra antes del master.
---

# Audio — Voz y Sound Design

**Requiere:** picture lock. Mezclar sobre una estructura que va a cambiar es tiempo tirado.
**Audio es el 50% del video.** Una pieza con imagen impecable y voz sucia está reprobada.

## Orden de trabajo

```
1  VOZ        Limpieza → EQ → compresión → nivelación   (primero siempre)
2  AMBIENTE   Room tone que tape los empalmes de la voz
3  MÚSICA     Elegida por el tono del brief, no por gusto
4  SFX        Los que agregan, no los que decoran
5  MEZCLA     Balance entre capas
6  LOUDNESS   Normalizar a −14 LUFS · true peak ≤ −1.5 dBTP
```

## Voz — el piso de calidad

| Paso | Qué se hace |
|---|---|
| **Limpieza** | Reducción de ruido suave. Demasiada deja la voz robótica |
| **EQ** | Corte bajo ~80 Hz · atenuar 200-400 Hz (barro) · presencia 3-5 kHz |
| **De-ess** | Si las "s" pinchan |
| **Compresión** | Ratio suave, para que la voz sea pareja, no aplastada |
| **Nivelación** | Voz como referencia de toda la mezcla |
| **Empalmes** | Room tone debajo: sin él, cada corte "respira" distinto y se nota |

## Sound design

| Elemento | Uso | Cuidado |
|---|---|---|
| **Música** | Sostiene la energía y el tono | Bajo la voz a −18/−22 dB relativos |
| **Whoosh** | Acompaña un movimiento o transición | Uno cada tanto; en exceso es ruido |
| **Riser** | Construye tensión hacia un beat | Tiene que resolver en algo |
| **Impacto / golpe** | Marca un corte o una revelación | Nunca en el frame 1 sin motivo |
| **Ambiente** | Da lugar y veracidad | Imprescindible en documental |
| **Silencio** | La herramienta más subestimada | Antes de un beat importante |

## Reglas duras

- 🛑 **Si la primera palabra del hook no se entiende, el hook no existe.**
- 🛑 **La música nunca tapa la voz.** Ante la duda, la música baja.
- 🛑 **Música y SFX con licencia.** Se declara cuál y qué licencia en el QC.
- **El sonido lidera la emoción; la imagen la confirma.** En cine y documental esto es literal.
- **Entrega a −14 LUFS** con true peak ≤ −1.5 dBTP. Sin clipping.
- **Se revisa en parlante de celular**, no solo en auriculares: es donde se va a escuchar.
- **La mayoría ve sin sonido:** lo crítico también tiene que estar en pantalla (`vd-captions`).
- **En documental no se edita una frase para que diga algo que la persona no dijo.**
- Sonotipo de marca donde el guideline lo indique, no donde quede lindo.

## Comandos útiles

```bash
# Extraer audio para trabajar
ffmpeg -i in.mp4 -vn -ac 1 -ar 48000 voz.wav

# Medir loudness
ffmpeg -i in.mp4 -af loudnorm=print_format=json -f null - 2>&1 | tail -20

# Normalizar a -14 LUFS sin tocar video
ffmpeg -i in.mp4 -af loudnorm=I=-14:TP=-1.5:LRA=11 -c:v copy out.mp4

# Detectar silencios (candidatos a corte)
ffmpeg -i voz.wav -af silencedetect=n=-30dB:d=0.4 -f null - 2>&1 | grep silence
```

## Cierre
Correr los ítems de audio del bloque **Fase 4** de `qa/QC-GATES.md`. Verificar loudness medido.

## Handoff
→ `vd-motion` / `vd-captions`, y después `vd-entrega`.
