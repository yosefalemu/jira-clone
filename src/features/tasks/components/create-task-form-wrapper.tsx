"use client";
import { Card, CardContent } from "@/components/ui/card";
import { useGetMembers } from "@/features/members/api/get-members-api";
import { useGetProjects } from "@/features/projects/api/get-projects-api";
import { Loader } from "lucide-react";
import { useParams } from "next/navigation";
import TaskForm from "./task-form";

export default function CreateTaskFormWrapper() {
  const params = useParams();
  const { data: membersFound, isLoading: isLoadingMembers } = useGetMembers(
    params.workspaceId as string
  );
  const { data: projectsFound, isLoading: isLoadingProjects } = useGetProjects({
    workspaceId: params.workspaceId as string,
  });
  const projectOptions = projectsFound?.map((project) => ({
    id: project.id,
    name: project.name,
    image: project.image,
  }));
  const memberOptions = membersFound?.map((member) => ({
    id: member.id || "",
    name: member.name || "",
  }));

  const isLoading = isLoadingMembers || isLoadingProjects;
  if (isLoading) {
    return (
      <Card className="w-full h-[714px] border-none shadow-none">
        <CardContent className="flex items-center justify-center h-full">
          <Loader className="size-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }
  return (
    <div>
      <TaskForm
        membersOptions={memberOptions || []}
        projectOptions={projectOptions || []}
      />
    </div>
  );
}
