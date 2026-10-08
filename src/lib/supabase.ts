import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://njwhpmbegfvaawidwujk.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qd2hwbWJlZ2Z2YWF3aWR3dWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0NDk2MzQsImV4cCI6MjEwNzAyNTYzNH0.hWog_aYqcRPRzthn5cpoUmpEgNggTeRE67O85IkmflQ";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
