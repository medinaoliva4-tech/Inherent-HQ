# 🧪 _test — cliente ficticio de pruebas

> 🔴 **TODO EN ESTE FOLDER ES INVENTADO.** No existe esta empresa.
> **Nunca se publica, nunca se pauta, nunca se le envía nada a nadie.**

## Para qué sirve

**Todos los agentes bloquean en su Capa 0 pidiendo datos del cliente.** Sin un folder con esos
datos, un agente no se puede probar: se queda en el gate y no se sabe si funciona.

**Este folder es el fixture.** Trae lo mínimo para que cada agente corra de punta a punta.

## El cliente ficticio

| | |
|---|---|
| **Marca** | Tostaduría Altura — café de especialidad |
| **División** | 🔵 **LOW TICKET** — se compra por volumen y repetición |
| **Plan** | 🟨 **ACCELERATE** · $2,500 |
| **Por qué Accelerate** | Es el plan que activa **más capas a la vez**: Growth OS, Conversion OS, SOPs, tecnología, mentor y pauta en Google. **Probar con él prueba casi todo** |

## Qué hay

| Archivo | Para quién |
|---|---|
| `data/00-encargo.md` | Plan, línea, división, accesos, presupuesto · **⓪ ① ② ⑩** |
| `data/01-comprension.md` | Unit economics, audiencia, capacidad · **① ② ③ ②B** |
| `data/02-brand-brief.md` | Los 8 bloques · **②B** |
| `data/03-guia-de-marca.md` | Voz, territorio, activos · **③ ④ ⑥A ⑥B ⑨** |
| `data/04-sistema-visual.md` | Paleta, tipografías, safe zones · **⑥A ⑥B** |
| `ESTRATEGIA.md` | Posicionamiento aprobado y los briefs · **③ ② ②B** |
| `PRUEBAS.md` | **El checklist: qué tiene que pasar en cada agente** |

## Reglas de este folder

| | |
|---|---|
| **No se mezcla con un cliente real** | Si una sesión toca `_test`, no toca otro folder |
| **Lo que escriban los agentes acá es desechable** | Se puede borrar y volver a correr |
| **Nada de acá se cita como evidencia** | Es ficticio. No es un caso |
| **Si un agente NO bloquea cuando debería, es un bug** | Ver `PRUEBAS.md` |
