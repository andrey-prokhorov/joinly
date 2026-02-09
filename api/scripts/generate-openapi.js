import fs from "fs";
import YAML from "yaml";
import { createOpenApiSpec } from "../src/swagger.js";

const spec = createOpenApiSpec();
const yaml = YAML.stringify(spec);

fs.mkdirSync("./openapi", { recursive: true });
fs.writeFileSync("./openapi/openapi.yaml", yaml, "utf8");
fs.writeFileSync("./openapi/openapi.json", JSON.stringify(spec, null, 2), "utf8");

console.log("✅ Generated openapi/openapi.yaml and openapi/openapi.json");
