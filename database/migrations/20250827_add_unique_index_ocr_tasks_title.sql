-- Ensure unique titles for OCR tasks
CREATE UNIQUE INDEX IF NOT EXISTS uq_ocr_tasks_title ON ocr_tasks(title);
