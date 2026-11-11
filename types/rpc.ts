// jsonb arguments and results of RPCs are not derivable from the schema; shapes come from
// boleia-db/docs/api.md ("Формы jsonb"). Keep in sync when the contract changes.
import type { Database } from './database';


export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Views<T extends keyof Database['public']['Views']> = Database['public']['Views'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

export type PayoutMethod
  = | { type: 'mcx_express', phone: string }
    | { type: 'iban', iban: string, bank: string };

export interface UpsertProfilePayload {
  display_name?: string
  avatar_url?: string
  bio?: string
  birth_year?: number
  locale?: string
  payout_method?: PayoutMethod
  terms_accepted?: boolean
  adult_confirmed?: boolean
}

export interface UpsertVehiclePayload {
  id?: string
  make?: string
  model?: string
  color?: string
  year?: number
  plate?: string
  seats_total?: number
  photo_url?: string
  status?: Enums<'vehicle_status'>
}

export interface PublishTripPayload {
  vehicle_id: string
  origin_place_id: string
  destination_place_id: string
  origin_detail?: string
  destination_detail?: string
  departure_at: string
  seats_offered: number
  price_per_seat_kz: number
  booking_mode?: Enums<'booking_mode'>
  wait_minutes?: 30 | 45 | 60
  luggage?: Enums<'luggage_size'>
  max_two_in_back?: boolean
  notes?: string
}

export type UpdateTripPayload = Partial<Pick<PublishTripPayload,
  'price_per_seat_kz' | 'seats_offered' | 'notes' | 'luggage' | 'max_two_in_back'
  | 'origin_detail' | 'destination_detail' | 'departure_at' | 'booking_mode' | 'wait_minutes'>>;

export interface VerificationDocs {
  id_doc_url: string
  licence_url: string
  vehicle_photo_url: string
  selfie_url: string
}

export interface BookingPaymentResult {
  booking_id: string
  payment_id: string
  amount_kz: number
  price_total_kz: number
  fee_kz: number
  expires_at: string
}

export type RefundRule
  = 'driver_cancel' | 'driver_decline' | 'driver_unconfirmed'
    | 'passenger_withdraw' | 'passenger_early' | 'passenger_late';

export interface CancelQuote {
  refund_kz: number
  gateway_fee_kz: number
  held_kz: number
  rule: RefundRule
  counter: boolean
}

export interface CancelResult {
  status: 'cancelled' | 'declined'
  refund_kz: number
  held_kz: number
  rule: RefundRule
}

export type EnterPinResult
  = | { ok: true, pin_entered_at: string, already?: boolean }
    | { ok: false, attempts_left: number };

export interface RevealContactResult {
  user_id: string
  display_name: string
  phone: string
}

export interface PublishTripResult {
  id: string
  price_hint_kz: number | null
}

export interface PriceHint {
  price_hint_kz: number | null
  minutes: number | null
}

export interface DriverArrivedResult {
  driver_arrived_at: string
  wait_until: string
  already?: boolean
}

// Edge functions
export type PaymentInstructions
  = | { type: 'push', deep_link?: string, qr_payload?: string | null }
    | { type: 'qr', qr_payload: string }
    | { type: 'redirect', url: string };

export interface PaymentsInitResult {
  payment_id: string
  booking_id: string
  amount_kz: number
  expires_at: string
  instructions: PaymentInstructions | null
  already?: boolean
}

export interface PaymentsStatusResult {
  payment_id: string
  payment_status: Enums<'payment_status'>
  booking_status: Enums<'booking_status'>
}

// bookings.cancel_reason values set by the system (anything else is free text from a party)
export type SystemCancelReason
  = 'PAYMENT_PHONE_MISMATCH' | 'payment_expired' | 'trip_departed' | 'trip_cancelled'
    | 'no_response' | 'dispute_refund' | 'driver_no_show' | 'moderation';

// Admin (spec section 11)
export interface AdminUser {
  id: string
  display_name: string
  phone: string | null
  avatar_url: string | null
  status: Enums<'profile_status'>
  suspended_until: string | null
  is_admin: boolean
  driver_status: Enums<'driver_status'>
  rating_avg: number
  rating_count: number
  trips_driven: number
  trips_ridden: number
  cancels_total: number
  no_shows: number
  balance_kz: number
  created_at: string
  last_seen_at: string | null
}

export interface AdminStats {
  queues: {
    reports_open: number
    disputes: number
    verifications: number
    payouts: number
    refunds_pending: number
    refunds_manual: number
  }
  today: { new_users: number, trips_published: number, bookings_paid: number, gmv_kz: number, payment_failed: number }
  week: { new_users: number, trips_published: number, bookings_paid: number, gmv_kz: number, fee_kz: number }
  health: {
    notifications_failed_24h: number
    reconciliation_mismatches_7d: number
    scheduler_errors: { job: string, error: string, at: string | null }[]
    scheduler_last_run: string | null
  }
}

export type ModerationAction = 'warn' | 'restrict' | 'suspend' | 'ban' | 'unban';
export type DisputeOutcome = 'completed' | 'refund_full' | 'refund_partial';

export interface AdminCancelTripResult {
  cancelled_bookings: number
  refunded_kz: number
}

export interface AdminCancelBookingResult {
  status: Enums<'booking_status'>
  refund_kz: number
}

export interface AdminPlacePayload {
  id?: string
  name: string
  province: string
  slug: string
  kind: Enums<'place_kind'>
  lat: number | null
  lng: number | null
  aliases: string[]
  is_active: boolean
}

export interface AdminWeek {
  week_start: string
  new_users: number
  trips_published: number
  requests: number
  paid: number
  accepted: number
  completed: number
  cancelled_by_passenger: number
  cancelled_by_driver: number
  cancelled_by_system: number
  gmv_kz: number
  fee_kz: number
  refunds_kz: number
  driver_response_hours: number | null
  verification_hours: number | null
  top_routes: { origin: string, destination: string, paid: number }[]
}
