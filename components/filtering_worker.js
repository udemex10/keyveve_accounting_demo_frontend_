/* ------------------------------------------------------------------ */
/*  filtering_worker.js  —  runs ALL heavy row-filtering off-thread   */
/* ------------------------------------------------------------------ */
/*  This is an ES-module worker (note the { type:"module" } flag in   */
/*  new Worker() below).  Anything it receives is shaped like:        *
 *  { id, kind:"engagements"|"prospects", rows, filters }             *
 *  and replies with { id, kind, rows: filteredRows }.                */
/* ------------------------------------------------------------------ */

import { parseISO, isAfter, isBefore } from "date-fns";

self.onmessage = (e) => {
  const { id, kind, rows, filters } = e.data;

  const out =
    kind === "engagements"
      ? rows.filter((r) => {
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
            if (filters.from && isBefore(due, parseISO(filters.from))) return false;
            if (filters.to && isAfter(due, parseISO(filters.to))) return false;
            if (filters.lateOnly && !isAfter(new Date(), due)) return false;
          }
          return true;
        })
      : rows.filter((r) => {
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
        });

  /*  send the filtered data back  */
  self.postMessage({ id, kind, rows: out });
};
