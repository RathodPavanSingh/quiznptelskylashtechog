import { db } from "./index";
import { books } from "./schema";
import { eq } from "drizzle-orm";

export async function seedBooks() {
  const targetPath = "uploadfile/system/20150408/20150408135309188.pdf";
  const [existingPdf] = await db
    .select({ id: books.id })
    .from(books)
    .where(eq(books.fileUrl, targetPath))
    .limit(1);

  if (!existingPdf) {
    await db.insert(books).values({
      title: "GATE Reference Paper 20150408135309188",
      description: "Official GATE / Academic PDF Reference Document",
      fileUrl: targetPath,
      category: "PYQ",
      year: 2026,
    });
  }

  const [existingRichDad] = await db
    .select({ id: books.id })
    .from(books)
    .where(eq(books.title, "Rich Dad Poor Dad"))
    .limit(1);

  if (!existingRichDad) {
    await db.insert(books).values({
      title: "Rich Dad Poor Dad",
      description: "What The Rich Teach Their Kids About Money That The Poor And Middle Class Do Not!",
      fileUrl: "https://archive.org/download/RichDadPoorDad_201804/Rich%20Dad%20Poor%20Dad.pdf",
      category: "Textbook",
      year: 1997,
    });
  }
}
