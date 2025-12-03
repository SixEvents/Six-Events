-- Create function to trigger email processing via Edge Function
CREATE OR REPLACE FUNCTION trigger_email_processing()
RETURNS TRIGGER AS $$
DECLARE
  request_id bigint;
BEGIN
  -- Call Edge Function to process email queue
  -- Using pg_net extension to make HTTP request
  SELECT net.http_post(
    url := 'https://rzcdcwwdlnczojmslhax.supabase.co/functions/v1/process-email-queue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    )
  ) INTO request_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to process emails when inserted
DROP TRIGGER IF EXISTS on_email_queue_insert ON email_queue;
CREATE TRIGGER on_email_queue_insert
  AFTER INSERT ON email_queue
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION trigger_email_processing();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated, service_role;
