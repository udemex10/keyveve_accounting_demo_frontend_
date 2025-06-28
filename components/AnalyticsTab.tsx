"use client";

import React, { useMemo, useState } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  TimeScale,
  RadialLinearScale,
  Filler,
} from "chart.js";
import { Doughnut, Line, Radar, PolarArea } from "react-chartjs-2";
import "chartjs-adapter-date-fns";
import { differenceInDays, format, startOfWeek } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, AlertTriangle, Filter, Calendar } from "lucide-react";
import type { FirmEngagement } from "@/components/FirmEngagementTable";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  TimeScale,
  RadialLinearScale,
  Filler,
);

/* -------------------------------------------------------------------------- */
/*  Helper utilities                                                           */
/* -------------------------------------------------------------------------- */

const groupCount = <K extends keyof FirmEngagement>(
  arr: FirmEngagement[],
  key: K,
) =>
  arr.reduce((acc, cur) => {
    const k = (cur[key] ?? "Unknown") as string;
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

function weeklyBuckets(data: FirmEngagement[]) {
  const map: Record<string, number> = {};
  data.forEach((e) => {
    const w = startOfWeek(new Date(e.createdAt)).toISOString(); // Monday buckets
    map[w] = (map[w] ?? 0) + 1;
  });
  const sorted = Object.keys(map)
    .sort()
    .map((k) => ({ week: k, count: map[k] }));
  return sorted;
}

// Rich color palette that works well in light and dark modes
const COLORS = {
  primary: [
    'rgba(101, 116, 205, 0.8)',
    'rgba(149, 76, 233, 0.8)',
    'rgba(91, 192, 190, 0.8)',
    'rgba(242, 92, 84, 0.8)',
    'rgba(241, 148, 138, 0.8)',
    'rgba(250, 177, 160, 0.8)',
    'rgba(244, 208, 63, 0.8)',
    'rgba(88, 214, 141, 0.8)',
  ],
  light: [
    'rgba(101, 116, 205, 0.6)',
    'rgba(149, 76, 233, 0.6)',
    'rgba(91, 192, 190, 0.6)',
    'rgba(242, 92, 84, 0.6)',
    'rgba(241, 148, 138, 0.6)',
    'rgba(250, 177, 160, 0.6)',
    'rgba(244, 208, 63, 0.6)',
    'rgba(88, 214, 141, 0.6)',
  ],
  borders: [
    'rgba(101, 116, 205, 1)',
    'rgba(149, 76, 233, 1)',
    'rgba(91, 192, 190, 1)',
    'rgba(242, 92, 84, 1)',
    'rgba(241, 148, 138, 1)',
    'rgba(250, 177, 160, 1)',
    'rgba(244, 208, 63, 1)',
    'rgba(88, 214, 141, 1)',
  ],
};

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

interface Props {
  data: FirmEngagement[];
}

export default function AnalyticsTab({ data }: Props) {
  /* -------------------------- 1️⃣ filter state ----------------------------- */
  const [filters, setFilters] = useState<{
    service?: string;
    partner?: string;
    status?: string;
    referral?: string;
    from?: string;
    to?: string;
  }>({});

  const applyFilters = (rows: FirmEngagement[]): FirmEngagement[] =>
    rows.filter((r) => {
      if (filters.service && r.service !== filters.service) return false;
      if (filters.partner && r.partner !== filters.partner) return false;
      if (filters.status && r.status !== filters.status) return false;
      if (filters.referral && r.referral !== filters.referral) return false;
      if (filters.from && new Date(r.createdAt) < new Date(filters.from))
        return false;
      if (filters.to && new Date(r.createdAt) > new Date(filters.to))
        return false;
      return true;
    });

  const filtered = useMemo(() => applyFilters(data), [data, filters]);

  /* -------------------------- 2️⃣ KPI metrics ------------------------------ */
  const kpis = useMemo(() => {
    const total = filtered.length;
    const new30 = filtered.filter(
      (e) => differenceInDays(new Date(), new Date(e.createdAt)) <= 30,
    ).length;
    const overdue = filtered.filter(
      (e) => e.status !== "Closed" && Math.random() < 0.15,
    ).length; // dummy at-risk
    const growth = Math.round((new30 / total) * 100);
    return { total, new30, overdue, growth };
  }, [filtered]);

  /* -------------------------- 3️⃣ chart datasets -------------------------- */
  const serviceMix = groupCount(filtered, "service");
  const statusSpread = groupCount(filtered, "status");
  const partnerLoad = groupCount(filtered, "partner");
  const referralSpread = groupCount(filtered, "referral");

  const weekly = weeklyBuckets(filtered);
  const weeklyData = {
    labels: weekly.map((w) => format(new Date(w.week), "MMM d")),
    datasets: [
      {
        label: "New engagements",
        data: weekly.map((w) => w.count),
        borderColor: COLORS.borders[0],
        backgroundColor: COLORS.light[0],
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointBackgroundColor: COLORS.borders[0],
      }
    ],
  };

  /* stacked status × service matrix (now using radar chart) */
  const matrixLabels = Array.from(new Set(filtered.map((e) => e.status)));
  const svcTypes = Array.from(new Set(filtered.map((e) => e.service)));
  const matrixData = {
    labels: matrixLabels,
    datasets: svcTypes.map((svc, idx) => ({
      label: svc,
      data: matrixLabels.map(
        (st) =>
          filtered.filter((e) => e.status === st && e.service === svc).length,
      ),
      backgroundColor: COLORS.light[idx % COLORS.light.length],
      borderColor: COLORS.borders[idx % COLORS.borders.length],
      borderWidth: 1,
    })),
  };

  /* partner capacity (now using polar area) */
  const polarData = {
    labels: Object.keys(partnerLoad),
    datasets: [
      {
        data: Object.values(partnerLoad),
        backgroundColor: Object.keys(partnerLoad).map(
          (_, i) => COLORS.primary[i % COLORS.primary.length]
        ),
        borderWidth: 1,
      },
    ],
  };

  /* -------------------------- 4️⃣ chart helpers --------------------------- */
  const doughnut = (counts: Record<string, number>) => ({
    labels: Object.keys(counts),
    datasets: [
      {
        data: Object.values(counts),
        backgroundColor: Object.keys(counts).map(
          (_, i) => COLORS.primary[i % COLORS.primary.length]
        ),
        borderColor: Object.keys(counts).map(
          (_, i) => COLORS.borders[i % COLORS.borders.length]
        ),
        borderWidth: 1,
      }
    ],
  });

  const radarData = (counts: Record<string, number>) => ({
    labels: Object.keys(counts),
    datasets: [
      {
        label: "Count",
        data: Object.values(counts),
        backgroundColor: COLORS.light[1],
        borderColor: COLORS.borders[1],
        borderWidth: 2,
        pointBackgroundColor: COLORS.borders[1],
        pointRadius: 4,
      }
    ],
  });

  const selectBox = (
    label: string,
    key: keyof typeof filters,
    values: string[],
    icon?: React.ReactNode
  ) => (
    <div className="flex flex-col space-y-1">
      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
        {icon}
        {label}
      </span>
      <Select
        value={filters[key] ?? "all"}
        onValueChange={(v) =>
          setFilters((f) => ({ ...f, [key]: v === "all" ? undefined : v }))
        }
      >
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All {label}</SelectItem>
          {values.map((v) => (
            <SelectItem key={v} value={v}>
              {v}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  /* -------------------------- 5️⃣ unique lists ---------------------------- */
  const uniq = (arr: string[]) => Array.from(new Set(arr)).sort();
  const services = uniq(data.map((d) => d.service));
  const partners = uniq(data.map((d) => d.partner));
  const statuses = uniq(data.map((d) => d.status));
  const referrals = uniq(data.map((d) => d.referral ?? "Unknown"));

  /* -------------------------- Get active filters count ------------------ */
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  /* ----------------------------------------------------------------------- */
  return (
    <div className="space-y-6 py-2">
      {/* Header with summary badge --------------------------------------- */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Performance Dashboard
        </h2>
        {activeFilterCount > 0 && (
          <Badge variant="outline" className="px-3 py-1 dark:text-gray-100">
            <Filter size={14} className="mr-1" />
            {activeFilterCount} active filter{activeFilterCount !== 1 && 's'}
          </Badge>
        )}
      </div>

      {/* Filter bar ------------------------------------------------------- */}
      <Card className="p-4">
        <CardHeader className="p-0 pb-3">
          <CardTitle className="text-sm font-medium text-gray-800 dark:text-white">Filters</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-wrap gap-3 items-end">
            {selectBox("Service", "service", services, <Filter size={14} />)}
            {selectBox("Partner", "partner", partners, <Users size={14} />)}
            {selectBox("Status", "status", statuses, <Filter size={14} />)}
            {selectBox("Referral", "referral", referrals, <Filter size={14} />)}
            {/* date range */}
            <div className="flex flex-col space-y-1">
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Calendar size={14} />
                Date Range
              </span>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={filters.from ?? ""}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, from: e.target.value || undefined }))
                  }
                  className="w-[140px] h-9"
                />
                <span className="dark:text-gray-300">—</span>
                <Input
                  type="date"
                  value={filters.to ?? ""}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, to: e.target.value || undefined }))
                  }
                  className="w-[140px] h-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI row ---------------------------------------------------------- */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="overflow-hidden border-l-4 border-l-indigo-500">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Engagements</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex items-end justify-between">
            <div className="text-3xl font-bold text-gray-800 dark:text-white">{kpis.total}</div>
            <Users size={36} className="text-gray-300 dark:text-gray-600" />
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-l-4 border-l-emerald-500">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">New Clients (30d)</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex items-end justify-between">
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-gray-800 dark:text-white">{kpis.new30}</span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center">
                <TrendingUp size={12} className="mr-1" />
                {kpis.growth}% of total
              </span>
            </div>
            <TrendingUp size={36} className="text-gray-300 dark:text-gray-600" />
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-l-4 border-l-amber-500">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">At-Risk Deadlines</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex items-end justify-between">
            <div className="text-3xl font-bold text-gray-800 dark:text-white">{kpis.overdue}</div>
            <AlertTriangle size={36} className="text-gray-300 dark:text-gray-600" />
          </CardContent>
        </Card>
      </div>

      {/* Main dashboard grid --------------------------------------------- */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {/* Service Mix */}
        <Card className="xl:col-span-1">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-sm font-medium text-gray-800 dark:text-white">Service Mix</CardTitle>
          </CardHeader>
          <CardContent className="p-4 h-64">
            <div className="h-full flex items-center justify-center">
              <Doughnut
                data={doughnut(serviceMix)}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        boxWidth: 12,
                        padding: 15,
                        font: {
                          size: 11
                        },
                        color: 'rgb(75, 85, 99)',
                        usePointStyle: true
                      }
                    },
                    tooltip: {
                      displayColors: false,
                      callbacks: {
                        label: function(context) {
                          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                          const value = context.raw as number;
                          const percentage = ((value / total) * 100).toFixed(1);
                          return `${context.label}: ${value} (${percentage}%)`;
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Weekly Trend */}
        <Card className="xl:col-span-2">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-sm font-medium text-gray-800 dark:text-white">Weekly New-Client Trend</CardTitle>
          </CardHeader>
          <CardContent className="p-4 h-64">
            <Line
              data={weeklyData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  },
                  tooltip: {
                    displayColors: false,
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: 'rgba(0, 0, 0, 0.05)',
                    }
                  },
                  x: {
                    grid: {
                      display: false,
                    }
                  }
                }
              }}
            />
          </CardContent>
        </Card>

        {/* Partner Load */}
        <Card>
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-sm font-medium text-gray-800 dark:text-white">Partner Load</CardTitle>
          </CardHeader>
          <CardContent className="p-4 h-72">
            <div className="h-full flex items-center justify-center">
              <PolarArea
                data={polarData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        boxWidth: 12,
                        padding: 10,
                        font: {
                          size: 11
                        },
                        color: 'rgb(75, 85, 99)',
                        usePointStyle: true,
                        color: 'rgb(75, 85, 99)',
                        usePointStyle: true
                      }
                    }
                  },
                  scales: {
                    r: {
                      ticks: {
                        display: false
                      }
                    }
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Status Spread */}
        <Card>
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-sm font-medium text-gray-800 dark:text-white">Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="p-4 h-72">
            <div className="h-full flex items-center justify-center">
              <Radar
                data={radarData(statusSpread)}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    r: {
                      beginAtZero: true,
                      ticks: {
                        display: false
                      }
                    }
                  },
                  plugins: {
                    legend: {
                      display: false
                    }
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Referral Sources */}
        <Card>
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-sm font-medium text-gray-800 dark:text-white">Referral Sources</CardTitle>
          </CardHeader>
          <CardContent className="p-4 h-72">
            <div className="h-full flex items-center justify-center">
              <Doughnut
                data={doughnut(referralSpread)}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '60%',
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        boxWidth: 12,
                        padding: 10,
                        font: {
                          size: 11
                        }
                      }
                    },
                    tooltip: {
                      displayColors: false,
                      callbacks: {
                        label: function(context) {
                          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                          const value = context.raw as number;
                          const percentage = ((value / total) * 100).toFixed(1);
                          return `${context.label}: ${value} (${percentage}%)`;
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}