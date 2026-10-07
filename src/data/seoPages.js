const SITE_URL = "https://strangerloop.online";

const core = [
  ["random-chat", "Random Chat Online With People Who Share Your Interests", "A broad entry point for people looking for a fresh text conversation without choosing a specific topic first.", "finding a comfortable first conversation"],
  ["random-stranger-chat", "Random Stranger Chat With A Safer Starting Point", "Meet a new conversation partner through a moderated text-first experience built around shared interests.", "starting with a stranger while keeping boundaries clear"],
  ["random-online-chat", "Random Online Chat For Real Conversations", "A text-first way to find an unexpected conversation online when you want more than a public comment thread.", "turning an online moment into a real exchange"],
  ["random-chat-online", "Random Chat Online For A Quick Conversation", "When you have a few minutes and want to talk, StrangerLoop helps you find a compatible person to chat with.", "a quick, low-pressure conversation"],
  ["free-random-chat", "Free Random Chat Without A Complicated Setup", "Start a text conversation for free with a simple profile and interests that help shape the match.", "keeping the first step simple"],
  ["random-chat-with-strangers", "Random Chat With Strangers Around Shared Interests", "A stranger does not have to mean a random topic. Use interests and conversation preferences to find a better opening.", "making an unfamiliar conversation feel easier"],
  ["random-chat-with-people", "Random Chat With People Who Want To Talk", "Find a person who is open to a respectful conversation instead of broadcasting into a crowded feed.", "looking for a willing conversation partner"],
  ["chat-with-random-people", "Chat With Random People Online", "Explore conversations with people outside your usual social circle through interest-aware matching.", "meeting perspectives outside your routine"],
  ["chat-with-strangers", "Chat With Strangers About Something Real", "A dedicated place to talk with new people by text, with an option to move on when a conversation is not a fit.", "choosing a useful opening topic"],
  ["chat-with-strangers-online", "Chat With Strangers Online By Text", "Find new people online and start with a topic, interest, or simple question instead of an empty message box.", "a text conversation that has a natural beginning"],
  ["talk-to-strangers", "Talk To Strangers Through Shared Interests", "Talking to someone new is easier when there is an honest topic to begin with. StrangerLoop uses interests as conversation signals.", "moving from hello to a real topic"],
  ["talk-to-strangers-online", "Talk To Strangers Online With Clear Boundaries", "Use a moderated text chat to meet someone new while deciding what you share and when to end the conversation.", "staying in control of a new online conversation"],
  ["talk-with-strangers-online", "Talk With Strangers Online Without The Pressure", "A relaxed text-first space for conversations that can be brief, curious, funny, or unexpectedly meaningful.", "a low-pressure first exchange"],
  ["online-stranger-chat", "Online Stranger Chat With Interest-Based Matching", "Discover a new conversation with someone you would not normally meet, guided by compatible interests.", "finding common ground online"],
  ["stranger-chat", "Stranger Chat For Curious Conversations", "A simple way to meet someone new through text and see where a respectful conversation goes.", "curiosity without oversharing"],
  ["stranger-chat-online", "Stranger Chat Online With A Human Pace", "Take a break from fast feeds and have one conversation at a time with someone new.", "slowing down the first interaction"],
  ["stranger-chat-room", "A Stranger Chat Room Built Around One Conversation", "Instead of a noisy public room, enter a focused text conversation with one matched person.", "focus instead of crowd noise"],
  ["meet-strangers-online", "Meet Strangers Online Through Conversation", "Meet people beyond your usual circles with a profile that gives a new chat something to build on.", "meeting people beyond familiar networks"],
  ["meet-new-people", "Meet New People Online Through Shared Topics", "A useful starting point for anyone who wants new conversations, new perspectives, and a little less small talk.", "turning shared topics into new connections"],
  ["meet-new-people-online", "Meet New People Online With Interest Signals", "Choose interests and conversation styles that help a new match feel more relevant from the first message.", "better first matches"],
  ["meet-someone-new", "Meet Someone New For A Conversation", "When your usual group is quiet, find a new person to talk with and let one good question begin the exchange.", "one good question"],
  ["people-to-chat-with", "Find People To Chat With Online", "A friendly text-first route to meeting people who are ready for a genuine conversation.", "finding someone available to talk"],
  ["someone-to-talk-to-online", "Find Someone To Talk To Online", "When you want company or a fresh perspective, start with a lightweight profile and a respectful text chat.", "company without making a public post"]
].map(([slug, h1, intro, angle]) => ({ slug, h1, intro, angle, category: "random-chat", parent: "/random-chat/" }));

const text = [
  ["text-chat", "Text Chat Online For New Conversations", "A text-first way to meet people when you prefer thoughtful messages over a camera or live call.", "why text works well for first conversations"],
  ["random-text-chat", "Random Text Chat With A New Person", "Start a spontaneous written conversation and use shared interests to avoid a completely cold opening.", "spontaneity with enough context to begin"],
  ["text-chat-with-strangers", "Text Chat With Strangers About Shared Interests", "Meet a new person through messages and choose a topic that gives both sides somewhere to start.", "using topics to make text feel natural"],
  ["text-chat-with-strangers-online", "Text Chat With Strangers Online", "A simple online text chat for people who want a new conversation without video or public posting.", "private-feeling one-to-one messaging"],
  ["free-text-chat", "Free Text Chat For Meeting New People", "Explore new conversations through a free text-first experience with no need to perform for a public audience.", "a clear and lightweight first step"],
  ["free-text-chat-with-strangers", "Free Text Chat With Strangers", "Find a free text conversation with someone new, then decide whether the exchange is worth continuing.", "keeping the commitment small"],
  ["online-text-chat", "Online Text Chat With A Better Opening", "Interest signals and conversation preferences give online text chats more direction than a blank inbox.", "avoiding the blank-page problem"],
  ["anonymous-text-chat", "Anonymous Text Chat With Honest Boundaries", "Use a display name rather than sharing your real identity, while remembering that online services still have safety and moderation records.", "privacy without pretending to be invisible"],
  ["anonymous-text-chat-with-strangers", "Anonymous Text Chat With Strangers", "A text-first way to meet someone new using a chosen display name and only the personal details you want to share.", "what a display name does and does not protect"],
  ["stranger-text-chat", "Stranger Text Chat For One Conversation At A Time", "Focus on a single written exchange instead of trying to keep up with a crowded group.", "depth over a noisy feed"],
  ["random-text-chat-online", "Random Text Chat Online By Topic", "Start a spontaneous text chat with a little direction from interests, language, and conversation style.", "topic signals that help a random match"],
  ["chat-with-strangers-by-text", "Chat With Strangers By Text", "Written conversation gives you time to think, ask a better question, and leave when the exchange no longer feels right.", "the control of written conversation"],
  ["text-chat-online", "Text Chat Online Without Video Pressure", "Meet people through messages when you want a conversation that does not require a camera, microphone, or public profile.", "comfortable communication choices"]
].map(([slug, h1, intro, angle]) => ({ slug, h1, intro, angle, category: "text-chat", parent: "/text-chat/" }));

const anonymous = [
  ["anonymous-chat", "Anonymous Chat With A Chosen Display Name", "Talk with new people without placing your real name in the conversation. StrangerLoop still uses accounts and moderation controls.", "the practical meaning of anonymous chat"],
  ["anonymous-chat-online", "Anonymous Chat Online With Safety Controls", "Meet someone new using a display name, while keeping in mind that a moderated service is not the same as an untraceable service.", "privacy and accountability together"],
  ["anonymous-chat-with-strangers", "Anonymous Chat With Strangers Online", "A focused text chat for people who want a new conversation without revealing personal identity details at the start.", "sharing less at the beginning"],
  ["anonymous-stranger-chat", "Anonymous Stranger Chat For Low-Pressure Conversation", "Start with interests and a display name, then decide how much personal context belongs in the conversation.", "a lower-pressure introduction"],
  ["private-stranger-chat", "Private Stranger Chat With Respectful Limits", "A one-to-one text conversation can feel more comfortable than a public room, especially when both people respect boundaries.", "privacy in the conversation itself"],
  ["anonymous-random-chat", "Anonymous Random Chat With Interest Signals", "Find a fresh text conversation without making your real identity the subject of the first message.", "interest before identity"],
  ["chat-anonymously-online", "How To Chat Anonymously Online Responsibly", "Use a display name, avoid sensitive details, and remember that moderation and service records still exist.", "responsible anonymous communication"],
  ["talk-anonymously-online", "Talk Anonymously Online Without Oversharing", "A new conversation can be personal without becoming personally identifying. Keep control of the details you reveal.", "being open without being identifiable"]
].map(([slug, h1, intro, angle]) => ({ slug, h1, intro, angle, category: "anonymous-chat", parent: "/anonymous-chat/" }));

const friendship = [
  ["make-friends-online", "Make Friends Online Through Better Conversations", "New friendships usually begin with repeated curiosity, shared interests, and enough respect for both people to feel comfortable.", "turning a first chat into a possible friendship"],
  ["make-new-friends-online", "Make New Friends Online Around Shared Interests", "Find a conversation partner beyond your existing circle and let a common interest do some of the opening work.", "starting friendship from common ground"],
  ["meet-friends-online", "Meet Friends Online One Conversation At A Time", "Online friendship does not need a large community first. It can begin with one thoughtful exchange.", "the first small step toward friendship"],
  ["find-friends-online", "Find Friends Online Who Like Similar Topics", "Interest-aware matching helps you spend less time explaining why a topic matters to you and more time discussing it.", "finding compatible conversation energy"],
  ["meet-interesting-people", "Meet Interesting People Online", "A good new conversation can introduce a perspective, hobby, or story that your usual feed would never surface.", "making room for unexpected perspectives"],
  ["meet-people-online", "Meet People Online Without A Public Performance", "Use a simple profile and a focused chat to meet people without turning the interaction into a popularity contest.", "conversation instead of audience-building"],
  ["online-friendship", "Online Friendship Starts With Shared Curiosity", "Build healthier online connections by asking open questions, listening carefully, and respecting a slower pace.", "the habits that make online friendship durable"],
  ["online-friends", "Find Online Friends For Real Conversations", "Connect around interests, language, games, ideas, or everyday life without needing to pretend every chat is permanent.", "friendship that can grow at its own pace"],
  ["make-friends-with-strangers", "Make Friends With Strangers Carefully", "A stranger can become a friend, but trust should grow gradually and never require private details or pressure.", "the difference between openness and trust"],
  ["meet-new-people-to-chat-with", "Meet New People To Chat With", "When you want a fresh conversation, shared topics can make meeting someone new feel less awkward.", "an easier route into new social circles"],
  ["people-to-talk-to-online", "Find People To Talk To Online", "Choose a text conversation when you want company, an idea exchange, or a new perspective without a formal group.", "finding conversation for the moment you are in"],
  ["find-someone-to-talk-to", "Find Someone To Talk To Respectfully", "Start with a small question, protect your boundaries, and use the next option whenever the match is not right.", "supportive conversation without false promises"]
].map(([slug, h1, intro, angle]) => ({ slug, h1, intro, angle, category: "friendship", parent: "/make-friends-online/" }));

const interestBased = [
  ["interest-based-chat", "Interest-Based Chat For More Relevant Matches", "Choose interests that genuinely describe you so a new chat has a useful subject from the beginning.", "how interests improve the first message"],
  ["interest-based-stranger-chat", "Interest-Based Stranger Chat", "Meet a stranger through overlapping interests instead of relying on a random greeting alone.", "keeping randomness while adding relevance"],
  ["interest-matching-chat", "Interest Matching Chat For Shared Topics", "Shared topics can create a more natural opening and make it easier to decide what to discuss next.", "matching topics, not personalities by guesswork"],
  ["chat-by-interest", "Chat By Interest With Someone New", "Pick a subject you enjoy and find a text conversation that can begin there.", "making a hobby a conversation bridge"],
  ["chat-with-similar-interests", "Chat With People Who Share Your Interests", "A common interest is not a guarantee of friendship, but it is a useful reason to say hello.", "using common ground without forcing a match"],
  ["chat-with-people-who-share-your-interests", "Chat With People Who Share Your Interests Online", "Build a profile around real interests, then use the match as an invitation to ask better questions.", "turning profile signals into dialogue"],
  ["meet-people-with-similar-interests", "Meet People With Similar Interests", "Discover people who enjoy the same themes, activities, or ideas, then see whether the conversation itself clicks.", "interest overlap versus genuine chemistry"],
  ["find-people-with-similar-interests", "Find People With Similar Interests To Talk With", "A focused interest list helps reduce the distance between a new match and your first meaningful topic.", "finding a starting point quickly"],
  ["topic-based-chat", "Topic-Based Chat For Focused Conversations", "Choose a topic when you want a conversation with direction rather than an endless stream of unrelated messages.", "a topic as a gentle conversation boundary"],
  ["topic-chat-with-strangers", "Topic Chat With Strangers", "Meet someone new around a subject you care about and let the conversation move naturally from there.", "a better first question"]
].map(([slug, h1, intro, angle]) => ({ slug, h1, intro, angle, category: "interest-based", parent: "/interest-based-chat/" }));

const interests = [
  ["gaming", "Chat With People Who Like Gaming", "Discuss games, design choices, co-op habits, stories, and the small details that make a game memorable.", "games are a natural way to compare experiences without needing the same favorite title"],
  ["video-games", "Meet People Who Enjoy Video Games", "Use video games as a starting point for conversation about genres, platforms, communities, and creative design.", "video games create many specific questions beyond favorite titles"],
  ["coding", "Chat With People Who Like Coding", "Talk about learning projects, debugging, tools, product ideas, and the realities of building software.", "coding conversations can be practical, curious, or career-focused"],
  ["programming", "Find Programming Conversations Online", "Compare languages, workflows, learning paths, and the small wins that keep a programming project moving.", "programming gives new people a concrete way to exchange experience"],
  ["technology", "Chat With People Interested In Technology", "Explore products, digital culture, privacy, hardware, and the ways technology changes everyday life.", "technology conversations work best when they move beyond product slogans"],
  ["artificial-intelligence", "Chat About Artificial Intelligence", "Discuss how AI works in practice, where it helps, what it changes, and which questions remain unresolved.", "AI creates room for both technical and human questions"],
  ["ai", "Meet People Interested In AI", "Share questions about machine learning, creative tools, automation, and responsible use without assuming everyone has the same background.", "AI chats can welcome both beginners and practitioners"],
  ["startups", "Chat With People Interested In Startups", "Talk about product ideas, early users, experiments, teams, and the uncertainty of building something new.", "startup conversations benefit from honest questions instead of polished pitches"],
  ["business", "Discuss Business With New People", "Explore work, markets, customer problems, leadership, and the decisions behind products and services.", "business is broad enough for practical and reflective conversations"],
  ["entrepreneurship", "Meet People Interested In Entrepreneurship", "Compare ideas, lessons, experiments, and the habits that make an independent project sustainable.", "entrepreneurship becomes useful when stories include what did not work"],
  ["music", "Chat With People Who Love Music", "Talk about songs, live shows, production, instruments, discovery, and the memories attached to music.", "music makes a natural bridge between taste and personal stories"],
  ["movies", "Discuss Movies With Someone New", "Compare films, scenes, genres, performances, and the questions a story leaves behind.", "movie conversations can begin with a scene rather than a ranking"],
  ["anime", "Chat With People Interested In Anime", "Discuss series, animation, character arcs, studios, and the themes that stay with you after an episode.", "anime gives a new chat plenty of specific entry points"],
  ["books", "Talk About Books With New People", "Exchange reading recommendations, favorite passages, genres, and the ideas that changed how you see a story.", "books make it easy to ask what a person noticed and why"],
  ["travel", "Chat With People Who Like Travel", "Share places, planning habits, food discoveries, cultural questions, and the difference between seeing a place and understanding it.", "travel conversations can be about curiosity rather than destination collecting"],
  ["photography", "Meet People Interested In Photography", "Discuss composition, phone photography, editing, subjects, and how to notice ordinary places differently.", "photography turns observation into an easy conversation prompt"],
  ["sports", "Chat With People Who Follow Sports", "Talk about games, players, tactics, rivalries, routines, and the emotions that make sport memorable.", "sports conversations can be specific without being exclusive"],
  ["football", "Find Football Conversations Online", "Discuss tactics, matches, clubs, players, and the stories that make football more than a scoreline.", "football offers a shared language for comparing viewpoints"],
  ["cricket", "Chat With People Who Like Cricket", "Talk formats, strategy, players, memorable sessions, and how different fans read the same match.", "cricket conversations can move from score to strategy"],
  ["study", "Chat With People Who Are Studying", "Share study methods, subjects, motivation, exam routines, and the small systems that make learning easier.", "study chats are useful when they exchange practical habits"],
  ["college", "Meet People Interested In College Life", "Discuss courses, campus routines, future plans, friendships, and the different paths people take through education.", "college conversations can connect experience with practical advice"],
  ["career", "Talk About Careers With New People", "Explore work choices, skills, uncertainty, interviews, and the questions people are asking about their next step.", "career conversations work best when advice stays grounded in experience"],
  ["language-learning", "Chat With People Interested In Language Learning", "Compare study methods, vocabulary habits, culture, and the patience required to become comfortable in a new language.", "language learning is a process people can share honestly"],
  ["english", "Practice English Through Conversation", "Use casual text conversations to write more often and notice which expressions feel natural to you.", "practice works best when it is consistent and low pressure"],
  ["creative-writing", "Chat With People Who Like Creative Writing", "Discuss prompts, characters, revision, voice, and the challenge of finishing a piece.", "writing conversations benefit from specific, generous feedback"]
].map(([slug, h1, intro, angle]) => ({ slug: `interests/${slug}`, h1, intro, angle, category: "interests", parent: "/interests/" }));

const languages = [
  ["language-exchange", "Language Exchange Through Text Conversation", "Practice communicating across languages by sharing everyday phrases, questions, and cultural context.", "language practice that feels like a conversation"],
  ["language-exchange-chat", "Language Exchange Chat Online", "Use text chat to compare expressions, ask respectful questions, and learn how another person uses language in real life.", "learning from real conversational context"],
  ["practice-english", "Practice English Online Through Text Chat", "Regular low-pressure writing can help you notice vocabulary, sentence patterns, and the questions you want to ask.", "building confidence through repetition"],
  ["practice-english-online", "Practice English Online With New Conversation Partners", "Write with people who are open to a thoughtful exchange, without promising native speakers or formal instruction.", "honest expectations for English practice"],
  ["english-conversation", "English Conversation Practice For Everyday Topics", "Discuss hobbies, routines, media, work, and ideas while using English in a natural text setting.", "everyday topics make practice sustainable"],
  ["english-chat-with-strangers", "English Chat With Strangers", "Meet someone new and use English as the shared language for a respectful, informal conversation.", "conversation as a practical learning habit"],
  ["chat-with-native-english-speakers", "Chat With English Speakers Online", "Look for English-language conversation without assuming that every match is a native speaker or a teacher.", "what the product can and cannot promise"],
  ["language-learning-chat", "Language Learning Chat For Consistent Practice", "Turn short conversations into a repeatable habit by choosing topics you can discuss comfortably.", "small practice sessions that add up"],
  ["practice-speaking-english", "Practice Speaking English Through Chat Planning", "Text chat can help you prepare vocabulary and ideas before practicing spoken English elsewhere.", "using text as preparation, not a substitute for speech"],
  ["learn-english-by-chatting", "Learn English By Chatting About Real Interests", "Use topics you already enjoy to make new words easier to remember and conversation easier to continue.", "interest makes language practice more memorable"]
].map(([slug, h1, intro, angle]) => ({ slug, h1, intro, angle, category: "language", parent: "/language-exchange/" }));

const guides = [
  ["conversation-starters", "Conversation Starters For Meeting Someone New", "A practical collection of openers that give a new chat somewhere to go beyond hello.", "asking questions that invite an actual answer"],
  ["conversation-topics", "Conversation Topics For A New Online Chat", "Choose topics that are specific enough to be interesting and open enough for both people to contribute.", "matching the topic to the energy of the chat"],
  ["things-to-talk-about", "Things To Talk About With Someone New", "Use interests, routines, media, goals, and small observations when a conversation needs a new direction.", "a menu of gentle topic changes"],
  ["how-to-talk-to-strangers", "How To Talk To Strangers Online", "Start with context, ask one clear question, listen for a detail, and respect the other person\'s pace.", "a repeatable structure for first chats"],
  ["how-to-start-a-conversation", "How To Start A Conversation Online", "The best opening is usually specific, easy to answer, and connected to something both people can see or share.", "replacing generic openers with useful curiosity"],
  ["how-to-make-friends-online", "How To Make Friends Online Carefully", "Friendship grows from consistency and mutual respect, not from rushing a stranger into personal trust.", "healthy progression from chat to friendship"],
  ["how-to-meet-new-people-online", "How To Meet New People Online", "Use focused communities and interest signals to meet people who have a reason to talk with you.", "choosing spaces that support conversation"],
  ["how-to-have-better-online-conversations", "How To Have Better Online Conversations", "Better chats come from balanced questions, attention, boundaries, and a willingness to let a topic change.", "skills that improve the whole exchange"],
  ["online-conversation-tips", "Online Conversation Tips That Feel Natural", "Small changes in timing, question choice, and follow-up can make an online chat more comfortable.", "practical improvements without a script"],
  ["stranger-chat-tips", "Stranger Chat Tips For A Respectful First Exchange", "Keep the opening light, avoid pressure, and leave cleanly when the conversation is not a match.", "respect as the foundation of a new chat"],
  ["random-chat-tips", "Random Chat Tips For Better Matches", "A useful profile, honest interests, and a willingness to skip can make random chat more rewarding.", "improving the inputs to a random match"],
  ["online-chat-safety", "Online Chat Safety For New Conversations", "Protect personal information, notice pressure, use reporting tools, and treat discomfort as enough reason to leave.", "a practical safety checklist"]
].map(([slug, h1, intro, angle]) => ({ slug, h1, intro, angle, category: "guides", parent: "/conversation-starters/" }));

const questions = [
  ["what-is-random-chat", "What Is Random Chat?", "Random chat is a way to begin a conversation with someone you did not choose from your existing social circle.", "defining the format without overselling it"],
  ["what-is-stranger-chat", "What Is Stranger Chat?", "Stranger chat describes a conversation between people who are not already acquainted, usually started through an online service.", "how stranger chat differs from a public feed"],
  ["what-is-anonymous-chat", "What Is Anonymous Chat?", "Anonymous chat usually means using limited identity details or a display name. It does not automatically mean a service stores no records.", "the difference between privacy and invisibility"],
  ["how-does-random-chat-work", "How Does Random Chat Work?", "A random chat service typically uses availability, preferences, and sometimes interests to pair people for a conversation.", "the basic matching lifecycle"],
  ["how-does-stranger-chat-work", "How Does Stranger Chat Work?", "You create enough context to start, enter a conversation, and decide whether to continue, skip, connect, or report.", "the choices that keep the user in control"],
  ["how-to-chat-with-strangers", "How To Chat With Strangers", "Open with a specific question, look for shared context, and allow the conversation to end without taking it personally.", "a calm approach to meeting someone new"],
  ["how-to-talk-to-strangers-online", "How To Talk To Strangers Online Safely", "Keep early conversation general, avoid sensitive details, and use moderation and block controls when needed.", "safety habits that do not kill curiosity"],
  ["how-to-start-a-chat-with-a-stranger", "How To Start A Chat With A Stranger", "An observation, shared interest, or easy question is usually stronger than a demand for personal information.", "three useful kinds of opener"],
  ["what-to-talk-about-with-a-stranger", "What To Talk About With A Stranger", "Start with hobbies, routines, media, ideas, and places rather than private identifiers.", "topics that are open but not invasive"],
  ["is-random-chat-safe", "Is Random Chat Safe?", "Safety depends on the service, its controls, and how people use them. StrangerLoop includes blocking, reporting, moderation, and an 18+ boundary.", "a realistic safety answer"],
  ["how-to-stay-safe-chatting-with-strangers", "How To Stay Safe Chatting With Strangers", "Protect your identity, leave pressure-filled chats, and report behavior that violates the rules.", "a safety routine for every new chat"],
  ["what-is-interest-based-chat", "What Is Interest-Based Chat?", "Interest-based chat uses shared topics as a signal for pairing or starting conversation.", "why relevance can improve a random format"],
  ["how-interest-based-matching-works", "How Does Interest-Based Matching Work?", "A match can consider overlapping interests alongside preferences, language, and availability, without promising perfect compatibility.", "signals and limits in matching"],
  ["random-chat-vs-social-media", "Random Chat Vs Social Media", "Random chat focuses on a new conversation, while social media usually revolves around feeds, profiles, and existing networks.", "choosing the format that fits your goal"],
  ["random-chat-vs-dating-apps", "Random Chat Vs Dating Apps", "Random chat is for conversation and discovery, not a promise of romance, dating intent, or relationship matching.", "separating conversation from dating"],
  ["text-chat-vs-video-chat", "Text Chat Vs Video Chat", "Text chat gives more time and less exposure; video can offer richer nonverbal context but asks for more immediate comfort.", "choosing a communication format"]
].map(([slug, h1, intro, angle]) => ({ slug, h1, intro, angle, category: "questions", parent: "/conversation-starters/" }));

const comparisons = [
  ["omegle-alternative", "Omegle Alternative For Text-First Conversations", "People searching for an Omegle alternative may want the spontaneity of meeting strangers with clearer topic and safety expectations.", "comparing the job to be done rather than making unsupported claims"],
  ["omegle-alternatives", "Omegle Alternatives: What To Compare", "Compare stranger-chat options by format, moderation, identity requirements, controls, and whether conversations are text or video.", "a checklist for evaluating alternatives"],
  ["omegle-replacement", "Omegle Replacement For Interest-Led Chat", "If you want a new conversation but prefer more context than a completely blank random pairing, interest-based text chat is one option.", "what a replacement should preserve and improve"],
  ["sites-like-omegle", "Sites Like Omegle: Text, Video, And Community Formats", "Services in this category can look similar while offering very different controls, audiences, and privacy expectations.", "understanding the differences between formats"],
  ["websites-like-omegle", "Websites Like Omegle For Meeting New People", "Look at how each service handles matching, moderation, skipping, reporting, and personal information before choosing one.", "questions to ask before signing up"],
  ["omegle-alternative-free", "Free Omegle Alternative Options To Explore", "A free service should still explain its boundaries, moderation model, and what information it needs from users.", "free access and responsible expectations"],
  ["chatroulette-alternative", "Chatroulette Alternative For Text Conversations", "Chatroulette is associated with random video conversations; StrangerLoop is designed around interest-aware text chat instead.", "text and video as different products"],
  ["chatroulette-alternatives", "Chatroulette Alternatives: How The Formats Differ", "Compare video-first roulette services with text-first options by exposure, pace, moderation, and conversation control.", "matching format to comfort level"],
  ["sites-like-chatroulette", "Sites Like Chatroulette And Text Chat Options", "Some people want live video energy; others prefer written conversation and the ability to think before replying.", "choosing between immediacy and control"],
  ["ometv-alternative", "OmeTV Alternative For Text-First Chat", "OmeTV is known for video chat; StrangerLoop offers a different route for people seeking interest-led written conversation.", "why text may be the better fit for some users"],
  ["ometv-alternatives", "OmeTV Alternatives To Compare Carefully", "Compare identity exposure, moderation, language tools, skip controls, and whether the service is built for video or text.", "a practical comparison framework"],
  ["emerald-chat-alternative", "Emerald Chat Alternative For Interest-Based Text Chat", "Emerald Chat and StrangerLoop can appeal to people seeking new conversations, but their features and communities should be evaluated directly.", "similar intent does not mean identical product"],
  ["emerald-chat-alternatives", "Emerald Chat Alternatives For Meeting New People", "Review the conversation format, matching signals, safety controls, and data practices before choosing an alternative.", "what to compare beyond the name"],
  ["monkey-app-alternative", "Monkey App Alternative For More Deliberate Chat", "Monkey is associated with fast social video interactions; StrangerLoop is a text-first alternative for a slower opening.", "deliberate conversation versus fast discovery"],
  ["monkey-app-alternatives", "Monkey App Alternatives: Text And Video Choices", "Different services suit different comfort levels. Compare audience, format, moderation, and how much identity you reveal.", "evaluating the experience, not just the feature list"]
].map(([slug, h1, intro, angle]) => ({ slug, h1, intro, angle, category: "comparisons", parent: "/omegle-alternative/" }));

const india = [
  ["random-chat-india", "Random Chat In India Through Shared Interests", "Meet people in India and beyond through text conversations shaped by interests, language, and respectful boundaries.", "local relevance without pretending every match is nearby"],
  ["stranger-chat-india", "Stranger Chat India For New Conversations", "A text-first way for adults in India to explore new conversations without publishing a public profile.", "a broad Indian audience with privacy in mind"],
  ["chat-with-strangers-india", "Chat With Strangers In India Online", "Use common interests and conversation preferences to make an online stranger chat more relevant.", "starting with topics rather than assumptions"],
  ["random-text-chat-india", "Random Text Chat India", "Find a written conversation with someone new while choosing how much personal information to share.", "text chat across a diverse audience"],
  ["talk-to-strangers-india", "Talk To Strangers Online In India", "A respectful text chat can connect people across cities, languages, and interests without requiring a shared offline network.", "conversation across distance"],
  ["make-friends-online-india", "Make Friends Online In India", "Build new connections through shared interests, patient conversation, and a gradual approach to trust.", "friendship that does not depend on location alone"],
  ["online-friendship-india", "Online Friendship In India Through Conversation", "Explore online friendship around study, work, entertainment, language, and everyday life.", "many reasons people seek connection"],
  ["interest-based-chat-india", "Interest-Based Chat For People In India", "Use interests as a bridge across different backgrounds and languages while keeping expectations realistic.", "shared interests across a large audience"],
  ["telugu-chat", "Telugu Chat And Interest-Based Conversation", "Use Telugu or another shared language when available, and make the conversation about interests rather than assumptions.", "language as an invitation, not a guarantee"],
  ["hindi-chat", "Hindi Chat With New People Online", "Start a respectful Hindi conversation around topics you enjoy, while allowing matches to vary by language and availability.", "honest language expectations"],
  ["english-chat-india", "English Chat In India", "Practice everyday English through written conversation with people who are open to chatting.", "writing practice across everyday subjects"],
  ["language-exchange-india", "Language Exchange In India Through Text Chat", "Compare language, culture, and everyday expressions through conversations that stay comfortable and voluntary.", "exchange without claiming formal teaching"]
].map(([slug, h1, intro, angle]) => ({ slug, h1, intro, angle, category: "india", parent: "/random-chat-india/" }));

const articleSeeds = [
  ["how-to-talk-to-strangers-online", "How To Talk To Strangers Online Without Making It Awkward", "A practical guide to opening, following, and ending a conversation with someone new online.", "conversation"],
  ["best-conversation-starters", "Best Conversation Starters For A New Online Chat", "Specific questions and observations that invite more than a one-word answer.", "conversation"],
  ["how-to-find-people-with-similar-interests", "How To Find People With Similar Interests Online", "Use honest interest signals and focused communities to make new conversations more relevant.", "interests"],
  ["random-chat-safety-guide", "The Practical Random Chat Safety Guide", "A clear checklist for identity privacy, boundaries, reporting, and ending an uncomfortable exchange.", "safety"],
  ["how-interest-based-chat-works", "How Interest-Based Chat Works In Practice", "What shared interests can improve, what they cannot predict, and how to turn a match into dialogue.", "interests"],
  ["how-to-start-a-conversation-online", "How To Start A Conversation Online", "A simple framework for moving from a greeting to a topic both people can enjoy.", "conversation"],
  ["things-to-talk-about-with-new-people", "Things To Talk About With New People", "A set of topic paths for hobbies, routines, media, ideas, and low-pressure personal stories.", "conversation"],
  ["random-chat-vs-social-media", "Random Chat Vs Social Media: Choosing The Right Format", "The difference between a focused exchange and a feed built around existing networks.", "comparison"],
  ["random-chat-vs-dating-apps", "Random Chat Vs Dating Apps: Different Intentions", "Why conversation discovery is not the same as dating or relationship matching.", "comparison"],
  ["text-chat-vs-video-chat", "Text Chat Vs Video Chat: Comfort, Pace, And Context", "How the communication format changes pressure, privacy, and the way people connect.", "comparison"],
  ["how-to-practice-english-online", "How To Practice English Online Consistently", "Build a practical routine around writing, questions, feedback, and topics you already enjoy.", "language"],
  ["how-to-meet-people-from-other-countries", "How To Meet People From Other Countries Online", "Approach cultural exchange with curiosity, humility, and no expectation that one person represents a whole country.", "language"],
  ["how-to-have-better-online-conversations", "How To Have Better Online Conversations", "Use attention, follow-up questions, and boundaries to make digital conversations feel more human.", "conversation"],
  ["what-to-do-when-a-chat-goes-quiet", "What To Do When An Online Chat Goes Quiet", "Ways to change topic, give space, or end gracefully when a conversation loses momentum.", "conversation"],
  ["how-to-leave-a-conversation-politely", "How To Leave An Online Conversation Politely", "Ending a chat is a normal boundary, not a failure. Here are simple ways to do it clearly.", "safety"],
  ["how-to-spot-pressure-online", "How To Spot Pressure In An Online Chat", "Recognize demands for personal details, urgency, guilt, and attempts to move you somewhere less safe.", "safety"],
  ["how-to-protect-your-privacy-online", "How To Protect Your Privacy In New Chats", "Practical steps for keeping identity, location, accounts, and sensitive details separate from a first conversation.", "safety"],
  ["conversation-topics-for-gamers", "Conversation Topics For Gamers", "Questions about play styles, stories, design, communities, and what makes a game memorable.", "interests"],
  ["conversation-topics-for-coders", "Conversation Topics For Coders", "Discuss learning paths, tools, debugging, product ideas, and what people are building.", "interests"],
  ["conversation-topics-for-music-lovers", "Conversation Topics For Music Lovers", "Go beyond favorite songs with questions about memory, discovery, performance, and production.", "interests"],
  ["conversation-topics-for-travelers", "Conversation Topics For Travelers", "Talk about curiosity, food, planning, cultural learning, and the places people want to understand.", "interests"],
  ["online-friendship-boundaries", "Healthy Boundaries In Online Friendship", "Trust can grow without giving away control of your personal information or time.", "friendship"],
  ["how-to-build-online-friendships", "How To Build Online Friendships Slowly", "Consistency, reciprocity, and respect matter more than rushing toward a label.", "friendship"],
  ["why-shared-interests-help-conversation", "Why Shared Interests Help Conversations", "Common topics reduce opening friction, but listening still matters more than a matching label.", "interests"],
  ["how-to-ask-better-questions", "How To Ask Better Questions Online", "Use open, specific, and easy-to-answer questions that show you noticed what the other person said.", "conversation"],
  ["how-to-listen-in-text-chat", "How To Listen In Text Chat", "Follow details, reflect what you heard, and avoid turning every answer into a story about yourself.", "conversation"],
  ["how-to-avoid-small-talk", "How To Move Beyond Small Talk Online", "Keep the comfort of light topics while gradually asking about ideas, preferences, and experiences.", "conversation"],
  ["is-online-friendship-real", "Is Online Friendship Real?", "Online friendship can be meaningful when it is mutual, consistent, and grounded in honest expectations.", "friendship"],
  ["how-to-use-a-display-name", "How To Use A Display Name Safely", "A display name can protect privacy, but it should not create a false sense that no service records exist.", "safety"],
  ["what-to-share-in-a-first-chat", "What To Share In A First Online Chat", "Share interests and general context before sharing identifiers, contact details, or precise location.", "safety"],
  ["how-to-report-online-harassment", "How To Respond To Online Harassment", "Leave the exchange, block the account, preserve relevant context, and report through the service controls.", "safety"],
  ["how-to-choose-a-chat-platform", "How To Choose A Chat Platform", "Compare format, moderation, privacy, age boundaries, and the kind of connection you actually want.", "comparison"],
  ["random-chat-for-introverts", "Can Random Chat Work For Introverts?", "Text, pacing, and the ability to skip can make a first conversation more manageable for some people.", "use-case"],
  ["online-chat-for-language-learners", "Online Chat For Language Learners", "Use everyday topics and repeated practice while keeping expectations realistic about fluency and correction.", "language"],
  ["how-to-talk-about-hobbies", "How To Talk About Hobbies Online", "A hobby offers details, stories, and follow-up questions that make a conversation easier to continue.", "interests"],
  ["how-to-make-a-chat-more-interesting", "How To Make An Online Chat More Interesting", "Add specificity, tell a small story, and invite the other person to compare experiences.", "conversation"],
  ["what-makes-a-good-online-conversation", "What Makes A Good Online Conversation?", "A good chat does not require perfect chemistry; it needs attention, reciprocity, curiosity, and boundaries.", "conversation"],
  ["online-chat-etiquette", "Online Chat Etiquette For New Conversations", "Respect response time, topic boundaries, identity privacy, and the other person\'s right to leave.", "safety"],
  ["how-to-meet-people-after-moving", "How To Meet People Online After Moving", "Use interest-led conversation to begin rebuilding a social circle after a move or life change.", "use-case"],
  ["how-to-find-study-buddies-online", "How To Find Study Buddies Online", "Talk about subjects, routines, accountability, and the study habits that actually work for you.", "use-case"],
  ["how-to-talk-about-career-goals", "How To Talk About Career Goals Online", "Exchange practical perspectives without turning a new conversation into an unsolicited advice session.", "use-case"],
  ["how-to-discuss-difficult-topics", "How To Discuss Difficult Topics Respectfully", "Slow down, ask what the other person means, and leave room for different experiences and boundaries.", "conversation"],
  ["how-to-find-common-ground", "How To Find Common Ground With Someone New", "Look for shared curiosity, not just identical opinions or backgrounds.", "conversation"],
  ["how-to-recover-from-an-awkward-opening", "How To Recover From An Awkward Opening", "Acknowledge it lightly, ask a better question, and give the other person an easy way to respond.", "conversation"],
  ["how-to-chat-with-someone-from-another-culture", "How To Chat Across Cultural Differences", "Ask rather than assume, avoid treating one person as a spokesperson, and stay curious about context.", "language"],
  ["how-to-use-interests-in-your-profile", "How To Use Interests In Your Profile", "Specific, honest interests give a new match more useful material than a long generic description.", "interests"],
  ["how-to-know-when-to-skip-a-chat", "How To Know When To Skip A Chat", "You do not need a dramatic reason to leave a conversation that feels uncomfortable, disrespectful, or simply unhelpful.", "safety"],
  ["online-chat-and-personal-information", "Online Chat And Personal Information", "Understand which details can identify you and why a first conversation should not require them.", "safety"],
  ["how-to-start-a-chat-about-movies", "How To Start A Chat About Movies", "Use a scene, a question, or a surprising opinion instead of asking only for a favorite film.", "interests"],
  ["how-to-start-a-chat-about-books", "How To Start A Chat About Books", "Ask what stayed with someone, what they disagreed with, or what they would recommend next.", "interests"],
  ["how-to-start-a-chat-about-travel", "How To Start A Chat About Travel", "Ask about what someone learned, noticed, or would do differently rather than collecting destinations.", "interests"],
  ["how-to-start-a-chat-about-ai", "How To Start A Chat About AI", "Use a concrete tool, question, or experience to make a broad AI discussion specific.", "interests"]
].map(([slug, h1, intro, angle]) => ({ slug: `blog/${slug}`, h1, intro, angle, category: "blog", parent: "/blog/" }));

const hubs = [
  { slug: "interests", h1: "Explore Interest-Based Chat Topics", intro: "Browse conversation topics from gaming and coding to music, travel, study, and language learning.", angle: "choosing a topic before choosing a conversation", category: "interests", parent: null },
  { slug: "blog", h1: "StrangerLoop Conversation And Friendship Guides", intro: "Practical guides for starting conversations, meeting people online, protecting your privacy, and finding common ground.", angle: "learning the habits behind better online conversations", category: "blog", parent: null }
];

function makeSections(seed) {
  const topic = seed.h1.replace(/^(How To |What Is |How Does |Can |Is )/i, "").replace(/\?$/, "");
  return [
    { heading: `What people are looking for in ${topic.toLowerCase()}`, body: `${seed.intro} The useful part is not the label alone; it is the kind of interaction the label promises. A good starting point makes the format, pace, and expectations clear before anyone shares more than they intend to.` },
    { heading: `A practical way to begin`, body: `Start with the detail that gives this page its purpose: ${seed.angle}. Keep the first message specific and easy to answer. Then follow the other person's lead instead of trying to force a perfect conversation immediately.` },
    { heading: "Keep the conversation comfortable", body: "Respect response time, avoid requesting sensitive information, and remember that either person can pause, skip, block, or end a chat. Shared interests help with the opening, but mutual respect is what makes the exchange worthwhile." },
    { heading: "How StrangerLoop fits", body: "StrangerLoop is an 18+ text-first service for meeting new people through interests and conversation preferences. It is not a dating guarantee, a native-speaker guarantee, or a promise of complete anonymity. Use the controls available to decide what happens next." }
  ];
}

function makeFaq(seed) {
  return [
    { q: `What is ${seed.h1.toLowerCase().replace(/^.*?for /i, "").replace(/\?$/, "")} useful for?`, a: seed.intro },
    { q: "Can I end a conversation if it is not a fit?", a: "Yes. A conversation does not need a serious incident to end. Use the available next, leave, block, or report controls when appropriate." },
    { q: "Does StrangerLoop guarantee a particular type of person?", a: "No. Matching signals can make a conversation more relevant, but people are not predictable from a few profile fields and availability varies." },
    { q: "What should I avoid sharing at first?", a: "Avoid passwords, financial information, precise location, private contact details, and anything you would not want connected to a new display name." }
  ];
}

function makePage(seed) {
  const path = `/${seed.slug.replace(/^\/+|\/+$/g, "")}/`;
  const title = `${seed.h1}${seed.category === "blog" ? " - Guide" : ""} | StrangerLoop`;
  return {
    ...seed,
    path,
    title,
    metaDescription: seed.intro,
    intro: seed.intro,
    sections: makeSections(seed),
    faq: makeFaq(seed),
    keywords: [seed.h1.toLowerCase(), seed.angle, "StrangerLoop"],
    canonical: `${SITE_URL}${path}`,
    schemaType: seed.category === "blog" ? "Article" : "WebPage",
    indexable: true
  };
}

const pageSeeds = [...core, ...text, ...anonymous, ...friendship, ...interestBased, ...interests, ...languages, ...guides, ...questions, ...comparisons, ...india, ...articleSeeds, ...hubs];
const pages = Array.from(new Map(pageSeeds.map((seed) => [seed.slug, makePage(seed)])).values());

const home = {
  slug: "",
  path: "/",
  title: "Random Chat With Strangers Online | StrangerLoop",
  h1: "Random chats. Real connections.",
  metaDescription: "Meet new people through interest-based text chat. StrangerLoop helps adults start respectful conversations with strangers online.",
  intro: "StrangerLoop is a text-first way to meet people who share your interests. Start a conversation, choose what to share, and leave whenever the chat is not right for you.",
  category: "home",
  parent: null,
  angle: "a clear path from a random hello to a better conversation",
  sections: [
    { heading: "Meet someone outside your usual circle", body: "A new conversation can be short, funny, practical, or unexpectedly thoughtful. StrangerLoop uses interests and conversation preferences to give the first message a little more context." },
    { heading: "Text first, with room to think", body: "Written conversation lets you choose your pace. Ask about a shared interest, answer when you are ready, and keep personal details private while trust develops." },
    { heading: "Controls for a respectful experience", body: "StrangerLoop is for adults 18 and over. Use next, block, and report controls when a conversation is not a fit, and treat the other person\'s boundaries as seriously as your own." }
  ],
  faq: [
    { q: "What is StrangerLoop?", a: "StrangerLoop is an interest-based, text-first service for adults who want to meet new people and start respectful conversations online." },
    { q: "Is StrangerLoop a dating app?", a: "No. StrangerLoop is designed for conversation and discovery, not romantic matching or a promise of dating outcomes." },
    { q: "Can I chat anonymously?", a: "You can use a display name and avoid sharing identifying details, but the service still has accounts, moderation, and operational records. It is not a promise of complete anonymity." },
    { q: "Is StrangerLoop free?", a: "The current experience is available as a free text-chat experience. Availability and features can change as the product develops." }
  ],
  keywords: ["random chat", "chat with strangers", "interest based chat", "online friendship"],
  canonical: `${SITE_URL}/`,
  schemaType: "WebSite",
  indexable: true
};

export { SITE_URL, home, pages };
export default pages;
