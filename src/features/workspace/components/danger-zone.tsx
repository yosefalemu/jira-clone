import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useConfirm } from "@/hooks/use-confirm";
import { useMedia } from "react-use";
import { useDeleteWorkspace } from "../api/delete-workspace-api";
import { Loader } from "lucide-react";
import { toast } from "sonner";
import DootedSeparator from "@/components/dooted-separator";
import { useRouter } from "next/navigation";

interface DangerZoneProps {
  workspaceId: string;
  loadingState: boolean;
  setIsDeleteLoading: (status: boolean) => void;
}
export default function DangerZone({
  workspaceId,
  loadingState,
  setIsDeleteLoading,
}: DangerZoneProps) {
  const router = useRouter();
  const isDesktop = useMedia("(min-width: 1024px)", true);
  const [DeleteDialog, confirmDelete] = useConfirm(
    "Delete workspace",
    "This action cannot be undo",
    {
      variant: "destructive",
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
    }
  );
  const { mutate, isPending } = useDeleteWorkspace();
  const handleDeleteWorkspace = async () => {
    const ok = await confirmDelete();
    if (!ok) {
      return;
    }
    setIsDeleteLoading(true);
    mutate(
      { param: { workspaceId: workspaceId } },
      {
        onSuccess: () => {
          setIsDeleteLoading(false);
          toast.success("Workspace deleted successfully");
          // window.location.href = "/";
          router.push("/");
        },
        onError: () => {
          setIsDeleteLoading(false);
          toast.error("An error occurred while deleting workspace");
        },
      }
    );
  };
  return (
    <div>
      <DeleteDialog />
      <Card className="shadow-none border-none bg-neutral-50 col-span-1">
        <CardContent className="p-7">
          <div className="flex flex-col">
            <h3 className="font-bold text-lg">Danger Zone</h3>
            <p className="text-sm text-muted-foreground">
              Deleting a workspace is irreversible and will remove all
              associated data.
            </p>
            <DootedSeparator className="py-7" />
            <Button
              className="mt-6 w-fit ml-auto"
              size={isDesktop ? "lg" : "sm"}
              variant="destructive"
              type="button"
              onClick={handleDeleteWorkspace}
              disabled={loadingState}
            >
              {isPending ? <Loader className="animate-spin" /> : null}
              {isPending ? "Deleting" : "Delete Workspace"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
