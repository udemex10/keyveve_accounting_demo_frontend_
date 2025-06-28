"use client";

import React, { useState } from "react";
import {
  CheckCircle,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Calendar,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

/** Project-level milestone (“phase”) */
interface PhaseStep {
  id: string;
  label: string;
  stepStatus: "completed" | "current" | "not_reached";
}

/** A single workflow task */
export interface WorkflowTask {
  id: number | string;
  name: string;
  status: "pending" | "in_progress" | "blocked" | "completed";
  deadline?: string; // ISO date string
}

/** Props received from the parent page */
interface Props {
  projectStatus: string;   // e.g. "Docs Requested"
  tasks?: WorkflowTask[];  // service-specific workflow tasks
}

/* -------------------------------------------------------------------------- */
/*  Dummy tasks (used when no tasks prop supplied)                            */
/* -------------------------------------------------------------------------- */

const DUMMY_TASKS: WorkflowTask[] = [
  {
    id: 1,
    name: "Gather client docs",
    status: "completed",
    deadline: "2025-05-05",
  },
  {
    id: 2,
    name: "Prepare workpapers",
    status: "in_progress",
    deadline: "2025-05-10",
  },
  {
    id: 3,
    name: "Review & questions",
    status: "pending",
    deadline: "2025-05-15",
  },
  {
    id: 4,
    name: "Finalize & send",
    status: "blocked",
    deadline: "2025-05-20",
  },
];

/* -------------------------------------------------------------------------- */
/*  Base phases up to Project Started + Completed                             */
/* -------------------------------------------------------------------------- */

const PHASES = [
  "Onboarding",
  "Docs Requested",
  "Docs Received",
  "Pricing/Analysis",
  "Awaiting Signature",
  "Project Started",
  // “Workflow Tasks” injected dynamically
  "Completed",
];

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export default function UnifiedProjectTimeline({
  projectStatus,
  tasks = [],
}: Props) {
  const [expanded, setExpanded] = useState(false);

  /* --------------------- choose real vs dummy tasks ----------------------- */
  const taskData = tasks.length ? tasks : DUMMY_TASKS;

  /* --------------------------- phase steps -------------------------------- */
  const baseSteps = buildPhaseSteps(projectStatus);

  const startedIndex = PHASES.indexOf("Project Started");
  const currentIndex = PHASES.indexOf(projectStatus);
  const reachedProjectStarted =
    startedIndex !== -1 && currentIndex >= startedIndex;

  let finalSteps: PhaseStep[];
  if (reachedProjectStarted) {
    const withoutCompleted = baseSteps.filter((s) => s.id !== "Completed");
    const workflowStepStatus: "completed" | "current" | "not_reached" =
      projectStatus === "Completed" ? "completed" : "current";

    finalSteps = [
      ...withoutCompleted,
      {
        id: "workflow-tasks",
        label: "Workflow Tasks",
        stepStatus: workflowStepStatus,
      },
      {
        id: "Completed",
        label: "Completed",
        stepStatus: projectStatus === "Completed" ? "current" : "not_reached",
      },
    ];
  } else {
    finalSteps = baseSteps;
  }

  /* -------------------------- sub-progress -------------------------------- */
  let pct = 0;
  let completedCount = 0;
  let upcoming: Date | undefined;

  if (reachedProjectStarted) {
    completedCount = taskData.filter((t) => t.status === "completed").length;
    pct = Math.round((completedCount / taskData.length) * 100);

    upcoming = taskData
      .filter((t) => t.deadline && t.status !== "completed")
      .map((t) => new Date(t.deadline!))
      .sort((a, b) => a.getTime() - b.getTime())[0];
  }

  /* ------------------------------------------------------------------------ */

  return (
    <div>
      {/* ─────────────────── Main phase bar ─────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center space-x-1">
          {finalSteps.map((step) => (
            <div
              key={step.id}
              className={`h-2 flex-1 rounded-sm ${
                step.stepStatus === "completed"
                  ? "bg-primary/80"
                  : step.stepStatus === "current"
                  ? "bg-green-400"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* ─────────────────── Phase labels ──────────────────── */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(60px,1fr))] gap-1 text-xs">
          {finalSteps.map((step) => {
            const cls =
              step.stepStatus === "current"
                ? "text-green-600 font-medium"
                : step.stepStatus === "completed"
                ? "text-primary/60"
                : "text-muted-foreground";
            return (
              <div key={step.id} className={`text-center truncate ${cls}`}>
                {step.id === "workflow-tasks" ? (
                  <button
                    type="button"
                    onClick={() => setExpanded((p) => !p)}
                    className="underline inline-flex items-center hover:no-underline"
                  >
                    {expanded ? (
                      <ChevronDown className="h-3 w-3 mr-1" />
                    ) : (
                      <ChevronRight className="h-3 w-3 mr-1" />
                    )}
                    {step.label}
                  </button>
                ) : (
                  step.label
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ──────────────── Workflow-tasks panel ──────────────── */}
      {reachedProjectStarted && expanded && (
        <div className="mt-3 p-3 rounded-md border bg-muted/20 space-y-3">
          {/* progress bar + stats */}
          <div className="space-y-2">
            <Progress value={pct} className="h-2" />
            <div className="flex items-center justify-between text-xs">
              <span>
                {completedCount}/{taskData.length} tasks complete
              </span>
              {upcoming && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Due&nbsp;{upcoming.toLocaleDateString()}
                </Badge>
              )}
            </div>
          </div>

          {/* optional task list */}
          <ul className="mt-2 space-y-2 text-sm">
            {taskData.map((t) => {
              const icon =
                t.status === "completed" ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <HelpCircle className="h-4 w-4" />
                );
              const color =
                t.status === "completed"
                  ? "text-green-600"
                  : t.status === "in_progress"
                  ? "text-primary"
                  : "text-muted-foreground";
              return (
                <li key={t.id} className={`flex items-center gap-2 ${color}`}>
                  {icon}
                  <span>{t.name}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Helper: build phase steps                                                 */
/* -------------------------------------------------------------------------- */

function buildPhaseSteps(projectStatus: string): PhaseStep[] {
  const basePhases = [
    { id: "Onboarding", label: "Onboarding" },
    { id: "Docs Requested", label: "Docs Requested" },
    { id: "Docs Received", label: "Docs Received" },
    { id: "Pricing/Analysis", label: "Pricing/Analysis" },
    { id: "Awaiting Signature", label: "Awaiting Signature" },
    { id: "Project Started", label: "Project Started" },
  ];

  let currentIndex = basePhases.findIndex((p) => p.id === projectStatus);
  if (projectStatus === "Completed") currentIndex = basePhases.length;
  if (currentIndex === -1) currentIndex = 0; // unknown status ⇒ first phase

  return basePhases.map((phase, idx) => ({
    id: phase.id,
    label: phase.label,
    stepStatus:
      idx < currentIndex
        ? "completed"
        : idx === currentIndex
        ? "current"
        : "not_reached",
  }));
}
