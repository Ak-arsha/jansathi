import { SEED_SCHEMES } from "@db/schemes-data";
import { getDb } from "../queries/connection";
import { schemes, profiles, applications, type Scheme, type Profile, type Application } from "@db/schema";
import { eq } from "drizzle-orm";

const fallbackSchemes: Scheme[] = SEED_SCHEMES.map((s, idx) => ({
  id: idx + 1,
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
  createdAt: new Date(),
}));

let inMemoryProfiles: Record<number, Profile> = {};
let inMemoryApplications: Application[] = [];

export async function fetchAllSchemes(): Promise<Scheme[]> {
  try {
    const rows = await getDb().select().from(schemes);
    if (rows && rows.length > 0) return rows;
    return fallbackSchemes;
  } catch {
    return fallbackSchemes;
  }
}

export async function fetchSchemeBySlug(slug: string): Promise<Scheme | null> {
  try {
    const row = await getDb().query.schemes.findFirst({
      where: eq(schemes.slug, slug),
    });
    if (row) return row;
  } catch {
    // ignore
  }
  return fallbackSchemes.find((s) => s.slug === slug) ?? null;
}

export async function fetchProfile(userId: number): Promise<Profile | null> {
  try {
    const row = await getDb().query.profiles.findFirst({
      where: eq(profiles.userId, userId),
    });
    if (row) return row;
  } catch {
    // ignore
  }
  return inMemoryProfiles[userId] ?? null;
}

export async function saveProfileData(userId: number, data: Partial<Profile>): Promise<Profile> {
  const updated: Profile = {
    id: userId,
    userId,
    fullName: data.fullName ?? "Akarsha Agarwal",
    age: data.age ?? 24,
    gender: data.gender ?? "male",
    state: data.state ?? "Uttar Pradesh",
    occupation: data.occupation ?? "Student",
    annualIncome: data.annualIncome ?? 150000,
    socialCategory: data.socialCategory ?? "General",
    ownsLand: data.ownsLand ?? false,
    hasDisability: data.hasDisability ?? false,
    familySize: data.familySize ?? 4,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  try {
    const db = getDb();
    await db
      .insert(profiles)
      .values({ userId, ...data })
      .onDuplicateKeyUpdate({ set: { ...data } });
  } catch {
    inMemoryProfiles[userId] = updated;
  }
  return updated;
}
