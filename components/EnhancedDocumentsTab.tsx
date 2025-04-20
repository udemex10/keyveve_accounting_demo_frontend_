/* EnhancedDocumentsTab.jsx - Improved version with service-specific document organization */

"use client";

import {
  FileText,
  UploadCloud,
  MoreHorizontal,
  Eye,
  Download,
  Archive,
  FolderPlus,
  Brain,
  HardDrive,
  Cloud,
  Database,
  FolderOpen,
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  MoveRight,
  Sparkles,
  Wand2,
  Info,
  ScanSearch,
  FilePlus2,
  FolderUp,
  Folders,
  Server,
  Check,
  X,
  ShieldCheck,
  FileSpreadsheet,
  Calculator,
  Calendar,
  Receipt,
  BarChart3,
  FileCheck,
  Users,
  Building,
  Landmark,
    MessageSquare
} from "lucide-react";

import { useState, useEffect } from "react";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const API = "https://keyveve-accounting-demo-backend.onrender.com";

const EnhancedDocumentsTab = ({ project }) => {
  const { toast } = useToast();

  /* ---------------------------------------------------------------------- */
  /*                                STATE                                   */
  /* ---------------------------------------------------------------------- */

  const [docs, setDocs] = useState(project?.docs ?? []);
  const [selectedStorage, setSelectedStorage] = useState("keyveve");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [processingStep, setProcessingStep] = useState(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const [folderView, setFolderView] = useState(false);
  const [showStorageOptions, setShowStorageOptions] = useState(false);
  const [analyzeComplete, setAnalyzeComplete] = useState(false);
  const [organizedDocs, setOrganizedDocs] = useState({});
  const [selectedFolder, setSelectedFolder] = useState(null);

  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);
  const [selectedTabInAnalysis, setSelectedTabInAnalysis] = useState("analysis");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  /* ---------------------------------------------------------------------- */
  /*                       SERVICE-SPECIFIC FOLDER STRUCTURES                */
  /* ---------------------------------------------------------------------- */

  // Enhanced folder structure based on service type
  const getDocumentFolders = (serviceType) => {
    // Base/common folders for all service types
    const commonFolders = ["Client Information", "Correspondence"];

    // Service-specific folder structures
    if (serviceType?.includes("Tax")) {
      if (serviceType?.includes("Individual")) {
        return [
          ...commonFolders,
          "Income Documents", // W-2, 1099s
          "Expense Documents", // Receipts, mortgage interest
          "Tax Forms", // Tax forms and worksheets
          "Prior Year Returns", // Previous tax filings
          "IRS Correspondence", // Communications with IRS
          "Deductions & Credits", // Charitable donations, education
          "Tax Planning", // Tax planning documents
          "Internal Workpapers" // Staff working documents
        ];
      } else if (serviceType?.includes("Business")) {
        return [
          ...commonFolders,
          "Financial Statements", // Balance sheets, income statements
          "Business Income", // Revenue documents
          "Business Expenses", // Expense receipts, reports
          "Asset Documentation", // Fixed assets, depreciation
          "Prior Year Returns", // Previous tax filings
          "Entity Documents", // Formation docs, operating agreements
          "Payroll Documents", // Payroll reports, W-2s, 1099s
          "Tax Forms", // Business tax forms
          "Tax Planning", // Tax planning documents
          "Internal Workpapers" // Staff working documents
        ];
      }
      // Generic tax if no specific type
      return [
        ...commonFolders,
        "Income Documents",
        "Expense Documents",
        "Tax Forms",
        "Prior Year Returns",
        "IRS Correspondence",
        "Deductions & Credits",
        "Internal Workpapers"
      ];
    }
    else if (serviceType?.includes("Audit")) {
      return [
        ...commonFolders,
        "Planning Documents", // Planning memos, engagement letters
        "Risk Assessment", // Risk assessment documentation
        "Internal Controls", // Internal control documentation
        "Financial Statements", // Client financial statements
        "Bank Documents", // Bank statements, reconciliations
        "Sampling Methodology", // Sampling approach documents
        "Audit Evidence", // Evidence collected during audit
        "Audit Findings", // Audit findings and exceptions
        "Management Responses", // Client responses to findings
        "Audit Report", // Final audit report documents
        "PBC Items", // Provided by client items
        "Workpapers" // Working papers
      ];
    }
    else if (serviceType?.includes("Bookkeeping") || serviceType?.includes("CAS")) {
      return [
        ...commonFolders,
        "Bank Statements", // Bank statements
        "Reconciliations", // Bank reconciliations
        "Invoices", // Sales invoices
        "Bills & Expenses", // Vendor bills and expense reports
        "Receipts", // Purchase receipts
        "Financial Reports", // Financial statements, reports
        "Payroll", // Payroll documents
        "Tax Filings", // Sales tax, payroll tax filings
        "Chart of Accounts", // COA and accounting structure docs
        "Journal Entries", // Journal entries documentation
        "Year-End Closings" // Year-end closing documents
      ];
    }
    else if (serviceType?.includes("Financial Planning")) {
      return [
        ...commonFolders,
        "Investment Statements", // Investment account statements
        "Retirement Accounts", // 401k, IRA documentation
        "Insurance Policies", // Insurance documentation
        "Estate Planning", // Wills, trusts, estate docs
        "Tax Returns", // Tax returns for planning
        "Financial Plans", // Financial planning documents
        "Cash Flow Analysis", // Cash flow projections
        "Goal Planning", // Goal-based planning docs
        "Risk Assessments" // Risk tolerance assessments
      ];
    }
    else if (serviceType?.includes("Advisory")) {
      return [
        ...commonFolders,
        "Business Assessment", // Business analysis documents
        "Financial Analysis", // Financial analysis documents
        "Strategic Planning", // Strategic planning documents
        "Market Research", // Market analysis, research
        "Process Improvement", // Process documentation
        "Valuation Documents", // Business valuation docs
        "Succession Planning", // Succession planning materials
        "Project Deliverables", // Final deliverables
        "Meeting Notes" // Advisory meeting notes
      ];
    }

    // Default folders if service type isn't recognized
    return [
      ...commonFolders,
      "Financial Documents",
      "Tax Documents",
      "Legal Documents",
      "Working Papers",
      "Reports & Analysis",
      "Miscellaneous"
    ];
  };

  // Get appropriate icon for folder
  const getFolderIcon = (folderName) => {
    switch (folderName) {
      case "Income Documents":
      case "Business Income":
        return <Receipt className="h-4 w-4 text-green-500" />;
      case "Expense Documents":
      case "Business Expenses":
        return <Calculator className="h-4 w-4 text-red-500" />;
      case "Tax Forms":
      case "Tax Filings":
        return <FileCheck className="h-4 w-4 text-blue-500" />;
      case "Prior Year Returns":
        return <FileText className="h-4 w-4 text-amber-500" />;
      case "Financial Statements":
      case "Financial Reports":
        return <BarChart3 className="h-4 w-4 text-purple-500" />;
      case "Bank Statements":
      case "Bank Documents":
        return <Landmark className="h-4 w-4 text-blue-500" />;
      case "Internal Controls":
      case "Risk Assessment":
        return <ShieldCheck className="h-4 w-4 text-red-500" />;
      case "Audit Evidence":
      case "Audit Findings":
        return <Check className="h-4 w-4 text-green-500" />;
      case "Planning Documents":
      case "Strategic Planning":
        return <Calendar className="h-4 w-4 text-cyan-500" />;
      case "Internal Workpapers":
      case "Workpapers":
        return <FileSpreadsheet className="h-4 w-4 text-amber-500" />;
      case "Client Information":
        return <Users className="h-4 w-4 text-violet-500" />;
      case "Correspondence":
        return <MessageSquare className="h-4 w-4 text-gray-500" />;
      default:
        return <FolderOpen className="h-4 w-4 text-primary" />;
    }
  };

  /* ---------------------------------------------------------------------- */
  /*                       DOCUMENT CATEGORY MAPPING                         */
  /* ---------------------------------------------------------------------- */

  // Enhanced mapping from doc types to folders based on service type
  const mapDocumentToFolder = (doc, serviceType) => {
    const docNameLower = doc.original_name?.toLowerCase() || "";
    const docTypeLower = doc.doc_type?.toLowerCase() || "";

    // Default to Client Information if we can't categorize it
    let targetFolder = "Client Information";

    if (serviceType?.includes("Tax")) {
      // Tax-specific mapping
      if (/w-?2|1099|income|earnings/i.test(docTypeLower) || /w-?2|1099|income|earnings/i.test(docNameLower)) {
        targetFolder = "Income Documents";
      }
      else if (/expense|receipt|deduction|1098|mortgage|donation|charitable/i.test(docTypeLower) ||
              /expense|receipt|deduction|1098|mortgage|donation|charitable/i.test(docNameLower)) {
        targetFolder = "Expense Documents";
      }
      else if (/form|schedule|worksheet|8829|8949|4562|tax form/i.test(docTypeLower) ||
              /form|schedule|worksheet|8829|8949|4562/i.test(docNameLower)) {
        targetFolder = "Tax Forms";
      }
      else if (/prior|previous|last year|1040|1065|1120|tax return/i.test(docTypeLower) ||
              /prior|previous|last year|1040|1065|1120/i.test(docNameLower)) {
        targetFolder = "Prior Year Returns";
      }
      else if (/irs|notice|letter|correspondence/i.test(docTypeLower) ||
              /irs|notice|letter|correspondence/i.test(docNameLower)) {
        targetFolder = "IRS Correspondence";
      }
      else if (/workpaper|worksheet|calculation|internal/i.test(docTypeLower) ||
              /workpaper|worksheet|calculation|internal/i.test(docNameLower)) {
        targetFolder = "Internal Workpapers";
      }
    }
    else if (serviceType?.includes("Audit")) {
      // Audit-specific mapping
      if (/planning|engagement letter|scope/i.test(docTypeLower) ||
          /planning|engagement letter|scope/i.test(docNameLower)) {
        targetFolder = "Planning Documents";
      }
      else if (/risk|assessment|materiality/i.test(docTypeLower) ||
              /risk|assessment|materiality/i.test(docNameLower)) {
        targetFolder = "Risk Assessment";
      }
      else if (/control|internal control|process/i.test(docTypeLower) ||
              /control|internal control|process/i.test(docNameLower)) {
        targetFolder = "Internal Controls";
      }
      else if (/financial statement|balance sheet|income statement|equity|cash flow/i.test(docTypeLower) ||
              /financial statement|balance sheet|income statement|equity|cash flow/i.test(docNameLower)) {
        targetFolder = "Financial Statements";
      }
      else if (/bank|statement|reconciliation/i.test(docTypeLower) ||
              /bank|statement|reconciliation/i.test(docNameLower)) {
        targetFolder = "Bank Documents";
      }
      else if (/sampling|sample size|selection/i.test(docTypeLower) ||
              /sampling|sample size|selection/i.test(docNameLower)) {
        targetFolder = "Sampling Methodology";
      }
      else if (/workpaper|supporting|evidence|documentation/i.test(docTypeLower) ||
              /workpaper|supporting|evidence|documentation/i.test(docNameLower)) {
        targetFolder = "Audit Evidence";
      }
      else if (/finding|exception|issue|observation/i.test(docTypeLower) ||
              /finding|exception|issue|observation/i.test(docNameLower)) {
        targetFolder = "Audit Findings";
      }
      else if (/management|response|remediation/i.test(docTypeLower) ||
              /management|response|remediation/i.test(docNameLower)) {
        targetFolder = "Management Responses";
      }
      else if (/report|opinion|final|conclusion/i.test(docTypeLower) ||
              /report|opinion|final|conclusion/i.test(docNameLower)) {
        targetFolder = "Audit Report";
      }
      else if (/pbc|provided by client|client provided/i.test(docTypeLower) ||
              /pbc|provided by client|client provided/i.test(docNameLower)) {
        targetFolder = "PBC Items";
      }
    }
    else if (serviceType?.includes("Bookkeeping") || serviceType?.includes("CAS")) {
      // Bookkeeping/CAS-specific mapping
      if (/bank|statement/i.test(docTypeLower) || /bank|statement/i.test(docNameLower)) {
        targetFolder = "Bank Statements";
      }
      else if (/reconciliation|recon/i.test(docTypeLower) || /reconciliation|recon/i.test(docNameLower)) {
        targetFolder = "Reconciliations";
      }
      else if (/invoice|billing|sale/i.test(docTypeLower) || /invoice|billing|sale/i.test(docNameLower)) {
        targetFolder = "Invoices";
      }
      else if (/bill|expense|vendor|payment/i.test(docTypeLower) ||
              /bill|expense|vendor|payment/i.test(docNameLower)) {
        targetFolder = "Bills & Expenses";
      }
      else if (/receipt|purchase/i.test(docTypeLower) || /receipt|purchase/i.test(docNameLower)) {
        targetFolder = "Receipts";
      }
      else if (/report|financial|statement|balance sheet|income|p&l/i.test(docTypeLower) ||
              /report|financial|statement|balance sheet|income|p&l/i.test(docNameLower)) {
        targetFolder = "Financial Reports";
      }
      else if (/payroll|salary|wage|employee/i.test(docTypeLower) ||
              /payroll|salary|wage|employee/i.test(docNameLower)) {
        targetFolder = "Payroll";
      }
      else if (/tax filing|sales tax|payroll tax/i.test(docTypeLower) ||
              /tax filing|sales tax|payroll tax/i.test(docNameLower)) {
        targetFolder = "Tax Filings";
      }
      else if (/chart of accounts|coa|account/i.test(docTypeLower) ||
              /chart of accounts|coa|account/i.test(docNameLower)) {
        targetFolder = "Chart of Accounts";
      }
      else if (/journal|entry|adjustment|je/i.test(docTypeLower) ||
              /journal|entry|adjustment|je/i.test(docNameLower)) {
        targetFolder = "Journal Entries";
      }
      else if (/year.?end|closing|closing entry/i.test(docTypeLower) ||
              /year.?end|closing|closing entry/i.test(docNameLower)) {
        targetFolder = "Year-End Closings";
      }
    }

    return targetFolder;
  };

  // Re‑organize whenever docs or completion flag change
  useEffect(() => {
    if (!analyzeComplete) return;

    const folders = getDocumentFolders(project.service_type);
    const organized = {};
    folders.forEach((f) => (organized[f] = []));

    docs.forEach((doc) => {
      const targetFolder = mapDocumentToFolder(doc, project.service_type);

      // Make sure the folder exists, otherwise put in Client Information
      if (organized[targetFolder]) {
        organized[targetFolder].push(doc);
      } else {
        organized["Client Information"].push(doc);
      }
    });

    setOrganizedDocs(organized);
  }, [docs, analyzeComplete, project.service_type]);

  /* ---------------------------------------------------------------------- */
  /*                      AI ANALYZE / TITLE‑GENERATION FLOW                */
  /* ---------------------------------------------------------------------- */

  const runAnalysis = () => {
    setShowAnalysisDialog(true);
    setIsAnalyzing(true);
    setProcessingStep("preparing");
    setProcessingProgress(0);

    const advance = (step, pct, delay) =>
      setTimeout(() => {
        setProcessingStep(step);
        setProcessingProgress(pct);
      }, delay);

    advance("scanning", 15, 1200);
    advance("classifying", 45, 3800);
    advance("organizing", 70, 6800);
    advance("renaming", 85, 8800);

    // Finish, call backend
    setTimeout(async () => {
      try {
        await axios.post(`${API}/documents/organize/${project.id}`);
        const { data } = await axios.get(`${API}/documents/${project.id}`);

        // Transform to add service-specific folder
        const transformedData = data.map(doc => ({
          ...doc,
          folder: mapDocumentToFolder(doc, project.service_type)
        }));

        setDocs(transformedData);
        setProcessingStep("complete");
        setProcessingProgress(100);
        setAnalyzeComplete(true);
        setFolderView(true);

        toast({
          title: "Analysis complete",
          description: `${data.length} documents classified and organized for ${project.service_type} workflow.`,
        });
      } catch (e) {
        toast({
          variant: "destructive",
          title: "Error during analysis",
          description: "See console for details.",
        });
        console.error(e);
      } finally {
        setIsAnalyzing(false);
        setTimeout(() => setShowAnalysisDialog(false), 1800);
      }
    }, 10800);
  };

  /* ----------------------- accept / dismiss AI name --------------------- */

  const handleTitleChoice = async (doc, accept) => {
    // 1. pick the name we want
    const newName = accept ? doc.suggested_name : doc.original_name;

    // 2. build a URL‑encoded form body
    const form = new URLSearchParams();
    form.append("new_name", newName);

    // 3. PATCH with that form body
    await axios.patch(`${API}/documents/rename/${doc.doc_id}`, form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    // 4. update local state/UI
    setDocs(prev =>
      prev.map(d =>
        d.doc_id === doc.doc_id ? { ...d, final_name: newName } : d
      )
    );

    toast({
      title: accept ? "Title accepted" : "Suggestion dismissed",
    });
  };

  /* ----------------------------- status update -------------------------- */

  const setDocStatus = async (doc, status) => {
    await axios.patch(`${API}/documents/${doc.doc_id}`, { status });
    setDocs((prev) =>
      prev.map((d) => (d.doc_id === doc.doc_id ? { ...d, status } : d))
    );
  };

  /* ----------------------------- document upload ----------------------- */

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadingFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!uploadingFile) return;

    setUploadProgress(0);

    const formData = new FormData();
    formData.append("project_id", project.id);
    formData.append("file", uploadingFile);
    formData.append("process_async", "true");
    formData.append("storage_location", selectedStorage);
    formData.append("doc_category", "client");

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 5;
        });
      }, 300);

      // Actual upload
      const response = await axios.post(`${API}/documents/upload`, formData);

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Add the newly uploaded document to our list
      const newDoc = {
        ...response.data,
        folder: mapDocumentToFolder(response.data, project.service_type)
      };

      setDocs(prev => [...prev, newDoc]);

      setTimeout(() => {
        setShowUploadDialog(false);
        setUploadingFile(null);
        setUploadProgress(0);

        toast({
          title: "Document uploaded",
          description: "Your document has been uploaded and is being processed.",
        });
      }, 1000);

    } catch (error) {
      console.error("Error uploading document:", error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "There was an error uploading your document.",
      });
    }
  };

  /* ---------------------------------------------------------------------- */
  /*                       STORAGE & BADGE HELPERS                          */
  /* ---------------------------------------------------------------------- */

  const getStorageIcon = (s) =>
    s === "keyveve" ? (
      <HardDrive className="h-4 w-4" />
    ) : s === "cch_document_storage" ? (
      <Database className="h-4 w-4" />
    ) : s === "sharepoint" ? (
      <Server className="h-4 w-4" />
    ) : (
      <Cloud className="h-4 w-4" />
    );

  const storageBadge = (loc) => {
    switch (loc) {
      case "cloud":
        return <Badge variant="outline" className="bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400">Cloud</Badge>;
      case "sharepoint":
        return <Badge variant="outline" className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">SharePoint</Badge>;
      case "cch_document_storage":
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">CCH</Badge>;
      case "keyveve_storage":
        return <Badge variant="outline" className="bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400">Keyveve</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const categoryBadge = (cat) => {
    switch (cat) {
      case "client":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Client</Badge>;
      case "internal":
        return <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">Internal</Badge>;
      case "permanent":
        return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Permanent</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const statusBadge = (st) => {
    switch (st) {
      case "awaiting_review":
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">Awaiting Review</Badge>;
      case "reviewed":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Reviewed</Badge>;
      case "signed":
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">Signed</Badge>;
      case "filed":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Filed</Badge>;
      default:
        return <Badge>—</Badge>;
    }
  };

  /* ---------------------------------------------------------------------- */
  /*                           RENDERERS (LIST & FOLDER VIEW)               */
  /* ---------------------------------------------------------------------- */

  // Filter docs by search term
  const filteredDocs = searchTerm
    ? docs.filter(doc =>
        doc.original_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.doc_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.extracted_data?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : docs;

  const DocCard = ({ doc }) => (
    <Card key={doc.doc_id}>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          {/* left column */}
          <div className="flex space-x-3">
            <div className="p-2 rounded-md bg-muted">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-1">
              <h4 className="font-medium break-all">
                {doc.final_name ?? doc.original_name}
              </h4>
              <p className="text-sm text-muted-foreground">{doc.doc_type}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{doc.extracted_data}</p>
              <div className="flex flex-wrap gap-1">
                {categoryBadge(doc.doc_category)}
                {storageBadge(doc.storage_location)}
                {statusBadge(doc.status)}
              </div>

              {/* AI suggested title */}
              {doc.suggested_name && !doc.final_name && (
                <div className="text-xs mt-1 flex items-center gap-1 flex-wrap">
                  <Sparkles className="h-3 w-3 text-primary" />
                  Suggested:&nbsp;<em>{doc.suggested_name}</em>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-5 w-5"
                    onClick={() => handleTitleChoice(doc, true)}
                    title="Accept"
                  >
                    <Check className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-5 w-5"
                    onClick={() => handleTitleChoice(doc, false)}
                    title="Dismiss"
                  >
                    <X className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* right controls */}
          <div className="flex flex-col items-end gap-2">
            {/* status dropdown */}
            <Select
              value={doc.status ?? undefined}
              onValueChange={(v) => setDocStatus(doc, v)}
            >
              <SelectTrigger className="w-[118px] h-8 text-xs">
                <SelectValue placeholder="Set status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="awaiting_review">Awaiting review</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="signed">Signed</SelectItem>
                <SelectItem value="filed">Filed</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t pt-2 flex gap-3 justify-end">
        <Button variant="ghost" size="sm" className="gap-1 h-7 text-xs">
          <Eye className="h-3 w-3" />
          View
        </Button>
        <Button variant="ghost" size="sm" className="gap-1 h-7 text-xs">
          <Download className="h-3 w-3" />
          Download
        </Button>
        <Button variant="ghost" size="sm" className="gap-1 h-7 text-xs">
          <Archive className="h-3 w-3" />
          Archive
        </Button>
      </CardFooter>
    </Card>
  );

  /* ---------------------------------------------------------------------- */
  /*                           ANALYSIS DIALOG UI                           */
  /* ---------------------------------------------------------------------- */

  const renderAnalysisDialogContent = () => {
    const getStepIcon = (step) => {
      switch (step) {
        case "preparing":
          return <Loader2 className="h-5 w-5 animate-spin text-amber-500" />;
        case "scanning":
          return <ScanSearch className="h-5 w-5 text-blue-500" />;
        case "classifying":
          return <FilePlus2 className="h-5 w-5 text-purple-500" />;
        case "organizing":
          return <FolderUp className="h-5 w-5 text-indigo-500" />;
        case "renaming":
          return <MoveRight className="h-5 w-5 text-pink-500" />;
        case "complete":
          return <CheckCircle2 className="h-5 w-5 text-green-500" />;
        default:
          return <Info className="h-5 w-5" />;
      }
    };

    const getStepDescription = () => {
      switch (processingStep) {
        case "preparing":
          return "Preparing document analysis…";
        case "scanning":
          return "Scanning documents for extractable data…";
        case "classifying":
          return `Classifying documents by type and content for ${project.service_type} workflow…`;
        case "organizing":
          return `Organizing documents into ${project.service_type}-specific folder structure…`;
        case "renaming":
          return "Generating descriptive file names…";
        case "complete":
          return "Analysis complete! Documents have been processed successfully.";
        default:
          return "Waiting to start analysis…";
      }
    };

    const detailLine = (text, muted = false) => (
      <p className={`pl-4 ${muted ? "text-muted-foreground" : "text-green-500"}`}>{text}</p>
    );

    return (
      <div className="space-y-6">
        <Tabs value={selectedTabInAnalysis} onValueChange={setSelectedTabInAnalysis}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="analysis">Analysis Progress</TabsTrigger>
            <TabsTrigger value="details">Technical Details</TabsTrigger>
          </TabsList>

          {/* ------------ ANALYSIS PROGRESS ---------- */}
          <TabsContent value="analysis" className="space-y-4 mt-4">
            <div className="space-y-6">
              <div className="space-y-2">
                <Progress value={processingProgress} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Processing documents for {project.service_type} workflow</span>
                  <span>{processingProgress}%</span>
                </div>
              </div>

              {[
                ["Preparing document analysis", "preparing"],
                ["Scanning document content", "scanning"],
                ["Classifying documents", "classifying"],
                ["Organizing into folders", "organizing"],
                ["Generating file names", "renaming"],
                ["Processing complete", "complete"],
              ].map(([label, key]) => (
                <div
                  key={key}
                  className={`flex items-start space-x-3 ${
                    processingStep === key ||
                    (processingStep && ["scanning","classifying","organizing","renaming","complete"].includes(key) &&
                      ["scanning","classifying","organizing","renaming","complete"].indexOf(processingStep) >
                        ["scanning","classifying","organizing","renaming","complete"].indexOf(key))
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {processingStep === key ? (
                    <Loader2 className="h-5 w-5 mt-0.5 animate-spin" />
                  ) : ["preparing","scanning","classifying","organizing","renaming","complete"].indexOf(processingStep) >
                    ["preparing","scanning","classifying","organizing","renaming","complete"].indexOf(key) ? (
                    <CheckCircle2 className="h-5 w-5 mt-0.5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 mt-0.5 text-muted" />
                  )}
                  <div>
                    <p className="font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">
                      {key === "preparing"
                        ? "Setting up AI analysis environment"
                        : key === "scanning"
                        ? "Extracting text and data from documents"
                        : key === "classifying"
                        ? `Identifying document types for ${project.service_type} workflow`
                        : key === "organizing"
                        ? `Creating optimal ${project.service_type}-specific folder structure`
                        : key === "renaming"
                        ? "Suggesting clean, descriptive file titles"
                        : "Documents analyzed and ready for review"}
                    </p>
                  </div>
                </div>
              ))}

              <div className="rounded-lg p-4 border bg-muted/30">
                <div className="flex items-start space-x-3">
                  {getStepIcon(processingStep)}
                  <div>
                    <p className="font-medium">
                      {processingStep === "complete" ? "Analysis Complete" : "Current Status"}
                    </p>
                    <p className="text-sm text-muted-foreground">{getStepDescription()}</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ------------- TECH DETAILS -------------- */}
          <TabsContent value="details" className="space-y-4 mt-4">
            <ScrollArea className="h-[300px]">
              <div className="space-y-4 text-xs font-mono">
                {/* always show boot lines */}
                <div className="space-y-1">
                  {detailLine("> Initializing AI document processing pipeline…")}
                  {detailLine("Loading document OCR module…", true)}
                  {detailLine("Loading classification model…", true)}
                  {detailLine(`Loading ${project.service_type} document schema…`, true)}
                  {detailLine("Loading entity extraction model…", true)}
                  {detailLine("Ready for analysis.", true)}
                </div>

                {["scanning","classifying","organizing","renaming","complete"].includes(processingStep) && (
                  <div className="space-y-1">
                    {detailLine(`> Processing document 1 of ${docs.length}…`)}
                    {detailLine("Extracting text content…", true)}
                    {detailLine("Found 123 words, 15 paragraphs", true)}
                  </div>
                )}

                {["classifying","organizing","renaming","complete"].includes(processingStep) && (
                  <div className="space-y-1">
                    {detailLine(`> Running AI classification for ${project.service_type} workflow…`)}
                    {detailLine("Detected document type: Tax Form", true)}
                    {detailLine("Confidence: 98.2%", true)}
                    {detailLine(`Service type context: ${project.service_type}`, true)}
                  </div>
                )}

                {["organizing","renaming","complete"].includes(processingStep) && (
                  <div className="space-y-1">
                    {detailLine("> Organizing documents into service-specific folders…")}
                    {detailLine(`Analyzing project type: ${project.service_type}`, true)}
                    {detailLine(`Creating ${getDocumentFolders(project.service_type).length} service-specific folders`, true)}
                    {detailLine("Folder organization complete.", true)}
                  </div>
                )}

                {["renaming","complete"].includes(processingStep) && (
                  <div className="space-y-1">
                    {detailLine("> Generating descriptive file names…")}
                    {detailLine(`Using ${project.service_type}-specific naming convention`, true)}
                    {detailLine("Slugging client + year + doc‑type", true)}
                  </div>
                )}

                {processingStep === "complete" && (
                  <div className="space-y-1">
                    {detailLine("> Finalizing document processing…")}
                    {detailLine(`Processed ${docs.length} documents successfully.`, true)}
                    {detailLine(`Created ${getDocumentFolders(project.service_type).length} service-specific folders for ${project.service_type} workflow`, true)}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  /* ---------------------------------------------------------------------- */
  /*                                UI MAIN                                 */
  /* ---------------------------------------------------------------------- */

  return (
    <>
      {/* header row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {project.service_type} Documents
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage documents with AI-powered organization customized for {project.service_type} workflow
          </p>
        </div>

        <div className="flex gap-2 flex-wrap md:flex-nowrap">
          {/* Search box */}
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-9 w-full md:w-[200px]"
            />
          </div>

          {/* storage selector */}
          <Dialog open={showStorageOptions} onOpenChange={setShowStorageOptions}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2" disabled={!analyzeComplete}>
                {getStorageIcon(selectedStorage)}
                Send to Storage
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Select Document Storage</DialogTitle>
                <DialogDescription>
                  Choose where to store the organized documents
                </DialogDescription>
              </DialogHeader>

              {["keyveve_storage", "cch_document_storage", "sharepoint", "cloud"].map((s) => (
                <Button
                  key={s}
                  variant={selectedStorage === s ? "default" : "outline"}
                  className="justify-start gap-3 h-auto py-3 mb-2"
                  onClick={() => {
                    setSelectedStorage(s);
                    setShowStorageOptions(false);
                    toast({
                      title: "Sending to storage",
                      description: `Documents are being sent to ${s === "keyveve_storage" ? "Keyveve Storage" : 
                                                                 s === "cch_document_storage" ? "CCH Document Storage" :
                                                                 s === "sharepoint" ? "SharePoint" : "Cloud Storage"}.`,
                    });
                    setTimeout(() => {
                      toast({
                        title: "Storage complete",
                        description: "Documents have been stored successfully.",
                      });
                    }, 1800);
                  }}
                >
                  {getStorageIcon(s)}
                  {s === "keyveve_storage"
                    ? "Keyveve Storage"
                    : s === "cch_document_storage"
                    ? "CCH Document Storage"
                    : s === "sharepoint"
                    ? "SharePoint"
                    : "Cloud Storage"}
                </Button>
              ))}

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowStorageOptions(false)}>
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* analyze button */}
          <Button
            size="sm"
            className="gap-2"
            onClick={runAnalysis}
            disabled={isAnalyzing || analyzeComplete}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing…
              </>
            ) : analyzeComplete ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Done
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                Analyze + Title
              </>
            )}
          </Button>

          {/* toggle list / folder */}
          <Button
            size="sm"
            variant={folderView ? "default" : "outline"}
            onClick={() => setFolderView((v) => !v)}
            disabled={!analyzeComplete}
            className="gap-2"
          >
            {folderView ? (
              <>
                <Folders className="h-4 w-4" />
                Folders
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                List
              </>
            )}
          </Button>

          {/* upload placeholder */}
          <Button size="sm" className="gap-2" onClick={() => setShowUploadDialog(true)}>
            <UploadCloud className="h-4 w-4" />
            Upload
          </Button>
        </div>
      </div>

      {/* helper banners */}
      {!analyzeComplete && !isAnalyzing && (
        <Alert className="my-4 bg-primary/5 border-primary/20">
          <Sparkles className="h-4 w-4 text-primary" />
          <AlertTitle>AI Document Automation for {project.service_type}</AlertTitle>
          <AlertDescription>
            Click <em>Analyze + Title</em> to automatically classify, organize into {project.service_type}-specific folders, and rename all documents.
          </AlertDescription>
        </Alert>
      )}

      {analyzeComplete && (
        <Alert className="my-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <ShieldCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle className="text-green-800 dark:text-green-300">
            Documents ready for {project.service_type} workflow
          </AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-400">
            Review AI suggestions, update statuses, then send everything to your selected storage.
          </AlertDescription>
        </Alert>
      )}

      {/* folder navigation sidebar when folder view is active */}
      {folderView && analyzeComplete ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Folder sidebar */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Folders className="h-4 w-4 text-primary" />
              {project.service_type} Folders
            </h4>
            <div className="rounded-md border overflow-hidden">
              <ScrollArea className="h-[calc(100vh-320px)] max-h-[600px]">
                <div className="p-2">
                  {Object.entries(organizedDocs).map(([folder, docs]) => (
                    <Button
                      key={folder}
                      variant={selectedFolder === folder ? "default" : "ghost"}
                      className="w-full justify-start gap-2 mb-1 font-normal"
                      onClick={() => setSelectedFolder(folder)}
                    >
                      {getFolderIcon(folder)}
                      <span className="truncate">{folder}</span>
                      <Badge variant="outline" className="ml-auto">{docs.length}</Badge>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Document list */}
          <div className="md:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm flex items-center gap-2">
                {selectedFolder ? (
                  <>
                    {getFolderIcon(selectedFolder)}
                    <span>{selectedFolder}</span>
                    <Badge>{organizedDocs[selectedFolder]?.length || 0} documents</Badge>
                  </>
                ) : (
                  <>
                    <Folders className="h-4 w-4 text-primary" />
                    <span>All Documents</span>
                    <Badge>{docs.length} documents</Badge>
                  </>
                )}
              </h4>

              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => setSelectedFolder(null)}
                disabled={!selectedFolder}
              >
                <Folders className="h-3 w-3" />
                Show All
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {selectedFolder
                ? organizedDocs[selectedFolder]?.map(doc => <DocCard key={doc.doc_id} doc={doc} />)
                : filteredDocs.map(doc => <DocCard key={doc.doc_id} doc={doc} />)}

              {selectedFolder && organizedDocs[selectedFolder]?.length === 0 && (
                <div className="text-center p-8 text-muted-foreground">
                  No documents in this folder
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // List view
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDocs.length > 0 ? (
            filteredDocs.map((d) => (
              <DocCard key={d.doc_id} doc={d} />
            ))
          ) : (
            <div className="md:col-span-2 text-center p-8 text-muted-foreground border rounded-lg">
              {searchTerm ? "No documents match your search" : "No documents found"}
            </div>
          )}
        </div>
      )}

      {/* Analysis dialog */}
      <Dialog open={showAnalysisDialog} onOpenChange={setShowAnalysisDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              AI Document Processing for {project.service_type}
            </DialogTitle>
            <DialogDescription>
              Analyzing {docs.length} document{docs.length !== 1 ? "s" : ""} for {project.client_name}'s {project.service_type} project
            </DialogDescription>
          </DialogHeader>

          {renderAnalysisDialogContent()}

          <DialogFooter>
            <Button
              variant={processingStep === "complete" ? "default" : "outline"}
              disabled={processingStep !== "complete"}
              onClick={() => setShowAnalysisDialog(false)}
            >
              {processingStep === "complete" ? "Close" : "Cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-primary" />
              Upload Document
            </DialogTitle>
            <DialogDescription>
              Upload a document for {project.client_name}'s {project.service_type} project
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center">
              <UploadCloud className="h-10 w-10 text-muted-foreground mb-3" />

              {uploadingFile ? (
                <div className="space-y-2 w-full">
                  <p className="font-medium">{uploadingFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {uploadingFile.size} bytes
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setUploadingFile(null)}
                    className="mt-2"
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <>
                  <p className="font-medium mb-1">Drag and drop a file here</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Or click to browse files
                  </p>
                  <Label htmlFor="document-upload" className="cursor-pointer">
                    <div className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium">
                      Select File
                    </div>
                    <Input
                      id="document-upload"
                      type="file"
                      className="sr-only"
                      onChange={handleFileSelect}
                    />
                  </Label>
                </>
              )}
            </div>

            {uploadingFile && uploadProgress > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            <div className="space-y-2">
              <Label>Storage Location</Label>
              <Select
                value={selectedStorage}
                onValueChange={setSelectedStorage}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="keyveve_storage">Keyveve Storage</SelectItem>
                  <SelectItem value="cch_document_storage">CCH Document Storage</SelectItem>
                  <SelectItem value="sharepoint">SharePoint</SelectItem>
                  <SelectItem value="cloud">Cloud Storage</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select where to store this document
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!uploadingFile || uploadProgress > 0}
              className="gap-2"
            >
              {uploadProgress > 0 && uploadProgress < 100 ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EnhancedDocumentsTab;