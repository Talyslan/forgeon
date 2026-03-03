import Fastify, { type FastifyInstance } from "fastify";
import {
    serializerCompiler,
    validatorCompiler,
    type ZodTypeProvider,
} from "fastify-type-provider-zod";
import z from "zod";

class Application {
    public app: FastifyInstance;

    constructor() {
        console.log("App initialized");
        this.app = Fastify();

        this.config();
        this.routes();
    }

    async routes() {
        this.app.get("/", async function handler() {
            return { hello: "world" };
        });

        this.app.withTypeProvider<ZodTypeProvider>().route({
            method: "GET",
            url: "/",
            schema: {
                description: "Hello world",
                tags: ["hello"],
                response: {
                    200: z.object({
                        message: z.string(),
                    }),
                },
            },
            handler: () => {
                return { message: "Hello world" };
            },
        });
    }

    async config() {
        this.app.setValidatorCompiler(validatorCompiler);
        this.app.setSerializerCompiler(serializerCompiler);
    }
}

export default new Application().app;
