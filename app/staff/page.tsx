"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ModeToggle } from "@/components/mode-toggle";
import {
  ArrowLeft,
  FileUp,
  MessageSquareText,
  FileText,
  Users,
  Loader2,
  BrainCircuit,
  Plus,
  RefreshCw,
  MessageSquare,
  Calculator,
  Check,
  X,
  AlertCircle,
  BellRing,
  Building,
  FileSpreadsheet,
  FolderSync,
  Upload,
  Clock,
  ChevronRight,
  BarChart3,
  Inbox,
  Landmark,
  Calendar,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import WorkflowTemplateSelector from "@/components/WorkflowTemplateSelector";

// -- existing imports …                                            //
import FirmTaskBoard, { TaskLite } from "@/components/FirmTaskBoard";
import EnhancedProjectCard from "@/components/EnhancedProjectCard";
import FirmEngagementTable, {
  FirmEngagement,
} from "@/components/FirmEngagementTable";
import { dummyEngagements, dummyProspects } from "@/components/DummyFirmData";
import AnalyticsTab from "@/components/AnalyticsTab";
import { Search } from "lucide-react";
// 👇 NEW imports (step 1️⃣)
import AllClientsTable from "@/components/AllClientsTable";
import NewClientsTable from "@/components/NewClientsTable";
// -- existing imports continue …                                   //

// API base URL
const API_BASE_URL = "https://keyveve-accounting-demo-backend.onrender.com";

// Project status options
const PROJECT_STATUSES = [
  "Onboarding",
  "Docs Requested",
  "Docs Received",
  "Pricing/Analysis",
  "Awaiting Signature",
  "Project Started",
  "Completed",
];

// Service types
const SERVICE_TYPES = [
  "Tax Return",
  "Bookkeeping",
  "Financial Planning",
  "Audit",
  "Advisory",
];

// Interface definitions
interface Document {
  doc_id: string;
  original_name: string;
  stored_name: string;
  doc_type: string;
  extracted_data: string;
  storage_location: string;
  doc_category: string;
  upload_timestamp?: string;
}

interface Message {
  id: string;
  project_id: number;
  sender: string;
  sender_id?: string;
  text: string;
  timestamp?: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  deadline?: string;
  assigned_to: string[];
  related_docs: string[];
  scheduled_start?: string;
  scheduled_end?: string;
  created_at: string;
  updated_at: string;
}

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
  created_at?: string;
  updated_at?: string;
}

interface Notification {
  id: string;
  project_id: number;
  type: string;
  message: string;
  created_at: string;
  read: boolean;
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
}

interface Integration {
  name: string;
  connected: boolean;
  last_sync: string | null;
}

// Q&A component that can be embedded in the dashboard
const QAComponent = () => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const { toast } = useToast();

  const askQuestion = async () => {
    if (!question.trim()) return;

    setIsAsking(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/qa`, {
        question: question,
        global_context: true,
      });

      setAnswer(response.data.answer);
      toast({
        title: "Question processed",
        description: "AI has provided an answer based on your data.",
      });
    } catch (error) {
      console.error("Error asking question:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not get an answer. Please try again.",
      });
      setAnswer(
        "I'm sorry, I couldn't process that question. Please try again or rephrase your question."
      );
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BrainCircuit className="mr-2 h-5 w-5 text-primary" />
          AI Assistant
        </CardTitle>
        <CardDescription>
          Ask questions about your projects, clients, or accounting workflows
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about your projects, clients, or tasks..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                askQuestion();
              }
            }}
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

export default function StaffDashboardPage() {
  // State hooks
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedTab, setSelectedTab] = useState("active-projects");
  const [clientName, setClientName] = useState("");
  const [serviceType, setServiceType] = useState(SERVICE_TYPES[0]);
  const [loading, setLoading] = useState(false);
  const [csvContent, setCsvContent] = useState("");
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [integrations, setIntegrations] = useState<Record<string, Integration>>(
    {}
  );
  const [integrationsLoading, setIntegrationsLoading] = useState(false);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [staffRoles, setStaffRoles] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [serviceFilter, setServiceFilter] = useState<string | null>(null);
  const [staffFilter, setStaffFilter] = useState<string | null>(null);

  // **Add the view mode state**:
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Add the project risk scores state
  const [projectRiskScores, setProjectRiskScores] = useState<
    Record<number, number>
  >({});

  // ** [NEW] State for Firm Engagements (dummy data fallback) **
  const [allEngagements, setAllEngagements] = useState<FirmEngagement[]>(
    dummyEngagements
  );

  const [allProspects, setAllProspects] = useState(dummyProspects);

  const { toast } = useToast();

  // ---------------------- New helper: flatten tasks for FirmTaskBoard ----------------------
  function flattenTasks(projects: Project[]): TaskLite[] {
    return projects.flatMap((p) =>
      p.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status as TaskLite["status"], // cast to match our union
        projectId: p.id,
        projectName: p.client_name,
        service: p.service_type ?? "Unknown",
        assignees: t.assigned_to ?? [],
        deadline: t.deadline,
        hoursLogged: 0, // or map from your data if you store hours
      }))
    );
  }

  // ---------------------- New helper: calculate project progress ----------------------
  function calcProgress(proj: Project): number {
    if (!proj.tasks?.length) return 0;
    const doneCount = proj.tasks.filter((t) => t.status === "completed").length;
    return Math.round((doneCount / proj.tasks.length) * 100);
  }

  // Generate risk scores for projects
  const generateRiskScores = useCallback((projectList: Project[]) => {
    const scores: Record<number, number> = {};
    projectList.forEach((project) => {
      // Generate a random risk score between 0-100 for demo purposes
      scores[project.id] = Math.floor(Math.random() * 100);
    });
    setProjectRiskScores(scores);
  }, []);

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/projects/?limit=100`;

      // Add filters if set
      if (statusFilter) {
        url += `&status=${encodeURIComponent(statusFilter)}`;
      }
      if (serviceFilter) {
        url += `&service_type=${encodeURIComponent(serviceFilter)}`;
      }
      if (staffFilter) {
        url += `&staff_id=${encodeURIComponent(staffFilter)}`;
      }

      const response = await axios.get(url);
      setProjects(response.data);
      generateRiskScores(response.data);

      toast({
        title: "Projects loaded",
        description: `Loaded ${response.data.length} projects`,
      });
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast({
        variant: "destructive",
        title: "Error loading projects",
        description: "Could not load projects. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, statusFilter, serviceFilter, staffFilter, generateRiskScores]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/notifications/?unread_only=true&limit=20`
      );
      setNotifications(response.data);
      setUnreadCount(response.data.length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, []);

  // Fetch integrations
  const fetchIntegrations = useCallback(async () => {
    setIntegrationsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/integrations/`);
      setIntegrations(response.data.integrations);
    } catch (error) {
      console.error("Error fetching integrations:", error);
    } finally {
      setIntegrationsLoading(false);
    }
  }, []);

  // Fetch staff members
  const fetchStaffMembers = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/staff/`);
      setStaffMembers(response.data);
    } catch (error) {
      console.error("Error fetching staff members:", error);
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    fetchProjects();
    fetchNotifications();
    fetchIntegrations();
    fetchStaffMembers();

    // Set up polling for notifications
    const notificationInterval = setInterval(fetchNotifications, 30000);

    return () => {
      clearInterval(notificationInterval);
    };
  }, [fetchProjects, fetchNotifications, fetchIntegrations, fetchStaffMembers]);

  // Create new project
  const createProject = async () => {
    if (!clientName.trim()) {
      toast({
        variant: "destructive",
        title: "Client name required",
        description: "Please enter a client name to create a project.",
      });
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/projects/`, {
        client_name: clientName,
        service_type: serviceType,
        source: "manual",
        assigned_staff: selectedStaff.length > 0 ? selectedStaff : undefined,
        staff_roles: staffRoles,
      });

      setClientName("");
      setSelectedStaff([]);
      setStaffRoles({});
      fetchProjects();
      fetchNotifications();

      toast({
        title: "Project created",
        description: `Created a new project for ${clientName}.`,
      });
    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        variant: "destructive",
        title: "Error creating project",
        description: "Could not create project. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle project status change
  const handleStatusChange = async (projectId: number, newStatus: string) => {
    setLoading(true);
    try {
      await axios.patch(
        `${API_BASE_URL}/projects/${projectId}/status?new_status=${newStatus}`
      );
      fetchProjects();
      fetchNotifications();

      toast({
        title: "Status updated",
        description: `Project status changed to ${newStatus}.`,
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        variant: "destructive",
        title: "Error updating status",
        description: "Could not update project status. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Import from CSV
  const handleCsvImport = async () => {
    if (!csvContent.trim()) {
      toast({
        variant: "destructive",
        title: "CSV content required",
        description: "Please enter CSV content to import.",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/integrations/import-csv`,
        {
          file_content: csvContent,
        }
      );

      setCsvContent("");
      setCsvDialogOpen(false);
      fetchProjects();
      fetchNotifications();

      toast({
        title: "CSV import successful",
        description: `Imported ${response.data.imported_count} projects from CSV.`,
      });
    } catch (error) {
      console.error("Error importing CSV:", error);
      toast({
        variant: "destructive",
        title: "Error importing CSV",
        description: "Could not import CSV. Please check format and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Import from practice management software
  const handlePmsImport = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/integrations/import-pms`);
      fetchProjects();
      fetchNotifications();

      toast({
        title: "PMS import successful",
        description: `Imported ${response.data.imported_count} projects from practice management software.`,
      });
    } catch (error) {
      console.error("Error importing from PMS:", error);
      toast({
        variant: "destructive",
        title: "Error importing from PMS",
        description:
          "Could not import from practice management software. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Connect integration
  const handleConnectIntegration = async (integrationType: string) => {
    setIntegrationsLoading(true);
    try {
      const isConnected = integrations[integrationType]?.connected;

      await axios.post(`${API_BASE_URL}/integrations/connect`, {
        integration_type: integrationType,
        action: isConnected ? "disconnect" : "connect",
      });

      fetchIntegrations();

      toast({
        title: isConnected
          ? "Integration disconnected"
          : "Integration connected",
        description: `Successfully ${
          isConnected ? "disconnected from" : "connected to"
        } ${integrations[integrationType]?.name}.`,
      });
    } catch (error) {
      console.error("Error connecting integration:", error);
      toast({
        variant: "destructive",
        title: "Error with integration",
        description:
          "Could not connect/disconnect integration. Please try again.",
      });
    } finally {
      setIntegrationsLoading(false);
    }
  };

  // Mark notification as read
  const markNotificationRead = async (notificationId: string) => {
    try {
      await axios.patch(`${API_BASE_URL}/notifications/${notificationId}/read`);
      fetchNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Filter projects by status
  const getFilteredProjects = () => {
    if (selectedTab === "active-projects") {
      return projects.filter((p) => p.status !== "Completed");
    } else if (selectedTab === "awaiting-signature") {
      return projects.filter((p) => p.status === "Awaiting Signature");
    } else if (selectedTab === "completed-projects") {
      return projects.filter((p) => p.status === "Completed");
    }
    return projects;
  };

  // Get staff name by ID
  const getStaffName = (staffId: string) => {
    const staff = staffMembers.find((s) => s.id === staffId);
    return staff ? staff.name : "Unknown";
  };

  // Format relative time
  const formatRelativeTime = (timestamp: string | undefined) => {
    if (!timestamp) return "Unknown";

    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInDays === 0) {
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        if (diffInHours === 0) {
          const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
          return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""} ago`;
        }
        return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`;
      } else if (diffInDays < 7) {
        return `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch (e) {
      return "Invalid date";
    }
  };

  // Get service icon (used in fallback states or anywhere else needed)
  const getServiceIcon = (serviceType: string | undefined) => {
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
        return <Inbox className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2 font-bold">
              <BrainCircuit className="h-6 w-6" />
              <span>Keyveve AI Accounting</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Button variant="ghost" size="sm" className="gap-2 relative">
                <BellRing className="h-4 w-4" />
                <span className="hidden sm:inline-block">Notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
              {notifications.length > 0 && (
                <div className="absolute right-0 mt-2 w-80 bg-background rounded-md shadow-lg border overflow-hidden z-50">
                  <div className="p-3 border-b">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="border-b p-3 hover:bg-muted/50"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center">
                            {notification.type === "info" && (
                              <AlertCircle className="h-4 w-4 text-blue-500 mr-2" />
                            )}
                            {notification.type === "reminder" && (
                              <Clock className="h-4 w-4 text-amber-500 mr-2" />
                            )}
                            <span className="text-xs font-semibold">
                              Project #{notification.project_id}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() =>
                              markNotificationRead(notification.id)
                            }
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(notification.created_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                  {notifications.length > 0 && (
                    <div className="p-2 bg-muted/30">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => {
                          notifications.forEach((n) =>
                            markNotificationRead(n.id)
                          );
                        }}
                      >
                        Mark all as read
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <Link href="#staff-profile">
              <Button variant="ghost" size="sm" className="gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline-block">Staff Portal</span>
              </Button>
            </Link>
            <ModeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col space-y-8">
            <div className="flex flex-col space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">
                Staff Dashboard
              </h1>
              <p className="text-muted-foreground">
                Manage client projects, documents, and workflow stages.
              </p>
            </div>

            {/* AI Assistant Component */}
            <QAComponent />

            {/* TOP-LEVEL TABS */}
            <Tabs defaultValue="project-management" className="w-full">
              <TabsList className="grid grid-cols-2 md:grid-cols-6 lg:w-auto">
                <TabsTrigger value="project-management">Engagements</TabsTrigger>
                <TabsTrigger value="import">Import/Onboarding</TabsTrigger>
                <TabsTrigger value="integrations">Integrations</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="firmwide-tasks">Project Tasks</TabsTrigger>
                <TabsTrigger value="firm-view">Firm View</TabsTrigger>
              </TabsList>

              {/* =============== Engagements Tab =============== */}
              <TabsContent
                value="project-management"
                className="space-y-6 mt-6"
              >
                <div className="flex flex-wrap gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-col sm:flex-row gap-2">
                    {/* Status filter */}
                    <Select
                      value={statusFilter ?? "all"}
                      onValueChange={(val) => {
                        if (val === "all") {
                          setStatusFilter(null);
                        } else {
                          setStatusFilter(val);
                        }
                      }}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {PROJECT_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Service filter */}
                    <Select
                      value={serviceFilter ?? "all"}
                      onValueChange={(val) => {
                        if (val === "all") {
                          setServiceFilter(null);
                        } else {
                          setServiceFilter(val);
                        }
                      }}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by service" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Services</SelectItem>
                        {SERVICE_TYPES.map((service) => (
                          <SelectItem key={service} value={service}>
                            {service}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Staff filter */}
                    <Select
                      value={staffFilter ?? "all"}
                      onValueChange={(val) => {
                        if (val === "all") {
                          setStaffFilter(null);
                        } else {
                          setStaffFilter(val);
                        }
                      }}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by staff" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Staff</SelectItem>
                        {staffMembers.map((staff) => (
                          <SelectItem key={staff.id} value={staff.id}>
                            {staff.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setStatusFilter(null);
                        setServiceFilter(null);
                        setStaffFilter(null);
                      }}
                      className="shrink-0"
                    >
                      Clear Filters
                    </Button>
                  </div>

                  {/* Grid/list toggle + refresh button */}
                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === "grid" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                    >
                      Grid
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                    >
                      List
                    </Button>
                    <Button
                      onClick={fetchProjects}
                      variant="outline"
                      disabled={loading}
                      className="shrink-0 gap-2"
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                      />
                      Refresh Projects
                    </Button>
                  </div>
                </div>

                <Tabs
                  defaultValue="active-projects"
                  onValueChange={setSelectedTab}
                >
                  <TabsList>
                    <TabsTrigger value="active-projects">
                      Active Engagements
                    </TabsTrigger>
                    <TabsTrigger value="prospective-engagements">
                      Prospective Engagements
                    </TabsTrigger>
                    <TabsTrigger value="awaiting-signature">
                      Awaiting Signature
                    </TabsTrigger>
                    <TabsTrigger value="completed-projects">
                      Completed
                    </TabsTrigger>
                  </TabsList>

                  {/* Content: Active Engagements */}
                  <TabsContent
                    value="active-projects"
                    className="space-y-4 mt-6"
                  >
                    <h2 className="text-xl font-semibold tracking-tight flex items-center">
                      Active Engagements
                      <Badge variant="outline" className="ml-2">
                        {getFilteredProjects().length} Projects
                      </Badge>
                    </h2>

                    {getFilteredProjects().length === 0 ? (
                      <Card>
                        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                          {loading ? (
                            <>
                              <Loader2 className="h-8 w-8 animate-spin mb-2" />
                              <h3 className="font-medium">
                                Loading projects...
                              </h3>
                            </>
                          ) : (
                            <>
                              <FileText className="h-8 w-8 mb-2 text-muted-foreground" />
                              <h3 className="font-medium">No projects found</h3>
                              <p className="text-sm text-muted-foreground">
                                Create your first project using the form below
                                or import from CSV/PMS.
                              </p>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    ) : (
                      <div
                        className={
                          viewMode === "grid"
                            ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                            : "space-y-4"
                        }
                      >
                        {getFilteredProjects().map((proj) => (
                          <EnhancedProjectCard
                            key={proj.id}
                            project={proj}
                            viewMode={viewMode}
                            onStatusChange={handleStatusChange}
                            staffMembers={staffMembers}
                            progress={calcProgress(proj)}
                            riskScore={projectRiskScores[proj.id] ?? 50}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* Content: Prospective Engagements */}
                  <TabsContent
                    value="prospective-engagements"
                    className="space-y-4 mt-6"
                  >
                    <h2 className="text-xl font-semibold tracking-tight">
                      Prospective Engagements
                    </h2>
                    <Card>
                      <CardContent className="py-6 text-center">
                        <p className="text-muted-foreground">
                          No prospective engagements at the moment.
                        </p>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Content: Awaiting Signature */}
                  <TabsContent
                    value="awaiting-signature"
                    className="space-y-4 mt-6"
                  >
                    <h2 className="text-xl font-semibold tracking-tight">
                      Awaiting Signature
                    </h2>
                    {getFilteredProjects().length === 0 ? (
                      <Card>
                        <CardContent className="py-6 text-center">
                          <p className="text-muted-foreground">
                            No projects awaiting signature.
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div
                        className={
                          viewMode === "grid"
                            ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                            : "space-y-4"
                        }
                      >
                        {getFilteredProjects().map((proj) => (
                          <EnhancedProjectCard
                            key={proj.id}
                            project={proj}
                            viewMode={viewMode}
                            onStatusChange={handleStatusChange}
                            staffMembers={staffMembers}
                            progress={calcProgress(proj)}
                            riskScore={projectRiskScores[proj.id] ?? 50}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* Content: Completed */}
                  <TabsContent
                    value="completed-projects"
                    className="space-y-4 mt-6"
                  >
                    <h2 className="text-xl font-semibold tracking-tight">
                      Completed Projects
                    </h2>
                    {getFilteredProjects().length === 0 ? (
                      <Card>
                        <CardContent className="py-6 text-center">
                          <p className="text-muted-foreground">
                            No completed projects.
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div
                        className={
                          viewMode === "grid"
                            ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                            : "space-y-4"
                        }
                      >
                        {getFilteredProjects().map((proj) => (
                          <EnhancedProjectCard
                            key={proj.id}
                            project={proj}
                            viewMode={viewMode}
                            onStatusChange={handleStatusChange}
                            staffMembers={staffMembers}
                            progress={calcProgress(proj)}
                            riskScore={projectRiskScores[proj.id] ?? 50}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                <Card>
                  <CardHeader>
                    <CardTitle>Create New Project</CardTitle>
                    <CardDescription>
                      Select a workflow template and enter client details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <WorkflowTemplateSelector
                      staffMembers={staffMembers}
                      loading={loading}
                      onCreateProject={async (projectData) => {
                        setLoading(true);
                        try {
                          await axios.post(
                            `${API_BASE_URL}/projects/`,
                            projectData
                          );

                          toast({
                            title: "Project created",
                            description: `Created a new ${projectData.service_type} project for ${projectData.client_name}.`,
                          });

                          fetchProjects();
                        } catch (error) {
                          console.error("Error creating project:", error);
                          toast({
                            variant: "destructive",
                            title: "Error creating project",
                            description:
                              "Could not create project. Please try again.",
                          });
                        } finally {
                          setLoading(false);
                        }
                      }}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* =============== Import/Onboarding Tab =============== */}
              <TabsContent value="import" className="space-y-6 mt-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>CSV Import</CardTitle>
                      <CardDescription>
                        Import client data from a CSV file.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Upload a CSV file with client data to create multiple
                        projects at once. CSV should include columns for
                        'client_name' and 'service_type'.
                      </p>
                      <Dialog
                        open={csvDialogOpen}
                        onOpenChange={setCsvDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button className="gap-2">
                            <FileSpreadsheet className="h-4 w-4" />
                            Import from CSV
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Import Clients from CSV</DialogTitle>
                            <DialogDescription>
                              Enter CSV content with headers:
                              client_name,service_type
                            </DialogDescription>
                          </DialogHeader>
                          <Textarea
                            placeholder={`client_name,service_type
John Doe,Tax Return
Acme Corp,Bookkeeping`}
                            value={csvContent}
                            onChange={(e) => setCsvContent(e.target.value)}
                            className="min-h-[200px]"
                          />
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => setCsvDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleCsvImport}
                              disabled={loading || !csvContent.trim()}
                            >
                              {loading ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Importing...
                                </>
                              ) : (
                                "Import"
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Practice Management Import</CardTitle>
                      <CardDescription>
                        Import client data from practice management software.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Directly import clients from your connected practice
                        management system. This will create new projects for
                        each imported client.
                      </p>
                      <Button
                        onClick={handlePmsImport}
                        disabled={
                          loading || !integrations.practice_management?.connected
                        }
                        className="gap-2"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Importing...
                          </>
                        ) : (
                          <>
                            <Building className="h-4 w-4" />
                            Import from PMS
                          </>
                        )}
                      </Button>
                      {!integrations.practice_management?.connected && (
                        <p className="text-xs text-amber-500">
                          Practice management integration is not connected.
                          Please connect in the Integrations tab.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* =============== Integrations Tab =============== */}
              <TabsContent value="integrations" className="space-y-6 mt-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <Card>
                    <CardHeader>
                      <CardTitle>Engagement Letter Software</CardTitle>
                      <CardDescription>
                        Integration with engagement letter generation software.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-5 w-5 text-primary" />
                          <span className="font-medium">
                            {integrations.engagement_letter?.name ||
                              "EngagementLetterApp"}
                          </span>
                        </div>
                        <Badge
                          variant={
                            integrations.engagement_letter?.connected
                              ? "default"
                              : "outline"
                          }
                        >
                          {integrations.engagement_letter?.connected
                            ? "Connected"
                            : "Disconnected"}
                        </Badge>
                      </div>
                      {integrations.engagement_letter?.last_sync && (
                        <p className="text-xs text-muted-foreground">
                          Last synced:{" "}
                          {new Date(
                            integrations.engagement_letter.last_sync
                          ).toLocaleString()}
                        </p>
                      )}
                      <Button
                        variant={
                          integrations.engagement_letter?.connected
                            ? "destructive"
                            : "default"
                        }
                        size="sm"
                        onClick={() =>
                          handleConnectIntegration("engagement_letter")
                        }
                        disabled={integrationsLoading}
                        className="w-full"
                      >
                        {integrationsLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : integrations.engagement_letter?.connected ? (
                          "Disconnect"
                        ) : (
                          "Connect"
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Practice Management</CardTitle>
                      <CardDescription>
                        Integration with practice management software.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Building className="h-5 w-5 text-primary" />
                          <span className="font-medium">
                            {integrations.practice_management?.name ||
                              "PracticeManagementSoftware"}
                          </span>
                        </div>
                        <Badge
                          variant={
                            integrations.practice_management?.connected
                              ? "default"
                              : "outline"
                          }
                        >
                          {integrations.practice_management?.connected
                            ? "Connected"
                            : "Disconnected"}
                        </Badge>
                      </div>
                      {integrations.practice_management?.last_sync && (
                        <p className="text-xs text-muted-foreground">
                          Last synced:{" "}
                          {new Date(
                            integrations.practice_management.last_sync
                          ).toLocaleString()}
                        </p>
                      )}
                      <Button
                        variant={
                          integrations.practice_management?.connected
                            ? "destructive"
                            : "default"
                        }
                        size="sm"
                        onClick={() =>
                          handleConnectIntegration("practice_management")
                        }
                        disabled={integrationsLoading}
                        className="w-full"
                      >
                        {integrationsLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : integrations.practice_management?.connected ? (
                          "Disconnect"
                        ) : (
                          "Connect"
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>SharePoint</CardTitle>
                      <CardDescription>
                        Integration with SharePoint document storage.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FolderSync className="h-5 w-5 text-primary" />
                          <span className="font-medium">
                            {integrations.document_storage?.name || "SharePoint"}
                          </span>
                        </div>
                        <Badge
                          variant={
                            integrations.document_storage?.connected
                              ? "default"
                              : "outline"
                          }
                        >
                          {integrations.document_storage?.connected
                            ? "Connected"
                            : "Disconnected"}
                        </Badge>
                      </div>
                      {integrations.document_storage?.last_sync && (
                        <p className="text-xs text-muted-foreground">
                          Last synced:{" "}
                          {new Date(
                            integrations.document_storage.last_sync
                          ).toLocaleString()}
                        </p>
                      )}
                      <Button
                        variant={
                          integrations.document_storage?.connected
                            ? "destructive"
                            : "default"
                        }
                        size="sm"
                        onClick={() =>
                          handleConnectIntegration("document_storage")
                        }
                        disabled={integrationsLoading}
                        className="w-full"
                      >
                        {integrationsLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : integrations.document_storage?.connected ? (
                          "Disconnect"
                        ) : (
                          "Connect"
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>CCH Document Storage</CardTitle>
                      <CardDescription>
                        Integration with CCH Document Storage system.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-5 w-5 text-primary" />
                          <span className="font-medium">
                            {integrations.cch_document_storage?.name ||
                              "CCH Document Storage"}
                          </span>
                        </div>
                        <Badge
                          variant={
                            integrations.cch_document_storage?.connected
                              ? "default"
                              : "outline"
                          }
                        >
                          {integrations.cch_document_storage?.connected
                            ? "Connected"
                            : "Disconnected"}
                        </Badge>
                      </div>
                      {integrations.cch_document_storage?.last_sync && (
                        <p className="text-xs text-muted-foreground">
                          Last synced:{" "}
                          {new Date(
                            integrations.cch_document_storage.last_sync
                          ).toLocaleString()}
                        </p>
                      )}
                      <Button
                        variant={
                          integrations.cch_document_storage?.connected
                            ? "destructive"
                            : "default"
                        }
                        size="sm"
                        onClick={() =>
                          handleConnectIntegration("cch_document_storage")
                        }
                        disabled={integrationsLoading}
                        className="w-full"
                      >
                        {integrationsLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : integrations.cch_document_storage?.connected ? (
                          "Disconnect"
                        ) : (
                          "Connect"
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Google Calendar</CardTitle>
                      <CardDescription>
                        Integration with Google Calendar for task scheduling.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-5 w-5 text-primary" />
                          <span className="font-medium">
                            {integrations.google_calendar?.name ||
                              "Google Calendar"}
                          </span>
                        </div>
                        <Badge
                          variant={
                            integrations.google_calendar?.connected
                              ? "default"
                              : "outline"
                          }
                        >
                          {integrations.google_calendar?.connected
                            ? "Connected"
                            : "Disconnected"}
                        </Badge>
                      </div>
                      {integrations.google_calendar?.last_sync && (
                        <p className="text-xs text-muted-foreground">
                          Last synced:{" "}
                          {new Date(
                            integrations.google_calendar.last_sync
                          ).toLocaleString()}
                        </p>
                      )}
                      <Button
                        variant={
                          integrations.google_calendar?.connected
                            ? "destructive"
                            : "default"
                        }
                        size="sm"
                        onClick={() =>
                          handleConnectIntegration("google_calendar")
                        }
                        disabled={integrationsLoading}
                        className="w-full"
                      >
                        {integrationsLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : integrations.google_calendar?.connected ? (
                          "Disconnect"
                        ) : (
                          "Connect"
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Outlook Calendar</CardTitle>
                      <CardDescription>
                        Integration with Microsoft Outlook Calendar for task
                        scheduling.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-5 w-5 text-primary" />
                          <span className="font-medium">
                            {integrations.outlook_calendar?.name ||
                              "Outlook Calendar"}
                          </span>
                        </div>
                        <Badge
                          variant={
                            integrations.outlook_calendar?.connected
                              ? "default"
                              : "outline"
                          }
                        >
                          {integrations.outlook_calendar?.connected
                            ? "Connected"
                            : "Disconnected"}
                        </Badge>
                      </div>
                      {integrations.outlook_calendar?.last_sync && (
                        <p className="text-xs text-muted-foreground">
                          Last synced:{" "}
                          {new Date(
                            integrations.outlook_calendar.last_sync
                          ).toLocaleString()}
                        </p>
                      )}
                      <Button
                        variant={
                          integrations.outlook_calendar?.connected
                            ? "destructive"
                            : "default"
                        }
                        size="sm"
                        onClick={() =>
                          handleConnectIntegration("outlook_calendar")
                        }
                        disabled={integrationsLoading}
                        className="w-full"
                      >
                        {integrationsLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : integrations.outlook_calendar?.connected ? (
                          "Disconnect"
                        ) : (
                          "Connect"
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* =============== Analytics Tab =============== */}
              <TabsContent value="analytics" className="space-y-6 mt-6">
                <AnalyticsTab data={allEngagements} />
              </TabsContent>

              {/* =============== Firm-wide Tasks Tab =============== */}
              <TabsContent value="firmwide-tasks" className="space-y-6 mt-6">
                <h2 className="text-xl font-semibold tracking-tight">
                  Project Tasks
                </h2>
                {loading ? (
                  <Skeleton className="w-full h-60" />
                ) : (
                  <FirmTaskBoard tasks={flattenTasks(projects)} />
                )}
                <p className="mt-3 text-xs text-muted-foreground">
                  Drag cards to update status. Calendar sync is stubbed for demo.
                </p>
              </TabsContent>

              {/* =============== [NEW] Firm View Tab =============== */}
              {/* step 2️⃣: Replace the old <TabsContent value="firm-view"> block with this updated code */}
              {/* ------------------------------------------------------------------ */}
              {/*  UPDATED: Firm-View tab with nested “All / New Clients” sub-tabs   */}
              {/* ------------------------------------------------------------------ */}
              <TabsContent value="firm-view" className="space-y-6 mt-6">
                <Tabs defaultValue="all-clients" className="space-y-6">
                  {/* -------------- sub-tab bar -------------- */}
                  <TabsList>
                    <TabsTrigger value="all-clients">All Clients</TabsTrigger>
                    <TabsTrigger value="new-clients">New Clients</TabsTrigger>
                  </TabsList>

                  {/* ----------- All Clients tab ----------- */}
                  <TabsContent value="all-clients" className="space-y-6">
                    {/* (optional) quick filter bar for All-Clients only */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border rounded-md px-2">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search client / business…"
                          className="border-0 focus-visible:ring-0"
                          onChange={(e) =>
                            setAllEngagements(
                              dummyEngagements.filter((eng) =>
                                `${eng.clientName} ${eng.businessName ?? ""}`
                                  .toLowerCase()
                                  .includes(e.target.value.toLowerCase())
                              )
                            )
                          }
                        />
                      </div>
                    </div>

                    {/* All-Clients virtual table */}
                    <AllClientsTable data={allEngagements} />
                  </TabsContent>

                  {/* ----------- New Clients tab ----------- */}
                  <TabsContent value="new-clients" className="space-y-6">
                    <NewClientsTable prospects={allProspects} />
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      <footer className="border-t py-6">
        <div className="container mx-auto px-4 flex flex-col items-center justify-between gap-4 md:h-10 md:flex-row">
          <p className="text-center text-sm text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} Keyveve AI Accounting. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
