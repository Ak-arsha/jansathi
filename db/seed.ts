import { getDb } from "../api/queries/connection";
import { schemes } from "./schema";
import { SEED_SCHEMES } from "./schemes-data";

async function seed() {
  const db = getDb();
  console.log("Seeding schemes knowledge base...");

  for (const s of SEED_SCHEMES) {
    await db
      .insert(schemes)
      .values({
        slug: s.slug,
        name: s.name,
        nameHi: s.nameHi,
        ministry: s.ministry,
        category: s.category,
        level: s.level,
        summary: s.summary,
        summaryHi: s.summaryHi,
        benefits: s.benefits,
        benefitsHi: s.benefitsHi,
        rules: JSON.stringify(s.rules),
        documents: JSON.stringify(s.documents),
        steps: JSON.stringify(s.steps),
        officialUrl: s.officialUrl,
        tags: JSON.stringify(s.tags),
      })
      .onDuplicateKeyUpdate({
        set: {
          name: s.name,
          nameHi: s.nameHi,
          ministry: s.ministry,
          category: s.category,
          summary: s.summary,
          summaryHi: s.summaryHi,
          benefits: s.benefits,
          benefitsHi: s.benefitsHi,
          rules: JSON.stringify(s.rules),
          documents: JSON.stringify(s.documents),
          steps: JSON.stringify(s.steps),
          officialUrl: s.officialUrl,
          tags: JSON.stringify(s.tags),
        },
      });
    console.log(`  ✓ ${s.slug}`);
  }

  console.log(`Done. ${SEED_SCHEMES.length} schemes seeded.`);
  process.exit(0);
}

seed();
