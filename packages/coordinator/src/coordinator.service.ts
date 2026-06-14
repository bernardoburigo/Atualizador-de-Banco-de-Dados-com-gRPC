import * as grpc from "@grpc/grpc-js";
import type {
  CoordinatorServiceServer,
  MigrationChunk,
  MigrationResult,
  MigrationList,
  Empty,
} from "@grpc-migrations/shared";
import { sendMigrationToWorker, listMigrationsFromWorker } from "./worker-client";

function getWorkerAddresses(): string[] {
  const raw = process.env.WORKER_URLS ?? "localhost:50052";
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export const coordinatorServiceImpl: CoordinatorServiceServer = {
  uploadMigration(
    call: grpc.ServerReadableStream<MigrationChunk, MigrationResult>,
    callback: grpc.sendUnaryData<MigrationResult>
  ) {
    const chunks: Buffer[] = [];
    let migrationId = "";
    let filename = "";

    call.on("data", (chunk: MigrationChunk) => {
      migrationId = chunk.migration_id;
      filename = chunk.filename;
      if (chunk.content && chunk.content.length > 0) {
        chunks.push(Buffer.from(chunk.content));
      }
    });

    call.on("end", async () => {
      const content = Buffer.concat(chunks);
      const workerAddresses = getWorkerAddresses();

      console.log(
        `[coordinator] Recebida migration '${filename}' (${content.length} bytes). Distribuindo para ${workerAddresses.length} worker(s)...`
      );

      const results = await Promise.all(
        workerAddresses.map((addr) =>
          sendMigrationToWorker(addr, migrationId, filename, content)
        )
      );

      const allSuccess = results.every((r) => r.success);
      const summary = results
        .map((r) => `  ${r.worker_address}: ${r.success ? "OK" : "ERRO"} — ${r.message}`)
        .join("\n");

      console.log(`[coordinator] Resultado:\n${summary}`);

      callback(null, {
        success: allSuccess,
        message: allSuccess
          ? "Migration aplicada em todos os workers."
          : "Um ou mais workers falharam.",
        workers: results,
      });
    });

    call.on("error", (err) => {
      callback(null, { success: false, message: err.message, workers: [] });
    });
  },

  async listMigrations(
    _call: grpc.ServerUnaryCall<Empty, MigrationList>,
    callback: grpc.sendUnaryData<MigrationList>
  ) {
    const workerAddresses = getWorkerAddresses();

    const workerResults = await Promise.all(
      workerAddresses.map((addr) => listMigrationsFromWorker(addr))
    );

    // Usa o primeiro worker como fonte de verdade para a lista
    const entries = workerResults[0]?.entries ?? [];
    callback(null, { entries });
  },
};
