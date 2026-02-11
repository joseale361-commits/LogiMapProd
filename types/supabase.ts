export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          additional_info: string | null
          city: string
          country: string | null
          created_at: string | null
          delivery_instructions: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          label: string | null
          location: unknown
          postal_code: string | null
          state: string | null
          street_address: string
          updated_at: string | null
          user_id: string
          zone_name: string | null
        }
        Insert: {
          additional_info?: string | null
          city: string
          country?: string | null
          created_at?: string | null
          delivery_instructions?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          label?: string | null
          location: unknown
          postal_code?: string | null
          state?: string | null
          street_address: string
          updated_at?: string | null
          user_id: string
          zone_name?: string | null
        }
        Update: {
          additional_info?: string | null
          city?: string
          country?: string | null
          created_at?: string | null
          delivery_instructions?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          label?: string | null
          location?: unknown
          postal_code?: string | null
          state?: string | null
          street_address?: string
          updated_at?: string | null
          user_id?: string
          zone_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          distributor_id: string
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          parent_id: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          distributor_id: string
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          distributor_id?: string
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "distributors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "v_distributor_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_relationships: {
        Row: {
          created_at: string | null
          created_by: string | null
          credit_limit: number | null
          current_debt: number
          customer_id: string
          discount_percentage: number | null
          distributor_id: string
          id: string
          last_visit_at: string | null
          notes: string | null
          payment_terms_days: number | null
          price_list_id: string | null
          relationship_type: string | null
          status: string | null
          updated_at: string | null
          visit_frequency_days: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          credit_limit?: number | null
          current_debt?: number
          customer_id: string
          discount_percentage?: number | null
          distributor_id: string
          id?: string
          last_visit_at?: string | null
          notes?: string | null
          payment_terms_days?: number | null
          price_list_id?: string | null
          relationship_type?: string | null
          status?: string | null
          updated_at?: string | null
          visit_frequency_days?: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          credit_limit?: number | null
          current_debt?: number
          customer_id?: string
          discount_percentage?: number | null
          distributor_id?: string
          id?: string
          last_visit_at?: string | null
          notes?: string | null
          payment_terms_days?: number | null
          price_list_id?: string | null
          relationship_type?: string | null
          status?: string | null
          updated_at?: string | null
          visit_frequency_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "customer_relationships_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_relationships_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "distributors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_relationships_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "v_distributor_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      distributor_users: {
        Row: {
          created_at: string | null
          distributor_id: string
          employee_code: string | null
          hire_date: string | null
          id: string
          is_active: boolean | null
          is_driver: boolean
          permissions: Json | null
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          distributor_id: string
          employee_code?: string | null
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          is_driver?: boolean
          permissions?: Json | null
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          distributor_id?: string
          employee_code?: string | null
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          is_driver?: boolean
          permissions?: Json | null
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "distributor_users_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "distributors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distributor_users_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "v_distributor_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distributor_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      distributors: {
        Row: {
          created_at: string | null
          created_by: string | null
          delivery_zones: Json | null
          email: string | null
          id: string
          is_active: boolean | null
          location: unknown
          logo_url: string | null
          min_order_value: number | null
          name: string
          phone: string | null
          plan_type: string
          settings: Json | null
          slug: string
          subscription_status: string
          updated_at: string | null
          valid_until: string
          warehouse_address: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          delivery_zones?: Json | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          location?: unknown
          logo_url?: string | null
          min_order_value?: number | null
          name: string
          phone?: string | null
          plan_type?: string
          settings?: Json | null
          slug: string
          subscription_status?: string
          updated_at?: string | null
          valid_until?: string
          warehouse_address?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          delivery_zones?: Json | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          location?: unknown
          logo_url?: string | null
          min_order_value?: number | null
          name?: string
          phone?: string | null
          plan_type?: string
          settings?: Json | null
          slug?: string
          subscription_status?: string
          updated_at?: string | null
          valid_until?: string
          warehouse_address?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          discount_percentage: number | null
          id: string
          notes: string | null
          order_id: string
          pack_units: number
          product_id: string
          product_snapshot: Json
          quantity: number
          quantity_delivered: number | null
          status: string | null
          subtotal: number
          unit_price: number
          updated_at: string | null
          variant_id: string | null
        }
        Insert: {
          created_at?: string | null
          discount_percentage?: number | null
          id?: string
          notes?: string | null
          order_id: string
          pack_units?: number
          product_id: string
          product_snapshot: Json
          quantity: number
          quantity_delivered?: number | null
          status?: string | null
          subtotal: number
          unit_price: number
          updated_at?: string | null
          variant_id?: string | null
        }
        Update: {
          created_at?: string | null
          discount_percentage?: number | null
          id?: string
          notes?: string | null
          order_id?: string
          pack_units?: number
          product_id?: string
          product_snapshot?: Json
          quantity?: number
          quantity_delivered?: number | null
          status?: string | null
          subtotal?: number
          unit_price?: number
          updated_at?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_orders_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_orders_with_geojson"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_products_with_variants"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "v_products_with_variants"
            referencedColumns: ["variant_id"]
          },
        ]
      }
      orders: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          balance_due: number
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string | null
          customer_id: string
          customer_notes: string | null
          delivered_at: string | null
          delivered_by: string | null
          delivery_address_id: string | null
          delivery_address_snapshot: Json
          delivery_fee: number | null
          delivery_location: unknown
          delivery_proof_url: string | null
          delivery_type: string
          discount_amount: number | null
          distributor_id: string
          id: string
          initial_payment: number
          internal_notes: string | null
          order_number: string
          payment_method: string | null
          payment_status: string | null
          pickup_time: string | null
          requested_delivery_date: string | null
          requested_delivery_time_slot: string | null
          status: string
          subtotal: number
          tax_amount: number | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          balance_due?: number
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          customer_id: string
          customer_notes?: string | null
          delivered_at?: string | null
          delivered_by?: string | null
          delivery_address_id?: string | null
          delivery_address_snapshot: Json
          delivery_fee?: number | null
          delivery_location?: unknown
          delivery_proof_url?: string | null
          delivery_type?: string
          discount_amount?: number | null
          distributor_id: string
          id?: string
          initial_payment?: number
          internal_notes?: string | null
          order_number: string
          payment_method?: string | null
          payment_status?: string | null
          pickup_time?: string | null
          requested_delivery_date?: string | null
          requested_delivery_time_slot?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          balance_due?: number
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          customer_id?: string
          customer_notes?: string | null
          delivered_at?: string | null
          delivered_by?: string | null
          delivery_address_id?: string | null
          delivery_address_snapshot?: Json
          delivery_fee?: number | null
          delivery_location?: unknown
          delivery_proof_url?: string | null
          delivery_type?: string
          discount_amount?: number | null
          distributor_id?: string
          id?: string
          initial_payment?: number
          internal_notes?: string | null
          order_number?: string
          payment_method?: string | null
          payment_status?: string | null
          pickup_time?: string | null
          requested_delivery_date?: string | null
          requested_delivery_time_slot?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_delivered_by_fkey"
            columns: ["delivered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_delivery_address_id_fkey"
            columns: ["delivery_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "distributors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "v_distributor_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          distributor_id: string | null
          id: string
          notes: string | null
          order_id: string | null
          payment_date: string | null
          payment_method: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          distributor_id?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          payment_date?: string | null
          payment_method?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          distributor_id?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          payment_date?: string | null
          payment_method?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "distributors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          attributes: Json | null
          created_at: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_new: boolean | null
          is_on_sale: boolean | null
          name: string
          pack_units: number
          price: number
          product_id: string
          sale_price: number | null
          sku: string
          stock_virtual: number | null
          target_stock: number | null
          updated_at: string | null
        }
        Insert: {
          attributes?: Json | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_new?: boolean | null
          is_on_sale?: boolean | null
          name: string
          pack_units?: number
          price: number
          product_id: string
          sale_price?: number | null
          sku: string
          stock_virtual?: number | null
          target_stock?: number | null
          updated_at?: string | null
        }
        Update: {
          attributes?: Json | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_new?: boolean | null
          is_on_sale?: boolean | null
          name?: string
          pack_units?: number
          price?: number
          product_id?: string
          sale_price?: number | null
          sku?: string
          stock_virtual?: number | null
          target_stock?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_products_with_variants"
            referencedColumns: ["product_id"]
          },
        ]
      }
      products: {
        Row: {
          attributes: Json | null
          base_price: number
          brand: string | null
          category_id: string | null
          created_at: string | null
          description: string | null
          distributor_id: string
          id: string
          image_url: string | null
          images: Json | null
          is_active: boolean | null
          is_featured: boolean | null
          is_new: boolean | null
          is_on_sale: boolean | null
          low_stock_alert: number | null
          name: string
          sale_price: number | null
          sku: string
          stock_virtual: number | null
          tags: Json | null
          unit_of_measure: string | null
          updated_at: string | null
          weight_kg: number | null
        }
        Insert: {
          attributes?: Json | null
          base_price: number
          brand?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          distributor_id: string
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_new?: boolean | null
          is_on_sale?: boolean | null
          low_stock_alert?: number | null
          name: string
          sale_price?: number | null
          sku: string
          stock_virtual?: number | null
          tags?: Json | null
          unit_of_measure?: string | null
          updated_at?: string | null
          weight_kg?: number | null
        }
        Update: {
          attributes?: Json | null
          base_price?: number
          brand?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          distributor_id?: string
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_new?: boolean | null
          is_on_sale?: boolean | null
          low_stock_alert?: number | null
          name?: string
          sale_price?: number | null
          sku?: string
          stock_virtual?: number | null
          tags?: Json | null
          unit_of_measure?: string | null
          updated_at?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "distributors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "v_distributor_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          auth_user_id: string | null
          avatar_url: string | null
          business_name: string | null
          created_at: string | null
          document_number: string | null
          document_type: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          last_login_at: string | null
          phone: string | null
          preferences: Json | null
          store_type: string | null
          tax_id: string | null
          updated_at: string | null
        }
        Insert: {
          auth_user_id?: string | null
          avatar_url?: string | null
          business_name?: string | null
          created_at?: string | null
          document_number?: string | null
          document_type?: string | null
          email: string
          full_name: string
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          phone?: string | null
          preferences?: Json | null
          store_type?: string | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_user_id?: string | null
          avatar_url?: string | null
          business_name?: string | null
          created_at?: string | null
          document_number?: string | null
          document_type?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          phone?: string | null
          preferences?: Json | null
          store_type?: string | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      route_stops: {
        Row: {
          actual_arrival_time: string | null
          actual_departure_time: string | null
          created_at: string | null
          customer_name: string
          customer_phone: string | null
          delivered_at: string | null
          delivered_by: string | null
          delivery_address_text: string
          delivery_location: unknown
          delivery_proof_photo: string | null
          delivery_proof_signature: string | null
          distance_to_next_km: number | null
          estimated_arrival_time: string | null
          failure_photo_url: string | null
          failure_reason: string | null
          id: string
          notes: string | null
          order_id: string
          route_id: string
          sequence_order: number
          status: string
          updated_at: string | null
        }
        Insert: {
          actual_arrival_time?: string | null
          actual_departure_time?: string | null
          created_at?: string | null
          customer_name: string
          customer_phone?: string | null
          delivered_at?: string | null
          delivered_by?: string | null
          delivery_address_text: string
          delivery_location: unknown
          delivery_proof_photo?: string | null
          delivery_proof_signature?: string | null
          distance_to_next_km?: number | null
          estimated_arrival_time?: string | null
          failure_photo_url?: string | null
          failure_reason?: string | null
          id?: string
          notes?: string | null
          order_id: string
          route_id: string
          sequence_order: number
          status?: string
          updated_at?: string | null
        }
        Update: {
          actual_arrival_time?: string | null
          actual_departure_time?: string | null
          created_at?: string | null
          customer_name?: string
          customer_phone?: string | null
          delivered_at?: string | null
          delivered_by?: string | null
          delivery_address_text?: string
          delivery_location?: unknown
          delivery_proof_photo?: string | null
          delivery_proof_signature?: string | null
          distance_to_next_km?: number | null
          estimated_arrival_time?: string | null
          failure_photo_url?: string | null
          failure_reason?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          route_id?: string
          sequence_order?: number
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "route_stops_delivered_by_fkey"
            columns: ["delivered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_stops_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_stops_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_orders_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_stops_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_orders_with_geojson"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_stops_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_stops_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "v_active_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      routes: {
        Row: {
          completed_stops: number | null
          created_at: string | null
          created_by: string | null
          distributor_id: string
          driver_id: string
          estimated_duration_minutes: number | null
          failed_stops: number | null
          finished_at: string | null
          id: string
          notes: string | null
          optimized_path: unknown
          planned_date: string
          route_number: string
          started_at: string | null
          status: string
          total_distance_km: number | null
          total_stops: number | null
          updated_at: string | null
          vehicle_capacity_kg: number | null
          vehicle_plate: string | null
          vehicle_type: string | null
        }
        Insert: {
          completed_stops?: number | null
          created_at?: string | null
          created_by?: string | null
          distributor_id: string
          driver_id: string
          estimated_duration_minutes?: number | null
          failed_stops?: number | null
          finished_at?: string | null
          id?: string
          notes?: string | null
          optimized_path?: unknown
          planned_date: string
          route_number: string
          started_at?: string | null
          status?: string
          total_distance_km?: number | null
          total_stops?: number | null
          updated_at?: string | null
          vehicle_capacity_kg?: number | null
          vehicle_plate?: string | null
          vehicle_type?: string | null
        }
        Update: {
          completed_stops?: number | null
          created_at?: string | null
          created_by?: string | null
          distributor_id?: string
          driver_id?: string
          estimated_duration_minutes?: number | null
          failed_stops?: number | null
          finished_at?: string | null
          id?: string
          notes?: string | null
          optimized_path?: unknown
          planned_date?: string
          route_number?: string
          started_at?: string | null
          status?: string
          total_distance_km?: number | null
          total_stops?: number | null
          updated_at?: string | null
          vehicle_capacity_kg?: number | null
          vehicle_plate?: string | null
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "distributors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "v_distributor_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
      v_active_routes: {
        Row: {
          completed_stops: number | null
          completion_percentage: number | null
          distributor_name: string | null
          driver_name: string | null
          driver_phone: string | null
          failed_stops: number | null
          id: string | null
          next_stop: Json | null
          planned_date: string | null
          route_number: string | null
          started_at: string | null
          status: string | null
          total_stops: number | null
        }
        Relationships: []
      }
      v_distributor_settings: {
        Row: {
          address: string | null
          id: string | null
          location_json: Json | null
          name: string | null
          slug: string | null
        }
        Insert: {
          address?: never
          id?: string | null
          location_json?: never
          name?: string | null
          slug?: string | null
        }
        Update: {
          address?: never
          id?: string | null
          location_json?: never
          name?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      v_orders_complete: {
        Row: {
          created_at: string | null
          customer_business: string | null
          customer_name: string | null
          customer_phone: string | null
          delivery_address: string | null
          delivery_city: string | null
          distributor_logo: string | null
          distributor_name: string | null
          id: string | null
          items_count: number | null
          order_number: string | null
          requested_delivery_date: string | null
          status: string | null
          total_amount: number | null
          total_items: number | null
        }
        Relationships: []
      }
      v_orders_with_geojson: {
        Row: {
          address: string | null
          client_name: string | null
          delivery_date: string | null
          delivery_type: string | null
          distributor_id: string | null
          id: string | null
          location_json: Json | null
          order_number: string | null
          status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "distributors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "v_distributor_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      v_products_with_variants: {
        Row: {
          category_name: string | null
          distributor_id: string | null
          image_url: string | null
          is_active: boolean | null
          pack_units: number | null
          price: number | null
          price_per_unit: number | null
          product_id: string | null
          product_name: string | null
          product_sku: string | null
          stock_virtual: number | null
          variant_id: string | null
          variant_name: string | null
          variant_sku: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "distributors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "v_distributor_settings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
      | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
      | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
      | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
      | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
      | {
        Args: {
          catalog_name: string
          column_name: string
          new_dim: number
          new_srid_in: number
          new_type: string
          schema_name: string
          table_name: string
          use_typmod?: boolean
        }
        Returns: string
      }
      | {
        Args: {
          column_name: string
          new_dim: number
          new_srid: number
          new_type: string
          schema_name: string
          table_name: string
          use_typmod?: boolean
        }
        Returns: string
      }
      | {
        Args: {
          column_name: string
          new_dim: number
          new_srid: number
          new_type: string
          table_name: string
          use_typmod?: boolean
        }
        Returns: string
      }
      calculate_distance_km: {
        Args: { point1: unknown; point2: unknown }
        Returns: number
      }
      create_address_with_location: {
        Args: {
          p_additional_info?: string
          p_city: string
          p_country: string
          p_delivery_instructions?: string
          p_is_default?: boolean
          p_label: string
          p_lat: number
          p_lng: number
          p_postal_code: string
          p_state: string
          p_street_address: string
          p_user_id: string
        }
        Returns: Json
      }
      create_order_with_items: {
        Args: {
          p_customer_id: string
          p_delivery_address_id: string
          p_delivery_address_snapshot: Json
          p_delivery_type?: string
          p_distributor_id: string
          p_initial_payment?: number
          p_items: Json
          p_order_number: string
          p_payment_method: string
          p_pickup_time?: string
          p_subtotal: number
          p_total_amount: number
        }
        Returns: Json
      }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
      | {
        Args: {
          catalog_name: string
          column_name: string
          schema_name: string
          table_name: string
        }
        Returns: string
      }
      | {
        Args: {
          column_name: string
          schema_name: string
          table_name: string
        }
        Returns: string
      }
      | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
      | {
        Args: {
          catalog_name: string
          schema_name: string
          table_name: string
        }
        Returns: string
      }
      | { Args: { schema_name: string; table_name: string }; Returns: string }
      | { Args: { table_name: string }; Returns: string }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      get_distributor_users: {
        Args: { p_user_id: string }
        Returns: {
          created_at: string
          distributor_id: string
          distributor_name: string
          distributor_slug: string
          id: string
          is_active: boolean
          role: string
          updated_at: string
          user_id: string
        }[]
      }
      get_nearby_distributors: {
        Args: { radius_km?: number; user_location: unknown }
        Returns: {
          distance_km: number
          distributor_id: string
          distributor_name: string
          is_in_delivery_zone: boolean
        }[]
      }
      gettransactionid: { Args: never; Returns: unknown }
      is_distributor_member: {
        Args: { distributor_uuid: string }
        Returns: boolean
      }
      longtransactionsenabled: { Args: never; Returns: boolean }
      optimize_route_stops: { Args: { p_route_id: string }; Returns: undefined }
      populate_geometry_columns:
      | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
      | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
      | { Args: { line1: unknown; line2: unknown }; Returns: number }
      | {
        Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
        Returns: number
      }
      st_area:
      | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
      | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
      | {
        Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      | {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      | {
        Args: {
          geom_column?: string
          maxdecimaldigits?: number
          pretty_bool?: boolean
          r: Record<string, unknown>
        }
        Returns: string
      }
      | { Args: { "": string }; Returns: string }
      st_asgml:
      | {
        Args: {
          geog: unknown
          id?: string
          maxdecimaldigits?: number
          nprefix?: string
          options?: number
        }
        Returns: string
      }
      | {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      | { Args: { "": string }; Returns: string }
      | {
        Args: {
          geog: unknown
          id?: string
          maxdecimaldigits?: number
          nprefix?: string
          options?: number
          version: number
        }
        Returns: string
      }
      | {
        Args: {
          geom: unknown
          id?: string
          maxdecimaldigits?: number
          nprefix?: string
          options?: number
          version: number
        }
        Returns: string
      }
      st_askml:
      | {
        Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
        Returns: string
      }
      | {
        Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
        Returns: string
      }
      | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
      | {
        Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
        Returns: string
      }
      | {
        Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
        Returns: string
      }
      | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
      | {
        Args: {
          geom: unknown
          prec?: number
          prec_m?: number
          prec_z?: number
          with_boxes?: boolean
          with_sizes?: boolean
        }
        Returns: string
      }
      | {
        Args: {
          geom: unknown[]
          ids: number[]
          prec?: number
          prec_m?: number
          prec_z?: number
          with_boxes?: boolean
          with_sizes?: boolean
        }
        Returns: string
      }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
      | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
      | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
      | {
        Args: { geom: unknown; options?: string; radius: number }
        Returns: unknown
      }
      | {
        Args: { geom: unknown; quadsegs: number; radius: number }
        Returns: unknown
      }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
      | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
      | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
      | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
      | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
      | {
        Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
        Returns: number
      }
      | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
      | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      | {
        Args: { geom1: unknown; geom2: unknown; radius: number }
        Returns: number
      }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
      | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
      | {
        Args: { box: unknown; dx: number; dy: number; dz?: number }
        Returns: unknown
      }
      | {
        Args: {
          dm?: number
          dx: number
          dy: number
          dz?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
      | { Args: { area: unknown; npoints: number }; Returns: unknown }
      | {
        Args: { area: unknown; npoints: number; seed: number }
        Returns: unknown
      }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
      | { Args: { geog: unknown; maxchars?: number }; Returns: string }
      | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
      | { Args: { "": Json }; Returns: unknown }
      | { Args: { "": Json }; Returns: unknown }
      | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
      | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
      | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
      | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
      | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
      | { Args: { geog: unknown; srid: number }; Returns: unknown }
      | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
      | { Args: { geog: unknown }; Returns: number }
      | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
      | {
        Args: { from_proj: string; geom: unknown; to_proj: string }
        Returns: unknown
      }
      | {
        Args: { from_proj: string; geom: unknown; to_srid: number }
        Returns: unknown
      }
      | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
      | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      | {
        Args: { geom1: unknown; geom2: unknown; gridsize: number }
        Returns: unknown
      }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      unlockrows: { Args: { "": string }; Returns: number }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
