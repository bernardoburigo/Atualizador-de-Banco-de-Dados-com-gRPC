import * as grpc from "@grpc/grpc-js";
import { migrationProto } from "@grpc-migrations/shared";
import { coordinatorServiceImpl } from "./coordinator.service";

const PORT = process.env.COORDINATOR_PORT ?? "50051";
const ADDRESS = `0.0.0.0:${PORT}`;

// Encerra o processo quando o terminal for fechado (SIGHUP)
process.on("SIGHUP", () => process.exit(0));

const server = new grpc.Server();

server.addService(
  migrationProto.migration.CoordinatorService.service,
  coordinatorServiceImpl as grpc.UntypedServiceImplementation
);

server.bindAsync(ADDRESS, grpc.ServerCredentials.createInsecure(), (err, port) => {
  if (err) {
    console.error(`[coordinator] Falha ao iniciar servidor: ${err.message}`);
    process.exit(1);
  }
  const workers = process.env.WORKER_URLS ?? "localhost:50052";
  console.log(`[coordinator] Coordinator gRPC ouvindo em 0.0.0.0:${port}`);
  console.log(`[coordinator] Workers configurados: ${workers}`);
});
