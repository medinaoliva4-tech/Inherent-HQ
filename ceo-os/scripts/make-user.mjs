// Uso: node scripts/make-user.mjs <usuario> <rol: ceo|coo|team> "<Nombre>" "<contraseña de 12+>"
// Imprime el objeto para AUTH_USERS y el enlace para el autenticador (Google Authenticator, 1Password, Authy…).
import { hashPassword, newTotpSecret } from '../api/_lib/auth.js';
const [user, role, name, pw] = process.argv.slice(2);
if (!user || !['ceo', 'coo', 'team'].includes(role) || !name || !pw || pw.length < 12) {
  console.error('Uso: node scripts/make-user.mjs <usuario> <ceo|coo|team> "<Nombre>" "<contraseña de 12+ caracteres>"');
  process.exit(1);
}
const totp = newTotpSecret();
console.log('\n1) Agrega este objeto al arreglo AUTH_USERS (Vercel → Environment Variables):\n');
console.log(JSON.stringify({ user: user.toLowerCase(), role, name, hash: hashPassword(pw), totp }));
console.log('\n2) La persona agrega el 2FA en su app de autenticación con esta clave (entrada manual) o con el enlace:\n');
console.log('   Clave:  ' + totp);
console.log(`   Enlace: otpauth://totp/CEO%20OS:${encodeURIComponent(user)}?secret=${totp}&issuer=CEO%20OS\n`);
console.log('⚠️  No guardes ni compartas esto por chat. La clave 2FA solo se muestra ahora.\n');
