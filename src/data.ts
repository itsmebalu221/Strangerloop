import type { AgeRange, Persona } from "./types";

/* ---------------- interests ---------------- */
export interface Interest {
  id: string;
  label: string;
  emoji: string;
  category: string;
}

export const INTEREST_CATEGORIES = ["Technology", "Gaming", "Entertainment", "Education", "Lifestyle", "Social"];

export const INTERESTS: Interest[] = [
  { id: "programming", label: "Programming", emoji: "💻", category: "Technology" },
  { id: "ai", label: "AI", emoji: "🤖", category: "Technology" },
  { id: "webdev", label: "Web Dev", emoji: "🌐", category: "Technology" },
  { id: "mobiledev", label: "Mobile Dev", emoji: "📱", category: "Technology" },
  { id: "cybersec", label: "Cybersecurity", emoji: "🛡️", category: "Technology" },
  { id: "startups", label: "Startups", emoji: "🚀", category: "Technology" },
  { id: "tech", label: "Technology", emoji: "⚙️", category: "Technology" },
  { id: "robotics", label: "Robotics", emoji: "🦾", category: "Technology" },
  { id: "pcgaming", label: "PC Gaming", emoji: "⌨️", category: "Gaming" },
  { id: "mobilegaming", label: "Mobile Gaming", emoji: "📲", category: "Gaming" },
  { id: "console", label: "Console", emoji: "🕹️", category: "Gaming" },
  { id: "esports", label: "Esports", emoji: "🏆", category: "Gaming" },
  { id: "gamedev", label: "Game Dev", emoji: "🧩", category: "Gaming" },
  { id: "movies", label: "Movies", emoji: "🎬", category: "Entertainment" },
  { id: "tv", label: "TV Shows", emoji: "📺", category: "Entertainment" },
  { id: "anime", label: "Anime", emoji: "🎌", category: "Entertainment" },
  { id: "music", label: "Music", emoji: "🎧", category: "Entertainment" },
  { id: "books", label: "Books", emoji: "📚", category: "Entertainment" },
  { id: "college", label: "College", emoji: "🎓", category: "Education" },
  { id: "school", label: "School", emoji: "✏️", category: "Education" },
  { id: "exams", label: "Competitive Exams", emoji: "📝", category: "Education" },
  { id: "science", label: "Science", emoji: "🔬", category: "Education" },
  { id: "math", label: "Mathematics", emoji: "🧮", category: "Education" },
  { id: "languages", label: "Languages", emoji: "🗣️", category: "Education" },
  { id: "learning", label: "Learning", emoji: "🧠", category: "Education" },
  { id: "fitness", label: "Fitness", emoji: "💪", category: "Lifestyle" },
  { id: "travel", label: "Travel", emoji: "✈️", category: "Lifestyle" },
  { id: "food", label: "Food", emoji: "🍜", category: "Lifestyle" },
  { id: "photography", label: "Photography", emoji: "📷", category: "Lifestyle" },
  { id: "fashion", label: "Fashion", emoji: "🧥", category: "Lifestyle" },
  { id: "friendship", label: "Friendship", emoji: "🤝", category: "Social" },
  { id: "casual", label: "Casual Chat", emoji: "💬", category: "Social" },
  { id: "networking", label: "Networking", emoji: "💼", category: "Social" },
  { id: "debate", label: "Debate", emoji: "⚖️", category: "Social" },
  { id: "relationships", label: "Relationships", emoji: "❤️", category: "Social" },
];

export const interestById = (id: string) => INTERESTS.find((i) => i.id === id);

/* ---------------- conversation types ---------------- */
export const CONVERSATION_TYPES = [
  { id: "casual", label: "Casual", emoji: "💬" },
  { id: "friendship", label: "Friendship", emoji: "🤝" },
  { id: "networking", label: "Networking", emoji: "💼" },
  { id: "coding", label: "Coding", emoji: "💻" },
  { id: "gaming", label: "Gaming", emoji: "🎮" },
  { id: "study", label: "Study", emoji: "📚" },
  { id: "debate", label: "Debate", emoji: "⚖️" },
  { id: "movies", label: "Movies", emoji: "🎬" },
  { id: "music", label: "Music", emoji: "🎧" },
  { id: "travel", label: "Travel", emoji: "✈️" },
  { id: "general", label: "General", emoji: "🌐" },
];

/* ---------------- languages & countries ---------------- */
export const LANGUAGES = [
  "English", "Hindi", "Telugu", "Tamil", "Kannada", "Malayalam", "Bengali", "Marathi",
  "Spanish", "Portuguese", "French", "German", "Japanese", "Korean", "Arabic", "Russian",
];

export const COUNTRIES: { name: string; flag: string }[] = [
  { name: "India", flag: "🇮🇳" }, { name: "United States", flag: "🇺🇸" }, { name: "United Kingdom", flag: "🇬🇧" },
  { name: "Germany", flag: "🇩🇪" }, { name: "Brazil", flag: "🇧🇷" }, { name: "Japan", flag: "🇯🇵" },
  { name: "Nigeria", flag: "🇳🇬" }, { name: "Canada", flag: "🇨🇦" }, { name: "Australia", flag: "🇦🇺" },
  { name: "France", flag: "🇫🇷" }, { name: "South Korea", flag: "🇰🇷" }, { name: "Philippines", flag: "🇵🇭" },
  { name: "Mexico", flag: "🇲🇽" }, { name: "Sweden", flag: "🇸🇪" }, { name: "Egypt", flag: "🇪🇬" },
  { name: "Singapore", flag: "🇸🇬" }, { name: "Poland", flag: "🇵🇱" }, { name: "Vietnam", flag: "🇻🇳" },
  { name: "Spain", flag: "🇪🇸" }, { name: "Italy", flag: "🇮🇹" },
];

export const countryFlag = (name: string) => COUNTRIES.find((c) => c.name === name)?.flag ?? "🌍";

export const AGE_RANGES: AgeRange[] = ["18–24", "25–34", "35–44", "45+"];

export const AVATAR_COLORS = ["#FF4B2E", "#2FBF8F", "#FFC24B", "#0F5D4E", "#5B8DEF", "#E2618E", "#7A5CE0", "#1FA9C9"];

/* ---------------- stranger pool ---------------- */
export const PERSONAS: Persona[] = [
  {
    id: "p01", name: "Aarav", gender: "male", age: "18–24", country: "India", flag: "🇮🇳",
    languages: ["English", "Hindi"], interests: ["programming", "ai", "startups", "pcgaming"],
    conv: ["coding", "networking"], bio: "CS undergrad shipping side projects at 2am.", willingness: 0.78, speed: 1,
    lines: [
      "okay so I've been deep in a FastAPI + React rabbit hole this week, send help",
      "I keep telling people my side project is 'almost done'. It is not almost done.",
      "hot take: half of AI is just good data cleaning and the other half is vibes",
      "I debug by explaining the code to my rubber duck. The duck is winning.",
      "just pushed to main on a Friday. living dangerously",
    ],
    questions: ["what are you building right now?", "tabs or spaces? this matters", "what language do you reach for first?"],
  },
  {
    id: "p02", name: "Meera", gender: "female", age: "25–34", country: "India", flag: "🇮🇳",
    languages: ["English", "Malayalam"], interests: ["ai", "science", "books", "music"],
    conv: ["study", "casual"], bio: "ML engineer. Reads papers and fiction in equal measure.", willingness: 0.82, speed: 0.9,
    lines: [
      "I read a paper today that made me feel both brilliant and hopeless. 10/10",
      "my model training and my chai are both steeping. multitasking queen",
      "honestly the best debugging tool is a walk and a glass of water",
      "I annotate my books like I'm defending a thesis. Margin notes everywhere",
      "there's something cozy about watching a loss curve go down",
    ],
    questions: ["what's the last book that actually changed your mind?", "are you a papers person or a tutorials person?", "what are you learning right now?"],
  },
  {
    id: "p03", name: "Rio", gender: "male", age: "18–24", country: "Brazil", flag: "🇧🇷",
    languages: ["Portuguese", "English", "Spanish"], interests: ["pcgaming", "esports", "anime", "music"],
    conv: ["gaming", "casual"], bio: "Valorant grinder. Will absolutely talk your ear off about anime openings.", willingness: 0.7, speed: 1.25,
    lines: [
      "bro I just clutched a 1v3 and my heart is STILL racing",
      "anime openings are undefeated. don't @ me",
      "I said 'one more game' four hours ago. classic",
      "my aim is cracked today, my sleep schedule is not",
      "ranked queue is a social experiment. a cruel one",
    ],
    questions: ["what are you playing lately?", "duo queue or solo queue suffering?", "best anime opening of all time — go"],
  },
  {
    id: "p04", name: "Hana", gender: "female", age: "18–24", country: "Japan", flag: "🇯🇵",
    languages: ["Japanese", "English"], interests: ["anime", "photography", "food", "music"],
    conv: ["casual", "movies"], bio: "Tokyo. Film cameras and ramen rankings.", willingness: 0.75, speed: 0.85,
    lines: [
      "I shot a whole roll of film today and half of it is just cats. no regrets",
      "my ramen tier list is a serious document. I will defend it",
      "rainy Tokyo with a film camera is unbeatable aesthetics",
      "I rewatched your name. again. cried. again",
      "convenience store food is lowkey the best food in Japan. fight me",
    ],
    questions: ["do you shoot film or digital?", "what's your comfort movie?", "ramen or sushi — choose wisely"],
  },
  {
    id: "p05", name: "Lena", gender: "female", age: "25–34", country: "Germany", flag: "🇩🇪",
    languages: ["German", "English"], interests: ["webdev", "fitness", "travel", "tech"],
    conv: ["coding", "networking"], bio: "Frontend engineer in Berlin. Bouldering on weekends.", willingness: 0.8, speed: 1.05,
    lines: [
      "I refactored a component today and deleted 200 lines. pure serotonin",
      "CSS is fine. I am fine. everything is fine.",
      "bouldering is just problem-solving but you fall off a wall when you're wrong",
      "Berlin techno at 3am then gym at 11am. balance",
      "I have 47 tabs open and every one of them is 'research'",
    ],
    questions: ["what's your stack?", "what do you do to switch off?", "next travel plan?"],
  },
  {
    id: "p06", name: "Kofi", gender: "male", age: "25–34", country: "Nigeria", flag: "🇳🇬",
    languages: ["English"], interests: ["startups", "networking", "tech", "music"],
    conv: ["networking", "debate"], bio: "Building a fintech thing in Lagos. Afrobeats on loop.", willingness: 0.85, speed: 1.1,
    lines: [
      "we pitched today. investors nodded. I choose to believe that means millions",
      "Lagos traffic is where my best startup ideas are born. unfortunately",
      "afrobeats while coding is a productivity hack, I don't make the rules",
      "every founder says 'we're pre-revenue' with a straight face. respect",
      "networking tip: follow up within 24h or the lead goes cold",
    ],
    questions: ["are you building anything?", "what industry do you think is sleeping right now?", "what's your hustle playlist?"],
  },
  {
    id: "p07", name: "Sofia", gender: "female", age: "18–24", country: "Mexico", flag: "🇲🇽",
    languages: ["Spanish", "English"], interests: ["movies", "tv", "food", "travel"],
    conv: ["movies", "casual"], bio: "Film student. Will rank your letterboxd.", willingness: 0.72, speed: 1,
    lines: [
      "I watched three films this week for 'research'. the research is going great",
      "my abuela's mole is better than any restaurant's. this is a fact",
      "letterboxd reviews are my true creative writing portfolio",
      "A24 horror and a warm pan dulce. that's the whole personality",
      "I plan trips around film locations. normal behavior",
    ],
    questions: ["top 3 films of your life — go", "what did you watch recently?", "sweet or savory breakfast?"],
  },
  {
    id: "p08", name: "Dev", gender: "male", age: "25–34", country: "India", flag: "🇮🇳",
    languages: ["English", "Hindi", "Telugu"], interests: ["programming", "webdev", "cricket" as string, "mobilegaming"].filter(i => i !== "cricket"),
    conv: ["coding", "gaming"], bio: "Fullstack dev. Cricket scores in one tab, prod logs in another.", willingness: 0.68, speed: 1.15,
    lines: [
      "prod is down and I'm talking to strangers. coping mechanisms vary",
      "my code works and I don't know why. this is the scariest feeling in tech",
      "I switched to vim btw. ask me anything. I will brag",
      "mobile games during compile time. it's called efficiency",
      "git blame is just therapy with extra steps",
    ],
    questions: ["frontend, backend, or fullstack?", "what are you playing on your phone?", "tabs or spaces? choose your fighter"],
  },
  {
    id: "p09", name: "Elif", gender: "female", age: "25–34", country: "Turkey" as string, flag: "🇹🇷",
    languages: ["English"], interests: ["fashion", "photography", "food", "travel"],
    conv: ["casual", "travel"], bio: "Istanbul. Thrift flips and street photography.", willingness: 0.74, speed: 0.95,
    lines: [
      "found a vintage jacket today for basically nothing. my best look ever",
      "Istanbul light at golden hour should be illegal it's so good",
      "thrift shopping is a sport and I am competitive",
      "turkish breakfast could end all wars. 20 plates minimum",
      "I style outfits for my friends' photoshoots. free of charge, full of opinions",
    ],
    questions: ["thrift or designer?", "best photo you've ever taken?", "where to next?"],
  },
  {
    id: "p10", name: "Marcus", gender: "male", age: "35–44", country: "United States", flag: "🇺🇸",
    languages: ["English", "Spanish"], interests: ["fitness", "debate", "books", "networking"],
    conv: ["debate", "networking"], bio: "Chicago. Stoicism, deadlifts, and strong opinions.", willingness: 0.6, speed: 0.8,
    lines: [
      "5am club. the barbell doesn't care about your excuses",
      "I read Marcus Aurelius every January. I'm a Marcus talking to you about Marcus",
      "most debates are lost in the first sentence. definitions matter",
      "networking is just making friends with a calendar invite",
      "protein shake mid-conversation. don't mind me",
    ],
    questions: ["what's a belief you changed recently?", "gym before or after work?", "what are you reading?"],
  },
  {
    id: "p11", name: "Priya", gender: "female", age: "18–24", country: "India", flag: "🇮🇳",
    languages: ["English", "Hindi", "Tamil"], interests: ["exams", "science", "learning", "music"],
    conv: ["study", "casual"], bio: "NEET aspirant. Flashcards are my love language.", willingness: 0.66, speed: 0.9,
    lines: [
      "studied 6 hours today. took a 2 hour break in the middle. progress is progress",
      "mnemonics got me through organic chemistry. I owe those silly sentences my life",
      "lo-fi + rain + flashcards = peak productivity aesthetic",
      "my dream college has a really good library. that's the whole dream",
      "physics is just the universe showing off",
    ],
    questions: ["what are you preparing for?", "best study hack you know?", "what's your focus playlist?"],
  },
  {
    id: "p12", name: "Tomas", gender: "male", age: "18–24", country: "Poland", flag: "🇵🇱",
    languages: ["Polish" as string, "English"], interests: ["gamedev", "programming", "pcgaming", "science"],
    conv: ["coding", "gaming"], bio: "Making a roguelike in Godot. It has a duck protagonist.", willingness: 0.77, speed: 1.2,
    lines: [
      "my game has a duck with a gun. the duck is the emotional core",
      "Godot is great until you need something specific. then you write the engine",
      "procedural generation: write 20 lines, get 10,000 bugs",
      "playtested my own game for 3 hours. the duck is fun. I am tired",
      "game dev is 10% code, 90% 'why is the collider doing that'",
    ],
    questions: ["what engine do you use?", "favorite roguelike?", "what weird game idea do you have?"],
  },
  {
    id: "p13", name: "Amara", gender: "female", age: "25–34", country: "United Kingdom", flag: "🇬🇧",
    languages: ["English"], interests: ["books", "tv", "writing" as string, "casual"].filter(i => i !== "writing"),
    conv: ["casual", "movies"], bio: "Manchester. Book club ringleader. Will recommend thrillers unprompted.", willingness: 0.8, speed: 0.9,
    lines: [
      "finished a book at 2am and just stared at the wall for twenty minutes. brilliant",
      "book club is 30% books, 70% wine and gossip. I respect the balance",
      "I judge people by their bookmark. receipts welcome",
      "British TV does slow-burn crime better than anyone. it's the weather",
      "started three books this week. abandoned two. a reader's journey",
    ],
    questions: ["what are you reading right now?", "fiction or non-fiction?", "recommend me something, go"],
  },
  {
    id: "p14", name: "Jin", gender: "male", age: "18–24", country: "South Korea", flag: "🇰🇷",
    languages: ["Korean", "English"], interests: ["esports", "console", "anime", "food"],
    conv: ["gaming", "casual"], bio: "Seoul. Challenger in one game, bronze in life.", willingness: 0.62, speed: 1.3,
    lines: [
      "watched scrims for 4 hours. my coach brain is exhausted and I don't even coach",
      "PC bang fried chicken hits different at 1am. scientific fact",
      "my team comp was cursed. I was the curse",
      "Korean servers don't forgive. you learn humility fast",
      "I main support because someone has to be the adult",
    ],
    questions: ["what's your main?", "PC or console?", "favorite late-night food?"],
  },
  {
    id: "p15", name: "Zara", gender: "female", age: "18–24", country: "Egypt", flag: "🇪🇬",
    languages: ["Arabic", "English"], interests: ["languages", "learning", "travel", "books"],
    conv: ["casual", "study"], bio: "Cairo. Learning Japanese because anime ruined me.", willingness: 0.83, speed: 0.95,
    lines: [
      "I'm on my 3rd language and my brain is a beautiful mess",
      "kanji looked scary until it looked like tiny drawings. now I love it",
      "language exchange apps are chaos and I thrive in chaos",
      "Cairo at night with a book and mint tea. that's the whole vibe",
      "I label everything in my room with sticky notes in Japanese. my cat is 'neko' now",
    ],
    questions: ["how many languages do you speak?", "what language would you learn next?", "dream country to visit?"],
  },
  {
    id: "p16", name: "Lucas", gender: "male", age: "25–34", country: "Australia", flag: "🇦🇺",
    languages: ["English"], interests: ["fitness", "travel", "photography", "casual"],
    conv: ["travel", "casual"], bio: "Sydney. Surf before work, spreadsheets after.", willingness: 0.7, speed: 1,
    lines: [
      "surfed at 6am. the ocean was glass. the office will not hear about this",
      "I plan trips like a project manager. color-coded itinerary. zero chill",
      "flat white in one hand, camera in the other. sydney starter pack",
      "hiked 14km on sunday. legs are filing a complaint",
      "best travel rule: one planned thing per day, the rest is wandering",
    ],
    questions: ["best trip you've ever done?", "morning person or night owl?", "beach or mountains?"],
  },
  {
    id: "p17", name: "Nia", gender: "female", age: "18–24", country: "Canada", flag: "🇨🇦",
    languages: ["English", "French"], interests: ["music", "movies", "college", "friendship"],
    conv: ["music", "casual"], bio: "Montreal. Concert tickets over rent (almost).", willingness: 0.86, speed: 1.05,
    lines: [
      "saw a tiny band in a 200-person venue. in five years I'll say I was there first",
      "my spotify wrapped is a cry for help and I'm proud of it",
      "montreal bagels > everything. this is not a debate",
      "concert with your best friend hits different than any festival",
      "I make playlists for hyper-specific moods like 'rainy bus home in October'",
    ],
    questions: ["last concert you went to?", "what's on repeat right now?", "movie you quote the most?"],
  },
  {
    id: "p18", name: "Arjun", gender: "male", age: "25–34", country: "India", flag: "🇮🇳",
    languages: ["English", "Hindi", "Kannada"], interests: ["cybersec", "programming", "tech", "debate"],
    conv: ["coding", "debate"], bio: "Bengaluru. Breaks things to fix things. CTF addict.", willingness: 0.64, speed: 1.1,
    lines: [
      "found a bug in a CTF that the organizers didn't know about. chaos. glory",
      "your password is probably your dog's name. change it",
      "security is 90% telling people to update their browsers",
      "I read breach reports like other people read thrillers",
      "social engineering is just persuasion with stakes",
    ],
    questions: ["do you use a password manager? be honest", "mac, linux, or windows?", "what tech topic do you debate about?"],
  },
  {
    id: "p19", name: "Yuki", gender: "nonbinary", age: "18–24", country: "Japan", flag: "🇯🇵",
    languages: ["Japanese", "English"], interests: ["anime", "gamedev", "music", "art" as string].filter(i => i !== "art"),
    conv: ["gaming", "casual"], bio: "Osaka. Chiptune composer. Yes, like actual video game music.", willingness: 0.79, speed: 1,
    lines: [
      "made a chiptune on the train today. the train sounds were basically free percussion",
      "game music is the most underrated genre. it carries entire worlds",
      "I name all my synths after foods. my favorite is Miso",
      "finished a track at 4am. the neighbors have questions",
      "pixel art + 8-bit audio = instant nostalgia, even for memories you never had",
    ],
    questions: ["what music do you make or love?", "favorite game soundtrack?", "do you draw or animate too?"],
  },
  {
    id: "p20", name: "Fatima", gender: "female", age: "25–34", country: "Singapore", flag: "🇸🇬",
    languages: ["English", "Malay" as string], interests: ["food", "travel", "startups", "networking"],
    conv: ["networking", "casual"], bio: "Singapore. Product manager by day, hawker centre critic by night.", willingness: 0.81, speed: 0.95,
    lines: [
      "ran a user interview today. users are chaos and I love them",
      "hawker centre ranking system: if the queue is long, trust the queue",
      "chicken rice is a personality test. there are no wrong answers, only weak ones",
      "my PM superpower is saying 'let's put that in the backlog' with a smile",
      "Singapore in December: rain, sales, and durian season if you're lucky",
    ],
    questions: ["what's your favorite local food?", "what do you do for work or study?", "best hawker stall you know?"],
  },
  {
    id: "p21", name: "Omar", gender: "male", age: "18–24", country: "Egypt", flag: "🇪🇬",
    languages: ["Arabic", "English"], interests: ["mobiledev", "programming", "mobilegaming", "tech"],
    conv: ["coding", "gaming"], bio: "Alexandria. Flutter dev with 14 unfinished apps.", willingness: 0.69, speed: 1.2,
    lines: [
      "my apps folder has 14 unfinished apps. they're in a better place now",
      "Flutter hot reload is the closest thing to magic in software",
      "mobile games during ramadan nights hit different. the whole city is online",
      "I once shipped an app at 3am and found the bug at 3:04am",
      "app store reviews are comedy gold. 'works perfectly, 1 star'",
    ],
    questions: ["android or iOS dev?", "what app idea are you sitting on?", "what do you play on your phone?"],
  },
  {
    id: "p22", name: "Ingrid", gender: "female", age: "35–44", country: "Sweden", flag: "🇸🇪",
    languages: ["English", "German"], interests: ["books", "fitness", "science", "learning"],
    conv: ["study", "casual"], bio: "Stockholm. Researcher. Cross-country skis to think.", willingness: 0.73, speed: 0.8,
    lines: [
      "my best research ideas arrive at kilometer 8 of a ski loop. always",
      "peer review is just group chat drama with citations",
      "fika is a productivity tool. the Swedes were right about everything",
      "I read one paper and one novel every night. balance achieved",
      "dark winter, bright mind. that's the stockholm deal",
    ],
    questions: ["what field are you curious about?", "how do you think best — walking, shower, or chaos?", "last thing you learned that surprised you?"],
  },
  {
    id: "p23", name: "Diego", gender: "male", age: "25–34", country: "Spain", flag: "🇪🇸",
    languages: ["Spanish", "English"], interests: ["food", "movies", "casual", "friendship"],
    conv: ["casual", "movies"], bio: "Sevilla. Tapas evangelist. Dinner starts at 10, deal with it.", willingness: 0.76, speed: 1,
    lines: [
      "my abuela's tortilla de patatas could fix the economy. don't ask how",
      "siesta is not laziness, it's a lifestyle innovation",
      "I rate cities by their tapas bars. it's a rigorous system",
      "watched an Almodóvar last night. colors, drama, perfection",
      "dinner at 10pm, football at midnight, sleep is a rumor",
    ],
    questions: ["what's the best meal you've ever had?", "spanish cinema — yes or yes?", "early dinner or late dinner?"],
  },
  {
    id: "p24", name: "Ananya", gender: "female", age: "18–24", country: "India", flag: "🇮🇳",
    languages: ["English", "Hindi", "Bengali"], interests: ["music", "anime", "college", "relationships"],
    conv: ["casual", "music"], bio: "Kolkata. College radio host. Playlist architect.", willingness: 0.84, speed: 1.05,
    lines: [
      "hosted my college radio show today. 12 listeners, 100% passion",
      "anime endings that destroy you are the best endings. I said what I said",
      "my playlist has 400 songs and I know the story of each one",
      "kolkata adda + chai + lo-fi. personality complete",
      "I give playlist prescriptions like a doctor. what's your symptom?",
    ],
    questions: ["what song describes your week?", "top tier anime — name one", "radio or podcasts?"],
  },
];

/* fix personas with off-catalog entries (kept catalog-pure at runtime) */
export const POOL: Persona[] = PERSONAS.map((p) => ({
  ...p,
  interests: p.interests.filter((i) => INTERESTS.some((x) => x.id === i)),
}));

/* ---------------- keyword replies ---------------- */
export const KEYWORD_REPLIES: { keys: string[]; replies: string[] }[] = [
  {
    keys: ["python", "javascript", "typescript", "java", "code", "coding", "program", "developer", "dev", "react", "bug"],
    replies: [
      "oh a dev conversation, excellent. I've been saying 'it works on my machine' with total confidence lately",
      "coding at night with one tab of docs and nine tabs of stack overflow — universal experience",
      "I respect anyone who reads the error message before panicking. I am not that person",
    ],
  },
  {
    keys: ["ai", "machine learning", "model", "gpt", "llm", "neural"],
    replies: [
      "AI is wild right now. half of it is magic, half is matrix multiplication, all of it is chaos",
      "I asked an AI to explain AI and now I know less. progress",
      "the real AGI is my browser with 60 tabs open, all 'research'",
    ],
  },
  {
    keys: ["game", "gaming", "valorant", "minecraft", "fortnite", "play", "ranked", "esports"],
    replies: [
      "gaming is 10% playing and 90% talking about playing. we are doing the 90% right now",
      "my rank and my confidence are on two very different trajectories",
      "'one more game' is the biggest lie I tell myself daily",
    ],
  },
  {
    keys: ["movie", "film", "watch", "series", "show", "netflix", "anime"],
    replies: [
      "I pick what to watch for 45 minutes and then rewatch something I've seen 12 times. classic",
      "anime openings are cinema. the skips are a crime",
      "recommend something weird. I trust your taste so far",
    ],
  },
  {
    keys: ["music", "song", "album", "playlist", "concert", "band"],
    replies: [
      "music taste is personality. I've decided this and I won't be taking questions",
      "I have a playlist for every emotion, including 'mildly inconvenienced'",
      "live music ruins normal music forever. worth it every time",
    ],
  },
  {
    keys: ["travel", "trip", "country", "visit", "vacation", "city"],
    replies: [
      "travel rule #1: eat where the locals queue. never been wrong",
      "I collect city sounds more than souvenirs. weird? maybe. true? yes",
      "the airport liminal space at 5am is a whole genre of feeling",
    ],
  },
  {
    keys: ["food", "eat", "cook", "restaurant", "recipe", "hungry"],
    replies: [
      "food is a love language and I am fluent",
      "I cook when I'm stressed, which means my kitchen smells great and my problems remain",
      "rating meals out of 10 is a hobby, a sport, a lifestyle",
    ],
  },
  {
    keys: ["study", "exam", "college", "school", "university", "learn", "class"],
    replies: [
      "studying is 20% reading and 80% making the perfect study environment",
      "the night before an exam is when humans achieve peak academic performance",
      "flashcards and delusion. the two pillars of exam prep",
    ],
  },
  {
    keys: ["startup", "business", "founder", "product", "investor"],
    replies: [
      "every startup is 'like Uber but for X' until it's 'we're pivoting'",
      "founder math: 14 hour days, 0 revenue, infinite belief. respect",
      "the best business ideas come from complaining about something for long enough",
    ],
  },
  {
    keys: ["gym", "workout", "fitness", "run", "running", "yoga"],
    replies: [
      "the gym playlist does 60% of the lifting. the other 40% is spite",
      "rest days are where the gains hide. science. probably",
      "I run to think. mostly I think about stopping",
    ],
  },
  {
    keys: ["book", "read", "novel", "author"],
    replies: [
      "my to-be-read pile is a monument to ambition",
      "I don't finish books I don't love. life's too short for chapter 30 boredom",
      "used bookstores smell like time travel. I'm serious",
    ],
  },
  {
    keys: ["hello", "hi ", "hey", "hii", "sup", "yo "],
    replies: [
      "heyy! good to meet someone with decent taste in interests 😄",
      "hey hey! this random match machine paired us well I think",
    ],
  },
  {
    keys: ["how are you", "how's it going", "hows it", "what's up", "whats up", "wassup"],
    replies: [
      "doing great! just vibing and meeting strangers with excellent interests. you?",
      "pretty good! today's been a solid day. how about you?",
    ],
  },
];

/* ---------------- conversation starters ---------------- */
export const STARTERS: { interest: string; starters: string[] }[] = [
  { interest: "programming", starters: ["What are you currently building?", "What language do you reach for first — and why?"] },
  { interest: "ai", starters: ["What's the coolest AI thing you've tried recently?", "Are you optimistic or scared about AI? Both is also valid"] },
  { interest: "pcgaming", starters: ["What are you playing lately?", "Co-op or competitive — what's your vibe?"] },
  { interest: "gamedev", starters: ["What kind of game would you make if time were free?"] },
  { interest: "movies", starters: ["What's the last film you couldn't stop talking about?"] },
  { interest: "anime", starters: ["What anime got you into anime?"] },
  { interest: "music", starters: ["What's on repeat for you this week?"] },
  { interest: "books", starters: ["What book would you hand to a stranger on a train?"] },
  { interest: "travel", starters: ["Where's your next trip — dream or booked?"] },
  { interest: "food", starters: ["Best meal you've had recently?"] },
  { interest: "fitness", starters: ["What's your workout — and what's your excuse?"] },
  { interest: "startups", starters: ["What problem do you wish someone would build for?"] },
  { interest: "exams", starters: ["What are you preparing for right now?"] },
  { interest: "science", starters: ["What science fact lives rent-free in your head?"] },
  { interest: "languages", starters: ["What language are you learning — or want to?"] },
  { interest: "photography", starters: ["Film, digital, or phone — and why?"] },
  { interest: "fashion", starters: ["What's your go-to fit right now?"] },
  { interest: "debate", starters: ["What hot take will you defend anywhere?"] },
];

export const GENERIC_STARTERS = [
  "How's your week treating you?",
  "What's something you're weirdly good at?",
  "What made you try this app today?",
];

/* ---------------- safety & moderation ---------------- */
export const REPORT_REASONS = [
  { id: "harassment", label: "Harassment or bullying" },
  { id: "spam", label: "Spam" },
  { id: "scam", label: "Scam attempt" },
  { id: "hate", label: "Hate or abuse" },
  { id: "threats", label: "Threats of violence" },
  { id: "explicit", label: "Sexual or explicit content" },
  { id: "impersonation", label: "Impersonation" },
  { id: "underage", label: "Underage safety concern" },
  { id: "other", label: "Other" },
];

export const GUIDELINES = [
  "Be a human, treat humans. Disagreement is fine; cruelty is not.",
  "No harassment, hate speech, threats, or abuse of any kind.",
  "No sexual or explicit content. This is a social discovery platform.",
  "Never share passwords, financial info, or exact addresses.",
  "No spam, ads, scams, or mass messaging. Bots get the boot.",
  "Everyone here is 18+. Report anyone who seems underage immediately.",
  "Respect the Next button — leaving a conversation is always okay.",
  "Report and block freely. It's anonymous and it helps everyone.",
];

export const SAFETY_TIPS = [
  "Keep conversations on Wavelength until you fully trust someone.",
  "Never send money, gift cards, or crypto — not even 'just to verify'.",
  "Don't share your exact address, workplace, or daily routine.",
  "Video elsewhere only when you're sure, and never under pressure.",
  "If something feels off, it is off. Hit Next, Block, or Report.",
  "Reports are anonymous. The other person never knows it was you.",
];

/* ---------------- misc flavor ---------------- */
export const MATCH_LEVELS = [
  { level: 1, name: "Perfect wave", desc: "Preferred gender, age, language, shared interests and conversation style." },
  { level: 2, name: "Strong match", desc: "Shared interests and language — age range relaxed slightly." },
  { level: 3, name: "Good overlap", desc: "At least one shared interest and compatible basics." },
  { level: 4, name: "Language link", desc: "A shared language keeps the conversation flowing." },
  { level: 5, name: "Best available", desc: "The highest-scoring person in the queue right now." },
];

export const SEARCH_STAGES = [
  "Scanning the queue…",
  "Matching interests…",
  "Checking languages…",
  "Scoring compatibility…",
  "Locking in your match…",
];
