import * as z from "zod";

export const compensatoryFormSchema = z.object({
    dob: z.date({
      required_error: "A date is required.",
    }),
    name: z.string().min(4, {
      message: "Name must be at least 4 characters.",
    }),
    hours: z.preprocess(
      (a) => parseInt(z.string().parse(a), 10),
      z.number().positive().min(1)
    ),
  });
  
type compensatoryFormSchema = z.infer<typeof compensatoryFormSchema>;