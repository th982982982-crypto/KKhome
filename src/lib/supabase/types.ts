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
          confirmed_at: string | null
          confirmed_by: string | null
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
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
    }
  }
}

export type Template = Database['public']['Tables']['templates']['Row']
export type Package = Database['public']['Tables']['packages']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type UserPurchase = Database['public']['Tables']['user_purchases']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']

export interface CartItem {
  type: 'template' | 'package'
  id: string
  name: string
  sale_price: number
  original_price: number | null
  thumbnail_url: string | null
}

export interface OrderItem {
  type: 'template' | 'package'
  id: string
  name: string
  price: number
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
  contact_hours: string | null
  contact_phone: string | null
  contact_email: string | null
  contact_address: string | null
  facebook_url: string | null
  zalo_url: string | null
  youtube_url: string | null
  copyright_text: string | null
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
