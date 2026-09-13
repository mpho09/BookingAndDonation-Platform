import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api, ApiError } from "../lib/api";
import { StatusBadge } from "../components/StatusBadge";
import type { AppNotification, Booking } from "../types";

export function MemberDashboard() {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [error, setError] = useState("");

  function load() {
    api
      .get<{ bookings: Booking[] }>("/bookings/mine")
      .then(({ bookings }) => setBookings(bookings))
      .catch(() => setError("Couldn't load your bookings."));
    api
      .get<{ notifications: AppNotification[] }>("/notifications/mine")
      .then(({ notifications }) => setNotifications(notifications))
      .catch(() => {});
  }

  useEffect(load, []);

  async function cancelBooking(id: string) {
    try {
      await api.patch(`/bookings/${id}/cancel`);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't cancel that booking.");
    }
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-semibold text-ink">
          Welcome back{profile ? `, ${profile.full_name.split(" ")[0]}` : ""}
        </h1>
        {profile && (
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <span className="badge bg-river-light text-river-dark capitalize">
              {profile.membership_tier} member
            </span>
            {profile.expiring_soon && (
              <span className="badge bg-gold-light text-gold">Membership expiring soon</span>
            )}
          </div>
        )}
      </div>

      {error && <p className="card border-clay/30 bg-clay/5 text-clay">{error}</p>}

      <section>
        <h2 className="mb-4 font-display text-xl font-semibold text-ink">Your bookings</h2>
        {bookings.length === 0 ? (
          <p className="text-sm text-ink/50">No bookings yet — browse facilities to request one.</p>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <div key={b.id} className="card flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">{b.resource?.name}</p>
                  <p className="text-sm text-ink/60">
                    {new Date(b.start_time).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })} –{" "}
                    {new Date(b.end_time).toLocaleTimeString(undefined, { timeStyle: "short" })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={b.status} />
                  {b.status === "pending" && (
                    <button onClick={() => cancelBooking(b.id)} className="text-sm text-clay underline">
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl font-semibold text-ink">Notifications</h2>
        {notifications.length === 0 ? (
          <p className="text-sm text-ink/50">Nothing new.</p>
        ) : (
          <ul className="space-y-2">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`card text-sm ${n.read ? "text-ink/50" : "border-river/30 bg-river-light/40 text-ink"}`}
              >
                {n.message}
                <span className="ml-2 text-xs text-ink/40">
                  {new Date(n.created_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
