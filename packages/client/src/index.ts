import fs from "fs";
import path from "path";
import { Command } from "commander";
import { uploadMigration, listMigrations } from "./grpc-client";

const program = new Command();

program
  .name("grpc-migrate")
  .description("Cliente CLI para aplicar migrations via gRPC")
  .version("1.0.0");

program
  .command("upload <dir>")
  .description("Envia todos os arquivos .sql de um diretório para o coordinator")
  .action(async (dir: string) => {
    const absDir = path.resolve(dir);

    if (!fs.existsSync(absDir)) {
      console.error(`Diretório não encontrado: ${absDir}`);
      process.exit(1);
    }

    const files = fs
      .readdirSync(absDir)
      .filter((f) => f.endsWith(".sql"))
      .sort(); // ordem alfabética garante sequência

    if (files.length === 0) {
      console.log("Nenhum arquivo .sql encontrado.");
      return;
    }

    console.log(`\nEnviando ${files.length} migration(s) para o coordinator...\n`);

    for (const file of files) {
      const filePath = path.join(absDir, file);
      const content = fs.readFileSync(filePath);
      // migration_id = nome sem extensão (ex: "001_create_users")
      const migrationId = path.basename(file, ".sql");

      process.stdout.write(`  → ${file} ... `);

      try {
        const result = await uploadMigration(migrationId, file, content);
        if (result.success) {
          console.log("✓ OK");
        } else {
          console.log(`✗ FALHOU: ${result.message}`);
        }

        for (const w of result.workers ?? []) {
          const icon = w.success ? "    ✓" : "    ✗";
          console.log(`${icon} [${w.worker_address}] ${w.message}`);
        }
      } catch (err: any) {
        console.log(`✗ ERRO: ${err.message}`);
      }

      console.log();
    }
  });

program
  .command("list")
  .description("Lista as migrations já aplicadas no coordinator")
  .action(async () => {
    try {
      const result = await listMigrations();
      const entries = result.entries ?? [];

      if (entries.length === 0) {
        console.log("Nenhuma migration aplicada.");
        return;
      }

      console.log("\nMigrations aplicadas:\n");
      console.log(
        "  " +
          "ID".padEnd(35) +
          "Arquivo".padEnd(40) +
          "Aplicada em"
      );
      console.log("  " + "-".repeat(90));

      for (const entry of entries) {
        console.log(
          "  " +
            entry.migration_id.padEnd(35) +
            entry.filename.padEnd(40) +
            entry.applied_at
        );
      }

      console.log();
    } catch (err: any) {
      console.error(`Erro ao listar migrations: ${err.message}`);
      process.exit(1);
    }
  });

program.parse(process.argv);
