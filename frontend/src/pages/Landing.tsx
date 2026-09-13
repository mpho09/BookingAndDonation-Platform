import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import type { Campaign } from "../types";

export function Landing() {
  const [campaign, setCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    api
      .get<{ campaigns: Campaign[] }>("/campaigns?active=true")
      .then(({ campaigns }) => setCampaign(campaigns[0] ?? null))
      .catch(() => setCampaign(null));
  }, []);

  const pct = campaign ? Math.min(100, Math.round((campaign.current_amount / campaign.goal_amount) * 100)) : 0;

  return (
    <div className="space-y-16">
      <section className="grid gap-8 sm:grid-cols-[1.3fr,1fr] sm:items-center">
        <div>
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-river">Since 2011</p>
          <h1 className="font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">
            A place on the water for the whole neighbourhood to gather.
          </h1>
          <p className="mt-5 max-w-md text-ink/70">
            Youth programmes, a small gym, and meeting rooms — run by the community, for the community.
            Become a member to book a space, or chip in to this winter's food-parcel drive.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/facilities" className="btn-primary">
              Browse facilities
            </Link>
            <Link to="/donate" className="btn-secondary">
              Support the drive
            </Link>
          </div>
        </div>

        <div className="card">
          <h2 className="font-display text-lg font-semibold text-ink">This week</h2>
          <ul className="mt-4 space-y-3 text-sm text-ink/70">
            <li className="flex justify-between border-b border-ink/10 pb-2">
              <span>Youth homework club</span>
              <span className="text-ink/50">Tue &amp; Thu, 3pm</span>
            </li>
            <li className="flex justify-between border-b border-ink/10 pb-2">
              <span>Open gym hours</span>
              <span className="text-ink/50">Mon–Fri, 6–9am</span>
            </li>
            <li className="flex justify-between">
              <span>Parcel packing morning</span>
              <span className="text-ink/50">Saturday, 9am</span>
            </li>
          </ul>
        </div>
      </section>

      {campaign && (
        <section className="card border-gold/30 bg-gold-light/40">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-xl font-semibold text-ink">{campaign.title}</h2>
            <span className="text-sm text-ink/60">
              R{campaign.current_amount.toLocaleString()} of R{campaign.goal_amount.toLocaleString()}
            </span>
          </div>
          {campaign.description && <p className="mt-2 text-sm text-ink/70">{campaign.description}</p>}
          <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-white">
            <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
          </div>
          <Link to="/donate" className="btn-gold mt-5 inline-flex">
            Donate now
          </Link>
        </section>
      )}

      <section className="grid gap-6 sm:grid-cols-3">
        {[
          { title: "Youth programmes", copy: "After-school clubs, tutoring, and holiday activities for ages 6–17." },
          { title: "Facilities", copy: "Meeting rooms, the main hall, and a small gym — book online in minutes." },
          { title: "Food parcels", copy: "Weekly parcels for families in the area, packed by volunteers each Saturday." },
        ].map((item) => (
          <div key={item.title} className="border-t-2 border-river pt-4">
            <h3 className="font-display text-lg font-semibold text-ink">{item.title}</h3>
            <p className="mt-1.5 text-sm text-ink/70">{item.copy}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
