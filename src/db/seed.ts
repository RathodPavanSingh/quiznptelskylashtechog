import { db } from "./index";
import {
  courses,
  questions,
  programmingQuestions,
  codingProblems,
  practiceQuestions,
  jeeQuestions,
} from "./schema";
import { seedCourses, seedQuestions } from "./seed-data";
import { eq, isNull } from "drizzle-orm";
import { seedLargeProgrammingQuestions } from "./seed-programming-large";
import { seedLargeCodingProblems } from "./seed-coding-large";
import { seedAptitudeLargeQuestions } from "./seed-aptitude-large";
import { seedPracticeQuestions } from "./seed-practice";
import { seedJeeQuestions } from "./seed-jee";
import { seedGovtQuestions } from "./seed-govt";
import { seedMncMcqs, seedMncCoding } from "./seed-mnc";
import { seedNewGateQuestions } from "./seed-gate-new";
import { seedGkQuestions } from "./seed-gk";
import { seedBooks } from "./seed-books";
import { sql } from "drizzle-orm";
import { users } from "./schema";
import { hashPassword } from "@/lib/auth";
import { bootstrapDatabase } from "./bootstrap";

export async function seedDatabase() {
  await bootstrapDatabase();
  const existing = await db.select({ id: courses.id }).from(courses).limit(1);
  let coursesCount = 0;
  let questionsCount = 0;

  if (existing.length === 0) {
    const inserted = await db.insert(courses).values(seedCourses).returning();
    coursesCount = inserted.length;
    const slugToId = new Map(inserted.map((c) => [c.slug, c.id]));

    const rows = seedQuestions
      .map((q) => {
        const cid = slugToId.get(q.courseSlug);
        if (!cid) return null;
        return {
          courseId: cid,
          year: q.year,
          unit: q.unit,
          questionText: q.questionText,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation ?? null,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    if (rows.length > 0) {
      await db.insert(questions).values(rows);
      questionsCount = rows.length;
    }
  }

  await seedProgrammingAndCoding();
  await seedPractice();
  await seedJee();
  await seedGovt();
  await seedMnc();
  await seedNewGate();
  await seedGk();
  await seedBooks();
  await ensureAdmin();

  return { seeded: true, courses: coursesCount, questions: questionsCount };
}

export async function seedProgrammingAndCoding() {
  const [{ count: programmingCount }] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(programmingQuestions);

  if (programmingCount !== seedLargeProgrammingQuestions.length) {
    await db.delete(programmingQuestions);
    const chunk = 100;
    for (let i = 0; i < seedLargeProgrammingQuestions.length; i += chunk) {
      const slice = seedLargeProgrammingQuestions.slice(i, i + chunk).map((q) => ({
        number: q.number,
        title: q.title,
        difficulty: q.difficulty,
        topic: q.topic,
        language: q.language,
        timeSeconds: q.timeSeconds,
        isPyq: q.isPyq,
        year: q.year,
        questionText: q.questionText,
        codeSnippet: q.codeSnippet,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        tags: q.tags,
      }));
      await db.insert(programmingQuestions).values(slice);
    }
  }

  const [{ count: codingCount }] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(codingProblems)
    .where(isNull(codingProblems.exam));

  if (codingCount !== seedLargeCodingProblems.length) {
    // Keep company-specific coding problems; replace only the general Coding section.
    await db.delete(codingProblems).where(isNull(codingProblems.exam));
    const chunk = 100;
    for (let i = 0; i < seedLargeCodingProblems.length; i += chunk) {
      const slice = seedLargeCodingProblems.slice(i, i + chunk).map((p) => ({
        number: p.number,
        title: p.title,
        slug: p.slug,
        difficulty: p.difficulty,
        topic: p.topic,
        isPyq: p.isPyq,
        statement: p.statement,
        constraints: p.constraints,
        inputFormat: p.inputFormat,
        outputFormat: p.outputFormat,
        sampleInput: p.sampleInput,
        sampleOutput: p.sampleOutput,
        sampleExplanation: p.sampleExplanation,
        solutions: p.solutions,
        commonMistakes: p.commonMistakes,
        similarProblems: p.similarProblems,
        proTip: p.proTip,
        exam: null,
      }));
      await db.insert(codingProblems).values(slice);
    }
  }
}

export async function seedPractice() {
  // Check if we already have the fully upgraded 1,200 aptitude questions
  const [{ count }] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(practiceQuestions)
    .where(eq(practiceQuestions.category, "aptitude"));

  if (count === seedAptitudeLargeQuestions.length) return;

  // Clear previous aptitude entries to avoid mixed states
  await db.delete(practiceQuestions).where(eq(practiceQuestions.category, "aptitude"));

  // Insert in chunks of 100 for high performance
  const chunk = 100;
  for (let i = 0; i < seedAptitudeLargeQuestions.length; i += chunk) {
    const slice = seedAptitudeLargeQuestions.slice(i, i + chunk).map((q) => ({
      category: q.category,
      section: q.section,
      number: q.number,
      difficulty: q.difficulty,
      topic: q.topic,
      timeSeconds: q.timeSeconds,
      isPyq: q.isPyq,
      year: q.year,
      questionText: q.questionText,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      tags: q.tags,
      questionType: q.questionType,
      correctIndices: q.correctIndices,
      numericalAnswer: q.numericalAnswer,
      numericalTolerance: q.numericalTolerance,
      numericalUnit: q.numericalUnit,
    }));
    await db.insert(practiceQuestions).values(slice);
  }
}

export async function seedJee() {
  const existing = await db.select({ id: jeeQuestions.id }).from(jeeQuestions).limit(1);
  if (existing.length > 0) return;
  const chunk = 100;
  for (let i = 0; i < seedJeeQuestions.length; i += chunk) {
    const slice = seedJeeQuestions.slice(i, i + chunk).map((q) => ({
      exam: q.exam,
      subject: q.subject,
      chapter: q.chapter,
      number: q.number,
      difficulty: q.difficulty,
      questionText: q.questionText,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      year: q.year,
      isPyq: q.isPyq,
      tags: q.tags,
    }));
    await db.insert(jeeQuestions).values(slice);
  }
}

export async function seedGovt() {
  const existing = await db
    .select({ id: practiceQuestions.id })
    .from(practiceQuestions)
    .where(eq(practiceQuestions.category, "govt"))
    .limit(1);
  if (existing.length > 0) return;
  const chunk = 50;
  for (let i = 0; i < seedGovtQuestions.length; i += chunk) {
    const slice = seedGovtQuestions.slice(i, i + chunk).map((q) => ({
      category: q.category,
      section: q.section,
      number: q.number,
      difficulty: q.difficulty,
      topic: q.topic,
      timeSeconds: q.timeSeconds,
      isPyq: q.isPyq,
      year: q.year,
      questionText: q.questionText,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      tags: q.tags,
    }));
    await db.insert(practiceQuestions).values(slice);
  }
}

export async function seedNewGate() {
  // Re-seed when the count changes OR duplicates exist (generator upgraded).
  const [{ count, uniq }] = await db
    .select({
      count: sql<number>`COUNT(*)::int`,
      uniq: sql<number>`COUNT(DISTINCT ${practiceQuestions.questionText})::int`,
    })
    .from(practiceQuestions)
    .where(eq(practiceQuestions.category, "gate"));

  if (count === seedNewGateQuestions.length && uniq === count) return;

  // Clear previous gate entries to avoid duplicate mixed count states.
  await db.delete(practiceQuestions).where(eq(practiceQuestions.category, "gate"));

  const chunk = 100;
  for (let i = 0; i < seedNewGateQuestions.length; i += chunk) {
    const slice = seedNewGateQuestions.slice(i, i + chunk).map((q) => ({
      category: q.category,
      section: q.section,
      number: q.number,
      difficulty: q.difficulty,
      topic: q.topic,
      timeSeconds: q.timeSeconds,
      isPyq: q.isPyq,
      year: q.year,
      questionText: q.questionText,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      tags: q.tags,
      questionType: q.questionType,
      correctIndices: q.correctIndices,
      numericalAnswer: q.numericalAnswer,
      numericalTolerance: q.numericalTolerance,
      numericalUnit: q.numericalUnit,
      imageUrl: q.imageUrl ?? null,
    }));
    await db.insert(practiceQuestions).values(slice);
  }
}

export async function seedMnc() {
  // Idempotency: if any MNC mcq already exists, skip mcq insert.
  const mncMcq = await db
    .select({ id: practiceQuestions.id })
    .from(practiceQuestions)
    .where(eq(practiceQuestions.category, "mnc"))
    .limit(1);
  if (mncMcq.length === 0) {
    const chunk = 100;
    for (let i = 0; i < seedMncMcqs.length; i += chunk) {
      const slice = seedMncMcqs.slice(i, i + chunk).map((q) => ({
        category: q.category,
        section: q.section,
        number: q.number,
        difficulty: q.difficulty,
        topic: q.topic,
        timeSeconds: q.timeSeconds,
        isPyq: q.isPyq,
        year: q.year,
        questionText: q.questionText,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        tags: q.tags,
      }));
      await db.insert(practiceQuestions).values(slice);
    }
  }

  // Coding problems tagged per company — skip if the first known slug is present.
  const probe = await db
    .select({ id: codingProblems.id })
    .from(codingProblems)
    .where(eq(codingProblems.slug, "mnc-google-reverse-string"))
    .limit(1);
  if (probe.length === 0) {
    const chunk = 20;
    for (let i = 0; i < seedMncCoding.length; i += chunk) {
      const slice = seedMncCoding.slice(i, i + chunk).map((p) => ({
        number: p.number,
        title: p.title,
        slug: p.slug,
        difficulty: p.difficulty,
        topic: p.topic,
        statement: p.statement,
        constraints: p.constraints,
        inputFormat: p.inputFormat,
        outputFormat: p.outputFormat,
        sampleInput: p.sampleInput,
        sampleOutput: p.sampleOutput,
        sampleExplanation: p.sampleExplanation,
        solutions: p.solutions,
        commonMistakes: p.commonMistakes,
        similarProblems: p.similarProblems,
        proTip: p.proTip,
        exam: p.exam,
      }));
      await db.insert(codingProblems).values(slice);
    }
  }
}

/**
 * Guarantees the site owner's admin account always exists, regardless of
 * signup order. Credentials are provisioned once and hashed with scrypt.
 */
/**
 * Guarantees the site owner's admin account always exists.
 * Credentials:
 * Email: rathodpavanrp047404@gmail.com
 * Password: Pavan@0807
 */
/**
 * Guarantees the site owner's admin account always exists.
 * Credentials:
 * Username: rathodpavan
 * Email: rathodpavanrp047404@gmail.com
 * Password: Pavan@0807
 */
export async function ensureAdmin() {
  const email = "rathodpavanrp047404@gmail.com";
  const username = "rathodpavan";
  const passwordHash = hashPassword("Skylashtechog@0807");
  
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  
  if (existing) {
    await db.update(users)
      .set({ 
        username,
        role: "admin", 
        passwordHash: passwordHash,
      })
      .where(eq(users.id, existing.id));
    return;
  }
  
  await db.insert(users).values({
    username,
    regNo: "admin-rathodpavan",
    email,
    passwordHash,
    role: "admin",
    name: "Rathod Pavan",
    provider: "password",
  });
}

export async function ensureSeeded() {
  try {
    await bootstrapDatabase();
    const result = await db.execute(sql`SELECT COUNT(*)::int as count FROM courses`);
    const count = (result.rows?.[0] as { count?: number } | undefined)?.count ?? 0;
    if (count === 0) {
      return await seedDatabase();
    }
    // Still ensure programming/coding/practice/jee/govt/mnc/new-gate tables are filled
    await seedProgrammingAndCoding();
    await seedPractice();
    await seedJee();
    await seedGovt();
    await seedMnc();
    await seedNewGate();
    await seedGk();
    await seedBooks();
    await ensureAdmin();
    return { seeded: false, reason: "already-seeded" };
  } catch {
    return { seeded: false, reason: "table-missing" };
  }
}

export async function seedGk() {
  const existing = await db
    .select({ id: practiceQuestions.id })
    .from(practiceQuestions)
    .where(eq(practiceQuestions.category, "gk"))
    .limit(1);
  if (existing.length > 0) return;

  const chunk = 100;
  for (let i = 0; i < seedGkQuestions.length; i += chunk) {
    const slice = seedGkQuestions.slice(i, i + chunk).map((q) => ({
      category: q.category,
      section: q.section,
      number: q.number,
      difficulty: q.difficulty,
      topic: q.topic,
      timeSeconds: q.timeSeconds,
      isPyq: q.isPyq,
      year: q.year,
      questionText: q.questionText,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      tags: q.tags,
      questionType: q.questionType,
      correctIndices: q.correctIndices,
      numericalAnswer: q.numericalAnswer,
      numericalTolerance: q.numericalTolerance,
      numericalUnit: q.numericalUnit,
    }));
    await db.insert(practiceQuestions).values(slice);
  }
}
