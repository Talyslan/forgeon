import { openai } from "@ai-sdk/openai";
import {
    convertToModelMessages,
    stepCountIs,
    streamText,
    tool,
    type UIMessage,
} from "ai";
import { fromNodeHeaders } from "better-auth/node";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";

import { WeekDay } from "../generated/prisma/enums.js";
import { auth } from "../lib/auth";
import { GetUserTrainData } from "../use-cases/users/get-user-train-data";
import { UpsertUserTrainData } from "../use-cases/users/upsert-user-train-data";
import { CreateWorkoutPlan } from "../use-cases/workout-plans/create-workout-plan";
import { GetWorkoutPlans } from "../use-cases/workout-plans/get-workout-plans";

const SYSTEM_PROMPT = `Você é um personal trainer virtual especialista em montagem de planos de treino.

## Regras
- Tom amigável, motivador, linguagem simples, sem jargões técnicos. O principal público são pessoas leigas em musculação.
- **SEMPRE** chamar a tool \`getUserTrainData\` antes de qualquer interação com o usuário.
- Se o usuário **não tem dados cadastrados** (retornou null): perguntar nome, peso (kg), altura (cm), idade e % de gordura corporal. Perguntas simples e diretas, em uma única mensagem. Após receber, salvar com a tool \`updateUserTrainData\` (converter peso de kg para gramas).
- Se o usuário **já tem dados**: cumprimentar pelo nome.
- Para **criar um plano de treino**: perguntar objetivo, dias disponíveis por semana e restrições físicas/lesões. Poucas perguntas, simples e diretas.
- O plano DEVE ter exatamente 7 dias (MONDAY a SUNDAY). Dias sem treino = \`isRest: true\`, \`exercises: []\`, \`estimatedDurationInSeconds: 0\`. Chame a tool \`createWorkoutPlan\` para criar o plano de treino.
- Respostas curtas e objetivas.

### Organização dos treinos — Divisões (Splits)
Escolha a divisão de treino adequada com base nos dias disponíveis:
- **2-3 dias/semana**: Full Body ou ABC (A: Peito+Tríceps, B: Costas+Bíceps, C: Pernas+Ombros)
- **4 dias/semana**: Upper/Lower (recomendado, cada grupo 2x/semana) ou ABCD (A: Peito+Tríceps, B: Costas+Bíceps, C: Pernas, D: Ombros+Abdômen)
- **5 dias/semana**: PPLUL — Push/Pull/Legs + Upper/Lower (superior 3x, inferior 2x/semana)
- **6 dias/semana**: PPL 2x — Push/Pull/Legs repetido

### Princípios gerais de montagem
- Músculos sinérgicos juntos (peito+tríceps, costas+bíceps)
- Exercícios compostos primeiro, isoladores depois
- 4 a 8 exercícios por sessão
- 3-4 séries por exercício. 8-12 reps (hipertrofia), 4-6 reps (força)
- Descanso entre séries: 60-90s (hipertrofia), 2-3min (compostos pesados)
- Evitar treinar o mesmo grupo muscular em dias consecutivos
- Nomes descritivos para cada dia (ex: "Superior A - Peito e Costas", "Descanso")

### Imagens de capa (coverImageUrl)
SEMPRE fornecer um \`coverImageUrl\` para cada dia de treino. Escolher com base no foco muscular:

**Dias majoritariamente superiores** (peito, costas, ombros, bíceps, tríceps, push, pull, upper, full body):
- \`https://gw8hy3fdcv.ufs.sh/f/ccoBDpLoAPCO3y8pQ6GBg8iqe9pP2JrHjwd1nfKtVSQskI0v\`
- \`https://gw8hy3fdcv.ufs.sh/f/ccoBDpLoAPCOW3fJmqZe4yoUcwvRPQa8kmFprzNiC30hqftL\`

**Dias majoritariamente inferiores** (pernas, glúteos, quadríceps, posterior, panturrilha, legs, lower):
- \`https://gw8hy3fdcv.ufs.sh/f/ccoBDpLoAPCOgCHaUgNGronCvXmSzAMs1N3KgLdE5yHT6Ykj\`
- \`https://gw8hy3fdcv.ufs.sh/f/ccoBDpLoAPCO85RVu3morROwZk5NPhs1jzH7X8TyEvLUCGxY\`

Alternar entre as duas opções de cada categoria para variar. Dias de descanso usam imagem de superior.`;

export default async function AIRoutes(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().route({
        method: "POST",
        url: "/",
        schema: {
            tags: ["AI"],
            summary: "Chat with AI personal trainer",
        },
        handler: async (req, res) => {
            const session = await auth.api.getSession({
                headers: fromNodeHeaders(req.headers),
            });

            if (!session) {
                return res
                    .status(401)
                    .send({ error: "Unauthorized", code: "UNAUTHORIZED" });
            }

            const userId = session.user.id;
            const { messages } = req.body as { messages: UIMessage[] };

            const result = streamText({
                model: openai("gpt-4o-mini"),
                system: SYSTEM_PROMPT,
                messages: await convertToModelMessages(messages),
                stopWhen: stepCountIs(5),
                tools: {
                    getUserTrainData: tool({
                        description: "Recupera os dados de treino do usuário.",
                        inputSchema: z.object({}),
                        execute: async () => {
                            const getUserTrainData = new GetUserTrainData();
                            return getUserTrainData.execute({ userId });
                        },
                    }),
                    updateUserTrainData: tool({
                        description:
                            "Atualiza ou cria os dados de treino do usuário.",
                        inputSchema: z.object({
                            weightInGrams: z
                                .number()
                                .describe("Peso em gramas"),
                            heightInCentimeters: z
                                .number()
                                .describe("Altura em centímetros"),
                            age: z.number().describe("Idade"),
                            bodyFatPercentage: z
                                .number()
                                .int()
                                .min(0)
                                .max(100)
                                .describe(
                                    "Percentual de gordura corporal (0 a 100)",
                                ),
                        }),
                        execute: async (input) => {
                            const upsertUserTrainData =
                                new UpsertUserTrainData();
                            return upsertUserTrainData.execute({
                                userId,
                                ...input,
                            });
                        },
                    }),
                    getWorkoutPlans: tool({
                        description:
                            "Lista todos os planos de treino do usuário.",
                        inputSchema: z.object({}),
                        execute: async () => {
                            const getWorkoutPlans = new GetWorkoutPlans();
                            return getWorkoutPlans.execute({ userId });
                        },
                    }),
                    createWorkoutPlan: tool({
                        description:
                            "Cria um novo plano de treino completo para o usuário.",
                        inputSchema: z.object({
                            name: z
                                .string()
                                .describe("Nome do plano de treino"),
                            workoutDays: z
                                .array(
                                    z.object({
                                        name: z
                                            .string()
                                            .describe(
                                                "Nome do dia (ex: Peito e Tríceps, Descanso)",
                                            ),
                                        weekDay: z
                                            .enum(WeekDay)
                                            .describe("Dia da semana"),
                                        isRest: z
                                            .boolean()
                                            .describe(
                                                "Se é dia de descanso (true) ou treino (false)",
                                            ),
                                        estimatedDurationInSeconds: z
                                            .number()
                                            .describe(
                                                "Duração estimada em segundos (0 para dias de descanso)",
                                            ),
                                        coverImageUrl: z
                                            .string()
                                            .url()
                                            .describe(
                                                "URL da imagem de capa do dia de treino.",
                                            ),
                                        exercises: z
                                            .array(
                                                z.object({
                                                    order: z
                                                        .number()
                                                        .describe(
                                                            "Ordem do exercício no dia",
                                                        ),
                                                    name: z
                                                        .string()
                                                        .describe(
                                                            "Nome do exercício",
                                                        ),
                                                    sets: z
                                                        .number()
                                                        .describe(
                                                            "Número de séries",
                                                        ),
                                                    reps: z
                                                        .number()
                                                        .describe(
                                                            "Número de repetições",
                                                        ),
                                                    restTimeInSeconds: z
                                                        .number()
                                                        .describe(
                                                            "Tempo de descanso entre séries em segundos",
                                                        ),
                                                }),
                                            )
                                            .describe(
                                                "Lista de exercícios (vazia para dias de descanso)",
                                            ),
                                    }),
                                )
                                .describe(
                                    "Array com exatamente 7 dias de treino (MONDAY a SUNDAY)",
                                ),
                        }),
                        execute: async (input) => {
                            const createWorkoutPlan = new CreateWorkoutPlan();
                            return createWorkoutPlan.execute({
                                userId,
                                ...input,
                            });
                        },
                    }),
                },
            });

            const { status, body, headers } =
                result.toUIMessageStreamResponse();

            res.status(status);
            headers.forEach((value, key) => res.header(key, value));
            return res.send(body);
        },
    });
}
