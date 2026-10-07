// Lista los videos de una carpeta de Drive con subcarpetas (una por reel/escena del rodaje).
// Por qué existe: el conector de Google Drive NO lista el contenido de carpetas compartidas por otra cuenta.
// Cómo: abrir la carpeta raíz del rodaje en el navegador integrado (sesión iniciada con acceso) y correr
// este código con la herramienta javascript del navegador. Devuelve JSON para scripts/index_clips.py.
(async () => {
  const ids = [...new Set([...document.querySelectorAll("[data-id]")].map((e) => e.getAttribute("data-id")))]
    .filter((id) => /^[A-Za-z0-9_-]{25,44}$/.test(id) && !location.pathname.includes(id));
  const out = {};
  for (const id of ids) {
    const h = await (await fetch("/drive/folders/" + id)).text();
    const title = ((h.match(/<title>(.*?)<\/title>/) || [])[1] || id).replace(/ - Google Drive$/, "");
    const files = [...h.matchAll(/\\x22([A-Za-z0-9_-]{25,44})\\x22,\\x5b\\x22[A-Za-z0-9_-]{25,44}\\x22\\x5d,\\x22(.*?)\\x22,\\x22(.*?)\\x22/g)]
      .map((x) => ({ id: x[1], name: x[2], mime: x[3].replace(/\\\//g, "/") }))
      .filter((f) => f.mime.startsWith("video/"));
    if (files.length) out[title] = files;
  }
  return out; // { "REEL 1, ARMADO DE RAMEN": [{id, name, mime}, …], … }
})();
