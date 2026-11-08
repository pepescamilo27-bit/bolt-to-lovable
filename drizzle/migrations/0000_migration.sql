CREATE TABLE public.opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  contact text NOT NULL,
  company text NOT NULL DEFAULT '',
  product text NOT NULL,
  value numeric NULL,
  stage text NOT NULL DEFAULT 'novo',
  last_contact date NULL,
  next_follow_up date NULL,
  next_action text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  loss_reason text NOT NULL DEFAULT '',
  activities jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz NULL,
  demo boolean NOT NULL DEFAULT false
);
CREATE INDEX idx_opportunities_user_id ON public.opportunities (user_id);
CREATE INDEX idx_opportunities_created_at ON public.opportunities (created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunities TO authenticated;
GRANT ALL ON public.opportunities TO service_role;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_opportunities" ON public.opportunities FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_opportunities" ON public.opportunities FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_opportunities" ON public.opportunities FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_opportunities" ON public.opportunities FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.user_preferences (
  user_id uuid PRIMARY KEY DEFAULT auth.uid(),
  intro_dismissed boolean NOT NULL DEFAULT false
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_preferences TO authenticated;
GRANT ALL ON public.user_preferences TO service_role;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_preferences" ON public.user_preferences FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_preferences" ON public.user_preferences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_preferences" ON public.user_preferences FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_preferences" ON public.user_preferences FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  description text NOT NULL DEFAULT '',
  value numeric(14,2) NOT NULL CHECK (value >= 0),
  status text NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','enviada','aceita','recusada')),
  sent_at timestamptz,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX proposals_user_id_idx ON public.proposals (user_id);
CREATE INDEX proposals_opportunity_id_idx ON public.proposals (opportunity_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proposals TO authenticated;
GRANT ALL ON public.proposals TO service_role;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_proposals" ON public.proposals FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_proposals" ON public.proposals FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.opportunities o WHERE o.id = proposals.opportunity_id AND o.user_id = auth.uid()));
CREATE POLICY "update_own_proposals" ON public.proposals FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (
  auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.opportunities o WHERE o.id = proposals.opportunity_id AND o.user_id = auth.uid()));
CREATE POLICY "delete_own_proposals" ON public.proposals FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.ai_usage (
  user_id uuid NOT NULL,
  usage_date date NOT NULL DEFAULT current_date,
  calls integer NOT NULL DEFAULT 0 CHECK (calls >= 0),
  PRIMARY KEY (user_id, usage_date)
);
GRANT SELECT ON public.ai_usage TO authenticated;
GRANT ALL ON public.ai_usage TO service_role;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_ai_usage" ON public.ai_usage FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.consume_ai_quota(p_user uuid, p_limit integer)
RETURNS integer LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_calls integer;
BEGIN
  INSERT INTO public.ai_usage (user_id, usage_date, calls) VALUES (p_user, current_date, 1)
  ON CONFLICT (user_id, usage_date) DO UPDATE SET calls = ai_usage.calls + 1
  WHERE ai_usage.calls < p_limit
  RETURNING calls INTO v_calls;
  RETURN v_calls;
END; $$;
REVOKE EXECUTE ON FUNCTION public.consume_ai_quota(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_ai_quota(uuid, integer) TO service_role;