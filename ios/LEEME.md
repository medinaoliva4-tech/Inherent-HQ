# Inherent en tu iPhone (por cable, gratis)

> **Qué es:** una app de Apple que abre Inherent OS. Es **la misma web** del OS en una cápsula: lo que se despliega en Vercel aparece en la app **sin reinstalar nada**.
> **Qué cuesta:** $0 con tu Apple ID. **Qué te falta con la cuenta gratis:** la app **caduca a los 7 días** (se reinstala con el cable) y no hay notificaciones push de Apple ni widgets todavía. Para eso está la cuenta de desarrollador (US$99 al año).

## Lo que tienes que hacer (en tu Mac, 10 minutos la primera vez)

1. **Instala Xcode** desde la App Store (gratis, pesa varios GB). Ábrelo una vez y acepta la licencia.
2. **Instala Node 20 o más nuevo** desde nodejs.org *(si ya lo tienes, sáltalo)*.
3. **En la Terminal**, dentro de esta carpeta (`ios/`):
   ```
   npm run ios:instalar
   ```
   Instala lo necesario y **abre Xcode** con el proyecto.
4. **En Xcode:** elige el proyecto **App** (columna izquierda) → pestaña **Signing & Capabilities** → **Team** → tu **Apple ID** («Personal Team»).
   *Si dice que el identificador ya existe, cámbialo a `global.inherent.os.tunombre`.*
5. **Conecta el iPhone con el cable**, desbloquéalo y toca **«Confiar»**. En el iPhone activa **Ajustes → Privacidad y seguridad → Modo desarrollador** (te pide reiniciar).
   Arriba en Xcode elige **tu iPhone** y pulsa **▶**.
6. **En el iPhone:** Ajustes → General → **VPN y gestión de dispositivos** → tu Apple ID → **Confiar**. Abre **Inherent**.

**A los 7 días**, cuando la app deje de abrir: conecta el cable y vuelve a pulsar ▶. Nada más.

## Cómo entras
Toca **Continuar con Google**: se abre el navegador del sistema (Google no deja entrar dentro de una app), eliges tu cuenta y **vuelves solo a Inherent**.
Si no vuelve solo: cierra la ventana del navegador y repite.

## Si algo falla
| Pasa… | Haz… |
|---|---|
| Xcode dice «Failed to register bundle identifier» | Cambia el identificador (paso 4) |
| «Untrusted Developer» al abrir | Paso 6 |
| La app abre en blanco con «No pude abrir Inherent OS» | Revisa la conexión y toca **Reintentar** |
| Pide «Developer Mode» | Paso 5 |
| Google dice «disallowed_useragent» | Actualiza la app: ese login ya sale al navegador del sistema |

## Para quien la mantiene (no hace falta para instalar)
- `capacitor.config.json` apunta a **https://inherent-work.vercel.app** (`server.url`). Para probar contra otra URL, cámbiala y corre `npx cap sync ios`.
- Los puentes nativos que ya trae: **haptics, cámara, compartir, notificaciones locales, navegador del sistema**. Se usan desde la web con `Capacitor.Plugins.*` (ver `ceo-os/public/js/login-nativo.js`).
- **No verificado desde Linux:** la compilación en Xcode, la firma, el login completo en un iPhone y Face ID físico. Todo lo demás (config, permisos, login con código y PKCE) tiene pruebas: `npm test` aquí y `npm run test:vision-auth-native` en `ceo-os/`.
- Para widgets, Live Activities, push de Apple y TestFlight hace falta la **cuenta de desarrollador (US$99/año)**.
