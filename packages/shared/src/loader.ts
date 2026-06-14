import path from "path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

// Quando bundled pelo esbuild, __dirname aponta para dist/; quando executado via tsx, fica em packages/shared/src/
// O proto está sempre em <raiz>/proto/migration.proto
const PROTO_PATH = path.resolve(
  __dirname,
  __dirname.endsWith("dist") ? "../proto/migration.proto" : "../../../proto/migration.proto"
);

const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const proto = grpc.loadPackageDefinition(packageDef) as any;

export const migrationProto: {
  migration: {
    CoordinatorService: grpc.ServiceClientConstructor;
    WorkerService: grpc.ServiceClientConstructor;
  };
} = proto;
