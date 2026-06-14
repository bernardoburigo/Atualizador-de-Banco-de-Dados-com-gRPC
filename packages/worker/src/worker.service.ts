import * as grpc from "@grpc/grpc-js";
import type {
  WorkerServiceServer,
  MigrationChunk,
  ApplyResult,
  MigrationList,
  Empty,
} from "@grpc-migrations/shared";
import { applyMigration, isMigrationApplied, listAppliedMigrations } from "./db";

export const workerServiceImpl: WorkerServiceServer = {
  applyMigration(
    call: grpc.ServerReadableStream<MigrationChunk, ApplyResult>,
    callback: grpc.sendUnaryData<ApplyResult>
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

    call.on("end", () => {
      try {
        if (isMigrationApplied(migrationId)) {
          callback(null, {
            success: false,
            message: `Migration '${migrationId}' já foi aplicada anteriormente.`,
          });
          return;
        }

        const sql = Buffer.concat(chunks).toString("utf8");
        applyMigration(migrationId, filename, sql);

        callback(null, {
          success: true,
          message: `Migration '${filename}' aplicada com sucesso.`,
        });
      } catch (err: any) {
        callback(null, {
          success: false,
          message: `Erro ao aplicar migration: ${err.message}`,
        });
      }
    });

    call.on("error", (err) => {
      callback(null, { success: false, message: err.message });
    });
  },

  listMigrations(
    _call: grpc.ServerUnaryCall<Empty, MigrationList>,
    callback: grpc.sendUnaryData<MigrationList>
  ) {
    const entries = listAppliedMigrations();
    callback(null, { entries });
  },
};
