"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowLeft,
  Send,
  Brain,
  User,
  Loader2,
  FileText,
  MessageSquare,
  RefreshCw,
  Search,
  Lightbulb
} from "lucide-react";

// API base URL
const API_BASE_URL = "http://localhost:8000";

// Interface definitions
interface Document {
  doc_id: string;
  original_name: string;
  doc_type: string;
  extracted_data: string;
}

interface Project {
  id: number;
  client_name: string;
  status: string;
  service_needed?: string;
  docs: Document[];
  tasks: string[];
  messages: any[];
  created_at?: string;
  updated_at?: string;
}

// Sample questions to give users ideas
const SAMPLE_QUESTIONS = [
  "What documents are missing for this project?",
  "When was the last document uploaded?",
  "What is the next step for this project?",
  "Summarize the client's tax situation based on their documents.",
  "What information do we still need to complete this project?",
  "How long has this project been in the current status?",
  "What tasks still need to be completed?",
  "Which document type should be prioritized for this project?",
  "What is the client's income based on the documents?"
];

export default function StaffQA() {
  // Get project ID from URL query params
  const searchParams = useSearchParams();
  const projectId = parseInt(searchParams.get("project_id") || "1");

  // State hooks
  const [project, setProject] = useState<Project | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [projectLoading, setProjectLoading] = useState(true);
  const [conversationHistory, setConversationHistory] = useState<{question: string; answer: string}[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Load project data
  const loadProject = async () => {
    setProjectLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/projects/${projectId}`);
      setProject(response.data);
    } catch (error) {
      console.error("Error loading project:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load project details.",
      });
    } finally {
      setProjectLoading(false);
    }
  };

  // Ask a question to the AI assistant
  const askQuestion = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setAnswer("");
    setIsTyping(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/qa`, {
        project_id: projectId,
        question: question
      });

      const newAnswer = response.data.answer;

      // Simulate typing effect
      let displayedAnswer = "";
      const answerFull = newAnswer;

      for (let i = 0; i < answerFull.length; i++) {
        displayedAnswer += answerFull[i];
        setAnswer(displayedAnswer);
        await new Promise(resolve => setTimeout(resolve, 15)); // adjust speed as needed
      }

      // Add to conversation history
      setConversationHistory([...conversationHistory, {
        question: question,
        answer: answerFull
      }]);

      setQuestion("");

      // Focus the input for the next question
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);

    } catch (error) {
      console.error("Error querying AI:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not get an answer. Please try again.",
      });
      setAnswer("I'm sorry, I couldn't process that question. Please try again or rephrase your question.");
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  };

  // Use a sample question
  const useSampleQuestion = (sampleQuestion: string) => {
    setQuestion(sampleQuestion);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Load project on component mount
  useEffect(() => {
    loadProject();
  }, [projectId]);

  // Focus input on component mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
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
            <h1 className="text-lg font-semibold flex items-center">
              <Brain className="h-5 w-5 text-primary mr-2" />
              AI Project Assistant
              {project && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  Project #{projectId} - {project.client_name}
                </span>
              )}
            </h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadProject}
            disabled={projectLoading}
            className="gap-1"
          >
            <RefreshCw className={`h-3 w-3 ${projectLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </header>

      <div className="flex-1 container mx-auto px-4 py-6 grid md:grid-cols-3 gap-6">
        {/* Main Q&A Section */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ask About This Project</CardTitle>
              <CardDescription>
                Ask questions about project status, client details, documents, and next steps.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Input
                  ref={inputRef}
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask a question about this project..."
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      askQuestion();
                    }
                  }}
                />
                <Button
                  onClick={askQuestion}
                  disabled={loading || !question.trim()}
                  className="gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Ask</span>
                    </>
                  )}
                </Button>
              </div>

              {isTyping || answer ? (
                <div className="mt-6 space-y-4">
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/20">
                        <User className="h-4 w-4 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="py-1 px-3 rounded-lg bg-muted/50 text-sm">
                      {conversationHistory.length > 0
                        ? conversationHistory[conversationHistory.length - 1].question
                        : question}
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10">
                        <Brain className="h-4 w-4 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="py-3 px-4 rounded-lg border shadow-sm text-sm bg-background relative">
                      {isTyping && !answer && (
                        <div className="flex space-x-1 mb-1 items-center">
                          <span className="sr-only">Thinking...</span>
                          <div className="h-1.5 w-1.5 bg-primary/70 rounded-full animate-pulse" style={{ animationDelay: "0ms" }}></div>
                          <div className="h-1.5 w-1.5 bg-primary/70 rounded-full animate-pulse" style={{ animationDelay: "300ms" }}></div>
                          <div className="h-1.5 w-1.5 bg-primary/70 rounded-full animate-pulse" style={{ animationDelay: "600ms" }}></div>
                        </div>
                      )}
                      {answer && (
                        <div className="whitespace-pre-line">
                          {answer}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6 p-6 border rounded-lg bg-muted/20 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <Brain className="h-10 w-10 mx-auto text-primary/60" />
                    <p className="text-muted-foreground">
                      Ask a question about this project to get AI-powered assistance.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {conversationHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Conversation History</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-6">
                    {conversationHistory.slice(0, -1).reverse().map((item, index) => (
                      <div key={index} className="space-y-3 pb-4 border-b">
                        <div className="flex items-start space-x-3">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="bg-primary/20">
                              <User className="h-3 w-3 text-primary" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="py-1 px-3 rounded-lg bg-muted/50 text-sm">
                            {item.question}
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="bg-primary/10">
                              <Brain className="h-3 w-3 text-primary" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="py-2 px-3 rounded-lg border text-sm bg-background">
                            {item.answer}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar with Project Info */}
        <div className="space-y-6">
          {projectLoading ? (
            <Card>
              <CardContent className="pt-6 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : project ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Project Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="text-sm text-muted-foreground">Client</div>
                    <div className="font-medium">{project.client_name}</div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-sm text-muted-foreground">Service</div>
                    <div className="font-medium">{project.service_needed || "N/A"}</div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-sm text-muted-foreground">Status</div>
                    <Badge variant="outline">{project.status}</Badge>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-sm text-muted-foreground">Documents</div>
                    <div className="font-medium">{project.docs.length} document(s)</div>
                    {project.docs.length > 0 && (
                      <div className="mt-2 text-xs space-y-1">
                        {project.docs.slice(0, 3).map((doc) => (
                          <div key={doc.doc_id} className="flex items-center">
                            <FileText className="h-3 w-3 mr-1 text-primary" />
                            <span className="truncate">{doc.original_name}</span>
                          </div>
                        ))}
                        {project.docs.length > 3 && (
                          <div className="text-muted-foreground">
                            +{project.docs.length - 3} more document(s)
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-sm text-muted-foreground">Tasks</div>
                    <div className="text-xs space-y-1">
                      {project.tasks.slice(0, 3).map((task, index) => (
                        <div key={index} className="flex items-start space-x-1">
                          <span className="text-primary">•</span>
                          <span>{task}</span>
                        </div>
                      ))}
                      {project.tasks.length > 3 && (
                        <div className="text-muted-foreground">
                          +{project.tasks.length - 3} more task(s)
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-4">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/staff/messages?project_id=${projectId}`}>
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Messages
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/staff?project_id=${projectId}`}>
                      View Project
                    </Link>
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sample Questions</CardTitle>
                  <CardDescription>
                    Try asking one of these questions about this project.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {SAMPLE_QUESTIONS.map((sampleQuestion, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        className="w-full justify-start text-left h-auto py-2 text-sm"
                        onClick={() => useSampleQuestion(sampleQuestion)}
                      >
                        <Search className="h-3 w-3 mr-2 flex-shrink-0" />
                        <span className="truncate">{sampleQuestion}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>AI Assistant Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start space-x-2">
                      <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <p>Ask specific questions about the client, documents, or project status for the best results.</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <p>The AI can summarize document contents, identify missing information, and suggest next steps.</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <p>Try asking "What should I do next for this client?" for context-aware recommendations.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">Project not found</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}