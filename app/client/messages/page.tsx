"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Clock,
  RefreshCw,
  BrainCircuit,
  FileText
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Interface definitions
// ─────────────────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  project_id: number;
  sender: string;
  sender_id?: string;
  text: string;
  timestamp?: string;
}

interface Project {
  id: number;
  client_name: string;
  status: string;
  service_type?: string;
  docs?: any[];
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

// API base URL
const API_BASE_URL = "https://keyveve-accounting-demo-backend.onrender.co";

/* ────────────────────────────────────────────────────────────────────────────
   Inner component (contains the original logic that calls useSearchParams)
   ────────────────────────────────────────────────────────────────────────── */
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
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load project data
  const loadProject = async () => {
    setLoading(true);
    try {
      const projectResponse = await axios.get(`${API_BASE_URL}/projects/${projectId}`);
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
      try {
        const staffResponse = await axios.get(`${API_BASE_URL}/staff/`);
        setStaffMembers(staffResponse.data);
      } catch (err) {
        console.error("Error loading staff members:", err);
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
    if (!newMessage.trim()) return;

    setSendingMessage(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/messages/`, {
        project_id: projectId,
        sender: "client",
        text: newMessage
      });

      // Add the new message to the list
      setMessages([...messages, response.data]);
      setNewMessage("");

      toast({
        title: "Message sent",
        description: "Your message has been sent to our team.",
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
        return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      }
    } catch {
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
    const intervalId = setInterval(loadProject, 30_000); // Poll every 30 seconds
    return () => clearInterval(intervalId);
  }, [projectId]);

  return (
    <div className="flex flex-col h-screen">
      {/* ───────────────────────── HEADER ───────────────────────── */}
      <header className="border-b p-4 bg-background">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href={`/client?project_id=${projectId}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Portal
              </Button>
            </Link>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-primary" />
              <div>
                <h1 className="text-lg font-semibold">
                  Messages with Your Accountant
                </h1>
                {project && (
                  <div className="flex items-center">
                    <span className="text-sm font-normal text-muted-foreground">
                      Project #{projectId} ‑ {project.service_type}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
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
      </header>

      {/* ───────────────────────── MAIN ───────────────────────── */}
      {loading && !project ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages container */}
          <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-muted/30">
            <div className="max-w-2xl mx-auto space-y-6">
              {/* No messages */}
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                  <h3 className="text-lg font-medium mb-1">No messages yet</h3>
                  <p className="text-muted-foreground">
                    Start a conversation with your accountant by sending a message below.
                  </p>
                </div>
              ) : (
                /* Message list */
                <>
                  {messages.map((message, index) => {
                    const isClient = message.sender === "client";
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
                              {new Date(message.timestamp).toLocaleDateString(undefined, {
                                weekday: "long",
                                month: "long",
                                day: "numeric"
                              })}
                            </Badge>
                          </div>
                        )}

                        <div className={`flex ${isClient ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`
                            flex items-start space-x-2 max-w-[80%]
                            ${isClient ? "flex-row-reverse space-x-reverse" : ""}
                          `}
                          >
                            <Avatar className="h-8 w-8 mt-1">
                              <AvatarFallback className={isClient ? "bg-primary/20" : "bg-muted"}>
                                {isClient ? (
                                  <User className="h-4 w-4 text-primary" />
                                ) : (
                                  <Users className="h-4 w-4" />
                                )}
                              </AvatarFallback>
                            </Avatar>

                            <div>
                              <div
                                className={`
                                px-4 py-2.5 rounded-lg shadow-sm
                                ${
                                  isClient
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-background border"
                                }
                              `}
                              >
                                <div className="text-xs text-muted-foreground mb-1">
                                  {isClient ? project?.client_name : getStaffName(message.sender_id)}
                                </div>
                                <p className="text-sm">{message.text}</p>
                              </div>

                              <div
                                className={`
                                mt-1 text-xs text-muted-foreground flex items-center
                                ${isClient ? "justify-end" : ""}
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
            <div className="max-w-2xl mx-auto">
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

                <Button
                  onClick={sendMessage}
                  disabled={sendingMessage || !newMessage.trim()}
                  size="icon"
                >
                  {sendingMessage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="mt-4 rounded-lg border p-3 text-sm bg-muted/20">
                <h3 className="font-medium mb-1">Contact Information</h3>
                <p className="text-muted-foreground">
                  Need immediate assistance? You can also reach us by:
                </p>
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  <li>• Phone: (555) 123‑4567</li>
                  <li>• Email: support@keyveve.com</li>
                  <li>• Hours: Monday‑Friday, 9:am‑5:pm</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Route wrapper with Suspense (required by Next.js when using useSearchParams)
   ────────────────────────────────────────────────────────────────────────── */
export default function StaffMessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <StaffMessagesInner />
    </Suspense>
  );
}
