-- RLS Policy for Agents on properties table
DROP POLICY IF EXISTS "properties_select_agents" ON public.properties;
CREATE POLICY "properties_select_agents" ON public.properties 
FOR SELECT USING (EXISTS (SELECT 1 FROM public.agents WHERE user_id = auth.uid()));

-- RLS Policy for Agents on kostmanager_requests table
DROP POLICY IF EXISTS "kostmanager_requests_select_agents" ON public.kostmanager_requests;
CREATE POLICY "kostmanager_requests_select_agents" ON public.kostmanager_requests 
FOR SELECT USING (EXISTS (SELECT 1 FROM public.agents WHERE user_id = auth.uid()));
