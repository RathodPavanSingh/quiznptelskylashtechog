import { pool } from "@/db";

let bootstrapped = false;

/**
 * Recreates all required tables after sandbox DB resets.
 * This prevents generic 500s when PostgreSQL becomes empty.
 */
export async function bootstrapDatabase() {
  if (bootstrapped) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT,
      reg_no TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      provider TEXT NOT NULL DEFAULT 'password',
      role TEXT NOT NULL DEFAULT 'student',
      name TEXT,
      login_count INTEGER NOT NULL DEFAULT 0,
      last_login_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS login_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      provider TEXT NOT NULL DEFAULT 'password',
      action TEXT NOT NULL DEFAULT 'login',
      user_agent TEXT,
      ip TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS login_logs_user_idx ON login_logs(user_id);
    CREATE INDEX IF NOT EXISTS login_logs_at_idx ON login_logs(created_at);

    CREATE TABLE IF NOT EXISTS sessions (
      id SERIAL PRIMARY KEY,
      token TEXT NOT NULL UNIQUE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS sessions_token_idx ON sessions(token);
    CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);

    CREATE TABLE IF NOT EXISTS courses (
      id SERIAL PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      total_units INTEGER NOT NULL DEFAULT 12,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS questions (
      id SERIAL PRIMARY KEY,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      year INTEGER NOT NULL,
      unit INTEGER NOT NULL,
      question_text TEXT NOT NULL,
      options JSONB NOT NULL,
      correct_index INTEGER NOT NULL,
      explanation TEXT,
      question_type TEXT NOT NULL DEFAULT 'mcq',
      correct_indices JSONB,
      numerical_answer DOUBLE PRECISION,
      numerical_tolerance DOUBLE PRECISION,
      numerical_unit TEXT,
      image_url TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS questions_course_year_idx ON questions(course_id, year);
    CREATE INDEX IF NOT EXISTS questions_course_unit_idx ON questions(course_id, unit);

    CREATE TABLE IF NOT EXISTS programming_questions (
      id SERIAL PRIMARY KEY,
      number TEXT NOT NULL,
      title TEXT NOT NULL,
      difficulty TEXT NOT NULL DEFAULT 'Easy',
      topic TEXT NOT NULL,
      language TEXT NOT NULL DEFAULT 'C',
      time_seconds INTEGER NOT NULL DEFAULT 40,
      is_pyq BOOLEAN NOT NULL DEFAULT TRUE,
      year INTEGER,
      question_text TEXT NOT NULL,
      code_snippet TEXT,
      options JSONB NOT NULL,
      correct_index INTEGER NOT NULL,
      explanation TEXT,
      tags JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS prog_q_topic_idx ON programming_questions(topic);
    CREATE INDEX IF NOT EXISTS prog_q_diff_idx ON programming_questions(difficulty);

    CREATE TABLE IF NOT EXISTS coding_problems (
      id SERIAL PRIMARY KEY,
      number INTEGER NOT NULL,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      difficulty TEXT NOT NULL DEFAULT 'Easy',
      topic TEXT NOT NULL,
      is_pyq BOOLEAN NOT NULL DEFAULT TRUE,
      statement TEXT NOT NULL,
      constraints TEXT NOT NULL,
      input_format TEXT NOT NULL,
      output_format TEXT NOT NULL,
      sample_input TEXT NOT NULL,
      sample_output TEXT NOT NULL,
      sample_explanation TEXT,
      solutions JSONB NOT NULL DEFAULT '[]'::jsonb,
      common_mistakes JSONB NOT NULL DEFAULT '[]'::jsonb,
      similar_problems JSONB NOT NULL DEFAULT '[]'::jsonb,
      pro_tip TEXT,
      exam TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS coding_topic_idx ON coding_problems(topic);
    CREATE INDEX IF NOT EXISTS coding_diff_idx ON coding_problems(difficulty);
    CREATE INDEX IF NOT EXISTS coding_exam_idx ON coding_problems(exam);

    CREATE TABLE IF NOT EXISTS practice_questions (
      id SERIAL PRIMARY KEY,
      category TEXT NOT NULL,
      section TEXT NOT NULL,
      number TEXT NOT NULL,
      difficulty TEXT NOT NULL DEFAULT 'Easy',
      topic TEXT NOT NULL,
      time_seconds INTEGER NOT NULL DEFAULT 40,
      is_pyq BOOLEAN NOT NULL DEFAULT TRUE,
      year INTEGER,
      question_text TEXT NOT NULL,
      options JSONB NOT NULL,
      correct_index INTEGER NOT NULL,
      explanation TEXT,
      tags JSONB NOT NULL DEFAULT '[]'::jsonb,
      question_type TEXT NOT NULL DEFAULT 'mcq',
      correct_indices JSONB,
      numerical_answer DOUBLE PRECISION,
      numerical_tolerance DOUBLE PRECISION,
      numerical_unit TEXT,
      image_url TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS practice_cat_sec_idx ON practice_questions(category, section);
    CREATE INDEX IF NOT EXISTS practice_topic_idx ON practice_questions(topic);
    CREATE INDEX IF NOT EXISTS practice_diff_idx ON practice_questions(difficulty);
    CREATE INDEX IF NOT EXISTS practice_category_idx ON practice_questions(category);
    CREATE INDEX IF NOT EXISTS practice_tags_idx ON practice_questions USING gin(tags);

    CREATE TABLE IF NOT EXISTS jee_questions (
      id SERIAL PRIMARY KEY,
      exam TEXT NOT NULL,
      subject TEXT NOT NULL,
      chapter TEXT NOT NULL,
      number TEXT NOT NULL,
      difficulty TEXT NOT NULL DEFAULT 'Easy',
      question_text TEXT NOT NULL,
      options JSONB NOT NULL,
      correct_index INTEGER NOT NULL,
      explanation TEXT,
      year INTEGER,
      is_pyq BOOLEAN NOT NULL DEFAULT TRUE,
      tags JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS jee_exam_sub_ch_idx ON jee_questions(exam, subject, chapter);
    CREATE INDEX IF NOT EXISTS jee_exam_idx ON jee_questions(exam);

    CREATE TABLE IF NOT EXISTS contact_messages (
      id SERIAL PRIMARY KEY,
      name TEXT,
      email TEXT,
      role TEXT,
      subject TEXT,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      sent_to TEXT NOT NULL,
      delivery_mode TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS books (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      file_url TEXT NOT NULL,
      cover_url TEXT,
      category TEXT NOT NULL DEFAULT 'General',
      year INTEGER,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS purchase_otps (
      id SERIAL PRIMARY KEY,
      mobile TEXT NOT NULL,
      otp_hash TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      verified BOOLEAN NOT NULL DEFAULT FALSE,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS purchase_otps_mobile_idx ON purchase_otps(mobile);

    CREATE TABLE IF NOT EXISTS course_purchases (
      id SERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      mobile TEXT NOT NULL,
      email TEXT NOT NULL,
      course_name TEXT NOT NULL DEFAULT 'Full Course Access',
      amount_rupees INTEGER NOT NULL DEFAULT 500,
      payment_ref TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'pending',
      payment_mode TEXT NOT NULL DEFAULT 'simulation',
      payment_details JSONB,
      payment_last4 TEXT,
      joined_course BOOLEAN NOT NULL DEFAULT FALSE,
      ip TEXT,
      user_agent TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS course_purchases_mobile_idx ON course_purchases(mobile);
    CREATE INDEX IF NOT EXISTS course_purchases_status_idx ON course_purchases(status);
  `);

  bootstrapped = true;
}
