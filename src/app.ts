import fastifyCors from "@fastify/cors";
import fastifySwagger from "@fastify/swagger";
import fastifyApiReference from "@scalar/fastify-api-reference";
import Fastify, { type FastifyInstance } from "fastify";
import {
    jsonSchemaTransform,
    serializerCompiler,
    validatorCompiler,
} from "fastify-type-provider-zod";

import { env } from "./config/env";
// routes
import AuthRoute from "./routes/auth.route";
import HealthRoute from "./routes/health.route";
import HomeRoute from "./routes/home.route";
import SwaggerRoute from "./routes/swagger.route";
import WorkoutPlansRoute from "./routes/workoutPlans.route";

export class Application {
    private readonly app: FastifyInstance;

    constructor() {
        console.log("App initialized");
        this.app = Fastify({ logger: true });
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

        await this.app.register(fastifyCors, {
            origin: env.CLIENT_URL,
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            allowedHeaders: [
                "Content-Type",
                "Authorization",
                "X-Requested-With",
            ],
            credentials: true,
            maxAge: 86400,
        });

        await this.app.register(fastifyApiReference, {
            routePrefix: "/docs",
            configuration: {
                sources: [
                    {
                        title: "Forgeon API",
                        slug: "forgeon-api",
                        url: "/swagger.json",
                    },
                    {
                        title: "Auth API",
                        slug: "auth-api",
                        url: "/api/auth/open-api/generate-schema",
                    },
                ],
            },
        });
    }

    private async routes() {
        await this.app.register(HealthRoute, { prefix: "/" });
        await this.app.register(AuthRoute);
        await this.app.register(SwaggerRoute, { prefix: "/swagger.json" });
        await this.app.register(WorkoutPlansRoute, { prefix: "/workout-plans" });
        await this.app.register(HomeRoute, { prefix: "/home" });
    }
}
