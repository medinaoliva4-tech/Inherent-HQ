# Puente de Laya

Laya es el motor de decisiones que corre **en tu compu**. Este puente deja que Inherent OS le pida
juicios desde el navegador: «¿encaja este lead?», «¿esta factura parece duplicada?».

## Instálalo (una vez)

Necesitas Python 3.10 o más nuevo. Desde la raíz del repo:

```bash
pip install "laya[serve]"
```

## Enciéndelo

```bash
python ceo-os/tools/laya-puente/puente.py
```

- La primera vez baja el modelo en español (unos 644 MB). Después arranca en segundos.
- Déjalo abierto mientras trabajas. Para apagarlo: `Ctrl + C`.
- En Inherent OS → **Inherent → Laya** ves un punto verde cuando está encendido.

## Lo que tienes que saber

- Escucha solo en `127.0.0.1:7357`: nadie de afuera de tu compu le puede hablar.
- Solo acepta pedidos de la web del OS. Si la abres en otro dominio, agrégalo:
  `LAYA_PUENTE_ORIGENES="https://otro.dominio,http://localhost:*" python ceo-os/tools/laya-puente/puente.py`
- Si el navegador te pregunta si la página puede acceder a tu red local, dile que sí.
- Sin puente encendido, el botón «Pedir a Laya» deja el juicio **pendiente**. Claude Code lo
  resuelve en una compu que tenga Laya por MCP:
  `pip install "laya[mcp]"` y luego `claude mcp add laya -- laya-mcp-server`.
  Después pídele: «resuelve los juicios pendientes de Laya».
