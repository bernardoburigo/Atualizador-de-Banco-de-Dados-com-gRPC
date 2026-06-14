import * as grpc from "@grpc/grpc-js";
import { migrationProto } from "@grpc-migrations/shared";
import { workerServiceImpl } from "./worker.service";

const PORT = process.env.WORKER_PORT ?? "50052";
const WORKER_ID = process.env.WORKER_ID ?? "worker-default";
const ADDRESS = `0.0.0.0:${PORT}`;

// Encerra o processo quando o terminal for fechado (SIGHUP)
process.on("SIGHUP", () => process.exit(0));

const server = new grpc.Server();

server.addService(
  migrationProto.migration.WorkerService.service,
  workerServiceImpl as grpc.UntypedServiceImplementation
);

server.bindAsync(ADDRESS, grpc.ServerCredentials.createInsecure(), (err, port) => {
  if (err) {
    console.error(`[${WORKER_ID}] Falha ao iniciar servidor: ${err.message}`);
    process.exit(1);
  }
  console.log(`[${WORKER_ID}] Worker gRPC ouvindo em 0.0.0.0:${port}`);
});
