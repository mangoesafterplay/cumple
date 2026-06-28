'use server';

import { put } from '@vercel/blob';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { invitados, muro, chatGeneral } from '@/db/schema';
import { eq, sql as drizzleSql, desc } from 'drizzle-orm';
import { cookies, headers } from 'next/headers';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

// Helper para obtener la IP del usuario
async function obtenerUserIP() {
  const headerList = await headers();
  const forwardedFor = headerList.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return '127.0.0.1'; // Localhost fallback
}

// 1. Obtener sesión activa (Para saltar la landing)
export async function obtenerSesionActiva() {
  // --- COOKIES DESACTIVADAS MOMENTÁNEAMENTE ---
  // const cookieStore = await cookies();
  // const token = cookieStore.get('invitado_id')?.value;
  
  const userIp = await obtenerUserIP();

  // Primero verificar por Cookie (Comentado)
  // if (token) {
  //   const usuario = await db.select().from(invitados).where(eq(invitados.id, parseInt(token)));
  //   if (usuario.length > 0) return usuario[0];
  // }

  // Si quieres que tampoco te salte por IP mientras testeas, puedes comentar este bloque completo:
  if (userIp && userIp !== '127.0.0.1') {
    const usuarioPorIp = await db.select().from(invitados).where(eq(invitados.ip, userIp));
    if (usuarioPorIp.length > 0) {
      // cookieStore.set('invitado_id', usuarioPorIp[0].id.toString(), { maxAge: 60 * 60 * 24 * 30 });
      return usuarioPorIp[0];
    }
  }

  return null;
}

// 2. Validar Apodo (Soporta múltiples alias y guarda sesión/IP)
export async function verificarApodo(apodoForm: string) {
  const apodoLimpio = apodoForm.trim().toLowerCase();
  const userIp = await obtenerUserIP();

  // Consulta usando SQL nativo embebido en Drizzle para buscar dentro del Array de Postgres
  const resultado = await db.select().from(invitados).where(
    drizzleSql`${invitados.apodos} @> ARRAY[${apodoLimpio}]::text[]`
  );

  if (resultado.length > 0) {
    const usuario = resultado[0];

    // Actualizamos el registro con su IP para bloquear accesos duplicados
    await db.update(invitados).set({ ip: userIp }).where(eq(invitados.id, usuario.id));

    // --- COOKIES DESACTIVADAS MOMENTÁNEAMENTE ---
    // const cookieStore = await cookies();
    // cookieStore.set('invitado_id', usuario.id.toString(), { maxAge: 60 * 60 * 24 * 30 });

    return { success: true, usuario };
  }

  return { success: false, error: 'Algo salió mal (zafa nomas kchao)' };
}

// 3. Confirmar Asistencia
export async function confirmarAsistencia(id: number, asiste: boolean) {
  await db.update(invitados).set({ confirmado: asiste }).where(eq(invitados.id, id));
  return { success: true };
}

// 4. Agregar Post al Muro
export async function publicarEnMuro(invitadoId: number, mensajeTexto: string, fotoUrl?: string) {
  await db.insert(muro).values({
    invitadoId,
    mensaje: mensajeTexto,
    fotoUrl: fotoUrl || null,
  });
  return { success: true };
}

// 5. Enviar mensaje al Chat General
export async function enviarMensajeChat(invitadoId: number, mensajeTexto: string) {
  await db.insert(chatGeneral).values({
    invitadoId,
    mensaje: mensajeTexto,
  });
  return { success: true };
}

// 6. Traer todos los posts del muro ordenados por fecha
export async function obtenerPostsMuro() {
  const resultado = await db.select({
    id: muro.id,
    mensaje: muro.mensaje,
    fotoUrl: muro.fotoUrl,
    creadoEn: muro.creadoEn,
    nombre: invitados.nombre
  })
  .from(muro)
  .leftJoin(invitados, eq(muro.invitadoId, invitados.id))
  .orderBy(desc(muro.creadoEn));

  return resultado;
}

// 7. Traer los últimos 50 mensajes del chat general
export async function obtenerMensajesChat() {
  const resultado = await db.select({
    id: chatGeneral.id,
    mensaje: chatGeneral.mensaje,
    creadoEn: chatGeneral.creadoEn,
    nombre: invitados.nombre
  })
  .from(chatGeneral)
  .leftJoin(invitados, eq(chatGeneral.invitadoId, invitados.id))
  .orderBy(chatGeneral.creadoEn); // En orden cronológico para el chat

  return resultado;
}

export async function subirFotoMuro(formData: FormData) {
  const file = formData.get('file') as File;
  if (!file) return null;

  // El método 'put' lee automáticamente tu BLOB_READ_WRITE_TOKEN en Vercel
  const blob = await put(file.name, file, {
    access: 'public',
  });

  return blob.url; // Retorna la URL final de la imagen
}
