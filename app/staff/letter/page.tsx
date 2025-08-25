"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowLeft,
  FileText,
  ExternalLink,
  Loader2,
  CheckCircle,
  FileSignature,
  RefreshCw,
  AlertCircle,
  MailCheck,
  Clock,
  Calendar,
  ChevronRight,
  FileSpreadsheet,
  Download,
  Calculator,
  Eye,
  Check,
  UserCheck,
} from "lucide-react";

// API base URL
const API_BASE_URL = "https://keyveve-accounting-demo-backend.onrender.com";

// Interface definitions
interface Document {
  doc_id: string;
  original_name: string;
  doc_type: string;
  extracted_data: string;
  storage_location: string;
  doc_category: string;
}

interface Project {
  id: number;
  client_name: string;
  status: string;
  service_type?: string;
  docs: Document[];
  created_at?: string;
  updated_at?: string;
}

// Service fee structure based on service type
interface ServiceFee {
  service: string;
  basePrice: number;
  description: string;
}

const SERVICE_FEES: ServiceFee[] = [
  {
    service: "Tax Return",
    basePrice: 500,
    description: "Individual tax return preparation and filing",
  },
  {
    service: "Bookkeeping",
    basePrice: 750,
    description: "Monthly bookkeeping and reconciliation services",
  },
  {
    service: "Audit",
    basePrice: 2500,
    description: "Comprehensive audit and financial statement review",
  },
  {
    service: "Financial Planning",
    basePrice: 1200,
    description: "Personal or business financial planning services",
  },
  {
    service: "Advisory",
    basePrice: 1000,
    description: "Business advisory services",
  },
];

function EngagementLetterInner() {
  // Get project ID from URL query params
  const searchParams = useSearchParams();
  const projectId = parseInt(searchParams.get("project_id") || "1");

  // Original state hooks
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingLetter, setSendingLetter] = useState(false);
  const [message, setMessage] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [customFee, setCustomFee] = useState("");
  const [termsChecked, setTermsChecked] = useState({
    scope: true,
    fee: true,
    timeline: true,
    confidentiality: true,
  });

  // New state hooks for enhanced functionality
  const [showFetchedFromPricing, setShowFetchedFromPricing] = useState(false);
  const [pricingDataFetched, setPricingDataFetched] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportingCSV, setExportingCSV] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("pending"); // "pending", "sent", "viewed", "signed"
  const [showSignatureHistory, setShowSignatureHistory] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  const { toast } = useToast();

  // Get service fee based on project's service type
  const getServiceFee = (): ServiceFee => {
    if (!project || !project.service_type) {
      return SERVICE_FEES[0]; // Default to first service
    }

    const fee = SERVICE_FEES.find((fee) => fee.service === project.service_type);
    return fee || SERVICE_FEES[0];
  };

  // Format currency
  const formatCurrency = (value: number | string) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(numValue)) return "$0.00";

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(numValue);
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  // Calculate estimated completion date (30 days from now)
  const getEstimatedCompletionDate = () => {
    const today = new Date();
    const completionDate = new Date(today);
    completionDate.setDate(today.getDate() + 30);
    return formatDate(completionDate);
  };

  // New function: Generate local engagement letter (demo purposes only)
  const generateEngagementLetter = async () => {
    setGenerating(true);
    try {
      // Simulate letter generation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast({
        title: "Letter Generated",
        description:
          "Local engagement letter has been generated for demonstration purposes.",
      });

      setGenerateDialogOpen(false);
    } catch (error) {
      console.error("Error generating letter:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          "Could not generate local engagement letter. Please try again.",
      });
    } finally {
      setGenerating(false);
    }
  };

  // New function: Fetch pricing data
  const fetchPricingData = async () => {
    if (!project) return;

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Pretend we got pricing data
      setCustomFee("1200");
      setPricingDataFetched(true);
      setShowFetchedFromPricing(true);

      toast({
        title: "Pricing data fetched",
        description: "Applied recommended pricing from analysis",
      });

      setTimeout(() => {
        setShowFetchedFromPricing(false);
      }, 5000);
    } catch (error) {
      console.error("Error fetching pricing data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch pricing data. Using default pricing.",
      });
    }
  };

  // New function: Export to CSV
  const exportToCSV = async () => {
    if (!project) return;

    setExportingCSV(true);
    try {
      // Simulate export process
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Create CSV content
      const csvContent = `"client_name","project_id","service_type","fee","status"
"${project.client_name}","${project.id}","${project.service_type}","${customFee}","${project.status}"`;

      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `engagement_letter_data_${project.id}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "CSV Exported",
        description: "Engagement letter data has been exported to CSV.",
      });

      setExportDialogOpen(false);
    } catch (error) {
      console.error("Error exporting to CSV:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not export to CSV. Please try again.",
      });
    } finally {
      setExportingCSV(false);
    }
  };

  // New function: Check engagement letter status
  const checkStatus = async () => {
    try {
      // Simulate checking status from external software
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // For the demo, just cycle through statuses
      if (currentStatus === "pending") setCurrentStatus("sent");
      else if (currentStatus === "sent") setCurrentStatus("viewed");
      else if (currentStatus === "viewed") setCurrentStatus("signed");
      else setCurrentStatus("pending");

      toast({
        title: "Status Updated",
        description: "Engagement letter status has been refreshed.",
      });
    } catch (error) {
      console.error("Error checking status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not check engagement letter status.",
      });
    }
  };

  // Load project data
  const loadProject = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/projects/${projectId}`);
      setProject(response.data);

      // Set custom fee based on service type
      const fee = SERVICE_FEES.find(
        (fee) => fee.service === response.data.service_type
      );
      if (fee) {
        setCustomFee(fee.basePrice.toString());
      }
    } catch (error) {
      console.error("Error loading project:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load project details.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Send to engagement letter software
  const sendEngagementLetter = async () => {
    if (!project) return;

    if (!Object.values(termsChecked).every(Boolean)) {
      toast({
        variant: "destructive",
        title: "Terms Required",
        description:
          "Please confirm all engagement letter terms before sending.",
      });
      return;
    }

    setSendingLetter(true);
    try {
      await axios.post(`${API_BASE_URL}/integrations/engagement-letter`, {
        project_id: project.id,
      });

      setMessage(
        "Client data sent to engagement letter software. Project status updated to 'Awaiting Signature'."
      );

      toast({
        title: "Data Sent",
        description: "Client data sent to engagement letter software.",
      });

      loadProject();
    } catch (error) {
      console.error("Error sending to engagement letter software:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          "Could not send data to engagement letter software. Please try again.",
      });
    } finally {
      setSendingLetter(false);
    }
  };

  // Load project on component mount
  useEffect(() => {
    loadProject();
  }, [projectId]);

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <div className="flex items-center space-x-2 mb-6">
        <Link href="/staff">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <Separator orientation="vertical" className="h-6" />
        <h1 className="text-2xl font-bold">Engagement Letter Integration</h1>
        {project && (
          <div className="flex gap-2 ml-2">
            <Badge variant="outline">{project.service_type}</Badge>
            <Badge>{project.client_name}</Badge>
          </div>
        )}
      </div>

      {loading && !project ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : project ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main engagement letter section */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileSignature className="h-5 w-5 mr-2 text-primary" />
                  Engagement Letter Status Hub
                </CardTitle>
                <CardDescription>
                  Track client data sent to external engagement letter software
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Integration Status Card */}
                <Card className="bg-muted/30 border">
                  <CardContent className="pt-6 pb-4">
                    <div className="flex items-start space-x-4">
                      <div
                        className={`p-3 rounded-full ${
                          project.status === "Awaiting Signature"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            : project.status === "Project Started" ||
                              project.status === "Completed"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        }`}
                      >
                        {project.status === "Awaiting Signature" ? (
                          <Clock className="h-6 w-6" />
                        ) : project.status === "Project Started" ||
                          project.status === "Completed" ? (
                          <UserCheck className="h-6 w-6" />
                        ) : (
                          <ExternalLink className="h-6 w-6" />
                        )}
                      </div>
                      <div className="space-y-1 flex-1">
                        <h3 className="font-medium text-lg">
                          {project.status === "Awaiting Signature"
                            ? "Awaiting Client Signature"
                            : project.status === "Project Started" ||
                              project.status === "Completed"
                            ? "Engagement Letter Signed"
                            : "Ready to Send Client Data"}
                        </h3>
                        <p className="text-muted-foreground">
                          {project.status === "Awaiting Signature"
                            ? "Client data has been sent to the external system and is awaiting client signature."
                            : project.status === "Project Started" ||
                              project.status === "Completed"
                            ? "The client has signed the engagement letter and the project is now active."
                            : "Client data is ready to be sent to the external engagement letter software."}
                        </p>

                        {project.status === "Awaiting Signature" && (
                          <div className="flex items-center mt-2 space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={checkStatus}
                            >
                              <RefreshCw className="h-3 w-3" />
                              Check Status
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-2"
                              onClick={() => setDetailsDialogOpen(true)}
                            >
                              <Eye className="h-3 w-3" />
                              View Details
                            </Button>
                          </div>
                        )}

                        {(project.status === "Project Started" ||
                          project.status === "Completed") && (
                          <div className="flex items-center mt-2 space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => setShowSignatureHistory(true)}
                            >
                              <FileText className="h-3 w-3" />
                              View Signature History
                            </Button>
                          </div>
                        )}

                        {project.status !== "Awaiting Signature" &&
                          project.status !== "Project Started" &&
                          project.status !== "Completed" && (
                            <div className="flex items-center mt-2 space-x-2">
                              <Button
                                onClick={sendEngagementLetter}
                                disabled={sendingLetter}
                                size="sm"
                                className="gap-2"
                              >
                                {sendingLetter ? (
                                  <>
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Sending...
                                  </>
                                ) : (
                                  <>
                                    <ExternalLink className="h-3 w-3" />
                                    Send to EngagementLetterApp
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Status Timeline for "Awaiting Signature" */}
                {project.status === "Awaiting Signature" && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">
                      External Software Status Timeline
                    </h3>
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-[1px] bg-muted-foreground/20"></div>

                      <div className="space-y-4 ml-10 relative">
                        <div className="relative">
                          <div className="absolute -left-10 mt-0.5 h-4 w-4 rounded-full border border-primary bg-background flex items-center justify-center">
                            <div className="h-2 w-2 rounded-full bg-primary"></div>
                          </div>
                          <div>
                            <p className="font-medium">Data Sent to Software</p>
                            <p className="text-xs text-muted-foreground">
                              {project.updated_at
                                ? new Date(project.updated_at).toLocaleDateString()
                                : "unknown date"}
                            </p>
                          </div>
                        </div>

                        <div className="relative">
                          <div
                            className={`absolute -left-10 mt-0.5 h-4 w-4 rounded-full border ${
                              currentStatus === "viewed" ||
                              currentStatus === "signed"
                                ? "border-primary"
                                : "border-muted-foreground/40"
                            } bg-background flex items-center justify-center`}
                          >
                            {(currentStatus === "viewed" ||
                              currentStatus === "signed") && (
                              <div className="h-2 w-2 rounded-full bg-primary"></div>
                            )}
                          </div>
                          <div
                            className={
                              currentStatus === "viewed" ||
                              currentStatus === "signed"
                                ? ""
                                : "text-muted-foreground/60"
                            }
                          >
                            <p className="font-medium">Viewed by Client</p>
                            <p className="text-xs text-muted-foreground">
                              {currentStatus === "viewed" ||
                              currentStatus === "signed"
                                ? "April 14, 2025"
                                : "Pending"}
                            </p>
                          </div>
                        </div>

                        <div className="relative">
                          <div
                            className={`absolute -left-10 mt-0.5 h-4 w-4 rounded-full border ${
                              currentStatus === "signed"
                                ? "border-primary"
                                : "border-muted-foreground/40"
                            } bg-background flex items-center justify-center`}
                          >
                            {currentStatus === "signed" && (
                              <div className="h-2 w-2 rounded-full bg-primary"></div>
                            )}
                          </div>
                          <div
                            className={
                              currentStatus === "signed"
                                ? ""
                                : "text-muted-foreground/60"
                            }
                          >
                            <p className="font-medium">Signed by Client</p>
                            <p className="text-xs text-muted-foreground">
                              {currentStatus === "signed"
                                ? "April 15, 2025"
                                : "Pending"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Signature history for "Project Started" or "Completed" */}
                {showSignatureHistory &&
                  (project.status === "Project Started" ||
                    project.status === "Completed") && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium">
                          Signature History
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowSignatureHistory(false)}
                          className="h-7 text-xs"
                        >
                          Hide
                        </Button>
                      </div>

                      <div className="rounded-lg border p-4 space-y-3">
                        <div className="flex items-start space-x-3">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                          <div>
                            <p className="font-medium">
                              Data Sent to EngagementLetterApp
                            </p>
                            <p className="text-xs text-muted-foreground">
                              April 10, 2025 at 2:45 PM
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                          <div>
                            <p className="font-medium">Opened by Client</p>
                            <p className="text-xs text-muted-foreground">
                              April 12, 2025 at 9:30 AM
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                          <div>
                            <p className="font-medium">Signed by Client</p>
                            <p className="text-xs text-muted-foreground">
                              April 12, 2025 at 10:15 AM
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              IP: 192.168.1.1 | Device: Chrome on Windows
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Client Data Preview section - replaces the letter content preview */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium">
                      Client Data Sent to Engagement Letter Software
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExportDialogOpen(true)}
                      className="gap-2"
                    >
                      <Download className="h-3 w-3" />
                      Export Data
                    </Button>
                  </div>

                  <div className="rounded-lg border p-4 bg-background space-y-4 max-h-[400px] overflow-y-auto">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="p-2 rounded-md bg-primary/10">
                        <ExternalLink className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">
                          Integration with EngagementLetterApp
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          The following data will be sent to the external
                          engagement letter software
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4">
                      {/* Client Information Section */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">
                          Client Information
                        </h4>
                        <div className="grid grid-cols-2 gap-2 border rounded-md p-3 bg-muted/20">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">
                              Client Name
                            </p>
                            <p className="text-sm font-medium">
                              {project.client_name}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">
                              Project ID
                            </p>
                            <p className="text-sm font-medium">
                              #{project.id}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Service & Fee Information */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">
                          Service & Fee Information
                        </h4>
                        <div className="border rounded-md p-3 bg-muted/20">
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">
                                Service Type
                              </p>
                              <p className="text-sm font-medium">
                                {project.service_type}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">
                                Service Fee
                              </p>
                              <p className="text-sm font-medium">
                                {formatCurrency(
                                  customFee || getServiceFee().basePrice
                                )}
                              </p>
                              {showFetchedFromPricing && (
                                <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-1 mt-1 text-xs text-green-700 dark:text-green-300 animate-pulse">
                                  <div className="flex items-center">
                                    <Check className="h-3 w-3 mr-1 text-green-600 dark:text-green-400" />
                                    <span>From pricing analysis</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">
                              Service Description
                            </p>
                            <p className="text-sm">
                              {getServiceFee().description}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Document Summary */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">
                          Document Summary
                        </h4>
                        <div className="border rounded-md p-3 bg-muted/20">
                          <p className="text-xs text-muted-foreground mb-2">
                            {project.docs.length} document
                            {project.docs.length !== 1 ? "s" : ""} associated
                            with this project
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {/* Count by document type */}
                            {(() => {
                              const docTypes: Record<string, number> = {};
                              project.docs.forEach((doc) => {
                                docTypes[doc.doc_type] =
                                  (docTypes[doc.doc_type] || 0) + 1;
                              });

                              return Object.entries(docTypes).map(
                                ([type, count]) => (
                                  <Badge key={type} variant="outline" className="text-xs">
                                    {type}: {count}
                                  </Badge>
                                )
                              );
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* Timeline Information */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">
                          Timeline Information
                        </h4>
                        <div className="border rounded-md p-3 bg-muted/20">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">
                                Engagement Date
                              </p>
                              <p className="text-sm font-medium">
                                {formatDate(new Date())}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">
                                Estimated Completion
                              </p>
                              <p className="text-sm font-medium">
                                {getEstimatedCompletionDate()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Additional Notes */}
                      {additionalNotes && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-muted-foreground">
                            Additional Notes
                          </h4>
                          <div className="border rounded-md p-3 bg-muted/20">
                            <p className="text-sm">{additionalNotes}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-md p-3 mt-4">
                      <div className="flex items-start">
                        <div className="mr-3 mt-0.5">
                          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <p className="text-xs text-amber-800 dark:text-amber-200">
                            This data will be used by the external engagement
                            letter software to generate an engagement letter.
                            The actual letter content and formatting will be
                            determined by the external software's templates.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Confirmation checkbox section */}
                {project.status !== "Awaiting Signature" &&
                  project.status !== "Project Started" &&
                  project.status !== "Completed" && (
                    <div className="space-y-3 rounded-lg border p-4">
                      <h3 className="text-sm font-medium">Confirm Before Sending</h3>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="scope"
                            checked={termsChecked.scope}
                            onCheckedChange={(checked) =>
                              setTermsChecked({
                                ...termsChecked,
                                scope: checked as boolean,
                              })
                            }
                          />
                          <label
                            htmlFor="scope"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Client scope of services is clearly defined
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="fee"
                            checked={termsChecked.fee}
                            onCheckedChange={(checked) =>
                              setTermsChecked({
                                ...termsChecked,
                                fee: checked as boolean,
                              })
                            }
                          />
                          <label
                            htmlFor="fee"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Fee structure is appropriate for this engagement
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="timeline"
                            checked={termsChecked.timeline}
                            onCheckedChange={(checked) =>
                              setTermsChecked({
                                ...termsChecked,
                                timeline: checked as boolean,
                              })
                            }
                          />
                          <label
                            htmlFor="timeline"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Timeline and expectations are realistic
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="confidentiality"
                            checked={termsChecked.confidentiality}
                            onCheckedChange={(checked) =>
                              setTermsChecked({
                                ...termsChecked,
                                confidentiality: checked as boolean,
                              })
                            }
                          />
                          <label
                            htmlFor="confidentiality"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Confidentiality terms will be included
                          </label>
                        </div>
                      </div>

                      <div className="pt-2 flex justify-end">
                        <Button
                          onClick={sendEngagementLetter}
                          disabled={
                            sendingLetter ||
                            !Object.values(termsChecked).every(Boolean)
                          }
                          className="gap-2"
                        >
                          {sendingLetter ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <ExternalLink className="h-4 w-4" />
                              Send to EngagementLetterApp
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                {message && (
                  <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/20 p-4 text-green-700 dark:text-green-300 text-sm">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
                      {message}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Client Documents Card */}
            <Card>
              <CardHeader>
                <CardTitle>Client Documents</CardTitle>
                <CardDescription>
                  Documents uploaded by the client
                </CardDescription>
              </CardHeader>
              <CardContent>
                {project.docs.length > 0 ? (
                  <div className="space-y-2">
                    {project.docs.map((doc) => (
                      <div key={doc.doc_id} className="flex items-center space-x-2 text-sm">
                        <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="truncate">{doc.original_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.doc_type}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No documents uploaded yet
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end border-t pt-4">
                <Link href={`/project/${projectId}`}>
                  <Button variant="outline" size="sm" className="gap-1">
                    <ChevronRight className="h-3 w-3 mr-1" />
                    View Project
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Export Options Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileSpreadsheet className="h-5 w-5 mr-2 text-primary" />
                  Export Options
                </CardTitle>
                <CardDescription>
                  Export data for use in other systems
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => setExportDialogOpen(true)}
                >
                  <Download className="h-4 w-4" />
                  Export to CSV
                </Button>

                <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Export to CSV</DialogTitle>
                      <DialogDescription>
                        Export client data to CSV format for importing into
                        other engagement letter systems.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <div className="rounded-lg border p-4">
                        <h4 className="text-sm font-medium mb-2">
                          Export will include:
                        </h4>
                        <ul className="text-sm space-y-1">
                          <li className="flex items-center">
                            <Check className="h-4 w-4 text-green-500 mr-2" />
                            Client name and ID
                          </li>
                          <li className="flex items-center">
                            <Check className="h-4 w-4 text-green-500 mr-2" />
                            Service type
                          </li>
                          <li className="flex items-center">
                            <Check className="h-4 w-4 text-green-500 mr-2" />
                            Fee amount
                          </li>
                          <li className="flex items-center">
                            <Check className="h-4 w-4 text-green-500 mr-2" />
                            Current status
                          </li>
                        </ul>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={exportToCSV} disabled={exportingCSV}>
                        {exportingCSV ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Exporting...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Export CSV
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Separator />

                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={fetchPricingData}
                  disabled={pricingDataFetched}
                >
                  <Calculator className="h-4 w-4" />
                  Fetch Pricing Data
                </Button>
              </CardContent>
            </Card>

            {/* Generate Letter Options Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileSignature className="h-5 w-5 mr-2 text-primary" />
                  Generate Letter Demo
                </CardTitle>
                <CardDescription>
                  For evaluation purposes only
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 text-xs">
                  <div className="flex items-start">
                    <AlertCircle className="h-4 w-4 mt-0.5 mr-2 text-amber-500 flex-shrink-0" />
                    <div>
                      <p className="font-medium">For demonstration purposes</p>
                      <p className="mt-1">
                        This feature allows you to preview a locally generated
                        engagement letter for demonstration and feedback purposes
                        only.
                      </p>
                    </div>
                  </div>
                </div>

                <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full gap-2">
                      <FileSignature className="h-4 w-4" />
                      Generate Local Letter
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Generate Local Engagement Letter</DialogTitle>
                      <DialogDescription>
                        This is for demonstration purposes only and does not
                        replace the integrated workflow.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <div className="rounded-lg border p-4">
                        <h4 className="text-sm font-medium mb-2">
                          Demo letter will include:
                        </h4>
                        <ul className="text-sm space-y-1">
                          <li className="flex items-center">
                            <Check className="h-4 w-4 text-green-500 mr-2" />
                            Client information for {project.client_name}
                          </li>
                          <li className="flex items-center">
                            <Check className="h-4 w-4 text-green-500 mr-2" />
                            Service description: {project.service_type}
                          </li>
                          <li className="flex items-center">
                            <Check className="h-4 w-4 text-green-500 mr-2" />
                            Fee structure:{" "}
                            {formatCurrency(customFee || getServiceFee().basePrice)}
                          </li>
                          <li className="flex items-center">
                            <Check className="h-4 w-4 text-green-500 mr-2" />
                            Standard terms and conditions
                          </li>
                        </ul>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setGenerateDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={generateEngagementLetter} disabled={generating}>
                        {generating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          "Generate Demo Letter"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Standard Pricing Card */}
            <Card>
              <CardHeader>
                <CardTitle>Standard Pricing</CardTitle>
                <CardDescription>
                  Reference pricing for services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableCaption>Standard service pricing guide</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead className="text-right">Base Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {SERVICE_FEES.map((fee) => (
                      <TableRow key={fee.service}>
                        <TableCell>{fee.service}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(fee.basePrice)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <p className="text-xs text-muted-foreground mt-2">
                  Note: Actual pricing may vary based on client-specific factors
                  and complexity.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Project not found</p>
          </CardContent>
        </Card>
      )}

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Engagement Letter Status Details</DialogTitle>
            <DialogDescription>
              Current status in the external engagement letter software
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Current Status:</p>
              <p className="text-sm">
                {currentStatus === "pending"
                  ? "Awaiting Client View"
                  : currentStatus === "sent"
                  ? "Delivered to Client"
                  : currentStatus === "viewed"
                  ? "Viewed by Client"
                  : "Signed by Client"}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium">Data Sent Date:</p>
              <p className="text-sm">
                {project?.updated_at
                  ? new Date(project.updated_at).toLocaleDateString()
                  : "Unknown"}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium">Last Activity:</p>
              <p className="text-sm">
                {currentStatus === "pending"
                  ? "No activity yet"
                  : currentStatus === "sent"
                  ? "Email delivered on April 13, 2025"
                  : currentStatus === "viewed"
                  ? "Client viewed on April 14, 2025"
                  : "Client signed on April 15, 2025"}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium">Expiration Date:</p>
              <p className="text-sm">May 13, 2025 (30 days from send date)</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Wrapping the original component in a Suspense boundary to fix the error
export default function EngagementLetterPage() {
  return (
    <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin m-auto" />}>
      <EngagementLetterInner />
    </Suspense>
  );
}
