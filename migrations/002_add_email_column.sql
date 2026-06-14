-- Migration 002: Adiciona coluna de email na tabela users
ALTER TABLE users ADD COLUMN email TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON users(email);
