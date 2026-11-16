# Revisión de interfaz · 15 nov 2026

## Alcance comprobado

- 42 rutas de herramientas abiertas en escritorio y móvil (84 vistas): sin desborde horizontal ni errores de pantalla.
- 18 áreas generales abiertas en escritorio y móvil. Se revisaron además capturas en modo claro y oscuro de Strategy, Commercial Diagnosis, Opportunity Map, Production, Agentes y Chat.
- Interacción real comprobada: crear y editar una escena del Shot List; subir y quitar una imagen de agente.
- El commit de datos ficticios y Chat de demostración fue revertido antes de esta revisión.

## Patrón aplicado

- Contexto del cliente compacto, sin monograma ni ficha de perfil; se muestra la descripción existente.
- Catálogo de herramientas con propósito y estado. Dependencias en un detalle desplegable; el borrador se muestra cuando existe.
- Una o dos acciones principales visibles. Exportar, copiar, comparar y demás acciones secundarias en «Más acciones».
- Entrada técnica plegada por defecto. Commercial Diagnosis muestra un inicio guiado cuando no hay cifras, sin repetir alertas por campo.
- Sidebar del Chat con el ancho, superficie, sombra, encabezado y pie del OS.
- Shot List en tabla/tablero, editable y compatible con Excel mediante CSV de 16 columnas. No se promete soporte nativo de `.xlsx`.
- Agentes con imagen PNG/JPG/WebP editable; se recorta a 160×160 y se guarda comprimida. Sin imagen se usa un icono de bot.

## Referencias de producto

- [Linear: proyectos](https://linear.app/docs/projects) y [opciones de visualización](https://linear.app/docs/display-options): resumen breve, propiedades claras y vistas según el trabajo.
- [shadcn/ui: Sidebar](https://ui.shadcn.com/docs/components/aria/sidebar) y [Data Table](https://ui.shadcn.com/docs/components/base/data-table): jerarquía de barra lateral, filas y acciones contextuales.
- [OpenUI: Generative UI](https://www.openui.com/docs/agent/core-concepts/generative-ui): la IA compone componentes registrados por la app, con acciones controladas por el OS.

## Límites actuales

- Dos herramientas P3 siguen marcadas «Pronto» en el registro existente.
- El servidor remoto de Chat no respondió en la instancia local usada para esta revisión; la interfaz y las rutas sí abrieron.
