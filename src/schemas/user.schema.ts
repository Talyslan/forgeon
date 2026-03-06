import z from "zod";

export const UserTrainDataSchema = z
    .object({
        userId: z.string(),
        userName: z.string(),
        weightInGrams: z.number(),
        heightInCentimeters: z.number(),
        age: z.number(),
        bodyFatPercentage: z.number(),
    })
    .nullable();
