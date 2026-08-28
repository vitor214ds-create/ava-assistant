DROP INDEX IF EXISTS public.appointments_org_starts_idx;
DROP INDEX IF EXISTS public.messages_conversation_created_idx;

DROP POLICY IF EXISTS "own profile" ON public.profiles;
CREATE POLICY "own profile" ON public.profiles
FOR ALL TO authenticated
USING (id = (select auth.uid()))
WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "read own roles" ON public.user_roles;
CREATE POLICY "read own roles" ON public.user_roles
FOR SELECT TO authenticated
USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "plans admin write" ON public.plans;
CREATE POLICY "plans admin write" ON public.plans
FOR ALL TO authenticated
USING (public.has_role((select auth.uid()), 'platform_admin'::public.app_role))
WITH CHECK (public.has_role((select auth.uid()), 'platform_admin'::public.app_role));

DROP POLICY IF EXISTS "creator bootstraps membership" ON public.organization_members;
CREATE POLICY "creator bootstraps membership" ON public.organization_members
FOR INSERT TO authenticated
WITH CHECK (
  user_id = (select auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.organizations o
    WHERE o.id = organization_members.organization_id
      AND o.created_by = (select auth.uid())
  )
);

DROP POLICY IF EXISTS "members read own memberships" ON public.organization_members;
CREATE POLICY "members read own memberships" ON public.organization_members
FOR SELECT TO authenticated
USING (user_id = (select auth.uid()) OR public.is_org_member(organization_id));

DROP POLICY IF EXISTS "create own org" ON public.organizations;
CREATE POLICY "create own org" ON public.organizations
FOR INSERT TO authenticated
WITH CHECK (created_by = (select auth.uid()));

DROP POLICY IF EXISTS "managers update org" ON public.organizations;
CREATE POLICY "managers update org" ON public.organizations
FOR UPDATE TO authenticated
USING (public.is_org_manager(id) OR public.has_role((select auth.uid()), 'platform_admin'::public.app_role))
WITH CHECK (public.is_org_manager(id) OR public.has_role((select auth.uid()), 'platform_admin'::public.app_role));

DROP POLICY IF EXISTS "org members read org" ON public.organizations;
CREATE POLICY "org members read org" ON public.organizations
FOR SELECT TO authenticated
USING (
  public.is_org_member(id)
  OR created_by = (select auth.uid())
  OR public.has_role((select auth.uid()), 'platform_admin'::public.app_role)
);
