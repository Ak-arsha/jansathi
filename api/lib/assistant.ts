import type { Scheme } from "@db/schema";
import { matchSchemes, type CitizenProfile } from "./eligibility";

export type AssistantReply = {
  reply: string;
  schemeSlugs: string[];
  suggestions: string[];
  action?: "check_eligibility" | "explore" | "none";
};

type Lang = "en" | "hi";

const OCCUPATION_KEYWORDS: Record<string, string[]> = {
  farmer: ["farmer", "farming", "kisan", "crop", "agriculture", "kheti", "किसान", "खेती"],
  student: ["student", "study", "college", "school", "scholarship", "छात्र", "पढ़ाई"],
  artisan: ["artisan", "craft", "weaver", "potter", "carpenter", "कारीगर"],
  vendor: ["vendor", "street", "hawker", "thela", "stall", "ठेला", "रेहड़ी"],
  worker: ["worker", "labour", "labor", "gig", "delivery", "construction", "मजदूर", "मज़दूर"],
  business: ["business", "shop", "entrepreneur", "loan", "mudra", "दुकान", "व्यापार"],
};

const NEED_KEYWORDS: Record<string, { keywords: string[]; categories: string[] }> = {
  health: { keywords: ["health", "hospital", "medical", "treatment", "स्वास्थ्य", "इलाज", "अस्पताल"], categories: ["Health"] },
  housing: { keywords: ["house", "housing", "shelter", "awas", "घर", "मकान", "आवास"], categories: ["Housing"] },
  education: { keywords: ["scholarship", "education", "school", "college", "fees", "छात्रवृत्ति", "शिक्षा"], categories: ["Education"] },
  money: { keywords: ["loan", "money", "bank", "account", "credit", "पैसा", "ऋण", "लोन", "खाता"], categories: ["Finance & Banking", "MSME & Business"] },
  pension: { keywords: ["pension", "old age", "senior", "retirement", "पेंशन", "बुढ़ापा"], categories: ["Social Security"] },
  job: { keywords: ["job", "work", "employment", "rozgar", "नौकरी", "रोजगार", "काम"], categories: ["Employment & Skills"] },
  women: { keywords: ["women", "woman", "girl", "daughter", "महिला", "बेटी"], categories: ["Women & Child"] },
  farming: { keywords: ["crop", "insurance", "fasal", "irrigation", "फसल", "बीमा"], categories: ["Agriculture"] },
};

function norm(s: string) {
  return s.toLowerCase().trim();
}

function findSchemeByName(schemes: Scheme[], q: string): Scheme | undefined {
  const query = norm(q);
  let best: { s: Scheme; score: number } | undefined;
  for (const s of schemes) {
    const names = [s.name.toLowerCase(), s.nameHi, s.slug.replace(/-/g, " ")];
    const tags: string[] = JSON.parse(s.tags);
    let score = 0;
    for (const n of names) {
      if (query.includes(n) || n.includes(query)) score = Math.max(score, 3);
      for (const word of n.split(/\s+/)) {
        if (word.length > 3 && query.includes(word)) score = Math.max(score, 1);
      }
    }
    for (const t of tags) if (query.includes(t.toLowerCase())) score = Math.max(score, 2);
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
    ? ["मैं किसान हूँ — मेरे लिए क्या है?", "मुझे ऋण चाहिए", "स्वास्थ्य बीमा के बारे में बताओ", "मेरी पात्रता जाँचो"]
    : ["I am a farmer — what can I get?", "I need a loan", "Tell me about health insurance", "Check my eligibility"];
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
          ? "नमस्ते! 🙏 मैं **जनसाथी** हूँ — सरकारी योजनाओं का आपका सहायक। मुझसे अपनी ज़रूरत के बारे में पूछिए, जैसे: *\"मैं किसान हूँ\"*, *\"मुझे इलाज के लिए मदद चाहिए\"*, या *\"मुझे ऋण चाहिए\"*। मैं आपको सही योजना, उसके दस्तावेज़ और आवेदन का तरीका बता दूँगा।"
          : "Namaste! 🙏 I am **JanSathi**, your government schemes assistant. Tell me about yourself or your need — e.g. *\"I am a farmer\"*, *\"I need help with hospital bills\"*, or *\"I need a loan\"* — and I'll find the right scheme, its documents, and how to apply.",
      schemeSlugs: [],
      suggestions: suggestionsFor(lang),
      action: "none",
    };
  }

  // 2. Direct scheme lookup + documents / how to apply
  const direct = findSchemeByName(schemes, q);
  const wantsDocs = /(document|kagaz|paper|दस्तावेज़|कागज)/.test(q);
  const wantsSteps = /(apply|kaise|process|आवेदन|कैसे)/.test(q);

  if (direct && direct.name.length > 0 && (wantsDocs || wantsSteps || q.length <= 60)) {
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

  // 3. Eligibility request
  if (/(eligib|pator|पात्रता|पात्र|qualify)/.test(q)) {
    if (profile && Object.values(profile).some((v) => v != null)) {
      const matches = matchSchemes(schemes, profile).filter((m) => m.verdict !== "not_eligible").slice(0, 3);
      if (matches.length > 0) {
        return {
          reply:
            lang === "hi"
              ? `आपकी प्रोफ़ाइल के आधार पर ये योजनाएँ सबसे उपयुक्त हैं:\n${matches.map((m) => `• **${m.scheme.nameHi}** — ${m.score}% मिलान`).join("\n")}\n\nपूरी सूची और कारण देखने के लिए पात्रता जाँच पेज खोलें।`
              : `Based on your saved profile, these schemes fit best:\n${matches.map((m) => `• **${m.scheme.name}** — ${m.score}% match`).join("\n")}\n\nOpen the Eligibility page for the full list with reasons.`,
          schemeSlugs: matches.map((m) => m.scheme.slug),
          suggestions: suggestionsFor(lang),
          action: "check_eligibility",
        };
      }
    }
    return {
      reply:
        lang === "hi"
          ? "मैं आपकी पात्रता जाँच सकता हूँ! **पात्रता जाँच** पेज पर जाकर अपनी आयु, व्यवसाय, आय और राज्य बताइए — मैं 15+ योजनाओं का विश्लेषण करके बताऊँगा कि आप किसके लिए पात्र हैं और क्यों।"
          : "I can check that for you! Open the **Eligibility Check** page and tell me your age, occupation, income and state — I'll analyse 15+ schemes and explain exactly which ones you qualify for, and why.",
      schemeSlugs: [],
      suggestions: suggestionsFor(lang),
      action: "check_eligibility",
    };
  }

  // 4. Occupation-based matching
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
              : `Here are the most useful schemes for you:\n\n${top.map((s) => schemeBrief(s, lang)).join("\n\n")}`,
          schemeSlugs: top.map((s) => s.slug),
          suggestions:
            lang === "hi" ? ["मेरी पात्रता जाँचो", "दस्तावेज़ क्या चाहिए?"] : ["Check my eligibility", "What documents are needed?"],
          action: "none",
        };
      }
    }
  }

  // 5. Need/category-based matching
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

  // 6. Fallback
  return {
    reply:
      lang === "hi"
        ? "मैं सरकारी योजनाओं में आपकी मदद के लिए यहाँ हूँ। आप मुझसे पूछ सकते हैं:\n• *\"मैं किसान/छात्र/कारीगर हूँ\"* — आपके लिए योजनाएँ\n• *\"आयुष्मान भारत के दस्तावेज़\"* — किसी योजना की जानकारी\n• *\"मुझे इलाज/घर/ऋण चाहिए\"* — ज़रूरत के अनुसार योजनाएँ\n\nया **पात्रता जाँच** पेज पर एक मिनट में सभी 15+ योजनाएँ जाँचें।"
        : "I'm here to help you find government schemes. You can ask me:\n• *\"I am a farmer / student / artisan\"* — schemes for you\n• *\"Documents for Ayushman Bharat\"* — details of any scheme\n• *\"I need treatment / a house / a loan\"* — schemes by need\n\nOr open the **Eligibility Check** page to scan all 15+ schemes in a minute.",
    schemeSlugs: [],
    suggestions: suggestionsFor(lang),
    action: "check_eligibility",
  };
}
