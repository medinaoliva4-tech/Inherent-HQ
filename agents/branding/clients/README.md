# Clientes — Branding

**Un cliente = una carpeta.** Nunca se mezclan archivos de dos clientes.

```
clients/<cliente>/
├── _INPUTS/                    # assets crudos, manual viejo, capturas del feed, referencias
├── auditoria-de-marca.md       # B1
├── plataforma-de-marca.md      # B2  🚦
├── tono-de-voz.md              # B3
├── direccion-visual.md         # B4  🚦
├── sistema-visual.md           # B5
├── aplicaciones-y-reglas.md    # B6
└── brand-guidelines.md         # consolidado  🚦
```

## Antes de crear la carpeta

1. Verificá que exista `agents/strategy/clients/<cliente>/posicionamiento.md` **aprobado**.
   Si no existe → `PROCESS.md` → *Modo degradado*.
2. Buscá material previo en **Google Drive**, **Notion** e **Inherent OS** antes de arrancar de cero.
   Casi siempre hay un manual viejo o un logo en vectores que nadie recordaba.
3. Copiá las plantillas de `../templates/`. No las edites en `templates/`.

## Nombre de la carpeta

Slug en minúsculas, sin tildes ni espacios: `mi-cliente-sa`. **El mismo slug que usa Strategy.**
