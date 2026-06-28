import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { invitados } from './schema';
import * as dotenv from 'dotenv';

// Cargamos las variables de entorno desde el archivo .env.local
dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  throw new Error('❌ DATABASE_URL no encontrada en .env.local');
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

const listaInvitados = [
  { nombre: 'nandogol', apodos: ['nandogol', 'toto', 'nandogei', 'eltotololero', 'eltoto', 'negroide', 'negro', 'nero', 'nando4k'] },
  { nombre: 'noemo', apodos: ['noemo', 'notrolmi', 'mongolmi', 'naoma', 'mongolmitonota', 'nao'] },
  { nombre: 'pipo', apodos: ['bruno', 'pipardo', 'pipo', 'eltejex', 'perruno', 'perro'] },
  { nombre: 'mono', apodos: ['mono', 'monito', 'monex', 'turnitin', 'lulu', 'luchamo', 'platanito', 'platanito4k', 'platanitooutler'] },
  { nombre: 'elcar', apodos: ['elcar', 'car', 'joaco', 'joaquin', 'mauricio'] },
  { nombre: 'mapache', apodos: ['mapache', 'laavioneta', 'mapachin', 'machepa', 'tuesta'] },
  { nombre: 'manguito', apodos: ['manguito', 'mango'] },
  { nombre: 'manu', apodos: ['gordito', 'manu', 'barbaromanuel', 'manuelito', 'manute'] },
  { nombre: 'tiobabu', apodos: ['sebitashishigang', 'tiobabu', 'flowers', 'flores', 'sebastian', 'chiquiflow', 'tutiobadbunny', 'tiobadbu'] },
  { nombre: 'china', apodos: ['china', 'da', 'danicka'] },
  { nombre: 'yuda', apodos: ['yudith', 'yuda', 'yudiña'] },
  { nombre: 'mariana', apodos: ['mari', 'mara', 'mariana', 'marimar'] },
  { nombre: 'alvaro', apodos: ['outis', 'alvaro', 'alvar0', 'maceta', 'maceton', 'macetini'] },
  { nombre: 'ivan', apodos: ['reinbolt', 'ivan', 'pancho', 'panchito'] },
  { nombre: 'mezzza', apodos: ['meza', 'jean', 'penny', 'pennywise', 'mezzza', 'jeanmarco', 'maco'] },
  { nombre: 'marjory', apodos: ['muda', 'marjo', 'marjory'] },
  { nombre: 'guillen', apodos: ['toro', 'torito', 'kchudo', 'guillen', 'adrian', 'toromax', 'toromalo', 'torobad'] },
  { nombre: 'michael', apodos: ['michael', 'maicol', 'pisao', 'pisado'] }
];

async function main() {
  console.log('⏳ Insertando la lista VIP de invitados en Neon...');
  
  try {
    for (const invitado of listaInvitados) {
      await db.insert(invitados).values({
        nombre: invitado.nombre,
        // Guardamos todo en minúsculas por seguridad
        apodos: invitado.apodos.map(apodo => apodo.toLowerCase().trim()),
        pases: 1, // Por defecto 1 pase, lo puedes editar luego
        confirmado: false
      });
    }
    console.log('✅ ¡Lista guardada con éxito en tu base de datos!');
  } catch (error) {
    console.error('❌ Error al insertar invitados:', error);
  }
}

main();
