// Uso: node scripts/hash-password.mjs "tu-password"
// Imprime el hash para pegarlo en la variable AUTH_USERS de Vercel.
import { hashPassword } from '../api/_lib/auth.js';
const pw = process.argv[2];
if (!pw || pw.length < 10) {
  console.error('Uso: node scripts/hash-password.mjs "<password de 10+ caracteres>"');
  process.exit(1);
}
console.log(hashPassword(pw));
