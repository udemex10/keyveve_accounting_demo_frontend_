/*
  EnhancedProjectCard.tsx (updated)
  Displays a single project in either grid (card) or list view,
  with workflow‑specific snapshot metrics, a linear status tracker,
  and a compact risk score badge.
*/

"use client";

import React from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  FileText,
  MessageSquare,
  Check,
  Users,
  HelpCircle,
  Landmark,
  BarChart3,
  Building,
} from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { differenceInDays } from "date-fns";

/* ------------------------------------------------------------------
   Minimal shared interfaces – mirror the shapes used in StaffDashboard
-------------------------------------------------------------------*/
interface Task {
  status: string;
  deadline?: string;
}
interface Document {}
interface Message {}
interface Project {
  id: number;
  client_name: string;
  status: string;
  service_type?: string;
  docs: Document[];
  tasks: Task[];
  messages: Message[];
  assigned_staff: string[];
  staff_roles?: { [key: string]: string };
  updated_at?: string;
}
interface StaffMember {
  id: string;
  name: string;
}

/* ------------------------------------------------------------------
   Props
-------------------------------------------------------------------*/
interface EnhancedProjectCardProps {
  project: Project;
  viewMode: "grid" | "list";
  onStatusChange: (projectId: number, newStatus: string) => void;
  staffMembers: StaffMember[];
  projectStatuses?: string[];
  riskScore?: number; // <-- We'll show this as a tiny badge
}

/* ------------------------------------------------------------------
   Constants / helpers copied from dashboard
-------------------------------------------------------------------*/
const PROJECT_STATUSES = [
  "Onboarding",
  "Docs Requested",
  "Docs Received",
  "Pricing/Analysis",
  "Awaiting Signature",
  "Project Started",
  "Completed",
];

const getServiceIcon = (serviceType?: string): JSX.Element => {
  switch (serviceType) {
    case "Tax Return":
      return <FileText className="h-4 w-4 text-blue-500" />;
    case "Bookkeeping":
      return <Landmark className="h-4 w-4 text-green-500" />;
    case "Audit":
      return <Check className="h-4 w-4 text-red-500" />;
    case "Financial Planning":
      return <BarChart3 className="h-4 w-4 text-purple-500" />;
    case "Advisory":
      return <Building className="h-4 w-4 text-amber-500" />;
    default:
      return <HelpCircle className="h-4 w-4 text-gray-500" />;
  }
};

const renderStatusBadge = (status: string): JSX.Element => {
  const statusColors: Record<string, { color: string; bg: string }> = {
    Onboarding: {
      color: "text-blue-700 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-900/30",
    },
    "Docs Requested": {
      color: "text-amber-700 dark:text-amber-400",
      bg: "bg-amber-100 dark:bg-amber-900/30",
    },
    "Docs Received": {
      color: "text-violet-700 dark:text-violet-400",
      bg: "bg-violet-100 dark:bg-violet-900/30",
    },
    "Pricing/Analysis": {
      color: "text-cyan-700 dark:text-cyan-400",
      bg: "bg-cyan-100 dark:bg-cyan-900/30",
    },
    "Awaiting Signature": {
      color: "text-pink-700 dark:text-pink-400",
      bg: "bg-pink-100 dark:bg-pink-900/30",
    },
    "Project Started": {
      color: "text-emerald-700 dark:text-emerald-400",
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
    },
    Completed: {
      color: "text-green-700 dark:text-green-400",
      bg: "bg-green-100 dark:bg-green-900/30",
    },
  };
  const style =
    statusColors[status] || {
      color: "text-gray-700 dark:text-gray-400",
      bg: "bg-gray-100 dark:bg-gray-900/30",
    };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${style.color} ${style.bg}`}
    >
      {status}
    </span>
  );
};

const getStaffName = (id: string, staffMembers: StaffMember[]): string => {
  return staffMembers.find((s) => s.id === id)?.name || "Unknown";
};

/* ------------------------------------------------------------------
   Snapshot builders by service type
-------------------------------------------------------------------*/
const buildSnapshot = (project: Project) => {
  switch (project.service_type) {
    case "Tax Return": {
      const today = new Date();
      const currentYear = today.getFullYear();
      let nextDeadline = new Date(`${currentYear}-04-15T00:00:00`);
      if (nextDeadline < today) {
        nextDeadline = new Date(`${currentYear + 1}-04-15T00:00:00`);
      }
      const days = differenceInDays(nextDeadline, today);
      return [
        { label: "Docs", value: project.docs.length.toString() },
        { label: "Days to 4/15", value: days.toString() },
      ];
    }
    case "Audit": {
      const openTasks = project.tasks.filter((t) => t.status !== "completed").length;
      return [
        {
          label: "Open Tasks",
          value: `${openTasks}/${project.tasks.length}`,
        },
        { label: "Docs", value: project.docs.length.toString() },
      ];
    }
    case "Bookkeeping": {
      const dueSoon = project.tasks.filter((t) => {
        return (
          t.deadline &&
          differenceInDays(new Date(t.deadline), new Date()) <= 7 &&
          t.status !== "completed"
        );
      }).length;
      return [
        { label: "Due ≤7d", value: dueSoon.toString() },
        {
          label: "Tasks",
          value: `${project.tasks.filter((t) => t.status !== "completed").length}`,
        },
      ];
    }
    default: {
      return [
        { label: "Docs", value: project.docs.length.toString() },
        {
          label: "Tasks",
          value: `${
            project.tasks.filter((t) => t.status !== "completed").length
          }/${project.tasks.length}`,
        },
      ];
    }
  }
};

/* ------------------------------------------------------------------
   Linear progress tracker (same visual as dashboard)
-------------------------------------------------------------------*/
const StatusTracker: React.FC<{ status: string }> = ({ status }) => {
  const stages = PROJECT_STATUSES;
  const currentIndex = stages.indexOf(status);
  return (
    <div className="space-y-1">
      <div className="flex items-center space-x-1">
        {stages.map((stage, idx) => {
          const isCompleted = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          return (
            <div
              key={stage}
              className={`h-2 flex-1 rounded-sm ${
                isCompleted
                  ? isCurrent
                    ? "bg-primary"
                    : "bg-primary/60"
                  : "bg-muted"
              }`}
            />
          );
        })}
      </div>
      <div className="text-xs text-muted-foreground">
        {status} ({currentIndex + 1}/{stages.length})
      </div>
    </div>
  );
};

// Helper to determine color for riskBadge
function determineRiskBadgeColor(riskScore: number): string {
  if (riskScore > 70) {
    return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
  } else if (riskScore > 40) {
    return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
  }
  return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
}

/* ------------------------------------------------------------------
   Main component
-------------------------------------------------------------------*/
const EnhancedProjectCard: React.FC<EnhancedProjectCardProps> = ({
  project,
  viewMode,
  onStatusChange,
  staffMembers,
  projectStatuses = PROJECT_STATUSES,
  riskScore,
}) => {
  const snapshot = buildSnapshot(project);

  // Staff listing
  const StaffSection = (
    <div className="text-sm">
      <p className="text-muted-foreground mb-1">Assigned to:</p>
      <div className="flex flex-wrap gap-1">
        {project.assigned_staff && project.assigned_staff.length > 0 ? (
          project.assigned_staff.map((sid) => {
            const role = project.staff_roles?.[sid] || "staff";
            let roleBadge = null;
            if (role === "point_of_contact") {
              roleBadge = (
                <Badge className="ml-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                  Contact
                </Badge>
              );
            } else if (role === "partner_assigned") {
              roleBadge = (
                <Badge className="ml-1 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                  Partner
                </Badge>
              );
            }
            return (
              <div key={sid} className="flex items-center">
                <Badge variant="outline">{getStaffName(sid, staffMembers)}</Badge>
                {roleBadge}
              </div>
            );
          })
        ) : (
          <span className="text-muted-foreground text-xs">No staff assigned</span>
        )}
      </div>
    </div>
  );

  // Snapshot row (docs, tasks, etc.)
  const SnapshotSection = (
    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
      {snapshot.map((item) => (
        <div key={item.label} className="flex items-center gap-1">
          <span className="font-medium text-foreground">{item.value}</span>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );

  /* ------------------------- GRID VIEW --------------------------*/
  if (viewMode === "grid") {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-2">
              <div className="mt-0.5">{getServiceIcon(project.service_type)}</div>
              <div>
                <CardTitle>{project.client_name}</CardTitle>
                <CardDescription>
                  Project #{project.id} • {project.service_type}
                </CardDescription>
              </div>
            </div>
            {/* Status + risk side by side */}
            <div className="flex flex-wrap items-center gap-2">
              {renderStatusBadge(project.status)}
              {/* Show compact risk badge (e.g. "80%") if riskScore is provided */}
              {riskScore !== undefined && (
                <Badge
                  className={`${determineRiskBadgeColor(riskScore)} px-1.5 py-0.5 text-[10px]`}
                >
                  {riskScore}%
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pb-2">
          <StatusTracker status={project.status} />
          {SnapshotSection}
          {StaffSection}

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>{project.docs.length} docs</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>{project.messages.length} msgs</span>
            </div>
            <div className="flex items-center gap-1">
              <Check className="h-4 w-4" />
              <span>
                {project.tasks.filter((t) => t.status === "completed").length}/{project.tasks.length} tasks
              </span>
            </div>
          </div>

          <Separator />
          <Select
            defaultValue={project.status}
            onValueChange={(value) => onStatusChange(project.id, value)}
          >
            <SelectTrigger className="h-8 w-full text-xs">
              <SelectValue placeholder="Update Status" />
            </SelectTrigger>
            <SelectContent>
              {projectStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>

        <CardFooter className="flex flex-wrap gap-2 pt-2">
          <Link href={`/project/${project.id}`} className="w-full">
            <Button variant="default" size="sm" className="w-full gap-1">
              <ChevronRight className="h-3 w-3" />
              View Project
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  /* ------------------------- LIST VIEW --------------------------*/
  return (
    <Card className="flex flex-col md:flex-row items-stretch overflow-hidden">
      <div className="flex-shrink-0 p-4 flex flex-col justify-between md:w-64 border-b md:border-b-0 md:border-r">
        <div className="flex items-start gap-2">
          {getServiceIcon(project.service_type)}
          <div>
            <CardTitle className="text-base leading-tight">
              {project.client_name}
            </CardTitle>
            <CardDescription className="text-xs">
              #{project.id} • {project.service_type}
            </CardDescription>
          </div>
        </div>
        {/* Status + risk side by side */}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {renderStatusBadge(project.status)}
          {riskScore !== undefined && (
            <Badge
              className={`${determineRiskBadgeColor(riskScore)} px-1.5 py-0.5 text-[10px]`}
            >
              {riskScore}%
            </Badge>
          )}
        </div>
      </div>

      <div className="flex-1 p-4 space-y-2">
        <StatusTracker status={project.status} />
        {SnapshotSection}
        {StaffSection}
      </div>

      <div className="flex flex-col justify-between p-4 border-t md:border-t-0 md:border-l gap-2 w-full md:w-48">
        <Select
          defaultValue={project.status}
          onValueChange={(value) => onStatusChange(project.id, value)}
        >
          <SelectTrigger className="h-8 w-full text-xs">
            <SelectValue placeholder="Update Status" />
          </SelectTrigger>
          <SelectContent>
            {projectStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Link href={`/project/${project.id}`} className="w-full">
          <Button variant="outline" size="sm" className="w-full gap-1">
            <ChevronRight className="h-3 w-3" />
            View
          </Button>
        </Link>
      </div>
    </Card>
  );
};

export default EnhancedProjectCard;
