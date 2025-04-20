"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";

import EnhancedPricingCalculation from "@/components/enhancedpricingcalculation";

const API_BASE_URL = "http://localhost:8000";

export default function PricingPage() {
  const searchParams = useSearchParams();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Grab the "project_id" from the query string: /pricing?project_id=123
  const projectId = searchParams.get("project_id");

  useEffect(() => {
    async function fetchProject() {
      if (!projectId) {
        // If no project_id in the URL, we won't fetch
        setLoading(false);
        setError("No project_id provided in the URL.");
        return;
      }

      try {
        // Example endpoint: GET /projects/:id
        const response = await axios.get(`${API_BASE_URL}/projects/${projectId}`);
        setProject(response.data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch project:", err);
        setError("Failed to fetch project. Check the console for details.");
      } finally {
        setLoading(false);
      }
    }

    fetchProject();
  }, [projectId]);

  // Loading state
  if (loading) {
    return (
      <div className="p-6 text-center">
        <p>Loading project data...</p>
      </div>
    );
  }

  // Error state or missing project_id
  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <p>Please ensure the URL contains a valid <code>?project_id=XYZ</code>.</p>
      </div>
    );
  }

  // If no project came back from the API (e.g. 404 or empty), we can handle that:
  if (!project) {
    return (
      <div className="p-6 text-center">
        <p className="text-amber-600 font-semibold mb-2">
          No project data available
        </p>
        <p>
          Please select a project first or check if <code>project_id</code> is valid.
        </p>
      </div>
    );
  }

  // If we have a project, render the pricing component
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <EnhancedPricingCalculation
        project={project}
        onCalculationComplete={(priceData: any) => {
          console.log("Price calculation complete:", priceData);
        }}
      />
    </div>
  );
}
