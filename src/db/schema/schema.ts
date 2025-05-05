import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// Enums
export const statusEnum = pgEnum("status", [
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "DONE",
]);

export const roleEnum = pgEnum("role", ["admin", "member", "viewer"]);

// Users table
export const user = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 50 }).notNull(),
  email: varchar("email").notNull().unique(),
  password: varchar("password").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Workspaces table
export const workspace = pgTable("work_spaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull().unique(),
  description: text("description").notNull(),
  creatorId: uuid("creator_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  image: text("image").default(""),
  inviteCode: varchar("invite_code").notNull().unique(),
  inviteCodeExpire: timestamp("invite_code_expire", {
    withTimezone: true,
  }).default(sql`NOW() + INTERVAL '7 days'`),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Projects table
export const project = pgTable("project", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull(),
  description: varchar("description").notNull(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspace.id, { onDelete: "cascade" }),
  creatorId: uuid("creator_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  inviteCode: varchar("invite_code").notNull().unique(),
  image: text("image").default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Tasks table
export const task = pgTable("task", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull(),
  description: text("description").notNull(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  assignedTo: uuid("assigned_id").references(() => user.id, {
    onDelete: "set null",
  }),
  dueDate: timestamp("due_date", { withTimezone: true }),
  status: statusEnum("status").notNull(),
  position: integer("position").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Workspace_members table
export const workspaceMember = pgTable(
  "workspace_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: roleEnum("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    pk: unique().on(table.workspaceId, table.userId),
    workspaceIdIdx: index("wm_workspace_id_idx").on(table.workspaceId),
    userIdIdx: index("wm_user_id_idx").on(table.userId),
  })
);

// Project_members table
export const projectMember = pgTable(
  "project_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: roleEnum("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    pk: unique().on(table.projectId, table.userId),
    projectIdIdx: index("pm_project_id_idx").on(table.projectId),
    userIdIdx: index("pm_user_id_idx").on(table.userId),
  })
);

// Trigger to enforce workspace membership for project members
export const projectMemberTrigger = sql`
  CREATE OR REPLACE FUNCTION check_project_membership()
  RETURNS TRIGGER AS $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM workspace_members wm
      JOIN project p ON p.workspace_id = wm.workspace_id
      WHERE wm.user_id = NEW.user_id
      AND p.project_id = NEW.project_id
    ) THEN
      RAISE EXCEPTION 'User must be a member of the workspace to join the project';
    END IF;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
  
  CREATE TRIGGER project_membership_check
  BEFORE INSERT ON project_members
  FOR EACH ROW
  EXECUTE FUNCTION check_project_membership();
  `;

// Relations
export const userRelations = relations(user, ({ many }) => ({
  workspaces: many(workspace),
  workspaceMembers: many(workspaceMember),
  projects: many(project),
  projectMembers: many(projectMember),
  tasks: many(task),
}));

export const workspaceRelations = relations(workspace, ({ one, many }) => ({
  creator: one(user, {
    fields: [workspace.creatorId],
    references: [user.id],
  }),
  projects: many(project),
  members: many(workspaceMember),
}));

export const workspaceMemberRelations = relations(
  workspaceMember,
  ({ one }) => ({
    workspace: one(workspace, {
      fields: [workspaceMember.workspaceId],
      references: [workspace.id],
    }),
    user: one(user, {
      fields: [workspaceMember.userId],
      references: [user.id],
    }),
  })
);

export const projectRelations = relations(project, ({ one, many }) => ({
  creator: one(user, {
    fields: [project.creatorId],
    references: [user.id],
  }),
  workspace: one(workspace, {
    fields: [project.workspaceId],
    references: [workspace.id],
  }),
  tasks: many(task),
  members: many(projectMember),
}));

export const projectMemberRelations = relations(projectMember, ({ one }) => ({
  project: one(project, {
    fields: [projectMember.projectId],
    references: [project.id],
  }),
  user: one(user, {
    fields: [projectMember.userId],
    references: [user.id],
  }),
}));

export const taskRelations = relations(task, ({ one }) => ({
  project: one(project, {
    fields: [task.projectId],
    references: [project.id],
  }),
  assignedTo: one(user, {
    fields: [task.assignedTo],
    references: [user.id],
  }),
}));
