/**
 * Supabase database types for the Member 1 schema.
 *
 * Hand-written to match `supabase/migrations/0001_member1_init.sql`. If you run
 * `supabase gen types typescript` you can regenerate/replace this file.
 */

export type CompanyRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type VehicleStatus = 'ACTIVE' | 'INACTIVE';

type Timestamps = {
  created_at: string;
  updated_at: string;
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          role: string;
        } & Timestamps;
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      companies: {
        Row: {
          id: string;
          name: string;
          code: string;
          email: string | null;
          phone: string | null;
          address: string | null;
          description: string | null;
          created_by: string;
        } & Timestamps;
        Insert: {
          id?: string;
          name: string;
          code: string;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          description?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          description?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      company_members: {
        Row: {
          id: string;
          company_id: string;
          user_id: string;
          role: CompanyRole;
          joined_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          user_id: string;
          role?: CompanyRole;
          joined_at?: string;
        };
        Update: {
          role?: CompanyRole;
        };
        Relationships: [
          {
            foreignKeyName: 'company_members_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'company_members_user_id_profiles_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      vehicles: {
        Row: {
          id: string;
          owner_id: string;
          company_id: string | null;
          name: string | null;
          type: string | null;
          brand: string | null;
          model: string | null;
          registration_number: string;
          seating_capacity: number;
          color: string | null;
          status: VehicleStatus;
        } & Timestamps;
        Insert: {
          id?: string;
          owner_id: string;
          company_id?: string | null;
          name?: string | null;
          type?: string | null;
          brand?: string | null;
          model?: string | null;
          registration_number: string;
          seating_capacity: number;
          color?: string | null;
          status?: VehicleStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          company_id?: string | null;
          name?: string | null;
          type?: string | null;
          brand?: string | null;
          model?: string | null;
          registration_number?: string;
          seating_capacity?: number;
          color?: string | null;
          status?: VehicleStatus;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'vehicles_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'vehicles_owner_id_profiles_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      saved_places: {
        Row: {
          id: string;
          user_id: string;
          label: string;
          address: string | null;
          latitude: number | null;
          longitude: number | null;
        } & Timestamps;
        Insert: {
          id?: string;
          user_id: string;
          label: string;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          label?: string;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          notification_preferences: Record<string, unknown>;
          privacy_preferences: Record<string, unknown>;
          appearance_preferences: Record<string, unknown>;
        } & Timestamps;
        Insert: {
          id?: string;
          user_id: string;
          notification_preferences?: Record<string, unknown>;
          privacy_preferences?: Record<string, unknown>;
          appearance_preferences?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          notification_preferences?: Record<string, unknown>;
          privacy_preferences?: Record<string, unknown>;
          appearance_preferences?: Record<string, unknown>;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_company: {
        Args: {
          p_name: string;
          p_email?: string | null;
          p_phone?: string | null;
          p_address?: string | null;
          p_description?: string | null;
        };
        Returns: Database['public']['Tables']['companies']['Row'];
      };
      join_company_by_code: {
        Args: { p_code: string };
        Returns: Database['public']['Tables']['companies']['Row'];
      };
      is_company_member: { Args: { cid: string }; Returns: boolean };
      is_company_manager: { Args: { cid: string }; Returns: boolean };
    };
    Enums: {
      company_role: CompanyRole;
      vehicle_status: VehicleStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
