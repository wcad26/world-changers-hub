-- Add the current DCG leader as a member of their DCG
INSERT INTO public.dcg_members (dcg_id, member_id, role, joined_date)
SELECT 'b27666bf-c0a6-414b-8d18-4f02ca6f7642', 'fc6988d5-f86b-4d11-aa1f-197340f538d3', 'Leader', CURRENT_DATE
WHERE NOT EXISTS (
  SELECT 1 FROM public.dcg_members 
  WHERE dcg_id = 'b27666bf-c0a6-414b-8d18-4f02ca6f7642' 
  AND member_id = 'fc6988d5-f86b-4d11-aa1f-197340f538d3'
);