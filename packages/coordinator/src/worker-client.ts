import * as grpc from "@grpc/grpc-js";
import {
  migrationProto,
  type WorkerClient,
  type MigrationChunk,
  type ApplyResult,
  type MigrationList,
  type Empty,
  type WorkerResult,
} from "@grpc-migrations/shared";

const CHUNK_SIZE = 64 * 1024; // 64 KB

function createWorkerClient(address: string): WorkerClient {
  return new migrationProto.migration.WorkerService(
    address,
    grpc.credentials.createInsecure()
  ) as unknown as WorkerClient;
}

export async function sendMigrationToWorker(
  workerAddress: string,
  migrationId: string,
  filename: string,
  content: Buffer
): Promise<WorkerResult> {
  return new Promise((resolve) => {
    const client = createWorkerClient(workerAddress);

    const call = (client as any).applyMigration(
      (err: grpc.ServiceError | null, result: ApplyResult) => {
        client.close();
        if (err) {
          resolve({ worker_address: workerAddress, success: false, message: err.message });
          return;
        }
        resolve({ worker_address: workerAddress, success: result.success, message: result.message });
      }
    );

    // Envia o conteúdo em chunks de 64 KB
    let offset = 0;
    while (offset < content.length) {
      const end = Math.min(offset + CHUNK_SIZE, content.length);
      const chunk: MigrationChunk = {
        migration_id: migrationId,
        filename,
        content: content.slice(offset, end),
        is_last: end === content.length,
      };
      call.write(chunk);
      offset = end;
    }

    // Arquivo vazio: envia chunk vazio com is_last=true
    if (content.length === 0) {
      call.write({ migration_id: migrationId, filename, content: Buffer.alloc(0), is_last: true });
    }

    call.end();
  });
}

export async function listMigrationsFromWorker(
  workerAddress: string
): Promise<{ address: string; entries: MigrationList["entries"] }> {
  return new Promise((resolve) => {
    const client = createWorkerClient(workerAddress);
    const empty: Empty = {};

    (client as any).listMigrations(
      empty,
      (err: grpc.ServiceError | null, result: MigrationList) => {
        client.close();
        if (err) {
          resolve({ address: workerAddress, entries: [] });
          return;
        }
        resolve({ address: workerAddress, entries: result.entries ?? [] });
      }
    );
  });
}
