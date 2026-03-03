import app from "./app";
import { env } from "./config/env";

const PORT = env.PORT;

app.listen({ port: PORT }, (err, address) => {
    if (err) {
        app.log.error(err);
        process.exit(1);
    }
    console.log(`Server listening at ${address}`);
});
