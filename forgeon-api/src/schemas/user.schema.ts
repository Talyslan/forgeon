import z from "zod";

export const UserTrainDataSchema = z
    .object({
        userId: z.string(),
        userName: z.string(),
        weightInGrams: z.number(),
        heightInCentimeters: z.number(),
        age: z.number(),
        bodyFatPercentage: z.number().min(0).max(100),
    })
    .nullable();

export const UpsertUserTrainDataBodySchema = z.object({
    weightInGrams: z.number(),
    heightInCentimeters: z.number(),
    age: z.number(),
    bodyFatPercentage: z.number().min(0).max(100),
});
