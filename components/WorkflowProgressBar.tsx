"use client";

import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface WfTask {
  id: string;
  status: "pending" | "in_progress" | "blocked" | "completed";
  deadline?: string; // optional
}

interface Props {
  tasks: WfTask[];
}

/* -------------------------------------------------------------------------- */
/*  Main Component                                                            */
/* -------------------------------------------------------------------------- */

export default function WorkflowProgressBar({ tasks }: Props) {
  // Return nothing if no tasks
  if (!tasks?.length) return null;

  // how many are completed
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const pct = Math.round((completedCount / tasks.length) * 100);

  // find earliest upcoming deadline among incomplete tasks
  const upcoming = tasks
    .filter((t) => t.deadline && t.status !== "completed")
    .map((t) => new Date(t.deadline!))
    .sort((a, b) => a.getTime() - b.getTime())[0];

  return (
    <div className="space-y-2">
      <Progress value={pct} className="h-2" />
      <div className="flex items-center justify-between text-xs">
        <span>
          {completedCount}/{tasks.length} tasks complete
        </span>
        {upcoming && (
          <Badge variant="outline" className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Due&nbsp;{upcoming.toLocaleDateString()}
          </Badge>
        )}
      </div>
    </div>
  );
}
