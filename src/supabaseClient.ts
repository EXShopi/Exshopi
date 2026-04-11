import { createClient } from "@supabase/supabase-js";

const cleanEnv = (value: string | undefined) =>
  (value ?? "")
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .replace(/\/+$/, "");

const supabaseUrl = cleanEnv(import.meta.env.VITE_SUPABASE_URL);
const supabaseAnonKey = cleanEnv(import.meta.env.VITE_SUPABASE_ANON_KEY);
const missingFrontendEnvVars: string[] = [];

if (!supabaseUrl) {
  missingFrontendEnvVars.push("VITE_SUPABASE_URL");
}

if (!supabaseAnonKey) {
  missingFrontendEnvVars.push("VITE_SUPABASE_ANON_KEY");
}

let resolvedSupabaseUrl = supabaseUrl;
if (resolvedSupabaseUrl) {
  try {
    new URL(resolvedSupabaseUrl);
  } catch {
    missingFrontendEnvVars.push(`Invalid VITE_SUPABASE_URL: ${resolvedSupabaseUrl}`);
    resolvedSupabaseUrl = "";
  }
}

const hasSupabaseEnv = missingFrontendEnvVars.length === 0;

if (!hasSupabaseEnv && typeof console !== "undefined") {
  console.error(
    `[ExShopi Frontend] Missing or invalid public Supabase env: ${missingFrontendEnvVars.join(", ")}. ` +
      "Set the public Vite env vars on the frontend deployment and redeploy."
  );
}

const fallbackSupabaseUrl = "https://placeholder.invalid";
const fallbackSupabaseAnonKey = "missing-public-supabase-anon-key";

export const supabase = createClient(
  hasSupabaseEnv ? resolvedSupabaseUrl : fallbackSupabaseUrl,
  hasSupabaseEnv ? supabaseAnonKey : fallbackSupabaseAnonKey,
  {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
  }
);

export const auth = {
  currentUser: null as any,
  onAuthStateChanged: (callback: (user: any) => void) => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      auth.currentUser = session?.user || null;
      callback(auth.currentUser);
    });

    return () => subscription.unsubscribe();
  },
  signOut: async () => {
    await supabase.auth.signOut();
    auth.currentUser = null;
  },
};

void supabase.auth.getSession().then(({ data: { session } }) => {
  auth.currentUser = session?.user || null;
});

export const db = null;
export const storage = null;

export class GoogleAuthProvider {
  providerId = "google.com";
}

export const googleProvider = new GoogleAuthProvider();

export const signInWithPopup = async (_authInstance: any, _provider: any) => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) throw error;
  return { user: auth.currentUser };
};

export const signInWithEmailAndPassword = async (
  _authInstance: any,
  email: string,
  password: string
) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  auth.currentUser = data.user;
  return { user: data.user };
};

export const createUserWithEmailAndPassword = async (
  _authInstance: any,
  email: string,
  password: string
) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;
  auth.currentUser = data.user;
  return { user: data.user };
};

export const updateProfile = async (_authInstance: any, updates: any) => {
  const { data, error } = await supabase.auth.updateUser({
    data: updates,
  });

  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  auth.currentUser = null;
};
