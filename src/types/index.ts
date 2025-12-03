export interface Event {
  id: string;
  title: string;
  description: string | null;
  date: string;
  time?: string;
  location: string | null;
  location_details?: string;
  price: number | null;
  max_places: number | null;
  available_places: number | null;
  images: string[] | null;
  image_url?: string;
  is_visible: boolean | null;
  created_by: string | null;
  created_at: string | null;
  age_range: string | null;
  category: string | null;
}

export interface Reservation {
  id: string;
  event_id: string | null;
  user_id: string | null;
  number_of_places: number | null;
  total_price: number | null;
  status: 'confirmed' | 'cancelled' | 'pending' | null;
  payment_method: 'card' | 'cash' | null;
  payment_status: 'confirmed' | 'pending' | null;
  qr_code: string | null;
  created_at: string | null;
  buyer_name: string | null;
  buyer_email: string | null;
  buyer_phone: string | null;
  user_name: string | null;
  user_email: string | null;
  user_phone: string | null;
  event?: Event;
  tickets?: Ticket[];
}

export interface Ticket {
  id: string;
  reservation_id: string;
  reservation?: Reservation;
  participant_name: string;
  ticket_number: number;
  qr_code_data: string;
  qr_code_image?: string;
  status: 'valid' | 'used' | 'temporarily_valid' | 'cancelled';
  validated_at?: string;
  validated_by?: string;
  created_at?: string;
}

export interface QRCodeValidation {
  id: string;
  ticket_id: string;
  ticket?: Ticket;
  action: 'entry' | 'exit' | 'reentry' | 'validation_attempt';
  validated_by: string;
  validated_at: string;
  success: boolean;
  verification_email?: string;
  verification_phone?: string;
  notes?: string;
}

export interface PartyBuilderCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  order_index: number;
  is_active: boolean;
  created_at?: string;
}

export interface PartyBuilderOption {
  id: string;
  category: 'theme' | 'animation' | 'decoration' | 'cake' | 'goodies' | null;
  category_id?: string;
  name: string;
  description: string | null;
  price: number | null;
  emoji?: string;
  icon_url?: string;
  image_url: string | null;
  primary_color?: string;
  animation_type?: 'none' | 'gradient' | 'particles' | 'waves' | 'glow';
  animation_config?: {
    color1?: string;
    color2?: string;
    speed?: 'slow' | 'medium' | 'fast';
    direction?: 'horizontal' | 'vertical' | 'diagonal';
    intensity?: number;
  };
  max_quantity: number | null;
  is_active: boolean | null;
  order_index?: number;
  created_at?: string;
  updated_at?: string;
}

export interface PartyBuilderOrder {
  id: string;
  user_id: string | null;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  selected_options: SelectedOption[] | null;
  total_price: number | null;
  event_date: string | null;
  payment_method: 'card' | 'cash' | null;
  payment_status: 'confirmed' | 'pending' | null;
  status: 'draft' | 'confirmed' | 'cancelled' | null;
  created_at: string | null;
  child_name: string | null;
  child_age: number | null;
  location: string | null;
  guest_count: number | null;
  notes?: string;
}

export interface SelectedOption {
  option_id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
}

export interface Review {
  id: string;
  event_id: string | null;
  user_id: string | null;
  rating: number | null;
  comment: string | null;
  created_at: string | null;
  user_name: string | null;
}

export interface Animator {
  id: string;
  name: string;
  specialty: string | null;
  availability: any;
  photo_url: string | null;
  email: string | null;
  phone: string | null;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'client';
  phone?: string;
  avatar_url?: string;
}

// Additional types for new features
export interface CartItem {
  id: string;
  type: 'event' | 'party_builder';
  name: string;
  price: number;
  quantity: number;
  details?: any;
  image?: string;
}

export interface CheckoutFormData {
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  participants: string[];
  paymentMethod: 'card' | 'cash' | 'transfer' | 'stripe';
  cardNumber?: string;
  cardExpiry?: string;
  cardCVC?: string;
  cardName?: string;
}

export interface ValidationResult {
  success: boolean;
  ticket?: Ticket;
  reservation?: Reservation;
  message: string;
  action?: 'allow_entry' | 'deny_entry' | 'already_used' | 'invalid';
}

export interface StatsData {
  totalReservations: number;
  totalRevenue: number;
  totalTickets: number;
  ticketsValidated: number;
  ticketsPending: number;
  paymentsPending: number;
}

export interface GalleryPhoto {
  id: string;
  image_url: string;
  description?: string | null;
  display_order: number;
  created_at: string;
  updated_at?: string;
}
