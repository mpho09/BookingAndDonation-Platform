export type UserRole = "member" | "staff" | "admin";
export type MembershipTier = "free" | "standard" | "family";
export type ResourceType = "room" | "equipment";
export type BookingStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  membership_tier: MembershipTier;
  joined_at: string;
  expiring_soon?: boolean;
}

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  capacity: number | null;
  description: string | null;
  active: boolean;
}

export interface Booking {
  id: string;
  resource_id: string;
  member_id: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  notes: string | null;
  created_at: string;
  resource?: { name: string; type: ResourceType };
  member?: { full_name: string };
}

export interface Campaign {
  id: string;
  title: string;
  description: string | null;
  goal_amount: number;
  current_amount: number;
  active: boolean;
}

export interface Donation {
  id: string;
  donor_id: string | null;
  campaign_id: string | null;
  amount: number;
  is_recurring: boolean;
  donor_name: string | null;
  donor_email: string | null;
  created_at: string;
  campaign?: { title: string };
}

export interface AppNotification {
  id: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface AdminReport {
  bookings_this_month: number;
  pending_bookings: number;
  total_donations: number;
  active_members: number;
}
