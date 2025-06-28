"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

import EnhancedDocumentsTab from "@/components/EnhancedDocumentsTab";
import ServiceSpecificViews from "@/components/ServiceSpecificViews";
import TaskScheduler from "@/components/TaskScheduler";

/* --------------------------------------------------------------------------
   NEW UnifiedProjectTimeline import
-------------------------------------------------------------------------- */
import UnifiedProjectTimeline from "@/components/UnifiedProjectTimeline";
import type { WorkflowTask } from "@/components/UnifiedProjectTimeline";

import {
  ArrowLeft,
  FileText,
  MessageSquare,
  Loader2,
  RefreshCw,
  Check,
  Clock,
  Users,
  Calculator,
  FileSignature,
  ListTodo,
  BrainCircuit,
  AlertCircle,
  Eye,
  ArrowRight,
  CheckCircle,
  HelpCircle,
  UserPlus,
  Briefcase,
  Wand2,
  Brain,
  CheckCircle2,
} from "lucide-react";

/* -------------------------------------------------------------------
   Interfaces / Types
------------------------------------------------------------------- */

interface ProjectDocument {
  id: number;
  name: string;
}

interface Note {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

interface Task {
  id: string | number;
  name: string;
  status?: "pending" | "in_progress" | "blocked" | "completed";
  deadline?: string;
  notes?: Note[];
}

interface Staff {
  id: number;
  name: string;
  role?: string;
}

interface Message {
  id: number;
  sender: "staff" | "client";
  sender_id?: number;
  text: string;
  timestamp?: string;
}

interface Project {
  id: number;
  client_name: string;
  service_type: string;
  status: string;
  docs: ProjectDocument[];
  assigned_staff: number[];
  staff_roles?: { [staffId: number]: string };
  messages?: Message[];
  created_at?: string;
  updated_at?: string;
}

interface QAResponse {
  answer: string;
}

/* -------------------------------------------------------------------
   Constants
------------------------------------------------------------------- */
const API_BASE_URL = "http://localhost:8000";

/* -------------------------------------------------------------------
   Sub-components
------------------------------------------------------------------- */

/** Simulate sending to an engagement letter system **/
interface SendToEngagementLetterButtonProps {
  project: Project | null;
  isDisabled?: boolean;
}
const SendToEngagementLetterButton: React.FC<SendToEngagementLetterButtonProps> = ({
  project,
  isDisabled = false,
}) => {
  const [sending, setSending] = useState<boolean>(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState<boolean>(false);
  const { toast } = useToast();

  const handleSend = async () => {
    if (!project) return;
    setSending(true);
    try {
      // Simulate an external send operation
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast({
        title: "Success!",
        description: "Project data sent to engagement letter software.",
      });
      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Error sending to engagement letter software:", error);
      toast({
        title: "Error",
        description: "Could not send data to engagement letter software. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Button onClick={handleSend} disabled={sending || isDisabled} className="w-full gap-2">
        {sending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <FileSignature className="h-4 w-4" />
            Send to Engagement Letter Software
          </>
        )}
      </Button>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              Successfully Sent
            </DialogTitle>
            <DialogDescription>
              Project information for {project?.client_name} has been sent.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="rounded-lg p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <h4 className="font-medium text-green-800 mb-1">Next Steps</h4>
              <p className="text-sm text-green-700">
                Check the engagement letter page for status.
              </p>
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <Link href={`/staff/pricing?project_id=${project?.id}`}>
              <Button variant="outline" className="gap-2">
                <Calculator className="h-4 w-4" />
                Pricing Analysis
              </Button>
            </Link>
            <Link href={`/staff/letter?project_id=${project?.id}`}>
              <Button className="gap-2">
                <FileSignature className="h-4 w-4" />
                View Letter Status
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

/** Simple Q&A component that calls an AI endpoint **/
interface QAComponentProps {
  projectId: number;
}
const QAComponent: React.FC<QAComponentProps> = ({ projectId }) => {
  const [question, setQuestion] = useState<string>("");
  const [answer, setAnswer] = useState<string>("");
  const [isAsking, setIsAsking] = useState<boolean>(false);
  const { toast } = useToast();

  const askQuestion = async () => {
    if (!question.trim()) return;
    setIsAsking(true);
    try {
      const res = await axios.post<QAResponse>(`${API_BASE_URL}/qa`, {
        project_id: projectId,
        question,
      });
      setAnswer(res.data.answer);
      toast({
        title: "Question processed",
        description: "AI answered based on project data.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Couldn't process question.",
        variant: "destructive",
      });
      setAnswer("Sorry, I couldn't process that question.");
    } finally {
      setIsAsking(false);
    }
  };

  const handleEnterKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      askQuestion();
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center">
          <BrainCircuit className="mr-2 h-5 w-5 text-primary" />
          Project Assistant Q&A
        </CardTitle>
        <CardDescription>Ask about project data</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question..."
            onKeyDown={handleEnterKey}
          />
          <Button onClick={askQuestion} disabled={isAsking || !question.trim()}>
            {isAsking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ask"}
          </Button>
        </div>
        {answer && (
          <div className="mt-4 p-4 rounded-lg border bg-muted/30">
            <div className="flex">
              <Avatar className="h-8 w-8 mr-3">
                <AvatarFallback className="bg-primary/10">
                  <BrainCircuit className="h-4 w-4 text-primary" />
                </AvatarFallback>
              </Avatar>
              <p className="text-sm">{answer}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/** Next Step Guidance (shows recommended next status) **/
interface NextStepGuidanceProps {
  status: string;
  onActionClick: {
    handler: (newStatus: string) => Promise<void>;
    projectId: number;
  };
}
const NextStepGuidance: React.FC<NextStepGuidanceProps> = ({ status, onActionClick }) => {
  let content:
    | {
        title: string;
        description: string;
        action: string | null;
        nextStatus?: string;
        icon: JSX.Element;
        link?: string;
      }
    | undefined;

  switch (status) {
    case "Onboarding":
      content = {
        title: "Request Documents",
        description: "Request necessary docs.",
        action: "Request Documents",
        nextStatus: "Docs Requested",
        icon: <FileText className="h-4 w-4" />,
      };
      break;
    case "Docs Requested":
      content = {
        title: "Waiting for Documents",
        description: "Once received, proceed.",
        action: "Mark as Received",
        nextStatus: "Docs Received",
        icon: <Clock className="h-4 w-4" />,
      };
      break;
    case "Docs Received":
      content = {
        title: "Proceed to Pricing Analysis",
        description: "Documents received.",
        action: "Start Pricing Analysis",
        nextStatus: "Pricing/Analysis",
        icon: <Calculator className="h-4 w-4" />,
        link: `/staff/pricing?project_id=${onActionClick.projectId}`,
      };
      break;
    case "Pricing/Analysis":
      content = {
        title: "Send Engagement Letter",
        description: "Send letter.",
        action: "Create Engagement Letter",
        nextStatus: "Awaiting Signature",
        icon: <FileSignature className="h-4 w-4" />,
        link: `/staff/letter?project_id=${onActionClick.projectId}`,
      };
      break;
    case "Awaiting Signature":
      content = {
        title: "Waiting for Signature",
        description: "Waiting for client.",
        action: "Check Signature Status",
        nextStatus: "Project Started",
        icon: <RefreshCw className="h-4 w-4" />,
      };
      break;
    case "Project Started":
      content = {
        title: "Project in Progress",
        description: "Manage tasks.",
        action: "Mark as Completed",
        nextStatus: "Completed",
        icon: <CheckCircle className="h-4 w-4" />,
      };
      break;
    case "Completed":
      content = {
        title: "Project Completed",
        description: "All work done.",
        action: null,
        icon: <Check className="h-4 w-4" />,
      };
      break;
    default:
      return null;
  }

  if (!content) return null;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center">
          <ArrowRight className="h-4 w-4 mr-2 text-primary" />
          Next Step: {content.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <p className="text-sm text-muted-foreground mb-4">{content.description}</p>
        {content.action &&
          (content.link ? (
            <Link href={content.link}>
              <Button className="w-full gap-2">
                {content.icon}
                {content.action}
              </Button>
            </Link>
          ) : (
            <Button
              className="w-full gap-2"
              onClick={() =>
                content.nextStatus && onActionClick.handler(content.nextStatus)
              }
            >
              {content.icon}
              {content.action}
            </Button>
          ))}
      </CardContent>
    </Card>
  );
};

const getStatusIcon = (status: string): JSX.Element => {
  switch (status) {
    case "Onboarding":
      return <Users className="h-5 w-5 text-blue-500" />;
    case "Docs Requested":
      return <FileText className="h-5 w-5 text-amber-500" />;
    case "Docs Received":
      return <CheckCircle className="h-5 w-5 text-violet-500" />;
    case "Pricing/Analysis":
      return <Calculator className="h-5 w-5 text-cyan-500" />;
    case "Awaiting Signature":
      return <FileSignature className="h-5 w-5 text-pink-500" />;
    case "Project Started":
      return <Briefcase className="h-5 w-5 text-emerald-500" />;
    case "Completed":
      return <Check className="h-5 w-5 text-green-500" />;
    default:
      return <HelpCircle className="h-5 w-5 text-gray-500" />;
  }
};

/* ------------------------------------------------------------------
   KickoffAnalyzer – a multi-step approach with 2 tabs
------------------------------------------------------------------ */
function KickoffAnalyzer({
  open,
  onOpenChange,
  serviceType,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  serviceType: string;
}) {
  const { toast } = useToast();
  const [stepIndex, setStepIndex] = React.useState(0);

  const STEPS = [
    {
      key: "preparing",
      label: "Preparing Environment",
      description: "Setting up initial environment and loading modules.",
    },
    {
      key: "scanning",
      label: "Scanning Project Data",
      description: "Analyzing questionnaires, prior docs, and scope.",
    },
    {
      key: "matching",
      label: "Matching Service Template",
      description: "Applying templates for tasks relevant to the service type.",
    },
    {
      key: "generating",
      label: "Generating Task Timeline",
      description: "Building out tasks, deadlines, and dependencies.",
    },
    {
      key: "finalizing",
      label: "Finalizing Kick-off Setup",
      description: "Cleaning data and preparing final handoff.",
    },
    {
      key: "complete",
      label: "Kick-off Complete",
      description: "All tasks have been generated and are ready to use.",
    },
  ];

  function getProgressValue(i: number) {
    switch (i) {
      case 0:
        return 5;
      case 1:
        return 25;
      case 2:
        return 50;
      case 3:
        return 75;
      case 4:
        return 90;
      case 5:
        return 100;
      default:
        return 0;
    }
  }

  const currentStep = STEPS[stepIndex];
  const progressValue = getProgressValue(stepIndex);

  React.useEffect(() => {
    if (!open) return;

    setStepIndex(0);

    const intervals = [
      setTimeout(() => setStepIndex(1), 1500),
      setTimeout(() => setStepIndex(2), 4000),
      setTimeout(() => setStepIndex(3), 7000),
      setTimeout(() => setStepIndex(4), 10000),
      setTimeout(() => setStepIndex(5), 13000),
      setTimeout(() => {
        toast({
          title: "Kick-off complete!",
          description: `Tasks ready for ${serviceType} workflow.`,
        });
      }, 13500),
    ];

    return () => intervals.forEach(clearTimeout);
  }, [open, serviceType, toast]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Kick-off Analyzer for {serviceType}
          </DialogTitle>
          <DialogDescription>
            Simulating generation of tasks & timeline.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="analysis">
          <TabsList className="grid grid-cols-2 w-full mb-4">
            <TabsTrigger value="analysis">Analysis Progress</TabsTrigger>
            <TabsTrigger value="details">Technical Details</TabsTrigger>
          </TabsList>

          {/* TAB 1 */}
          <TabsContent value="analysis">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="relative h-2 bg-muted/20 overflow-hidden rounded">
                  <div
                    className="h-full bg-primary transition-all duration-500 ease-out"
                    style={{ width: `${progressValue}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Processing tasks for {serviceType} project</span>
                  <span>{progressValue}%</span>
                </div>
              </div>

              <div className="space-y-3">
                {STEPS.map((step, i) => {
                  const isActive = i === stepIndex;
                  const isComplete = i < stepIndex;

                  let icon = <AlertCircle className="h-5 w-5 text-muted-foreground" />;
                  if (isComplete) {
                    icon = <CheckCircle2 className="h-5 w-5 text-green-500" />;
                  } else if (isActive) {
                    icon = <Loader2 className="h-5 w-5 animate-spin text-primary" />;
                  }

                  return (
                    <div key={step.key} className="flex items-start space-x-3">
                      {icon}
                      <div>
                        <p className={`font-medium ${isComplete ? "text-primary" : ""}`}>
                          {step.label}
                        </p>
                        <p className="text-xs text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-md border bg-muted/30 p-4">
                <div className="flex items-start space-x-3">
                  {stepIndex < STEPS.length - 1 ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}

                  <div>
                    <p className="font-medium">
                      {stepIndex < STEPS.length - 1
                        ? "Current Step:"
                        : "All Steps Complete!"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {currentStep.label} — {currentStep.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2 */}
          <TabsContent value="details">
            <ScrollArea className="h-[300px] pr-2">
              <div className="text-xs font-mono space-y-3">
                <div>
                  <p className="text-green-600">> Initializing AI environment…</p>
                  <p className="text-muted-foreground pl-4">Loading baseline task templates…</p>
                  <p className="text-muted-foreground pl-4">Loading {serviceType} parameters…</p>
                  <p className="text-muted-foreground pl-4">
                    Checking existing tasks or prior templates…
                  </p>
                  <p className="text-muted-foreground pl-4">Ready to proceed.</p>
                </div>

                {stepIndex >= 1 && (
                  <div>
                    <p className="text-green-600">> Scanning project data…</p>
                    <p className="text-muted-foreground pl-4">
                      Found client questionnaire, scope definitions.
                    </p>
                    <p className="text-muted-foreground pl-4">
                      Checking required tasks for {serviceType}.
                    </p>
                  </div>
                )}

                {stepIndex >= 2 && (
                  <div>
                    <p className="text-green-600">> Matching service template…</p>
                    <p className="text-muted-foreground pl-4">
                      Mapped tasks from library: 23 possible tasks found.
                    </p>
                    <p className="text-muted-foreground pl-4">
                      Filtering tasks based on project scope & staffing.
                    </p>
                  </div>
                )}

                {stepIndex >= 3 && (
                  <div>
                    <p className="text-green-600">> Generating task timeline…</p>
                    <p className="text-muted-foreground pl-4">
                      Setting deadlines and dependencies.
                    </p>
                    <p className="text-muted-foreground pl-4">
                      Grouping tasks under phases: planning, execution, review.
                    </p>
                  </div>
                )}

                {stepIndex >= 4 && (
                  <div>
                    <p className="text-green-600">> Finalizing kick-off…</p>
                    <p className="text-muted-foreground pl-4">
                      Locking in start & end dates for each phase.
                    </p>
                    <p className="text-muted-foreground pl-4">
                      Creating final task manifest for staff assignment.
                    </p>
                  </div>
                )}

                {stepIndex >= 5 && (
                  <div>
                    <p className="text-green-600">> Done!</p>
                    <p className="text-muted-foreground pl-4">
                      Created tasks successfully for {serviceType} workflow.
                    </p>
                    <p className="text-muted-foreground pl-4">
                      Kick-off is complete and ready for next steps.
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------
   EnhancedProjectDetailPage
------------------------------------------------------------------- */
export default function EnhancedProjectDetailPage(): JSX.Element {
  const params = useParams() as { id?: string };
  const projectId = parseInt(params.id || "1", 10);

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
  const [statusUpdating, setStatusUpdating] = useState<boolean>(false);
  const [staffSelection, setStaffSelection] = useState<number[]>([]);
  const [staffRoles, setStaffRoles] = useState<{ [staffId: number]: string }>({});
  const [timelineTasks, setTimelineTasks] = useState<WorkflowTask[]>([]);

  // For the KickoffAnalyzer dialog:
  const [showKickoff, setShowKickoff] = useState(false);

  const { toast } = useToast();

  // NEW local state for the risk score, generated once on mount.
  const [riskScore, setRiskScore] = useState<number | null>(null);

  // Generate dummy risk once on mount
  useEffect(() => {
    setRiskScore(Math.floor(Math.random() * 100));
  }, []);

  // Load the project data
  const loadProject = async () => {
    setLoading(true);
    try {
      const projRes = await axios.get<Project>(`${API_BASE_URL}/projects/${projectId}`);
      setProject(projRes.data);

      const staffRes = await axios.get<Staff[]>(`${API_BASE_URL}/staff/`);
      setStaffMembers(staffRes.data);

      toast({
        title: "Project loaded",
        description: `Loaded details for ${projRes.data.client_name}`,
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error loading project",
        description: "Could not load project details.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [projectId]);

  // Sync staff from project data
  useEffect(() => {
    if (project && project.assigned_staff) {
      setStaffSelection(project.assigned_staff);
      const roles: { [staffId: number]: string } = {};
      project.assigned_staff.forEach((id) => {
        roles[id] = project.staff_roles?.[id] || "staff";
      });
      setStaffRoles(roles);
    }
  }, [project]);

  // Update the project status
  const updateStatus = async (newStatus: string) => {
    if (!project) return;
    setStatusUpdating(true);
    try {
      await axios.patch(`${API_BASE_URL}/projects/${project.id}/status?new_status=${newStatus}`);
      toast({
        title: "Status updated",
        description: `Status changed to ${newStatus}.`,
      });
      loadProject();
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not update status.",
      });
    } finally {
      setStatusUpdating(false);
    }
  };

  // Assign staff
  const handleStaffAssignment = async () => {
    if (!project) return;
    try {
      await axios.post(`${API_BASE_URL}/projects/${project.id}/assign-staff`, {
        project_id: project.id,
        staff_ids: staffSelection,
        staff_roles: staffRoles,
      });
      toast({
        title: "Staff assigned",
        description: "Assignments updated.",
      });
      loadProject();
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not update staff.",
      });
    }
  };

  // Relative time helper
  const formatRelativeTime = (timestamp?: string) => {
    if (!timestamp) return "Unknown";
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (days === 0) {
        const hrs = Math.floor(diff / (1000 * 60 * 60));
        if (hrs === 0) {
          const mins = Math.floor(diff / (1000 * 60));
          return `${mins} minute${mins !== 1 ? "s" : ""} ago`;
        }
        return `${hrs} hour${hrs !== 1 ? "s" : ""} ago`;
      } else if (days < 7) {
        return `${days} day${days !== 1 ? "s" : ""} ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch {
      return "Invalid date";
    }
  };

  // Quick staff name fetch
  const getStaffName = (id: number): string => {
    return staffMembers.find((s) => s.id === id)?.name || "Unknown";
  };

  // Status pill
  const renderStatusBadge = (status: string): JSX.Element => {
    const colors: { [key: string]: { color: string; bg: string } } = {
      Onboarding: { color: "text-blue-700", bg: "bg-blue-100" },
      "Docs Requested": { color: "text-amber-700", bg: "bg-amber-100" },
      "Docs Received": { color: "text-violet-700", bg: "bg-violet-100" },
      "Pricing/Analysis": { color: "text-cyan-700", bg: "bg-cyan-100" },
      "Awaiting Signature": { color: "text-pink-700", bg: "bg-pink-100" },
      "Project Started": { color: "text-emerald-700", bg: "bg-emerald-100" },
      Completed: { color: "text-green-700", bg: "bg-green-100" },
    };
    const style = colors[status] || { color: "text-gray-700", bg: "bg-gray-100" };
    return (
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${style.color} ${style.bg}`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Top row (Back link, client name, service type, status, etc.) */}
      <div className="flex items-center space-x-2 mb-2">
        <Link href="/staff">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <Separator orientation="vertical" className="h-6" />
        <h1 className="text-2xl font-bold">
          {loading ? "Loading Project..." : project?.client_name}
        </h1>
        {project && (
          <div className="flex items-center space-x-2">
            <Badge className="ml-2">{project.service_type}</Badge>
            {renderStatusBadge(project.status)}
            {/* MOVED: Deadline Risk card is now next to the status badges */}
            {riskScore !== null && (
              <Badge
                className={
                  riskScore > 70
                    ? "bg-red-100 text-red-800 dark:bg-red-600 dark:text-white"
                    : riskScore > 40
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-600 dark:text-white"
                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-600 dark:text-white"
                }
              >
                Deadline Risk: {riskScore}%
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : project ? (
        <div className="space-y-6">
          {/* Timeline card (now WITHOUT the risk badge) */}
          <Card>
            <CardHeader className="pb-2 flex items-center justify-between">
              <div className="flex items-center">
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-primary" />
                  Project Timeline
                </CardTitle>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => setShowKickoff(true)}
              >
                <Wand2 className="h-4 w-4" />
                Kick Off Project
              </Button>
            </CardHeader>
            <CardContent>
              <UnifiedProjectTimeline projectStatus={project.status} tasks={timelineTasks} />
            </CardContent>
          </Card>

          {/* KickoffAnalyzer dialog */}
          <KickoffAnalyzer
            open={showKickoff}
            onOpenChange={setShowKickoff}
            serviceType={project.service_type}
          />

          {/* Engagement Letter */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <FileSignature className="h-5 w-5 mr-2 text-primary" />
                Engagement Letter
              </CardTitle>
              <CardDescription>Send to engagement letter software</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 flex flex-col justify-center space-y-1">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 text-muted-foreground mr-2" />
                    <span className="text-sm">
                      {project.docs?.length || 0} document
                      {project.docs?.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 text-muted-foreground mr-2" />
                    <span className="text-sm">Client: {project.client_name}</span>
                  </div>
                  <div className="flex items-center">
                    <Calculator className="h-4 w-4 text-muted-foreground mr-2" />
                    <span className="text-sm">
                      <Link
                        href={`/staff/pricing?project_id=${project.id}`}
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        Optional: Run pricing analysis
                      </Link>
                    </span>
                  </div>
                </div>
                <div className="flex items-center">
                  <SendToEngagementLetterButton
                    project={project}
                    isDisabled={[
                      "Awaiting Signature",
                      "Project Started",
                      "Completed",
                    ].includes(project.status)}
                  />
                </div>
              </div>

              {["Awaiting Signature", "Project Started", "Completed"].includes(project.status) && (
                <div className="rounded-lg bg-amber-50 p-3 text-amber-800 flex items-start">
                  <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
                  <p>
                    Engagement letter has already been sent. View it on the engagement letter page.
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t pt-3">
              <div className="flex justify-between w-full">
                <Link href={`/staff/pricing?project_id=${project.id}`}>
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    <Calculator className="h-3 w-3" />
                    Pricing
                  </Button>
                </Link>
                <Link href={`/staff/letter?project_id=${project.id}`}>
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    <Eye className="h-3 w-3" />
                    View Letter
                  </Button>
                </Link>
              </div>
            </CardFooter>
          </Card>

          {/* Next Step Guidance */}
          <NextStepGuidance
            status={project.status}
            onActionClick={{ handler: updateStatus, projectId: project.id }}
          />

          {/* Project + Status Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Project Info */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Briefcase className="h-5 w-5 mr-2" />
                  Project Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Client</p>
                    <p className="font-medium">{project.client_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Project Number</p>
                    <p className="font-medium">#{project.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Service Type</p>
                    <p className="font-medium">{project.service_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created Date</p>
                    <p className="font-medium">
                      {project.created_at
                        ? new Date(project.created_at).toLocaleDateString()
                        : "Unknown"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="font-medium">
                      {project.updated_at ? formatRelativeTime(project.updated_at) : "Unknown"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Documents</p>
                    <p className="font-medium">{project.docs.length} document(s)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {getStatusIcon(project.status)}
                  <span className="ml-2">Current Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-3">
                    {renderStatusBadge(project.status)}
                    <span className="text-xs text-muted-foreground">
                      Since{" "}
                      {project.updated_at
                        ? new Date(project.updated_at).toLocaleDateString()
                        : "Unknown"}
                    </span>
                  </div>
                  <Separator className="my-3" />
                  <p className="text-sm text-muted-foreground mb-1">Update Status Manually</p>
                  <Select
                    defaultValue={project.status}
                    onValueChange={(value) => updateStatus(value)}
                    disabled={statusUpdating}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Change status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Onboarding">Onboarding</SelectItem>
                      <SelectItem value="Docs Requested">Docs Requested</SelectItem>
                      <SelectItem value="Docs Received">Docs Received</SelectItem>
                      <SelectItem value="Pricing/Analysis">Pricing/Analysis</SelectItem>
                      <SelectItem value="Awaiting Signature">Awaiting Signature</SelectItem>
                      <SelectItem value="Project Started">Project Started</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <div className="w-full space-y-2">
                  <Link href={`/staff/pricing?project_id=${project.id}`} className="w-full">
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      <Calculator className="h-4 w-4" />
                      Pricing
                    </Button>
                  </Link>
                  <Link href={`/staff/letter?project_id=${project.id}`} className="w-full">
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      <FileSignature className="h-4 w-4" />
                      Engagement Letter
                    </Button>
                  </Link>
                </div>
              </CardFooter>
            </Card>
          </div>

          {/* Staff Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Assigned Staff
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {project.assigned_staff?.length > 0 ? (
                  project.assigned_staff.map((staffId) => {
                    const staff = staffMembers.find((s) => s.id === staffId);
                    const role = project.staff_roles?.[staffId] || "staff";
                    let label = "Staff";
                    let badge = "bg-gray-100 text-gray-800";

                    if (role === "point_of_contact") {
                      label = "Point of Contact";
                      badge = "bg-blue-100 text-blue-800";
                    } else if (role === "partner_assigned") {
                      label = "Partner Assigned";
                      badge = "bg-purple-100 text-purple-800";
                    }

                    return (
                      <div
                        key={staffId}
                        className="flex items-center space-x-3 border rounded-lg p-3"
                      >
                        <Avatar>
                          <AvatarFallback>
                            {staff ? staff.name.charAt(0) : "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{staff ? staff.name : "Unknown Staff"}</p>
                          <div className="flex items-center mt-1">
                            <Badge className={`text-xs ${badge}`}>{label}</Badge>
                            <span className="text-xs text-muted-foreground ml-2">
                              {staff ? staff.role : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-muted-foreground">No staff assigned</div>
                )}
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Assign Staff
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Assign Staff to Project</DialogTitle>
                    <DialogDescription>Select staff and roles.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-4">
                      {staffMembers.map((staff) => {
                        const checked = staffSelection.includes(staff.id);
                        return (
                          <div key={staff.id} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                id={`staff-${staff.id}`}
                                checked={checked}
                                onCheckedChange={(val) => {
                                  const isChecked = !!val;
                                  if (isChecked) {
                                    setStaffSelection((prev) => [...prev, staff.id]);
                                  } else {
                                    setStaffSelection((prev) =>
                                      prev.filter((id) => id !== staff.id)
                                    );
                                  }
                                }}
                              />
                              <label
                                htmlFor={`staff-${staff.id}`}
                                className="font-medium cursor-pointer"
                              >
                                {staff.name}
                              </label>
                            </div>
                            {checked && (
                              <Select
                                value={staffRoles[staff.id] || "staff"}
                                onValueChange={(value) =>
                                  setStaffRoles((prev) => ({
                                    ...prev,
                                    [staff.id]: value,
                                  }))
                                }
                              >
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="staff">Staff</SelectItem>
                                  <SelectItem value="point_of_contact">Point of Contact</SelectItem>
                                  <SelectItem value="partner_assigned">Partner Assigned</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleStaffAssignment}>Save Staff Assignments</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>

          {/* TABS: Tasks / Documents / Messages / Workflow */}
          <Tabs defaultValue="tasks">
            <TabsList className="grid grid-cols-4 w-full md:w-2/3">
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="workflow">Workflow</TabsTrigger>
            </TabsList>

            {/* Tasks Tab */}
            <TabsContent value="tasks" className="space-y-4 mt-2">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Project Tasks</h3>
                <Button size="sm" className="gap-2">
                  <ListTodo className="h-4 w-4" />
                  Add Task
                </Button>
              </div>

              {/* Task Scheduler */}
              <TaskScheduler
                project={project}
                staffMembers={staffMembers}
                onTaskScheduled={(updatedTask) => {
                  setTimelineTasks((prev) => [...prev, updatedTask]);
                }}
              />

              {/* Q&A (AI Chat) at the bottom of the Tasks tab */}
              <QAComponent projectId={project.id} />
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-4 mt-2">
              <EnhancedDocumentsTab project={project} />

              {/* Q&A (AI Chat) at the bottom of the Documents tab */}
              <QAComponent projectId={project.id} />
            </TabsContent>

            {/* Messages Tab */}
            <TabsContent value="messages" className="space-y-4 mt-2">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Project Messages</h3>
                <Link href={`/staff/messages?project_id=${project.id}`}>
                  <Button size="sm" className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Message Center
                  </Button>
                </Link>
              </div>

              <Card>
                <CardContent className="pt-6">
                  <ScrollArea className="h-[300px] pr-4">
                    {project.messages && project.messages.length > 0 ? (
                      <div className="space-y-4">
                        {project.messages.map((message) => (
                          <div key={message.id} className="flex items-start space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {message.sender === "staff" ? "S" : "C"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                              <div className="flex items-center">
                                <p className="text-sm font-medium">
                                  {message.sender === "staff"
                                    ? message.sender_id
                                      ? getStaffName(message.sender_id)
                                      : "Staff"
                                    : `${project.client_name} (Client)`}
                                </p>
                                <span className="mx-2 text-xs text-muted-foreground">•</span>
                                <p className="text-xs text-muted-foreground">
                                  {message.timestamp ? formatRelativeTime(message.timestamp) : ""}
                                </p>
                              </div>
                              <p className="text-sm">{message.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                        No messages found for this project
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Link href={`/staff/messages?project_id=${project.id}`} className="w-full">
                    <Button className="w-full gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Go to Message Center
                    </Button>
                  </Link>
                </CardFooter>
              </Card>

              {/* Q&A (AI Chat) at the bottom of the Messages tab */}
              <QAComponent projectId={project.id} />
            </TabsContent>

            {/* Workflow Tab */}
            <TabsContent value="workflow" className="space-y-4 mt-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    Workflow Dashboard
                  </CardTitle>
                  <CardDescription>
                    Specialized views for {project.service_type} projects
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ServiceSpecificViews
                    project={project}
                    onUpdateStatus={updateStatus}
                    onTasksChange={setTimelineTasks}
                  />
                </CardContent>
              </Card>

              {/* Q&A (AI Chat) at the bottom of the Workflow tab */}
              <QAComponent projectId={project.id} />
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            Project not found
          </CardContent>
        </Card>
      )}
    </div>
  );
}