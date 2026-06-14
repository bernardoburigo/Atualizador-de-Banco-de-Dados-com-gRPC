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
# Terminal 4 — enviar todos os .sql do diretório migrations/
sh scripts/run.sh client upload ./migrations

# Listar migrations aplicadas
sh scripts/run.sh client list
```

## Comportamento esperado

```
Enviando 3 migration(s) para o coordinator...

  → 001_create_users.sql ... ✓ OK
    ✓ [localhost:50052] Migration '001_create_users.sql' aplicada com sucesso.
    ✓ [localhost:50053] Migration '001_create_users.sql' aplicada com sucesso.
  ...

Migrations aplicadas:
  ID                    Arquivo                  Aplicada em
  001_create_users      001_create_users.sql     2026-06-14T20:13:47.395Z
  ...
```

## Idempotência

Reaplicar as mesmas migrations é bloqueado pelos workers (tabela `_migrations` no SQLite de cada worker).