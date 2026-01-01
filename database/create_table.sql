-- OCR Editing - PostgreSQL Schema (no foreign keys)
-- Consolidated table creation script for the entire project
-- Safe to run on a fresh database. Adjust DROP statements as needed.

-- 0) Drop tables if they exist (order chosen to avoid dependency issues)
DROP TABLE IF EXISTS password_reset_token;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS image_files;
DROP TABLE IF EXISTS text_regions;
DROP TABLE IF EXISTS word_timestamps;
DROP TABLE IF EXISTS audio_files;
DROP TABLE IF EXISTS word_coordinates;
DROP TABLE IF EXISTS manual_edits;
DROP TABLE IF EXISTS user_activities;
DROP TABLE IF EXISTS task_statistics;
DROP TABLE IF EXISTS system_logs;
DROP TABLE IF EXISTS ocr_results;
DROP TABLE IF EXISTS ocr_task_images;
DROP TABLE IF EXISTS ocr_tasks;
DROP TABLE IF EXISTS users;

-- 1) users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  user_name VARCHAR(100) NOT NULL,
  password VARCHAR(150) NOT NULL,
  name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  email VARCHAR(150) NOT NULL,
  phone_number VARCHAR(20),
  address TEXT,
  sub VARCHAR(64),
  is_active BOOLEAN DEFAULT TRUE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_by INTEGER,
  is_sso BOOLEAN DEFAULT FALSE,
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('super_admin','admin','user')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  preferences JSONB DEFAULT '{}'::jsonb
);

-- Unique email to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_name ON users(user_name);
CREATE INDEX IF NOT EXISTS idx_users_sub ON users(sub);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_is_sso ON users(is_sso);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_deleted ON users(is_deleted);

-- 2) ocr_tasks
CREATE TABLE ocr_tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  step VARCHAR(20) NOT NULL DEFAULT 'upload' CHECK (step IN ('upload','ocr','llm','tts','completed')),
  image_url VARCHAR(500) NOT NULL,
  image_filename VARCHAR(255) NOT NULL,
  image_size BIGINT NOT NULL,
  image_type VARCHAR(50) NOT NULL,
  enable_llm_correction BOOLEAN DEFAULT TRUE,
  enable_tts BOOLEAN DEFAULT TRUE,
  auto_process BOOLEAN DEFAULT TRUE,
  user_id INTEGER NOT NULL,
  created_by VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  step_updated_at TIMESTAMPTZ,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_ocr_tasks_user_id ON ocr_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_ocr_tasks_status ON ocr_tasks(status);
CREATE INDEX IF NOT EXISTS idx_ocr_tasks_step ON ocr_tasks(step);
CREATE INDEX IF NOT EXISTS idx_ocr_tasks_is_deleted ON ocr_tasks(is_deleted);
CREATE INDEX IF NOT EXISTS idx_ocr_tasks_created_at ON ocr_tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_ocr_tasks_metadata_gin ON ocr_tasks USING GIN (metadata);
CREATE UNIQUE INDEX IF NOT EXISTS uq_ocr_tasks_title ON ocr_tasks(title);

-- 3) ocr_results (includes new columns used by code)
CREATE TABLE ocr_results (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL,
  task_image_id INTEGER,
  -- text results
  extracted_text TEXT,
  original_text TEXT NOT NULL,
  corrected_text TEXT,
  final_text TEXT,
  -- metrics
  text_count INTEGER DEFAULT 0,
  avg_confidence REAL DEFAULT 0.0,
  confidence_score DECIMAL(5,3),
  accuracy_percentage DECIMAL(5,2),
  total_words INTEGER NOT NULL DEFAULT 0,
  low_confidence_words INTEGER DEFAULT 0,
  -- processing info
  source_filename TEXT,
  ocr_engine VARCHAR(50),
  llm_model VARCHAR(50),
  processing_time_seconds INTEGER,
  worker_pid INTEGER,
  -- LLM payloads
  llm_spelling JSONB DEFAULT '[]'::jsonb,
  llm_extracted_info JSONB DEFAULT '[]'::jsonb,
  llm_processing_time_seconds INTEGER,
  llm_started_at TIMESTAMPTZ,
  llm_completed_at TIMESTAMPTZ,
  -- timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ocr_results_task_id ON ocr_results(task_id);
CREATE INDEX IF NOT EXISTS idx_ocr_results_task_image_id ON ocr_results(task_image_id);
CREATE INDEX IF NOT EXISTS idx_ocr_results_llm_started_at ON ocr_results(llm_started_at);
CREATE INDEX IF NOT EXISTS idx_ocr_results_llm_completed_at ON ocr_results(llm_completed_at);

-- 4.1) ocr_task_images (child images per task)
CREATE TABLE ocr_task_images (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  image_filename VARCHAR(255),
  image_size BIGINT,
  image_type VARCHAR(50),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  llm_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (llm_status IN ('pending','processing','completed','failed')),
  tts_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (tts_status IN ('pending','processing','completed','failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  llm_started_at TIMESTAMPTZ,
  llm_completed_at TIMESTAMPTZ,
  tts_started_at TIMESTAMPTZ,
  tts_completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ocr_task_images_task_id ON ocr_task_images(task_id);
CREATE INDEX IF NOT EXISTS idx_ocr_task_images_llm_status ON ocr_task_images(llm_status);
CREATE INDEX IF NOT EXISTS idx_ocr_task_images_tts_status ON ocr_task_images(tts_status);

-- 4) text_regions (no FK)
CREATE TABLE text_regions (
  id SERIAL PRIMARY KEY,
  ocr_result_id INTEGER NOT NULL,
  text TEXT NOT NULL,
  original_text TEXT,
  corrected_text TEXT,
  manual_text TEXT,
  bbox_x1 INTEGER NOT NULL,
  bbox_y1 INTEGER NOT NULL,
  bbox_x2 INTEGER NOT NULL,
  bbox_y2 INTEGER NOT NULL,
  bbox_width INTEGER NOT NULL,
  bbox_height INTEGER NOT NULL,
  confidence REAL NOT NULL DEFAULT 0.0,
  region_index INTEGER NOT NULL DEFAULT 0,
  is_edited BOOLEAN DEFAULT FALSE,
  is_selected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (confidence >= 0.0 AND confidence <= 1.0),
  CHECK (bbox_x1 >= 0 AND bbox_y1 >= 0),
  CHECK (bbox_x2 >= bbox_x1 AND bbox_y2 >= bbox_y1),
  CHECK (bbox_width >= 0 AND bbox_height >= 0)
);

CREATE INDEX IF NOT EXISTS idx_text_regions_result_id ON text_regions(ocr_result_id);
CREATE INDEX IF NOT EXISTS idx_text_regions_region_index ON text_regions(region_index);

-- 5) word_coordinates
CREATE TABLE word_coordinates (
  id SERIAL PRIMARY KEY,
  result_id INTEGER NOT NULL,
  task_id INTEGER NOT NULL,
  word TEXT NOT NULL,
  word_index INTEGER NOT NULL,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  confidence DECIMAL(5,3) NOT NULL,
  is_corrected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_word_coordinates_task_id ON word_coordinates(task_id);
CREATE INDEX IF NOT EXISTS idx_word_coordinates_result_id ON word_coordinates(result_id);

-- 6) audio_files
CREATE TABLE audio_files (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL,
  result_id INTEGER NOT NULL,
  audio_url VARCHAR(500) NOT NULL,
  audio_filename VARCHAR(255) NOT NULL,
  audio_size BIGINT,
  audio_format VARCHAR(10) DEFAULT 'mp3',
  duration_seconds DECIMAL(8,3),
  tts_engine VARCHAR(50),
  voice_model VARCHAR(50),
  language_code VARCHAR(10) DEFAULT 'en-US',
  speech_rate DECIMAL(3,2) DEFAULT 1.0,
  generation_time_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audio_files_task_id ON audio_files(task_id);
CREATE INDEX IF NOT EXISTS idx_audio_files_result_id ON audio_files(result_id);

-- 7) word_timestamps
CREATE TABLE word_timestamps (
  id SERIAL PRIMARY KEY,
  audio_file_id INTEGER NOT NULL,
  task_id INTEGER NOT NULL,
  word TEXT NOT NULL,
  word_index INTEGER NOT NULL,
  start_time DECIMAL(8,3) NOT NULL,
  end_time DECIMAL(8,3) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_word_timestamps_audio_file_id ON word_timestamps(audio_file_id);

-- 8) manual_edits
CREATE TABLE manual_edits (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL,
  result_id INTEGER NOT NULL,
  word_index INTEGER NOT NULL,
  original_word TEXT NOT NULL,
  edited_word TEXT NOT NULL,
  edit_type VARCHAR(20) NOT NULL DEFAULT 'correction' CHECK (edit_type IN ('correction','addition','deletion','replacement')),
  edit_reason VARCHAR(50) DEFAULT 'manual_correction' CHECK (edit_reason IN ('ocr_error','spelling_error','grammar_error','formatting','punctuation','capitalization','manual_correction','other')),
  edit_notes TEXT,
  user_id INTEGER NOT NULL,
  editor_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_manual_edits_task_id ON manual_edits(task_id);
CREATE INDEX IF NOT EXISTS idx_manual_edits_user_id ON manual_edits(user_id);

-- 9) user_activities
CREATE TABLE user_activities (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  username VARCHAR(100) NOT NULL,
  activity_type VARCHAR(30) NOT NULL CHECK (activity_type IN ('task_created','task_completed','task_deleted','text_edited','audio_played','results_downloaded','task_shared')),
  task_id INTEGER,
  details JSONB DEFAULT '{}'::jsonb,
  duration_seconds INTEGER,
  accuracy_achieved DECIMAL(5,2),
  words_processed INTEGER,
  edits_made INTEGER DEFAULT 0,
  session_id VARCHAR(100),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_task_id ON user_activities(task_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at);

-- 10) task_statistics
CREATE TABLE task_statistics (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  total_processing_time_seconds INTEGER NOT NULL DEFAULT 0,
  ocr_processing_time_seconds INTEGER DEFAULT 0,
  llm_processing_time_seconds INTEGER DEFAULT 0,
  tts_processing_time_seconds INTEGER DEFAULT 0,
  original_word_count INTEGER NOT NULL DEFAULT 0,
  corrected_word_count INTEGER DEFAULT 0,
  manually_edited_word_count INTEGER DEFAULT 0,
  final_accuracy_percentage DECIMAL(5,2),
  improvement_percentage DECIMAL(5,2),
  total_edit_sessions INTEGER DEFAULT 0,
  total_time_spent_seconds INTEGER DEFAULT 0,
  audio_play_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  words_per_minute DECIMAL(6,2),
  error_rate DECIMAL(5,3),
  efficiency_score DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_statistics_user_id ON task_statistics(user_id);
CREATE INDEX IF NOT EXISTS idx_task_statistics_task_id ON task_statistics(task_id);

-- 10.1) system_logs (generic system/event/audit log)
CREATE TABLE system_logs (
  id SERIAL PRIMARY KEY,
  level VARCHAR(10) NOT NULL DEFAULT 'info' CHECK (level IN ('debug','info','warn','error')),
  event VARCHAR(100) NOT NULL,              -- e.g., ocr_start, ocr_completed, llm_start, llm_apply
  module VARCHAR(100),                      -- e.g., api/ocr, api/llm, middleware
  action VARCHAR(100),                      -- free-form action name
  message TEXT,                             -- human-friendly summary
  user_id INTEGER,
  task_id INTEGER,
  task_image_id INTEGER,
  result_id INTEGER,
  request_id VARCHAR(64),                   -- trace/request id if any
  route VARCHAR(255),                       -- request route path
  method VARCHAR(10),                       -- HTTP method
  status_code INTEGER,                      -- HTTP status code
  ip_address INET,                          -- client IP if available
  user_agent TEXT,                          -- UA string if available
  details JSONB DEFAULT '{}'::jsonb,        -- arbitrary structured payload
  error_stack TEXT,                         -- error stack if any
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_logs_event ON system_logs(event);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_task_id ON system_logs(task_id);

-- 11) refresh_tokens (no FK)
CREATE TABLE refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  token_hash VARCHAR(64) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP,
  is_revoked BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- 12) image_files
CREATE TABLE image_files (
  id VARCHAR(36) PRIMARY KEY,
  path VARCHAR(500) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  width INT,
  height INT,
  task_id VARCHAR(36),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_image_files_task_id ON image_files(task_id);
CREATE INDEX IF NOT EXISTS idx_image_files_created_at ON image_files(created_at);
CREATE INDEX IF NOT EXISTS idx_image_files_mime_type ON image_files(mime_type);
CREATE INDEX IF NOT EXISTS idx_image_files_path ON image_files(path);

-- 13) password_reset_token
CREATE TABLE password_reset_token (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_password_reset_token_user_id ON password_reset_token(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_token_token ON password_reset_token(token);

-- 14) updated_at trigger function and triggers
-- Function to auto-update updated_at on row modifications
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Attach triggers to tables that have an updated_at column
DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_ocr_tasks_updated_at ON ocr_tasks;
CREATE TRIGGER trg_ocr_tasks_updated_at
BEFORE UPDATE ON ocr_tasks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_ocr_results_updated_at ON ocr_results;
CREATE TRIGGER trg_ocr_results_updated_at
BEFORE UPDATE ON ocr_results
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_audio_files_updated_at ON audio_files;
CREATE TRIGGER trg_audio_files_updated_at
BEFORE UPDATE ON audio_files
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_task_statistics_updated_at ON task_statistics;
CREATE TRIGGER trg_task_statistics_updated_at
BEFORE UPDATE ON task_statistics
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_image_files_updated_at ON image_files;
CREATE TRIGGER trg_image_files_updated_at
BEFORE UPDATE ON image_files
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_text_regions_updated_at ON text_regions;
CREATE TRIGGER trg_text_regions_updated_at
BEFORE UPDATE ON text_regions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_ocr_task_images_updated_at ON ocr_task_images;
CREATE TRIGGER trg_ocr_task_images_updated_at
BEFORE UPDATE ON ocr_task_images
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 15) Seed default super_admin user (id auto-generated)
-- Password is bcrypt-hashed for: "bach.tv2000@gmail.com2025"
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'bach.tv2000@gmail.com'
  ) THEN
    INSERT INTO users (
      user_name,
      password,
      name,
      email,
      avatar_url,
      phone_number,
      address,
      is_active,
      is_deleted,
      is_sso,
      role,
      created_at,
      updated_at,
      preferences
    ) VALUES (
      'bach.tv2000',
      '$2b$10$dlmPwV0NfM9kHM2VCBW3euitglLY2s5IBA1IMPHejB1vT.BT.283u',
      'Bach TV',
      'bach.tv2000@gmail.com',
      NULL,
      NULL,
      NULL,
      TRUE,
      FALSE,
      FALSE,
      'super_admin',
      NOW(),
      NOW(),
      '{}'::jsonb
    );
  END IF;
END$$;
