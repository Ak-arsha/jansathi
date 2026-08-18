/**
 * Curated knowledge base of real Indian government welfare schemes.
 * Eligibility `rules` are machine-readable and evaluated by the reasoning
 * engine in api/lib/eligibility.ts. All scheme content is grounded in
 * official scheme guidelines (pmjay.gov.in, pmkisan.gov.in, etc.).
 */

export type SchemeRules = {
  minAge?: number;
  maxAge?: number;
  maxAnnualIncome?: number; // INR
  occupations?: string[]; // allowed occupations; empty/absent = any
  gender?: "male" | "female";
  socialCategories?: string[]; // SC, ST, OBC, General
  requiresLand?: boolean;
  forDisabled?: boolean;
};

export type SeedScheme = {
  slug: string;
  name: string;
  nameHi: string;
  ministry: string;
  category: string;
  level: "central" | "state";
  summary: string;
  summaryHi: string;
  benefits: string;
  benefitsHi: string;
  rules: SchemeRules;
  documents: string[];
  steps: string[];
  officialUrl: string;
  tags: string[];
};

export const SCHEME_CATEGORIES = [
  "Agriculture",
  "Health",
  "Housing",
  "Finance & Banking",
  "Education",
  "Women & Child",
  "Social Security",
  "Employment & Skills",
  "MSME & Business",
] as const;

export const SEED_SCHEMES: SeedScheme[] = [
  {
    slug: "pm-kisan",
    name: "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
    nameHi: "पीएम-किसान (प्रधानमंत्री किसान सम्मान निधि)",
    ministry: "Ministry of Agriculture & Farmers Welfare",
    category: "Agriculture",
    level: "central",
    summary:
      "Income support of ₹6,000 per year to all landholding farmer families, paid in three equal instalments directly into bank accounts.",
    summaryHi:
      "सभी भूमिधारक किसान परिवारों को प्रति वर्ष ₹6,000 की आय सहायता, तीन समान किस्तों में सीधे बैंक खाते में।",
    benefits:
      "₹6,000 per year in 3 instalments of ₹2,000 via Direct Benefit Transfer (DBT).",
    benefitsHi:
      "₹2,000 की 3 किस्तों में प्रति वर्ष ₹6,000, सीधे बैंक खाते में (DBT)।",
    rules: { occupations: ["farmer"], requiresLand: true },
    documents: [
      "Aadhaar card",
      "Land ownership records (Khatauni / Record of Rights)",
      "Bank account passbook",
      "Mobile number linked to Aadhaar",
    ],
    steps: [
      "Visit pmkisan.gov.in and open 'New Farmer Registration' under Farmers Corner",
      "Enter Aadhaar number and complete e-KYC (OTP / biometric at CSC)",
      "Fill land and bank details and submit the form",
      "Track instalment status under 'Beneficiary Status'",
    ],
    officialUrl: "https://pmkisan.gov.in",
    tags: ["farmer", "kisan", "agriculture", "crop", "land", "income support"],
  },
  {
    slug: "ayushman-bharat-pmjay",
    name: "Ayushman Bharat — PM-JAY",
    nameHi: "आयुष्मान भारत — पीएम-जेएवाई",
    ministry: "Ministry of Health & Family Welfare",
    category: "Health",
    level: "central",
    summary:
      "World's largest health assurance scheme — free health cover of ₹5 lakh per family per year for hospitalisation, for poor and vulnerable families.",
    summaryHi:
      "दुनिया की सबसे बड़ी स्वास्थ्य बीमा योजना — गरीब और कमजोर परिवारों के लिए प्रति वर्ष ₹5 लाख तक मुफ्त अस्पताल में इलाज।",
    benefits:
      "₹5 lakh per family per year cashless cover for secondary and tertiary hospitalisation at empanelled hospitals.",
    benefitsHi:
      "सूचीबद्ध अस्पतालों में प्रति परिवार प्रति वर्ष ₹5 लाख तक कैशलेस इलाज।",
    rules: { maxAnnualIncome: 250000 },
    documents: [
      "Aadhaar card of family members",
      "Ration card",
      "Mobile number",
      "SECC / eligibility verification at empanelled hospital or CSC",
    ],
    steps: [
      "Check eligibility at mera.pmjay.gov.in or call 14555",
      "Visit nearest empanelled hospital or CSC with Aadhaar and ration card",
      "Complete e-KYC and get your Ayushman card generated",
      "Show the card at empanelled hospitals for cashless treatment",
    ],
    officialUrl: "https://pmjay.gov.in",
    tags: ["health", "hospital", "insurance", "medical", "ayushman", "treatment"],
  },
  {
    slug: "mgnrega",
    name: "MGNREGA (Mahatma Gandhi NREGA)",
    nameHi: "मनरेगा (महात्मा गांधी नरेगा)",
    ministry: "Ministry of Rural Development",
    category: "Employment & Skills",
    level: "central",
    summary:
      "Legal guarantee of 100 days of wage employment per year to every rural household whose adult members volunteer for unskilled manual work.",
    summaryHi:
      "हर ग्रामीण परिवार को प्रति वर्ष 100 दिन के मजदूरी रोजगार की कानूनी गारंटी।",
    benefits:
      "100 days of guaranteed paid work per rural household per year at notified wage rates, paid directly to bank/post office accounts.",
    benefitsHi:
      "प्रति ग्रामीण परिवार प्रति वर्ष 100 दिन का गारंटीकृत भुगतान कार्य, सीधे बैंक खाते में भुगतान।",
    rules: { minAge: 18 },
    documents: [
      "Job card (apply at Gram Panchayat)",
      "Aadhaar card",
      "Bank or post office account details",
      "Passport-size photograph",
    ],
    steps: [
      "Apply for a Job Card at your Gram Panchayat (free)",
      "Submit a written work application to the Panchayat when you need work",
      "Work must be allotted within 15 days, else unemployment allowance applies",
      "Wages are credited within 15 days of work completion",
    ],
    officialUrl: "https://nrega.nic.in",
    tags: ["employment", "job", "rural", "wage", "labour", "worker", "manrega"],
  },
  {
    slug: "pmay-gramin",
    name: "PM Awas Yojana — Gramin (PMAY-G)",
    nameHi: "प्रधानमंत्री आवास योजना — ग्रामीण",
    ministry: "Ministry of Rural Development",
    category: "Housing",
    level: "central",
    summary:
      "Financial assistance to houseless and kutcha-house rural families to build a pucca house with basic amenities.",
    summaryHi:
      "बेघर और कच्चे घरों में रहने वाले ग्रामीण परिवारों को पक्का घर बनाने के लिए वित्तीय सहायता।",
    benefits:
      "₹1.20 lakh in plains and ₹1.30 lakh in hilly/difficult areas, plus 90–95 person-days of MGNREGA wages and toilet assistance.",
    benefitsHi:
      "मैदानी क्षेत्रों में ₹1.20 लाख और पहाड़ी क्षेत्रों में ₹1.30 लाख, साथ में मनरेगा मजदूरी और शौचालय सहायता।",
    rules: { maxAnnualIncome: 300000 },
    documents: [
      "Aadhaar card",
      "Bank account linked with Aadhaar",
      "MGNREGA job card (if available)",
      "SECC-2011 / Awaas+ survey inclusion",
    ],
    steps: [
      "Check your name in the PMAY-G list at pmayg.nic.in (Awaas+ survey)",
      "Contact Gram Panchayat if your household qualifies but is not listed",
      "Complete Aadhaar and bank verification at the Panchayat",
      "Instalments are released in stages as construction progresses (geo-tagged)",
    ],
    officialUrl: "https://pmayg.nic.in",
    tags: ["housing", "house", "awas", "shelter", "rural", "home"],
  },
  {
    slug: "pmjdy",
    name: "PM Jan Dhan Yojana (PMJDY)",
    nameHi: "प्रधानमंत्री जन धन योजना",
    ministry: "Ministry of Finance",
    category: "Finance & Banking",
    level: "central",
    summary:
      "Zero-balance bank account for every unbanked citizen, with RuPay debit card, accident insurance and overdraft facility.",
    summaryHi:
      "हर नागरिक के लिए शून्य-शेष बैंक खाता, रुपे डेबिट कार्ड, दुर्घटना बीमा और ओवरड्राफ्ट सुविधा के साथ।",
    benefits:
      "Zero-balance savings account, free RuPay debit card with ₹2 lakh accident cover, overdraft up to ₹10,000, direct benefit transfers.",
    benefitsHi:
      "शून्य-शेष बचत खाता, ₹2 लाख दुर्घटना बीमा के साथ मुफ्त रुपे कार्ड, ₹10,000 तक ओवरड्राफ्ट।",
    rules: {},
    documents: [
      "Aadhaar card (or any officially valid document)",
      "Passport-size photograph",
      "Mobile number",
    ],
    steps: [
      "Visit any bank branch or Bank Mitra (CSC) outlet",
      "Fill the PMJDY account opening form",
      "Submit Aadhaar / valid ID and photograph",
      "Receive account number instantly and RuPay card by post",
    ],
    officialUrl: "https://pmjdy.gov.in",
    tags: ["bank", "account", "jan dhan", "finance", "savings", "money"],
  },
  {
    slug: "pm-ujjwala",
    name: "PM Ujjwala Yojana (PMUY)",
    nameHi: "प्रधानमंत्री उज्ज्वला योजना",
    ministry: "Ministry of Petroleum & Natural Gas",
    category: "Women & Child",
    level: "central",
    summary:
      "Free LPG connection to adult women of poor households, replacing smoky firewood and coal chulhas with clean cooking fuel.",
    summaryHi:
      "गरीब परिवारों की महिलाओं को मुफ्त एलपीजी कनेक्शन — लकड़ी और कोयले के चूल्हे की जगह स्वच्छ ईंधन।",
    benefits:
      "Free LPG connection (deposit-free), first refill and stove free, plus targeted subsidy per refill.",
    benefitsHi:
      "मुफ्त एलपीजी कनेक्शन (बिना जमा राशि), पहला रिफिल और चूल्हा मुफ्त, प्रति रिफिल सब्सिडी।",
    rules: { gender: "female", minAge: 18, maxAnnualIncome: 300000 },
    documents: [
      "Aadhaar card of the woman applicant",
      "Ration card / BPL certificate",
      "Bank account details",
      "Passport-size photograph",
    ],
    steps: [
      "Collect the Ujjwala form from an LPG distributor or download from pmuy.gov.in",
      "Fill the form with Aadhaar and ration card details",
      "Submit to the nearest LPG distributor",
      "Connection and stove delivered after verification",
    ],
    officialUrl: "https://pmuy.gov.in",
    tags: ["lpg", "cooking", "gas", "women", "ujjwala", "fuel"],
  },
  {
    slug: "sukanya-samriddhi",
    name: "Sukanya Samriddhi Yojana (SSY)",
    nameHi: "सुकन्या समृद्धि योजना",
    ministry: "Ministry of Finance",
    category: "Women & Child",
    level: "central",
    summary:
      "High-interest, tax-free savings scheme for a girl child — secure her education and marriage expenses with small deposits.",
    summaryHi:
      "बालिका के लिए उच्च ब्याज, कर-मुक्त बचत योजना — छोटी जमा राशि से शिक्षा और विवाह की सुरक्षा।",
    benefits:
      "One of the highest small-savings interest rates (~8%+), tax benefits under Section 80C, maturity at 21 years of the girl's age.",
    benefitsHi:
      "सबसे अधिक छोटी-बचत ब्याज दरों में से एक (~8%+), धारा 80C के तहत कर लाभ, 21 वर्ष में परिपक्वता।",
    rules: { gender: "female", maxAge: 10 },
    documents: [
      "Girl child's birth certificate",
      "Parent/guardian Aadhaar and PAN",
      "Address proof",
      "Initial deposit of minimum ₹250",
    ],
    steps: [
      "Visit any post office or authorised bank branch",
      "Fill the SSY account opening form",
      "Submit birth certificate and guardian KYC documents",
      "Deposit minimum ₹250 (max ₹1.5 lakh/year) — passbook issued",
    ],
    officialUrl: "https://www.indiapost.gov.in",
    tags: ["girl", "daughter", "savings", "education", "beti", "child"],
  },
  {
    slug: "pm-mudra",
    name: "PM MUDRA Yojana (PMMY)",
    nameHi: "प्रधानमंत्री मुद्रा योजना",
    ministry: "Ministry of Finance",
    category: "MSME & Business",
    level: "central",
    summary:
      "Collateral-free loans up to ₹10–20 lakh for micro and small entrepreneurs — vendors, shopkeepers, artisans, service providers.",
    summaryHi:
      "सूक्ष्म और छोटे उद्यमियों — विक्रेताओं, दुकानदारों, कारीगरों — के लिए ₹10–20 लाख तक बिना गारंटी ऋण।",
    benefits:
      "Loans under Shishu (up to ₹50,000), Kishore (up to ₹5 lakh) and Tarun (up to ₹10–20 lakh) categories with no collateral.",
    benefitsHi:
      "शिशु (₹50,000 तक), किशोर (₹5 लाख तक) और तरुण (₹10–20 लाख तक) श्रेणियों में बिना गारंटी ऋण।",
    rules: { occupations: ["vendor", "artisan", "business", "self_employed"] },
    documents: [
      "Aadhaar and PAN",
      "Business address proof / Udyam registration",
      "Bank statements (6 months, if existing business)",
      "Business plan / quotation of machinery (for larger loans)",
    ],
    steps: [
      "Decide loan category (Shishu / Kishore / Tarun) based on need",
      "Approach any bank, NBFC or MFI — or apply via jansevakendra / udyamimitra.in",
      "Submit KYC and business documents",
      "Loan is sanctioned without collateral; MUDRA card issued for working capital",
    ],
    officialUrl: "https://www.mudra.org.in",
    tags: ["loan", "business", "mudra", "vendor", "shop", "entrepreneur", "credit"],
  },
  {
    slug: "pm-vishwakarma",
    name: "PM Vishwakarma",
    nameHi: "प्रधानमंत्री विश्वकर्मा",
    ministry: "Ministry of Micro, Small & Medium Enterprises",
    category: "MSME & Business",
    level: "central",
    summary:
      "End-to-end support for traditional artisans and craftspeople — recognition, skill training, toolkit incentive and collateral-free credit.",
    summaryHi:
      "पारंपरिक कारीगरों और शिल्पकारों के लिए संपूर्ण सहायता — मान्यता, कौशल प्रशिक्षण, टूलकिट और बिना गारंटी ऋण।",
    benefits:
      "PM Vishwakarma certificate & ID card, ₹15,000 toolkit incentive, ₹500/day stipend during training, loans of ₹1–3 lakh at ~5% interest, digital transaction incentives.",
    benefitsHi:
      "प्रमाणपत्र व आईडी कार्ड, ₹15,000 टूलकिट सहायता, प्रशिक्षण में ₹500/दिन, ~5% ब्याज पर ₹1–3 लाख ऋण।",
    rules: { minAge: 18, occupations: ["artisan"] },
    documents: [
      "Aadhaar card",
      "Mobile number linked to Aadhaar",
      "Bank account details",
      "Proof of engagement in one of 18 traditional trades",
    ],
    steps: [
      "Register free at the nearest CSC or pmvishwakarma.gov.in",
      "Complete Aadhaar-based e-KYC and select your trade",
      "Get PM Vishwakarma certificate after Gram Panchayat/ULB verification",
      "Enrol for skill training and claim toolkit incentive and credit",
    ],
    officialUrl: "https://pmvishwakarma.gov.in",
    tags: ["artisan", "craft", "carpenter", "blacksmith", "weaver", "potter", "vishwakarma"],
  },
  {
    slug: "e-shram",
    name: "e-Shram Portal (Unorganised Workers)",
    nameHi: "ई-श्रम पोर्टल (असंगठित श्रमिक)",
    ministry: "Ministry of Labour & Employment",
    category: "Social Security",
    level: "central",
    summary:
      "National database and UAN card for unorganised workers — construction, domestic, street vendor, gig workers — unlocking insurance and welfare schemes.",
    summaryHi:
      "असंगठित श्रमिकों के लिए राष्ट्रीय डेटाबेस और यूएएन कार्ड — बीमा और कल्याण योजनाओं की कुंजी।",
    benefits:
      "Universal Account Number (UAN) card, accidental insurance cover of ₹2 lakh (PMSBY), priority access to housing, pension and welfare schemes.",
    benefitsHi:
      "यूएएन कार्ड, ₹2 लाख का दुर्घटना बीमा (PMSBY), आवास, पेंशन और कल्याण योजनाओं में प्राथमिकता।",
    rules: { minAge: 16, maxAge: 59 },
    documents: [
      "Aadhaar card",
      "Mobile number linked with Aadhaar",
      "Bank account details",
    ],
    steps: [
      "Visit eshram.gov.in or the nearest CSC",
      "Register with Aadhaar-linked mobile number",
      "Fill occupation and bank details",
      "Download your e-Shram / UAN card instantly",
    ],
    officialUrl: "https://eshram.gov.in",
    tags: ["worker", "labour", "gig", "domestic", "construction", "eshram", "insurance"],
  },
  {
    slug: "pm-fasal-bima",
    name: "PM Fasal Bima Yojana (PMFBY)",
    nameHi: "प्रधानमंत्री फसल बीमा योजना",
    ministry: "Ministry of Agriculture & Farmers Welfare",
    category: "Agriculture",
    level: "central",
    summary:
      "Crop insurance at very low premium — full compensation for crop loss due to flood, drought, pests and natural calamities.",
    summaryHi:
      "बहुत कम प्रीमियम पर फसल बीमा — बाढ़, सूखा, कीट और प्राकृतिक आपदा से फसल नुकसान पर पूर्ण मुआवजा।",
    benefits:
      "Premium of just 1.5–2% for farmers (rest paid by government); full sum insured paid on assessed crop loss.",
    benefitsHi:
      "किसानों के लिए केवल 1.5–2% प्रीमियम (शेष सरकार देती है); फसल नुकसान पर पूरी बीमा राशि।",
    rules: { occupations: ["farmer"] },
    documents: [
      "Aadhaar card",
      "Land records / tenancy agreement",
      "Bank account details",
      "Sowing certificate (from Patwari / agriculture dept)",
    ],
    steps: [
      "Apply within 2 weeks of sowing via pmfby.gov.in, CSC, bank or insurance agent",
      "Pay farmer share of premium (1.5% rabi / 2% kharif / 5% horticulture)",
      "Report crop loss within 72 hours on the portal or Crop Insurance App",
      "Claim amount credited to bank account after assessment",
    ],
    officialUrl: "https://pmfby.gov.in",
    tags: ["farmer", "crop", "insurance", "bima", "flood", "drought", "fasal"],
  },
  {
    slug: "kisan-credit-card",
    name: "Kisan Credit Card (KCC)",
    nameHi: "किसान क्रेडिट कार्ड",
    ministry: "Ministry of Agriculture & Farmers Welfare",
    category: "Agriculture",
    level: "central",
    summary:
      "Short-term crop loans at an effective 4% interest for farmers, plus coverage for fisheries and animal husbandry.",
    summaryHi:
      "किसानों के लिए प्रभावी 4% ब्याज पर अल्पकालिक फसल ऋण, साथ में मत्स्य और पशुपालन कवरेज।",
    benefits:
      "Credit limit based on cropping pattern; 4% effective interest with timely repayment (7% base − 3% subvention).",
    benefitsHi:
      "फसल पैटर्न आधारित सीमा; समय पर चुकाने पर 4% प्रभावी ब्याज (3% सबवेंशन सहित)।",
    rules: { occupations: ["farmer"] },
    documents: [
      "Aadhaar card",
      "Land records",
      "Passport-size photographs",
      "Bank account details",
    ],
    steps: [
      "Apply at your bank branch or via the bank's net banking / CSC",
      "Submit land records and KYC",
      "Bank fixes the credit limit and issues the KCC",
      "Renew annually; interest subvention applies on timely repayment",
    ],
    officialUrl: "https://pmkisan.gov.in",
    tags: ["farmer", "loan", "credit", "kcc", "agriculture", "interest"],
  },
  {
    slug: "nsp-scholarships",
    name: "National Scholarship Portal (NSP) Scholarships",
    nameHi: "राष्ट्रीय छात्रवृत्ति पोर्टल छात्रवृत्तियाँ",
    ministry: "Ministry of Electronics & IT / Education",
    category: "Education",
    level: "central",
    summary:
      "One portal for hundreds of central and state scholarships — pre-matric, post-matric and merit-cum-means — for students from school to higher education.",
    summaryHi:
      "सैकड़ों केंद्रीय और राज्य छात्रवृत्तियों के लिए एक पोर्टल — स्कूल से उच्च शिक्षा तक के छात्रों के लिए।",
    benefits:
      "Tuition fee support, maintenance allowance and book grants; many schemes fully cover fees for eligible SC/ST/OBC/minority and low-income students.",
    benefitsHi:
      "ट्यूशन फीस, भरण-पोषण भत्ता और पुस्तक सहायता; कई योजनाएँ पात्र छात्रों की पूरी फीस कवर करती हैं।",
    rules: { maxAge: 35, maxAnnualIncome: 800000, occupations: ["student"] },
    documents: [
      "Aadhaar card",
      "Caste / income certificate",
      "Previous marksheet",
      "Bank account in student's name",
      "Bonafide certificate from institution",
    ],
    steps: [
      "Register on scholarships.gov.in with Aadhaar and mobile number",
      "Fill the common application form and select matching scholarships",
      "Upload documents and submit before the deadline",
      "Track application and payment status on the portal / UMANG app",
    ],
    officialUrl: "https://scholarships.gov.in",
    tags: ["student", "scholarship", "education", "study", "college", "school", "nsp"],
  },
  {
    slug: "indira-gandhi-old-age-pension",
    name: "Indira Gandhi National Old Age Pension (IGNOAPS)",
    nameHi: "इंदिरा गांधी राष्ट्रीय वृद्धावस्था पेंशन",
    ministry: "Ministry of Rural Development",
    category: "Social Security",
    level: "central",
    summary:
      "Monthly pension for BPL senior citizens — ₹200–500 per month from the centre, topped up by most states.",
    summaryHi:
      "बीपीएल वरिष्ठ नागरिकों के लिए मासिक पेंशन — केंद्र से ₹200–500 प्रतिमाह, अधिकांश राज्य अतिरिक्त राशि देते हैं।",
    benefits:
      "₹200/month (60–79 years) and ₹500/month (80+ years) central contribution, plus state top-ups (total often ₹1,000–3,000/month).",
    benefitsHi:
      "₹200/माह (60–79 वर्ष) और ₹500/माह (80+ वर्ष) केंद्रीय योगदान, साथ में राज्य की अतिरिक्त राशि।",
    rules: { minAge: 60, maxAnnualIncome: 150000 },
    documents: [
      "Aadhaar card",
      "Age proof (Aadhaar / voter ID / birth certificate)",
      "BPL certificate / income certificate",
      "Bank or post office account details",
    ],
    steps: [
      "Apply at Gram Panchayat / Block office or state social welfare portal",
      "Submit age and BPL/income proof with bank details",
      "Application verified by Gram Sabha / municipality",
      "Pension credited monthly to the bank account",
    ],
    officialUrl: "https://nsap.nic.in",
    tags: ["pension", "senior", "old age", "elderly", "nsap", "retirement"],
  },
  {
    slug: "pm-svanidhi",
    name: "PM SVANidhi (Street Vendor Loan)",
    nameHi: "पीएम स्वनिधि (स्ट्रीट वेंडर ऋण)",
    ministry: "Ministry of Housing & Urban Affairs",
    category: "MSME & Business",
    level: "central",
    summary:
      "Collateral-free working capital loans for street vendors — ₹10,000, then ₹20,000 and ₹50,000 on timely repayment, with cashback for digital transactions.",
    summaryHi:
      "स्ट्रीट वेंडरों के लिए बिना गारंटी कार्यशील पूंजी ऋण — ₹10,000 से शुरू, समय पर भुगतान पर ₹20,000 और ₹50,000 तक, डिजिटल लेनदेन पर कैशबैक।",
    benefits:
      "₹10,000 first loan with 7% interest subsidy, progressive loans up to ₹50,000, monthly cashback on digital payments.",
    benefitsHi:
      "7% ब्याज सब्सिडी के साथ ₹10,000 का पहला ऋण, ₹50,000 तक क्रमिक ऋण, डिजिटल भुगतान पर कैशबैक।",
    rules: { occupations: ["vendor"] },
    documents: [
      "Aadhaar card",
      "Vending certificate / Letter of Recommendation (or survey listing)",
      "Bank account details",
      "Mobile number",
    ],
    steps: [
      "Apply at pmsvanidhi.mohua.gov.in or the nearest CSC",
      "Complete e-KYC with Aadhaar",
      "If not in the vendor survey, request a Letter of Recommendation from ULB",
      "Loan disbursed to bank account; repay in 12 monthly instalments",
    ],
    officialUrl: "https://pmsvanidhi.mohua.gov.in",
    tags: ["vendor", "street", "loan", "thela", "hawker", "svanidhi", "business"],
  },
];
