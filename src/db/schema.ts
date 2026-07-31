import {
  pgTable,
  serial,
  text,
  integer,
  jsonb,
  timestamp,
  index,
  doublePrecision,
  boolean,
} from "drizzle-orm/pg-core";

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  totalUnits: integer("total_units").notNull().default(12),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const questions = pgTable(
  "questions",
  {
    id: serial("id").primaryKey(),
    courseId: integer("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    unit: integer("unit").notNull(),
    questionText: text("question_text").notNull(),
    options: jsonb("options").notNull().$type<string[]>(),
    correctIndex: integer("correct_index").notNull(),
    explanation: text("explanation"),
    questionType: text("question_type").notNull().default("mcq"),
    correctIndices: jsonb("correct_indices").$type<number[]>(),
    numericalAnswer: doublePrecision("numerical_answer"),
    numericalTolerance: doublePrecision("numerical_tolerance"),
    numericalUnit: text("numerical_unit"),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    courseYearIdx: index("questions_course_year_idx").on(t.courseId, t.year),
    courseUnitIdx: index("questions_course_unit_idx").on(t.courseId, t.unit),
  }),
);

// Programming MCQs (code-output style quizzes)
export const programmingQuestions = pgTable(
  "programming_questions",
  {
    id: serial("id").primaryKey(),
    number: text("number").notNull(), // e.g. "Q.1"
    title: text("title").notNull(),
    difficulty: text("difficulty").notNull().default("Easy"), // Easy | Medium | Hard
    topic: text("topic").notNull(), // e.g. Data Types & Variables
    language: text("language").notNull().default("C"), // C | C++ | Java | Python
    timeSeconds: integer("time_seconds").notNull().default(40),
    isPyq: boolean("is_pyq").notNull().default(true),
    year: integer("year"),
    questionText: text("question_text").notNull(),
    codeSnippet: text("code_snippet"),
    options: jsonb("options").notNull().$type<string[]>(),
    correctIndex: integer("correct_index").notNull(),
    explanation: text("explanation"),
    tags: jsonb("tags").notNull().$type<string[]>().default([]),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    topicIdx: index("prog_q_topic_idx").on(t.topic),
    difficultyIdx: index("prog_q_diff_idx").on(t.difficulty),
  }),
);

export type CodeSolution = {
  language: string; // Python | Java | C++ | C
  code: string;
  timeComplexity: string;
  spaceComplexity: string;
  explanation: string;
};

// Coding problems (DSA style)
export const codingProblems = pgTable(
  "coding_problems",
  {
    id: serial("id").primaryKey(),
    number: integer("number").notNull(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    difficulty: text("difficulty").notNull().default("Easy"),
    topic: text("topic").notNull(), // Arrays & Strings
    isPyq: boolean("is_pyq").notNull().default(true),
    statement: text("statement").notNull(),
    constraints: text("constraints").notNull(),
    inputFormat: text("input_format").notNull(),
    outputFormat: text("output_format").notNull(),
    sampleInput: text("sample_input").notNull(),
    sampleOutput: text("sample_output").notNull(),
    sampleExplanation: text("sample_explanation"),
    solutions: jsonb("solutions").notNull().$type<CodeSolution[]>().default([]),
    commonMistakes: jsonb("common_mistakes").notNull().$type<string[]>().default([]),
    similarProblems: jsonb("similar_problems").notNull().$type<string[]>().default([]),
    proTip: text("pro_tip"),
    // null = general coding library; "mnc-google", "mnc-tcs", ... = company-specific
    exam: text("exam"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    topicIdx: index("coding_topic_idx").on(t.topic),
    difficultyIdx: index("coding_diff_idx").on(t.difficulty),
    examIdx: index("coding_exam_idx").on(t.exam),
  }),
);

// Aptitude + GATE style MCQs (section-based)
export const practiceQuestions = pgTable(
  "practice_questions",
  {
    id: serial("id").primaryKey(),
    // aptitude | gate | govt | mnc
    category: text("category").notNull(),
    // numerical | verbal | reasoning OR machines | power-system etc.
    section: text("section").notNull(),
    number: text("number").notNull(), // Q.1
    difficulty: text("difficulty").notNull().default("Easy"),
    topic: text("topic").notNull(),
    timeSeconds: integer("time_seconds").notNull().default(40),
    isPyq: boolean("is_pyq").notNull().default(true),
    year: integer("year"),
    questionText: text("question_text").notNull(),
    options: jsonb("options").notNull().$type<string[]>(),
    correctIndex: integer("correct_index").notNull(),
    explanation: text("explanation"),
    tags: jsonb("tags").notNull().$type<string[]>().default([]),

    // Support multiple question formats
    questionType: text("question_type").notNull().default("mcq"), // mcq | msq | numerical
    correctIndices: jsonb("correct_indices").$type<number[]>(), // for MSQ
    numericalAnswer: doublePrecision("numerical_answer"), // for Numerical
    numericalTolerance: doublePrecision("numerical_tolerance"), // for Numerical
    numericalUnit: text("numerical_unit"), // e.g. "V", "A", "Hz"
    imageUrl: text("image_url"), // circuit diagrams, graphs and figures

    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    catSecIdx: index("practice_cat_sec_idx").on(t.category, t.section),
    topicIdx: index("practice_topic_idx").on(t.topic),
    diffIdx: index("practice_diff_idx").on(t.difficulty),
  }),
);

// JEE Main / Advanced / BITSAT chapter-wise MCQs
export const jeeQuestions = pgTable(
  "jee_questions",
  {
    id: serial("id").primaryKey(),
    exam: text("exam").notNull(), // jee-main | jee-advanced | bitsat
    subject: text("subject").notNull(), // physics | chemistry | math
    chapter: text("chapter").notNull(), // slug
    number: text("number").notNull(),
    difficulty: text("difficulty").notNull().default("Easy"),
    questionText: text("question_text").notNull(),
    options: jsonb("options").notNull().$type<string[]>(),
    correctIndex: integer("correct_index").notNull(),
    explanation: text("explanation"),
    year: integer("year"),
    isPyq: boolean("is_pyq").notNull().default(true),
    tags: jsonb("tags").notNull().$type<string[]>().default([]),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    examSubChIdx: index("jee_exam_sub_ch_idx").on(t.exam, t.subject, t.chapter),
    examIdx: index("jee_exam_idx").on(t.exam),
  }),
);

export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name"),
  email: text("email"),
  role: text("role"),
  subject: text("subject"),
  message: text("message").notNull(),
  status: text("status").notNull().default("new"),
  sentTo: text("sent_to").notNull(),
  deliveryMode: text("delivery_mode").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- Auth ----------
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username"),
  regNo: text("reg_no").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  provider: text("provider").notNull().default("password"), // password | google | apple
  role: text("role").notNull().default("student"), // admin | student
  name: text("name"),
  loginCount: integer("login_count").notNull().default(0),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const loginLogs = pgTable(
  "login_logs",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").notNull().default("password"),
    action: text("action").notNull().default("login"), // login | signup | social
    userAgent: text("user_agent"),
    ip: text("ip"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("login_logs_user_idx").on(t.userId),
    atIdx: index("login_logs_at_idx").on(t.createdAt),
  }),
);

export const sessions = pgTable(
  "sessions",
  {
    id: serial("id").primaryKey(),
    token: text("token").notNull().unique(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    tokenIdx: index("sessions_token_idx").on(t.token),
    userIdx: index("sessions_user_idx").on(t.userId),
  }),
);

export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  fileUrl: text("file_url").notNull(),
  coverUrl: text("cover_url"),
  category: text("category").notNull().default("General"), // PYQ, Textbook, Notes
  year: integer("year"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const purchaseOtps = pgTable(
  "purchase_otps",
  {
    id: serial("id").primaryKey(),
    mobile: text("mobile").notNull(),
    otpHash: text("otp_hash").notNull(),
    attempts: integer("attempts").notNull().default(0),
    verified: boolean("verified").notNull().default(false),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    mobileIdx: index("purchase_otps_mobile_idx").on(t.mobile),
  }),
);

export const coursePurchases = pgTable(
  "course_purchases",
  {
    id: serial("id").primaryKey(),
    fullName: text("full_name").notNull(),
    mobile: text("mobile").notNull(),
    email: text("email").notNull(),
    courseName: text("course_name").notNull().default("Full Course Access"),
    amountRupees: integer("amount_rupees").notNull().default(500),
    paymentRef: text("payment_ref").notNull().unique(),
    status: text("status").notNull().default("pending"), // pending | success | failed
    paymentMode: text("payment_mode").notNull().default("simulation"),
    paymentDetails: jsonb("payment_details").$type<Record<string, string>>(), // redacted provider/bank/UPI metadata
    paymentLast4: text("payment_last4"), // cards only; never store PAN/CVV
    joinedCourse: boolean("joined_course").notNull().default(false),
    ip: text("ip"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    mobileIdx: index("course_purchases_mobile_idx").on(t.mobile),
    statusIdx: index("course_purchases_status_idx").on(t.status),
  }),
);

export type Book = typeof books.$inferSelect;
export type PurchaseOtp = typeof purchaseOtps.$inferSelect;
export type CoursePurchase = typeof coursePurchases.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type ProgrammingQuestion = typeof programmingQuestions.$inferSelect;
export type CodingProblem = typeof codingProblems.$inferSelect;
export type PracticeQuestion = typeof practiceQuestions.$inferSelect;
export type JeeQuestion = typeof jeeQuestions.$inferSelect;
export type User = typeof users.$inferSelect;
