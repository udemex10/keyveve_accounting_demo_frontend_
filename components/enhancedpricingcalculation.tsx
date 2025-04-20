"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import {
  Calculator,
  Loader2,
  FileText,
  DollarSign,
  Brain,
  BarChart3,
  Percent,
  ChevronRight,
  Database,
  Check,
  ArrowRight,
  FileSignature,
  CornerDownRight,
  Maximize2,
  Paperclip,
  RefreshCw,
  AlertCircle,
  ExternalLink
} from "lucide-react";

const API_BASE_URL = "http://localhost:8000";

// Default project structure for when project is undefined
const defaultProject = {
  id: "",
  service_type: "",
  docs: []
};

// The main EnhancedPricingCalculation component
// Expects a "project" prop and an optional "onCalculationComplete" callback
export default function EnhancedPricingCalculation({
  project,
  onCalculationComplete,
  onSendToEngagementLetter
}: {
  project: any;
  onCalculationComplete?: (priceData: any) => void;
  onSendToEngagementLetter?: (data: any) => void;
}) {
  // Check if project is undefined and show a message if it is
  if (!project) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <AlertCircle className="h-8 w-8 mb-2 text-amber-500" />
          <h3 className="font-medium">No project data available</h3>
          <p className="text-sm text-muted-foreground">
            Please select a project first or check if the project ID is valid.
          </p>
        </CardContent>
      </Card>
    );
  }

  // State hooks
  const [calculating, setCalculating] = useState(false);
  const [price, setPrice] = useState<any>(null);
  const [manualPrice, setManualPrice] = useState("");
  const [analysisStage, setAnalysisStage] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [documentAnalysis, setDocumentAnalysis] = useState<any>({});
  const [complexityFactors, setComplexityFactors] = useState({
    clientComplexity: 0,
    documentComplexity: 0,
    timeConstraint: 0,
    industryRisk: 0,
    specialExpertise: 0
  });
  const [showOptionalNotice, setShowOptionalNotice] = useState(true);
  const [activeTab, setActiveTab] = useState("basic");
  const [sendingToEngagementLetter, setSendingToEngagementLetter] = useState(false);
  const [engagementLetterSent, setEngagementLetterSent] = useState(false);
  const { toast } = useToast();

  // The text for each stage of analysis
  const analysisStages = [
    "Initializing analysis",
    "Analyzing document complexity",
    "Scanning historical pricing data",
    "Evaluating time requirements",
    "Determining client complexity",
    "Calculating service-specific factors",
    "Generating pricing recommendation"
  ];

  // Simulated document analysis that provides visual feedback
  useEffect(() => {
    if (calculating && analysisStage > 0) {
      // Simulate progress for current stage
      const timer = setInterval(() => {
        setAnalysisProgress((prevProgress) => {
          const newProgress = prevProgress + (4 + Math.random() * 8);
          if (newProgress >= 100) {
            clearInterval(timer);
            // Move to next stage after a short delay
            setTimeout(() => {
              setAnalysisStage((prevStage) => {
                const nextStage = prevStage + 1;
                if (nextStage >= analysisStages.length) {
                  // Analysis complete
                  fetchPriceRecommendation();
                  return prevStage;
                }
                setAnalysisProgress(0);
                return nextStage;
              });
            }, 500);
            return 100;
          }
          return newProgress;
        });
      }, 100);

      // Create document analysis visualization
      if (analysisStage === 1 && Object.keys(documentAnalysis).length === 0) {
        // Simulate document analysis results
        const analysis: any = {};
        if (project.docs && Array.isArray(project.docs)) {
          project.docs.forEach((doc: any) => {
            analysis[doc.doc_id] = {
              complexityScore: (Math.random() * 0.8 + 0.2).toFixed(2),
              timeMultiplier: (Math.random() * 0.5 + 0.8).toFixed(2),
              priorityLevel: Math.floor(Math.random() * 3) + 1
            };
          });
        }
        setDocumentAnalysis(analysis);
      }

      return () => clearInterval(timer);
    }
  }, [calculating, analysisStage, project.docs, documentAnalysis]);

  // Actual API call to get pricing recommendation
  const fetchPriceRecommendation = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/pricing/`, {
        project_id: project.id,
        complexity_factors: {
          client_complexity: complexityFactors.clientComplexity,
          document_complexity: complexityFactors.documentComplexity,
          time_constraint: complexityFactors.timeConstraint,
          industry_risk: complexityFactors.industryRisk,
          special_expertise: complexityFactors.specialExpertise
        }
      });

      setPrice(response.data);
      setManualPrice(response.data.suggested_price.toFixed(2));
      setCalculating(false);

      if (onCalculationComplete) {
        onCalculationComplete(response.data);
      }
    } catch (error) {
      console.error("Error calculating price:", error);
      setCalculating(false);
    }
  };

  // Begin the AI-driven price calculation
  const calculatePrice = () => {
    setCalculating(true);
    setAnalysisStage(1);
    setAnalysisProgress(0);
    setPrice(null);
  };

  // Format currency for display
  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(numValue)) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(numValue);
  };

  // Handle sending to engagement letter software
  const handleSendToEngagementLetter = async () => {
    setSendingToEngagementLetter(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const dataToBeSent = {
        project_id: project.id,
        client_name: project.client_name,
        service_type: project.service_type,
        price: manualPrice || (price ? price.suggested_price : null),
        docs: project.docs ? project.docs.length : 0
      };

      // Call the onSendToEngagementLetter callback if provided
      if (onSendToEngagementLetter) {
        onSendToEngagementLetter(dataToBeSent);
      }

      setEngagementLetterSent(true);
      toast({
        title: "Success!",
        description: "Project data sent to engagement letter software.",
      });
    } catch (error) {
      console.error("Error sending to engagement letter software:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not send data to engagement letter software. Please try again.",
      });
    } finally {
      setSendingToEngagementLetter(false);
    }
  };

  // Render document analysis card
  const renderDocumentAnalysisCard = () => {
    if (!calculating || analysisStage < 1 || analysisStage > 2) return null;

    return (
      <Card className="border-dashed border-primary/20 mb-4 overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center">
            <FileText className="h-4 w-4 mr-2 text-primary" />
            Document Analysis in Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="space-y-1">
            {project.docs && project.docs.map((doc: any) => (
              <div key={doc.doc_id} className="flex items-center">
                <div className="w-4 h-4 flex-shrink-0 mr-2">
                  {documentAnalysis[doc.doc_id] ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <RefreshCw
                      className={`h-4 w-4 text-amber-500 ${
                        calculating ? "animate-spin" : ""
                      }`}
                    />
                  )}
                </div>
                <div className="text-xs truncate flex-grow">
                  {doc.original_name}{" "}
                  <span className="text-muted-foreground">({doc.doc_type})</span>
                </div>
                {documentAnalysis[doc.doc_id] && (
                  <div className="flex items-center text-xs">
                    <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs mr-1">
                      {documentAnalysis[doc.doc_id].complexityScore}x
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render client factor analysis card
  const renderClientAnalysisCard = () => {
    if (!calculating || analysisStage < 3 || analysisStage > 4) return null;

    return (
      <Card className="border-dashed border-primary/20 mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center">
            <Database className="h-4 w-4 mr-2 text-primary" />
            Client Data Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="w-4 h-4 flex-shrink-0 mr-2">
                <Check className="h-4 w-4 text-green-500" />
              </div>
              <div className="text-xs flex-grow">Historical client data</div>
              <Badge variant="outline" className="text-xs">
                Medium complexity
              </Badge>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 flex-shrink-0 mr-2">
                <Check className="h-4 w-4 text-green-500" />
              </div>
              <div className="text-xs flex-grow">Previous service history</div>
              <Badge variant="outline" className="text-xs">
                3 years
              </Badge>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 flex-shrink-0 mr-2">
                <RefreshCw className="h-4 w-4 text-amber-500 animate-spin" />
              </div>
              <div className="text-xs flex-grow">Industry benchmarking</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render AI analysis visualization
  const renderAnalysisVisualization = () => {
    if (!calculating) return null;

    return (
      <div className="space-y-4 mb-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Brain className="h-5 w-5 mr-2 text-primary" />
              <span className="text-sm font-medium">AI Pricing Analysis</span>
            </div>
            <span className="text-xs text-muted-foreground">
              Stage {analysisStage} of {analysisStages.length - 1}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span>{analysisStages[analysisStage]}</span>
              <span>{Math.round(analysisProgress)}%</span>
            </div>
            <Progress value={analysisProgress} className="h-2" />
          </div>
        </div>

        {renderDocumentAnalysisCard()}
        {renderClientAnalysisCard()}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {showOptionalNotice && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 p-3 text-amber-800 dark:text-amber-300 mb-4 flex items-start space-x-2">
          <AlertCircle className="h-5 w-5 mt-0.5 text-amber-500 flex-shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Optional Pricing Analysis</p>
            <p className="text-xs">
              This AI-powered pricing analysis is optional. You can use it to
              get a recommended price based on project complexity, or you can
              set your own price manually without running the analysis.
            </p>
            <div className="flex gap-2 mt-1">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:text-amber-400"
                onClick={() => setShowOptionalNotice(false)}
              >
                Dismiss
              </Button>
              <Link href={`/staff/letter?project_id=${project.id}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 flex items-center gap-1"
                >
                  <FileSignature className="h-3 w-3" />
                  Skip to Engagement Letter
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="h-5 w-5 mr-2 text-primary" />
            AI-Powered Pricing Recommendation
          </CardTitle>
          <CardDescription>
            Calculate a recommended price based on project details, document
            complexity, and client factors.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Document count and basic info */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Project Information</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Service Type</Label>
                <div className="flex items-center">
                  <Badge className="mr-2">{project.service_type}</Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Documents</Label>
                <div className="flex items-center">
                  <div className="p-1.5 rounded-md bg-primary/10 mr-2">
                    <Paperclip className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-medium">
                    {project.docs ? project.docs.length : 0}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1.5">
                    document
                    {project.docs && project.docs.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Complexity factors tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="basic">Basic Factors</TabsTrigger>
              <TabsTrigger value="advanced">Advanced Factors</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 pt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="clientComplexity">Client Complexity</Label>
                    <span className="text-sm text-muted-foreground">
                      {complexityFactors.clientComplexity.toFixed(1)}
                    </span>
                  </div>
                  <Slider
                    id="clientComplexity"
                    min={0}
                    max={1}
                    step={0.1}
                    value={[complexityFactors.clientComplexity]}
                    onValueChange={(value) =>
                      setComplexityFactors({
                        ...complexityFactors,
                        clientComplexity: value[0]
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Higher values for complex client situations (multiple
                    entities, international, etc.)
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="documentComplexity">
                      Document Complexity
                    </Label>
                    <span className="text-sm text-muted-foreground">
                      {complexityFactors.documentComplexity.toFixed(1)}
                    </span>
                  </div>
                  <Slider
                    id="documentComplexity"
                    min={0}
                    max={1}
                    step={0.1}
                    value={[complexityFactors.documentComplexity]}
                    onValueChange={(value) =>
                      setComplexityFactors({
                        ...complexityFactors,
                        documentComplexity: value[0]
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Higher values for complex or unusual document types
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4 pt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="timeConstraint">Time Constraint</Label>
                    <span className="text-sm text-muted-foreground">
                      {complexityFactors.timeConstraint.toFixed(1)}
                    </span>
                  </div>
                  <Slider
                    id="timeConstraint"
                    min={0}
                    max={1}
                    step={0.1}
                    value={[complexityFactors.timeConstraint]}
                    onValueChange={(value) =>
                      setComplexityFactors({
                        ...complexityFactors,
                        timeConstraint: value[0]
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Higher values for rush jobs or tight deadlines
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="industryRisk">Industry Risk</Label>
                    <span className="text-sm text-muted-foreground">
                      {complexityFactors.industryRisk.toFixed(1)}
                    </span>
                  </div>
                  <Slider
                    id="industryRisk"
                    min={0}
                    max={1}
                    step={0.1}
                    value={[complexityFactors.industryRisk]}
                    onValueChange={(value) =>
                      setComplexityFactors({
                        ...complexityFactors,
                        industryRisk: value[0]
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Higher values for higher-risk industries (financial,
                    healthcare, etc.)
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="specialExpertise">
                      Special Expertise
                    </Label>
                    <span className="text-sm text-muted-foreground">
                      {complexityFactors.specialExpertise.toFixed(1)}
                    </span>
                  </div>
                  <Slider
                    id="specialExpertise"
                    min={0}
                    max={1}
                    step={0.1}
                    value={[complexityFactors.specialExpertise]}
                    onValueChange={(value) =>
                      setComplexityFactors({
                        ...complexityFactors,
                        specialExpertise: value[0]
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Higher values when specialized domain expertise is required
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* AI analysis visualization */}
          {renderAnalysisVisualization()}

          {/* Price recommendation result */}
          {price && (
            <div className="space-y-4 mt-2">
              <Separator />
              <div className="rounded-lg bg-primary/5 p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Suggested Price
                  </p>
                  <p className="text-3xl font-bold text-primary">
                    {formatCurrency(price.suggested_price)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      Adjust Final Price
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={manualPrice}
                        onChange={(e) => setManualPrice(e.target.value)}
                        className="w-24 h-8"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">
                  Recommendation Explanation
                </h3>
                <div className="rounded-lg border p-3 bg-background text-sm whitespace-pre-line">
                  {price.explanation}
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-end space-y-3 sm:space-y-0 sm:space-x-4 pt-2">
            {!price ? (
              <Button onClick={calculatePrice} disabled={calculating} className="gap-2">
                {calculating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    Calculate Recommended Price
                  </>
                )}
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(
                      manualPrice || price.suggested_price.toString()
                    );
                  }
                }}
                className="gap-2"
              >
                <DollarSign className="h-4 w-4" />
                Copy Price
              </Button>
            )}

            <Button
              onClick={handleSendToEngagementLetter}
              disabled={sendingToEngagementLetter || engagementLetterSent}
              className="gap-2"
            >
              {sendingToEngagementLetter ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : engagementLetterSent ? (
                <>
                  <Check className="h-4 w-4" />
                  Sent to Engagement Letter Software
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4" />
                  Send to Engagement Letter Software
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {price && !engagementLetterSent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <FileSignature className="h-5 w-5 mr-2 text-emerald-500" />
              Ready for Engagement Letter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="mt-0.5">
                  <Check className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="font-medium">Pricing analysis complete</p>
                  <p className="text-sm text-muted-foreground">
                    Based on document complexity and client factors, our AI
                    recommends a price of{" "}
                    {formatCurrency(price.suggested_price)}.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="mt-0.5">
                  <ArrowRight className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium">Next Step: Engagement Letter</p>
                  <p className="text-sm text-muted-foreground">
                    You can now send this project with the pricing of{" "}
                    {formatCurrency(manualPrice || price.suggested_price)} to
                    your engagement letter software for client approval.
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  className="w-full gap-2"
                  onClick={handleSendToEngagementLetter}
                  disabled={sendingToEngagementLetter || engagementLetterSent}
                >
                  {sendingToEngagementLetter ? (
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
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {engagementLetterSent && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <div className="mt-0.5 flex-shrink-0">
                <Check className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <h3 className="font-medium text-green-800 dark:text-green-300">Successfully Sent to Engagement Letter Software</h3>
                <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                  Project information for {project.client_name} has been sent to your engagement letter software.
                </p>
                <div className="mt-4">
                  <Link href={`/staff/letter?project_id=${project.id}`}>
                    <Button variant="outline" size="sm" className="gap-2">
                      <FileSignature className="h-4 w-4" />
                      View Engagement Letter
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}