import { db } from "@/db";
import { sessionMiddleware } from "@/lib/session-middleware";
import { insertTaskSchema } from "@/zod-schemas/task-schema";
import { zValidator } from "@hono/zod-validator";
import { and, eq, asc, desc, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { TaskStatus } from "../constant/types";
import { task, user, projectMember } from "@/db/schema/schema";

const app = new Hono()
  .get(
    "/",
    sessionMiddleware,
    zValidator(
      "query",
      z.object({
        workspaceId: z.string(),
        projectId: z.string().nullish(),
        assigneedId: z.string().nullish(),
        status: z
          .enum(["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"])
          .nullish(),
        search: z.string().nullish(),
        dueDate: z.string().nullish(),
      })
    ),
    async (c) => {
      try {
        const userId = c.get("userId") as string;
        const { workspaceId, assigneedId, projectId, status, search, dueDate } =
          c.req.valid("query");

        // Verify workspace projectMembership
        const projectMemberFound = await db
          .select()
          .from(projectMember)
          .where(
            and(
              eq(projectMember.userId, userId),
              eq(projectMember.projectId, workspaceId)
            )
          );

        if (projectMemberFound.length === 0) {
          return c.json(
            {
              error: "Unauthorized",
              message: "You are not a projectMember of this workspace",
            },
            401
          );
        }
        // Build query conditions
        const conditions = [eq(task.projectId, workspaceId)];

        if (projectId) {
          conditions.push(eq(task.projectId, projectId));
        }

        if (assigneedId) {
          conditions.push(eq(task.assignedTo, assigneedId));
        }

        if (status) {
          conditions.push(eq(task.status, status));
        }

        // if (search) {
        //   conditions.push(
        //     or(
        //       ilike(task.name, `%${search as string}%`),
        //       ilike(task.description, `%${search}%`)
        //     )
        //   );
        // }
        console.log("search", search);

        if (dueDate) {
          conditions.push(eq(task.dueDate, new Date(dueDate)));
        }

        // Execute query
        const tasks = await db
          .select()
          .from(task)
          .where(and(...conditions))
          .orderBy(asc(task.position));

        // Extract unique assigned user IDs
        const assignedUserIds = tasks
          .map((t) => t.assignedTo)
          .filter((id) => id !== null) as string[];

        // Fetch users for the assigned IDs
        const assignedUsers = assignedUserIds.length
          ? await db
              .select()
              .from(user)
              .where(inArray(user.id, assignedUserIds))
          : [];

        // Create a lookup object for quick access
        const userMap = Object.fromEntries(assignedUsers.map((u) => [u.id, u]));

        // Map assigned users to their respective tasks
        const tasksWithAssignedUsers = tasks.map((t) => ({
          ...t,
          assignedUser: t.assignedTo ? userMap[t.assignedTo] || null : null,
        }));

        return c.json({ data: tasksWithAssignedUsers }, 200);

        // return c.json({ data: tasks }, 200);
      } catch (error) {
        console.log(error);
        return c.json(
          { error: "Internal Server Error", message: "Failed to get tasks" },
          500
        );
      }
    }
  )
  .post(
    "/",
    sessionMiddleware,
    zValidator("json", insertTaskSchema),
    async (c) => {
      const userId = c.get("userId") as string;
      const {
        workspaceId,
        projectId,
        assignedId,
        description,
        name,
        dueDate,
        status,
      } = c.req.valid("json");

      try {
        // Check if the user is a projectMember of the workspace
        const foundprojectMember = await db
          .select()
          .from(projectMember)
          .where(
            and(
              eq(projectMember.userId, userId),
              eq(projectMember.projectId, workspaceId)
            )
          );

        if (foundprojectMember.length === 0) {
          return c.json(
            {
              error: "Unauthorized",
              message: "You are not a projectMember of this workspace",
            },
            401
          );
        }

        // Get the maximum position for the given status in the workspace
        const lastTask = await db
          .select({ maxPosition: task.position })
          .from(task)
          .where(
            and(
              eq(task.projectId, workspaceId),
              eq(task.projectId, projectId),
              eq(
                task.status,
                status as
                  | "BACKLOG"
                  | "TODO"
                  | "IN_PROGRESS"
                  | "IN_REVIEW"
                  | "DONE"
              )
            )
          )
          .orderBy(desc(task.position))
          .limit(1);

        const newPosition =
          lastTask.length > 0 ? Number(lastTask[0].maxPosition) + 1 : 0;

        // Insert the new task with the calculated position
        const [newTask] = await db
          .insert(task)
          .values({
            name,
            description,
            projectId,
            assignedId,
            dueDate,
            status: status || "BACKLOG",
            position: newPosition,
          })
          .returning();

        return c.json({ data: newTask }, 200);
      } catch (error) {
        console.log(error);
        return c.json(
          { error: "Internal Server Error", message: "Failed to create task" },
          500
        );
      }
    }
  )
  .delete("/:taskId", sessionMiddleware, async (c) => {
    const taskId = c.req.param("taskId") as string;
    try {
      await db.delete(task).where(eq(task.id, taskId));
      return c.json({ message: "Task deleted successfully" }, 200);
    } catch (error) {
      console.log("ERROR OCCURED WHILE DELETING TASK", error);
      return c.json(
        {
          error: "FailedToDeleteTask",
          message: "Failed to delete task",
        },
        500
      );
    }
  })
  .post(
    "/bulk-update",
    sessionMiddleware,
    zValidator(
      "json",
      z.object({
        tasks: z.array(
          z.object({
            id: z.string(),
            status: z.nativeEnum(TaskStatus),
            position: z.number().int().min(0),
          })
        ),
      })
    ),
    async (c) => {
      try {
        const { tasks } = c.req.valid("json");
        const tasksToUpdate = await db
          .select()
          .from(task)
          .where(
            inArray(
              task.id,
              tasks.map((t) => t.id)
            )
          );
        const workspaceIds = new Set(tasksToUpdate.map((t) => t.projectId));
        if (workspaceIds.size !== 1) {
          return c.json(
            {
              error: "InvalidRequest",
              message: "Tasks must belong to the same workspace",
            },
            400
          );
        }
        const workspaceId = workspaceIds.values().next().value as string;
        const projectMemberFound = await db
          .select()
          .from(projectMember)
          .where(
            and(
              eq(projectMember.userId, c.get("userId") as string),
              eq(projectMember.projectId, workspaceId)
            )
          );
        if (projectMemberFound.length === 0) {
          return c.json(
            {
              error: "Unauthorized",
              message: "You are not a projectMember of this workspace",
            },
            401
          );
        }
        const updatedTasks = await Promise.all(
          tasks.map(async (t) => {
            const { id, position, status } = t;
            await db
              .update(task)
              .set({
                position: position,
                status,
              })
              .where(eq(task.id, id));
          })
        );
        return c.json({ data: updatedTasks }, 200);
      } catch (error) {
        console.log("ERROR WHILE UPDATING BULK TASK", error);
        return c.json(
          {
            error: "Internal Server Error",
            message: "Failed to update tasks",
          },
          500
        );
      }
    }
  );

export default app;
