"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import axios from "axios";
import { useToast } from "@/components/ui/use-toast";
import {
  BrainCircuit,
  Calculator,
  Calendar,
  Check,
  FileText,
  Folder,
  Landmark,
  Loader2,
  BarChart4,
  FileSpreadsheet,
  Clock,
  Users,
  Building,
  BarChart,
  ArrowRight
} from "lucide-react";

const API_BASE_URL = "https://keyveve-accounting-demo-backend.onrender.com";

// Service types with their icons
const SERVICE_TEMPLATES = [
  {
    id: "tax-individual",
    name: "Individual Tax Return",
    description: "Annual tax preparation for individuals & families",
    icon: <FileText className="h-5 w-5 text-blue-500" />,
    category: "Tax Return",
    features: ["Tax deadline tracking", "Document checklist", "e-File status monitoring"]
  },
  {
    id: "tax-business",
    name: "Business Tax Return",
    description: "Tax preparation for businesses & corporations",
    icon: <Building className="h-5 w-5 text-blue-500" />,
    category: "Tax Return",
    features: ["Multiple entity support", "Business expense tracking", "Tax planning"]
  },
  {
    id: "audit-standard",
    name: "Standard Audit",
    description: "Full financial statement audit services",
    icon: <Check className="h-5 w-5 text-red-500" />,
    category: "Audit",
    features: ["Risk assessment", "Sampling methodology", "Findings tracking"]
  },
  {
    id: "audit-review",
    name: "Financial Review",
    description: "Limited-scope financial review",
    icon: <BarChart className="h-5 w-5 text-red-500" />,
    category: "Audit",
    features: ["Analytical procedures", "Limited testing", "Management letter"]
  },
  {
    id: "cas-monthly",
    name: "Monthly Bookkeeping",
    description: "Recurring monthly bookkeeping services",
    icon: <FileSpreadsheet className="h-5 w-5 text-green-500" />,
    category: "Bookkeeping",
    features: ["Bank reconciliation", "Monthly financial statements", "Recurring tasks"]
  },
  {
    id: "cas-quarterly",
    name: "Quarterly Bookkeeping",
    description: "Quarterly financial review & bookkeeping",
    icon: <Calculator className="h-5 w-5 text-green-500" />,
    category: "Bookkeeping",
    features: ["Quarterly reports", "Tax estimation", "Compliance checks"]
  },
  {
    id: "financial-planning",
    name: "Financial Planning",
    description: "Personal & business financial planning",
    icon: <BarChart4 className="h-5 w-5 text-purple-500" />,
    category: "Financial Planning",
    features: ["Investment analysis", "Retirement planning", "Cash flow forecasting"]
  },
  {
    id: "advisory",
    name: "Business Advisory",
    description: "Business growth & strategy advisory services",
    icon: <Landmark className="h-5 w-5 text-amber-500" />,
    category: "Advisory",
    features: ["Business valuation", "Succession planning", "Strategy consulting"]
  }
];

const WorkflowTemplateSelector = ({
  onSelectTemplate,
  onCreateProject,
  staffMembers = [],
  loading = false
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [clientName, setClientName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [staffRoles, setStaffRoles] = useState({});
  const { toast } = useToast();

  const filteredTemplates = selectedCategory === "all"
    ? SERVICE_TEMPLATES
    : SERVICE_TEMPLATES.filter(t => t.category === selectedCategory);

  // Handle template selection
  const handleSelectTemplate = (templateId) => {
    const template = SERVICE_TEMPLATES.find(t => t.id === templateId);
    setSelectedTemplate(template);

    if (onSelectTemplate) {
      onSelectTemplate(template);
    }
  };

  // Handle staff assignment
  const handleStaffChange = (staffId, isSelected) => {
    if (isSelected) {
      setSelectedStaff([...selectedStaff, staffId]);
    } else {
      setSelectedStaff(selectedStaff.filter(id => id !== staffId));
      // Also remove from roles if deselected
      const newRoles = {...staffRoles};
      delete newRoles[staffId];
      setStaffRoles(newRoles);
    }
  };

  // Handle staff role assignment
  const handleRoleChange = (staffId, role) => {
    setStaffRoles({
      ...staffRoles,
      [staffId]: role
    });
  };

  // Handle project creation
  const handleCreate = () => {
    if (!clientName.trim()) {
      toast({
        variant: "destructive",
        title: "Client name required",
        description: "Please enter a client name to create a project."
      });
      return;
    }

    if (!selectedTemplate) {
      toast({
        variant: "destructive",
        title: "Template required",
        description: "Please select a workflow template."
      });
      return;
    }

    if (onCreateProject) {
      onCreateProject({
        client_name: clientName,
        service_type: selectedTemplate.category,
        workflow_template: selectedTemplate.id,
        assigned_staff: selectedStaff,
        staff_roles: staffRoles
      });
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="template">
        <TabsList>
          <TabsTrigger value="template">Choose Template</TabsTrigger>
          <TabsTrigger value="details">Project Details</TabsTrigger>
          <TabsTrigger value="staff">Assign Staff</TabsTrigger>
        </TabsList>

        {/* Template Selection Tab */}
        <TabsContent value="template" className="space-y-4">
          <div className="flex gap-2 pb-2">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
            >
              All
            </Button>
            <Button
              variant={selectedCategory === "Tax Return" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("Tax Return")}
            >
              Tax
            </Button>
            <Button
              variant={selectedCategory === "Audit" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("Audit")}
            >
              Audit
            </Button>
            <Button
              variant={selectedCategory === "Bookkeeping" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("Bookkeeping")}
            >
              CAS
            </Button>
            <Button
              variant={selectedCategory === "Financial Planning" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("Financial Planning")}
            >
              Planning
            </Button>
            <Button
              variant={selectedCategory === "Advisory" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("Advisory")}
            >
              Advisory
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTemplates.map((template) => (
              <Card
                key={template.id}
                className={`cursor-pointer transition-colors ${selectedTemplate?.id === template.id ? 'border-primary' : 'hover:bg-muted/50'}`}
                onClick={() => handleSelectTemplate(template.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between">
                    <div className="flex items-center gap-2">
                      {template.icon}
                      <CardTitle className="text-base">{template.name}</CardTitle>
                    </div>
                    <Badge variant="outline">{template.category}</Badge>
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {template.features.map((feature, i) => (
                      <Badge key={i} variant="secondary" className="font-normal">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectTemplate(template.id);
                    }}
                  >
                    <Check className={`h-4 w-4 ${selectedTemplate?.id === template.id ? 'opacity-100' : 'opacity-0'}`} />
                    {selectedTemplate?.id === template.id ? 'Selected' : 'Select Template'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Project Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
              <CardDescription>Enter the basic information for this project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client-name">Client Name</Label>
                <Input
                  id="client-name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Enter client name"
                />
              </div>

              <div className="space-y-2">
                <Label>Selected Template</Label>
                {selectedTemplate ? (
                  <div className="p-3 bg-muted rounded-md flex items-center space-x-3">
                    {selectedTemplate.icon}
                    <div>
                      <p className="font-medium">{selectedTemplate.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedTemplate.category}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-muted rounded-md text-muted-foreground">
                    No template selected. Return to previous tab to select.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Staff Assignment Tab */}
        <TabsContent value="staff" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assign Staff</CardTitle>
              <CardDescription>Assign staff members to this project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                {staffMembers.map((staff) => (
                  <div key={staff.id} className="flex items-center justify-between border rounded-md p-3">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>{staff.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{staff.name}</p>
                        <p className="text-sm text-muted-foreground">{staff.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {selectedStaff.includes(staff.id) && (
                        <Select
                          value={staffRoles[staff.id] || "staff"}
                          onValueChange={(value) => handleRoleChange(staff.id, value)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="staff">Staff</SelectItem>
                            <SelectItem value="point_of_contact">Point of Contact</SelectItem>
                            <SelectItem value="partner_assigned">Partner</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      <Button
                        variant={selectedStaff.includes(staff.id) ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleStaffChange(staff.id, !selectedStaff.includes(staff.id))}
                      >
                        {selectedStaff.includes(staff.id) ? "Assigned" : "Assign"}
                      </Button>
                    </div>
                  </div>
                ))}

                {staffMembers.length === 0 && (
                  <div className="text-center p-4 text-muted-foreground">
                    No staff members available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {selectedTemplate ? (
                  <>
                    Creating new {selectedTemplate.name} project
                    {clientName ? ` for ${clientName}` : ""}
                  </>
                ) : (
                  "Select a workflow template to continue"
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedStaff.length > 0 ? (
                  `${selectedStaff.length} staff member${selectedStaff.length > 1 ? 's' : ''} assigned`
                ) : (
                  "No staff assigned yet"
                )}
              </p>
            </div>

            <Button
              onClick={handleCreate}
              disabled={!selectedTemplate || !clientName.trim() || loading}
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4" />
                  Create Project
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkflowTemplateSelector;