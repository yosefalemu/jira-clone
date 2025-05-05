import { db } from "@/db";
import { user, workspaceMember } from "@/db/schema/schema";
import { sessionMiddleware } from "@/lib/session-middleware";
import { insertMemberSchema } from "@/zod-schemas/member-schema";
import { selectUserType } from "@/zod-schemas/users-schema";
import { zValidator } from "@hono/zod-validator";
import { and, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

const app = new Hono()
  .get(
    "/:workspaceId",
    sessionMiddleware,
    zValidator("param", z.object({ workspaceId: z.string() })),
    async (c) => {
      try {
        const workspaceId = c.req.param("workspaceId");

        const members = await db
          .select()
          .from(workspaceMember)
          .where(eq(workspaceMember.workspaceId, workspaceId));

        if (!members.length) {
          return c.json(
            {
              error: "Not Found",
              message: "No members found in the workspace",
            },
            404
          );
        }

        const userInMember = members.map((member) => ({
          userId: member.userId,
          userRole: member.role,
        }));
        const usersFound: selectUserType[] = await db
          .select({ id: user.id, name: user.name, email: user.email })
          .from(user)
          .where(
            inArray(
              user.id,
              userInMember.map((member) => member.userId)
            )
          );
        const result = usersFound.map((user) => {
          const member = userInMember.find(
            (member) => member.userId === user.id
          );
          return {
            ...user,
            userRole: member ? member.userRole : null,
          };
        });

        return c.json({ data: result });
      } catch (error) {
        console.error("Error fetching workspace members:", error);
        return c.json(
          {
            error: "Internal Server Error",
            message: "Failed to fetch members",
          },
          500
        );
      }
    }
  )
  .post("/", zValidator("json", insertMemberSchema), async (c) => {
    const { userId, workspaceId, role } = c.req.valid("json");
    console.log(userId, workspaceId, role);
    return c.json({ data: "Hello World" });
  })
  .patch(
    "/:memberId",
    sessionMiddleware,
    zValidator(
      "json",
      z.object({
        role: z.enum(["member", "admin", "viewer"]),
        workspaceId: z.string(),
      })
    ),
    async (c) => {
      try {
        const memberId = c.req.param("memberId");
        if (!memberId) {
          return c.json(
            {
              error: "Bad Request",
              message: "Member ID is required",
            },
            400
          );
        }
        const { role, workspaceId } = c.req.valid("json");
        const userId = c.get("userId") as string;
        const membersFound = await db
          .select()
          .from(workspaceMember)
          .where(
            and(
              eq(workspaceMember.userId, memberId),
              eq(workspaceMember.workspaceId, workspaceId)
            )
          );
        if (membersFound.length === 0) {
          return c.json(
            {
              error: "Not Found",
              message: "Member not found in the workspace",
            },
            404
          );
        }
        const currentLoggedInUserInWorkspace = await db
          .select()
          .from(workspaceMember)
          .where(
            and(
              eq(workspaceMember.userId, userId),
              eq(workspaceMember.workspaceId, workspaceId)
            )
          );
        if (currentLoggedInUserInWorkspace[0].role !== "admin") {
          return c.json(
            {
              error: "Forbidden",
              message: "You are not authorized to update roles",
            },
            403
          );
        }
        if (currentLoggedInUserInWorkspace[0].role === role) {
          return c.json(
            {
              error: "Bad Request",
              message: "Role is already set to this user",
            },
            400
          );
        }
        await db
          .update(workspaceMember)
          .set({ role })
          .where(eq(workspaceMember.userId, memberId));
        return c.json({ message: "Role updated successfully" }, 200);
      } catch (error) {
        console.error("Error updating role:", error);
        return c.json(
          { error: "Internal Server Error", message: "Failed to update role" },
          500
        );
      }
    }
  );

export default app;
