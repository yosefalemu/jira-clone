import { project } from "@/db/schema/schema";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const createProjectSchema = createInsertSchema(project, {
  id: (schema) => schema.uuid("Invalid uuid format").optional(),
  name: (schema) =>
    schema
      .nonempty("Name is required")
      .min(3, "Name must be at least 3 characters")
      .max(15, "Name must be at most 15 characters"),
  description: (schema) =>
    schema
      .nonempty("Description is required")
      .min(20, "Please provide a detailed description of the project")
      .max(500, "Description must be at most 500 characters"),
  image: (schema) =>
    schema
      .optional()
      .transform((value) => (value === "" ? undefined : value))
      .or(
        z.instanceof(File).refine((file) => file.size > 0, "File can not empty")
      ),
  workspaceId: (schema) => schema.uuid("Invalid uuid format"),
  createdAt: (schema) => schema.optional(),
  updatedAt: (schema) => schema.optional(),
});

export type insertProjectType = typeof createProjectSchema._type;
