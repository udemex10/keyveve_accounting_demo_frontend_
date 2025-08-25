"use client";

import { useEffect, useState, useCallback } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { useToast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  FileUp,
  MessageSquareText,
  FileText,
  CheckCircle2,
  Loader2,
  BrainCircuit,
  Upload,
  RefreshCw,
  AlertCircle,
  Clock,
  Eye,
  Download,
  ExternalLink,
  Calendar,
  FileCheck,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Import the enhanced service views component:
import ClientPortalServiceViews from "@/components/ClientPortalServiceViews";

const API_BASE_URL = "https://keyveve-accounting-demo-backend.onrender.com";

const PROJECT_STATUSES = [
  "Onboarding",
  "Docs Requested",
  "Docs Received",
  "Pricing/Analysis",
  "Awaiting Signature",
  "Project Started",
  "Completed",
];

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

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string; // pending | in_progress | blocked | completed, etc.
  deadline?: string;
  assigned_to: string[];
  related_docs: string[];
  scheduled_start?: string;
  scheduled_end?: string;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  project_id: number;
  sender: string;
  text: string;
  timestamp?: string;
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
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

export default function ClientPortalPage() {
  const [projectId, setProjectId] = useState(1);
  const [project, setProject] = useState<Project | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const { toast } = useToast();

  // Fetch the project
  const loadProject = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/projects/${projectId}`);
      setProject(res.data);

      const staffMessages = res.data.messages.filter(
        (msg: Message) => msg.sender === "staff"
      );
      setUnreadMessages(staffMessages.length);

      toast({
        title: "Project loaded",
        description: `Loaded details for ${res.data.service_type}: ${res.data.client_name}`,
      });

      // Also load staff
      try {
        const staffRes = await axios.get(`${API_BASE_URL}/staff/`);
        setStaffMembers(staffRes.data);
      } catch (err) {
        console.error("Error loading staff members:", err);
      }
    } catch (error) {
      console.error("Error loading project:", error);
      toast({
        variant: "destructive",
        title: "Error loading project",
        description: "Could not load project details. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, toast]);

  // On mount, load project and set up refresh interval
  useEffect(() => {
    loadProject();
    const intervalId = setInterval(loadProject, 30000);
    return () => clearInterval(intervalId);
  }, [projectId, loadProject]);

  // Upload documents
  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    setDocumentLoading(true);
    const formData = new FormData();
    formData.append("project_id", String(projectId));
    formData.append("file", file);
    formData.append("process_async", "true");
    formData.append("storage_location", "cloud");
    formData.append("doc_category", "client");

    try {
      await axios.post(`${API_BASE_URL}/documents/upload`, formData);
      toast({
        title: "Success!",
        description: "Document uploaded successfully. It will be processed shortly.",
        variant: "default",
      });
      setFile(null);
      loadProject();
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your document.",
        variant: "destructive",
      });
    } finally {
      setDocumentLoading(false);
    }
  };

  // Sign engagement letter
  const handleSignEngagementLetter = async () => {
    if (!project) return;
    setLoading(true);
    try {
      await axios.patch(
        `${API_BASE_URL}/projects/${project.id}/status?new_status=Project Started`
      );
      toast({
        title: "Success!",
        description: "Engagement letter signed successfully.",
      });
      loadProject();
    } catch (error) {
      console.error("Error signing engagement letter:", error);
      toast({
        title: "Error",
        description: "Could not sign engagement letter. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper: relative time
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

  // Render status as a badge
  const renderStatusBadge = (status: string) => {
    const statusColors: Record<
      string,
      { color: string; bgColor: string }
    > = {
      Onboarding: {
        color: "text-blue-700 dark:text-blue-400",
        bgColor: "bg-blue-100 dark:bg-blue-900/30",
      },
      "Docs Requested": {
        color: "text-amber-700 dark:text-amber-400",
        bgColor: "bg-amber-100 dark:bg-amber-900/30",
      },
      "Docs Received": {
        color: "text-violet-700 dark:text-violet-400",
        bgColor: "bg-violet-100 dark:bg-violet-900/30",
      },
      "Awaiting Signature": {
        color: "text-pink-700 dark:text-pink-400",
        bgColor: "bg-pink-100 dark:bg-pink-900/30",
      },
      "Project Started": {
        color: "text-emerald-700 dark:text-emerald-400",
        bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
      },
      Completed: {
        color: "text-green-700 dark:text-green-400",
        bgColor: "bg-green-100 dark:bg-green-900/30",
      },
    };

    const style = statusColors[status] || {
      color: "text-gray-700 dark:text-gray-400",
      bgColor: "bg-gray-100 dark:bg-gray-900/30",
    };

    return (
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${style.color} ${style.bgColor}`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* HEADER */}
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
            <Link href={`/client/messages?project_id=${projectId}`}>
              <Button variant="ghost" size="sm" className="gap-2 relative">
                <MessageSquareText className="h-4 w-4" />
                <span className="hidden sm:inline-block">Messages</span>
                {unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                )}
              </Button>
            </Link>
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col space-y-8 md:space-y-10">
            <div className="flex flex-col space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Client Portal</h1>
              <p className="text-muted-foreground">
                Upload documents, check project status, and communicate with our team.
              </p>
            </div>

            {/* Project ID & Load */}
            <div className="flex flex-col space-y-4 md:flex-row md:items-end md:justify-between md:space-y-0">
              <div className="flex items-end gap-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="projectId">Project ID</Label>
                  <Input
                    type="number"
                    id="projectId"
                    value={projectId}
                    onChange={(e) => setProjectId(Number(e.target.value))}
                    className="w-24"
                  />
                </div>
                <Button onClick={loadProject} disabled={loading} variant="outline">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Load Project
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* If project is loaded, show TABS */}
            {project ? (
              <Tabs
                defaultValue={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="tasks">Tasks</TabsTrigger>
                </TabsList>

                {/* OVERVIEW TAB: now with ClientPortalServiceViews embedded */}
                <TabsContent value="overview" className="space-y-6 pt-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl">
                            {project.service_type}: {project.client_name}
                          </CardTitle>
                          <CardDescription className="flex items-center mt-1">
                            Project #{project.id}
                            <span className="mx-2">•</span>
                            Status: {renderStatusBadge(project.status)}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* ClientPortalServiceViews is where we add the new tasks-based progress bar & sub-view */}
                      <ClientPortalServiceViews
                        project={project}
                        documents={project.docs}
                        tasks={project.tasks}
                        staff={project.assigned_staff
                          ?.map((staffId) =>
                            staffMembers.find((s) => s.id === staffId)
                          )
                          .filter(Boolean)}
                        onSignLetter={handleSignEngagementLetter}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* DOCUMENTS TAB */}
                <TabsContent value="documents" className="space-y-6 pt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Document Upload</CardTitle>
                      <CardDescription>
                        Upload the required documents for your {project.service_type} services.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="border rounded-lg p-4 flex flex-col items-center justify-center space-y-2 cursor-pointer hover:bg-muted/50 transition-colors">
                          <Label
                            htmlFor="file-upload"
                            className="cursor-pointer w-full h-full flex flex-col items-center justify-center py-6"
                          >
                            <div className="rounded-full bg-primary/10 p-3 mb-2">
                              <Upload className="h-6 w-6 text-primary" />
                            </div>
                            <p className="font-medium">
                              Click to select a file or drag and drop
                            </p>
                            <p className="text-sm text-muted-foreground">
                              PDF, Excel, Word, or image files
                            </p>
                            {file && (
                              <Badge variant="outline" className="mt-2">
                                {file.name}
                              </Badge>
                            )}
                          </Label>
                          <Input
                            id="file-upload"
                            type="file"
                            className="sr-only"
                            onChange={(e) => {
                              if (e.target.files && e.target.files.length > 0) {
                                setFile(e.target.files[0]);
                              }
                            }}
                          />
                        </div>

                        <Button
                          onClick={handleUpload}
                          disabled={!file || documentLoading}
                          className="w-full gap-2"
                        >
                          {documentLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Uploading & Processing...
                            </>
                          ) : (
                            <>
                              <FileUp className="h-4 w-4" />
                              Upload Document
                            </>
                          )}
                        </Button>

                        {project.status === "Docs Requested" && (
                          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3 text-sm flex items-start space-x-2">
                            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-amber-700 dark:text-amber-500">
                                Documents Requested
                              </p>
                              <p className="text-amber-700 dark:text-amber-400">
                                Please upload the requested documents to proceed with your{" "}
                                {project.service_type} project.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Uploaded Documents</CardTitle>
                      <CardDescription>
                        Documents we&apos;ve received and processed for your project.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {project.docs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                          <FileText className="h-8 w-8 mb-2" />
                          <h3 className="font-medium">No documents yet</h3>
                          <p className="text-sm">
                            Start by uploading your first document above.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {project.docs.map((doc) => (
                            <div
                              key={doc.doc_id}
                              className="flex items-start justify-between rounded-lg border p-4 hover:bg-muted/40 transition-colors"
                            >
                              <div className="flex items-start space-x-4">
                                <div className="rounded-full bg-primary/10 p-2 mt-1">
                                  <FileText className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">{doc.original_name}</p>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <Badge variant="secondary" className="text-xs">
                                      {doc.doc_type}
                                    </Badge>
                                    {doc.upload_timestamp && (
                                      <span className="text-xs text-muted-foreground">
                                        Uploaded {formatRelativeTime(doc.upload_timestamp)}
                                      </span>
                                    )}
                                  </div>
                                  <p className="mt-2 text-sm text-muted-foreground">
                                    {doc.extracted_data}
                                  </p>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm" className="h-8 gap-1">
                                <Download className="h-3 w-3" />
                                <span className="sr-only">Download</span>
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* TASKS TAB */}
                <TabsContent value="tasks" className="space-y-6 pt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Project Tasks</CardTitle>
                      <CardDescription>
                        Current tasks and action items for your project.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {project.tasks.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                          No tasks found for this project.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {project.tasks.map((task) => (
                            <div key={task.id} className="border rounded-lg p-3">
                              <div className="flex items-start">
                                <div className="mr-3 mt-0.5">
                                  {task.status === "completed" ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                  ) : (
                                    <Clock className="h-5 w-5 text-amber-500" />
                                  )}
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium">{task.title}</p>
                                    {/* Simple status badge for example */}
                                    <Badge variant="outline">
                                      {task.status === "completed"
                                        ? "Completed"
                                        : task.status === "in_progress"
                                        ? "In Progress"
                                        : task.status === "blocked"
                                        ? "Blocked"
                                        : "Pending"}
                                    </Badge>
                                  </div>
                                  {task.description && (
                                    <p className="text-sm text-muted-foreground">
                                      {task.description}
                                    </p>
                                  )}
                                  {task.deadline && (
                                    <div className="flex items-center text-xs text-muted-foreground">
                                      <Calendar className="h-3 w-3 mr-1" />
                                      <span>
                                        Due: {new Date(task.deadline).toLocaleDateString()}
                                      </span>
                                    </div>
                                  )}
                                  {(task.scheduled_start || task.scheduled_end) && (
                                    <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                                      {task.scheduled_start && (
                                        <div className="flex items-center">
                                          <Calendar className="h-3 w-3 mr-1" />
                                          <span>
                                            Start:{" "}
                                            {new Date(task.scheduled_start).toLocaleDateString()}
                                          </span>
                                        </div>
                                      )}
                                      {task.scheduled_end && (
                                        <div className="flex items-center ml-2">
                                          <Clock className="h-3 w-3 mr-1" />
                                          <span>
                                            Due: {new Date(task.scheduled_end).toLocaleDateString()}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Additional placeholders for Docs Requested or Awaiting Signature */}
                      {project.status === "Docs Requested" && project.docs.length === 0 && (
                        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3 text-sm">
                          <p className="font-medium text-amber-700 dark:text-amber-500">
                            Action Required
                          </p>
                          <p className="text-amber-700 dark:text-amber-400">
                            Please upload the requested documents to proceed with your project.
                          </p>
                          <Button
                            variant="outline"
                            className="mt-2 gap-2 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/50 dark:hover:bg-amber-800/50"
                            onClick={() => setActiveTab("documents")}
                            size="sm"
                          >
                            <Upload className="h-3 w-3" />
                            Upload Documents
                          </Button>
                        </div>
                      )}

                      {project.status === "Awaiting Signature" && (
                        <div className="mt-4 rounded-lg border border-pink-200 bg-pink-50 dark:border-pink-800 dark:bg-pink-950/30 p-3 text-sm">
                          <p className="font-medium text-pink-700 dark:text-pink-500">Action Required</p>
                          <p className="text-pink-700 dark:text-pink-400">
                            Please sign the engagement letter to proceed with your project.
                          </p>
                          <Button
                            variant="outline"
                            className="mt-2 gap-2 bg-pink-100 hover:bg-pink-200 dark:bg-pink-900/50 dark:hover:bg-pink-800/50"
                            onClick={handleSignEngagementLetter}
                            size="sm"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Sign Engagement Letter
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Timeline</CardTitle>
                      <CardDescription>
                        Key dates and events for your project.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-start space-x-3">
                          <div className="h-7 w-7 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="font-medium">Project Created</p>
                            <p className="text-sm text-muted-foreground">
                              {project.created_at
                                ? new Date(project.created_at).toLocaleDateString()
                                : "Unknown"}
                            </p>
                          </div>
                        </div>

                        {project.docs.length > 0 && (
                          <div className="flex items-start space-x-3">
                            <div className="h-7 w-7 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                              <FileText className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div>
                              <p className="font-medium">First Document Uploaded</p>
                              <p className="text-sm text-muted-foreground">
                                {project.docs[0].upload_timestamp
                                  ? new Date(project.docs[0].upload_timestamp).toLocaleDateString()
                                  : "Unknown"}
                              </p>
                            </div>
                          </div>
                        )}

                        {project.status === "Awaiting Signature" && (
                          <div className="flex items-start space-x-3">
                            <div className="h-7 w-7 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center flex-shrink-0">
                              <FileText className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                            </div>
                            <div>
                              <p className="font-medium">Engagement Letter Sent</p>
                              <p className="text-sm text-muted-foreground">
                                {formatRelativeTime(project.updated_at)}
                              </p>
                            </div>
                          </div>
                        )}

                        {project.status === "Project Started" && (
                          <div className="flex items-start space-x-3">
                            <div className="h-7 w-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                              <p className="font-medium">Project Started</p>
                              <p className="text-sm text-muted-foreground">
                                {formatRelativeTime(project.updated_at)}
                              </p>
                            </div>
                          </div>
                        )}

                        {project.status === "Completed" && (
                          <div className="flex items-start space-x-3">
                            <div className="h-7 w-7 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                              <FileCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <p className="font-medium">Project Completed</p>
                              <p className="text-sm text-muted-foreground">
                                {formatRelativeTime(project.updated_at)}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              // No project loaded or loading
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  {loading ? (
                    <>
                      <Loader2 className="h-8 w-8 animate-spin mb-2" />
                      <h3 className="font-medium">Loading project data...</h3>
                    </>
                  ) : (
                    <>
                      <FileText className="h-8 w-8 mb-2 text-muted-foreground" />
                      <h3 className="font-medium">No project loaded</h3>
                      <p className="text-sm text-muted-foreground">
                        Enter a project ID and click &quot;Load Project&quot;
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 flex flex-col items-center justify-between gap-4 md:h-10 md:flex-row">
          <p className="text-center text-sm text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} Keyveve AI Accounting. All rights reserved.
          </p>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <a href="#" className="hover:underline">
              Privacy Policy
            </a>
            <a href="#" className="hover:underline">
              Terms of Service
            </a>
            <a href="#" className="hover:underline">
              Contact Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
