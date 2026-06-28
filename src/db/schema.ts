import { pgTable, serial, text, boolean, integer, timestamp } from 'drizzle-orm/pg-core';

export const invitados = pgTable('invitados', {
  id: serial('id').primaryKey(),
  apodos: text('apodos').array().notNull(), 
  nombre: text('nombre').notNull(),
  confirmado: boolean('confirmado').default(false),
  ip: text('ip'),
});

export const muro = pgTable('muro', {
  id: serial('id').primaryKey(),
  invitadoId: integer('invitado_id').references(() => invitados.id).notNull(),
  mensaje: text('mensaje').notNull(),
  fotoUrl: text('foto_url'),
  creadoEn: timestamp('creado_en').defaultNow().notNull(),
});

export const chatGeneral = pgTable('chat_general', {
  id: serial('id').primaryKey(),
  invitadoId: integer('invitado_id').references(() => invitados.id).notNull(),
  mensaje: text('mensaje').notNull(),
  creadoEn: timestamp('creado_en').defaultNow().notNull(),
});
