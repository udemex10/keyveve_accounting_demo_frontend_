/* ------------------------------------------------------------------ */
/*  NewClientsTable – standalone “New Clients / Prospects” list       */
/* ------------------------------------------------------------------ */
"use client";

import React, {
  useMemo,
  useState,
  useCallback,
  CSSProperties,
  useDeferredValue,
  useEffect,
} from "react";
import Link from "next/link";
import { parseISO, startOfWeek } from "date-fns";
import { FixedSizeList as List } from "react-window";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ProspectiveClient {
  id: number;
  clientName: string;
  businessName: string | null;
  isIndividual: boolean;
  projectedService: string;
  partner: string;
  referredBy: string | null;
  createdAt: string;
  potentialRevenue: number;
}

interface Props {
  prospects: ProspectiveClient[];
  height?: number;
}

/* ------------------------------------------------------------------ */
/*  Colour helpers                                                     */
/* ------------------------------------------------------------------ */

const SERVICE_COLORS: Record<
  string,
  { bg: string; text: string; chart: string }
> = {
  "Tax Return": {
    bg: "bg-amber-500/20",
    text: "text-amber-800",
    chart: "rgba(245, 158, 11, 0.7)",
  },
  Audit: {
    bg: "bg-sky-500/20",
    text: "text-sky-800",
    chart: "rgba(14, 165, 233, 0.7)",
  },
  CAAS: {
    bg: "bg-emerald-500/20",
    text: "text-emerald-800",
    chart: "rgba(16, 185, 129, 0.7)",
  },
};

const INITIAL_BATCH_SIZE = 100;
const BATCH_INCREMENT = 100;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function NewClientsTable({
  prospects = [],
  height = 560,
}: Props) {
  /* ------------------------ UI state ------------------------ */
  const [visibleRowCount, setVisibleRowCount] = useState(INITIAL_BATCH_SIZE);

  const [filters, setFilters] = useState<{
    q?: string;
    service?: string;
    partner?: string;
    referredBy?: string;
    isIndividual?: boolean;
    minRevenue?: number;
  }>({});

  /* ------------------------ filter fn ----------------------- */
  const applyFilters = useCallback(
    (rows: ProspectiveClient[]) =>
      rows.filter((r) => {
        if (
          filters.q &&
          !`${r.clientName} ${r.businessName ?? ""}`
            .toLowerCase()
            .includes(filters.q.toLowerCase())
        )
          return false;

        if (filters.service && r.projectedService !== filters.service)
          return false;
        if (filters.partner && r.partner !== filters.partner) return false;
        if (filters.referredBy && (r.referredBy ?? "—") !== filters.referredBy)
          return false;
        if (
          filters.isIndividual !== undefined &&
          r.isIndividual !== filters.isIndividual
        )
          return false;
        if (filters.minRevenue && r.potentialRevenue < filters.minRevenue)
          return false;

        return true;
      }),
    [filters]
  );

  /* ---------------- filtered / paginated data --------------- */
  const filtered = useDeferredValue(useMemo(() => applyFilters(prospects), [applyFilters, prospects]));

  const visibleFiltered = useMemo(
    () => filtered.slice(0, visibleRowCount),
    [filtered, visibleRowCount]
  );

  /* ---------------- dropdown option snapshots --------------- */
  const optionLists = useMemo(() => {
    const service = new Set<string>();
    const partner = new Set<string>();
    const referredBy = new Set<string>();

    prospects.slice(0, 100).forEach((d) => {
      service.add(d.projectedService);
      partner.add(d.partner);
      if (d.referredBy) referredBy.add(d.referredBy);
    });
    return {
      service: [...service].sort(),
      partner: [...partner].sort(),
      referredBy: [...referredBy].sort(),
    };
  }, [prospects]);

  /* ---------------- react-table columns --------------------- */
  const columns = useMemo(
    () => [
      {
        accessorKey: "clientName",
        header: "Client",
        size: 180,
        cell: (c: any) => (
          <Link
            href={`/prospects/${c.row.original.id}`}
            className="underline underline-offset-2"
          >
            {c.getValue()}
          </Link>
        ),
      },
      {
        accessorKey: "businessOrType",
        header: "Business",
        size: 180,
        cell: ({ row }: any) => {
          const { businessName, isIndividual } = row.original;
          if (businessName) return businessName;
          return (
            <Badge variant="outline" className="bg-purple-100 text-purple-800">
              Individual
            </Badge>
          );
        },
      },
      {
        accessorKey: "projectedService",
        header: "Service",
        size: 120,
        cell: ({ getValue }: any) => {
          const svc = getValue<string>();
          const color = SERVICE_COLORS[svc] || { bg: "", text: "" };
          return (
            <Badge className={`${color.bg} ${color.text}`} variant="outline">
              {svc}
            </Badge>
          );
        },
      },
      { accessorKey: "partner", header: "Partner", size: 120 },
      {
        accessorKey: "referredBy",
        header: "Referred By",
        size: 140,
        cell: ({ getValue }: any) => getValue<string | null>() ?? <em>—</em>,
      },
      {
        accessorKey: "potentialRevenue",
        header: "Potential",
        size: 120,
        cell: ({ getValue }: any) => `$${getValue<number>().toLocaleString()}`,
      },
      {
        id: "view",
        header: () => <span className="sr-only">View</span>,
        size: 60,
        cell: (c: any) => (
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/prospects/${c.row.original.id}`}>View</Link>
          </Button>
        ),
      },
    ],
    []
  );

  /* ---------------- react-table instance -------------------- */
  const table = useReactTable({
    data: visibleFiltered,
    columns,
    state: { columnFilters: [] as ColumnFiltersState },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const rows = table.getRowModel().rows;

  /* ---------------- pagination helpers --------------------- */
  const loadMoreRows = () =>
    setVisibleRowCount((p) => Math.min(p + BATCH_INCREMENT, filtered.length));

  // Reset row count on filter changes
  useEffect(() => setVisibleRowCount(INITIAL_BATCH_SIZE), [filters]);

  /* ---------------- row renderer --------------------------- */
  const RenderRow = ({ index, style }: { index: number; style: CSSProperties }) =>
    rows[index] ? (
      <div
        style={style}
        className={
          "grid grid-cols-[180px_180px_120px_120px_140px_120px_60px] border-b px-2 py-1 text-sm " +
          (index % 2 ? "bg-muted/40" : "")
        }
      >
        {rows[index].getVisibleCells().map((cell) => (
          <div key={cell.id} className="truncate">
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </div>
        ))}
      </div>
    ) : null;

  /* ---------------- analytics cards ------------------------ */
  const analyticsData = useMemo(() => {
    const total = filtered.length;
    const thisWeek = filtered.filter(
      (f) => startOfWeek(new Date()) <= parseISO(f.createdAt)
    ).length;
    const revenue = filtered.reduce((s, p) => s + p.potentialRevenue, 0);
    return { total, thisWeek, revenue };
  }, [filtered]);

  /* ---------------- JSX ------------------------------------ */
  return (
    <div className="space-y-6">
      {/* -------- filter bar -------- */}
      <div className="flex flex-wrap gap-3 items-end">
        <Input
          placeholder="Search prospect / business…"
          className="w-[260px]"
          onChange={(e) =>
            setFilters((f) => ({ ...f, q: e.target.value || undefined }))
          }
        />

        {[
          { key: "service", label: "Service", vals: optionLists.service },
          { key: "partner", label: "Partner", vals: optionLists.partner },
          { key: "referredBy", label: "Referred By", vals: optionLists.referredBy },
        ].map(({ key, label, vals }) => (
          <Select
            key={key}
            value={(filters as any)[key] ?? "all"}
            onValueChange={(v) =>
              setFilters((f) => ({
                ...f,
                [key]: v === "all" ? undefined : v,
              }))
            }
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All {label}</SelectItem>
              {vals.map((v) => (
                <SelectItem key={v} value={v}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}

        <Select
          value={
            filters.isIndividual !== undefined
              ? String(filters.isIndividual)
              : "all"
          }
          onValueChange={(v) =>
            setFilters((f) => ({
              ...f,
              isIndividual: v === "all" ? undefined : v === "true",
            }))
          }
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Client Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="true">Individual</SelectItem>
            <SelectItem value="false">Business</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.minRevenue?.toString() ?? "all"}
          onValueChange={(v) =>
            setFilters((f) => ({
              ...f,
              minRevenue: v === "all" ? undefined : Number(v),
            }))
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Min. Potential Revenue" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any Revenue</SelectItem>
            <SelectItem value="1000">$1,000+</SelectItem>
            <SelectItem value="5000">$5,000+</SelectItem>
            <SelectItem value="10000">$10,000+</SelectItem>
            <SelectItem value="15000">$15,000+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* -------- KPIs -------- */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Total Prospects", analyticsData.total],
          ["New This Week", analyticsData.thisWeek],
          ["Potential Revenue", `$${analyticsData.revenue.toLocaleString()}`],
        ].map(([label, val]) => (
          <Card key={label as string}>
            <CardHeader>
              <CardTitle>{label}</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold">{val}</CardContent>
          </Card>
        ))}
      </div>

      {/* -------- table -------- */}
      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-[180px_180px_120px_120px_140px_120px_60px] bg-muted/20 p-2 text-xs font-semibold">
          {table.getFlatHeaders().map((h) => (
            <span key={h.id}>
              {flexRender(h.column.columnDef.header, h.getContext())}
            </span>
          ))}
        </div>
        <List height={height} itemCount={rows.length} itemSize={38} width="100%">
          {RenderRow}
        </List>

        {visibleRowCount < filtered.length && (
          <div className="border-t p-4 text-center">
            <Button variant="outline" onClick={loadMoreRows} className="gap-2">
              <ChevronDown className="h-4 w-4" />
              Load More (
              {Math.min(BATCH_INCREMENT, filtered.length - visibleRowCount)})
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
