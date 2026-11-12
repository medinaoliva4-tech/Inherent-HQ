# Inherent OS para Mac (app de escritorio)

La app es una ventana de Electron que carga el OS remoto (`INHERENT_OS_URL`, por defecto Vercel) y trae el puente de Laya adentro.

## Cuándo hace falta una release y cuándo basta un deploy

| Qué cambió | Qué pasa | Cómo se entera la persona |
|---|---|---|
| Algo de `ceo-os/public`, `ceo-os/api` (la web) | Basta el deploy de Vercel. La app no se vuelve a armar. | Panel «Hay cambios nuevos» con «Recargar» (también en el navegador). Lo prende un deploy nuevo: el OS pregunta `GET /api/os/version` cada ~10 min y al volver a enfocar la ventana. |
| `ceo-os/escritorio/**`, `public/laya/puente.py`, `public/laya/instalar.sh` o el workflow, en `main` | `.github/workflows/escritorio.yml` arma la app y publica la release `escritorio-v<versión>-<run>`. Sube la versión en `package.json` para que el cambio sea visible. | Panel «Actualización lista» con «Actualizar» (se baja el .zip y la app vuelve a abrir) o «Descargar» (el .dmg). |

## Número de armado

El workflow escribe `build.json` (`{"n": <run_number>}`, no se versiona) antes de empaquetar; `armado.js` lo lee, `preload.js` lo expone como `inherentEscritorio.build` y el tag de la release lleva el mismo número. Con el mismo semver, la app compara el número de armado; una app sin `build.json` cuenta como más vieja.

## Probar

`npm run test:aviso` (desde `ceo-os`). Lo que no cubren las pruebas: Electron real, la instalación y la descarga del .zip/.dmg.
