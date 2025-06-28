"use client";

import React, { useState } from "react";
import { DndContext, useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Move, Table } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface TaskLite {
  id: string;
  title: string;
  status: "pending" | "in_progress" | "blocked" | "completed";
  projectId: number;
  projectName: string;
  service: string;
  assignees?: string[];
  deadline?: string;
  hoursLogged?: number;
  // For demo: a placeholder for “time in status” or “time started”
  timeInStatus?: string;
}

interface Props {
  tasks: TaskLite[];
  defaultView?: "kanban" | "list";
}

/* -------------------------------------------------------------------------- */
/*  Constants & helpers                                                      */
/* -------------------------------------------------------------------------- */

const STATUS_COLS = ["pending", "in_progress", "blocked", "completed"] as const;

/** Group tasks by project ID, for each column */
function groupByProject(tasks: TaskLite[]): Record<number, TaskLite[]> {
  const projMap: Record<number, TaskLite[]> = {};
  for (const t of tasks) {
    if (!projMap[t.projectId]) {
      projMap[t.projectId] = [];
    }
    projMap[t.projectId].push(t);
  }
  return projMap;
}

/* -------------------------------------------------------------------------- */
/*  Kanban draggable card                                                    */
/* -------------------------------------------------------------------------- */
function KanbanCard({ task }: { task: TaskLite }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // color coding
  const color =
    task.status === "completed"
      ? "bg-green-100 dark:bg-green-900/30"
      : task.status === "in_progress"
      ? "bg-blue-100 dark:bg-blue-900/30"
      : task.status === "blocked"
      ? "bg-red-100 dark:bg-red-900/30"
      : "bg-yellow-100 dark:bg-yellow-900/30";

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`mb-2 cursor-grab ${color}`}
    >
      <CardContent className="p-3 space-y-1">
        <div className="text-sm font-medium">{task.title}</div>
        <div className="text-xs text-muted-foreground">
          #{task.projectId} - {task.projectName}
        </div>
        {/* Assigned staff */}
        {task.assignees?.length ? (
          <div className="text-xs">
            <span className="text-muted-foreground">Assignees:</span>{" "}
            {task.assignees.join(", ")}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">No assignee</div>
        )}
        {/* Deadline */}
        {task.deadline && (
          <Badge variant="outline" className="mt-1">
            Due {new Date(task.deadline).toLocaleDateString()}
          </Badge>
        )}
        {/* Hours */}
        <div className="text-xs text-muted-foreground">
          Hours: {task.hoursLogged?.toFixed(1) ?? 0}
        </div>
        {/* Time in status placeholder */}
        {task.timeInStatus && (
          <div className="text-[10px] text-amber-600">
            {task.timeInStatus} in {task.status} status
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Kanban sub-block for a single project within a column                    */
/* -------------------------------------------------------------------------- */
function ProjectKanbanBlock({ projectId, tasks }: { projectId: number; tasks: TaskLite[] }) {
  // We want to show a sub-heading for the project
  const projectName = tasks[0]?.projectName ?? `Project ${projectId}`;
  return (
    <div className="mb-4">
      <div className="text-xs font-semibold text-muted-foreground mb-1">
        {projectName} (#{projectId})
      </div>
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        {tasks.map((t) => (
          <KanbanCard key={t.id} task={t} />
        ))}
      </SortableContext>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Kanban column                                                             */
/* -------------------------------------------------------------------------- */
function KanbanColumn({
  columnId,
  tasks,
}: {
  columnId: string;
  tasks: TaskLite[];
}) {
  const { setNodeRef } = useDroppable({ id: columnId });

  // Group tasks in this column by project
  const grouped = groupByProject(tasks);

  return (
    <div ref={setNodeRef} className="bg-muted/30 rounded-lg p-3">
      <h3 className="font-semibold text-xs mb-3 uppercase tracking-wide">
        {columnId.replace("_", " ").toUpperCase()} ({tasks.length})
      </h3>
      {/* For each project in this column, show a sub-block */}
      {Object.entries(grouped).map(([pid, pTasks]) => (
        <ProjectKanbanBlock
          key={pid}
          projectId={Number(pid)}
          tasks={pTasks}
        />
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Board                                                                */
/* -------------------------------------------------------------------------- */
export default function FirmTaskBoard({ tasks, defaultView = "kanban" }: Props) {
  const [view, setView] = useState<"kanban" | "list">(defaultView);

  // Prepare columns: we partition tasks by status, then by project
  const [columns, setColumns] = useState<Record<string, TaskLite[]>>(() => {
    const colMap: Record<string, TaskLite[]> = {
      pending: [],
      in_progress: [],
      blocked: [],
      completed: [],
    };
    tasks.forEach((t) => {
      colMap[t.status].push(t);
    });
    return colMap;
  });

  /** DnD onDragEnd for the Kanban */
  function handleDragEnd(event: any) {
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;

    // figure out origin/dest
    let originCol = "";
    let destCol = "";
    for (const col of STATUS_COLS) {
      if (columns[col].some((t) => t.id === active.id)) {
        originCol = col;
      }
      if (columns[col].some((t) => t.id === over.id)) {
        destCol = col;
      }
    }
    if (!originCol || !destCol) return;

    if (originCol === destCol) {
      // reorder within same column
      const oldIndex = columns[originCol].findIndex((t) => t.id === active.id);
      const newIndex = columns[destCol].findIndex((t) => t.id === over.id);
      setColumns((prev) => ({
        ...prev,
        [originCol]: arrayMove(prev[originCol], oldIndex, newIndex),
      }));
    } else {
      // move from one column to another
      const movingTask = columns[originCol].find((t) => t.id === active.id);
      if (!movingTask) return;
      movingTask.status = destCol; // local update
      setColumns((prev) => ({
        ...prev,
        [originCol]: prev[originCol].filter((t) => t.id !== active.id),
        [destCol]: [movingTask, ...prev[destCol]],
      }));
      // (TODO: persist patch if needed)
    }
  }

  /* ------------------------------------------------------------------------ */
  /*  If list view => group tasks by project, then list each project’s tasks  */
  /* ------------------------------------------------------------------------ */
  if (view === "list") {
    // Flatten all tasks from each column
    const all = Object.values(columns).flat();

    // group by project
    const grouped = groupByProject(all);

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Project Task List</CardTitle>
          <div className="flex gap-2">
            <Button size="icon" variant="ghost" onClick={() => setView("kanban")}>
              <Move className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={() => alert("TODO: Calendar sync...")}
            >
              <Calendar className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {Object.entries(grouped).map(([pid, pTasks]) => (
            <div key={pid} className="mb-6">
              <h3 className="font-semibold text-sm mb-2">
                Project #{pid} - {pTasks[0]?.projectName ?? "Unknown"}
              </h3>
              <table className="w-full mb-4 border text-sm">
                <thead>
                  <tr className="bg-muted/20">
                    <th className="p-2 text-left">Task</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-left">Assignees</th>
                    <th className="p-2 text-left">Deadline</th>
                    <th className="p-2 text-right">Hours</th>
                    <th className="p-2 text-right">Time in Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pTasks.map((task) => (
                    <tr key={task.id} className="border-b last:border-0">
                      <td className="p-2">{task.title}</td>
                      <td className="p-2 capitalize">{task.status}</td>
                      <td className="p-2">
                        {task.assignees?.length ? task.assignees.join(", ") : "—"}
                      </td>
                      <td className="p-2">
                        {task.deadline
                          ? new Date(task.deadline).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="p-2 text-right">
                        <input
                          type="number"
                          step="0.25"
                          defaultValue={task.hoursLogged ?? 0}
                          className="w-16 bg-transparent focus:outline-none text-right"
                          onBlur={(e) => {
                            const val = parseFloat(e.target.value);
                            task.hoursLogged = isNaN(val) ? 0 : val;
                          }}
                        />
                      </td>
                      <td className="p-2 text-right text-xs text-muted-foreground">
                        {task.timeInStatus ?? "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  /* ------------------------------------------------------------------------ */
  /*  Otherwise, Kanban view (group by status, then sub-group by project)     */
  /* ------------------------------------------------------------------------ */
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Project Kanban Board</CardTitle>
        <div className="flex gap-2">
          <Button size="icon" variant="ghost" onClick={() => setView("list")}>
            <Table className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={() => alert("TODO: Calendar sync...")}
          >
            <Calendar className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <DndContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 min-w-[900px]">
            {STATUS_COLS.map((colId) => (
              <KanbanColumn
                key={colId}
                columnId={colId}
                tasks={columns[colId]}
              />
            ))}
          </div>
        </DndContext>
      </CardContent>
    </Card>
  );
}
