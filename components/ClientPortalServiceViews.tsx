"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/components/ui/use-toast";
import {
  BarChart,
  Clock,
  Calendar as CalendarIcon,
  CheckCircle2,
  FilePlus2,
  FileCheck,
  FileText,
  AlertCircle,
  ExternalLink,
  BarChart3,
  FileSpreadsheet,
  RefreshCw,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  HelpCircle,
  Share2,
  Wrench,
  MessageCircle,
  CopyPlus,
  Receipt,
  Calculator,
  Download,
  X,
  Check,
  XCircle,
  MessageSquare,
} from "lucide-react";
import { format, differenceInDays, isBefore } from "date-fns";

/* --------------------------------------------------------------------------
   NEW IMPORT: Unified Timeline replaces the old WorkflowProgressBar
-------------------------------------------------------------------------- */
import UnifiedProjectTimeline from "@/components/UnifiedProjectTimeline";

/* --------------------------------------------------------------------------
   Define the workflow task interface for UnifiedProjectTimeline
-------------------------------------------------------------------------- */
interface WorkflowTask {
  id: string | number;
  name?: string;
  status: "pending" | "in_progress" | "blocked" | "completed";
  deadline?: string;
}

/* --------------------------------------------------------------------------
   Define your Project interface if needed. For example:
-------------------------------------------------------------------------- */
interface Project {
  id: number | string;
  client_name: string;
  service_type: string;
  status: string;
}

/* --------------------------------------------------------------------------
   Props for the main ClientPortalServiceViews component
-------------------------------------------------------------------------- */
interface ClientPortalServiceViewsProps {
  project: Project;
  onUpdateStatus: (s: string) => Promise<void>;
  onTasksChange?: (tasks: WorkflowTask[]) => void;
  onSignLetter?: () => void; // For the engagement-letter CTA
}

/* --------------------------------------------------------------------------
   Helper function to compute days remaining
-------------------------------------------------------------------------- */
const calculateDaysRemaining = (deadline: string | Date | undefined) => {
  if (!deadline) return null;
  const today = new Date();
  const deadlineDate = typeof deadline === "string" ? new Date(deadline) : deadline;
  return differenceInDays(deadlineDate, today);
};

/* ==========================================================================
   1. TAX RETURN VIEW
========================================================================== */
type TaxReturnViewProps = {
  project: Project;
  onUpdateStatus: (status: string) => Promise<void>;
  onTasksChange?: (tasks: WorkflowTask[]) => void;
};

const TaxReturnView: React.FC<TaxReturnViewProps> = ({
  project,
  onUpdateStatus,
  onTasksChange,
}) => {
  const { toast } = useToast();
  const [taxDeadline, setTaxDeadline] = useState("2025-04-15"); // Default
  const [returnStatus, setReturnStatus] = useState(project?.status || "Docs Requested");
  const [missingDocs, setMissingDocs] = useState([
    { id: 1, name: "W-2", status: "missing" },
    { id: 2, name: "1099-INT", status: "received" },
    { id: 3, name: "1098 Mortgage Interest", status: "missing" },
    { id: 4, name: "Charitable Donations", status: "missing" },
  ]);
  const [eFileStatus, setEFileStatus] = useState({
    status: "not_started", // not_started, submitted, accepted, rejected
    submissionDate: null as string | null,
    rejectionReason: null as string | null,
  });

  // Days until tax deadline
  const daysRemaining = calculateDaysRemaining(taxDeadline);

  // Update doc status
  const updateDocStatus = (docId: number, newStatus: string) => {
    setMissingDocs((prev) =>
      prev.map((doc) => (doc.id === docId ? { ...doc, status: newStatus } : doc))
    );
    toast({
      title: "Document status updated",
      description: "The document status has been updated successfully.",
    });
  };

  // E-file status change
  const handleEFileStatusChange = (status: string) => {
    setEFileStatus((prev) => ({
      ...prev,
      status,
      submissionDate: status === "submitted" ? new Date().toISOString() : prev.submissionDate,
    }));
  };

  // E-file rejection reason
  const handleRejectionReason = (reason: string) => {
    setEFileStatus((prev) => ({
      ...prev,
      rejectionReason: reason,
    }));
  };

  /* ------------------------------------------------------------------------
     Build tasks for the UnifiedProjectTimeline
  ------------------------------------------------------------------------ */
  function mapTaxTasks(): WorkflowTask[] {
    const docTasks = missingDocs.map((doc) => ({
      id: `doc-${doc.id}`,
      name: doc.name,
      deadline: taxDeadline,
      status: doc.status === "received" ? "completed" : "pending",
    }));

    const eFileTask: WorkflowTask = {
      id: "efile",
      name: "e-File Submission",
      deadline: taxDeadline,
      status:
        eFileStatus.status === "accepted"
          ? "completed"
          : eFileStatus.status === "rejected"
          ? "blocked"
          : eFileStatus.status === "submitted"
          ? "in_progress"
          : "pending",
    };

    return [...docTasks, eFileTask];
  }

  // Whenever data that affects tasks changes, notify parent
  useEffect(() => {
    onTasksChange?.(mapTaxTasks());
  }, [missingDocs, eFileStatus, taxDeadline]);

  return (
    <div className="space-y-6">
      {/* Unified Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-primary" />
            Tax Workflow Progress
          </CardTitle>
          <CardDescription>
            Progress based on missing docs + e-file statuses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UnifiedProjectTimeline projectStatus={returnStatus} tasks={mapTaxTasks()} />
        </CardContent>
      </Card>

      {/* Tax deadline countdown */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center">
            <Clock className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
            Tax Deadline Countdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-2xl text-blue-700 dark:text-blue-400">
                  {daysRemaining} days
                </h3>
                <p className="text-sm text-blue-600 dark:text-blue-500">
                  until {format(new Date(taxDeadline), "MMMM d, yyyy")}
                </p>
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Change Date
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={new Date(taxDeadline)}
                    onSelect={(date) =>
                      setTaxDeadline(format(date as Date, "yyyy-MM-dd"))
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Progress
              value={Math.max(0, 100 - ((daysRemaining ?? 0) / 120) * 100)}
              className="h-2 bg-blue-100 dark:bg-blue-900"
            />

            {daysRemaining !== null && daysRemaining < 30 && (
              <div className="flex items-center text-amber-600 dark:text-amber-400 text-sm mt-2">
                <AlertCircle className="h-4 w-4 mr-1" />
                <span>Less than 30 days remaining until the deadline!</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Return status board */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <FileCheck className="h-5 w-5 mr-2 text-primary" />
            Return Status Board
          </CardTitle>
          <CardDescription>Current status of tax return preparation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Current status update */}
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-sm font-medium">Current Status</span>
                <Badge className="w-fit mt-1">{returnStatus}</Badge>
              </div>

              <Select
                value={returnStatus}
                onValueChange={(value) => {
                  setReturnStatus(value);
                  if (onUpdateStatus) {
                    onUpdateStatus(value);
                  }
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Update Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Not Started">Not Started</SelectItem>
                  <SelectItem value="Docs Requested">Docs Requested</SelectItem>
                  <SelectItem value="Docs Received">Docs Received</SelectItem>
                  <SelectItem value="In Preparation">In Preparation</SelectItem>
                  <SelectItem value="In Review">In Review</SelectItem>
                  <SelectItem value="Ready for Filing">Ready for Filing</SelectItem>
                  <SelectItem value="Filed">Filed</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Linear progress steps */}
            <div>
              <h4 className="text-sm font-medium mb-2">Return Progress</h4>
              <div className="relative">
                <div className="absolute left-0 top-1/2 h-0.5 w-full bg-muted -translate-y-1/2" />
                <div className="relative flex justify-between">
                  {[
                    "Not Started",
                    "Docs Received",
                    "In Preparation",
                    "In Review",
                    "Filed",
                  ].map((status, index) => {
                    const statusMap: Record<string, number> = {
                      "Not Started": 0,
                      "Docs Requested": 1,
                      "Docs Received": 2,
                      "In Preparation": 3,
                      "In Review": 4,
                      "Ready for Filing": 5,
                      Filed: 6,
                      Completed: 7,
                    };

                    const currentIndex = statusMap[returnStatus] || 0;
                    const statusIndex = statusMap[status] || 0;
                    const isActive = currentIndex === statusIndex;
                    const isCompleted = currentIndex > statusIndex;

                    return (
                      <div key={status} className="flex flex-col items-center">
                        <div
                          className={`h-6 w-6 rounded-full flex items-center justify-center z-10
                            ${
                              isActive
                                ? "bg-primary text-primary-foreground"
                                : isCompleted
                                ? "bg-primary/80 text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <span className="text-xs">{index + 1}</span>
                          )}
                        </div>
                        <span
                          className={`mt-2 text-xs max-w-[70px] text-center ${
                            isActive ? "font-semibold" : ""
                          }`}
                        >
                          {status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Missing document tracker */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <FilePlus2 className="h-5 w-5 mr-2 text-primary" />
            Missing Document Tracker
          </CardTitle>
          <CardDescription>Track missing and received client documents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {missingDocs.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={doc.status === "received" ? "default" : "outline"}
                        className={
                          doc.status === "received"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                        }
                      >
                        {doc.status === "received" ? "Received" : "Missing"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          updateDocStatus(
                            doc.id,
                            doc.status === "received" ? "missing" : "received"
                          )
                        }
                      >
                        {doc.status === "received" ? "Mark Missing" : "Mark Received"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Button variant="outline" size="sm" className="w-full gap-2">
              <FileText className="h-4 w-4" />
              Add Document
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* e-File status tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <Share2 className="h-5 w-5 mr-2 text-primary" />
            e-File Status Tracking
          </CardTitle>
          <CardDescription>Monitor e-File submission status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="efile-status">Current e-File Status</Label>
              <Select
                value={eFileStatus.status}
                onValueChange={handleEFileStatusChange}
                // Lock out e-file changes unless the return is truly ready
                disabled={
                  returnStatus !== "Ready for Filing" &&
                  returnStatus !== "Filed" &&
                  eFileStatus.status === "not_started"
                }
              >
                <SelectTrigger id="efile-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {eFileStatus.submissionDate && (
              <div>
                <Label className="text-sm text-muted-foreground">Submission Date</Label>
                <p className="font-medium">
                  {format(new Date(eFileStatus.submissionDate), "MMMM d, yyyy")}
                </p>
              </div>
            )}

            {eFileStatus.status === "rejected" && (
              <div className="space-y-2">
                <Label htmlFor="rejection-reason">Rejection Reason</Label>
                <Input
                  id="rejection-reason"
                  value={eFileStatus.rejectionReason || ""}
                  onChange={(e) => handleRejectionReason(e.target.value)}
                  placeholder="Enter rejection reason"
                />

                <div className="p-3 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800 dark:text-amber-400">
                        Rejection Detected
                      </p>
                      <p className="text-sm text-amber-700 dark:text-amber-500">
                        Your e-File submission was rejected. Please fix the issues and resubmit.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {eFileStatus.status === "accepted" && (
              <div className="p-3 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500 mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-400">Accepted</p>
                    <p className="text-sm text-green-700 dark:text-green-500">
                      Your e-File has been accepted. No further action required.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/* ==========================================================================
   2. AUDIT VIEW
========================================================================== */
type AuditViewProps = {
  project: Project;
  onUpdateStatus: (s: string) => Promise<void>;
  onTasksChange?: (tasks: WorkflowTask[]) => void;
};

const AuditView: React.FC<AuditViewProps> = ({ project, onUpdateStatus, onTasksChange }) => {
  const { toast } = useToast();
  const [auditStatus, setAuditStatus] = useState(project?.status || "Planning");
  const [riskAssessment, setRiskAssessment] = useState({
    financialStatementRisk: "medium",
    internalControlRisk: "high",
    fraudRisk: "low",
    overallRisk: "medium",
  });

  // PBC list
  const [pbcItems, setPbcItems] = useState([
    { id: 1, item: "Trial Balance", status: "received", dueDate: "2025-05-15" },
    { id: 2, item: "Bank Statements", status: "received", dueDate: "2025-05-15" },
    { id: 3, item: "AR Aging", status: "pending", dueDate: "2025-05-20" },
    { id: 4, item: "Inventory Listing", status: "pending", dueDate: "2025-05-20" },
    { id: 5, item: "Fixed Asset Register", status: "pending", dueDate: "2025-05-25" },
  ]);

  const [samplingMethod, setSamplingMethod] = useState("statistical");
  const [sampleSize, setSampleSize] = useState(25);

  const [findings, setFindings] = useState([
    {
      id: 1,
      description: "Missing invoice approvals",
      severity: "medium",
      status: "open",
      managementResponse: "",
      remediation: "",
    },
    {
      id: 2,
      description: "Bank reconciliation errors",
      severity: "high",
      status: "open",
      managementResponse: "",
      remediation: "",
    },
  ]);

  // Update PBC item status
  const updatePbcStatus = (itemId: number, newStatus: string) => {
    setPbcItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, status: newStatus } : item))
    );
    toast({
      title: "PBC item updated",
      description: "The PBC item status has been updated successfully.",
    });
  };

  // Update finding status
  const updateFindingStatus = (findingId: number, newStatus: string) => {
    setFindings((prev) =>
      prev.map((f) => (f.id === findingId ? { ...f, status: newStatus } : f))
    );
    toast({
      title: "Finding updated",
      description: "The finding status has been updated successfully.",
    });
  };

  /* ------------------------------------------------------------------------
     Build tasks from PBC items + open findings
  ------------------------------------------------------------------------ */
  function mapAuditTasks(): WorkflowTask[] {
    const pbcTasks = pbcItems.map((pbc) => ({
      id: `pbc-${pbc.id}`,
      name: pbc.item,
      deadline: pbc.dueDate,
      status: pbc.status === "received" ? "completed" : "pending",
    }));
    const findingTasks = findings.map((f) => ({
      id: `finding-${f.id}`,
      name: f.description,
      deadline: undefined,
      status: f.status === "open" ? "in_progress" : "completed",
    }));
    return [...pbcTasks, ...findingTasks];
  }

  useEffect(() => {
    onTasksChange?.(mapAuditTasks());
  }, [pbcItems, findings]);

  // Simple timeline data for a Gantt-like chart
  const timelineData = [
    { id: 1, task: "Planning", start: "2025-05-01", end: "2025-05-15", status: "completed" },
    { id: 2, task: "Risk Assessment", start: "2025-05-10", end: "2025-05-25", status: "in_progress" },
    { id: 3, task: "Fieldwork", start: "2025-05-20", end: "2025-06-15", status: "pending" },
    { id: 4, task: "Draft Report", start: "2025-06-15", end: "2025-06-30", status: "pending" },
    { id: 5, task: "Review", start: "2025-07-01", end: "2025-07-15", status: "pending" },
    { id: 6, task: "Final Report", start: "2025-07-15", end: "2025-07-31", status: "pending" },
  ];

  return (
    <div className="space-y-6">
      {/* Unified Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Audit Workflow Progress
          </CardTitle>
          <CardDescription>PBC items + open findings as tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <UnifiedProjectTimeline projectStatus={auditStatus} tasks={mapAuditTasks()} />
        </CardContent>
      </Card>

      {/* Simple "Audit Timeline" Gantt */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <CalendarIcon className="h-5 w-5 mr-2 text-primary" />
            Audit Timeline
          </CardTitle>
          <CardDescription>Visual schedule of audit activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {timelineData.map((item) => {
              const startDate = new Date(item.start);
              const endDate = new Date(item.end);
              const today = new Date();

              // For simplistic Gantt calculations
              const startPos = new Date("2025-05-01");
              const endPos = new Date("2025-08-01");
              const totalDays = differenceInDays(endPos, startPos);

              const leftPos = (differenceInDays(startDate, startPos) / totalDays) * 100;
              const widthPerc = (differenceInDays(endDate, startDate) / totalDays) * 100;

              let statusColor = "bg-muted";
              if (item.status === "completed") {
                statusColor = "bg-green-500";
              } else if (item.status === "in_progress") {
                statusColor = "bg-blue-500";
              } else if (isBefore(today, startDate)) {
                statusColor = "bg-amber-500";
              }

              return (
                <div key={item.id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{item.task}</span>
                    <span className="text-muted-foreground">
                      {format(startDate, "MMM d")} - {format(endDate, "MMM d, yyyy")}
                    </span>
                  </div>

                  <div className="h-8 w-full bg-muted/30 rounded-sm relative">
                    <div
                      className={`absolute h-full rounded-sm ${statusColor}`}
                      style={{
                        left: `${leftPos}%`,
                        width: `${widthPerc}%`,
                      }}
                    ></div>

                    {/* Today marker */}
                    {isBefore(startDate, today) && isBefore(today, endDate) && (
                      <div
                        className="absolute w-0.5 h-full bg-red-500"
                        style={{
                          left: `${
                            (differenceInDays(today, startPos) / totalDays) * 100
                          }%`,
                        }}
                      ></div>
                    )}
                  </div>
                </div>
              );
            })}

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>May 2025</span>
              <span>June 2025</span>
              <span>July 2025</span>
              <span>August 2025</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Assessment Tracker */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-primary" />
            Risk Assessment Tracker
          </CardTitle>
          <CardDescription>Track key risk areas for the audit</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Financial Statement Risk</Label>
                <Select
                  value={riskAssessment.financialStatementRisk}
                  onValueChange={(value) =>
                    setRiskAssessment((prev) => ({
                      ...prev,
                      financialStatementRisk: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select risk level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Internal Control Risk</Label>
                <Select
                  value={riskAssessment.internalControlRisk}
                  onValueChange={(value) =>
                    setRiskAssessment((prev) => ({
                      ...prev,
                      internalControlRisk: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select risk level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fraud Risk</Label>
                <Select
                  value={riskAssessment.fraudRisk}
                  onValueChange={(value) =>
                    setRiskAssessment((prev) => ({ ...prev, fraudRisk: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select risk level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Overall Risk Assessment</Label>
                <Select
                  value={riskAssessment.overallRisk}
                  onValueChange={(value) =>
                    setRiskAssessment((prev) => ({ ...prev, overallRisk: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select risk level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-3 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start">
                <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-500 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800 dark:text-blue-400">
                    Risk Assessment Impact
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-500">
                    Your risk assessment determines the scope and focus of the audit
                    procedures. Higher risk areas require more extensive testing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PBC List Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <FileText className="h-5 w-5 mr-2 text-primary" />
            PBC List Management
          </CardTitle>
          <CardDescription>
            Track documents and information provided by client
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pbcItems.map((item) => {
                  const daysUntilDue = calculateDaysRemaining(item.dueDate);

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.item}</TableCell>
                      <TableCell>
                        <Badge
                          variant={item.status === "received" ? "default" : "outline"}
                          className={
                            item.status === "received"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                          }
                        >
                          {item.status === "received" ? "Received" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span
                            className={
                              item.status === "received"
                                ? "text-muted-foreground"
                                : daysUntilDue !== null && daysUntilDue < 0
                                ? "text-red-600 dark:text-red-400"
                                : daysUntilDue !== null && daysUntilDue < 5
                                ? "text-amber-600 dark:text-amber-400"
                                : ""
                            }
                          >
                            {format(new Date(item.dueDate), "MMM d, yyyy")}
                          </span>

                          {item.status !== "received" && daysUntilDue !== null && daysUntilDue < 0 && (
                            <Badge
                              variant="outline"
                              className="ml-2 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            >
                              Overdue
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            updatePbcStatus(
                              item.id,
                              item.status === "received" ? "pending" : "received"
                            )
                          }
                        >
                          {item.status === "received" ? "Mark Pending" : "Mark Received"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <Button variant="outline" size="sm" className="w-full gap-2">
              <FilePlus2 className="h-4 w-4" />
              Add PBC Item
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sampling Methodology */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <Calculator className="h-5 w-5 mr-2 text-primary" />
            Sampling Methodology
          </CardTitle>
          <CardDescription>Documentation of audit sampling approach</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sampling-method">Sampling Method</Label>
                <Select
                  id="sampling-method"
                  value={samplingMethod}
                  onValueChange={setSamplingMethod}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="statistical">Statistical</SelectItem>
                    <SelectItem value="judgmental">Judgmental</SelectItem>
                    <SelectItem value="random">Random</SelectItem>
                    <SelectItem value="systematic">Systematic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sample-size">Sample Size</Label>
                <Input
                  id="sample-size"
                  type="number"
                  value={sampleSize}
                  onChange={(e) => setSampleSize(parseInt(e.target.value) || 0)}
                  min="1"
                />
              </div>
            </div>

            <div className="p-3 rounded-md bg-muted">
              <h4 className="text-sm font-medium mb-1">Sampling Method Description</h4>
              <p className="text-sm text-muted-foreground">
                {samplingMethod === "statistical" &&
                  "Statistical sampling uses probability theory to select and evaluate audit evidence, providing a mathematical basis for conclusions."}
                {samplingMethod === "judgmental" &&
                  "Judgmental sampling relies on the auditor's professional judgment to select items when statistical methods aren't suitable."}
                {samplingMethod === "random" &&
                  "Random sampling gives every item an equal chance of selection, ensuring unbiased coverage of the population."}
                {samplingMethod === "systematic" &&
                  "Systematic sampling selects items at a fixed interval after a random start, distributing sample selections evenly."}
              </p>
            </div>

            <Button variant="outline" size="sm" className="gap-2">
              <FileText className="h-4 w-4" />
              Generate Sampling Documentation
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Findings Register */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-base flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-primary" />
                Findings Register
              </CardTitle>
              <CardDescription>
                Track audit findings and management responses
              </CardDescription>
            </div>
            <Button size="sm" variant="outline" className="gap-2">
              <FilePlus2 className="h-4 w-4" />
              Add Finding
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {findings.map((finding) => (
              <div key={finding.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <div className="flex items-center">
                    <Badge
                      className={
                        finding.severity === "high"
                          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          : finding.severity === "medium"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                      }
                    >
                      {finding.severity.charAt(0).toUpperCase() + finding.severity.slice(1)}{" "}
                      Severity
                    </Badge>

                    <Badge variant="outline" className="ml-2">
                      {finding.status === "open" ? "Open" : "Closed"}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      updateFindingStatus(
                        finding.id,
                        finding.status === "open" ? "closed" : "open"
                      )
                    }
                  >
                    {finding.status === "open" ? "Close Finding" : "Reopen Finding"}
                  </Button>
                </div>

                <h4 className="font-medium">{finding.description}</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`management-response-${finding.id}`}>
                      Management Response
                    </Label>
                    <Input
                      id={`management-response-${finding.id}`}
                      value={finding.managementResponse}
                      onChange={(e) =>
                        setFindings((prev) =>
                          prev.map((f) =>
                            f.id === finding.id
                              ? { ...f, managementResponse: e.target.value }
                              : f
                          )
                        )
                      }
                      placeholder="Enter management response"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`remediation-${finding.id}`}>Remediation Status</Label>
                    <Input
                      id={`remediation-${finding.id}`}
                      value={finding.remediation}
                      onChange={(e) =>
                        setFindings((prev) =>
                          prev.map((f) =>
                            f.id === finding.id
                              ? { ...f, remediation: e.target.value }
                              : f
                          )
                        )
                      }
                      placeholder="Enter remediation status"
                    />
                  </div>
                </div>
              </div>
            ))}

            {findings.length === 0 && (
              <div className="text-center p-4 text-muted-foreground">
                No findings recorded yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/* ==========================================================================
   3. CAS (Client Accounting Services) VIEW
========================================================================== */
type CASViewProps = {
  project: Project;
  onUpdateStatus: (s: string) => Promise<void>;
  onTasksChange?: (tasks: WorkflowTask[]) => void;
};

const CASView: React.FC<CASViewProps> = ({ project, onUpdateStatus, onTasksChange }) => {
  const { toast } = useToast();
  const [casStatus, setCasStatus] = useState(project?.status || "Onboarding");

  const [recurringServices, setRecurringServices] = useState([
    {
      id: 1,
      service: "Bank Reconciliation",
      frequency: "monthly",
      lastCompleted: "2025-03-31",
      nextDue: "2025-04-30",
      status: "upcoming",
    },
    {
      id: 2,
      service: "Financial Statements",
      frequency: "monthly",
      lastCompleted: "2025-03-31",
      nextDue: "2025-04-30",
      status: "upcoming",
    },
    {
      id: 3,
      service: "Sales Tax Filing",
      frequency: "quarterly",
      lastCompleted: "2025-03-31",
      nextDue: "2025-06-30",
      status: "upcoming",
    },
    {
      id: 4,
      service: "Payroll Processing",
      frequency: "bi-weekly",
      lastCompleted: "2025-04-15",
      nextDue: "2025-04-30",
      status: "upcoming",
    },
  ]);

  const [financialMetrics, setFinancialMetrics] = useState({
    revenue: {
      current: 125000,
      previous: 110000,
      change: 13.6,
    },
    expenses: {
      current: 95000,
      previous: 90000,
      change: 5.6,
    },
    profit: {
      current: 30000,
      previous: 20000,
      change: 50,
    },
    cash: {
      current: 85000,
      previous: 75000,
      change: 13.3,
    },
  });

  const [statementOptions, setStatementOptions] = useState({
    includeBalanceSheet: true,
    includeIncomeStatement: true,
    includeCashFlow: true,
    includeNotes: false,
    periodEnd: format(new Date(), "yyyy-MM-dd"),
  });

  // Mark a service as completed
  const markServiceCompleted = (serviceId: number) => {
    setRecurringServices((prev) =>
      prev.map((service) => {
        if (service.id === serviceId) {
          let nextDue = new Date();
          if (service.frequency === "monthly") {
            nextDue.setMonth(nextDue.getMonth() + 1);
          } else if (service.frequency === "quarterly") {
            nextDue.setMonth(nextDue.getMonth() + 3);
          } else if (service.frequency === "bi-weekly") {
            nextDue.setDate(nextDue.getDate() + 14);
          }
          return {
            ...service,
            lastCompleted: format(new Date(), "yyyy-MM-dd"),
            nextDue: format(nextDue, "yyyy-MM-dd"),
            status: "completed",
          };
        }
        return service;
      })
    );
    toast({
      title: "Service marked as completed",
      description: "Service has been marked as completed and next due date updated.",
    });
  };

  const generateStatements = () => {
    toast({
      title: "Generating financial statements",
      description: "They will be available shortly.",
    });
    setTimeout(() => {
      toast({
        title: "Financial statements ready",
        description: "Statements have been generated successfully.",
      });
    }, 2000);
  };

  /* ------------------------------------------------------------------------
     Build tasks from recurring services
  ------------------------------------------------------------------------ */
  function mapCasTasks(): WorkflowTask[] {
    return recurringServices.map((svc) => {
      let status: "pending" | "in_progress" | "blocked" | "completed" = "pending";
      if (svc.status === "completed") {
        status = "completed";
      } else if (svc.status === "upcoming") {
        status = "in_progress"; // interpret "upcoming" as "in_progress"
      }
      return {
        id: `cas-svc-${svc.id}`,
        name: svc.service,
        deadline: svc.nextDue,
        status,
      };
    });
  }

  useEffect(() => {
    onTasksChange?.(mapCasTasks());
  }, [recurringServices]);

  return (
    <div className="space-y-6">
      {/* Unified Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            CAS Workflow Progress
          </CardTitle>
          <CardDescription>Recurring services as tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <UnifiedProjectTimeline projectStatus={casStatus} tasks={mapCasTasks()} />
        </CardContent>
      </Card>

      {/* Recurring Services Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <RefreshCw className="h-5 w-5 mr-2 text-primary" />
            Recurring Services Dashboard
          </CardTitle>
          <CardDescription>Track and manage recurring services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Last Completed</TableHead>
                  <TableHead>Next Due</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recurringServices.map((service) => {
                  const daysUntilDue = calculateDaysRemaining(service.nextDue);

                  return (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">{service.service}</TableCell>
                      <TableCell className="capitalize">{service.frequency}</TableCell>
                      <TableCell>
                        {format(new Date(service.lastCompleted), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span
                            className={
                              daysUntilDue !== null && daysUntilDue < 0
                                ? "text-red-600 dark:text-red-400"
                                : daysUntilDue !== null && daysUntilDue < 5
                                ? "text-amber-600 dark:text-amber-400"
                                : ""
                            }
                          >
                            {format(new Date(service.nextDue), "MMM d, yyyy")}
                          </span>

                          {daysUntilDue !== null && daysUntilDue < 0 && (
                            <Badge
                              variant="outline"
                              className="ml-2 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            >
                              Overdue
                            </Badge>
                          )}

                          {daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue < 5 && (
                            <Badge
                              variant="outline"
                              className="ml-2 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                            >
                              Due Soon
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markServiceCompleted(service.id)}
                        >
                          Mark Completed
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <Button variant="outline" size="sm" className="w-full gap-2">
              <RefreshCw className="h-4 w-4" />
              Add Recurring Service
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Financial Metrics Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <BarChart className="h-5 w-5 mr-2 text-primary" />
            Financial Metrics
          </CardTitle>
          <CardDescription>Key financial metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(financialMetrics).map(([key, data]) => (
              <Card key={key} className="border">
                <CardContent className="p-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground capitalize">{key}</p>
                    <p className="text-2xl font-bold">${data.current.toLocaleString()}</p>
                    <div className="flex items-center text-xs">
                      {data.change >= 0 ? (
                        <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                      )}
                      <span className={data.change >= 0 ? "text-green-600" : "text-red-600"}>
                        {data.change >= 0 ? "+" : ""}
                        {data.change}%
                      </span>
                      <span className="text-muted-foreground ml-1">vs previous</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Financial Statement Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <FileSpreadsheet className="h-5 w-5 mr-2 text-primary" />
            Financial Statement Generator
          </CardTitle>
          <CardDescription>Generate financial statements for the client</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            <div className="space-y-4">
              {/* Statement options */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="balance-sheet"
                    checked={statementOptions.includeBalanceSheet}
                    onCheckedChange={(checked) =>
                      setStatementOptions((prev) => ({ ...prev, includeBalanceSheet: !!checked }))
                    }
                  />
                  <Label htmlFor="balance-sheet" className="cursor-pointer">
                    Balance Sheet
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="income-statement"
                    checked={statementOptions.includeIncomeStatement}
                    onCheckedChange={(checked) =>
                      setStatementOptions((prev) => ({
                        ...prev,
                        includeIncomeStatement: !!checked,
                      }))
                    }
                  />
                  <Label htmlFor="income-statement" className="cursor-pointer">
                    Income Statement
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="cash-flow"
                    checked={statementOptions.includeCashFlow}
                    onCheckedChange={(checked) =>
                      setStatementOptions((prev) => ({ ...prev, includeCashFlow: !!checked }))
                    }
                  />
                  <Label htmlFor="cash-flow" className="cursor-pointer">
                    Cash Flow
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="notes"
                    checked={statementOptions.includeNotes}
                    onCheckedChange={(checked) =>
                      setStatementOptions((prev) => ({ ...prev, includeNotes: !!checked }))
                    }
                  />
                  <Label htmlFor="notes" className="cursor-pointer">
                    Notes to Financials
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="period-end-date">Period End Date</Label>
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="period-end-date"
                        variant="outline"
                        className="w-[240px] justify-start text-left"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {statementOptions.periodEnd
                          ? format(new Date(statementOptions.periodEnd), "MMMM d, yyyy")
                          : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={new Date(statementOptions.periodEnd)}
                        onSelect={(date) =>
                          setStatementOptions((prev) => ({
                            ...prev,
                            periodEnd: format(date as Date, "yyyy-MM-dd"),
                          }))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <Select defaultValue="monthly">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select period type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Button
              onClick={generateStatements}
              disabled={
                !statementOptions.includeBalanceSheet &&
                !statementOptions.includeIncomeStatement &&
                !statementOptions.includeCashFlow
              }
              className="gap-2 w-full"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Generate Financial Statements
            </Button>
          </div>

          <div className="mt-4 rounded-md bg-muted p-3">
            <h4 className="text-sm font-medium mb-1">Previously Generated Statements</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <FileSpreadsheet className="h-4 w-4 text-muted-foreground mr-2" />
                  <span>March 2025 Financial Statements</span>
                </div>
                <Button variant="ghost" size="sm" className="gap-1 h-6">
                  <Download className="h-3 w-3" />
                  Download
                </Button>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <FileSpreadsheet className="h-4 w-4 text-muted-foreground mr-2" />
                  <span>February 2025 Financial Statements</span>
                </div>
                <Button variant="ghost" size="sm" className="gap-1 h-6">
                  <Download className="h-3 w-3" />
                  Download
                </Button>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <FileSpreadsheet className="h-4 w-4 text-muted-foreground mr-2" />
                  <span>January 2025 Financial Statements</span>
                </div>
                <Button variant="ghost" size="sm" className="gap-1 h-6">
                  <Download className="h-3 w-3" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client Invoice Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <Receipt className="h-5 w-5 mr-2 text-primary" />
            Client Invoice Management
          </CardTitle>
          <CardDescription>Track and manage client invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">INV-2025-0042</TableCell>
                  <TableCell>{format(new Date("2025-04-01"), "MMM d, yyyy")}</TableCell>
                  <TableCell>$1,250.00</TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      Paid
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">INV-2025-0035</TableCell>
                  <TableCell>{format(new Date("2025-03-01"), "MMM d, yyyy")}</TableCell>
                  <TableCell>$1,250.00</TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      Paid
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">INV-2025-0028</TableCell>
                  <TableCell>{format(new Date("2025-02-01"), "MMM d, yyyy")}</TableCell>
                  <TableCell>$1,250.00</TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      Paid
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="text-muted-foreground mr-1">Total Invoiced YTD:</span>
                <span className="font-medium">$3,750.00</span>
              </div>

              <Button size="sm" variant="outline" className="gap-2">
                <FilePlus2 className="h-4 w-4" />
                Create Invoice
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/* ==========================================================================
   4. FINANCIAL PLANNING VIEW
========================================================================== */
type FPViewProps = {
  project: Project;
  onUpdateStatus: (s: string) => Promise<void>;
  onTasksChange?: (tasks: WorkflowTask[]) => void;
};

const FinancialPlanningView: React.FC<FPViewProps> = ({
  project,
  onUpdateStatus,
  onTasksChange,
}) => {
  const { toast } = useToast();

  const [investmentData, setInvestmentData] = useState({
    retirement: 850000,
    taxable: 350000,
    education: 125000,
    cash: 75000,
  });

  const [planningGoals, setPlanningGoals] = useState([
    { id: 1, name: "Retirement at age 65", status: "on_track", priority: "high" },
    { id: 2, name: "College funding for children", status: "at_risk", priority: "medium" },
    { id: 3, name: "Buy vacation property", status: "off_track", priority: "low" },
    { id: 4, name: "Emergency fund (6 months)", status: "complete", priority: "high" },
  ]);

  const updateGoalStatus = (goalId: number, newStatus: string) => {
    setPlanningGoals((prev) =>
      prev.map((goal) => (goal.id === goalId ? { ...goal, status: newStatus } : goal))
    );
    toast({
      title: "Goal status updated",
      description: "The goal status has been updated successfully.",
    });
  };

  /* ------------------------------------------------------------------------
     Build tasks from planning goals
  ------------------------------------------------------------------------ */
  function mapPlanningTasks(): WorkflowTask[] {
    return planningGoals.map((g) => ({
      id: `goal-${g.id}`,
      name: g.name,
      deadline: undefined,
      status:
        g.status === "complete"
          ? "completed"
          : g.status === "off_track"
          ? "blocked"
          : g.status === "on_track"
          ? "in_progress"
          : "pending", // "at_risk" => "pending"
    }));
  }

  useEffect(() => {
    onTasksChange?.(mapPlanningTasks());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planningGoals]);

  return (
    <div className="space-y-6">
      {/* Unified Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Financial Planning Workflow Progress
          </CardTitle>
          <CardDescription>Goals as tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <UnifiedProjectTimeline
            projectStatus={project?.status || "Planning"}
            tasks={mapPlanningTasks()}
          />
        </CardContent>
      </Card>

      {/* Portfolio Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-primary" />
            Portfolio Overview
          </CardTitle>
          <CardDescription>Current investment allocation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(investmentData).map(([key, value]) => (
                <Card key={key} className="border">
                  <CardContent className="p-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground capitalize">{key}</p>
                      <p className="text-2xl font-bold">${value.toLocaleString()}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="text-muted-foreground mr-1">Total Portfolio Value:</span>
                <span className="font-medium">
                  $
                  {Object.values(investmentData)
                    .reduce((a, b) => a + b, 0)
                    .toLocaleString()}
                </span>
              </div>

              <Badge variant="outline">
                Last Updated: {format(new Date(), "MMM d, yyyy")}
              </Badge>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Asset Allocation</h4>
              <div className="h-6 w-full rounded-full overflow-hidden bg-muted">
                <div className="flex h-full">
                  <div
                    className="bg-blue-500"
                    style={{ width: "45%" }}
                    title="Stocks: 45%"
                  ></div>
                  <div
                    className="bg-amber-500"
                    style={{ width: "30%" }}
                    title="Bonds: 30%"
                  ></div>
                  <div
                    className="bg-green-500"
                    style={{ width: "15%" }}
                    title="Real Estate: 15%"
                  ></div>
                  <div
                    className="bg-purple-500"
                    style={{ width: "10%" }}
                    title="Alternative: 10%"
                  ></div>
                </div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>Stocks: 45%</span>
                <span>Bonds: 30%</span>
                <span>Real Estate: 15%</span>
                <span>Alternative: 10%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <CheckCircle2 className="h-5 w-5 mr-2 text-primary" />
            Financial Goals
          </CardTitle>
          <CardDescription>Track progress towards financial goals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Goal</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {planningGoals.map((goal) => (
                  <TableRow key={goal.id}>
                    <TableCell className="font-medium">{goal.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          goal.priority === "high"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            : goal.priority === "medium"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                        }
                      >
                        {goal.priority.charAt(0).toUpperCase() + goal.priority.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          goal.status === "on_track"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : goal.status === "at_risk"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                            : goal.status === "off_track"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                        }
                      >
                        {goal.status === "on_track"
                          ? "On Track"
                          : goal.status === "at_risk"
                          ? "At Risk"
                          : goal.status === "off_track"
                          ? "Off Track"
                          : "Complete"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Select
                        value={goal.status}
                        onValueChange={(value) => updateGoalStatus(goal.id, value)}
                      >
                        <SelectTrigger className="w-[130px] h-8">
                          <SelectValue placeholder="Update status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="on_track">On Track</SelectItem>
                          <SelectItem value="at_risk">At Risk</SelectItem>
                          <SelectItem value="off_track">Off Track</SelectItem>
                          <SelectItem value="complete">Complete</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Button variant="outline" size="sm" className="w-full gap-2">
              <FilePlus2 className="h-4 w-4" />
              Add Financial Goal
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Retirement Projections */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <Calculator className="h-5 w-5 mr-2 text-primary" />
            Retirement Projections
          </CardTitle>
          <CardDescription>Long-term retirement planning analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border">
                <CardContent className="p-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Projected Retirement Date</p>
                    <p className="text-xl font-bold">January 2045</p>
                    <p className="text-xs text-muted-foreground">Age 65</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border">
                <CardContent className="p-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Current Retirement Savings</p>
                    <p className="text-xl font-bold">$850,000</p>
                    <div className="flex items-center text-xs">
                      <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                      <span className="text-green-600">+12.5%</span>
                      <span className="text-muted-foreground ml-1">this year</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border">
                <CardContent className="p-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Projected Annual Income</p>
                    <p className="text-xl font-bold">$120,000</p>
                    <p className="text-xs text-muted-foreground">In today's dollars</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="p-3 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start">
                <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-500 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800 dark:text-blue-400">
                    Retirement Planning
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-500">
                    Based on current savings and contribution rates, the client is
                    <span className="font-medium"> 85% likely</span> to achieve their retirement
                    goal.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Savings Progress</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Current</span>
                  <span>Estimated Needed</span>
                </div>
                <Progress value={60} className="h-3" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>$850,000</span>
                  <span>$1,400,000</span>
                </div>
              </div>
            </div>

            <Button variant="outline" size="sm" className="gap-2">
              <FileText className="h-4 w-4" />
              Generate Retirement Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cash Flow Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <ArrowUpRight className="h-5 w-5 mr-2 text-primary" />
            Cash Flow Analysis
          </CardTitle>
          <CardDescription>Monthly income and expense analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Monthly Income</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Salary</span>
                    <span className="font-medium">$12,500</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Investment Income</span>
                    <span className="font-medium">$1,800</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Rental Property</span>
                    <span className="font-medium">$2,200</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Income</span>
                    <span className="font-medium">$16,500</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Monthly Expenses</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Housing</span>
                    <span className="font-medium">$3,500</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Transportation</span>
                    <span className="font-medium">$800</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Living Expenses</span>
                    <span className="font-medium">$2,200</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Debt Payments</span>
                    <span className="font-medium">$1,500</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Other</span>
                    <span className="font-medium">$2,000</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Expenses</span>
                    <span className="font-medium">$10,000</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between items-center">
              <span className="font-medium">Monthly Cash Flow</span>
              <span className="font-bold text-green-600 dark:text-green-400">+$6,500</span>
            </div>

            <div className="p-3 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-400">Positive Cash Flow</p>
                  <p className="text-sm text-green-700 dark:text-green-500">
                    Client has a positive monthly cash flow of $6,500, which provides strong
                    savings potential for retirement and other goals.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/* ==========================================================================
   5. ADVISORY VIEW
========================================================================== */
type AdvisoryViewProps = {
  project: Project;
  onUpdateStatus: (s: string) => Promise<void>;
  onTasksChange?: (tasks: WorkflowTask[]) => void;
};

const AdvisoryView: React.FC<AdvisoryViewProps> = ({ project, onUpdateStatus, onTasksChange }) => {
  const { toast } = useToast();

  const [businessMetrics, setBusinessMetrics] = useState({
    revenue: {
      current: 1250000,
      previous: 980000,
      change: 27.6,
    },
    profit: {
      current: 300000,
      previous: 210000,
      change: 42.9,
    },
    employees: {
      current: 15,
      previous: 12,
      change: 25.0,
    },
    clients: {
      current: 45,
      previous: 38,
      change: 18.4,
    },
  });

  const [advisoryDeliverables, setAdvisoryDeliverables] = useState([
    { id: 1, name: "Business Valuation Report", status: "completed", date: "2025-03-15" },
    { id: 2, name: "Cash Flow Projection Model", status: "in_progress", date: "2025-04-30" },
    { id: 3, name: "Strategic Growth Plan", status: "not_started", date: "2025-05-15" },
    { id: 4, name: "Tax Planning Strategy", status: "not_started", date: "2025-06-01" },
  ]);

  const updateDeliverableStatus = (deliverableId: number, newStatus: string) => {
    setAdvisoryDeliverables((prev) =>
      prev.map((deliv) =>
        deliv.id === deliverableId ? { ...deliv, status: newStatus } : deliv
      )
    );
    toast({
      title: "Deliverable status updated",
      description: "The deliverable status has been updated successfully.",
    });
  };

  /* ------------------------------------------------------------------------
     Convert deliverables to tasks for unified timeline
  ------------------------------------------------------------------------ */
  function mapAdvisoryTasks(): WorkflowTask[] {
    return advisoryDeliverables.map((d) => {
      let st: "pending" | "in_progress" | "blocked" | "completed" = "pending";
      if (d.status === "completed") st = "completed";
      else if (d.status === "in_progress") st = "in_progress";
      else if (d.status === "not_started") st = "pending";
      return {
        id: `advisory-${d.id}`,
        name: d.name,
        deadline: d.date,
        status: st,
      };
    });
  }

  useEffect(() => {
    onTasksChange?.(mapAdvisoryTasks());
  }, [advisoryDeliverables]);

  return (
    <div className="space-y-6">
      {/* Unified Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Advisory Workflow Progress
          </CardTitle>
          <CardDescription>Deliverables mapped as tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <UnifiedProjectTimeline projectStatus={project?.status || "Advisory"} tasks={mapAdvisoryTasks()} />
        </CardContent>
      </Card>

      {/* Business Metrics Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-primary" />
            Business Metrics Dashboard
          </CardTitle>
          <CardDescription>Key business performance indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(businessMetrics).map(([key, data]) => (
              <Card key={key} className="border">
                <CardContent className="p-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground capitalize">{key}</p>
                    <p className="text-2xl font-bold">
                      {key === "revenue" || key === "profit"
                        ? `$${data.current.toLocaleString()}`
                        : data.current.toLocaleString()}
                    </p>
                    <div className="flex items-center text-xs">
                      {data.change >= 0 ? (
                        <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                      )}
                      <span className={data.change >= 0 ? "text-green-600" : "text-red-600"}>
                        {data.change >= 0 ? "+" : ""}
                        {data.change}%
                      </span>
                      <span className="text-muted-foreground ml-1">vs previous year</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Business Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <Wrench className="h-5 w-5 mr-2 text-primary" />
            Business Analysis
          </CardTitle>
          <CardDescription>Strengths, weaknesses, opportunities, threats</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="space-y-2">
              <h4 className="font-medium text-green-600 dark:text-green-400">Strengths</h4>
              <ul className="space-y-1 text-sm">
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                  <span>Strong profit margins compared to industry</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                  <span>Experienced management team</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                  <span>High client retention rates (92%)</span>
                </li>
              </ul>
            </div>
            {/* Weaknesses */}
            <div className="space-y-2">
              <h4 className="font-medium text-red-600 dark:text-red-400">Weaknesses</h4>
              <ul className="space-y-1 text-sm">
                <li className="flex items-start">
                  <X className="h-4 w-4 text-red-500 mr-1 mt-0.5 flex-shrink-0" />
                  <span>Cash flow constraints during seasonal cycles</span>
                </li>
                <li className="flex items-start">
                  <X className="h-4 w-4 text-red-500 mr-1 mt-0.5 flex-shrink-0" />
                  <span>Limited market diversification</span>
                </li>
                <li className="flex items-start">
                  <X className="h-4 w-4 text-red-500 mr-1 mt-0.5 flex-shrink-0" />
                  <span>Higher turnover in some key departments</span>
                </li>
              </ul>
            </div>
            {/* Opportunities */}
            <div className="space-y-2">
              <h4 className="font-medium text-blue-600 dark:text-blue-400">Opportunities</h4>
              <ul className="space-y-1 text-sm">
                <li className="flex items-start">
                  <ArrowUpRight className="h-4 w-4 text-blue-500 mr-1 mt-0.5 flex-shrink-0" />
                  <span>Expansion into adjacent market segments</span>
                </li>
                <li className="flex items-start">
                  <ArrowUpRight className="h-4 w-4 text-blue-500 mr-1 mt-0.5 flex-shrink-0" />
                  <span>Strategic acquisition opportunities</span>
                </li>
                <li className="flex items-start">
                  <ArrowUpRight className="h-4 w-4 text-blue-500 mr-1 mt-0.5 flex-shrink-0" />
                  <span>New product development potential</span>
                </li>
              </ul>
            </div>
            {/* Threats */}
            <div className="space-y-2">
              <h4 className="font-medium text-amber-600 dark:text-amber-400">Threats</h4>
              <ul className="space-y-1 text-sm">
                <li className="flex items-start">
                  <AlertCircle className="h-4 w-4 text-amber-500 mr-1 mt-0.5 flex-shrink-0" />
                  <span>Increasing competition in primary market</span>
                </li>
                <li className="flex items-start">
                  <AlertCircle className="h-4 w-4 text-amber-500 mr-1 mt-0.5 flex-shrink-0" />
                  <span>Regulatory changes affecting operations</span>
                </li>
                <li className="flex items-start">
                  <AlertCircle className="h-4 w-4 text-amber-500 mr-1 mt-0.5 flex-shrink-0" />
                  <span>Rising operational costs</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advisory Deliverables */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <FileText className="h-5 w-5 mr-2 text-primary" />
            Advisory Deliverables
          </CardTitle>
          <CardDescription>Track progress on consulting deliverables</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deliverable</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {advisoryDeliverables.map((deliverable) => (
                  <TableRow key={deliverable.id}>
                    <TableCell className="font-medium">{deliverable.name}</TableCell>
                    <TableCell>
                      {format(new Date(deliverable.date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          deliverable.status === "completed"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : deliverable.status === "in_progress"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                        }
                      >
                        {deliverable.status === "completed"
                          ? "Completed"
                          : deliverable.status === "in_progress"
                          ? "In Progress"
                          : "Not Started"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Select
                        value={deliverable.status}
                        onValueChange={(value) => updateDeliverableStatus(deliverable.id, value)}
                      >
                        <SelectTrigger className="w-[130px] h-8">
                          <SelectValue placeholder="Update status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_started">Not Started</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Button variant="outline" size="sm" className="w-full gap-2">
              <FilePlus2 className="h-4 w-4" />
              Add Deliverable
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Strategic Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <MessageCircle className="h-5 w-5 mr-2 text-primary" />
            Strategic Recommendations
          </CardTitle>
          <CardDescription>Key business recommendations based on analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Short-Term */}
            <div className="p-3 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-800 dark:text-blue-400 mb-1">
                Short-Term Actions (0-6 months)
              </h4>
              <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-500">
                <li className="flex items-start">
                  <Check className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                  <span>Implement cash flow management system to address seasonal constraints</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                  <span>Develop employee retention program for key departments</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                  <span>Review pricing strategy to optimize profit margins</span>
                </li>
              </ul>
            </div>

            {/* Medium-Term */}
            <div className="p-3 rounded-md bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
              <h4 className="font-medium text-purple-800 dark:text-purple-400 mb-1">
                Medium-Term Strategy (6-18 months)
              </h4>
              <ul className="space-y-1 text-sm text-purple-700 dark:text-purple-500">
                <li className="flex items-start">
                  <Check className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                  <span>Explore and evaluate adjacent market expansion opportunities</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                  <span>Develop new product offerings to diversify revenue streams</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                  <span>Implement efficiency measures to control rising operational costs</span>
                </li>
              </ul>
            </div>

            {/* Long-Term */}
            <div className="p-3 rounded-md bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
              <h4 className="font-medium text-indigo-800 dark:text-indigo-400 mb-1">
                Long-Term Vision (18+ months)
              </h4>
              <ul className="space-y-1 text-sm text-indigo-700 dark:text-indigo-500">
                <li className="flex items-start">
                  <Check className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                  <span>Strategic acquisition plan for complementary businesses</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                  <span>International market expansion strategy</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                  <span>Development of intellectual property portfolio</span>
                </li>
              </ul>
            </div>

            <div className="flex items-center gap-2">
              <Button className="gap-2">
                <CopyPlus className="h-4 w-4" />
                Generate Action Plan
              </Button>

              <Button variant="outline" className="gap-2">
                <FileText className="h-4 w-4" />
                Export Recommendations
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/* ==========================================================================
   MAIN: ClientPortalServiceViews
========================================================================== */
export default function ClientPortalServiceViews({
  project,
  onUpdateStatus,
  onTasksChange,
  onSignLetter,
}: ClientPortalServiceViewsProps) {
  if (!project) return null;

  const serviceType = project.service_type || "";

  // Decide which view to show
  const getServiceView = () => {
    if (serviceType.includes("Tax")) {
      return (
        <TaxReturnView
          project={project}
          onUpdateStatus={onUpdateStatus}
          onTasksChange={onTasksChange}
        />
      );
    } else if (serviceType.includes("Audit")) {
      return (
        <AuditView
          project={project}
          onUpdateStatus={onUpdateStatus}
          onTasksChange={onTasksChange}
        />
      );
    } else if (serviceType.includes("Bookkeeping") || serviceType.includes("CAS")) {
      return (
        <CASView
          project={project}
          onUpdateStatus={onUpdateStatus}
          onTasksChange={onTasksChange}
        />
      );
    } else if (serviceType.includes("Financial Planning")) {
      return (
        <FinancialPlanningView
          project={project}
          onUpdateStatus={onUpdateStatus}
          onTasksChange={onTasksChange}
        />
      );
    } else if (serviceType.includes("Advisory")) {
      return (
        <AdvisoryView
          project={project}
          onUpdateStatus={onUpdateStatus}
          onTasksChange={onTasksChange}
        />
      );
    } else {
      return (
        <div className="p-6 text-center">
          <p className="text-muted-foreground">
            No specialized view available for this service type.
          </p>
        </div>
      );
    }
  };

  return (
    <div>
      {/* Header area (you can modify as desired) */}
      <div className="mb-4">
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">{serviceType} Dashboard</h2>
                <p className="text-sm text-muted-foreground">
                  Specialized workflow for {project.client_name}&apos;s {serviceType} project
                </p>
              </div>

              <div className="flex gap-2">
                {/* Contact Your Accountant button */}
                <Button variant="outline" size="sm" className="gap-2" asChild>
                  <a href={`/client/messages?project_id=${project.id}`}>
                    <MessageSquare className="h-4 w-4" />
                    Contact Your Accountant
                  </a>
                </Button>

                <Button variant="outline" size="sm" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Export Data
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Render specialized sub-view */}
      {getServiceView()}

      {/* Engagement Letter CTA (if applicable) */}
      {project.status === "Awaiting Signature" && (
        <Card className="mt-6 border-primary bg-primary/5">
          <CardContent className="py-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-primary" />
                <div>
                  <h3 className="font-medium">Your Engagement Letter is Ready</h3>
                  <p className="text-sm text-muted-foreground">
                    Please review and sign your engagement letter to proceed
                  </p>
                </div>
              </div>

              <Button onClick={onSignLetter} className="gap-2">
                <FileCheck className="h-4 w-4" />
                Sign Engagement Letter
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
