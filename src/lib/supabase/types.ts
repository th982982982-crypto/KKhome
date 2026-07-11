export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    Tables: {
      templates: {
        Row: {
          id: string
          slug: string
          name: string
          sku: string | null
          description: string | null
          category: string | null
          thumbnail_url: string | null
          gallery_urls: string[]
          google_sheet_embed_url: string | null
          google_sheet_copy_url: string | null
          tutorial_video_url: string | null
          sale_price: number | null
          original_price: number | null
          tags: string[] | null
          is_published: boolean
          sort_order: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['templates']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['templates']['Insert']>
      }
      packages: {
        Row: {
          id: string
          slug: string
          name: string
          description: string | null
          sale_price: number
          original_price: number | null
          features: Json | null
          is_active: boolean
          sort_order: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['packages']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['packages']['Insert']>
      }
      package_templates: {
        Row: {
          package_id: string
          template_id: string
        }
        Insert: Database['public']['Tables']['package_templates']['Row']
        Update: Partial<Database['public']['Tables']['package_templates']['Row']>
      }
      legal_plans: {
        Row: {
          id: string
          name: string
          duration_months: number
          price: number
          original_price: number | null
          promo_price: number | null
          promo_start_at: string | null
          promo_end_at: string | null
          is_active: boolean
          sort_order: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['legal_plans']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['legal_plans']['Insert']>
      }
      orders: {
        Row: {
          id: string
          order_code: string
          user_id: string | null
          email: string | null
          items: Json
          total_amount: number
          status: 'pending' | 'confirmed' | 'cancelled'
          bank_transfer_note: string | null
          cancel_note: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          drive_shared: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['orders']['Insert']>
      }
      user_purchases: {
        Row: {
          id: string
          user_id: string
          purchase_type: 'template' | 'package'
          template_id: string | null
          package_id: string | null
          order_id: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_purchases']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['user_purchases']['Insert']>
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          is_admin: boolean
          legal_access_until: string | null
          tax_access_until: string | null
          tax_trial_started_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      tax_plans: {
        Row: {
          id: string
          name: string
          duration_months: number
          price: number
          original_price: number | null
          is_active: boolean
          sort_order: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['tax_plans']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['tax_plans']['Insert']>
      }
      tax_payments: {
        Row: {
          id: string
          user_id: string
          file_name: string
          mst: string
          ten_nnop: string | null
          hthuc_nop: string | null
          so_gnt: string | null
          ma_thamchieu: string | null
          ngay_lap: string | null
          tong_tien: number | null
          ten_cqt: string | null
          ma_nhang_nop: string | null
          ten_nhang_nop: string | null
          stk_nhang_nop: string | null
          chi_tiet: Array<{ ndungNop: string; maNdkt: string; maChuong: string; kyThue: string; tienPnop: number; ghiChu: string }>
          uploaded_at: string
        }
        Insert: Omit<Database['public']['Tables']['tax_payments']['Row'], 'id' | 'uploaded_at'>
        Update: Partial<Database['public']['Tables']['tax_payments']['Insert']>
      }
      tax_files: {
        Row: {
          id: string
          user_id: string
          file_name: string
          mst: string
          ten_nnt: string | null
          declaration_type: string
          tax_period: string
          tax_year: string
          khai_type: string | null
          so_lan: string | null
          nguoi_ky: string | null
          indicators: Record<string, number>
          status: string
          uploaded_at: string
        }
        Insert: Omit<Database['public']['Tables']['tax_files']['Row'], 'id' | 'uploaded_at'>
        Update: Partial<Database['public']['Tables']['tax_files']['Insert']>
      }
      support_conversations: {
        Row: {
          id: string
          visitor_id: string
          user_id: string | null
          last_message_at: string
          last_customer_message_at: string | null
          last_admin_message_at: string | null
          admin_last_read_at: string | null
          customer_last_read_at: string | null
          guest_name: string | null
          guest_email: string | null
          guest_phone: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['support_conversations']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['support_conversations']['Insert']>
      }
      support_messages: {
        Row: {
          id: string
          conversation_id: string
          sender: 'customer' | 'admin'
          content: string
          attachment_url: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['support_messages']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['support_messages']['Insert']>
      }
    }
  }
}

export type Template = Database['public']['Tables']['templates']['Row']
export type Package = Database['public']['Tables']['packages']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type UserPurchase = Database['public']['Tables']['user_purchases']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type LegalPlan = Database['public']['Tables']['legal_plans']['Row']
export type TaxPlan = Database['public']['Tables']['tax_plans']['Row']
export type TaxFile = Database['public']['Tables']['tax_files']['Row']
export type TaxPayment = Database['public']['Tables']['tax_payments']['Row']
export type SupportConversation = Database['public']['Tables']['support_conversations']['Row']
export type SupportMessage = Database['public']['Tables']['support_messages']['Row']

export interface BankTransaction {
  id: string
  order_code: string
  amount: number
  transaction_content: string | null
  email_subject: string | null
  transaction_at: string | null
  matched_order_id: string | null
  created_at: string
}

export interface CartItem {
  type: 'template' | 'package' | 'legal_plan' | 'tax_plan'
  id: string
  name: string
  sale_price: number
  original_price: number | null
  thumbnail_url: string | null
  duration_months?: number
}

export interface OrderItem {
  type: 'template' | 'package' | 'legal_plan' | 'tax_plan'
  id: string
  name: string
  price: number
  duration_months?: number
}

export interface Promotion {
  id: string
  name: string
  discount_type: 'percent' | 'fixed'
  discount_value: number
  start_at: string
  end_at: string
  apply_to: 'all' | 'selected'
  is_active: boolean
  created_at: string
}

export interface PromotionWithTemplates extends Promotion {
  template_ids: string[]
}

export interface SiteSettings {
  id: string
  brand_name: string
  brand_description: string
  business_name: string | null
  owner_name: string | null
  business_license_no: string | null
  business_license_date: string | null
  business_license_issuer: string | null
  contact_hours: string | null
  contact_phone: string | null
  contact_email: string | null
  contact_address: string | null
  facebook_url: string | null
  zalo_url: string | null
  youtube_url: string | null
  mocongthuong_url: string | null
  copyright_text: string | null
  tax_trial_days: number
  support_auto_reply_enabled: boolean
  support_auto_reply_text: string | null
  support_session_gap_minutes: number
  updated_at: string
}

export interface Policy {
  id: string
  slug: string
  title: string
  content: string
  updated_at: string
}

export function getEffectivePrice(salePrice: number, templateId: string, activePromotions: PromotionWithTemplates[]): number {
  let best = salePrice
  for (const promo of activePromotions) {
    if (promo.apply_to === 'all' || promo.template_ids.includes(templateId)) {
      const discounted = promo.discount_type === 'percent'
        ? Math.round(salePrice * (1 - promo.discount_value / 100))
        : Math.max(0, salePrice - promo.discount_value)
      if (discounted < best) best = discounted
    }
  }
  return best
}

/** Giá hiệu lực của gói Pháp luật: dùng promo_price nếu đang trong cửa sổ khuyến mãi. */
export function getLegalPlanEffectivePrice(plan: LegalPlan): number {
  if (plan.promo_price != null && plan.promo_start_at && plan.promo_end_at) {
    const now = Date.now()
    if (now >= new Date(plan.promo_start_at).getTime() && now <= new Date(plan.promo_end_at).getTime()) {
      return plan.promo_price
    }
  }
  return plan.price
}

/** Gói Pháp luật có đang chạy khuyến mãi (trong cửa sổ thời gian) không. */
export function isLegalPlanPromoActive(plan: LegalPlan): boolean {
  if (plan.promo_price == null || !plan.promo_start_at || !plan.promo_end_at) return false
  const now = Date.now()
  return now >= new Date(plan.promo_start_at).getTime() && now <= new Date(plan.promo_end_at).getTime()
}
