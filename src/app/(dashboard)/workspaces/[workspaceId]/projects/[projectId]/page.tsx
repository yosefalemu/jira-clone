"use client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetProject } from "@/features/projects/api/get-project-api";
import ProjectAvatar from "@/features/projects/components/project-avatar";
import ProjectMembers from "@/features/projects/components/project-members";
import TaskViewSwitcher from "@/features/tasks/components/task-view-switcher";
import { Settings } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
export default function ProjectPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { data, isLoading } = useGetProject({ projectId });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-y-4 h-full">
        {/* Header section skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-x-2">
            <Skeleton className="size-8 rounded-full" /> {/* Project avatar */}
            <Skeleton className="h-6 w-40" /> {/* Project name */}
          </div>
          <Skeleton className="h-8 w-28" /> {/* Edit button */}
        </div>
        {/* Project members section skeleton */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            {/* Three overlapping avatar skeletons */}
            <Skeleton
              className="h-8 w-8 rounded-full animate-none bg-gray-900/90"
              style={{ zIndex: 3 }}
            />
            <Skeleton
              className="h-8 w-8 rounded-full animate-none bg-gray-900/70"
              style={{ marginLeft: "-16px", zIndex: 2 }}
            />
            <Skeleton
              className="h-8 w-8 rounded-full animate-none bg-gray-900/50"
              style={{ marginLeft: "-16px", zIndex: 1 }}
            />
            {/* Count badge skeleton */}
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
          {/* Add button skeleton */}
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        {/* Task view switcher skeleton */}
        <div className="flex gap-x-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
        <Skeleton className="flex flex-col gap-y-8 flex-1 p-6">
          {/* Filter elements */}
          <div className="flex gap-x-2">
            <Skeleton className="h-8 w-20 bg-primary/15" />
            <Skeleton className="h-8 w-20 bg-primary/15" />
            <Skeleton className="h-8 w-20 bg-primary/15" />
          </div>
          {/* Search item */}
          <Skeleton className="h-8 w-56 bg-primary/15" />
          {/* Data to be displayed */}
          <div className="flex flex-col gap-y-4">
            <Skeleton className="h-12 w-full bg-primary/15" />
            <Skeleton className="h-12 w-full bg-primary/15" />
            <Skeleton className="h-12 w-full bg-primary/15" />
            <Skeleton className="h-12 w-full bg-primary/15" />
          </div>
        </Skeleton>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-4">
          <ProjectAvatar
            name={data?.name || ""}
            image={data?.image ?? undefined}
            className="size-8"
          />
          <p className="text-sm font-semibold uppercase">{data?.name}</p>
        </div>
        <div>
          <Button variant="secondary" size="sm" asChild>
            <Link
              href={`/settings/project?projectId=${projectId}&workspaceId=${data?.workspaceId}`}
            >
              <Settings className="size-4 mr-2" />
              <p className="text-sm uppercase"> Project Settings</p>
            </Link>
          </Button>
        </div>
      </div>
      <div>
        <ProjectMembers projectId={projectId} workspaceId={data?.workspaceId} />
      </div>
      <TaskViewSwitcher />
    </div>
  );
}
