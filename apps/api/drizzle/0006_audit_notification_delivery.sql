CREATE TABLE audit_logs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_id uuid,
 resource_type text NOT NULL, resource_id uuid NOT NULL, action text NOT NULL,
 old_value jsonb, new_value jsonb, reason text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type,resource_id,created_at);
CREATE TABLE notification_emails (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 notification_id uuid NOT NULL UNIQUE REFERENCES contest_notifications(id) ON DELETE CASCADE,
 recipient text NOT NULL, status varchar(20) NOT NULL DEFAULT 'PENDING'
 CHECK(status IN ('PENDING','FAILED','SENT')), attempts integer NOT NULL DEFAULT 0,
 last_error text, sent_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE FUNCTION audit_safe_json(value jsonb) RETURNS jsonb LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE result jsonb; k text; v jsonb;
BEGIN
 IF value IS NULL THEN RETURN NULL; END IF;
 IF jsonb_typeof(value)='object' THEN
  result := '{}';
  FOR k,v IN SELECT * FROM jsonb_each(value) LOOP
   IF k !~* '(password|token|secret|credential|authorization|api.?key)' THEN
    result := result || jsonb_build_object(k,audit_safe_json(v));
   END IF;
  END LOOP;
  RETURN result;
 ELSIF jsonb_typeof(value)='array' THEN
  SELECT coalesce(jsonb_agg(audit_safe_json(a)), '[]') INTO result FROM jsonb_array_elements(value) a;
  RETURN result;
 END IF;
 RETURN value;
END $$;
CREATE FUNCTION record_core_audit() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE before_row jsonb; after_row jsonb; row_data jsonb; actor uuid; resource uuid;
BEGIN
 IF TG_OP <> 'INSERT' THEN before_row := audit_safe_json(to_jsonb(OLD)); END IF;
 IF TG_OP <> 'DELETE' THEN after_row := audit_safe_json(to_jsonb(NEW)); END IF;
 IF TG_OP='UPDATE' AND before_row=after_row THEN RETURN NEW; END IF;
 row_data := coalesce(after_row,before_row);
 actor := nullif(current_setting('cinegen.actor_id',true),'')::uuid;
 resource := coalesce(row_data->>'id',row_data->>'contest_id')::uuid;
 INSERT INTO audit_logs(actor_id,resource_type,resource_id,action,old_value,new_value,reason)
 VALUES(actor,TG_TABLE_NAME,resource,TG_OP,before_row,after_row,
 coalesce(row_data->>'reason',row_data->>'rejection_reason',
 CASE WHEN TG_TABLE_NAME='contest_publications' THEN (row_data->'tie_breaks')::text END));
 RETURN coalesce(NEW,OLD);
END $$;
DO $$ DECLARE name text; BEGIN
 FOREACH name IN ARRAY ARRAY['contests','categories','scoring_criteria','judging_rounds','submissions',
 'submission_moderation_logs','submission_ai_analyses','evaluations','evaluation_scores','contest_publications','exhibition_images'] LOOP
 EXECUTE format('CREATE TRIGGER core_audit AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION record_core_audit()',name);
 END LOOP;
END $$;
CREATE FUNCTION queue_notification_email() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 INSERT INTO notification_emails(notification_id,recipient)
 SELECT NEW.id,email FROM users WHERE id=NEW.recipient_id;
 RETURN NEW;
END $$;
CREATE TRIGGER notification_email AFTER INSERT ON contest_notifications FOR EACH ROW EXECUTE FUNCTION queue_notification_email();
CREATE FUNCTION notify_submission_decision() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.status IN ('APPROVED','DISQUALIFIED') AND OLD.status IS DISTINCT FROM NEW.status THEN
  INSERT INTO contest_notifications(recipient_id,contest_id,kind,data)
  VALUES(NEW.participant_id,NEW.contest_id,'SUBMISSION_STATUS',jsonb_build_object(
   'submissionId',NEW.id,'status',NEW.status,'reason',NEW.rejection_reason));
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER submission_decision_notification AFTER UPDATE OF status ON submissions
 FOR EACH ROW EXECUTE FUNCTION notify_submission_decision();
