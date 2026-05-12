import { getSession } from "@/lib/session";
import CanvasEditor from "@/components/CanvasEditor";
import DesignAuthGuard from "@/components/DesignAuthGuard";

export default async function DesignPage() {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-white">
      {session ? <CanvasEditor /> : <DesignAuthGuard />}
    </div>
  );
}
