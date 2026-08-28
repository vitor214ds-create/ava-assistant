import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type OrgRole = "owner" | "admin" | "staff" | "receptionist";

export type Membership = {
  organization_id: string;
  role: OrgRole;
};

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  membership: Membership | null;
  organizationId: string | null;
  role: OrgRole | null;
  isPlatformAdmin: boolean;
  refreshMembership: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);

  const loadMembership = async (uid: string | undefined) => {
    if (!uid) {
      setMembership(null);
      setIsPlatformAdmin(false);
      return;
    }
    const [{ data: members }, { data: roles }] = await Promise.all([
      supabase
        .from("organization_members")
        .select("organization_id, role")
        .eq("user_id", uid)
        .order("created_at", { ascending: true })
        .limit(1),
      supabase.from("user_roles").select("role").eq("user_id", uid),
    ]);
    setMembership((members?.[0] as Membership | undefined) ?? null);
    setIsPlatformAdmin(Boolean(roles?.some((r) => r.role === "platform_admin")));
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setTimeout(() => {
        void loadMembership(nextSession?.user?.id);
      }, 0);
    });

    void supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      await loadMembership(data.session?.user?.id);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      membership,
      organizationId: membership?.organization_id ?? null,
      role: membership?.role ?? null,
      isPlatformAdmin,
      refreshMembership: () => loadMembership(user?.id),
      signOut: async () => {
        await supabase.auth.signOut();
        setMembership(null);
      },
    }),
    [user, session, loading, membership, isPlatformAdmin],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}

const PERMISSIONS: Record<OrgRole, string[]> = {
  owner: ["*"],
  admin: ["*"],
  staff: ["agenda", "clientes", "conversas", "painel"],
  receptionist: ["agenda", "conversas", "painel"],
};

export function canAccess(role: OrgRole | null, area: string) {
  if (!role) return false;
  const allowed = PERMISSIONS[role];
  return allowed.includes("*") || allowed.includes(area);
}
