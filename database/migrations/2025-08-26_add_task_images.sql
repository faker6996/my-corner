-- Migration: Add ocr_task_images table and task_image_id column on ocr_results

-- 1) Create ocr_task_images (if not exists)
CREATE TABLE IF NOT EXISTS ocr_task_images (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  image_filename VARCHAR(255),
  image_size BIGINT,
  image_type VARCHAR(50),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ocr_task_images_task_id ON ocr_task_images(task_id);

-- 2) Add task_image_id to ocr_results (nullable for backward-compat)
ALTER TABLE ocr_results
  ADD COLUMN IF NOT EXISTS task_image_id INTEGER;

CREATE INDEX IF NOT EXISTS idx_ocr_results_task_image_id ON ocr_results(task_image_id);

-- 3) Trigger for updated_at on ocr_task_images
DROP TRIGGER IF EXISTS trg_ocr_task_images_updated_at ON ocr_task_images;
CREATE TRIGGER trg_ocr_task_images_updated_at
BEFORE UPDATE ON ocr_task_images
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
