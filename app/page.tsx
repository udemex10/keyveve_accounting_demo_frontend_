"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ModeToggle } from "@/components/mode-toggle";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  UserRound,
  ArrowRight,
  BrainCircuit,
  FileText,
  Check,
  BarChart3,
  MessageSquare,
  FileSignature,
  Clock,
  CheckCircle2,
  FileUp,
  ChevronRight,
  ExternalLink,
  LucideIcon,
  FileQuestion,
  Settings,
  Award
} from "lucide-react";

// Feature list item interface
interface FeatureItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

// Feature list for staff and client
const staffFeatures: FeatureItem[] = [
  {
    icon: BrainCircuit,
    title: "AI-Powered Document Analysis",
    description: "Automatically classify and extract key data from client documents."
  },
  {
    icon: FileText,
    title: "Project Status Tracking",
    description: "Monitor project progress with visual status indicators."
  },
  {
    icon: Check,
    title: "Task Management",
    description: "Automatically generate and track tasks based on project status."
  },
  {
    icon: MessageSquare,
    title: "Client Communication",
    description: "Secure messaging with clients within the platform."
  },
  {
    icon: BarChart3,
    title: "Pricing Recommendations",
    description: "AI-suggested pricing based on project scope and complexity."
  },
  {
    icon: FileSignature,
    title: "Engagement Letter Integration",
    description: "Seamless integration with engagement letter software."
  }
];

const clientFeatures: FeatureItem[] = [
  {
    icon: FileUp,
    title: "Secure Document Upload",
    description: "Easily upload and track all documents in one place."
  },
  {
    icon: Clock,
    title: "Real-Time Status Updates",
    description: "View project progress and stay informed every step of the way."
  },
  {
    icon: CheckCircle2,
    title: "Digital Signatures",
    description: "Sign engagement letters and documents electronically."
  },
  {
    icon: MessageSquare,
    title: "Accountant Communication",
    description: "Message your accounting team directly through the portal."
  }
];

// Workflow steps visualization
const workflowSteps = [
  { label: "Onboarding", description: "Client onboarding and document request" },
  { label: "Document Upload", description: "Client securely uploads documents" },
  { label: "AI Analysis", description: "Documents classified and processed" },
  { label: "Pricing", description: "Service pricing determined" },
  { label: "Engagement Letter", description: "Letter generated and sent for signature" },
  { label: "Project Started", description: "Work begins on client deliverables" }
];

// Integrations
interface Integration {
  name: string;
  icon: LucideIcon;
  description: string;
}

const integrations: Integration[] = [
  {
    name: "Engagement Letter Software",
    icon: FileSignature,
    description: "Seamlessly generate and send engagement letters."
  },
  {
    name: "Practice Management",
    icon: Building2,
    description: "Sync client data with your practice management software."
  },
  {
    name: "Document Storage",
    icon: FileText,
    description: "Store and organize documents in your preferred system."
  },
  {
    name: "Tax Software",
    icon: FileQuestion,
    description: "Connect with popular tax preparation software."
  }
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-bold">
            <BrainCircuit className="h-6 w-6" />
            <span>Keyveve AI Accounting</span>
          </div>
          <div className="flex items-center space-x-4">
            <ModeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-muted/50 to-background">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                  AI-Powered <span className="text-primary">Accounting Workflow</span>
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl lg:text-2xl">
                  Streamline your accounting processes with intelligent document extraction,
                  automated workflows, and seamless client communication.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link href="/staff">
                  <Button size="lg" className="gap-2">
                    <Building2 className="h-5 w-5" />
                    Staff Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/client">
                  <Button variant="outline" size="lg" className="gap-2">
                    <UserRound className="h-5 w-5" />
                    Client Portal
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <div className="w-full max-w-4xl mt-12">
                <Tabs defaultValue="staff">
                  <div className="flex justify-center mb-6">
                    <TabsList className="grid grid-cols-2 w-[400px]">
                      <TabsTrigger value="staff" className="gap-2">
                        <Building2 className="h-4 w-4" />
                        For Staff
                      </TabsTrigger>
                      <TabsTrigger value="client" className="gap-2">
                        <UserRound className="h-4 w-4" />
                        For Clients
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="staff" className="mt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {staffFeatures.map((feature, index) => (
                        <Card key={index} className="flex flex-col h-full">
                          <CardHeader>
                            <feature.icon className="h-8 w-8 mb-2 text-primary" />
                            <CardTitle className="text-xl">{feature.title}</CardTitle>
                          </CardHeader>
                          <CardContent className="flex-1">
                            <p className="text-muted-foreground">{feature.description}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="client" className="mt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {clientFeatures.map((feature, index) => (
                        <Card key={index} className="flex flex-col h-full">
                          <CardHeader>
                            <feature.icon className="h-8 w-8 mb-2 text-primary" />
                            <CardTitle className="text-xl">{feature.title}</CardTitle>
                          </CardHeader>
                          <CardContent className="flex-1">
                            <p className="text-muted-foreground">{feature.description}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </section>

        {/* Workflow Section */}
        <section className="w-full py-12 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold tracking-tight">Streamlined Workflow</h2>
              <p className="text-muted-foreground mt-2 max-w-[700px] mx-auto">
                Our AI-powered platform guides you through each step of the accounting process,
                from onboarding to project completion.
              </p>
            </div>

            <div className="relative max-w-5xl mx-auto">
              {/* Connecting line */}
              <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-border -translate-y-1/2 z-0 hidden md:block"></div>

              {/* Steps */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 relative z-10">
                {workflowSteps.map((step, index) => (
                  <div key={index} className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2 border-4 border-background">
                      <span className="font-bold text-primary">{index + 1}</span>
                    </div>
                    <h3 className="font-semibold">{step.label}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 text-center">
              <Link href="/staff">
                <Button className="gap-2">
                  <Building2 className="h-4 w-4" />
                  Try the Workflow
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Integration Section */}
        <section className="w-full py-12 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-[800px] mx-auto">
              <div className="text-center mb-10">
                <Badge variant="outline" className="mb-4">Seamless Integration</Badge>
                <h2 className="text-3xl font-bold tracking-tight">Connect with Your Existing Tools</h2>
                <p className="text-muted-foreground mt-2">
                  Keyveve AI Accounting integrates with your favorite accounting software and tools.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {integrations.map((integration, index) => (
                  <Card key={index} className="flex items-start p-6 hover:border-primary/50 transition-colors">
                    <integration.icon className="h-10 w-10 mr-4 text-muted-foreground" />
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{integration.name}</h3>
                      <p className="text-sm text-muted-foreground">{integration.description}</p>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="mt-8 text-center">
                <Button variant="outline" className="gap-2">
                  <Settings className="h-4 w-4" />
                  View All Integrations
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="w-full py-12 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <Badge variant="outline" className="mb-4">Why Choose Keyveve</Badge>
                <h2 className="text-3xl font-bold tracking-tight mb-4">Transform Your Accounting Workflow</h2>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="mt-1 mr-4 bg-primary/10 p-1 rounded-full">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Save 60% of Staff Time</h3>
                      <p className="text-muted-foreground text-sm">Automate document classification and data extraction.</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="mt-1 mr-4 bg-primary/10 p-1 rounded-full">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Enhance Client Satisfaction</h3>
                      <p className="text-muted-foreground text-sm">Provide a modern, transparent client experience.</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="mt-1 mr-4 bg-primary/10 p-1 rounded-full">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Reduce Errors by 80%</h3>
                      <p className="text-muted-foreground text-sm">AI verification ensures document accuracy and completeness.</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="mt-1 mr-4 bg-primary/10 p-1 rounded-full">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Boost Practice Revenue</h3>
                      <p className="text-muted-foreground text-sm">Handle more clients with the same team size.</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <Button className="gap-2">
                    <Building2 className="h-4 w-4" />
                    Start Your Free Trial
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8 border shadow-sm">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div className="flex items-center">
                      <Award className="h-8 w-8 text-primary mr-3" />
                      <div>
                        <h3 className="font-semibold text-lg">CPA Practice Advisor</h3>
                        <p className="text-sm text-muted-foreground">Top New Technology Award</p>
                      </div>
                    </div>
                    <Badge variant="secondary">2023</Badge>
                  </div>

                  <blockquote className="italic border-l-2 pl-4 py-2">
                    <p>"Keyveve's AI-driven workflow has revolutionized how our accounting firm handles document processing and client onboarding."</p>
                    <footer className="mt-2 text-sm text-muted-foreground not-italic">
                      — Sarah Johnson, CPA, Johnson Accounting Services
                    </footer>
                  </blockquote>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-primary">92%</p>
                      <p className="text-sm text-muted-foreground">Reduction in Document Processing Time</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-primary">4.9/5</p>
                      <p className="text-sm text-muted-foreground">User Satisfaction Rating</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="w-full py-12 md:py-24 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Ready to Transform Your Accounting Workflow?</h2>
            <p className="mx-auto max-w-[600px] mb-8 opacity-90">
              Join hundreds of accounting firms using Keyveve AI to streamline their practice and delight their clients.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/staff">
                <Button size="lg" variant="secondary" className="gap-2">
                  <Building2 className="h-5 w-5" />
                  Try Staff Dashboard
                </Button>
              </Link>
              <Link href="/client">
                <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary gap-2">
                  <UserRound className="h-5 w-5" />
                  Try Client Portal
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 md:py-12 bg-muted/20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 font-bold mb-4">
                <BrainCircuit className="h-6 w-6" />
                <span>Keyveve AI Accounting</span>
              </div>
              <p className="text-muted-foreground mb-4 max-w-md">
                Transforming accounting workflows with AI-powered document processing, client portals, and practice management integrations.
              </p>
              <div className="flex space-x-4">
                <Button variant="ghost" size="icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                </Button>
                <Button variant="ghost" size="icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                  </svg>
                </Button>
                <Button variant="ghost" size="icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                  </svg>
                </Button>
                <Button variant="ghost" size="icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                    <rect width="4" height="12" x="2" y="9"></rect>
                    <circle cx="4" cy="4" r="2"></circle>
                  </svg>
                </Button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-lg">Product</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Features</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Integrations</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Pricing</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Security</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-lg">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-foreground">About Us</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Blog</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Careers</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center mt-8 pt-8 border-t">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Keyveve AI Accounting. All rights reserved.
            </p>
            <div className="flex flex-wrap gap-4 mt-4 md:mt-0">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Privacy Policy</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Terms of Service</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}