-- RTM Generator Schema
-- Add to existing supabase-schema.sql or run separately

-- Table for storing RTM reports
CREATE TABLE IF NOT EXISTS rtm_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    report_name TEXT NOT NULL DEFAULT 'Untitled RTM',
    requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
    test_cases JSONB NOT NULL DEFAULT '[]'::jsonb,
    mappings JSONB NOT NULL DEFAULT '[]'::jsonb,
    metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster user queries
CREATE INDEX IF NOT EXISTS idx_rtm_reports_user_id ON rtm_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_rtm_reports_updated_at ON rtm_reports(updated_at DESC);

-- RLS Policies
ALTER TABLE rtm_reports ENABLE ROW LEVEL SECURITY;

-- Users can only see their own RTM reports
CREATE POLICY "Users can view own RTM reports"
    ON rtm_reports FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own RTM reports
CREATE POLICY "Users can insert own RTM reports"
    ON rtm_reports FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own RTM reports
CREATE POLICY "Users can update own RTM reports"
    ON rtm_reports FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own RTM reports
CREATE POLICY "Users can delete own RTM reports"
    ON rtm_reports FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_rtm_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rtm_reports_updated_at
    BEFORE UPDATE ON rtm_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_rtm_reports_updated_at();
