-- Add LLM/TTS columns to support step-wise statuses and LLM payload persistence

-- 1) ocr_task_images: add per-step statuses + timestamps
ALTER TABLE IF EXISTS ocr_task_images
  ADD COLUMN IF NOT EXISTS llm_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (llm_status IN ('pending','processing','completed','failed')),
  ADD COLUMN IF NOT EXISTS tts_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (tts_status IN ('pending','processing','completed','failed')),
  ADD COLUMN IF NOT EXISTS llm_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS llm_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tts_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tts_completed_at TIMESTAMPTZ;

-- 2) ocr_results: add fields to store LLM output payload + timings
ALTER TABLE IF EXISTS ocr_results
  ADD COLUMN IF NOT EXISTS llm_spelling JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS llm_extracted_info JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS llm_processing_time_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS llm_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS llm_completed_at TIMESTAMPTZ;

-- 3) ocr_tasks: high-level processing step (optional aggregate)
ALTER TABLE IF EXISTS ocr_tasks
  ADD COLUMN IF NOT EXISTS step VARCHAR(20) NOT NULL DEFAULT 'upload' CHECK (step IN ('upload','ocr','llm','tts','completed')),
  ADD COLUMN IF NOT EXISTS step_updated_at TIMESTAMPTZ;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_ocr_task_images_llm_status ON ocr_task_images(llm_status);
CREATE INDEX IF NOT EXISTS idx_ocr_task_images_tts_status ON ocr_task_images(tts_status);
CREATE INDEX IF NOT EXISTS idx_ocr_results_llm_started_at ON ocr_results(llm_started_at);
CREATE INDEX IF NOT EXISTS idx_ocr_results_llm_completed_at ON ocr_results(llm_completed_at);
CREATE INDEX IF NOT EXISTS idx_ocr_tasks_step ON ocr_tasks(step);
