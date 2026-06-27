-- =========================================================================
--                     LEARNING OS — SUPABASE SCHEMA INITIALIZATION
-- =========================================================================
-- Copy and paste this script into the Supabase SQL Editor (Dashboard > SQL Editor)
-- and click "Run". This will set up the core database structure and table indexes.

-- 1. Enable vector extensions for pgvector semantic embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create Students Table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  timezone TEXT DEFAULT 'UTC',
  language TEXT DEFAULT 'en',
  college TEXT,
  semester TEXT,
  target_exam TEXT DEFAULT 'UGC NET Electronics',
  target_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Concept Registry Table
CREATE TABLE IF NOT EXISTS concepts (
  id TEXT PRIMARY KEY, -- Hierarchical name ID (e.g. 'electronics.semiconductor.mosfet')
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  chapter TEXT NOT NULL,
  difficulty INTEGER DEFAULT 3, -- Scale 1-5
  importance INTEGER DEFAULT 3, -- Scale 1-5
  prerequisites TEXT[] DEFAULT '{}',
  aliases TEXT[] DEFAULT '{}',
  misconceptions TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Question Bank Table
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'MCQ', -- MCQ, NUMERICAL, SHORT_ANSWER
  difficulty INTEGER DEFAULT 3, -- Scale 1-5
  concept_ids TEXT[] DEFAULT '{}',
  formula_ids TEXT[] DEFAULT '{}',
  source TEXT DEFAULT 'UGC NET PYQ',
  year INTEGER,
  marks INTEGER DEFAULT 2,
  solution TEXT,
  hints TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Study Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  subject TEXT,
  chapter TEXT,
  active_workflow TEXT,
  current_step_index INTEGER DEFAULT 0,
  resume_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create Student Learning Genome: Mastery Table
CREATE TABLE IF NOT EXISTS mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  concept_id TEXT REFERENCES concepts(id) ON DELETE CASCADE,
  knowledge_score NUMERIC DEFAULT 0.0,      -- 0 to 100
  understanding_score NUMERIC DEFAULT 0.0,  -- 0 to 100
  application_score NUMERIC DEFAULT 0.0,    -- 0 to 100
  retention_score NUMERIC DEFAULT 0.0,      -- 0 to 100
  confidence_score NUMERIC DEFAULT 0.0,      -- 0 to 100
  speed_score NUMERIC DEFAULT 0.0,           -- 0 to 100
  teaching_score NUMERIC DEFAULT 0.0,        -- 0 to 100
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, concept_id)
);

-- 7. Create Student Learning Genome: Preferences Table
CREATE TABLE IF NOT EXISTS preferences (
  student_id UUID PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
  visual_weight NUMERIC DEFAULT 0.5,
  examples_weight NUMERIC DEFAULT 0.5,
  theory_weight NUMERIC DEFAULT 0.5,
  practice_weight NUMERIC DEFAULT 0.5,
  animation_weight NUMERIC DEFAULT 0.5,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Create Mistakes Log Table
CREATE TABLE IF NOT EXISTS mistakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  concept_id TEXT REFERENCES concepts(id) ON DELETE CASCADE,
  mistake_type TEXT NOT NULL, -- formula_error, concept_confusion, calculation_error, guess, etc.
  reasoning TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Create Spaced-Repetition Revision Table
CREATE TABLE IF NOT EXISTS revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  concept_id TEXT REFERENCES concepts(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  retention_score NUMERIC DEFAULT 0.0,
  interval_days INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Create Study Plans Table
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  plan_date DATE NOT NULL,
  activities JSONB DEFAULT '[]', -- List of structured learning blocks
  status TEXT DEFAULT 'PENDING',  -- PENDING, IN_PROGRESS, COMPLETED
  priority INTEGER DEFAULT 2,     -- Scale 1-3
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Create Embeddings Cache Table for Fast Semantic Search
CREATE TABLE IF NOT EXISTS embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id TEXT NOT NULL, -- References concept id, question id, or chunk ID
  source_type TEXT NOT NULL, -- 'concept', 'question', 'chunk', 'formula'
  content TEXT NOT NULL,
  embedding VECTOR(384), -- Dimension 384 for Nomic/Jina/BGE lightweight embeddings
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Create Efficient Indexes
CREATE INDEX IF NOT EXISTS idx_mastery_student ON mastery(student_id);
CREATE INDEX IF NOT EXISTS idx_revisions_schedule ON revisions(student_id, scheduled_date) WHERE completed = FALSE;
CREATE INDEX IF NOT EXISTS idx_mistakes_student ON mistakes(student_id);
CREATE INDEX IF NOT EXISTS idx_plans_date ON plans(student_id, plan_date);
CREATE INDEX IF NOT EXISTS idx_embeddings_cosine ON embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
