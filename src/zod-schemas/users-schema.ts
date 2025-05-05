import { user } from "@/db/schema/schema";
import { createInsertSchema } from "drizzle-zod";

export const insertUserSchema = createInsertSchema(user, {
  id: (schema) => schema.uuid("Invalid uuid format").optional(),
  name: (schema) =>
    schema
      .nonempty("Name is required")
      .min(3, "Name must be at least 3 characters"),
  email: (schema) =>
    schema.nonempty("Email is required").email("Invalid email format"),
  password: (schema) =>
    schema
      .nonempty("Password is required")
      .min(8, "Password must be at least 8 characters"),
});

export type insertUserType = typeof insertUserSchema._type;
