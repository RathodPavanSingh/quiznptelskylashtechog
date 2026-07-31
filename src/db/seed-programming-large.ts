export type LargeProgrammingQuestion = {
  number: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topic: string;
  language: string;
  timeSeconds: number;
  isPyq: boolean;
  year: number;
  questionText: string;
  codeSnippet: string | null;
  options: string[];
  correctIndex: number;
  explanation: string;
  tags: string[];
};

type BuiltQuestion = {
  title: string;
  topic: string;
  question: string;
  code: string | null;
  options: string[];
  correctIndex: number;
  answer: string;
  explanation: string;
};

type Builder = (v: number, serial: number) => BuiltQuestion;

function shuffleOptions(answer: string, distractors: string[], seed: number) {
  const unique = Array.from(new Set([answer, ...distractors])).slice(0, 4);
  while (unique.length < 4) unique.push(`Option ${unique.length + 1}`);
  const shift = seed % unique.length;
  const options = [...unique.slice(shift), ...unique.slice(0, shift)];
  return { options, correctIndex: options.indexOf(answer) };
}

const cBuilders: Builder[] = [
  (v, s) => {
    const a = 3 + (v % 17), b = 2 + (v % 9);
    const answer = String(a + b * 2);
    return {
      title: `C precedence trace ${s}`,
      topic: "Operators & Precedence",
      question: `What is the exact output of this C program? Variant ${s}.`,
      code: `#include <stdio.h>\nint main(void) {\n    int a = ${a}, b = ${b};\n    printf("%d", a + b * 2);\n    return 0;\n}`,
      ...shuffleOptions(answer, [String((a + b) * 2), String(a + b), String(a * 2 + b)], s),
      answer,
      explanation: `Multiplication has higher precedence than addition, so ${b} × 2 is evaluated first. Output = ${a} + ${b * 2} = ${answer}.`,
    };
  },
  (v, s) => {
    const n = 3 + (v % 8), start = v % 5;
    const answer = String(n * start + (n * (n - 1)) / 2);
    return {
      title: `C loop accumulator ${s}`,
      topic: "Loops",
      question: `Trace the loop and choose its output. C variant ${s}.`,
      code: `#include <stdio.h>\nint main(void) {\n    int sum = 0;\n    for (int i = ${start}; i < ${start + n}; ++i) sum += i;\n    printf("%d", sum);\n}`,
      ...shuffleOptions(answer, [String(Number(answer) + n), String(Number(answer) - start), String(n * (start + n))], s),
      answer,
      explanation: `The loop adds ${n} consecutive integers beginning at ${start}; their sum is ${answer}.`,
    };
  },
  (v, s) => {
    const x = 5 + (v % 20);
    const answer = String(x + 1);
    return {
      title: `C pointer increment ${s}`,
      topic: "Pointers",
      question: `What value is printed after dereferencing the pointer? Variant ${s}.`,
      code: `#include <stdio.h>\nint main(void) {\n    int x = ${x};\n    int *p = &x;\n    (*p)++;\n    printf("%d", x);\n}`,
      ...shuffleOptions(answer, [String(x), String(x + 2), "Undefined behavior"], s),
      answer,
      explanation: `p stores x's address. Incrementing (*p) modifies x directly from ${x} to ${answer}.`,
    };
  },
  (v, s) => {
    const n = 4 + (v % 7), value = 2 + (v % 9);
    const answer = String(value);
    return {
      title: `C array index ${s}`,
      topic: "Arrays",
      question: `Determine the selected array element. Variant ${s}.`,
      code: `#include <stdio.h>\nint main(void) {\n    int a[${n}] = {0};\n    a[${n - 2}] = ${value};\n    printf("%d", *(a + ${n - 2}));\n}`,
      ...shuffleOptions(answer, ["0", String(n - 2), String(value + 1)], s),
      answer,
      explanation: `*(a + i) is identical to a[i]. Index ${n - 2} contains ${value}.`,
    };
  },
  (v, s) => {
    const answer = "4";
    return {
      title: `C sizeof expression ${s}`,
      topic: "Data Types",
      question: `Assuming a standard implementation where int is 4 bytes, what is printed? Variant ${s}.`,
      code: `#include <stdio.h>\nint main(void) { int x = ${v}; printf("%zu", sizeof(x + 1)); }`,
      ...shuffleOptions(answer, ["2", "8", String(v)], s),
      answer,
      explanation: "x + 1 has type int. Under the stated implementation, sizeof(int) is 4 bytes.",
    };
  },
];

const cppBuilders: Builder[] = [
  (v, s) => {
    const n = 3 + (v % 7), add = 2 + (v % 11);
    const answer = String(n + 1);
    return {
      title: `C++ vector size ${s}`,
      topic: "STL Vector",
      question: `What is the output of this C++17 snippet? Variant ${s}.`,
      code: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){ vector<int> v(${n}, ${add}); v.push_back(${add + 1}); cout << v.size(); }`,
      ...shuffleOptions(answer, [String(n), String(n + 2), String(add)], s),
      answer,
      explanation: `The vector starts with ${n} elements and push_back adds one, so size is ${answer}.`,
    };
  },
  (v, s) => {
    const a = 2 + (v % 12), b = a + 3 + (v % 8);
    const answer = String(b);
    return {
      title: `C++ reference update ${s}`,
      topic: "References",
      question: `Trace the reference assignment in C++. Variant ${s}.`,
      code: `#include <iostream>\nusing namespace std;\nint main(){ int x=${a}; int& r=x; r=${b}; cout<<x; }`,
      ...shuffleOptions(answer, [String(a), "0", "Compilation error"], s),
      answer,
      explanation: `r is an alias of x; assigning ${b} through r changes x to ${b}.`,
    };
  },
  (v, s) => {
    const nums = [v % 9 + 1, v % 7 + 2, v % 5 + 3];
    const answer = String(Math.max(...nums));
    return {
      title: `C++ STL maximum ${s}`,
      topic: "Algorithms",
      question: `What does max_element return for this C++ container? Variant ${s}.`,
      code: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){ vector<int> a={${nums.join(",")}}; cout<<*max_element(a.begin(),a.end()); }`,
      ...shuffleOptions(answer, nums.filter((x) => String(x) !== answer).map(String).concat([String(Number(answer) + 1)]), s),
      answer,
      explanation: `max_element points to the largest element, ${answer}.`,
    };
  },
  (v, s) => {
    const answer = "Base Derived";
    return {
      title: `C++ virtual dispatch ${s}`,
      topic: "OOP & Polymorphism",
      question: `Which output demonstrates virtual dispatch in C++? Variant ${s}.`,
      code: `#include <iostream>\nusing namespace std;\nstruct B{virtual void f(){cout<<"Base ";}};\nstruct D:B{void f()override{cout<<"Derived";}};\nint main(){B b; D d; B* p=&d; b.f(); p->f();}`,
      ...shuffleOptions(answer, ["Base Base", "Derived Derived", "Compilation error"], s),
      answer,
      explanation: "b.f() calls Base::f, while p points to D and virtual dispatch invokes D::f.",
    };
  },
  (v, s) => {
    const answer = "O(log n)";
    return {
      title: `C++ ordered map lookup ${s}`,
      topic: "STL Map",
      question: `What is the worst-case lookup complexity of std::map in C++? Trend variant ${s}.`,
      code: null,
      ...shuffleOptions(answer, ["O(1)", "O(n)", "O(n log n)"], s),
      answer,
      explanation: "std::map is normally implemented as a balanced binary search tree, giving O(log n) lookup.",
    };
  },
];

const javaBuilders: Builder[] = [
  (v, s) => {
    const word = `java${v}`;
    const answer = String(word.length);
    return {
      title: `Java String length ${s}`,
      topic: "Strings",
      question: `What is printed by this Java 17 program? Variant ${s}.`,
      code: `class Main { public static void main(String[] args) { String s="${word}"; System.out.print(s.length()); } }`,
      ...shuffleOptions(answer, [String(word.length - 1), String(word.length + 1), "Compilation error"], s),
      answer,
      explanation: `String.length() returns the number of UTF-16 code units; this ASCII string has ${answer} characters.`,
    };
  },
  (v, s) => {
    const n = 2 + (v % 8);
    const answer = String(n + 1);
    return {
      title: `Java ArrayList size ${s}`,
      topic: "Collections",
      question: `Trace this ArrayList operation. Variant ${s}.`,
      code: `import java.util.*; class Main { public static void main(String[] a){ List<Integer> x=new ArrayList<>(); for(int i=0;i<${n};i++)x.add(i); x.add(99); System.out.print(x.size()); } }`,
      ...shuffleOptions(answer, [String(n), String(n + 2), "99"], s),
      answer,
      explanation: `${n} loop inserts plus one extra insert produce ${answer} elements.`,
    };
  },
  (v, s) => {
    const answer = "false true";
    return {
      title: `Java equality semantics ${s}`,
      topic: "Object Equality",
      question: `What does this Java equality test print? Variant ${s}.`,
      code: `class Main { public static void main(String[] a){ String x=new String("code${v}"); String y=new String("code${v}"); System.out.print((x==y)+" "+x.equals(y)); } }`,
      ...shuffleOptions(answer, ["true true", "false false", "true false"], s),
      answer,
      explanation: "== compares object references (different), while equals compares String content (same).",
    };
  },
  (v, s) => {
    const n = 4 + (v % 9);
    const answer = String((n * (n + 1)) / 2);
    return {
      title: `Java Stream reduce ${s}`,
      topic: "Streams",
      question: `Evaluate the Java Stream pipeline. Variant ${s}.`,
      code: `import java.util.stream.*; class Main{public static void main(String[]a){System.out.print(IntStream.rangeClosed(1,${n}).sum());}}`,
      ...shuffleOptions(answer, [String(n * n), String((n * (n - 1)) / 2), String(n)], s),
      answer,
      explanation: `rangeClosed includes 1 through ${n}; their sum is ${answer}.`,
    };
  },
  (v, s) => {
    const answer = "HashMap";
    return {
      title: `Java key value collection ${s}`,
      topic: "Collections Framework",
      question: `Which Java collection best provides average O(1) key-value lookup? Variant ${s}.`,
      code: null,
      ...shuffleOptions(answer, ["ArrayList", "TreeSet", "LinkedList"], s),
      answer,
      explanation: "HashMap uses hashing and provides average constant-time get and put operations.",
    };
  },
];

const pythonBuilders: Builder[] = [
  (v, s) => {
    const a = 2 + (v % 8), b = 2 + (v % 5);
    const answer = String(a ** b);
    return {
      title: `Python exponent trace ${s}`,
      topic: "Operators",
      question: `What is printed by this Python 3.12 expression? Variant ${s}.`,
      code: `a = ${a}\nb = ${b}\nprint(a ** b)`,
      ...shuffleOptions(answer, [String(a * b), String(a + b), String(b ** a)], s),
      answer,
      explanation: `Python's ** operator performs exponentiation: ${a} ** ${b} = ${answer}.`,
    };
  },
  (v, s) => {
    const n = 5 + (v % 8);
    const answer = JSON.stringify(Array.from({ length: n }, (_, i) => i).filter((x) => x % 2 === 0));
    return {
      title: `Python comprehension ${s}`,
      topic: "List Comprehensions",
      question: `Evaluate this Python list comprehension. Variant ${s}.`,
      code: `print([x for x in range(${n}) if x % 2 == 0])`,
      ...shuffleOptions(answer, [JSON.stringify([1, 3, 5]), JSON.stringify(Array.from({ length: n }, (_, i) => i)), "Error"], s),
      answer,
      explanation: `The condition keeps only even values below ${n}.`,
    };
  },
  (v, s) => {
    const word = `python${v}`;
    const answer = word.split("").reverse().join("");
    return {
      title: `Python slicing ${s}`,
      topic: "Strings & Slicing",
      question: `What is the output of this Python slicing operation? Variant ${s}.`,
      code: `s = "${word}"\nprint(s[::-1])`,
      ...shuffleOptions(answer, [word, word.slice(1), "IndexError"], s),
      answer,
      explanation: "A slice step of -1 reads the string from end to start.",
    };
  },
  (v, s) => {
    const key = `k${v}`, val = 10 + (v % 40);
    const answer = String(val + 1);
    return {
      title: `Python dictionary update ${s}`,
      topic: "Dictionaries",
      question: `Trace this dictionary update in Python. Variant ${s}.`,
      code: `d = {"${key}": ${val}}\nd["${key}"] += 1\nprint(d["${key}"])`,
      ...shuffleOptions(answer, [String(val), String(val + 2), "KeyError"], s),
      answer,
      explanation: `The existing value ${val} is incremented by one, producing ${answer}.`,
    };
  },
  (v, s) => {
    const answer = "tuple";
    return {
      title: `Python immutable collection ${s}`,
      topic: "Core Data Structures",
      question: `Which Python built-in sequence is immutable? Trend variant ${s}.`,
      code: null,
      ...shuffleOptions(answer, ["list", "set", "dict"], s),
      answer,
      explanation: "Tuples cannot be changed after creation; lists, sets, and dictionaries are mutable.",
    };
  },
];

const webBuilders: Builder[] = [
  (v, s) => {
    const answer = "button";
    return {
      title: `Web semantic control ${s}`,
      topic: "HTML Semantics",
      question: `Which semantic HTML element should trigger an in-page action? Variant ${s}.`,
      code: null,
      ...shuffleOptions(answer, ["div", "a without href", "span"], s),
      answer,
      explanation: "The button element is keyboard-accessible and semantically represents an action.",
    };
  },
  (v, s) => {
    const a = 2 + (v % 8), b = 3 + (v % 9);
    const answer = String(a + b);
    return {
      title: `JavaScript numeric coercion ${s}`,
      topic: "JavaScript",
      question: `What is logged by this modern JavaScript snippet? Variant ${s}.`,
      code: `const a = Number("${a}");\nconst b = ${b};\nconsole.log(a + b);`,
      ...shuffleOptions(answer, [`${a}${b}`, "NaN", String(a * b)], s),
      answer,
      explanation: `Number converts the string to ${a}; numeric addition gives ${answer}.`,
    };
  },
  (v, s) => {
    const answer = "200";
    return {
      title: `HTTP successful response ${s}`,
      topic: "HTTP & APIs",
      question: `Which HTTP status code represents a successful standard response? Variant ${s}.`,
      code: null,
      ...shuffleOptions(answer, ["301", "404", "500"], s),
      answer,
      explanation: "HTTP 200 means OK; the request completed successfully.",
    };
  },
  (v, s) => {
    const answer = "display: grid";
    return {
      title: `CSS two dimensional layout ${s}`,
      topic: "CSS Layout",
      question: `Which CSS declaration activates a two-dimensional Grid formatting context? Variant ${s}.`,
      code: `.dashboard { /* choose declaration */ }`,
      ...shuffleOptions(answer, ["position: grid", "layout: grid", "float: grid"], s),
      answer,
      explanation: "display: grid creates a CSS Grid container.",
    };
  },
  (v, s) => {
    const answer = "useEffect";
    return {
      title: `React side effect hook ${s}`,
      topic: "React",
      question: `Which React hook runs synchronization side effects after rendering? Variant ${s}.`,
      code: null,
      ...shuffleOptions(answer, ["useMemo", "useState", "useRef"], s),
      answer,
      explanation: "useEffect is designed for synchronization with external systems after render.",
    };
  },
];

const dataBuilders: Builder[] = [
  (v, s) => {
    const values = [2 + (v % 8), 4 + (v % 7), 6 + (v % 6)];
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const answer = mean.toFixed(2);
    return {
      title: `Data mean calculation ${s}`,
      topic: "Descriptive Statistics",
      question: `Calculate the arithmetic mean of this small dataset. Variant ${s}.`,
      code: `values = [${values.join(", ")}]`,
      ...shuffleOptions(answer, [(mean + 1).toFixed(2), (mean - 1).toFixed(2), String(values.reduce((a, b) => a + b, 0))], s),
      answer,
      explanation: `Mean = (${values.join(" + ")}) / 3 = ${answer}.`,
    };
  },
  (v, s) => {
    const answer = "df.groupby('team')['score'].mean()";
    return {
      title: `Pandas group mean ${s}`,
      topic: "Pandas",
      question: `Which Pandas expression computes mean score for each team? Variant ${s}.`,
      code: `# columns: team, score\n# df is a pandas DataFrame`,
      ...shuffleOptions(answer, ["df.mean('team')", "df.group('team').score", "df['team'].mean()"], s),
      answer,
      explanation: "groupby creates groups by team; selecting score and mean aggregates each group.",
    };
  },
  (v, s) => {
    const answer = "SELECT department, AVG(salary) FROM employees GROUP BY department;";
    return {
      title: `SQL grouped average ${s}`,
      topic: "SQL Analytics",
      question: `Which SQL query returns average salary by department? Variant ${s}.`,
      code: null,
      ...shuffleOptions(answer, ["SELECT AVG(salary) FROM employees;", "SELECT department FROM employees AVG(salary);", "SELECT * FROM employees ORDER BY salary;"], s),
      answer,
      explanation: "GROUP BY department creates one aggregate group per department.",
    };
  },
  (v, s) => {
    const answer = "Standardization";
    return {
      title: `Feature scaling choice ${s}`,
      topic: "Machine Learning Preprocessing",
      question: `Which transformation centers a feature at zero and scales it to unit standard deviation? Variant ${s}.`,
      code: null,
      ...shuffleOptions(answer, ["One-hot encoding", "Label encoding", "Imputation"], s),
      answer,
      explanation: "Standardization applies z=(x-mean)/standard_deviation.",
    };
  },
  (v, s) => {
    const answer = "Precision";
    return {
      title: `Classification metric ${s}`,
      topic: "Model Evaluation",
      question: `When false positives are especially costly, which classification metric should be prioritized? Variant ${s}.`,
      code: null,
      ...shuffleOptions(answer, ["Recall", "Mean squared error", "R-squared"], s),
      answer,
      explanation: "Precision = TP/(TP+FP), so it directly penalizes false positives.",
    };
  },
];

const categories: Array<{ language: string; topicPrefix: string; builders: Builder[] }> = [
  { language: "Data Analysis", topicPrefix: "data-analysis", builders: dataBuilders },
  { language: "Web Development", topicPrefix: "web-development", builders: webBuilders },
  { language: "C", topicPrefix: "c", builders: cBuilders },
  { language: "C++", topicPrefix: "cpp", builders: cppBuilders },
  { language: "Java", topicPrefix: "java", builders: javaBuilders },
  { language: "Python", topicPrefix: "python", builders: pythonBuilders },
];

export const seedLargeProgrammingQuestions: LargeProgrammingQuestion[] = categories.flatMap(
  (category, categoryIndex) =>
    Array.from({ length: 250 }, (_, idx) => {
      const serial = categoryIndex * 250 + idx + 1;
      const variant = Math.floor(idx / category.builders.length) + 1;
      const builder = category.builders[idx % category.builders.length];
      const built = builder(variant * 17 + idx, serial);
      const years = [2026, 2025, 2024, 2023, 2022];
      const difficulty: "Easy" | "Medium" | "Hard" = idx % 5 < 2 ? "Easy" : idx % 5 < 4 ? "Medium" : "Hard";

      return {
        number: `Q.${serial}`,
        title: built.title,
        difficulty,
        topic: built.topic,
        language: category.language,
        timeSeconds: 25 + ((serial * 7) % 50),
        isPyq: serial % 2 === 0 || serial % 5 === 0,
        year: years[serial % years.length],
        questionText: built.question,
        codeSnippet: built.code,
        options: built.options,
        correctIndex: built.correctIndex,
        explanation: built.explanation,
        tags: [category.topicPrefix, built.topic.toLowerCase().replace(/[^a-z0-9]+/g, "-"), "latest", "trending"],
      };
    }),
);
