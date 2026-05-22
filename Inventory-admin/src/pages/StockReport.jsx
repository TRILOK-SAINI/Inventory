import { useCallback, useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Loader2,
  Package,
  RefreshCw,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import api, { getApiError } from "../lib/api";

/* ══════════════════════════════════════════════════════════════
   SHARED SMALL COMPONENTS
══════════════════════════════════════════════════════════════ */
const StatCard = ({ label, value, icon: Icon, color }) => (
  <div
    className="rounded-2xl p-4"
    style={{
      background: "var(--bg-surface)",
      border: "1px solid var(--border)",
    }}
  >
    <div className="flex items-center justify-between">
      <div>
        <p
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--text-muted)" }}
        >
          {label}
        </p>
        <p
          className="text-2xl font-black mt-1"
          style={{ color: "var(--text-primary)" }}
        >
          {value}
        </p>
      </div>
      <div
        className="p-2 rounded-xl"
        style={{ background: color?.bg || "var(--accent-soft)" }}
      >
        <Icon
          size={18}
          style={{ color: color?.text || "var(--accent-text)" }}
        />
      </div>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════
   MINI CALENDAR  (highlights dates that have entries)
══════════════════════════════════════════════════════════════ */
function MiniCalendar({ selectedDate, onSelect, activeDates = [] }) {
  const [viewYear, setViewYear] = useState(() =>
    new Date(selectedDate).getFullYear(),
  );
  const [viewMonth, setViewMonth] = useState(() =>
    new Date(selectedDate).getMonth(),
  );

  const MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const toKey = (y, m, d) =>
    `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  return (
    <div
      className="rounded-2xl p-4 w-full"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-lg"
          style={{ background: "var(--bg-elevated)" }}
        >
          <ChevronLeft size={14} style={{ color: "var(--text-sec)" }} />
        </button>
        <span
          className="text-sm font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded-lg"
          style={{ background: "var(--bg-elevated)" }}
        >
          <ChevronRight size={14} style={{ color: "var(--text-sec)" }} />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div
            key={d}
            className="text-center text-[10px] font-bold py-1"
            style={{ color: "var(--text-muted)" }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Date cells */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={`e${idx}`} />;
          const key = toKey(viewYear, viewMonth, day);
          const isActive = activeDates.includes(key);
          const isSelected = key === selectedDate;
          const isToday = key === new Date().toISOString().slice(0, 10);

          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className="relative w-full aspect-square flex items-center justify-center rounded-lg text-xs font-semibold transition-all"
              style={{
                background: isSelected
                  ? "var(--accent)"
                  : isToday
                    ? "var(--accent-soft)"
                    : "transparent",
                color: isSelected
                  ? "#fff"
                  : isActive
                    ? "var(--accent-text)"
                    : "var(--text-sec)",
                fontWeight: isActive ? 700 : 500,
                border:
                  isToday && !isSelected
                    ? "1px solid var(--accent-border)"
                    : "1px solid transparent",
              }}
            >
              {day}
              {isActive && !isSelected && (
                <span
                  className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ background: "var(--accent)" }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   REPORT TAB
══════════════════════════════════════════════════════════════ */
export function ReportTab() {
  const today = new Date().toISOString().slice(0, 10);

  const [mode, setMode] = useState("day");
  const [selectedDate, setDate] = useState(today);
  const [activeDates, setActive] = useState([]);
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState({});
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Derive week / month / year from selectedDate
  const dateObj = new Date(selectedDate);
  const selYear = dateObj.getFullYear();
  const selMonth = dateObj.getMonth() + 1;

  // ISO week calc
  const isoWeek = (d) => {
    const date = new Date(d);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
    const w1 = new Date(date.getFullYear(), 0, 4);
    return (
      1 +
      Math.round(
        ((date.getTime() - w1.getTime()) / 86400000 -
          3 +
          ((w1.getDay() + 6) % 7)) /
          7,
      )
    );
  };
  const selWeek = isoWeek(selectedDate);

  // Fetch calendar active dates whenever visible month changes
  const fetchCalendar = useCallback(async (year, month) => {
    try {
      const { data } = await api.get("/stock-entries/calendar", {
        params: { year, month },
      });
      if (data.success) setActive(data.data);
    } catch {
      // Calendar markers are optional; the report table still loads without them.
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchCalendar(selYear, selMonth);
  }, [selYear, selMonth, fetchCalendar]);

  // Fetch report data
  const fetchReport = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError("");
      try {
        const params = { mode, page, limit: 20, year: selYear };
        if (mode === "day") params.date = selectedDate;
        if (mode === "week") params.week = selWeek;
        if (mode === "month") params.month = selMonth;

        const { data } = await api.get("/stock-entries/report", { params });
        if (!data.success) throw new Error(data.message);
        setEntries(data.data);
        setSummary(data.summary || {});
        setPagination(data.pagination);
      } catch (err) {
        setError(getApiError(err));
      } finally {
        setLoading(false);
      }
    },
    [mode, selectedDate, selWeek, selMonth, selYear],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchReport(1);
  }, [fetchReport]);

  const MODES = [
    { key: "day", label: "Day" },
    { key: "week", label: "Week" },
    { key: "month", label: "Month" },
  ];

  const fmtDate = (iso) =>
    new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-6">
      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-3">
        <div
          className="flex gap-1 p-1 rounded-xl"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
          }}
        >
          {MODES.map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{
                background: mode === m.key ? "var(--accent)" : "transparent",
                color: mode === m.key ? "#fff" : "var(--text-muted)",
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div
          className="text-sm font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          {mode === "day" && selectedDate}
          {mode === "week" && `Week ${selWeek}, ${selYear}`}
          {mode === "month" &&
            new Date(selectedDate).toLocaleDateString("en-IN", {
              month: "long",
              year: "numeric",
            })}
        </div>

        <button
          onClick={() => fetchReport(1)}
          className="ml-auto p-2 rounded-xl"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
          }}
        >
          <RefreshCw size={13} style={{ color: "var(--text-muted)" }} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar (left) */}
        <div className="lg:col-span-1">
          <MiniCalendar
            selectedDate={selectedDate}
            onSelect={(d) => {
              setDate(d);
              setMode("day");
            }}
            activeDates={activeDates}
          />
          <p
            className="text-xs mt-2 text-center"
            style={{ color: "var(--text-muted)" }}
          >
            Dots indicate days with entries
          </p>
        </div>

        {/* Report (right) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              ["Entries", summary.totalEntries ?? 0, ClipboardList, null],
              [
                "Added",
                summary.totalAdded ?? 0,
                ArrowUp,
                { bg: "rgba(74,222,128,0.1)", text: "#4ade80" },
              ],
              [
                "Removed",
                summary.totalRemoved ?? 0,
                ArrowDown,
                { bg: "var(--danger-soft)", text: "var(--danger-text)" },
              ],
              ["Products", summary.productsUpdated ?? 0, Package, null],
            ].map(([label, val, Icon, color]) => (
              <StatCard
                key={label}
                label={label}
                value={val}
                icon={Icon}
                color={color}
              />
            ))}
          </div>

          {/* Entries table */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Stock Entry Log
              </p>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {pagination.total} record{pagination.total !== 1 ? "s" : ""}
              </span>
            </div>

            {error && (
              <div
                className="px-4 py-3 text-sm"
                style={{ color: "var(--danger-text)" }}
              >
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2
                  size={22}
                  className="animate-spin"
                  style={{ color: "var(--accent)" }}
                />
              </div>
            ) : entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <BarChart3 size={28} style={{ color: "var(--text-muted)" }} />
                <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                  No entries for this period
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Use the Stock Entry tab to update stock
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      {[
                        "Product",
                        "Prev Qty",
                        "New Qty",
                        "Change",
                        "Notes",
                        "Time",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left font-semibold text-xs tracking-widest uppercase"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry, idx) => (
                      <tr
                        key={entry._id}
                        style={{
                          borderBottom:
                            idx < entries.length - 1
                              ? "1px solid var(--border-sub)"
                              : "none",
                        }}
                      >
                        <td className="px-4 py-3">
                          <p
                            className="font-semibold"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {entry.productName}
                          </p>
                          <p
                            className="text-xs font-mono"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {entry.productSku || entry.category || "-"}
                          </p>
                        </td>
                        <td
                          className="px-4 py-3 font-mono text-sm"
                          style={{ color: "var(--text-sec)" }}
                        >
                          {entry.previousQty}
                        </td>
                        <td
                          className="px-4 py-3 font-mono text-sm font-bold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {entry.newQty}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold"
                            style={{
                              background:
                                entry.change > 0
                                  ? "rgba(74,222,128,0.1)"
                                  : entry.change < 0
                                    ? "var(--danger-soft)"
                                    : "var(--bg-elevated)",
                              color:
                                entry.change > 0
                                  ? "#4ade80"
                                  : entry.change < 0
                                    ? "var(--danger-text)"
                                    : "var(--text-muted)",
                              border: `1px solid ${entry.change > 0 ? "rgba(74,222,128,0.25)" : entry.change < 0 ? "var(--danger-border)" : "var(--border)"}`,
                            }}
                          >
                            {entry.change > 0 ? (
                              <ArrowUp size={10} />
                            ) : entry.change < 0 ? (
                              <ArrowDown size={10} />
                            ) : null}
                            {entry.change > 0
                              ? `+${entry.change}`
                              : entry.change}
                          </span>
                        </td>
                        <td
                          className="px-4 py-3 text-xs max-w-35 truncate"
                          style={{ color: "var(--text-muted)" }}
                          title={entry.notes}
                        >
                          {entry.notes || "—"}
                        </td>
                        <td
                          className="px-4 py-3 text-xs whitespace-nowrap"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {fmtDate(entry.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {!loading && pagination.totalPages > 1 && (
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Page {pagination.page} of {pagination.totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchReport(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="w-8 h-8 rounded-lg text-xs disabled:opacity-40"
                    style={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <ChevronLeft
                      size={14}
                      className="mx-auto"
                      style={{ color: "var(--text-sec)" }}
                    />
                  </button>
                  <button
                    onClick={() => fetchReport(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="w-8 h-8 rounded-lg text-xs disabled:opacity-40"
                    style={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <ChevronRight
                      size={14}
                      className="mx-auto"
                      style={{ color: "var(--text-sec)" }}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StockReport() {
  useTheme();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1
            className="text-xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Stock Reports
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            View daily, weekly, and monthly stock changes
          </p>
        </div>
      </div>

      <ReportTab />
    </div>
  );
}
