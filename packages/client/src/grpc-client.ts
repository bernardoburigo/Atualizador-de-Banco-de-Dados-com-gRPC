import * as grpc from "@grpc/grpc-js";
import {
  migrationProto,
  type CoordinatorClient,
  type MigrationChunk,
  type MigrationResult,
  type MigrationList,
  type Empty,
} from "@grpc-migrations/shared";

const CHUNK_SIZE = 64 * 1024; // 64 KB

function getCoordinatorAddress(): string {
  return process.env.COORDINATOR_URL ?? "localhost:50051";
}

function createClient(): CoordinatorClient {
  return new migrationProto.migration.CoordinatorService(
    getCoordinatorAddress(),
    grpc.credentials.createInsecure()
  ) as unknown as CoordinatorClient;
}

export async function uploadMigration(
  migrationId: string,
  filename: string,
  content: Buffer
): Promise<MigrationResult> {
  return new Promise((resolve, reject) => {
    const client = createClient();

    const call = (client as any).uploadMigration(
      (err: grpc.ServiceError | null, result: MigrationResult) => {
        client.close();
        if (err) return reject(err);
        resolve(result);
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

    if (content.length === 0) {
      call.write({ migration_id: migrationId, filename, content: Buffer.alloc(0), is_last: true });
    }

    call.end();
  });
}

export async function listMigrations(): Promise<MigrationList> {
  return new Promise((resolve, reject) => {
    const client = createClient();
    const empty: Empty = {};

    (client as any).listMigrations(
      empty,
      (err: grpc.ServiceError | null, result: MigrationList) => {
        client.close();
        if (err) return reject(err);
        resolve(result);
      }
    );
  });
}
