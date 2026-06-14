import type * as grpc from "@grpc/grpc-js";

// ─── Mensagens ───────────────────────────────────────────────

export interface MigrationChunk {
  migration_id: string;
  filename: string;
  content: Buffer;
  is_last: boolean;
}

export interface MigrationResult {
  success: boolean;
  message: string;
  workers: WorkerResult[];
}

export interface WorkerResult {
  worker_address: string;
  success: boolean;
  message: string;
}

export interface ApplyResult {
  success: boolean;
  message: string;
}

export interface MigrationEntry {
  migration_id: string;
  filename: string;
  applied_at: string;
}

export interface MigrationList {
  entries: MigrationEntry[];
}

export interface Empty {}

// ─── Definições de serviço gRPC ──────────────────────────────

export interface CoordinatorServiceServer extends grpc.UntypedServiceImplementation {
  uploadMigration: grpc.handleClientStreamingCall<MigrationChunk, MigrationResult>;
  listMigrations: grpc.handleUnaryCall<Empty, MigrationList>;
}

export interface WorkerServiceServer extends grpc.UntypedServiceImplementation {
  applyMigration: grpc.handleClientStreamingCall<MigrationChunk, ApplyResult>;
  listMigrations: grpc.handleUnaryCall<Empty, MigrationList>;
}

// ─── Tipos de cliente gRPC ───────────────────────────────────

export type CoordinatorClient = {
  uploadMigration(
    callback: (err: grpc.ServiceError | null, res: MigrationResult) => void
  ): grpc.ClientWritableStream<MigrationChunk>;
  listMigrations(
    request: Empty,
    callback: (err: grpc.ServiceError | null, res: MigrationList) => void
  ): void;
} & grpc.Client;

export type WorkerClient = {
  applyMigration(
    callback: (err: grpc.ServiceError | null, res: ApplyResult) => void
  ): grpc.ClientWritableStream<MigrationChunk>;
  listMigrations(
    request: Empty,
    callback: (err: grpc.ServiceError | null, res: MigrationList) => void
  ): void;
} & grpc.Client;
