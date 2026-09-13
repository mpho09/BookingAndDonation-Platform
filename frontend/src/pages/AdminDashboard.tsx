import { useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";
import { StatusBadge } from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import type { AdminReport, Booking, Donation, Profile } from "../types";

const API_BASE = (import.meta.env.VITE_API_URL as string) || "http://localhost:4000/api";

type Tab = "bookings" | "members" | "donations";

export function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("bookings");
  const [report, setReport] = useState<AdminReport | null>(null);

  useEffect(() => {
    api.get<AdminReport>("/admin/reports").then(setReport).catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-semibold text-ink">Staff dashboard</h1>

      {report && (
        <div className="grid gap-4 sm:grid-cols-4">
          <ReportCard label="Bookings this month" value={report.bookings_this_month} />
          <ReportCard label="Pending approval" value={report.pending_bookings} accent />
          <ReportCard label="Total donations" value={`R${report.total_donations.toLocaleString()}`} />
          <ReportCard label="Active members" value={report.active_members} />
        </div>
      )}

      <div className="flex gap-2 border-b border-ink/10">
        {(["bookings", "members", "donations"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-medium capitalize ${
              tab === t ? "border-b-2 border-river text-ink" : "text-ink/50"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "bookings" && <BookingsQueue />}
      {tab === "members" && <MemberDirectory />}
      {tab === "donations" && <DonationsPanel />}
    </div>
  );
}

function ReportCard({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={`card ${accent ? "border-gold/40 bg-gold-light/30" : ""}`}>
      <p className="text-sm text-ink/60">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}

function BookingsQueue() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [error, setError] = useState("");

  function load() {
    api
      .get<{ bookings: Booking[] }>(`/bookings?status=${statusFilter}`)
      .then(({ bookings }) => setBookings(bookings))
      .catch(() => setError("Couldn't load bookings."));
  }

  useEffect(load, [statusFilter]);

  async function setStatus(id: string, status: "approved" | "rejected") {
    try {
      await api.patch(`/bookings/${id}/status`, { status });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't update that booking.");
    }
  }

  return (
    <div className="space-y-4">
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="field w-48"
      >
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
        <option value="cancelled">Cancelled</option>
      </select>

      {error && <p className="text-sm text-clay">{error}</p>}

      {bookings.length === 0 ? (
        <p className="text-sm text-ink/50">Nothing here.</p>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="card flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-ink">
                  {b.resource?.name} — {b.member?.full_name}
                </p>
                <p className="text-sm text-ink/60">
                  {new Date(b.start_time).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })} –{" "}
                  {new Date(b.end_time).toLocaleTimeString(undefined, { timeStyle: "short" })}
                </p>
                {b.notes && <p className="mt-1 text-sm text-ink/50">"{b.notes}"</p>}
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={b.status} />
                {b.status === "pending" && (
                  <>
                    <button onClick={() => setStatus(b.id, "approved")} className="btn-secondary text-sm">
                      Approve
                    </button>
                    <button
                      onClick={() => setStatus(b.id, "rejected")}
                      className="btn-secondary text-sm text-clay"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MemberDirectory() {
  const [members, setMembers] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      api
        .get<{ profiles: Profile[] }>(`/profiles?search=${encodeURIComponent(search)}`)
        .then(({ profiles }) => setMembers(profiles))
        .catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div className="space-y-4">
      <input
        className="field w-64"
        placeholder="Search by name…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-left text-ink/50">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Tier</th>
              <th className="px-4 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-b border-ink/5 last:border-0">
                <td className="px-4 py-3 text-ink">{m.full_name}</td>
                <td className="px-4 py-3 capitalize text-ink/70">{m.role}</td>
                <td className="px-4 py-3 capitalize text-ink/70">{m.membership_tier}</td>
                <td className="px-4 py-3 text-ink/70">{new Date(m.joined_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DonationsPanel() {
  const { session } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);

  useEffect(() => {
    api
      .get<{ donations: Donation[] }>("/donations")
      .then(({ donations }) => setDonations(donations))
      .catch(() => {});
  }, []);

  async function exportCsv() {
    const res = await fetch(`${API_BASE}/donations/export`, {
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "donations.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <button onClick={exportCsv} className="btn-secondary text-sm">
        Export CSV
      </button>
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-left text-ink/50">
              <th className="px-4 py-3 font-medium">Donor</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Campaign</th>
              <th className="px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {donations.map((d) => (
              <tr key={d.id} className="border-b border-ink/5 last:border-0">
                <td className="px-4 py-3 text-ink">{d.donor_name || "Anonymous"}</td>
                <td className="px-4 py-3 text-ink/70">
                  R{Number(d.amount).toLocaleString()}
                  {d.is_recurring ? " / mo" : ""}
                </td>
                <td className="px-4 py-3 text-ink/70">{d.campaign?.title ?? "—"}</td>
                <td className="px-4 py-3 text-ink/70">{new Date(d.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
