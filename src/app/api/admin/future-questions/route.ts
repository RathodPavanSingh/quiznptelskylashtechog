import { NextResponse } from "next/server";
import { db } from "@/db";
import { practiceQuestions } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { checkAdminAuth } from "@/lib/auth";
import { bootstrapDatabase } from "@/db/bootstrap";

export const dynamic = "force-dynamic";

const DIFFICULTIES = new Set(["Easy", "Medium", "Hard"]);

type FutureQuestion = {
  section: string;
  number: string;
  topic: string | null;
  difficulty: string;
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation: string | null;
  timeSeconds: number;
  isPyq: boolean;
  year: number | null;
  questionType: "mcq" | "msq" | "numerical" | "figure";
  correctIndices: number[] | null;
  numericalAnswer: number | null;
  numericalTolerance: number | null;
  numericalUnit: string | null;
  imageUrl: string | null;
  tags: string[];
};

function normalizeQuestion(input: Partial<FutureQuestion>): FutureQuestion | string {
  const section = String(input.section ?? "").trim();
  const questionText = String(input.questionText ?? "").trim();
  const questionType = (input.questionType ?? "mcq") as FutureQuestion["questionType"];
  const options = Array.isArray(input.options) ? input.options.map((o) => String(o).trim()).filter(Boolean) : [];

  if (!section) return "Section is required.";
  if (questionText.length < 3) return "Question text is required.";

  if (questionType === "numerical") {
    if (input.numericalAnswer == null || !Number.isFinite(input.numericalAnswer)) return "Numerical answer is required.";
  } else {
    if (options.length < 2) return "At least two options are required.";
    if (questionType === "msq") {
      const correctIndices = Array.isArray(input.correctIndices) ? input.correctIndices.map(Number) : [];
      if (correctIndices.length === 0 || correctIndices.some((i) => i < 0 || i >= options.length)) return "Choose valid correct options for MSQ.";
    } else {
      const correctIndex = Number(input.correctIndex ?? 0);
      if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length) return "Select a valid correct option.";
    }
  }

  return {
    section,
    number: String(input.number ?? `slot:${section}:${Date.now()}`).trim(),
    topic: input.topic?.trim() || "Future Slot",
    difficulty: DIFFICULTIES.has(String(input.difficulty)) ? String(input.difficulty) : "Easy",
    questionText,
    options: questionType === "numerical" ? [] : options,
    correctIndex: questionType === "msq" ? Math.max(0, ...(Array.isArray(input.correctIndices) && input.correctIndices.length ? input.correctIndices : [0])) : Number(input.correctIndex ?? 0),
    numericalAnswer: questionType === "numerical" ? Number(input.numericalAnswer) : null,
    correctIndices: questionType === "msq" ? (input.correctIndices ?? [0]) : (input.correctIndices ?? null),
    numericalTolerance: questionType === "numerical" ? Number(input.numericalTolerance ?? 0) : null,
    numericalUnit: questionType === "numerical" ? String(input.numericalUnit ?? "").trim() : null,
    explanation: input.explanation?.trim() || null,
    timeSeconds: Number(input.timeSeconds) || 40,
    isPyq: Boolean(input.isPyq),
    year: input.year ? Number(input.year) : null,
    questionType,
    imageUrl: input.imageUrl?.trim() || null,
    tags: [section, "future-slot", "reserved-space", String(input.topic ?? "future-slot")],
  };
}

export async function GET() {
  await bootstrapDatabase();
  const { authorized } = await checkAdminAuth();
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const rows = await db
    .select()
    .from(practiceQuestions)
    .where(eq(practiceQuestions.category, "future"))
    .orderBy(asc(practiceQuestions.section), asc(practiceQuestions.number), asc(practiceQuestions.id));

  return NextResponse.json({ questions: rows });
}

export async function POST(req: Request) {
  try {
    await bootstrapDatabase();
    const { authorized } = await checkAdminAuth();
    if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const input = (await req.json()) as Partial<FutureQuestion>;
    const normalized = normalizeQuestion(input);
    if (typeof normalized === "string") return NextResponse.json({ error: normalized }, { status: 400 });

    const [created] = await db.insert(practiceQuestions).values({
      category: "future",
      section: normalized.section,
      number: normalized.number,
      topic: normalized.topic ?? "Future Slot",
      difficulty: normalized.difficulty,
      questionText: normalized.questionText,
      options: normalized.options,
      correctIndex: normalized.correctIndex,
      explanation: normalized.explanation,
      timeSeconds: normalized.timeSeconds,
      isPyq: normalized.isPyq,
      year: normalized.year,
      questionType: normalized.questionType,
      correctIndices: normalized.correctIndices,
      numericalAnswer: normalized.numericalAnswer,
      numericalTolerance: normalized.numericalTolerance,
      numericalUnit: normalized.numericalUnit,
      imageUrl: normalized.imageUrl,
      tags: normalized.tags,
    }).returning();

    return NextResponse.json({ question: created });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed to add future question." }, { status: 500 });
  }
}
