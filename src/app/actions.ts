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
  const userIp = await obtenerUserIP();

  if (userIp && userIp !== '127.0.0.1') {
    const usuarioPorIp = await db.select().from(invitados).where(eq(invitados.ip, userIp));
    if (usuarioPorIp.length > 0) {
      return usuarioPorIp[0];
    }
  }
  return null;
}

// 2. Validar Apodo
export async function verificarApodo(apodoForm: string) {
  const apodoLimpio = apodoForm.trim().toLowerCase();
  const userIp = await obtenerUserIP();

  const resultado = await db.select().from(invitados).where(
    drizzleSql`${invitados.apodos} @> ARRAY[${apodoLimpio}]::text[]`
  );

  if (resultado.length > 0) {
    const usuario = resultado[0];
    await db.update(invitados).set({ ip: userIp }).where(eq(invitados.id, usuario.id));
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
  .orderBy(chatGeneral.creadoEn);

  return resultado;
}

// 8. Subida directa adaptada para Server Actions planos
export async function subirFotoMuro(formData: FormData) {
  const file = formData.get('file') as File;
  if (!file || file.size === 0) return null;

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Forzamos el uso del token del sistema
    const tokenBlob = process.env.BLOB_READ_WRITE_TOKEN;
    
    if (!tokenBlob) {
      console.error("❌ ERROR: El BLOB_READ_WRITE_TOKEN no está definido en las variables de entorno.");
      return null;
    }

    // Ejecutamos la subida estructurando el nombre para evitar colisiones
    const blob = await put(`muro/${Date.now()}-${file.name}`, buffer, {
      access: 'public',
      contentType: file.type,
      token: tokenBlob,
    });

    if (!blob || !blob.url) {
      console.error("❌ Vercel Blob no devolvió una URL válida.");
      return null;
    }

    return blob.url;
  } catch (error) {
    // Esto imprimirá el motivo exacto del fallo en los logs de Vercel (ej: límites de tamaño o credenciales)
    console.error("❌ ERROR CRÍTICO DETECTADO EN EL PROCESO DE VERCEL BLOB:", error);
    return null;
  }
}