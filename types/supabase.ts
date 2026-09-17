/**
 * Hand-written to match:
 *   - supabase/migrations/20260909075059_create_profiles_and_customers.sql
 *   - supabase/migrations/20260910165452_create_projects.sql
 *   - supabase/migrations/20260911000458_create_revenue_and_costs.sql
 *
 * Once the Supabase CLI is available, replace this file with the real
 * generated output so it never drifts from the schema:
 *
 *   npx supabase gen types typescript --project-id <project-id> > types/supabase.ts
 *
 * Structural note: every table below includes `Relationships: []`, and
 * `public` includes empty `Views`/`Functions`/`Enums`/`CompositeTypes`.
 * These aren't schema data (this project has none of those, and no
 * modeled FK relationships for embedded selects) — they're required so
 * this type structurally satisfies @supabase/postgrest-js's
 * GenericSchema/GenericTable shape. Without them, `.from(table)` can't
 * resolve a table by key and every query's Row/Insert/Update resolves
 * to `never` instead of the types below.
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
      };
      revenues: {
        Row: {
          id: string;
          user_id: string;
          project_id: string;
          description: string;
          // numeric(12,2) — PostgREST returns Postgres `numeric` as a
          // string (not a JS number) to avoid float precision loss, so
          // this is typed as string throughout, never parsed to a
          // number except for one-off sign/zero checks.
          amount: string;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id: string;
          description: string;
          amount: string;
          date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string;
          description?: string;
          amount?: string;
          date?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      costs: {
        Row: {
          id: string;
          user_id: string;
          project_id: string;
          description: string;
          amount: string;
          category: string;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id: string;
          description: string;
          amount: string;
          category: string;
          date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string;
          description?: string;
          amount?: string;
          category?: string;
          date?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

// Convenience row aliases for use in components/queries, e.g.
// `const [customers, setCustomers] = useState<Customer[]>([])`.
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Customer = Database["public"]["Tables"]["customers"]["Row"];
export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type Revenue = Database["public"]["Tables"]["revenues"]["Row"];
export type Cost = Database["public"]["Tables"]["costs"]["Row"];
