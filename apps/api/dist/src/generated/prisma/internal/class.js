"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPrismaClientClass = getPrismaClientClass;
const runtime = __importStar(require("@prisma/client/runtime/client"));
const config = {
    "previewFeatures": [],
    "clientVersion": "7.9.1",
    "engineVersion": "e922089b7d7502aff4249d5da3420f6fa55fc6ad",
    "activeProvider": "sqlite",
    "inlineSchema": "// This is your Prisma schema file,\n// learn more about it in the docs: https://pris.ly/d/prisma-schema\n\ngenerator client {\n  provider = \"prisma-client\"\n  output   = \"../src/generated/prisma\"\n}\n\ndatasource db {\n  provider = \"sqlite\"\n}\n\nmodel User {\n  id        String   @id @default(uuid())\n  email     String   @unique\n  password  String\n  firstName String\n  lastName  String\n  role      String   @default(\"COMMUNITY_HEALTH_WORKER\")\n  isActive  Boolean  @default(true)\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n}\n",
    "runtimeDataModel": {
        "models": {},
        "enums": {},
        "types": {}
    },
    "parameterizationSchema": {
        "strings": [],
        "graph": ""
    }
};
config.runtimeDataModel = JSON.parse("{\"models\":{\"User\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"email\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"password\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"firstName\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"lastName\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"role\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"isActive\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"}],\"dbName\":null}},\"enums\":{},\"types\":{}}");
config.parameterizationSchema = {
    strings: JSON.parse("[\"where\",\"User.findUnique\",\"User.findUniqueOrThrow\",\"orderBy\",\"cursor\",\"User.findFirst\",\"User.findFirstOrThrow\",\"User.findMany\",\"data\",\"User.createOne\",\"User.createMany\",\"User.createManyAndReturn\",\"User.updateOne\",\"User.updateMany\",\"User.updateManyAndReturn\",\"create\",\"update\",\"User.upsertOne\",\"User.deleteOne\",\"User.deleteMany\",\"having\",\"_count\",\"_min\",\"_max\",\"User.groupBy\",\"User.aggregate\",\"AND\",\"OR\",\"NOT\",\"id\",\"email\",\"password\",\"firstName\",\"lastName\",\"role\",\"isActive\",\"createdAt\",\"updatedAt\",\"equals\",\"in\",\"notIn\",\"lt\",\"lte\",\"gt\",\"gte\",\"not\",\"contains\",\"startsWith\",\"endsWith\",\"set\"]"),
    graph: "LgkQDBoAACUAMBsAAAQAEBwAACUAMB0BAAAAAR4BAAAAAR8BACYAISABACYAISEBACYAISIBACYAISMgACcAISRAACgAISVAACgAIQEAAAABACABAAAAAQAgDBoAACUAMBsAAAQAEBwAACUAMB0BACYAIR4BACYAIR8BACYAISABACYAISEBACYAISIBACYAISMgACcAISRAACgAISVAACgAIQADAAAABAAgAwAABQAwBAAAAQAgAwAAAAQAIAMAAAUAMAQAAAEAIAMAAAAEACADAAAFADAEAAABACAJHQEAAAABHgEAAAABHwEAAAABIAEAAAABIQEAAAABIgEAAAABIyAAAAABJEAAAAABJUAAAAABAQgAAAkAIAkdAQAAAAEeAQAAAAEfAQAAAAEgAQAAAAEhAQAAAAEiAQAAAAEjIAAAAAEkQAAAAAElQAAAAAEBCAAACwAwAQgAAAsAMAkdAQAsACEeAQAsACEfAQAsACEgAQAsACEhAQAsACEiAQAsACEjIAAtACEkQAAuACElQAAuACECAAAAAQAgCAAADgAgCR0BACwAIR4BACwAIR8BACwAISABACwAISEBACwAISIBACwAISMgAC0AISRAAC4AISVAAC4AIQIAAAAEACAIAAAQACACAAAABAAgCAAAEAAgAwAAAAEAIA8AAAkAIBAAAA4AIAEAAAABACABAAAABAAgAxUAACkAIBYAACsAIBcAACoAIAwaAAAaADAbAAAXABAcAAAaADAdAQAbACEeAQAbACEfAQAbACEgAQAbACEhAQAbACEiAQAbACEjIAAcACEkQAAdACElQAAdACEDAAAABAAgAwAAFgAwFAAAFwAgAwAAAAQAIAMAAAUAMAQAAAEAIAwaAAAaADAbAAAXABAcAAAaADAdAQAbACEeAQAbACEfAQAbACEgAQAbACEhAQAbACEiAQAbACEjIAAcACEkQAAdACElQAAdACEOFQAAHwAgFgAAJAAgFwAAJAAgJgEAAAABJwEAAAAEKAEAAAAEKQEAAAABKgEAAAABKwEAAAABLAEAAAABLQEAIwAhLgEAAAABLwEAAAABMAEAAAABBRUAAB8AIBYAACIAIBcAACIAICYgAAAAAS0gACEAIQsVAAAfACAWAAAgACAXAAAgACAmQAAAAAEnQAAAAAQoQAAAAAQpQAAAAAEqQAAAAAErQAAAAAEsQAAAAAEtQAAeACELFQAAHwAgFgAAIAAgFwAAIAAgJkAAAAABJ0AAAAAEKEAAAAAEKUAAAAABKkAAAAABK0AAAAABLEAAAAABLUAAHgAhCCYCAAAAAScCAAAABCgCAAAABCkCAAAAASoCAAAAASsCAAAAASwCAAAAAS0CAB8AIQgmQAAAAAEnQAAAAAQoQAAAAAQpQAAAAAEqQAAAAAErQAAAAAEsQAAAAAEtQAAgACEFFQAAHwAgFgAAIgAgFwAAIgAgJiAAAAABLSAAIQAhAiYgAAAAAS0gACIAIQ4VAAAfACAWAAAkACAXAAAkACAmAQAAAAEnAQAAAAQoAQAAAAQpAQAAAAEqAQAAAAErAQAAAAEsAQAAAAEtAQAjACEuAQAAAAEvAQAAAAEwAQAAAAELJgEAAAABJwEAAAAEKAEAAAAEKQEAAAABKgEAAAABKwEAAAABLAEAAAABLQEAJAAhLgEAAAABLwEAAAABMAEAAAABDBoAACUAMBsAAAQAEBwAACUAMB0BACYAIR4BACYAIR8BACYAISABACYAISEBACYAISIBACYAISMgACcAISRAACgAISVAACgAIQsmAQAAAAEnAQAAAAQoAQAAAAQpAQAAAAEqAQAAAAErAQAAAAEsAQAAAAEtAQAkACEuAQAAAAEvAQAAAAEwAQAAAAECJiAAAAABLSAAIgAhCCZAAAAAASdAAAAABChAAAAABClAAAAAASpAAAAAAStAAAAAASxAAAAAAS1AACAAIQAAAAExAQAAAAEBMSAAAAABATFAAAAAAQAAAAADFQAGFgAHFwAIAAAAAxUABhYABxcACAECAQIDAQUGAQYHAQcIAQkKAQoMAgsNAwwPAQ0RAg4SBBETARIUARMVAhgYBRkZCQ"
};
async function decodeBase64AsWasm(wasmBase64) {
    const { Buffer } = await import('node:buffer');
    const wasmArray = Buffer.from(wasmBase64, 'base64');
    return new WebAssembly.Module(wasmArray);
}
config.compilerWasm = {
    getRuntime: async () => await import("@prisma/client/runtime/query_compiler_fast_bg.sqlite.mjs"),
    getQueryCompilerWasmModule: async () => {
        const { wasm } = await import("@prisma/client/runtime/query_compiler_fast_bg.sqlite.wasm-base64.mjs");
        return await decodeBase64AsWasm(wasm);
    },
    importName: "./query_compiler_fast_bg.js"
};
function getPrismaClientClass() {
    return runtime.getPrismaClient(config);
}
//# sourceMappingURL=class.js.map