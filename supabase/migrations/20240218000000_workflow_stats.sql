-- Create function to get workflow execution statistics
CREATE OR REPLACE FUNCTION get_workflow_stats()
RETURNS TABLE (
  status text,
  count bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    status,
    COUNT(*) as count
  FROM workflow_executions
  GROUP BY status
  ORDER BY status;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_workflow_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_workflow_stats() TO service_role;
