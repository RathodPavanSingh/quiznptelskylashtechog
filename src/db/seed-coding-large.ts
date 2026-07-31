import type { CodeSolution } from "./schema";

export type LargeCodingProblem = {
  number: number;
  title: string;
  slug: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topic: string;
  isPyq: boolean;
  statement: string;
  constraints: string;
  inputFormat: string;
  outputFormat: string;
  sampleInput: string;
  sampleOutput: string;
  sampleExplanation: string;
  solutions: CodeSolution[];
  commonMistakes: string[];
  similarProblems: string[];
  proTip: string;
};

type Template = {
  key: string;
  title: string;
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
  statement: (variant: number) => string;
  constraints: string;
  inputFormat: string;
  outputFormat: string;
  sampleInput: string;
  sampleOutput: string;
  sampleExplanation: string;
  approach: string;
  mistakes: string[];
  similar: string[];
  tip: string;
  py: string;
  java: string;
  cpp: string;
  c: string;
};

function solutions(t: Template): CodeSolution[] {
  return [
    { language: "Python", code: t.py, timeComplexity: "See approach", spaceComplexity: "See approach", explanation: t.approach },
    { language: "Java", code: t.java, timeComplexity: "See approach", spaceComplexity: "See approach", explanation: t.approach },
    { language: "C++", code: t.cpp, timeComplexity: "See approach", spaceComplexity: "See approach", explanation: t.approach },
    { language: "C", code: t.c, timeComplexity: "See approach", spaceComplexity: "See approach", explanation: t.approach },
  ];
}

const COMMON_IO = {
  inputFormat: "First line contains input size(s). Next line(s) contain the required values.",
  outputFormat: "Print the requested result exactly as specified.",
};

const templates: Template[] = [
  {
    key: "two-sum", title: "Two Sum Pair", topic: "Hashing", difficulty: "Easy",
    statement: (v) => `Given an array of N integers and target T, find any two indices whose values sum to T. Variant ${v}: return the lexicographically smallest valid index pair if multiple pairs exist.`,
    constraints: "2 <= N <= 2e5, -1e9 <= A[i], T <= 1e9", sampleInput: "5 9\n2 7 11 15 1", sampleOutput: "0 1", sampleExplanation: "A[0]+A[1]=2+7=9.",
    approach: "Use a hash map from value to earliest index; for each value v, check if T-v was seen. O(N) time, O(N) space.", mistakes: ["Returning same element twice", "Overwriting earliest index"], similar: ["3Sum", "Pair Difference", "Subarray Sum K"], tip: "Store earliest index to satisfy lexicographically smallest pair.", ...COMMON_IO,
    py: `n,t=map(int,input().split())\na=list(map(int,input().split()))\nseen={}\nans=None\nfor i,v in enumerate(a):\n    if t-v in seen:\n        ans=(seen[t-v],i); break\n    if v not in seen: seen[v]=i\nprint(*ans if ans else [-1,-1])`,
    java: `import java.util.*;class Main{public static void main(String[]a){Scanner s=new Scanner(System.in);int n=s.nextInt();long t=s.nextLong();Map<Long,Integer>m=new HashMap<>();for(int i=0;i<n;i++){long v=s.nextLong();if(m.containsKey(t-v)){System.out.println(m.get(t-v)+" "+i);return;}m.putIfAbsent(v,i);}System.out.println("-1 -1");}}`,
    cpp: `#include<bits/stdc++.h>\nusing namespace std;int main(){int n;long long t;cin>>n>>t;unordered_map<long long,int>m;for(int i=0;i<n;i++){long long v;cin>>v;if(m.count(t-v)){cout<<m[t-v]<<" "<<i;return 0;}if(!m.count(v))m[v]=i;}cout<<"-1 -1";}`,
    c: `#include<stdio.h>\nint main(){int n; long long t,a[200005]; scanf("%d%lld",&n,&t); for(int i=0;i<n;i++)scanf("%lld",&a[i]); for(int i=0;i<n;i++)for(int j=i+1;j<n;j++)if(a[i]+a[j]==t){printf("%d %d",i,j);return 0;}printf("-1 -1");}`,
  },
  {
    key: "max-subarray", title: "Maximum Subarray Sum", topic: "Dynamic Programming", difficulty: "Medium",
    statement: (v) => `Find the maximum possible sum of a non-empty contiguous subarray. Variant ${v}: the array may contain all negative values, so handle that case correctly.`,
    constraints: "1 <= N <= 2e5, -1e9 <= A[i] <= 1e9", sampleInput: "8\n-2 1 -3 4 -1 2 1 -5", sampleOutput: "6", sampleExplanation: "Subarray [4,-1,2,1] has sum 6.",
    approach: "Kadane's algorithm maintains best subarray ending at current index and global best. O(N) time, O(1) space.", mistakes: ["Starting best at 0 for all-negative arrays", "Using int instead of long long"], similar: ["Max Product Subarray", "Circular Subarray"], tip: "Initialize with first element, not zero.", ...COMMON_IO,
    py: `n=int(input())\na=list(map(int,input().split()))\ncur=best=a[0]\nfor x in a[1:]: cur=max(x,cur+x); best=max(best,cur)\nprint(best)`,
    java: `import java.util.*;class Main{public static void main(String[]a){Scanner s=new Scanner(System.in);int n=s.nextInt();long cur=s.nextLong(),best=cur;for(int i=1;i<n;i++){long x=s.nextLong();cur=Math.max(x,cur+x);best=Math.max(best,cur);}System.out.println(best);}}`,
    cpp: `#include<bits/stdc++.h>\nusing namespace std;int main(){int n;cin>>n;long long x,cur,best;cin>>x;cur=best=x;for(int i=1;i<n;i++){cin>>x;cur=max(x,cur+x);best=max(best,cur);}cout<<best;}`,
    c: `#include<stdio.h>\nlong long max(long long a,long long b){return a>b?a:b;}int main(){int n;scanf("%d",&n);long long x,cur,best;scanf("%lld",&x);cur=best=x;for(int i=1;i<n;i++){scanf("%lld",&x);cur=max(x,cur+x);best=max(best,cur);}printf("%lld",best);}`,
  },
  {
    key: "valid-parentheses", title: "Balanced Brackets", topic: "Stack", difficulty: "Easy",
    statement: (v) => `Check whether the given bracket string is balanced. Variant ${v}: support (), {}, and [] brackets and reject every incorrect nesting.`,
    constraints: "1 <= |S| <= 2e5", sampleInput: "{[()]}", sampleOutput: "YES", sampleExplanation: "All opened brackets are closed in reverse order.",
    approach: "Push opening brackets on a stack; each closing bracket must match the stack top. O(N) time.", mistakes: ["Not checking empty stack before pop", "Ignoring final non-empty stack"], similar: ["Min Remove Parentheses", "Longest Valid Parentheses"], tip: "Map closing bracket to expected opener.", ...COMMON_IO,
    py: `s=input().strip(); st=[]; mp={')':'(','}':'{',']':'['}; ok=True\nfor c in s:\n    if c in '({[': st.append(c)\n    elif not st or st.pop()!=mp.get(c): ok=False; break\nprint('YES' if ok and not st else 'NO')`,
    java: `import java.util.*;class Main{public static void main(String[]a){String s=new Scanner(System.in).next();Deque<Character>st=new ArrayDeque<>();Map<Character,Character>m=Map.of(')','(','}','{',']','[');boolean ok=true;for(char c:s.toCharArray()){if("({[".indexOf(c)>=0)st.push(c);else if(st.isEmpty()||st.pop()!=m.get(c)){ok=false;break;}}System.out.println(ok&&st.isEmpty()?"YES":"NO");}}`,
    cpp: `#include<bits/stdc++.h>\nusing namespace std;int main(){string s;cin>>s;stack<char>st;map<char,char>m={{')','('},{'}','{'},{']','['}};bool ok=1;for(char c:s){if(c=='('||c=='{'||c=='[')st.push(c);else{if(st.empty()||st.top()!=m[c]){ok=0;break;}st.pop();}}cout<<(ok&&st.empty()?"YES":"NO");}`,
    c: `#include<stdio.h>\n#include<string.h>\nint main(){char s[200005],st[200005];scanf("%s",s);int top=0,ok=1;for(int i=0;s[i];i++){char c=s[i];if(c=='('||c=='{'||c=='[')st[top++]=c;else{if(!top){ok=0;break;}char o=st[--top];if((c==')'&&o!='(')||(c=='}'&&o!='{')||(c==']'&&o!='[')){ok=0;break;}}}printf(ok&&!top?"YES":"NO");}`,
  },
  {
    key: "binary-search", title: "Lower Bound Search", topic: "Binary Search", difficulty: "Easy",
    statement: (v) => `Given a sorted array and value X, return the first index i such that A[i] >= X. Variant ${v}: print -1 if no such index exists.`,
    constraints: "1 <= N <= 2e5, sorted non-decreasing array", sampleInput: "5 6\n1 3 6 6 9", sampleOutput: "2", sampleExplanation: "A[2] is the first value >= 6.",
    approach: "Classic lower_bound binary search keeps answer and moves left when condition is true. O(log N).", mistakes: ["Infinite loop by not shrinking range", "Returning any equal index instead of first"], similar: ["Upper Bound", "Search Insert Position"], tip: "Use l < r style or store ans carefully.", ...COMMON_IO,
    py: `n,x=map(int,input().split()); a=list(map(int,input().split()))\nl,r,ans=0,n-1,-1\nwhile l<=r:\n m=(l+r)//2\n if a[m]>=x: ans=m; r=m-1\n else: l=m+1\nprint(ans)`,
    java: `import java.util.*;class Main{public static void main(String[]a){Scanner s=new Scanner(System.in);int n=s.nextInt(),x=s.nextInt();int[]arr=new int[n];for(int i=0;i<n;i++)arr[i]=s.nextInt();int l=0,r=n-1,ans=-1;while(l<=r){int m=(l+r)/2;if(arr[m]>=x){ans=m;r=m-1;}else l=m+1;}System.out.println(ans);}}`,
    cpp: `#include<bits/stdc++.h>\nusing namespace std;int main(){int n,x;cin>>n>>x;vector<int>a(n);for(int&i:a)cin>>i;auto it=lower_bound(a.begin(),a.end(),x);cout<<(it==a.end()?-1:int(it-a.begin()));}`,
    c: `#include<stdio.h>\nint main(){int n,x,a[200005];scanf("%d%d",&n,&x);for(int i=0;i<n;i++)scanf("%d",&a[i]);int l=0,r=n-1,ans=-1;while(l<=r){int m=(l+r)/2;if(a[m]>=x){ans=m;r=m-1;}else l=m+1;}printf("%d",ans);}`,
  },
  {
    key: "prefix-sum", title: "Range Sum Queries", topic: "Prefix Sum", difficulty: "Easy",
    statement: (v) => `Answer Q range-sum queries on an array. Variant ${v}: each query is 1-indexed and inclusive [L, R].`,
    constraints: "1 <= N,Q <= 2e5", sampleInput: "5 2\n1 2 3 4 5\n1 3\n2 5", sampleOutput: "6\n14", sampleExplanation: "Prefix sums answer each query in O(1).",
    approach: "Build prefix[i]=sum of first i numbers. Query sum = prefix[R]-prefix[L-1].", mistakes: ["Mixing 0-indexed and 1-indexed ranges", "Using O(N) per query"], similar: ["2D Prefix Sum", "Subarray Sum"], tip: "Use long long for large sums.", ...COMMON_IO,
    py: `n,q=map(int,input().split()); a=list(map(int,input().split()))\np=[0]\nfor v in a:p.append(p[-1]+v)\nfor _ in range(q):\n l,r=map(int,input().split()); print(p[r]-p[l-1])`,
    java: `import java.util.*;class Main{public static void main(String[]a){Scanner s=new Scanner(System.in);int n=s.nextInt(),q=s.nextInt();long[]p=new long[n+1];for(int i=1;i<=n;i++)p[i]=p[i-1]+s.nextLong();while(q-->0){int l=s.nextInt(),r=s.nextInt();System.out.println(p[r]-p[l-1]);}}}`,
    cpp: `#include<bits/stdc++.h>\nusing namespace std;int main(){int n,q;cin>>n>>q;vector<long long>p(n+1);for(int i=1;i<=n;i++){long long x;cin>>x;p[i]=p[i-1]+x;}while(q--){int l,r;cin>>l>>r;cout<<p[r]-p[l-1]<<"\\n";}}`,
    c: `#include<stdio.h>\nint main(){int n,q;scanf("%d%d",&n,&q);long long p[200005]={0};for(int i=1;i<=n;i++){long long x;scanf("%lld",&x);p[i]=p[i-1]+x;}while(q--){int l,r;scanf("%d%d",&l,&r);printf("%lld\\n",p[r]-p[l-1]);}}`,
  },
];

const TOPICS = [
  "Arrays", "Strings", "Hashing", "Stack", "Queue", "Two Pointers", "Sliding Window", "Binary Search", "Sorting", "Prefix Sum",
  "Dynamic Programming", "Greedy", "Graph", "Tree", "Heap", "Bit Manipulation", "Math", "Linked List", "Trie", "Union Find",
];

function templateAt(i: number): Template {
  const base = templates[i % templates.length];
  const topic = TOPICS[i % TOPICS.length];
  if (templates.length >= 5) return { ...base, topic: base.topic === "Hashing" ? topic : base.topic };
  return base;
}

export const seedLargeCodingProblems: LargeCodingProblem[] = Array.from({ length: 500 }, (_, idx) => {
  const number = idx + 1;
  const variant = Math.floor(idx / templates.length) + 1;
  const t = templateAt(idx);
  const uniqueTitle = `${t.title} ${variant.toString().padStart(2, "0")}`;
  const slug = `coding-${t.key}-${variant.toString().padStart(2, "0")}-${number}`;
  const isPyq = number % 2 === 0 || number % 5 === 0;

  return {
    number,
    title: uniqueTitle,
    slug,
    difficulty: t.difficulty,
    topic: t.topic,
    isPyq,
    statement: t.statement(variant),
    constraints: t.constraints,
    inputFormat: t.inputFormat,
    outputFormat: t.outputFormat,
    sampleInput: t.sampleInput,
    sampleOutput: t.sampleOutput,
    sampleExplanation: t.sampleExplanation,
    solutions: solutions(t),
    commonMistakes: t.mistakes,
    similarProblems: t.similar,
    proTip: t.tip,
  };
});
