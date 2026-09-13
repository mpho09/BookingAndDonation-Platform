import type { BookingStatus } from "../types";

const STYLES: Record<BookingStatus, string> = {
  pending: "bg-gold-light text-gold",
  approved: "bg-moss/15 text-moss",
  rejected: "bg-clay/15 text-clay",
  cancelled: "bg-ink/10 text-ink/50",
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  return <span className={`badge ${STYLES[status]}`}>{status}</span>;
}
