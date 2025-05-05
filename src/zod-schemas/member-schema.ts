import { workspaceMember } from "@/db/schema/schema";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

const roleEnum = z.enum(["admin", "member", "viewer"], {
  invalid_type_error: "Invalid role. Allowed values are admin, member, viewer.",
});

export const insertMemberSchema = createInsertSchema(workspaceMember, {
  id: (schema) => schema.uuid("Invalid uuid format").optional(),
  userId: (schema) => schema.uuid("Invalid uuid format"),
  workspaceId: (schema) => schema.uuid("Invalid uuid format"),
  role: () => roleEnum.optional(),
  createdAt: (schema) => schema.optional(),
  updatedAt: (schema) => schema.optional(),
});

export type insertMemberSchemaType = typeof insertMemberSchema._type;
