import { useEffect, useState, type FormEvent } from "react";
import { api, ApiError } from "../lib/api";
import type { Campaign } from "../types";

const PRESETS = [100, 250, 500, 1000];

export function Donate() {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [amount, setAmount] = useState<number | "">(250);
  const [recurring, setRecurring] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get<{ campaigns: Campaign[] }>("/campaigns?active=true")
      .then(({ campaigns }) => setCampaign(campaigns[0] ?? null));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!amount || amount <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/donations", {
        amount,
        campaign_id: campaign?.id,
        is_recurring: recurring,
        donor_name: name || undefined,
        donor_email: email || undefined,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const pct = campaign ? Math.min(100, Math.round((campaign.current_amount / campaign.goal_amount) * 100)) : 0;

  if (success) {
    return (
      <div className="card mx-auto max-w-md text-center">
        <h1 className="font-display text-2xl font-semibold text-ink">Thank you</h1>
        <p className="mt-3 text-ink/70">
          {recurring
            ? "We've logged your pledge to adopt a food parcel. A staff member will follow up about ongoing collection."
            : "Your donation has been recorded and will go straight toward this winter's parcels."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-10 sm:grid-cols-[1fr,1.1fr]">
      <div>
        <h1 className="font-display text-3xl font-semibold text-ink">
          {campaign?.title ?? "Support Riverside"}
        </h1>
        <p className="mt-3 text-ink/70">
          {campaign?.description ?? "Your donation helps fund youth programmes and the food-parcel drive."}
        </p>
        {campaign && (
          <div className="mt-6">
            <div className="flex justify-between text-sm text-ink/60">
              <span>R{campaign.current_amount.toLocaleString()} raised</span>
              <span>Goal R{campaign.goal_amount.toLocaleString()}</span>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-ink/10">
              <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <span className="label">Amount (ZAR)</span>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => setAmount(p)}
                className={`btn-secondary text-sm ${amount === p ? "border-river bg-river-light" : ""}`}
              >
                R{p}
              </button>
            ))}
          </div>
          <input
            type="number"
            min={1}
            className="field mt-2"
            value={amount}
            onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-ink/70">
          <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} />
          Adopt a food parcel (monthly pledge — logged as intent, no card charged automatically)
        </label>

        <div>
          <label className="label" htmlFor="name">
            Name (optional — leave blank to give anonymously)
          </label>
          <input id="name" className="field" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div>
          <label className="label" htmlFor="email">
            Email (optional)
          </label>
          <input
            id="email"
            type="email"
            className="field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-clay">{error}</p>}

        <button type="submit" className="btn-gold w-full" disabled={submitting}>
          {submitting ? "Processing…" : `Give R${amount || 0}`}
        </button>
      </form>
    </div>
  );
}
