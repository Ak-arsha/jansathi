import type { Scheme } from "@db/schema";
import type { SchemeRules } from "../../db/schemes-data";

export type CitizenProfile = {
  age?: number | null;
  gender?: string | null;
  state?: string | null;
  occupation?: string | null;
  annualIncome?: number | null;
  socialCategory?: string | null;
  ownsLand?: boolean | null;
  hasDisability?: boolean | null;
};

export type MatchVerdict = "eligible" | "likely" | "not_eligible";

export type SchemeMatch = {
  scheme: Scheme;
  verdict: MatchVerdict;
  score: number; // 0-100
  reasons: string[]; // why they match
  reasonsHi: string[];
  blockers: string[]; // hard disqualifiers
  blockersHi: string[];
  unknowns: string[]; // profile fields that would refine the verdict
};

function parseRules(scheme: Scheme): SchemeRules {
  try {
    return JSON.parse(scheme.rules) as SchemeRules;
  } catch {
    return {};
  }
}

/**
 * Deterministic eligibility reasoning engine.
 * Each rule contributes matched reasons or hard blockers; unknown profile
 * fields become questions the citizen still needs to answer.
 */
export function matchScheme(scheme: Scheme, profile: CitizenProfile): SchemeMatch {
  const rules = parseRules(scheme);
  const reasons: string[] = [];
  const reasonsHi: string[] = [];
  const blockers: string[] = [];
  const blockersHi: string[] = [];
  const unknowns: string[] = [];
  let checks = 0;
  let passed = 0;

  // --- Age ---
  if (rules.minAge !== undefined || rules.maxAge !== undefined) {
    if (profile.age == null) {
      unknowns.push("your age");
    } else {
      checks++;
      if (rules.minAge !== undefined && profile.age < rules.minAge) {
        blockers.push(`Requires minimum age ${rules.minAge}`);
        blockersHi.push(`न्यूनतम आयु ${rules.minAge} वर्ष आवश्यक`);
      } else if (rules.maxAge !== undefined && profile.age > rules.maxAge) {
        blockers.push(`Requires maximum age ${rules.maxAge}`);
        blockersHi.push(`अधिकतम आयु ${rules.maxAge} वर्ष आवश्यक`);
      } else {
        passed++;
        reasons.push(`Your age (${profile.age}) is within the eligible range`);
        reasonsHi.push(`आपकी आयु (${profile.age}) पात्र सीमा में है`);
      }
    }
  }

  // --- Gender ---
  if (rules.gender) {
    if (!profile.gender) {
      unknowns.push("your gender");
    } else {
      checks++;
      if (profile.gender !== rules.gender) {
        blockers.push(
          rules.gender === "female"
            ? "Open to women applicants only"
            : "Open to male applicants only",
        );
        blockersHi.push(
          rules.gender === "female"
            ? "केवल महिला आवेदकों के लिए"
            : "केवल पुरुष आवेदकों के लिए",
        );
      } else {
        passed++;
        reasons.push(
          rules.gender === "female"
            ? "You qualify as a woman applicant"
            : "Gender criterion satisfied",
        );
        reasonsHi.push(
          rules.gender === "female"
            ? "आप महिला आवेदक के रूप में पात्र हैं"
            : "लिंग मानदंड पूरा",
        );
      }
    }
  }

  // --- Income ceiling ---
  if (rules.maxAnnualIncome !== undefined) {
    if (profile.annualIncome == null) {
      unknowns.push("your annual family income");
    } else {
      checks++;
      if (profile.annualIncome > rules.maxAnnualIncome) {
        blockers.push(
          `Family income must be under ₹${rules.maxAnnualIncome.toLocaleString("en-IN")}/year`,
        );
        blockersHi.push(
          `पारिवारिक आय ₹${rules.maxAnnualIncome.toLocaleString("en-IN")}/वर्ष से कम होनी चाहिए`,
        );
      } else {
        passed++;
        reasons.push("Your income is within the scheme's limit");
        reasonsHi.push("आपकी आय योजना की सीमा के भीतर है");
      }
    }
  }

  // --- Occupation ---
  if (rules.occupations && rules.occupations.length > 0) {
    if (!profile.occupation) {
      unknowns.push("your occupation");
    } else {
      checks++;
      if (!rules.occupations.includes(profile.occupation)) {
        blockers.push("Your occupation group is not covered by this scheme");
        blockersHi.push("आपका व्यवसाय समूह इस योजना में शामिल नहीं है");
      } else {
        passed++;
        reasons.push("Your occupation is a target group for this scheme");
        reasonsHi.push("आपका व्यवसाय इस योजना का लक्ष्य समूह है");
      }
    }
  }

  // --- Land ---
  if (rules.requiresLand) {
    if (profile.ownsLand == null) {
      unknowns.push("whether your family owns agricultural land");
    } else {
      checks++;
      if (!profile.ownsLand) {
        blockers.push("Requires agricultural land ownership records");
        blockersHi.push("कृषि भूमि के स्वामित्व रिकॉर्ड आवश्यक");
      } else {
        passed++;
        reasons.push("Landholding requirement satisfied");
        reasonsHi.push("भूमिधारक शर्त पूरी");
      }
    }
  }

  // --- Disability-targeted schemes ---
  if (rules.forDisabled) {
    if (profile.hasDisability == null) {
      unknowns.push("disability status");
    } else {
      checks++;
      if (!profile.hasDisability) {
        blockers.push("Reserved for persons with benchmark disability");
        blockersHi.push("दिव्यांग व्यक्तियों के लिए आरक्षित");
      } else {
        passed++;
        reasons.push("Scheme is designed for persons with disabilities");
        reasonsHi.push("योजना दिव्यांग व्यक्तियों के लिए बनी है");
      }
    }
  }

  // --- Social category bonus (soft signal, never a blocker here) ---
  if (
    rules.socialCategories &&
    profile.socialCategory &&
    rules.socialCategories.includes(profile.socialCategory)
  ) {
    passed++;
    checks++;
    reasons.push("Your social category is prioritised under this scheme");
    reasonsHi.push("इस योजना में आपकी सामाजिक श्रेणी को प्राथमिकता मिलती है");
  }

  // Universal schemes: no hard rules at all → everyone is eligible
  const verdict: MatchVerdict =
    blockers.length > 0 ? "not_eligible" : checks === 0 ? "eligible" : passed === checks ? "eligible" : "likely";

  // Score: eligible base 70, + reasons; likely 40-60; not eligible under 30
  let score: number;
  if (verdict === "not_eligible") {
    score = Math.max(5, 30 - blockers.length * 8);
  } else if (checks === 0) {
    score = 75; // universal scheme
  } else {
    score = Math.round(50 + (passed / checks) * 45);
    if (unknowns.length > 0) score = Math.min(score, 78);
  }

  return { scheme, verdict, score, reasons, reasonsHi, blockers, blockersHi, unknowns };
}

export function matchSchemes(schemes: Scheme[], profile: CitizenProfile): SchemeMatch[] {
  return schemes
    .map((s) => matchScheme(s, profile))
    .sort((a, b) => {
      const order = { eligible: 0, likely: 1, not_eligible: 2 };
      if (order[a.verdict] !== order[b.verdict]) return order[a.verdict] - order[b.verdict];
      return b.score - a.score;
    });
}
