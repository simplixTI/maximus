export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "client" | "provider" | "admin";
export type MembershipTier = "essential" | "plus" | "premium";
export type RequestStatus =
  | "draft"
  | "quoted"
  | "paid"
  | "matched"
  | "in_progress"
  | "completed"
  | "cancelled";
export type QuoteStatus = "pending" | "accepted" | "declined" | "revision_requested" | "expired";
export type BookingStatus =
  | "confirmed"
  | "en_route"
  | "arrived"
  | "in_progress"
  | "completed"
  | "cancelled";
export type PaymentStatus = "pending" | "authorized" | "captured" | "refunded" | "failed";
export type DocumentStatus = "pending" | "verified" | "rejected" | "expired";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          full_name: string | null;
          phone: string | null;
          email: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      client_profiles: {
        Row: {
          user_id: string;
          address: string | null;
          city: string | null;
          state: string | null;
          zip: string | null;
          stripe_customer_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["client_profiles"]["Row"]> & { user_id: string };
        Update: Partial<Database["public"]["Tables"]["client_profiles"]["Row"]>;
      };
      provider_profiles: {
        Row: {
          user_id: string;
          business_name: string | null;
          ein: string | null;
          address: string | null;
          city: string | null;
          state: string | null;
          zip: string | null;
          bio: string | null;
          verified: boolean;
          online: boolean;
          rating_avg: number;
          jobs_completed: number;
          stripe_account_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["provider_profiles"]["Row"]> & { user_id: string };
        Update: Partial<Database["public"]["Tables"]["provider_profiles"]["Row"]>;
      };
      provider_documents: {
        Row: {
          id: string;
          provider_id: string;
          type: string;
          file_url: string;
          status: DocumentStatus;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          provider_id: string;
          type: string;
          file_url: string;
          status?: DocumentStatus;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["provider_documents"]["Row"]>;
      };
      provider_skills: {
        Row: {
          id: string;
          provider_id: string;
          skill: string;
          license_url: string | null;
          license_status: DocumentStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          provider_id: string;
          skill: string;
          license_url?: string | null;
          license_status?: DocumentStatus;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["provider_skills"]["Row"]>;
      };
      service_requests: {
        Row: {
          id: string;
          client_id: string;
          category: string;
          description: string;
          address: string;
          photos: string[];
          status: RequestStatus;
          scheduled_at: string | null;
          estimated_cost: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          category: string;
          description: string;
          address: string;
          photos?: string[];
          status?: RequestStatus;
          scheduled_at?: string | null;
          estimated_cost?: number | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["service_requests"]["Row"]>;
      };
      quotes: {
        Row: {
          id: string;
          request_id: string;
          admin_id: string | null;
          amount: number;
          scope: string;
          notes: string | null;
          status: QuoteStatus;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          admin_id?: string | null;
          amount: number;
          scope: string;
          notes?: string | null;
          status?: QuoteStatus;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["quotes"]["Row"]>;
      };
      bookings: {
        Row: {
          id: string;
          request_id: string;
          quote_id: string;
          client_id: string;
          provider_id: string | null;
          status: BookingStatus;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          quote_id: string;
          client_id: string;
          provider_id?: string | null;
          status?: BookingStatus;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["bookings"]["Row"]>;
      };
      booking_status_events: {
        Row: {
          id: string;
          booking_id: string;
          status: BookingStatus;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          status: BookingStatus;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["booking_status_events"]["Row"]>;
      };
      payments: {
        Row: {
          id: string;
          booking_id: string;
          stripe_payment_intent_id: string | null;
          amount: number;
          platform_fee: number;
          provider_payout: number;
          status: PaymentStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          stripe_payment_intent_id?: string | null;
          amount: number;
          platform_fee: number;
          provider_payout: number;
          status?: PaymentStatus;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Row"]>;
      };
      reviews: {
        Row: {
          id: string;
          booking_id: string;
          reviewer_id: string;
          reviewee_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          reviewer_id: string;
          reviewee_id: string;
          rating: number;
          comment?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reviews"]["Row"]>;
      };
      memberships: {
        Row: {
          id: string;
          user_id: string;
          tier: MembershipTier;
          stripe_subscription_id: string | null;
          status: string;
          current_period_end: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tier: MembershipTier;
          stripe_subscription_id?: string | null;
          status: string;
          current_period_end?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["memberships"]["Row"]>;
      };
      chat_messages: {
        Row: {
          id: string;
          booking_id: string;
          sender_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          sender_id: string;
          content: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["chat_messages"]["Row"]>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          body?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Row"]>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      providers_within_radius: {
        Args: { lat: number; lng: number; radius_m: number };
        Returns: {
          provider_id: string;
          business_name: string;
          rating_avg: number;
          distance_m: number;
        }[];
      };
    };
    Enums: Record<string, never>;
  };
}
