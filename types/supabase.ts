/**
 * Hand-written to match:
 *   - supabase/migrations/20260909075059_create_profiles_and_customers.sql
 *   - supabase/migrations/20260910165452_create_projects.sql
 *
 * Once the Supabase CLI is available, replace this file with the real
 * generated output so it never drifts from the schema:
 *
 *   npx supabase gen types typescript --project-id <project-id> > types/supabase.ts
 */

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          business_name: string | null;
          business_type: string | null;
          currency: string;
          country: string | null;
          timezone: string | null;
          created_at: string;
        };
        // id has no default at the app level — it must equal the
        // authenticated user's auth.users id (enforced by the FK and by
        // the handle_new_user trigger that creates the row on signup).
        Insert: {
          id: string;
          full_name?: string | null;
          business_name?: string | null;
          business_type?: string | null;
          currency?: string;
          country?: string | null;
          timezone?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          business_name?: string | null;
          business_type?: string | null;
          currency?: string;
          country?: string | null;
          timezone?: string | null;
          created_at?: string;
        };
      };
      customers: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          company: string | null;
          email: string | null;
          phone: string | null;
          address: string | null;
          notes: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          company?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          notes?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          company?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          notes?: string | null;
          status?: string;
          created_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          customer_id: string;
          name: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          customer_id: string;
          name: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          customer_id?: string;
          name?: string;
          status?: string;
          created_at?: string;
        };
      };
    };
  };
};

// Convenience row aliases for use in components/queries, e.g.
// `const [customers, setCustomers] = useState<Customer[]>([])`.
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Customer = Database["public"]["Tables"]["customers"]["Row"];
export type Project = Database["public"]["Tables"]["projects"]["Row"];
