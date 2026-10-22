// Firma «ad hoc» la app antes de armar el .dmg. Sin una cuenta de Apple Developer no hay firma de verdad, pero una Mac con
// chip de Apple no abre una app que no tenga ninguna: con esta, la primera vez se abre con clic derecho › Abrir.
const { execFileSync } = require('node:child_process');
const path = require('node:path');

exports.default = async function firmar(ctx) {
  if (ctx.electronPlatformName !== 'darwin') return;
  const app = path.join(ctx.appOutDir, `${ctx.packager.appInfo.productFilename}.app`);
  execFileSync('codesign', ['--force', '--deep', '--sign', '-', app], { stdio: 'inherit' });
};
