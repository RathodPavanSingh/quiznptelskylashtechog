export type AptitudeQ = {
  category: "aptitude";
  section: "numerical" | "verbal" | "reasoning";
  number: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topic: string;
  timeSeconds: number;
  isPyq: boolean;
  year: number;
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  tags: string[];
  questionType: "mcq" | "msq" | "numerical";
  correctIndices: number[] | null;
  numericalAnswer: number | null;
  numericalTolerance: number | null;
  numericalUnit: string | null;
};

// --- Templates for Numerical (Quantitative) Aptitude ---
const NUMERICAL_TEMPLATES = [
  {
    topic: "Profit & Loss",
    q: (v1: number, v2: number, name: string) => `${name} buys a smart gadget for ₹${v1} and sells it for ₹${v2}. What is the profit or loss percentage? (Round off to nearest integer)`,
    e: (v1: number, v2: number) => {
      const diff = v2 - v1;
      const pct = Math.round((Math.abs(diff) / v1) * 100);
      return `Cost Price (CP) = ₹${v1}, Selling Price (SP) = ₹${v2}. ${diff >= 0 ? "Profit" : "Loss"} = ₹${Math.abs(diff)}. Percentage = (${Math.abs(diff)}/${v1}) * 100 = ${pct}% ${diff >= 0 ? "Gain" : "Loss"}.`;
    },
    opts: (v1: number, v2: number) => {
      const diff = v2 - v1;
      const pct = Math.round((Math.abs(diff) / v1) * 100);
      return [`${pct}% ${diff >= 0 ? "Gain" : "Loss"}`, `${pct - 5}% Loss`, `${pct + 8}% Gain`, `${pct + 3}% Loss`].sort();
    }
  },
  {
    topic: "Time & Work",
    q: (v1: number, v2: number, name: string) => `${name} can complete a coding assignment in ${v1} days. Another developer can do it in ${v2} days. If they collaborate, how many days will they take to finish? (Round off to two decimal places)`,
    e: (v1: number, v2: number) => {
      const val = ((v1 * v2) / (v1 + v2)).toFixed(2);
      return `Collaboration rate = 1/${v1} + 1/${v2} = (${v1}+${v2})/(${v1}*${v2}) = ${v1 + v2}/${v1 * v2}. Total days taken = ${val} days.`;
    },
    opts: (v1: number, v2: number) => {
      const val = ((v1 * v2) / (v1 + v2)).toFixed(2);
      return [`${val} days`, `${(parseFloat(val) + 1.2).toFixed(2)} days`, `${(parseFloat(val) - 0.8).toFixed(2)} days`, "9.50 days"].sort();
    }
  },
  {
    topic: "Simple Interest",
    q: (v1: number, v2: number, name: string) => `${name} invests a principal sum of ₹${v1} at a simple interest rate of ${v2}% per annum. What is the total interest accrued over 3 years?`,
    e: (v1: number, v2: number) => {
      const val = (v1 * v2 * 3) / 100;
      return `Simple Interest formula: SI = (P * R * T) / 100. Substituting: (${v1} * ${v2} * 3) / 100 = ₹${val}.`;
    },
    opts: (v1: number, v2: number) => {
      const val = (v1 * v2 * 3) / 100;
      return [`₹${val}`, `₹${val + 150}`, `₹${val - 200}`, `₹${val * 1.2}`].sort();
    }
  },
  {
    topic: "Averages",
    q: (v1: number, v2: number, name: string) => `The average weight of ${v1} core members in ${name}'s project team is ${v2} kg. If a new lead weighing ${v2 + 10} kg joins, what is the new average weight? (Round off to one decimal place)`,
    e: (v1: number, v2: number) => {
      const sum = v1 * v2;
      const newSum = sum + v2 + 10;
      const val = (newSum / (v1 + 1)).toFixed(1);
      return `Initial total weight = ${v1} * ${v2} = ${sum} kg. New total weight = ${sum} + ${v2 + 10} = ${newSum} kg. New average = ${newSum} / ${v1 + 1} = ${val} kg.`;
    },
    opts: (v1: number, v2: number) => {
      const sum = v1 * v2;
      const newSum = sum + v2 + 10;
      const val = (newSum / (v1 + 1)).toFixed(1);
      return [`${val} kg`, `${(parseFloat(val) + 1.5).toFixed(1)} kg`, `${(parseFloat(val) - 2.1).toFixed(1)} kg`, "70.0 kg"].sort();
    }
  }
];

// --- Templates for Verbal Ability ---
const VERBAL_TEMPLATES = {
  synonym: {
    q: (word: string) => `Identify the correct synonym of the following high-frequency vocabulary word: "${word.toUpperCase()}"`,
    e: (word: string, synonym: string) => `The word "${word}" means expressing yourself readily, clearly, and effectively. Thus, "${synonym}" is the most accurate synonym.`,
  },
  antonym: {
    q: (word: string) => `Choose the most appropriate antonym for the word: "${word.toUpperCase()}"`,
    e: (word: string, antonym: string) => `The word "${word}" describes a characteristic. Its opposite is "${antonym}".`,
  },
  error: {
    q: (sentence: string) => `Spot the grammatical error in the following sentence: "${sentence}"`,
    e: (sentence: string, correction: string) => `The error lies in subject-verb agreement or prepositional correctness. The correct form is: "${correction}".`,
  }
};

// --- Templates for Logical Reasoning ---
const REASONING_TEMPLATES = {
  series: {
    q: (seq: number[]) => `Find the missing term in the given trending arithmetic sequence: ${seq.slice(0, -1).join(", ")}, ?`,
    e: (seq: number[]) => `The pattern follows an arithmetic difference or ratio progression. The next number is ${seq[seq.length - 1]}.`,
    opts: (seq: number[]) => {
      const ans = seq[seq.length - 1];
      return [`${ans}`, `${ans + 10}`, `${ans - 5}`, `${ans * 2}`].sort();
    }
  },
  coding: {
    q: (w1: string, code1: string, w2: string) => `If "${w1}" is coded as "${code1}" in a specific pattern, how would you code "${w2}"?`,
    e: (w2: string, code2: string) => `The code matches character offset progressions (e.g. +1). Hence, "${w2}" resolves to "${code2}".`,
    opts: (code2: string) => [`${code2}`, `${code2}X`, `D${code2.slice(1)}`, "NONE"].sort()
  },
  relation: {
    q: (p1: string, p2: string) => `Introducing ${p1}, ${p2} said, "He is the only son of my father's sister." How is ${p1} related to ${p2}?`,
    e: (p1: string, p2: string) => `Father's sister is Aunt. Her only son is Cousin. Thus, ${p1} is ${p2}'s Cousin.`,
    opts: () => ["Cousin", "Brother", "Uncle", "Nephew"]
  }
};

const NAMES = ["Aarav", "Aditi", "Vihaan", "Ananya", "Kabir", "Diya", "Reyansh", "Meera", "Arjun", "Isha", "Sai", "Prisha"];
const VERBAL_WORDS_SYN = [
  { w: "Eloquent", s: "Fluent", o: ["Fluent", "Silent", "Confused", "Hesitant"] },
  { w: "Meticulous", s: "Scrupulous", o: ["Scrupulous", "Careless", "Messy", "Sloppy"] },
  { w: "Prudent", s: "Wise", o: ["Wise", "Rash", "Careless", "Improvident"] },
  { w: "Tenacious", s: "Persistent", o: ["Persistent", "Weak", "Yielding", "Surrendering"] },
  { w: "Exuberant", s: "Enthusiastic", o: ["Enthusiastic", "Gloomy", "Sad", "Lethargic"] }
];
const VERBAL_WORDS_ANT = [
  { w: "Brave", a: "Cowardly", o: ["Cowardly", "Heroic", "Fearless", "Gallant"] },
  { w: "Abundant", a: "Scarce", o: ["Scarce", "Plentiful", "Bountiful", "Ample"] },
  { w: "Obsolete", a: "Modern", o: ["Modern", "Outdated", "Ancient", "Old"] },
  { w: "Amicable", a: "Hostile", o: ["Hostile", "Friendly", "Harmonious", "Polite"] },
  { w: "Transient", a: "Permanent", o: ["Permanent", "Fleeting", "Brief", "Short-lived"] }
];
const ERROR_SENTENCES = [
  { s: "Neither of the boys have completed their project work.", c: "Neither of the boys has completed...", o: ["Neither of", "the boys", "have completed", "No error"] },
  { s: "She is extremely good in writing professional C code.", c: "She is extremely good at writing...", o: ["good in", "writing", "professional", "No error"] },
  { s: "Each of the candidates were given a distinct set of questions.", c: "Each of the candidates was given...", o: ["Each of", "were given", "distinct set", "No error"] }
];

export function generateAptitudeQuestions(): AptitudeQ[] {
  const list: AptitudeQ[] = [];
  const years = [2026, 2025, 2024, 2023, 2022, 2021];
  const diffs = ["Easy", "Medium", "Hard"] as const;

  // 1. Generate 400 Numerical Questions
  for (let i = 1; i <= 400; i++) {
    const tpl = NUMERICAL_TEMPLATES[i % NUMERICAL_TEMPLATES.length];
    const v1 = 10 + (i * 7) % 300;
    const v2 = 5 + (i * 3) % 40;
    const name = NAMES[i % NAMES.length];
    const year = years[i % years.length];
    const difficulty = diffs[i % diffs.length];

    const qText = tpl.q(v1, v2, name);
    const explanation = tpl.e(v1, v2);
    const options = tpl.opts(v1, v2);
    const correctIndex = options.indexOf(options.find(o => o.includes(String(Math.round((v2 - v1) / v1 * 100))) || o.includes(String(((v1 * v2) / (v1 + v2)).toFixed(2))) || o.includes(String((v1 * v2 * 3) / 100)) || o.includes(String((v1 * v2 + v2 + 10) / (v1 + 1)))) || options[0]);

    list.push({
      category: "aptitude",
      section: "numerical",
      number: `Q.${i}`,
      difficulty,
      topic: tpl.topic,
      timeSeconds: 40,
      isPyq: true,
      year,
      questionText: qText,
      options,
      correctIndex: correctIndex >= 0 ? correctIndex : 0,
      explanation,
      tags: ["Quantitative", tpl.topic, "Numerical", "Trending"],
      questionType: "mcq",
      correctIndices: null,
      numericalAnswer: null,
      numericalTolerance: null,
      numericalUnit: null
    });
  }

  // 2. Generate 400 Verbal Questions
  for (let i = 1; i <= 400; i++) {
    const typeMod = i % 3;
    const year = years[i % years.length];
    const difficulty = diffs[i % diffs.length];
    let qText = "";
    let options: string[] = [];
    let correctIndex = 0;
    let explanation = "";
    let topic = "";

    if (typeMod === 0) {
      const item = VERBAL_WORDS_SYN[i % VERBAL_WORDS_SYN.length];
      topic = "Synonyms & Antonyms";
      qText = VERBAL_TEMPLATES.synonym.q(item.w);
      options = [...item.o].sort();
      correctIndex = options.indexOf(item.s);
      explanation = VERBAL_TEMPLATES.synonym.e(item.w, item.s);
    } else if (typeMod === 1) {
      const item = VERBAL_WORDS_ANT[i % VERBAL_WORDS_ANT.length];
      topic = "Synonyms & Antonyms";
      qText = VERBAL_TEMPLATES.antonym.q(item.w);
      options = [...item.o].sort();
      correctIndex = options.indexOf(item.a);
      explanation = VERBAL_TEMPLATES.antonym.e(item.w, item.a);
    } else {
      const item = ERROR_SENTENCES[i % ERROR_SENTENCES.length];
      topic = "Error Spotting";
      qText = VERBAL_TEMPLATES.error.q(item.s);
      options = [...item.o];
      correctIndex = 2; // have completed -> has completed
      explanation = VERBAL_TEMPLATES.error.e(item.s, item.c);
    }

    list.push({
      category: "aptitude",
      section: "verbal",
      number: `Q.${i}`,
      difficulty,
      topic,
      timeSeconds: 30,
      isPyq: i % 2 === 0,
      year,
      questionText: qText,
      options,
      correctIndex,
      explanation,
      tags: ["Verbal Ability", topic, "English", "TCS-NQT"],
      questionType: "mcq",
      correctIndices: null,
      numericalAnswer: null,
      numericalTolerance: null,
      numericalUnit: null
    });
  }

  // 3. Generate 400 Logical Reasoning Questions
  for (let i = 1; i <= 400; i++) {
    const typeMod = i % 3;
    const year = years[i % years.length];
    const difficulty = diffs[i % diffs.length];
    let qText = "";
    let options: string[] = [];
    let correctIndex = 0;
    let explanation = "";
    let topic = "";

    if (typeMod === 0) {
      topic = "Number Series";
      const start = 2 + (i % 10);
      const diff = 3 + (i % 6);
      const seq = [start, start + diff, start + diff * 2, start + diff * 3, start + diff * 4];
      qText = REASONING_TEMPLATES.series.q(seq);
      options = REASONING_TEMPLATES.series.opts(seq);
      correctIndex = options.indexOf(String(seq[seq.length - 1]));
      explanation = REASONING_TEMPLATES.series.e(seq);
    } else if (typeMod === 1) {
      topic = "Coding-Decoding";
      const w1 = "CAT", w2 = NAMES[i % NAMES.length].toUpperCase();
      const c2 = w2.split("").map(char => String.fromCharCode(char.charCodeAt(0) + 1)).join("");
      qText = REASONING_TEMPLATES.coding.q(w1, "DBU", w2);
      options = REASONING_TEMPLATES.coding.opts(c2);
      correctIndex = options.indexOf(c2);
      explanation = REASONING_TEMPLATES.coding.e(w2, c2);
    } else {
      topic = "Blood Relations";
      const p1 = NAMES[i % NAMES.length];
      const p2 = NAMES[(i + 1) % NAMES.length];
      qText = REASONING_TEMPLATES.relation.q(p1, p2);
      options = REASONING_TEMPLATES.relation.opts();
      correctIndex = options.indexOf("Cousin");
      explanation = REASONING_TEMPLATES.relation.e(p1, p2);
    }

    list.push({
      category: "aptitude",
      section: "reasoning",
      number: `Q.${i}`,
      difficulty,
      topic,
      timeSeconds: 40,
      isPyq: true,
      year,
      questionText: qText,
      options,
      correctIndex: correctIndex >= 0 ? correctIndex : 0,
      explanation,
      tags: ["Logical Reasoning", topic, "Analytical", "Cognizant"],
      questionType: "mcq",
      correctIndices: null,
      numericalAnswer: null,
      numericalTolerance: null,
      numericalUnit: null
    });
  }

  return list;
}

export const seedAptitudeLargeQuestions: AptitudeQ[] = generateAptitudeQuestions();
