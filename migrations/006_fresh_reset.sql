-- Migration 006: Reverte todas as migrations anteriores e limpa o histórico.
-- O worker insere o registro desta migration em _migrations APÓS executar este SQL,
-- portanto ao final apenas '006_fresh_reset' permanece no histórico.

-- Remove índice criado pela migration 002 (IF EXISTS: seguro se 002 não rodou)
DROP INDEX IF EXISTS users_email_idx;

-- Remove tabelas criadas pelas migrations 001 e 003 (IF EXISTS: seguro se não existirem)
-- O DROP já apaga os dados, tornando DELETE separado desnecessário
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;

-- Limpa todo o histórico de migrations (o registro da 006 será inserido pelo worker logo após)
DELETE FROM _migrations;
