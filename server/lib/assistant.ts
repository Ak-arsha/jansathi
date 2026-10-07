import type { Scheme } from "@db/schema";
import { matchSchemes, type CitizenProfile } from "./eligibility";

export type AssistantReply = {
  reply: string;
  schemeSlugs: string[];
  suggestions: string[];
  action?: "check_eligibility" | "explore" | "none";
};

type Lang = "en" | "hi";

const CIVIC_SERVICES: Record<string, { title: string; docs: string[]; steps: string[] }> = {
  aadhaar: {
    title: "Aadhaar Card Update / New Application",
    docs: ["Proof of Identity (PAN / Passport / Voter ID)", "Proof of Address (Ration Card / Electricity Bill)", "Date of Birth proof"],
    steps: ["Visit nearby Aadhaar Seva Kendra or book slot at uidai.gov.in", "Fill Enrolment Form & submit biometric verification", "Receive 28-digit EID receipt", "Track status online & download e-Aadhaar within 15 days"]
  },
  pan: {
    title: "PAN Card Application (Form 49A)",
    docs: ["Aadhaar Card (Instant e-PAN via Aadhaar OTP)", "Passport photo", "Proof of address"],
    steps: ["Visit NSDL (onlineservices.tin.nsdl.com) or UTIITSL", "Fill Form 49A online", "Pay ₹107 fee for physical card", "Receive e-PAN on email within 24 hours"]
  },
  ration: {
    title: "Ration Card Application (NFSA / BPL / AAY)",
    docs: ["Aadhaar Card of all family members", "Income Certificate from Tehsildar", "Electricity/Rent Bill", "Passport size group photo"],
    steps: ["Visit State Food & Civil Supplies Portal (e.g. edistrict/nfsa.gov.in)", "Submit application with family detail declaration", "Tehsildar / Food Supply Inspector verification", "Card issued within 30 days"]
  },
  passport: {
    title: "Passport Application (Tatkaal / Normal)",
    docs: ["Aadhaar Card", "PAN Card", "Birth Certificate / 10th Marksheet", "Bank Passbook"],
    steps: ["Register on passportindia.gov.in", "Fill application & pay fee online", "Book appointment at Passport Seva Kendra (PSK)", "Police Verification followed by speed post delivery"]
  },
  grievance: {
    title: "Public Grievance Redressal (CPGRAMS Portal)",
    docs: ["Proof of application / Reference number", "Copy of representation to officer", "Supporting evidence/documents"],
    steps: ["Log in to pgportal.gov.in (CPGRAMS)", "Select 'Lodge Public Grievance' & choose Ministry/Department", "Describe grievance clearly in 4000 characters & attach PDF proof", "Nodal officer resolves complaint within 30 days"]
  }
};

const OCCUPATION_KEYWORDS: Record<string, string[]> = {
  farmer: ["farmer", "farming", "kisan", "crop", "agriculture", "kheti", "किसान", "खेती"],
  student: ["student", "study", "college", "school", "scholarship", "छात्र", "पढ़ाई"],
  artisan: ["artisan", "craft", "weaver", "potter", "carpenter", "विश्वकर्मा", "कारीगर"],
  vendor: ["vendor", "street", "hawker", "thela", "stall", "ठेला", "रेहड़ी", "स्वनिधि"],
  worker: ["worker", "labour", "labor", "gig", "delivery", "construction", "मजदूर", "मज़दूर"],
  business: ["business", "shop", "entrepreneur", "loan", "mudra", "दुकान", "व्यापार"],
};

const NEED_KEYWORDS: Record<string, { keywords: string[]; categories: string[] }> = {
  health: { keywords: ["health", "hospital", "medical", "treatment", "ayushman", "स्वास्थ्य", "इलाज", "अस्पताल"], categories: ["Health"] },
  housing: { keywords: ["house", "housing", "shelter", "awas", "pmay", "घर", "मकान", "आवास"], categories: ["Housing"] },
  education: { keywords: ["scholarship", "education", "school", "college", "fees", "छात्रवृत्ति", "शिक्षा"], categories: ["Education"] },
  money: { keywords: ["loan", "money", "bank", "account", "credit", "mudra", "पैसा", "ऋण", "लोन", "खाता"], categories: ["Finance & Banking", "MSME & Business"] },
  pension: { keywords: ["pension", "old age", "senior", "retirement", "atal", "पेंशन", "बुढ़ापा"], categories: ["Social Security"] },
  job: { keywords: ["job", "work", "employment", "rozgar", "nrega", "नौकरी", "रोजगार", "काम"], categories: ["Employment & Skills"] },
  women: { keywords: ["women", "woman", "girl", "daughter", "sukanya", "महिला", "बेटी"], categories: ["Women & Child"] },
  farming: { keywords: ["crop", "insurance", "fasal", "irrigation", "kisan", "फसल", "बीमा"], categories: ["Agriculture"] },
};

function norm(s: string) {
  return s.toLowerCase().trim();
}

function findSchemeByName(schemes: Scheme[], q: string): Scheme | undefined {
  const query = norm(q);
  let best: { s: Scheme; score: number } | undefined;
  for (const s of schemes) {
    const names = [s.name.toLowerCase(), s.nameHi, s.slug.replace(/-/g, " ")];
    let score = 0;
    for (const n of names) {
      if (query.includes(n) || n.includes(query)) score = Math.max(score, 3);
      for (const word of n.split(/\s+/)) {
        if (word.length > 3 && query.includes(word)) score = Math.max(score, 1);
      }
    }
    if (score > 0 && (!best || score > best.score)) best = { s, score };
  }
  return best?.s;
}

function schemeBrief(s: Scheme, lang: Lang) {
  return lang === "hi"
    ? `**${s.nameHi}**\n${s.summaryHi}\n\nलाभ: ${s.benefitsHi}`
    : `**${s.name}**\n${s.summary}\n\nBenefit: ${s.benefits}`;
}

function suggestionsFor(lang: Lang): string[] {
  return lang === "hi"
    ? ["मैं किसान हूँ — मेरे लिए क्या है?", "राशन कार्ड कैसे बनवाएं?", "CPGRAMS में शिकायत कैसे दर्ज करें?", "मेरी पात्रता जाँचो"]
    : ["I am a farmer — what can I get?", "How to get a Ration Card?", "How to lodge a grievance on CPGRAMS?", "Check my eligibility"];
}

export function generateReply(
  message: string,
  schemes: Scheme[],
  lang: Lang,
  profile?: CitizenProfile | null,
): AssistantReply {
  const q = norm(message);

  // 1. Greeting
  if (/^(hi|hii+|hello|hey|namaste|namaskar|नमस्ते|हैलो|सलाम)\b/.test(q)) {
    return {
      reply:
        lang === "hi"
          ? "नमस्ते! 🙏 मैं **जनसाथी AI** हूँ — आपका सार्वजनिक सेवा सहायक। मुझसे किसी भी योजना, दस्तावेज़ (आधार, पैन, राशन कार्ड) या CPGRAMS शिकायत के बारे में पूछें!"
          : "Namaste! 🙏 I am **JanSathi AI**, your civic & welfare assistant. Ask me about any government scheme, document guide (Aadhaar, PAN, Ration Card), or CPGRAMS grievance process!",
      schemeSlugs: [],
      suggestions: suggestionsFor(lang),
      action: "none",
    };
  }

  // 2. Civic Services Lookup (Aadhaar, PAN, Ration, Passport, Grievances)
  for (const [key, info] of Object.entries(CIVIC_SERVICES)) {
    if (q.includes(key) || (key === "grievance" && (q.includes("complaint") || q.includes("shikayat") || q.includes("cpgrams") || q.includes("शिकायत")))) {
      return {
        reply:
          lang === "hi"
            ? `**${info.title}**\n\n**आवश्यक दस्तावेज़:**\n${info.docs.map((d) => `• ${d}`).join("\n")}\n\n**आवेदन चरण:**\n${info.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}`
            : `**${info.title}**\n\n**Required Documents:**\n${info.docs.map((d) => `• ${d}`).join("\n")}\n\n**Process Steps:**\n${info.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}`,
        schemeSlugs: [],
        suggestions: suggestionsFor(lang),
        action: "none",
      };
    }
  }

  // 3. Direct scheme lookup + documents / how to apply
  const direct = findSchemeByName(schemes, q);
  const wantsDocs = /(document|kagaz|paper|दस्तावेज़|कागज)/.test(q);
  const wantsSteps = /(apply|kaise|process|आवेदन|कैसे)/.test(q);

  if (direct && (wantsDocs || wantsSteps || q.length <= 60)) {
    if (wantsDocs) {
      const docs: string[] = JSON.parse(direct.documents);
      return {
        reply:
          lang === "hi"
            ? `**${direct.nameHi}** के लिए ये दस्तावेज़ चाहिए:\n${docs.map((d) => `• ${d}`).join("\n")}`
            : `For **${direct.name}**, keep these documents ready:\n${docs.map((d) => `• ${d}`).join("\n")}`,
        schemeSlugs: [direct.slug],
        suggestions:
          lang === "hi" ? ["आवेदन कैसे करें?", "मेरी पात्रता जाँचो"] : ["How do I apply?", "Check my eligibility"],
        action: "none",
      };
    }
    if (wantsSteps) {
      const steps: string[] = JSON.parse(direct.steps);
      return {
        reply:
          lang === "hi"
            ? `**${direct.nameHi}** में आवेदन का तरीका:\n${steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nआधिकारिक पोर्टल: ${direct.officialUrl}`
            : `How to apply for **${direct.name}**:\n${steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nOfficial portal: ${direct.officialUrl}`,
        schemeSlugs: [direct.slug],
        suggestions: suggestionsFor(lang),
        action: "none",
      };
    }
    return {
      reply: schemeBrief(direct, lang),
      schemeSlugs: [direct.slug],
      suggestions:
        lang === "hi"
          ? ["इसके लिए कौन से दस्तावेज़ चाहिए?", "आवेदन कैसे करें?", "मेरी पात्रता जाँचो"]
          : ["What documents are needed?", "How do I apply?", "Check my eligibility"],
      action: "none",
    };
  }

  // 4. Eligibility request
  if (/(eligib|pator|पात्रता|पात्र|qualify)/.test(q)) {
    if (profile && Object.values(profile).some((v) => v != null)) {
      const matches = matchSchemes(schemes, profile).filter((m) => m.verdict !== "not_eligible").slice(0, 3);
      if (matches.length > 0) {
        return {
          reply:
            lang === "hi"
              ? `आपकी प्रोफ़ाइल के आधार पर ये योजनाएँ सबसे उपयुक्त हैं:\n${matches.map((m) => `• **${m.scheme.nameHi}** — ${m.score}% मिलान`).join("\n")}\n\nपूरी सूची देखने के लिए पात्रता जाँच सेक्शन खोलें।`
              : `Based on your saved profile, these schemes fit best:\n${matches.map((m) => `• **${m.scheme.name}** — ${m.score}% match`).join("\n")}\n\nOpen the Eligibility section for full details.`,
          schemeSlugs: matches.map((m) => m.scheme.slug),
          suggestions: suggestionsFor(lang),
          action: "check_eligibility",
        };
      }
    }
    return {
      reply:
        lang === "hi"
          ? "मैं आपकी पात्रता जाँच सकता हूँ! **पात्रता जाँच** सेक्शन में आयु, व्यवसाय, आय और राज्य दर्ज करें — मैं 15+ योजनाओं का मिलान करके बताऊँगा।"
          : "I can evaluate your eligibility! Enter your age, occupation, income, and state in the **Eligibility Checker** section to get instant rule matches.",
      schemeSlugs: [],
      suggestions: suggestionsFor(lang),
      action: "check_eligibility",
    };
  }

  // 5. Occupation-based matching
  for (const [occ, kws] of Object.entries(OCCUPATION_KEYWORDS)) {
    if (kws.some((k) => q.includes(k))) {
      const related = schemes.filter((s) => {
        const rules = JSON.parse(s.rules) as { occupations?: string[] };
        return rules.occupations?.includes(occ) ||
          (occ === "business" && s.category === "MSME & Business") ||
          (occ === "worker" && s.category === "Social Security");
      });
      const top = related.slice(0, 3);
      if (top.length > 0) {
        return {
          reply:
            lang === "hi"
              ? `आपके जैसे लोगों के लिए ये योजनाएँ सबसे उपयोगी हैं:\n\n${top.map((s) => schemeBrief(s, lang)).join("\n\n")}`
              : `Here are the top schemes for you:\n\n${top.map((s) => schemeBrief(s, lang)).join("\n\n")}`,
          schemeSlugs: top.map((s) => s.slug),
          suggestions:
            lang === "hi" ? ["मेरी पात्रता जाँचो", "दस्तावेज़ क्या चाहिए?"] : ["Check my eligibility", "What documents are needed?"],
          action: "none",
        };
      }
    }
  }

  // 6. Need/category-based matching
  for (const [, cfg] of Object.entries(NEED_KEYWORDS)) {
    if (cfg.keywords.some((k) => q.includes(k))) {
      const related = schemes.filter((s) => cfg.categories.includes(s.category)).slice(0, 3);
      if (related.length > 0) {
        return {
          reply:
            lang === "hi"
              ? `इस ज़रूरत के लिए ये योजनाएँ मदद कर सकती हैं:\n\n${related.map((s) => schemeBrief(s, lang)).join("\n\n")}`
              : `These schemes can help with that:\n\n${related.map((s) => schemeBrief(s, lang)).join("\n\n")}`,
          schemeSlugs: related.map((s) => s.slug),
          suggestions:
            lang === "hi" ? ["मेरी पात्रता जाँचो", "आवेदन कैसे करें?"] : ["Check my eligibility", "How do I apply?"],
          action: "none",
        };
      }
    }
  }

  // 7. Fallback
  return {
    reply:
      lang === "hi"
        ? "मैं सरकारी सेवाओं, योजनाओं, CPGRAMS शिकायतों और दस्तावेज़ों में आपकी मदद कर सकता हूँ। आप पूछ सकते हैं:\n• *\"राशन कार्ड / आधार अपडेट के दस्तावेज़\"*\n• *\"CPGRAMS पर शिकायत कैसे करें\"*\n• *\"मैं किसान / छात्र हूँ — योजनाएँ बताओ\"*"
        : "I can help with schemes, civic documents (Aadhaar, PAN, Ration Card), and CPGRAMS public grievances. Ask me:\n• *\"Documents for Ration Card or Aadhaar update\"*\n• *\"How to lodge CPGRAMS complaint\"*\n• *\"Schemes for farmers or students\"*",
    schemeSlugs: [],
    suggestions: suggestionsFor(lang),
    action: "check_eligibility",
  };
}
