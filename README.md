# gRPC Migration Runner

Sistema distribuído de aplicação de migrations SQL usando gRPC (Node.js / TypeScript).

### Fluxo
1. O **Client** lê arquivos `.sql` de um diretório e envia cada um ao Coordinator via **client-streaming RPC**.
2. O **Coordinator** recebe o arquivo em chunks e distribui a todos os workers em paralelo via **client-streaming RPC** (comunicação B2B).
3. Cada **Worker** reconstrói o arquivo, verifica idempotência, aplica o SQL no SQLite local e responde.
4. O Coordinator agrega os resultados e retorna ao Client.

## Como executar

### 1. Instalar dependências e compilar

```bash
# Instalar dependências (primeira vez)
npm install

# Compilar TypeScript → JavaScript
sh scripts/build.sh
```

### 2. Iniciar os Workers (dois terminais separados)

```bash
# Terminal 2
WORKER_PORT=50052 WORKER_ID=worker-1 sh scripts/run.sh worker

# Terminal 3
WORKER_PORT=50053 WORKER_ID=worker-2 sh scripts/run.sh worker
```

### 3. Iniciar o Coordinator

```bash
# Terminal 1
WORKER_URLS=localhost:50052,localhost:50053 sh scripts/run.sh coordinator
```

### 4. Aplicar migrations

```bash
# Criar estrutura (tabelas users e products)
sh scripts/run.sh client upload ./migrations --only 001,002,003

# Popular com dados mock
sh scripts/run.sh client upload ./migrations --only 004,005

# Reverter tudo (apaga tabelas, dados e histórico — mantém só o registro do reset)
sh scripts/run.sh client upload ./migrations --only 006

# Listar migrations aplicadas
sh scripts/run.sh client list
```

> A opção `--only` filtra por prefixo de nome de arquivo e aceita múltiplos valores separados por vírgula.

## Migrations disponíveis

| Arquivo | O que faz |
|---|---|
| `001_create_users.sql` | Cria a tabela `users` |
| `002_add_email_column.sql` | Adiciona coluna `email` e índice único em `users` |
| `003_create_products.sql` | Cria a tabela `products` |
| `004_populate_users.sql` | Insere 5 usuários mock em `users` |
| `005_populate_products.sql` | Insere 5 produtos mock em `products` |
| `006_fresh_reset.sql` | Reverte tudo: apaga tabelas, dados e limpa o histórico em `_migrations` (mantém apenas o registro da própria 006) |


## Comportamento esperado

```
Enviando 6 migration(s) para o coordinator...

  → 001_create_users.sql ... ✓ OK
    ✓ [localhost:50052] Migration '001_create_users.sql' aplicada com sucesso.
    ✓ [localhost:50053] Migration '001_create_users.sql' aplicada com sucesso.
  ...
  → 006_fresh_reset.sql ... ✓ OK
    ✓ [localhost:50052] Migration '006_fresh_reset.sql' aplicada com sucesso.
    ✓ [localhost:50053] Migration '006_fresh_reset.sql' aplicada com sucesso.
```

## Idempotência

Reaplicar as mesmas migrations é bloqueado pelos workers (tabela `_migrations` no SQLite de cada worker).