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
  created_at: string;
}

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  capacity: number | null;
  description: string | null;
  active: boolean;
  created_at: string;
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
}

export interface Campaign {
  id: string;
  title: string;
  description: string | null;
  goal_amount: number;
  current_amount: number;
  active: boolean;
  created_at: string;
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
}

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  read: boolean;
  created_at: string;
}

/** This is the shape shared with the frontend for every API response. */
export interface ApiError {
  error: string;
  details?: unknown;
}
