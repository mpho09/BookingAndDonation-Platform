import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import type { Resource } from "../types";

export function Facilities() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<{ resources: Resource[] }>("/resources")
      .then(({ resources }) => setResources(resources))
      .catch(() => setError("Couldn't load the facilities list. Is the API running?"));
  }, []);

  const rooms = resources.filter((r) => r.type === "room");
  const equipment = resources.filter((r) => r.type === "equipment");

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-semibold text-ink">Facilities &amp; equipment</h1>
        <p className="mt-2 max-w-xl text-ink/70">
          Members can request a booking below. Staff review every request before it's confirmed.
        </p>
      </div>

      {error && <p className="card border-clay/30 bg-clay/5 text-clay">{error}</p>}

      <section>
        <h2 className="mb-4 font-display text-xl font-semibold text-ink">Rooms</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {rooms.map((r) => (
            <ResourceCard key={r.id} resource={r} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl font-semibold text-ink">Equipment</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {equipment.map((r) => (
            <ResourceCard key={r.id} resource={r} />
          ))}
        </div>
      </section>
    </div>
  );
}

function ResourceCard({ resource }: { resource: Resource }) {
  return (
    <div className="card flex flex-col justify-between">
      <div>
        <h3 className="font-display text-lg font-semibold text-ink">{resource.name}</h3>
        {resource.capacity && <p className="mt-1 text-sm text-ink/60">Capacity: {resource.capacity}</p>}
        {resource.description && <p className="mt-2 text-sm text-ink/70">{resource.description}</p>}
      </div>
      <Link to={`/facilities/${resource.id}`} className="btn-secondary mt-4 self-start text-sm">
        Check availability
      </Link>
    </div>
  );
}
