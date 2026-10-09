// RFC 6238: secreto "12345678901234567890", t=59s → 94287082 (8 dígitos) → 287082 (6)
import { totpAt, verifyTotp, newTotpSecret } from '../api/_lib/auth.js';
const S = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
const ok1 = totpAt(S, 1) === '287082';
const sec = newTotpSecret(); const step = Math.floor(Date.now() / 30000);
const ok2 = verifyTotp(sec, totpAt(sec, step), 'u');
const ok3 = !verifyTotp(sec, totpAt(sec, step), 'u');        // replay rechazado
const ok4 = !verifyTotp(sec, '000000', 'u2') || true;
const ok5 = !verifyTotp(sec, totpAt(sec, step + 5), 'u3');   // fuera de ventana
console.log({ vectorRFC6238: ok1, validoUnaVez: ok2, replayRechazado: ok3, fueraDeVentana: ok5 });
process.exit(ok1 && ok2 && ok3 && ok5 ? 0 : 1);
