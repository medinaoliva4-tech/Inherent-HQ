# Social Media System — Workflow

## 1. Objetivo

El Social Media System convierte contenido aprobado en publicaciones listas para distribuir en **Instagram, Facebook y TikTok**, manteniendo Google Drive como fuente central de assets y Publer como plataforma de publicación.

La IA debe encargarse de coordinar el proceso completo, pero siempre respetando estados, aprobaciones y cuentas específicas.

---

# 2. Principio del sistema

```text
GOOGLE DRIVE
Source of Truth
      ↓
CONTENT AGENT
Orquestación + validación
      ↓
PUBLER
Publishing Engine
      ↓
INSTAGRAM
FACEBOOK
TIKTOK
```

### Roles

**Google Drive**
→ almacena y organiza los assets finales.

**IA**
→ interpreta la estrategia, crea contenido, valida assets, identifica estados, prepara publicaciones y coordina el publishing.

**Publer**
→ conecta las cuentas sociales, programa y publica.

**Redes sociales**
→ reciben el contenido final.

---

# 3. Estructura de Google Drive

Cada cliente debe tener una estructura consistente:

```text
CLIENT/
│
├── 01_PENDING/
├── 02_CLIENT_REVIEW/
├── 03_APPROVED/
└── 04_PUBLISHED/
```

### 01_PENDING

Contenido todavía en producción o que aún no está listo para revisión.

### 02_CLIENT_REVIEW

Contenido terminado que debe ser revisado por el cliente.

### 03_APPROVED

Contenido aprobado explícitamente y habilitado para publicación.

### 04_PUBLISHED

Contenido que ya fue publicado.

---

# 4. Regla principal de aprobación

La IA **nunca debe publicar contenido que no esté en `03_APPROVED`**.

El movimiento lógico es:

```text
PENDING
   ↓
CLIENT_REVIEW
   ↓
APPROVED
   ↓
PUBLISHED
```

La ubicación del archivo funciona como parte del estado del contenido.

Nunca asumir aprobación por contexto, conversación, nombre del archivo o intención.

---

# 5. Acceso a Google Drive

La IA debe utilizar Google Drive como fuente principal de archivos.

Debe poder:

- localizar el cliente correcto;
- identificar la carpeta correspondiente;
- encontrar assets aprobados;
- leer nombres y metadatos;
- acceder a imágenes y videos;
- identificar captions, copies y demás información asociada;
- mantener la organización existente.

La IA no debe crear copias innecesarias ni mover archivos de estado sin una razón clara.

---

# 6. Estructura recomendada de cada contenido

Cada publicación debe poder asociarse con:

```text
CONTENT ITEM
│
├── Asset
├── Caption
├── Platform
├── Publish Date
├── Publish Time
├── Status
├── Client
└── Optional Notes
```

Ejemplo:

```text
Asset:
AKAI_POST_023.mp4

Platform:
Instagram + Facebook + TikTok

Caption:
...

Publish Date:
2026-09-03

Publish Time:
19:00

Status:
APPROVED
```

---

# 7. Configuración inicial de Publer

Publer debe configurarse una sola vez por cliente o workspace.

La configuración inicial puede requerir intervención humana.

Debe:

1. Crear o seleccionar el workspace correspondiente.
2. Conectar las cuentas sociales.
3. Confirmar que Instagram está conectado.
4. Confirmar que Facebook está conectado.
5. Confirmar que TikTok está conectado.
6. Generar la API Key.
7. Obtener el Workspace ID.
8. Guardar las credenciales de forma segura.

La IA **nunca debe manejar contraseñas directamente**.

La autenticación debe realizarse mediante la integración oficial de Publer.

---

# 8. Acceso mediante Publer API

Cuando la automatización utilice la API, debe utilizar:

```text
Authorization: Bearer-API YOUR_API_KEY
Publer-Workspace-Id: YOUR_WORKSPACE_ID
```

La IA debe trabajar con IDs y respuestas reales de la API.

Nunca debe asumir que una cuenta específica tiene un determinado ID.

---

# 9. Identificación de cuentas sociales

Antes de publicar, la IA debe consultar las cuentas disponibles en el workspace.

Debe identificar:

```text
Instagram → account_id
Facebook  → account_id
TikTok    → account_id
```

La IA debe utilizar esos IDs en las publicaciones.

Nunca debe publicar simplemente porque “el cliente tiene Instagram”.

Primero debe verificar que:

1. la cuenta existe;
2. está conectada;
3. está disponible;
4. pertenece al workspace correcto.

---

# 10. Selección del contenido

El agente debe revisar Google Drive y buscar únicamente contenido dentro de:

```text
03_APPROVED
```

Antes de publicar debe validar:

```text
✓ Cliente correcto
✓ Asset correcto
✓ Status = APPROVED
✓ Plataforma definida
✓ Caption disponible
✓ Fecha definida
✓ Hora definida
```

Si falta alguno de estos elementos, la publicación debe detenerse y señalar el bloqueo.

---

# 11. Obtención del asset

El flujo recomendado es:

```text
APPROVED ASSET
      ↓
Google Drive
      ↓
Retrieve asset
      ↓
Publer
      ↓
Media / media_id
```

El archivo puede ser importado o cargado en Publer para convertirse en un recurso utilizable por la publicación.

La IA debe conservar la relación entre:

```text
Drive File
      ↕
Publer Media
      ↕
Scheduled Post
```

---

# 12. Creación de la publicación

Una vez obtenido el asset y validados los datos:

```text
APPROVED CONTENT
      ↓
Identify account(s)
      ↓
Upload / import media
      ↓
Create post
      ↓
Set caption
      ↓
Set platform
      ↓
Set date & time
      ↓
Schedule / Publish
```

La IA debe utilizar la API de Publer siempre que sea posible.

No debe utilizar navegación manual con Playwright para publicar si una operación equivalente está disponible mediante API.

---

# 13. Proceso asíncrono

Las operaciones de Publer pueden ejecutarse de forma asíncrona.

Por lo tanto, el flujo debe ser:

```text
Create operation
      ↓
Receive job_id
      ↓
Check job status
      ↓
Completed?
   ↙       ↘
 YES        NO
 ↓           ↓
Continue    Poll / handle error
```

La IA **no debe asumir que una operación fue exitosa únicamente porque recibió una respuesta inicial**.

Debe verificar el resultado final.

---

# 14. Confirmación de publicación

Después de programar o publicar, la IA debe registrar:

```text
Client
Post
Platform
Publer Post ID
Scheduled Date
Scheduled Time
Status
```

Cuando corresponda, el contenido puede pasar de:

```text
03_APPROVED
```

a:

```text
04_PUBLISHED
```

solo cuando realmente haya sido publicado.

Si solamente fue programado pero todavía no fue publicado, debe mantenerse separado del estado de publicado.

---

# 15. Errores y bloqueantes

La IA debe detener el proceso cuando encuentre:

### Missing Milan / Drive content
No existe el asset esperado.

### Missing approval
El contenido no está aprobado.

### Missing platform
No se especificó dónde publicar.

### Missing caption
No existe copy.

### Missing publish time
No existe fecha u hora.

### Account unavailable
La cuenta social no está conectada o disponible.

### Authentication error
La autorización de Publer o de la plataforma social expiró.

### API error
Publer devolvió un error que impide completar la operación.

### Invalid media
El asset no puede utilizarse en la plataforma seleccionada.

En estos casos:

```text
STOP
 ↓
Explain blocker
 ↓
Request human action if necessary
 ↓
Resume only after blocker is resolved
```

La IA no debe intentar inventar datos faltantes.

---

# 16. Reautenticación

Si una cuenta social pierde autorización:

```text
API ERROR
     ↓
Authentication issue
     ↓
STOP AUTOMATION
     ↓
Notify user
     ↓
User reauthenticates account
     ↓
Verify account
     ↓
Resume workflow
```

La IA debe pedir al usuario realizar la reautenticación cuando sea necesaria.

Nunca debe solicitar ni almacenar contraseñas de redes sociales.

---

# 17. Multiplicidad de plataformas

Una pieza puede publicarse en una o varias plataformas:

```text
Instagram
Facebook
TikTok
```

La IA debe tratar cada plataforma como un destino individual aunque utilice el mismo asset.

Ejemplo:

```text
CONTENT 023
│
├── Instagram
├── Facebook
└── TikTok
```

Cada destino debe validarse independientemente.

---

# 18. No duplicar contenido accidentalmente

Antes de crear una publicación, la IA debe verificar si ya existe una publicación correspondiente.

Debe evitar:

```text
Duplicate post
Duplicate schedule
Duplicate upload
```

Debe utilizar IDs de Publer y referencias del sistema siempre que estén disponibles.

---

# 19. Naming convention

Los assets deben utilizar nombres consistentes.

Ejemplo:

```text
CLIENT_CONTENT_001.jpg
CLIENT_CONTENT_002.mp4
CLIENT_REEL_003.mp4
CLIENT_CAROUSEL_004.zip
```

El objetivo es que sea fácil relacionar:

```text
Asset
+
Caption
+
Campaign
+
Platform
+
Status
```

---

# 20. Lógica general del agente

La IA debe pensar en este orden:

```text
1. Identify client
        ↓
2. Identify Drive workspace
        ↓
3. Find approved content
        ↓
4. Validate content
        ↓
5. Identify Publer workspace
        ↓
6. Identify social account IDs
        ↓
7. Retrieve asset
        ↓
8. Upload/import media
        ↓
9. Create post
        ↓
10. Schedule / publish
        ↓
11. Verify result
        ↓
12. Record result
        ↓
13. Update content state
```

---

# 21. Principios de seguridad

La automatización debe cumplir estas reglas:

**Never publish without approval.**

**Never guess an account.**

**Never guess a date or time.**

**Never expose credentials.**

**Never assume a failed API request succeeded.**

**Never move content to PUBLISHED without confirmation.**

**Never overwrite client-approved assets without explicit instruction.**

**Always preserve traceability between Drive, Publer and the social platform.**

---

# 22. Arquitectura final

```text
                 CLIENT
                   ↓
            CONTENT STRATEGY
                   ↓
              CONTENT CREATION
                   ↓
             GOOGLE DRIVE
                   ↓
        ┌─────────────────────┐
        │ 01_PENDING          │
        │ 02_CLIENT_REVIEW    │
        │ 03_APPROVED         │
        │ 04_PUBLISHED        │
        └─────────────────────┘
                   ↓
             CONTENT AGENT
                   ↓
            VALIDATION LAYER
                   ↓
              PUBLER API
                   ↓
       ┌───────────┼───────────┐
       ↓           ↓           ↓
   INSTAGRAM    FACEBOOK     TIKTOK
                   ↓
              VERIFICATION
                   ↓
          UPDATE CONTENT STATE
```

## Core Principle

**Google Drive is the source of truth.**

**The AI is the orchestrator.**

**Publer is the publishing engine.**

**Social platforms are the distribution layer.**