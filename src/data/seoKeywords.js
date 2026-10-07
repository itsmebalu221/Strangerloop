import pages, { home } from "./seoPages.js";

const clusterTerms = {
  "random-chat": ["random chat", "random chat online", "random chat with strangers", "chat with random people", "meet strangers online", "random conversation online", "free random chat", "online stranger conversation", "random chat for adults", "talk to strangers online"],
  "text-chat": ["text chat", "random text chat", "text chat with strangers", "free text chat", "online text conversation", "anonymous text chat", "text chat online", "text conversation with strangers", "chat by text", "written chat with strangers"],
  "anonymous-chat": ["anonymous chat", "anonymous chat online", "anonymous chat with strangers", "private stranger chat", "anonymous random chat", "chat anonymously online", "anonymous text conversation", "display name chat", "private online chat", "safe anonymous chat"],
  friendship: ["make friends online", "make new friends online", "meet friends online", "find friends online", "online friendship", "meet interesting people", "people to talk to online", "make friends with strangers", "find someone to talk to", "meet new people online"],
  "interest-based": ["interest based chat", "interest based stranger chat", "interest matching chat", "chat by interest", "chat with similar interests", "topic based chat", "meet people with similar interests", "shared interest chat", "interest matching online", "topic chat with strangers"],
  interests: ["gaming chat", "coding chat", "technology chat", "AI chat", "music chat", "movie chat", "travel chat", "study chat", "language learning chat", "creative writing chat"],
  language: ["language exchange", "language exchange chat", "practice English online", "English conversation online", "English chat with strangers", "language learning chat", "practice speaking English", "learn English by chatting", "text language exchange", "English writing practice"],
  guides: ["conversation starters", "conversation topics", "things to talk about", "how to talk to strangers", "how to start a conversation", "how to make friends online", "online conversation tips", "stranger chat tips", "random chat tips", "online chat safety"],
  questions: ["what is random chat", "what is stranger chat", "what is anonymous chat", "how does random chat work", "how to chat with strangers", "is random chat safe", "how interest based matching works", "random chat vs social media", "random chat vs dating apps", "text chat vs video chat"],
  comparisons: ["Omegle alternative", "Omegle alternatives", "Omegle replacement", "sites like Omegle", "Chatroulette alternative", "Chatroulette alternatives", "OmeTV alternative", "Emerald Chat alternative", "Monkey app alternative", "free Omegle alternative"],
  india: ["random chat India", "stranger chat India", "chat with strangers India", "random text chat India", "talk to strangers India", "make friends online India", "online friendship India", "Hindi chat", "Telugu chat", "language exchange India"],
  blog: ["online conversation guide", "stranger chat advice", "random chat safety", "make friends online guide", "interest based matching guide", "conversation starter ideas", "online friendship advice", "language exchange advice", "text chat guide", "online social connection"]
};

const pageKeywords = pages.flatMap((page) => [page.h1.toLowerCase(), page.angle, ...(page.keywords || [])]);
const unique = (items) => [...new Set(items.map((item) => item.trim()).filter(Boolean))];

export const keywordDatabase = Object.entries(clusterTerms).map(([cluster, terms]) => ({
  cluster,
  primary: terms[0],
  secondary: terms.slice(1, 5),
  longTail: terms.slice(5).flatMap((term) => [`${term} online`, `${term} for adults`, `${term} by text`, `free ${term}`]),
  questions: terms.slice(0, 5).map((term) => `what is ${term}?`),
  semantic: unique(pages.filter((page) => page.category === cluster).flatMap((page) => [page.h1.toLowerCase(), page.angle])),
  targetUrl: `/${pages.find((page) => page.category === cluster)?.slug || ""}/`
}));

export const totalKeywordCount = unique([...pageKeywords, ...Object.values(clusterTerms).flat()]).length;
export const keywordMap = [
  { keyword: "random chat", url: "/random-chat/" },
  { keyword: "chat with strangers", url: "/chat-with-strangers/" },
  { keyword: "talk to strangers online", url: "/talk-to-strangers-online/" },
  { keyword: "random text chat", url: "/random-text-chat/" },
  { keyword: "interest based chat", url: "/interest-based-chat/" },
  { keyword: "make friends online", url: "/make-friends-online/" },
  { keyword: "anonymous chat", url: "/anonymous-chat/" },
  { keyword: "language exchange", url: "/language-exchange/" },
  { keyword: "online chat safety", url: "/online-chat-safety/" },
  { keyword: "Omegle alternative", url: "/omegle-alternative/" },
  { keyword: "Chatroulette alternative", url: "/chatroulette-alternative/" },
  { keyword: "random chat India", url: "/random-chat-india/" },
  ...pages.map((page) => ({ keyword: page.h1.toLowerCase(), url: page.path }))
];

export { home };
export default keywordDatabase;
