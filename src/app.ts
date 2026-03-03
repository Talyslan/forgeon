import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUI from "@fastify/swagger-ui";
import Fastify, { type FastifyInstance } from "fastify";
import {
    jsonSchemaTransform,
    serializerCompiler,
    validatorCompiler,
} from "fastify-type-provider-zod";

// routes
import Health from "./routes/health.route";

export class Application {
    private readonly app: FastifyInstance;

    constructor() {
        console.log("App initialized");
        this.app = Fastify();
    }

    public async init() {
        this.config();
        await this.plugins();
        await this.routes();
    }

    public async start(port: number) {
        try {
            await this.app.listen({ port });
            console.log(`🚀 Server running on port ${port}`);
        } catch (err) {
            this.app.log.error(err);
            process.exit(1);
        }
    }

    private config() {
        this.app.setValidatorCompiler(validatorCompiler);
        this.app.setSerializerCompiler(serializerCompiler);
    }

    private async plugins() {
        await this.app.register(fastifySwagger, {
            openapi: {
                info: {
                    title: "Forgeon API",
                    description:
                        "AI-powered web application for generating and managing personalized workout plans for athletes and trainers.",
                    version: "1.0.0",
                },
                servers: [
                    {
                        description: "Local",
                        url: "http://localhost:8080",
                    },
                ],
            },
            transform: jsonSchemaTransform,
        });

        await this.app.register(fastifySwaggerUI, {
            routePrefix: "/docs",
        });
    }

    private async routes() {
        await this.app.register(Health);
    }
}
