import { Application } from "./app.js";
import { env } from "./config/env.js";

const PORT = env.PORT;

const app = new Application();

await app.init();
await app.start(PORT, "0.0.0.0");
