# Demo editable del OS

Los registros marcados **DEMO** son sintéticos. La base local `.vision-demo-db` está ignorada por Git y no se conecta a producción. El seeder conserva los cambios ya hechos en esa base.

```sh
cd ceo-os
node scripts/seed-vision-demo.mjs
PORT=3004 LOCAL_DB="$PWD/.vision-demo-db" npm run dev
```

Abrir `http://localhost:3004/#/home` e iniciar sesión en `/api/auth/dev` si aparece el login. Hay ejemplos editables en Clientes (AKAI, Cerantola y NAO), Proyectos y Tareas, Finanzas, Consulting → Diagnóstico de crecimiento y Chat → carpeta AKAI · DEMO. La conversación de Chat es ficticia; para enviar mensajes hace falta conectar el servidor de modelos.

Comprobación manual en navegador, modo claro: se editaron y recargaron cliente, movimiento financiero, tarea, diagnóstico e instrucciones de carpeta; todos persistieron. Se revisaron capturas a 1440 y 390 px sin errores de consola ni desborde horizontal.
