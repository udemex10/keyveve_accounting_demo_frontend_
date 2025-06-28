"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowLeft,
  Send,
  MessageSquare,
  Paperclip,
  User,
  Users,
  Loader2,
  Clock,
  FileText,
  RefreshCw,
  ChevronRight,
} from "lucide-react";

// API base URL
const API_BASE_URL = "http://localhost:8000";

// Interface definitions
interface Message {
  id: string;
  project_id: number;
  sender: string;
  sender_id?: string;
  text: string;
  timestamp?: string;
}

interface Document {
  doc_id: string;
  original_name: string;
  doc_type: string;
  extracted_data: string;
  storage_location: string;
  doc_category: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
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
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
}

// Message templates for quick responses
const MESSAGE_TEMPLATES = [
  {
    label: "Request Document",
    value:
      "Could you please upload the requested document(s) at your earliest convenience? This will help us proceed with your project.",
  },
  {
    label: "Engagement Letter",
    value:
      "We've sent your engagement letter for signature. Please review and sign it to move forward with your project.",
  },
  {
    label: "Schedule Call",
    value:
      "Would you like to schedule a call to discuss your project? Please let me know some times that work for you.",
  },
  {
    label: "Thank You",
    value:
      "Thank you for uploading the documents. We'll review them and get back to you shortly.",
  },
];

// The inner component that uses useSearchParams()
function StaffMessagesInner() {
  // Get project ID from URL query params
  const searchParams = useSearchParams();
  const projectId = parseInt(searchParams.get("project_id") || "1");

  // State hooks
  const [project, setProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [currentStaff, setCurrentStaff] = useState<StaffMember | null>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load project data
  const loadProject = async () => {
    setLoading(true);
    try {
      const projectResponse = await axios.get(
        `${API_BASE_URL}/projects/${projectId}`
      );
      const projectData = projectResponse.data;
      setProject(projectData);

      // Sort messages by timestamp (newest last)
      if (projectData.messages) {
        const sortedMessages = [...projectData.messages].sort((a, b) => {
          const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return timeA - timeB;
        });
        setMessages(sortedMessages);
      }

      // Load staff members
      const staffResponse = await axios.get(`${API_BASE_URL}/staff/`);
      setStaffMembers(staffResponse.data);

      // Set current staff member (for demo purposes, just use the first one)
      if (staffResponse.data.length > 0) {
        setCurrentStaff(staffResponse.data[0]);
      }
    } catch (error) {
      console.error("Error loading project:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load project messages. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Send a message
  const sendMessage = async () => {
    if (!newMessage.trim() || !currentStaff) return;

    setSendingMessage(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/messages/`, {
        project_id: projectId,
        sender: "staff",
        sender_id: currentStaff.id,
        text: newMessage,
      });

      // Add the new message to the list
      setMessages([...messages, response.data]);
      setNewMessage("");

      toast({
        title: "Message sent",
        description: "Your message has been sent to the client.",
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not send message. Please try again.",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  // Apply a message template
  const applyTemplate = (template: string) => {
    setNewMessage(template);
    setSelectedTemplate("");
  };

  // Format relative time for message timestamps
  const formatRelativeTime = (timestamp: string | undefined) => {
    if (!timestamp) return "";

    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInDays === 0) {
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        if (diffInHours === 0) {
          const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
          if (diffInMinutes < 1) return "Just now";
          return `${diffInMinutes}m ago`;
        }
        return `${diffInHours}h ago`;
      } else if (diffInDays === 1) {
        return "Yesterday";
      } else if (diffInDays < 7) {
        return `${diffInDays}d ago`;
      } else {
        return date.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        });
      }
    } catch (e) {
      return "";
    }
  };

  // Get staff name by ID
  const getStaffName = (staffId: string | undefined) => {
    if (!staffId) return "Staff";
    const staff = staffMembers.find((s) => s.id === staffId);
    return staff ? staff.name : "Staff";
  };

  // Scroll to bottom of messages when messages change
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load project on component mount
  useEffect(() => {
    loadProject();

    // Set up polling for new messages
    const intervalId = setInterval(loadProject, 30000); // Poll every 30 seconds

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  return (
    <div className="flex flex-col h-screen">
      <header className="border-b p-4 bg-background">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link href="/staff">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <Separator orientation="vertical" className="h-6" />
            <h1 className="text-lg font-semibold">
              Messages
              {project && (
                <span> - {project.client_name} (Project #{projectId})</span>
              )}
            </h1>
            {project && (
              <Badge variant="outline" className="ml-2">
                {project.service_type}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {project && (
              <Link href={`/project/${project.id}`}>
                <Button variant="outline" size="sm" className="gap-1">
                  <ChevronRight className="h-3 w-3" />
                  View Project
                </Button>
              </Link>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={loadProject}
              disabled={loading}
              className="gap-1"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {loading && !project ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          <div className="w-full md:w-3/4 flex flex-col">
            {/* Messages container */}
            <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-muted/30">
              <div className="max-w-3xl mx-auto space-y-6">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                    <h3 className="text-lg font-medium mb-1">No messages yet</h3>
                    <p className="text-muted-foreground">
                      Start the conversation with your client.
                    </p>
                  </div>
                ) : (
                  <>
                    {messages.map((message, index) => {
                      const isStaff = message.sender === "staff";
                      const showDate =
                        index === 0 ||
                        (messages[index - 1].timestamp &&
                          message.timestamp &&
                          new Date(messages[index - 1].timestamp).toDateString() !==
                            new Date(message.timestamp).toDateString());

                      return (
                        <div key={message.id}>
                          {showDate && message.timestamp && (
                            <div className="flex justify-center my-4">
                              <Badge variant="outline" className="bg-background">
                                {new Date(message.timestamp).toLocaleDateString(
                                  undefined,
                                  {
                                    weekday: "long",
                                    month: "long",
                                    day: "numeric",
                                  }
                                )}
                              </Badge>
                            </div>
                          )}

                          <div
                            className={`flex ${
                              isStaff ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`
                                flex items-start space-x-2 max-w-[80%]
                                ${
                                  isStaff
                                    ? "flex-row-reverse space-x-reverse"
                                    : ""
                                }
                              `}
                            >
                              <Avatar className="h-8 w-8 mt-1">
                                <AvatarFallback
                                  className={
                                    isStaff ? "bg-primary/20" : "bg-muted"
                                  }
                                >
                                  {isStaff ? (
                                    <Users className="h-4 w-4 text-primary" />
                                  ) : (
                                    <User className="h-4 w-4" />
                                  )}
                                </AvatarFallback>
                              </Avatar>

                              <div>
                                <div
                                  className={`
                                    px-4 py-2.5 rounded-lg shadow-sm
                                    ${
                                      isStaff
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-background border"
                                    }
                                  `}
                                >
                                  <div className="text-xs text-muted-foreground mb-1">
                                    {isStaff
                                      ? getStaffName(message.sender_id)
                                      : project?.client_name}
                                  </div>
                                  <p className="text-sm">{message.text}</p>
                                </div>

                                <div
                                  className={`
                                    mt-1 text-xs text-muted-foreground flex items-center
                                    ${isStaff ? "justify-end" : ""}
                                  `}
                                >
                                  <Clock className="h-3 w-3 mr-1" />
                                  <span>{formatRelativeTime(message.timestamp)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={endOfMessagesRef} />
                  </>
                )}
              </div>
            </div>

            {/* Message input area */}
            <div className="p-4 border-t bg-background">
              <div className="max-w-3xl mx-auto">
                <div className="flex items-end space-x-2">
                  <div className="flex-1">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="min-h-[80px] resize-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                      <span>Press Enter to send, Shift+Enter for new line</span>
                      <span>{newMessage.length} characters</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="outline" size="icon" type="button" title="Attach file">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={sendMessage}
                      disabled={sendingMessage || !newMessage.trim() || !currentStaff}
                      size="icon"
                    >
                      {sendingMessage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="md:w-1/4 md:min-w-[300px] border-t md:border-t-0 md:border-l overflow-y-auto bg-background">
            <div className="p-4">
              <div className="space-y-6">
                {/* Select staff identity */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md">Your Identity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select
                      value={currentStaff?.id || ""}
                      onValueChange={(value) => {
                        const staff = staffMembers.find((s) => s.id === value);
                        if (staff) setCurrentStaff(staff);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your identity" />
                      </SelectTrigger>
                      <SelectContent>
                        {staffMembers.map((staff) => (
                          <SelectItem key={staff.id} value={staff.id}>
                            {staff.name} ({staff.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                {/* Client info */}
                {project && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">Client Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name:</span>
                        <span className="font-medium">{project.client_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Project ID:</span>
                        <span className="font-medium">#{project.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Service:</span>
                        <span className="font-medium">
                          {project.service_type || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant="outline">{project.status}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Message templates */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md">Message Templates</CardTitle>
                    <CardDescription>
                      Quick responses for common situations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Select onValueChange={applyTemplate} value={selectedTemplate}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template" />
                      </SelectTrigger>
                      <SelectContent>
                        {MESSAGE_TEMPLATES.map((template, index) => (
                          <SelectItem key={index} value={template.value}>
                            {template.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                {/* Documents */}
                {project && project.docs && project.docs.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">Client Documents</CardTitle>
                      <CardDescription>
                        {project.docs.length} document
                        {project.docs.length !== 1 ? "s" : ""} uploaded
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {project.docs.slice(0, 5).map((doc) => (
                          <div
                            key={doc.doc_id}
                            className="flex items-center space-x-2 text-sm"
                          >
                            <FileText className="h-4 w-4 text-primary" />
                            <span className="truncate flex-1">
                              {doc.original_name}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {doc.doc_type}
                            </Badge>
                          </div>
                        ))}

                        {project.docs.length > 5 && (
                          <Button variant="link" className="px-0 text-xs" asChild>
                            <Link href={`/project/${projectId}`}>
                              View all documents
                            </Link>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Action buttons */}
                <div className="space-y-2">
                  <Link href={`/project/${projectId}`} className="w-full block">
                    <Button className="w-full">View Project Details</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Now wrap StaffMessagesInner in a Suspense boundary:
export default function StaffMessages() {
  return (
    <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin m-auto" />}>
      <StaffMessagesInner />
    </Suspense>
  );
}
