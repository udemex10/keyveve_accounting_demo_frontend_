"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import {
  FileText,
  Check,
  Clock,
  Calendar,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  ChevronRight,
  BarChart3,
  FileCheck,
  MessageSquare,
  FileSpreadsheet,
  CheckCircle2,
  Loader2,
  Upload,
  Eye,
  Users,
  Calculator,
  FilePlus,
  Receipt,
    Link
} from "lucide-react";
import { format, addDays, isAfter, differenceInDays } from "date-fns";

// Client portal views based on service type
const ClientPortalServiceViews = ({ project, documents, tasks, staff, onSignLetter }) => {
  const { toast } = useToast();

  if (!project) return null;

  // Get project type
  const serviceType = project.service_type || "";

  // Helper function to get days remaining till deadline
  const daysRemaining = (deadline) => {
    if (!deadline) return null;
    const today = new Date();
    const deadlineDate = new Date(deadline);
    return differenceInDays(deadlineDate, today);
  };

  // Tax Return Client Portal View
  const TaxClientView = () => {
    const [taxYear] = useState(new Date().getFullYear() - 1);
    const [taxDeadline] = useState("2025-04-15");
    const daysUntilDeadline = daysRemaining(taxDeadline);

    // Required document tracking
    const requiredDocs = [
      { id: 1, name: "W-2", status: documents.some(d => d.doc_type === "W-2") ? "received" : "missing" },
      { id: 2, name: "1099-INT", status: documents.some(d => d.doc_type === "1099-INT") ? "received" : "missing" },
      { id: 3, name: "1099-DIV", status: documents.some(d => d.doc_type === "1099-DIV") ? "received" : "missing" },
      { id: 4, name: "1098 Mortgage Interest", status: documents.some(d => d.doc_type === "1098") ? "received" : "missing" },
      { id: 5, name: "Charitable Donations", status: documents.some(d => d.doc_type === "Donation Receipt") ? "received" : "missing" }
    ];

    // E-file status
    const eFileStatus = project.status === "Filed" ? "accepted" :
                      project.status === "Ready for Filing" ? "in_progress" :
                      "not_started";

    return (
      <div className="space-y-6">
        {/* Tax Deadline Card */}
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-base">
              <Clock className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
              Tax Deadline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                  {daysUntilDeadline} days
                </h3>
                <span className="text-blue-600 dark:text-blue-500">
                  {format(new Date(taxDeadline), "MMMM d, yyyy")}
                </span>
              </div>

              <Progress
                value={Math.max(0, 100 - (daysUntilDeadline / 120) * 100)}
                className="h-2 bg-blue-100 dark:bg-blue-900"
              />

              <div className="text-sm text-muted-foreground">
                {taxYear} Tax Return
              </div>

              {daysUntilDeadline < 30 && (
                <div className="flex items-center text-amber-600 dark:text-amber-400 text-sm mt-2">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  <span>Less than 30 days remaining until the deadline!</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tax Return Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <FileCheck className="h-5 w-5 mr-2 text-primary" />
              Tax Return Status
            </CardTitle>
            <CardDescription>
              Current status of your {taxYear} tax return
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute left-0 top-1/2 h-0.5 w-full bg-muted -translate-y-1/2" />
                <div className="relative flex justify-between">
                  {["Docs Requested", "In Preparation", "In Review", "Ready for Filing", "Filed"].map((status, index) => {
                    const statusMap = {
                      "Docs Requested": 0,
                      "Docs Received": 1,
                      "In Preparation": 2,
                      "In Review": 3,
                      "Ready for Filing": 4,
                      "Filed": 5
                    };

                    const currentIndex = statusMap[project.status] || 0;
                    const statusIndex = statusMap[status] || 0;
                    const isActive = currentIndex === statusIndex;
                    const isCompleted = currentIndex > statusIndex;

                    return (
                      <div key={status} className="flex flex-col items-center">
                        <div
                          className={`h-6 w-6 rounded-full flex items-center justify-center z-10
                            ${isActive 
                              ? "bg-primary text-primary-foreground" 
                              : isCompleted 
                                ? "bg-primary/80 text-primary-foreground" 
                                : "bg-muted text-muted-foreground"
                            }`}
                        >
                          {isCompleted ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <span className="text-xs">{index + 1}</span>
                          )}
                        </div>
                        <span className={`mt-2 text-xs max-w-[80px] text-center whitespace-normal ${isActive ? "font-semibold" : ""}`}>
                          {status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="text-sm flex flex-col gap-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Status:</span>
                  <Badge variant="outline">{project.status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">E-File Status:</span>
                  <Badge
                    variant="outline"
                    className={
                      eFileStatus === "accepted"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : eFileStatus === "in_progress"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                          : ""
                    }
                  >
                    {eFileStatus === "accepted"
                      ? "Accepted"
                      : eFileStatus === "in_progress"
                        ? "In Progress"
                        : "Not Started"}
                  </Badge>
                </div>
              </div>

              {/* Conditional messaging based on status */}
              {project.status === "Docs Requested" && (
                <div className="p-3 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800 dark:text-amber-400">Action Required</p>
                      <p className="text-sm text-amber-700 dark:text-amber-500">
                        Please upload your tax documents so we can begin preparing your return.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {project.status === "Filed" && (
                <div className="p-3 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <div className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500 mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-400">Tax Return Filed</p>
                      <p className="text-sm text-green-700 dark:text-green-500">
                        Your tax return has been successfully filed! You can download your completed return below.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          {project.status === "Filed" && (
            <CardFooter className="border-t pt-4">
              <Button className="gap-2 w-full">
                <Download className="h-4 w-4" />
                Download Tax Return
              </Button>
            </CardFooter>
          )}
        </Card>

        {/* Required Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <FileText className="h-5 w-5 mr-2 text-primary" />
              Required Documents
            </CardTitle>
            <CardDescription>
              Documents needed for your tax return
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {requiredDocs.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div className="flex items-center">
                    {doc.status === "received" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
                    )}
                    <span>{doc.name}</span>
                  </div>
                  <Badge
                    variant={doc.status === "received" ? "default" : "outline"}
                    className={doc.status === "received"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"}
                  >
                    {doc.status === "received" ? "Received" : "Missing"}
                  </Badge>
                </div>
              ))}

              <div className="pt-2">
                <Button className="w-full gap-2" variant={project.status === "Docs Requested" ? "default" : "outline"}>
                  <Upload className="h-4 w-4" />
                  Upload Documents
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Audit Client Portal View
  const AuditClientView = () => {
    const [currentPhase, setCurrentPhase] = useState("Planning");
    const timelineData = [
      { id: 1, phase: "Planning", start: "2025-05-01", end: "2025-05-15", status: "completed", description: "Assess risk areas and develop audit approach" },
      { id: 2, phase: "Fieldwork", start: "2025-05-15", end: "2025-06-15", status: "in_progress", description: "Test internal controls and perform substantive procedures" },
      { id: 3, phase: "Reporting", start: "2025-06-15", end: "2025-07-01", status: "pending", description: "Draft audit report and review findings" },
      { id: 4, phase: "Completion", start: "2025-07-01", end: "2025-07-15", status: "pending", description: "Finalize audit report and hold closing meeting" }
    ];

    // PBC (Provided by Client) list
    const pbcItems = [
      { id: 1, item: "Trial Balance", status: "provided", dueDate: "2025-05-10" },
      { id: 2, item: "Bank Statements", status: "provided", dueDate: "2025-05-10" },
      { id: 3, item: "Accounts Receivable Aging", status: "requested", dueDate: "2025-05-15" },
      { id: 4, item: "Inventory Reports", status: "requested", dueDate: "2025-05-15" },
      { id: 5, item: "Fixed Asset Register", status: "pending", dueDate: "2025-05-20" },
    ];

    // Findings
    const findings = [
      { id: 1, title: "Bank Reconciliation Issues", severity: "medium", status: "open", date: "2025-05-20" },
      { id: 2, title: "Missing Invoice Approvals", severity: "low", status: "closed", date: "2025-05-15" }
    ];

    useEffect(() => {
      // Set current phase based on project status
      if (project.status === "Planning") {
        setCurrentPhase("Planning");
      } else if (project.status === "Fieldwork" || project.status === "PBC List Sent") {
        setCurrentPhase("Fieldwork");
      } else if (project.status === "Draft Report" || project.status === "Partner Review") {
        setCurrentPhase("Reporting");
      } else if (project.status === "Completed" || project.status === "Client Review") {
        setCurrentPhase("Completion");
      }
    }, [project.status]);

    return (
      <div className="space-y-6">
        {/* Audit Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <Calendar className="h-5 w-5 mr-2 text-primary" />
              Audit Timeline
            </CardTitle>
            <CardDescription>
              Key milestones and current progress of your audit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {timelineData.map((phase, index) => {
                const isActive = phase.phase === currentPhase;
                const isCompleted = phase.status === "completed";

                return (
                  <div key={phase.id} className="relative">
                    {/* Connector Line */}
                    {index < timelineData.length - 1 && (
                      <div className={`absolute left-[19px] top-12 h-[calc(100%-40px)] w-0.5 ${
                        isCompleted ? "bg-primary" : "bg-muted"
                      }`} />
                    )}

                    <div className="flex items-start space-x-4">
                      <div className={`rounded-full h-10 w-10 flex items-center justify-center mt-1 ${
                        isActive 
                          ? "bg-primary text-primary-foreground" 
                          : isCompleted 
                            ? "bg-primary/80 text-primary-foreground" 
                            : "bg-muted text-muted-foreground"
                      }`}>
                        {isCompleted ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <span>{index + 1}</span>
                        )}
                      </div>

                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className={`font-medium ${isActive ? "text-primary" : ""}`}>
                            {phase.phase}
                          </h4>
                          <Badge variant={
                            phase.status === "completed"
                              ? "default"
                              : phase.status === "in_progress"
                                ? "outline"
                                : "secondary"
                          } className={
                            phase.status === "completed"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : phase.status === "in_progress"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                : ""
                          }>
                            {phase.status === "completed"
                              ? "Completed"
                              : phase.status === "in_progress"
                                ? "In Progress"
                                : "Upcoming"}
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground">
                          {phase.description}
                        </p>

                        <div className="flex items-center text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>
                            {format(new Date(phase.start), "MMM d")} - {format(new Date(phase.end), "MMM d, yyyy")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* PBC List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <FileText className="h-5 w-5 mr-2 text-primary" />
              Requested Items (PBC List)
            </CardTitle>
            <CardDescription>
              Documents and information requested by the audit team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-3">
                  {pbcItems.map((item) => {
                    const dueDate = new Date(item.dueDate);
                    const isOverdue = isAfter(new Date(), dueDate) && item.status !== "provided";

                    return (
                      <div key={item.id} className="flex items-center justify-between border-b pb-3">
                        <div className="space-y-1">
                          <h4 className="font-medium">{item.item}</h4>
                          <div className="flex items-center text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span className={`${isOverdue ? "text-red-500" : "text-muted-foreground"}`}>
                              Due: {format(dueDate, "MMM d, yyyy")}
                              {isOverdue ? " (Overdue)" : ""}
                            </span>
                          </div>
                        </div>

                        {item.status === "provided" ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Provided
                          </Badge>
                        ) : item.status === "requested" ? (
                          <Button size="sm" variant="outline" className="gap-1">
                            <Upload className="h-3 w-3" />
                            Upload
                          </Button>
                        ) : (
                          <Badge variant="outline" className="bg-muted text-muted-foreground">
                            Pending Request
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              <div className="p-3 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-500 mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-800 dark:text-blue-400">About the PBC List</p>
                    <p className="text-sm text-blue-700 dark:text-blue-500">
                      The PBC (Provided By Client) list contains all items requested by your audit team.
                      Timely submission of these items helps ensure your audit stays on schedule.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Findings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <AlertCircle className="h-5 w-5 mr-2 text-primary" />
              Audit Findings
            </CardTitle>
            <CardDescription>
              Issues identified during the audit process
            </CardDescription>
          </CardHeader>
          <CardContent>
            {findings.length > 0 ? (
              <div className="space-y-4">
                {findings.map((finding) => (
                  <div key={finding.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{finding.title}</h4>
                      <Badge className={
                        finding.severity === "high"
                          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          : finding.severity === "medium"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                      }>
                        {finding.severity.charAt(0).toUpperCase() + finding.severity.slice(1)} Risk
                      </Badge>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Identified: {format(new Date(finding.date), "MMM d, yyyy")}
                      </span>
                      <span className={finding.status === "closed" ? "text-green-600" : "text-amber-600"}>
                        {finding.status === "closed" ? "Resolved" : "Open"}
                      </span>
                    </div>

                    {finding.status === "open" && (
                      <div className="pt-2">
                        <Button variant="outline" size="sm" className="w-full">
                          Provide Response
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                No findings have been reported at this stage of the audit.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // Bookkeeping/CAS Client Portal View
  const BookkeepingClientView = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Financial metrics
    const financialMetrics = [
      { id: 1, name: "Revenue", value: "$125,450", change: 12.5, trend: "up" },
      { id: 2, name: "Expenses", value: "$98,230", change: 5.8, trend: "up" },
      { id: 3, name: "Net Income", value: "$27,220", change: 18.3, trend: "up" },
      { id: 4, name: "Cash Balance", value: "$62,830", change: -3.2, trend: "down" }
    ];

    // Recent financial statements
    const financialStatements = [
      { id: 1, name: "April 2025 Financial Statements", date: "2025-05-10", type: "monthly" },
      { id: 2, name: "March 2025 Financial Statements", date: "2025-04-12", type: "monthly" },
      { id: 3, name: "Q1 2025 Financial Statements", date: "2025-04-20", type: "quarterly" }
    ];

    // Upcoming deadlines
    const upcomingDeadlines = [
      { id: 1, name: "Sales Tax Filing", date: "2025-05-20", type: "tax" },
      { id: 2, name: "Payroll Processing", date: "2025-05-15", type: "payroll" },
      { id: 3, name: "Bank Reconciliation", date: "2025-05-10", type: "bookkeeping" }
    ];

    return (
      <div className="space-y-6">
        {/* Financial Dashboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <BarChart3 className="h-5 w-5 mr-2 text-primary" />
              Financial Dashboard
            </CardTitle>
            <CardDescription>
              Current month financial overview
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {financialMetrics.map((metric) => (
                <Card key={metric.id} className="border">
                  <CardContent className="p-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground capitalize">{metric.name}</p>
                      <p className="text-2xl font-bold">
                        {metric.value}
                      </p>
                      <div className="flex items-center text-xs">
                        {metric.trend === "up" ? (
                          <ArrowUpRight className={`h-3 w-3 mr-1 ${metric.name === "Expenses" ? "text-red-500" : "text-green-500"}`} />
                        ) : (
                          <ArrowDownRight className={`h-3 w-3 mr-1 ${metric.name === "Expenses" ? "text-green-500" : "text-red-500"}`} />
                        )}
                        <span className={
                          (metric.name === "Expenses" && metric.trend === "up") ||
                          (metric.name !== "Expenses" && metric.trend === "down")
                            ? "text-red-600" : "text-green-600"
                        }>
                          {metric.trend === "up" ? "+" : ""}{metric.change}%
                        </span>
                        <span className="text-muted-foreground ml-1">
                          vs last month
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Financial Statements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <FileSpreadsheet className="h-5 w-5 mr-2 text-primary" />
              Financial Statements
            </CardTitle>
            <CardDescription>
              Access your financial statements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-3">
                {financialStatements.map((statement) => (
                  <div key={statement.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-muted">
                        <FileSpreadsheet className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">{statement.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          Generated on {format(new Date(statement.date), "MMMM d, yyyy")}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-1">
                        <Eye className="h-3 w-3" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1">
                        <Download className="h-3 w-3" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-md bg-muted/30 border">
                <h4 className="text-sm font-medium mb-1">Request Custom Report</h4>
                <div className="flex gap-2">
                  <Input placeholder="Report name or description..." className="text-sm" />
                  <Button size="sm">Request</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <Clock className="h-5 w-5 mr-2 text-primary" />
              Upcoming Deadlines
            </CardTitle>
            <CardDescription>
              Important dates and deadlines
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingDeadlines.map((deadline) => {
                const daysLeft = daysRemaining(deadline.date);
                const isUrgent = daysLeft <= 3;

                return (
                  <div key={deadline.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div>
                      <h4 className="font-medium">{deadline.name}</h4>
                      <div className="flex items-center text-xs mt-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span className={`${isUrgent ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                          Due: {format(new Date(deadline.date), "MMM d, yyyy")}
                          {isUrgent ? ` (${daysLeft} days left)` : ""}
                        </span>
                      </div>
                    </div>

                    <Badge variant="outline" className={
                      deadline.type === "tax"
                        ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        : deadline.type === "payroll"
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                    }>
                      {deadline.type.charAt(0).toUpperCase() + deadline.type.slice(1)}
                    </Badge>
                  </div>
                );
              })}

              {upcomingDeadlines.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No upcoming deadlines at this time.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Document Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <Upload className="h-5 w-5 mr-2 text-primary" />
              Upload Documents
            </CardTitle>
            <CardDescription>
              Submit invoices, receipts, and other documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-6 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center">
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <h3 className="font-medium mb-1">Drag and drop files here</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Upload invoices, receipts, bank statements, or any other financial documents
              </p>
              <Button className="gap-2">
                <FilePlus className="h-4 w-4" />
                Browse Files
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Financial Planning Client View
  const FinancialPlanningView = () => {
    const investmentAllocation = [
      { id: 1, category: "Stocks", percentage: 45, color: "blue" },
      { id: 2, category: "Bonds", percentage: 30, color: "amber" },
      { id: 3, category: "Real Estate", percentage: 15, color: "green" },
      { id: 4, category: "Alternative", percentage: 10, color: "purple" }
    ];

    const financialGoals = [
      { id: 1, name: "Retirement", target: "$2,000,000", progress: 42, status: "on_track" },
      { id: 2, name: "Education Fund", target: "$250,000", progress: 65, status: "on_track" },
      { id: 3, name: "Home Purchase", target: "$150,000", progress: 25, status: "at_risk" }
    ];

    const upcomingMeetings = [
      { id: 1, title: "Quarterly Review", date: "2025-05-20", time: "10:00 AM" }
    ];

    return (
      <div className="space-y-6">
        {/* Portfolio Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <BarChart3 className="h-5 w-5 mr-2 text-primary" />
              Portfolio Summary
            </CardTitle>
            <CardDescription>
              Current investment portfolio summary
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Portfolio</p>
                  <p className="text-2xl font-bold">$1,250,000</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">YTD Return</p>
                  <p className="text-2xl font-bold text-green-600">+8.5%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Monthly Contribution</p>
                  <p className="text-2xl font-bold">$3,500</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Risk Profile</p>
                  <p className="text-2xl font-bold">Moderate</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Asset Allocation</h4>
                <div className="h-6 w-full rounded-full overflow-hidden bg-muted">
                  <div className="flex h-full">
                    {investmentAllocation.map((asset) => (
                      <div
                        key={asset.id}
                        className={`bg-${asset.color}-500`}
                        style={{ width: `${asset.percentage}%` }}
                        title={`${asset.category}: ${asset.percentage}%`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
                  {investmentAllocation.map((asset) => (
                    <div key={asset.id} className="flex items-center">
                      <div
                        className={`w-3 h-3 rounded-sm mr-1 bg-${asset.color}-500`}
                      />
                      <span className="text-xs">
                        {asset.category}: {asset.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <CheckCircle2 className="h-5 w-5 mr-2 text-primary" />
              Financial Goals
            </CardTitle>
            <CardDescription>
              Track progress towards your financial objectives
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {financialGoals.map((goal) => (
                <div key={goal.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{goal.name}</h4>
                    <Badge className={
                      goal.status === "on_track"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : goal.status === "at_risk"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                    }>
                      {goal.status === "on_track"
                        ? "On Track"
                        : goal.status === "at_risk"
                          ? "At Risk"
                          : "Off Track"}
                    </Badge>
                  </div>

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Target: {goal.target}</span>
                    <span>{goal.progress}% Complete</span>
                  </div>

                  <Progress value={goal.progress} className={
                    goal.status === "on_track"
                      ? "bg-green-100 dark:bg-green-900"
                      : goal.status === "at_risk"
                        ? "bg-amber-100 dark:bg-amber-900"
                        : "bg-red-100 dark:bg-red-900"
                  } />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Meetings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <Calendar className="h-5 w-5 mr-2 text-primary" />
              Upcoming Meetings
            </CardTitle>
            <CardDescription>
              Scheduled meetings with your advisor
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingMeetings.length > 0 ? (
              <div className="space-y-4">
                {upcomingMeetings.map((meeting) => (
                  <div key={meeting.id} className="p-4 rounded-lg border space-y-2">
                    <h4 className="font-medium">{meeting.title}</h4>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>{format(new Date(meeting.date), "MMMM d, yyyy")}</span>
                      <span className="mx-2">•</span>
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{meeting.time}</span>
                    </div>
                    <div className="pt-2 flex gap-2">
                      <Button className="gap-2" variant="outline">
                        <Calendar className="h-4 w-4" />
                        Add to Calendar
                      </Button>
                      <Button className="gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Message Advisor
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                No upcoming meetings scheduled at this time.
              </div>
            )}

            <div className="mt-4 pt-4 border-t">
              <Button className="w-full gap-2">
                <Calendar className="h-4 w-4" />
                Schedule Meeting
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Financial Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <FileText className="h-5 w-5 mr-2 text-primary" />
              Financial Documents
            </CardTitle>
            <CardDescription>
              Access your financial plan and reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-muted">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Financial Plan 2025</h4>
                    <p className="text-xs text-muted-foreground">
                      Updated on May 1, 2025
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1">
                    <Eye className="h-3 w-3" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Download className="h-3 w-3" />
                    Download
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-muted">
                    <BarChart3 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Investment Analysis Report</h4>
                    <p className="text-xs text-muted-foreground">
                      Generated on April 15, 2025
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1">
                    <Eye className="h-3 w-3" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Download className="h-3 w-3" />
                    Download
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-muted">
                    <Calculator className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Retirement Projections</h4>
                    <p className="text-xs text-muted-foreground">
                      Generated on April 10, 2025
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1">
                    <Eye className="h-3 w-3" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Download className="h-3 w-3" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Advisory Client View
  const AdvisoryClientView = () => {
    const projectPhases = [
      { id: 1, name: "Discovery", status: "completed", description: "Initial assessment and data gathering" },
      { id: 2, name: "Analysis", status: "in_progress", description: "Business analysis and recommendation development" },
      { id: 3, name: "Implementation", status: "pending", description: "Execute on strategic recommendations" },
      { id: 4, name: "Review", status: "pending", description: "Evaluate results and adjust approach" }
    ];

    const deliverables = [
      { id: 1, name: "Business Assessment Report", status: "delivered", date: "2025-04-20" },
      { id: 2, name: "Strategic Growth Plan", status: "in_progress", date: "2025-05-15" },
      { id: 3, name: "Cash Flow Projection Model", status: "planned", date: "2025-06-01" }
    ];

    const nextMilestones = [
      { id: 1, name: "Strategic Planning Workshop", date: "2025-05-10", type: "meeting" },
      { id: 2, name: "Growth Plan Delivery", date: "2025-05-15", type: "deliverable" },
      { id: 3, name: "Implementation Kickoff", date: "2025-05-25", type: "milestone" }
    ];

    return (
      <div className="space-y-6">
        {/* Project Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <CheckCircle2 className="h-5 w-5 mr-2 text-primary" />
              Project Progress
            </CardTitle>
            <CardDescription>
              Current status of your advisory project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="relative pb-4">
                <div className="absolute left-[19px] top-0 h-full w-0.5 bg-muted" />
                {projectPhases.map((phase, index) => (
                  <div key={phase.id} className="relative mb-6 last:mb-0">
                    <div className="flex gap-4">
                      <div className={`rounded-full h-10 w-10 flex items-center justify-center flex-shrink-0 z-10 ${
                        phase.status === "completed" 
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : phase.status === "in_progress"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-muted text-muted-foreground"
                      }`}>
                        {phase.status === "completed" ? (
                          <Check className="h-5 w-5" />
                        ) : phase.status === "in_progress" ? (
                          <Clock className="h-5 w-5" />
                        ) : (
                          <span>{index + 1}</span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center">
                          <h4 className="font-medium mr-2">{phase.name}</h4>
                          <Badge className={
                            phase.status === "completed"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : phase.status === "in_progress"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                : "bg-muted text-muted-foreground"
                          }>
                            {phase.status === "completed"
                              ? "Completed"
                              : phase.status === "in_progress"
                                ? "In Progress"
                                : "Planned"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {phase.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center border-t pt-4">
                <div className="text-sm">
                  <span className="text-muted-foreground">Overall Progress:</span>
                  <span className="ml-1 font-medium">40%</span>
                </div>
                <Progress value={40} className="w-64 h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deliverables */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <FileText className="h-5 w-5 mr-2 text-primary" />
              Project Deliverables
            </CardTitle>
            <CardDescription>
              Reports and documents for your advisory project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deliverables.map((deliverable) => (
                <div key={deliverable.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div className="space-y-1">
                    <h4 className="font-medium">{deliverable.name}</h4>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>
                        {deliverable.status === "delivered" ? "Delivered" : "Expected"} on {format(new Date(deliverable.date), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>

                  {deliverable.status === "delivered" ? (
                    <Button variant="outline" size="sm" className="gap-1">
                      <Download className="h-3 w-3" />
                      Download
                    </Button>
                  ) : (
                    <Badge className={
                      deliverable.status === "in_progress"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-muted text-muted-foreground"
                    }>
                      {deliverable.status === "in_progress" ? "In Progress" : "Planned"}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Next Milestones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <Calendar className="h-5 w-5 mr-2 text-primary" />
              Upcoming Milestones
            </CardTitle>
            <CardDescription>
              Important dates for your advisory project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {nextMilestones.map((milestone) => {
                const daysUntil = daysRemaining(milestone.date);

                return (
                  <div key={milestone.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div>
                      <h4 className="font-medium">{milestone.name}</h4>
                      <div className="flex items-center text-xs mt-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span className="text-muted-foreground">
                          {format(new Date(milestone.date), "MMM d, yyyy")}
                          {daysUntil !== null && daysUntil <= 7 ? (
                            <span className="ml-1 text-amber-600">({daysUntil} days away)</span>
                          ) : null}
                        </span>
                      </div>
                    </div>

                    <Badge variant="outline" className={
                      milestone.type === "meeting"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                        : milestone.type === "deliverable"
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                          : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    }>
                      {milestone.type.charAt(0).toUpperCase() + milestone.type.slice(1)}
                    </Badge>
                  </div>
                );
              })}

              {nextMilestones.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No upcoming milestones at this time.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Project Team */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <Users className="h-5 w-5 mr-2 text-primary" />
              Project Team
            </CardTitle>
            <CardDescription>
              Your advisory team members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {staff && staff.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {staff.map((member) => (
                    <div key={member.id} className="flex items-center space-x-4 border rounded-lg p-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium">{member.name}</h4>
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                        <Button variant="link" className="h-auto p-0 text-sm" asChild>
                          <Link href={`/client/messages?project_id=${project.id}`}>
                            Message
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No team members have been assigned yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Determine which view to show based on service type
  const getServiceView = () => {
    if (serviceType.includes("Tax")) {
      return <TaxClientView />;
    } else if (serviceType.includes("Audit")) {
      return <AuditClientView />;
    } else if (serviceType.includes("Bookkeeping") || serviceType.includes("CAS")) {
      return <BookkeepingClientView />;
    } else if (serviceType.includes("Financial Planning")) {
      return <FinancialPlanningView />;
    } else if (serviceType.includes("Advisory")) {
      return <AdvisoryClientView />;
    } else {
      return (
        <div className="p-6 text-center">
          <p className="text-muted-foreground">No specialized view available for this service type.</p>
        </div>
      );
    }
  };

  return (
    <div>
      {/* Service-specific header */}
      <Card className="mb-6 border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                {serviceType.includes("Tax") && <FileText className="h-5 w-5 text-blue-500" />}
                {serviceType.includes("Audit") && <Check className="h-5 w-5 text-red-500" />}
                {(serviceType.includes("Bookkeeping") || serviceType.includes("CAS")) && <FileSpreadsheet className="h-5 w-5 text-green-500" />}
                {serviceType.includes("Financial Planning") && <BarChart3 className="h-5 w-5 text-purple-500" />}
                {serviceType.includes("Advisory") && <Users className="h-5 w-5 text-amber-500" />}
                {serviceType || "Client"} Portal
              </h2>
              <p className="text-sm text-muted-foreground">
                Welcome to your {serviceType} client portal. Track status, access documents, and communicate with your team.
              </p>
            </div>

            <Button variant="outline" size="sm" className="gap-2" asChild>
              <Link href={`/client/messages?project_id=${project.id}`}>
                <MessageSquare className="h-4 w-4" />
                Contact Your Accountant
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Render the appropriate service view */}
      {getServiceView()}

      {/* Call to action banner */}
      {project.status === "Awaiting Signature" && (
        <Card className="mt-6 border-primary bg-primary/5">
          <CardContent className="py-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-primary" />
                <div>
                  <h3 className="font-medium">Your Engagement Letter is Ready</h3>
                  <p className="text-sm text-muted-foreground">Please review and sign your engagement letter to proceed</p>
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
};

export default ClientPortalServiceViews;