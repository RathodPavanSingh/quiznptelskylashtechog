CREATE TABLE "books" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"file_url" text NOT NULL,
	"cover_url" text,
	"category" text DEFAULT 'General' NOT NULL,
	"year" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coding_problems" (
	"id" serial PRIMARY KEY NOT NULL,
	"number" integer NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"difficulty" text DEFAULT 'Easy' NOT NULL,
	"topic" text NOT NULL,
	"is_pyq" boolean DEFAULT true NOT NULL,
	"statement" text NOT NULL,
	"constraints" text NOT NULL,
	"input_format" text NOT NULL,
	"output_format" text NOT NULL,
	"sample_input" text NOT NULL,
	"sample_output" text NOT NULL,
	"sample_explanation" text,
	"solutions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"common_mistakes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"similar_problems" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"pro_tip" text,
	"exam" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "coding_problems_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"role" text,
	"subject" text,
	"message" text NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"sent_to" text NOT NULL,
	"delivery_mode" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_purchases" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"mobile" text NOT NULL,
	"email" text NOT NULL,
	"course_name" text DEFAULT 'Full Course Access' NOT NULL,
	"amount_rupees" integer DEFAULT 500 NOT NULL,
	"payment_ref" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"payment_mode" text DEFAULT 'simulation' NOT NULL,
	"payment_details" jsonb,
	"payment_last4" text,
	"joined_course" boolean DEFAULT false NOT NULL,
	"ip" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "course_purchases_payment_ref_unique" UNIQUE("payment_ref")
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"icon" text NOT NULL,
	"color" text NOT NULL,
	"total_units" integer DEFAULT 12 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "courses_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "jee_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"exam" text NOT NULL,
	"subject" text NOT NULL,
	"chapter" text NOT NULL,
	"number" text NOT NULL,
	"difficulty" text DEFAULT 'Easy' NOT NULL,
	"question_text" text NOT NULL,
	"options" jsonb NOT NULL,
	"correct_index" integer NOT NULL,
	"explanation" text,
	"year" integer,
	"is_pyq" boolean DEFAULT true NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "login_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"provider" text DEFAULT 'password' NOT NULL,
	"action" text DEFAULT 'login' NOT NULL,
	"user_agent" text,
	"ip" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "practice_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"section" text NOT NULL,
	"number" text NOT NULL,
	"difficulty" text DEFAULT 'Easy' NOT NULL,
	"topic" text NOT NULL,
	"time_seconds" integer DEFAULT 40 NOT NULL,
	"is_pyq" boolean DEFAULT true NOT NULL,
	"year" integer,
	"question_text" text NOT NULL,
	"options" jsonb NOT NULL,
	"correct_index" integer NOT NULL,
	"explanation" text,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"question_type" text DEFAULT 'mcq' NOT NULL,
	"correct_indices" jsonb,
	"numerical_answer" double precision,
	"numerical_tolerance" double precision,
	"numerical_unit" text,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "programming_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"number" text NOT NULL,
	"title" text NOT NULL,
	"difficulty" text DEFAULT 'Easy' NOT NULL,
	"topic" text NOT NULL,
	"language" text DEFAULT 'C' NOT NULL,
	"time_seconds" integer DEFAULT 40 NOT NULL,
	"is_pyq" boolean DEFAULT true NOT NULL,
	"year" integer,
	"question_text" text NOT NULL,
	"code_snippet" text,
	"options" jsonb NOT NULL,
	"correct_index" integer NOT NULL,
	"explanation" text,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_otps" (
	"id" serial PRIMARY KEY NOT NULL,
	"mobile" text NOT NULL,
	"otp_hash" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"year" integer NOT NULL,
	"unit" integer NOT NULL,
	"question_text" text NOT NULL,
	"options" jsonb NOT NULL,
	"correct_index" integer NOT NULL,
	"explanation" text,
	"question_type" text DEFAULT 'mcq' NOT NULL,
	"correct_indices" jsonb,
	"numerical_answer" double precision,
	"numerical_tolerance" double precision,
	"numerical_unit" text,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text,
	"reg_no" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"provider" text DEFAULT 'password' NOT NULL,
	"role" text DEFAULT 'student' NOT NULL,
	"name" text,
	"login_count" integer DEFAULT 0 NOT NULL,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_reg_no_unique" UNIQUE("reg_no"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "login_logs" ADD CONSTRAINT "login_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "coding_topic_idx" ON "coding_problems" USING btree ("topic");--> statement-breakpoint
CREATE INDEX "coding_diff_idx" ON "coding_problems" USING btree ("difficulty");--> statement-breakpoint
CREATE INDEX "coding_exam_idx" ON "coding_problems" USING btree ("exam");--> statement-breakpoint
CREATE INDEX "course_purchases_mobile_idx" ON "course_purchases" USING btree ("mobile");--> statement-breakpoint
CREATE INDEX "course_purchases_status_idx" ON "course_purchases" USING btree ("status");--> statement-breakpoint
CREATE INDEX "jee_exam_sub_ch_idx" ON "jee_questions" USING btree ("exam","subject","chapter");--> statement-breakpoint
CREATE INDEX "jee_exam_idx" ON "jee_questions" USING btree ("exam");--> statement-breakpoint
CREATE INDEX "login_logs_user_idx" ON "login_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "login_logs_at_idx" ON "login_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "practice_cat_sec_idx" ON "practice_questions" USING btree ("category","section");--> statement-breakpoint
CREATE INDEX "practice_topic_idx" ON "practice_questions" USING btree ("topic");--> statement-breakpoint
CREATE INDEX "practice_diff_idx" ON "practice_questions" USING btree ("difficulty");--> statement-breakpoint
CREATE INDEX "prog_q_topic_idx" ON "programming_questions" USING btree ("topic");--> statement-breakpoint
CREATE INDEX "prog_q_diff_idx" ON "programming_questions" USING btree ("difficulty");--> statement-breakpoint
CREATE INDEX "purchase_otps_mobile_idx" ON "purchase_otps" USING btree ("mobile");--> statement-breakpoint
CREATE INDEX "questions_course_year_idx" ON "questions" USING btree ("course_id","year");--> statement-breakpoint
CREATE INDEX "questions_course_unit_idx" ON "questions" USING btree ("course_id","unit");--> statement-breakpoint
CREATE INDEX "sessions_token_idx" ON "sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");