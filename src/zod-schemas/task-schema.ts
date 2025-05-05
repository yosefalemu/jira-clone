import { task } from "@/db/schema/schema";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

const statusEnum = z.enum(
  ["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"],
  {
    invalid_type_error:
      "Invalid status. Allowed values are BACKLOG, TODO, IN_PROGRESS, IN_REVIEW, DONE.",
  }
);
export const insertTaskSchema = createInsertSchema(task, {
  id: (schema) => schema.optional(),
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
  projectId: (schema) => schema.uuid("Invalid uuid format"),
  assignedTo: (schema) => schema.uuid("Invalid uuid format"),
  status: () => statusEnum.optional(),
  dueDate: () => z.coerce.date(),
});

export type insertTaskSchemaType = typeof insertTaskSchema._type;
