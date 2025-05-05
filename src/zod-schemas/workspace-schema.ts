import { workspace } from "@/db/schema/schema";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const createWorkspaceSchema = createInsertSchema(workspace, {
  id: (schema) => schema.uuid("Invalid uuid format").optional(),
  name: (schema) =>
    schema
      .nonempty("Name is required")
      .min(3, "Name must be at least 3 characters")
      .max(15, "Name must be at most 15 characters"),
  description: (schema) =>
    schema
      .nonempty("Description is required")
      .min(20, "Please provide a detailed description of the workspace")
      .max(500, "Description must be at most 500 characters"),
  creatorId: (schema) => schema.uuid("Invalid uuid format").optional(),
  inviteCode: (schema) => schema.optional(),
  image: (schema) =>
    schema
      .optional()
      .transform((value) => (value === "" ? undefined : value))
      .or(
        z.instanceof(File).refine((file) => file.size > 0, "File can not empty")
      ),
  createdAt: (schema) => schema.optional(),
  updatedAt: (schema) => schema.optional(),
});

export type insertWorkspaceType = typeof createWorkspaceSchema._type;
