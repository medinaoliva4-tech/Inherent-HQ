// Solo desarrollo: imprime el código 2FA actual de los usuarios de prueba.
import { totpAt } from '../api/_lib/auth.js';
console.log(totpAt('JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP', Math.floor(Date.now() / 30000)));
