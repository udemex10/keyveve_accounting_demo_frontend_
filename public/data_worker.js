// data_worker.js
// Web worker for loading and processing JSON data

// Define the same constants used in your app to ensure consistency
const SERVICES = ["Tax Return", "Audit", "CAAS"];
const PARTNERS = ["Alice", "Bob", "Carlos", "Dana"];
const STATUSES = ["Kickoff", "Waiting Docs", "In Progress", "Filed", "Closed"];
const REFERRALS = ["LinkedIn", "CPA-to-CPA", "Website", "Client Referral", null];

self.addEventListener('message', function(e) {
  if (e.data.type === 'loadData') {
    loadData();
  }
});

async function loadData() {
  try {
    // Fetch the JSON file
    const response = await fetch('/dummydata.json');

    if (!response.ok) {
      throw new Error(`Failed to load data: ${response.status} ${response.statusText}`);
    }

    const rawData = await response.json();

    // Process the data inside the worker
    const processedData = processData(rawData);

    // Send only the processed data back to the main thread
    self.postMessage({
      type: 'dataLoaded',
      data: processedData,
      error: null
    });
  } catch (error) {
    // Send error back to main thread
    self.postMessage({
      type: 'dataLoaded',
      data: null,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

function processData(data) {
  // Process and type-check engagements
  const processedEngagements = data.dummyEngagements.map(engagement => ({
    id: Number(engagement.id),
    clientName: String(engagement.clientName),
    businessName: engagement.businessName === null ? null : String(engagement.businessName),
    service: String(engagement.service),
    partner: String(engagement.partner),
    referral: engagement.referral === null ? null : String(engagement.referral),
    status: String(engagement.status),
    createdAt: String(engagement.createdAt),
    dueDate: engagement.dueDate === null ? undefined : String(engagement.dueDate),
    documents: Number(engagement.documents)
  }));

  // Process and type-check prospects
  const processedProspects = data.dummyProspects.map(prospect => ({
    id: Number(prospect.id),
    clientName: String(prospect.clientName),
    businessName: prospect.businessName === null ? null : String(prospect.businessName),
    isIndividual: Boolean(prospect.isIndividual),
    projectedService: String(prospect.projectedService),
    partner: String(prospect.partner),
    referredBy: prospect.referredBy === null ? null : String(prospect.referredBy),
    createdAt: String(prospect.createdAt),
    potentialRevenue: Number(prospect.potentialRevenue)
  }));

  return {
    dummyEngagements: processedEngagements,
    dummyProspects: processedProspects
  };
}