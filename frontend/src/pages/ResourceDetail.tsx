import { useEffect, useState, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { Resource } from "../types";

interface AvailabilityBooking {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
}

export function ResourceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session } = useAuth();

  const [resource, setResource] = useState<Resource | null>(null);
  const [booked, setBooked] = useState<AvailabilityBooking[]>([]);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get<{ resources: Resource[] }>("/resources")
      .then(({ resources }) => setResource(resources.find((r) => r.id === id) ?? null));
    api
      .get<{ bookings: AvailabilityBooking[] }>(`/resources/${id}/availability`)
      .then(({ bookings }) => setBooked(bookings))
      .catch(() => setBooked([]));
  }, [id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!session) {
      navigate("/login", { state: { from: `/facilities/${id}` } });
      return;
    }
    if (!date || !startTime || !endTime) {
      setError("Pick a date, start time, and end time.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/bookings", {
        resource_id: id,
        start_time: new Date(`${date}T${startTime}`).toISOString(),
        end_time: new Date(`${date}T${endTime}`).toISOString(),
        notes: notes || undefined,
      });
      setSuccess("Request sent — staff will review it and you'll see the status in My bookings.");
      setNotes("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!resource) return <p className="text-ink/50">Loading…</p>;

  return (
    <div className="grid gap-10 sm:grid-cols-[1fr,1.1fr]">
      <div>
        <h1 className="font-display text-3xl font-semibold text-ink">{resource.name}</h1>
        {resource.capacity && <p className="mt-1 text-ink/60">Capacity: {resource.capacity}</p>}
        {resource.description && <p className="mt-3 text-ink/70">{resource.description}</p>}

        <h2 className="mt-8 font-display text-lg font-semibold text-ink">Upcoming bookings</h2>
        {booked.length === 0 ? (
          <p className="mt-2 text-sm text-ink/50">Nothing booked in the next 30 days.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {booked.map((b) => (
              <li key={b.id} className="flex justify-between border-b border-ink/10 pb-2 text-sm text-ink/70">
                <span>
                  {new Date(b.start_time).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}{" "}
                  – {new Date(b.end_time).toLocaleTimeString(undefined, { timeStyle: "short" })}
                </span>
                <span className="capitalize text-ink/50">{b.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <h2 className="font-display text-lg font-semibold text-ink">Request a booking</h2>

        <div>
          <label className="label" htmlFor="date">
            Date
          </label>
          <input id="date" type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="start">
              Start time
            </label>
            <input
              id="start"
              type="time"
              className="field"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="end">
              End time
            </label>
            <input
              id="end"
              type="time"
              className="field"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="notes">
            Notes for staff (optional)
          </label>
          <textarea id="notes" className="field" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        {error && <p className="text-sm text-clay">{error}</p>}
        {success && <p className="text-sm text-moss">{success}</p>}

        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? "Sending…" : session ? "Request booking" : "Log in to request a booking"}
        </button>
      </form>
    </div>
  );
}
