# Isla React Flow

Solo se carga al montar `VisualCanvas`; no forma parte del arranque del OS. Fuente: `probes/vision-libraries/src/os-flow.jsx`. Reconstruir desde `ceo-os`: `npm ci --prefix probes/vision-libraries --ignore-scripts && node scripts/build-vision-flow.mjs`. Dependencias fijadas en el lock del probe A2. React Flow 12.12.1 y React/React DOM 19.3.1, MIT. Las licencias se conservan en `LICENSES.txt`.

El adaptador recibe ids, etiquetas y dependencias; devuelve selección y cambios de posición. Los callbacks no conceden permisos ni guardan datos automáticamente. Si falla la carga, la lista accesible conserva los datos. Sin Recharts ni servicios externos.
