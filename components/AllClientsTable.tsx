/* ------------------------------------------------------------------ */
/*  AllClientsTable – standalone “All Clients” engagement list        */
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
import { format, parseISO, isAfter, isBefore, startOfWeek } from "date-fns";
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
import { ChevronDown, FileText } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface FirmEngagement {
  id: number;
  clientName: string;
  businessName: string | null;
  service: string;
  partner: string;
  referral: string | null;
  status: string;
  createdAt: string;
  dueDate?: string;
  documents: number;
}

interface Props {
  data: FirmEngagement[];
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

export default function AllClientsTable({
  data = [],
  height = 560,
}: Props) {
  /* ------------------------ UI state ------------------------ */
  const [visibleRowCount, setVisibleRowCount] = useState(INITIAL_BATCH_SIZE);

  const [filters, setFilters] = useState<{
    q?: string;
    service?: string;
    partner?: string;
    status?: string;
    referral?: string;
    from?: string;
    to?: string;
    lateOnly?: boolean;
  }>({});

  /* ------------------------ filter fn ----------------------- */
  const applyFilters = useCallback(
    (rows: FirmEngagement[]) =>
      rows.filter((r) => {
        if (
          filters.q &&
          !`${r.clientName} ${r.businessName ?? ""}`
            .toLowerCase()
            .includes(filters.q.toLowerCase())
        )
          return false;

        if (filters.service && r.service !== filters.service) return false;
        if (filters.partner && r.partner !== filters.partner) return false;
        if (filters.status && r.status !== filters.status) return false;
        if (filters.referral && (r.referral ?? "—") !== filters.referral)
          return false;

        if (filters.from || filters.to || filters.lateOnly) {
          if (!r.dueDate) return !filters.lateOnly;
          const due = parseISO(r.dueDate);
          if (filters.from && isBefore(due, parseISO(filters.from!)))
            return false;
          if (filters.to && isAfter(due, parseISO(filters.to!))) return false;
          if (filters.lateOnly && !isAfter(new Date(), due)) return false;
        }
        return true;
      }),
    [filters]
  );

  /* ---------------- filtered / paginated data --------------- */
  const filtered = useDeferredValue(useMemo(() => applyFilters(data), [applyFilters, data]));

  const visibleFiltered = useMemo(
    () => filtered.slice(0, visibleRowCount),
    [filtered, visibleRowCount]
  );

  /* ---------------- dropdown option snapshots --------------- */
  const optionLists = useMemo(() => {
    const service = new Set<string>();
    const partner = new Set<string>();
    const status = new Set<string>();
    const referral = new Set<string>();

    data.slice(0, 100).forEach((d) => {
      service.add(d.service);
      partner.add(d.partner);
      status.add(d.status);
      referral.add(d.referral ?? "—");
    });
    return {
      service: [...service].sort(),
      partner: [...partner].sort(),
      status: [...status].sort(),
      referral: [...referral].sort(),
    };
  }, [data]);

  /* ---------------- react-table columns --------------------- */
  const columns = useMemo(
    () => [
      {
        accessorKey: "clientName",
        header: "Client",
        size: 180,
        cell: (c: any) => (
          <Link
            href={`/projects/${c.row.original.id}`}
            className="underline underline-offset-2"
          >
            {c.getValue()}
          </Link>
        ),
      },
      {
        accessorKey: "businessName",
        header: "Business",
        size: 180,
        cell: ({ getValue }: any) => getValue<string | null>() ?? <em>—</em>,
      },
      {
        accessorKey: "service",
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
        accessorKey: "dueDate",
        header: "Due",
        size: 120,
        cell: ({ getValue }: any) =>
          getValue<string>()
            ? format(parseISO(getValue<string>()), "MMM d, yy")
            : "—",
      },
      { accessorKey: "status", header: "Status", size: 120 },
      {
        accessorKey: "documents",
        header: "Docs",
        size: 80,
        cell: ({ getValue }: any) => {
          const count = getValue<number>();
          return (
            <div className="flex items-center gap-1">
              <FileText
                size={16}
                className={count > 0 ? "text-blue-600" : "text-gray-400"}
              />
              <span>{count}</span>
            </div>
          );
        },
      },
      {
        id: "view",
        header: () => <span className="sr-only">View</span>,
        size: 60,
        cell: (c: any) => (
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/projects/${c.row.original.id}`}>View</Link>
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
          "grid grid-cols-[180px_180px_120px_120px_120px_120px_80px_60px] border-b px-2 py-1 text-sm " +
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
    const late = filtered.filter(
      (f) => f.dueDate && isAfter(new Date(), parseISO(f.dueDate))
    ).length;
    const thisWeekNew = filtered.filter(
      (f) => startOfWeek(new Date()) <= parseISO(f.createdAt)
    ).length;
    return { total, late, thisWeekNew };
  }, [filtered]);

  /* ---------------- JSX ------------------------------------ */
  return (
    <div className="space-y-6">
      {/* -------- filter bar -------- */}
      <div className="flex flex-wrap gap-3 items-end">
        <Input
          placeholder="Search client / business…"
          className="w-[260px]"
          onChange={(e) =>
            setFilters((f) => ({ ...f, q: e.target.value || undefined }))
          }
        />

        {[
          { key: "service", label: "Service", vals: optionLists.service },
          { key: "partner", label: "Partner", vals: optionLists.partner },
          { key: "status", label: "Status", vals: optionLists.status },
          { key: "referral", label: "Referral", vals: optionLists.referral },
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

        <Input
          type="date"
          className="w-[140px]"
          value={filters.from ?? ""}
          onChange={(e) =>
            setFilters((f) => ({ ...f, from: e.target.value || undefined }))
          }
        />
        <span>—</span>
        <Input
          type="date"
          className="w-[140px]"
          value={filters.to ?? ""}
          onChange={(e) =>
            setFilters((f) => ({ ...f, to: e.target.value || undefined }))
          }
        />

        <Button
          variant={filters.lateOnly ? "default" : "outline"}
          onClick={() =>
            setFilters((f) => ({
              ...f,
              lateOnly: f.lateOnly ? undefined : true,
            }))
          }
        >
          Late only
        </Button>
      </div>

      {/* -------- KPIs -------- */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Total Engagements", analyticsData.total],
          ["Past Due", analyticsData.late],
          ["New This Week", analyticsData.thisWeekNew],
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
        <div className="grid grid-cols-[180px_180px_120px_120px_120px_120px_80px_60px] bg-muted/20 p-2 text-xs font-semibold">
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
