import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Bot,
  Database,
  GitBranch,
  BarChart3,
  Rocket,
  ArrowRight,
  Shield,
  Sparkles,
  Check,
  Cpu,
  ChevronDown,
  ChevronUp,
  Play,
  FileText,
  Send,
  HelpCircle,
  Code2,
  MessageSquare,
  X,
  User
} from "lucide-react";

// --- Mock documents and simulation data for the interactive RAG simulator ---
const sampleDocs = {
  refund_policy: {
    title: "Customer_Refund_Policy.pdf",
    size: "184 KB",
    chunks: [
      { id: 1, text: "Refund requests are processed within 5-7 business days from receipt. All standard physical returns are subject to a 10% restocking fee unless defective.", keyword: "restocking fee" },
      { id: 2, text: "Digital software licenses and subscription plans are eligible for a 100% refund within the first 14 days of purchase, provided no API keys were generated.", keyword: "digital" },
      { id: 3, text: "Returns must include all original packaging and accessories. Shipping fees are non-refundable except in cases where the return is due to our shipping error.", keyword: "shipping" }
    ],
    questions: [
      "What is the restocking fee?",
      "Can I get a refund on digital subscriptions?",
      "Are shipping fees refundable?"
    ],
    answers: {
      "What is the restocking fee?": "According to the Customer Refund Policy, physical returns are subject to a 10% restocking fee unless the item is defective. Refunds are processed within 5-7 business days.",
      "Can I get a refund on digital subscriptions?": "Yes, digital software licenses and subscription plans are eligible for a 100% refund within the first 14 days of purchase, as long as no API keys have been generated.",
      "Are shipping fees refundable?": "Generally, shipping fees are non-refundable. However, exceptions are made if the return is due directly to a shipping error on our part.",
      "default": "Based on the Refund Policy PDF: Returns must include all original packaging. Physical returns incur a 10% restocking fee, while digital subscriptions have a 14-day refund window."
    }
  },
  api_docs: {
    title: "Developer_API_v4_Docs.pdf",
    size: "412 KB",
    chunks: [
      { id: 1, text: "To authenticate requests, include the Authorization header with bearer token: Authorization: Bearer <API_KEY>. Keep keys secure and never expose them in client-side code.", keyword: "authenticate" },
      { id: 2, text: "The API rate limits are 60 requests per minute per key on the Free plan, and up to 5,000 requests per minute on the Enterprise plan.", keyword: "rate" },
      { id: 3, text: "Webhook payloads are sent via POST as JSON with a signature header 'X-Contexta-Signature' to verify origin integrity using your signing secret.", keyword: "webhook" }
    ],
    questions: [
      "How do I authenticate API calls?",
      "What are the API rate limits?",
      "How do Webhooks work?"
    ],
    answers: {
      "How do I authenticate API calls?": "To authenticate your API requests, you must pass the API key in the Authorization header as a Bearer token: `Authorization: Bearer <API_KEY>`. Never expose keys in client code.",
      "What are the API rate limits?": "API rate limits depend on your tier. The Free plan allows up to 60 requests/minute, while the Enterprise plan scales up to 5,000 requests/minute.",
      "How do Webhooks work?": "Webhooks send JSON payloads via HTTP POST. Security is maintained using the 'X-Contexta-Signature' header, which verifies payload origin integrity via your signing secret.",
      "default": "Based on Developer API Docs: Requests are authenticated via Bearer tokens. Rate limits range from 60 to 5,000 requests/minute. Webhooks send POST events secured by signatures."
    }
  },
  user_manual: {
    title: "User_Onboarding_Manual.pdf",
    size: "245 KB",
    chunks: [
      { id: 1, text: "Go to Account Settings > Security and click 'Reset Password'. A verification link will be sent to your registered email address, valid for 24 hours.", keyword: "password" },
      { id: 2, text: "Team collaboration: Invite administrators and billing managers via Team tab. Role permissions define access to API keys and raw customer logs.", keyword: "team" },
      { id: 3, text: "Integrate the support widget by copying the CDN script tag. Paste it at the bottom of the body tag on all pages where support is required.", keyword: "widget" }
    ],
    questions: [
      "How do I reset my password?",
      "How do I add team members?",
      "How is the support widget integrated?"
    ],
    answers: {
      "How do I reset my password?": "You can reset your password by going to Account Settings > Security, then clicking 'Reset Password'. A recovery link will be sent to your email and is valid for 24 hours.",
      "How do I add team members?": "Navigate to the Team tab to invite collaborators. You can assign roles (like Administrator or Billing Manager) to control key access and audit logs.",
      "How is the support widget integrated?": "Integration is simple: copy the CDN script tag from your settings and paste it at the bottom of the HTML `<body>` tag on your website pages.",
      "default": "Based on User Onboarding Manual: Password resets are requested via Security Settings. Widgets are deployed by placing a CDN script tag in the HTML body. Team members can be invited via the Team tab."
    }
  }
};

let landingChatMessageCounter = 0;
const nextLandingChatMessageId = (suffix = "") => {
  landingChatMessageCounter += 1;
  return `landing-chat-${landingChatMessageCounter}${suffix}`;
};

const LandingPage = () => {
  // RAG Simulator States
  const [selectedDocKey, setSelectedDocKey] = useState("refund_policy");
  const [currentQuery, setCurrentQuery] = useState("What is the restocking fee?");
  const [simStep, setSimStep] = useState(0); // 0: Idle, 1: Embedding, 2: Retrieving, 3: Generating, 4: Done
  const [displayedAnswer, setDisplayedAnswer] = useState("");
  
  // Pricing States
  const [isAnnual, setIsAnnual] = useState(true);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Chatbot Widget Demo States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      id: "welcome",
      sender: "bot",
      text: "Hello! I'm your RAG-powered AI assistant. Ask me anything about our Refund Policy, Developer API, or Onboarding User Manual!"
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatTyping, setIsChatTyping] = useState(false);

  const docData = sampleDocs[selectedDocKey];
  const simIntervalRef = useRef(null);
  const chatIntervalRef = useRef(null);
  const chatEndRef = useRef(null);

  // Auto-scroll chatbot to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isChatTyping]);

  // Clean up intervals on unmount
  useEffect(() => {
    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
      if (chatIntervalRef.current) clearInterval(chatIntervalRef.current);
    };
  }, []);

  const handleDocumentSelect = (key) => {
    if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    setSelectedDocKey(key);
    setCurrentQuery(sampleDocs[key].questions[0]);
    setSimStep(0);
    setDisplayedAnswer("");
  };

  // Run the RAG pipeline simulator
  const handleSimulate = () => {
    if (simStep > 0 && simStep < 4) return; // Wait until current simulation finishes
    if (simIntervalRef.current) clearInterval(simIntervalRef.current);

    setSimStep(1);
    setDisplayedAnswer("");

    // Step 1: Embedding Query
    setTimeout(() => {
      setSimStep(2);
      
      // Step 2: Retrieving Chunks
      setTimeout(() => {
        setSimStep(3);
        
        // Step 3: Generating Response
        setTimeout(() => {
          setSimStep(4);
          // Fetch mock answer
          const answer = docData.answers[currentQuery] || docData.answers["default"];
          
          // Typewriter effect
          let i = 0;
          simIntervalRef.current = setInterval(() => {
            setDisplayedAnswer((prev) => prev + answer.charAt(i));
            i++;
            if (i >= answer.length) {
              if (simIntervalRef.current) clearInterval(simIntervalRef.current);
            }
          }, 15);
        }, 1200);
      }, 1200);
    }, 1000);
  };

  // Run RAG query search inside floating chatbot
  const handleChatSend = (textToSend) => {
    const msg = textToSend || chatInput;
    if (!msg.trim()) return;

    // Add user message
    const newUserMessage = { id: nextLandingChatMessageId(), sender: "user", text: msg };
    setChatMessages((prev) => [...prev, newUserMessage]);
    if (!textToSend) setChatInput("");
    setIsChatTyping(true);

    if (chatIntervalRef.current) clearInterval(chatIntervalRef.current);

    // Dynamic search mapping from database chunks
    let matchedAnswer = "";
    const lowerMsg = msg.toLowerCase().trim();

    // Check greetings first
    if (/^(hi|hello|hey|yo|greetings|hola|good morning|good afternoon|good evening)\b/i.test(lowerMsg)) {
      matchedAnswer = "Hello! I am Contexta-AI Support. I can answer questions about our Customer Refund Policy, Developer API, or Onboarding User Manual. Feel free to ask a question!";
    } else if (/\b(how are you|how's it going|how are things)\b/i.test(lowerMsg)) {
      matchedAnswer = "I'm doing great, thank you for asking! Ready to help you explore our product documents. What can I help you find today?";
    } else if (/\b(who are you|what is this|what do you do)\b/i.test(lowerMsg)) {
      matchedAnswer = "I am a RAG (Retrieval-Augmented Generation) Support Bot. I demonstrate how Contexta-AI can ingest PDFs, index them, and instantly answer user queries with precise sources.";
    }

    if (!matchedAnswer) {
      // Find the document and question that has the highest number of keyword matches
      let bestMatch = null;
      let highestScore = 0;

      for (const docKey in sampleDocs) {
        const doc = sampleDocs[docKey];
        for (const question in doc.answers) {
          if (question === "default") continue;
          
          // Compute a simple matching score based on word matches
          const questionWords = question.toLowerCase().replace(/[?.,]/g, "").split(/\s+/);
          let score = 0;
          for (const word of questionWords) {
            // Ignore generic stop words to avoid false positives
            if (word.length > 2 && !["what", "how", "are", "the", "can", "get", "you", "for", "and"].includes(word)) {
              if (lowerMsg.includes(word)) {
                score += 5; // Direct word match
              }
            }
          }

          // Check direct phrases
          if (lowerMsg.includes(question.toLowerCase().replace(/[?.]/g, ""))) {
            score += 20;
          }

          // Check chunks keywords
          for (const chunk of doc.chunks) {
            if (lowerMsg.includes(chunk.keyword.toLowerCase())) {
              score += 10;
            }
          }

          if (score > highestScore) {
            highestScore = score;
            bestMatch = doc.answers[question];
          }
        }
      }

      if (highestScore > 0) {
        matchedAnswer = bestMatch;
      }
    }

    if (!matchedAnswer) {
      matchedAnswer = "I couldn't find a direct answer to that in the indexed files. Try asking about 'restocking fees', 'API rate limits', or 'how to reset password'.";
    }

    // Simulate pipeline thinking delay and typewriter stream response
    setTimeout(() => {
      setIsChatTyping(false);
      const newBotMsgId = nextLandingChatMessageId("-bot");
      setChatMessages((prev) => [...prev, { id: newBotMsgId, sender: "bot", text: "" }]);

      let i = 0;
      chatIntervalRef.current = setInterval(() => {
        setChatMessages((prev) =>
          prev.map((m) =>
            m.id === newBotMsgId ? { ...m, text: m.text + matchedAnswer.charAt(i) } : m
          )
        );
        i++;
        if (i >= matchedAnswer.length) {
          if (chatIntervalRef.current) clearInterval(chatIntervalRef.current);
        }
      }, 15);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-700 font-sans selection:bg-forest-100 selection:text-forest-900 overflow-x-hidden relative">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100/80 transition-all duration-300">
        <nav className="flex justify-between items-center max-w-7xl mx-auto px-6 h-16">
          <div className="flex items-center gap-10">
            <Link to="/" className="flex items-center gap-2.5 group no-underline">
              <div className="w-8 h-8 rounded-lg bg-forest-600 flex items-center justify-center transition-all duration-200 shadow-md shadow-forest-100">
                <Bot className="w-4.5 h-4.5 text-white stroke-[2]" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 font-display">
                Contexta-AI
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              {["Features", "RAG Engine", "Pricing", "FAQ"].map((l) => (
                <a
                  key={l}
                  href={`#${l.toLowerCase().replace(" ", "-")}`}
                  className="text-sm font-medium text-slate-500 hover:text-forest-600 transition-colors duration-200 no-underline"
                >
                  {l}
                </a>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-all duration-200 no-underline"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="btn-forest px-4 py-2 text-xs font-semibold shadow-md shadow-forest-100 no-underline"
            >
              Start Free
            </Link>
          </div>
        </nav>
      </header>

      {/* ── Main Content ── */}
      <main className="relative z-10">
        
        {/* ── Hero Section ── */}
        <section className="relative pt-16 pb-16 px-6 max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 text-left space-y-6">
            
            {/* Tagline */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-forest-100 bg-forest-50/70 text-xs text-forest-700 font-semibold shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-forest-600" />
              <span>ENTERPRISE READY</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.1] text-slate-900 font-display">
              Deploy an AI Support Agent <br />
              <span className="text-forest-600">Trained on Your Data</span>
            </h1>

            {/* Sub-headline */}
            <p className="text-base md:text-lg text-slate-500 max-w-xl leading-relaxed font-medium">
              Automate 84% of support queries with high-fidelity RAG pipelines. Your documents, your knowledge, solved by a precise AI trained to mirror your brand's voice.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-start items-center gap-3 pt-2">
              <Link
                to="/signup"
                className="btn-forest w-full sm:w-auto px-6 py-3 font-semibold shadow-md shadow-forest-100 no-underline"
              >
                Start Building
              </Link>
              <a
                href="#rag-engine"
                className="btn-forest-secondary w-full sm:w-auto px-6 py-3 font-semibold no-underline"
              >
                <Play className="w-3.5 h-3.5 text-forest-600 fill-current" /> Watch Demo
              </a>
            </div>
          </div>

          {/* Right Side: Floating mock chatbot */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-[450px] bg-white rounded-2xl border border-slate-200/60 shadow-xl overflow-hidden">
              {/* Header */}
              <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-forest-600 flex items-center justify-center text-white ml-2">
                    <Bot className="w-4 h-4 stroke-[2]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-none">Knowledge Agent</h4>
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active Database
                    </span>
                  </div>
                </div>
              </div>

              {/* Chat Simulation Area */}
              <div className="p-4 space-y-4 bg-slate-50/40 min-h-[220px]">
                {/* User Message */}
                <div className="flex gap-2 max-w-[85%] self-end flex-row-reverse ml-auto">
                  <div className="w-6 h-6 rounded shrink-0 bg-forest-600 text-white flex items-center justify-center text-[10px] shadow-sm">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div className="rounded-xl p-3 text-xs bg-forest-600 text-white font-medium shadow-md shadow-forest-50">
                    How do I configure Webhooks in my developer dashboard?
                  </div>
                </div>

                {/* Bot Response */}
                <div className="flex gap-2 max-w-[90%] self-start mr-auto">
                  <div className="w-6 h-6 rounded shrink-0 bg-white border border-slate-100 text-slate-500 flex items-center justify-center text-[10px] shadow-sm">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-2">
                    <div className="rounded-xl p-3 text-xs bg-white text-slate-800 border border-slate-200/60 shadow-sm leading-relaxed text-left">
                      I found the configuration steps in your <span className="font-semibold text-forest-600">Developer_API_v4_Docs.pdf</span>:
                      <ol className="list-decimal pl-4 mt-1.5 space-y-1">
                        <li>Head to your developer dashboard & select Webhooks.</li>
                        <li>Add your API endpoint & select events to listen for.</li>
                        <li>Secure requests using the signature header.</li>
                      </ol>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded border border-forest-100 bg-forest-50/50 text-[10px] font-semibold text-forest-700">
                      Source: API Docs (Chunk #3)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Logo Strip ── */}
        <section className="py-10 border-t border-b border-slate-100 bg-white">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-6">TRUSTED BY 10,000+ ENGINEERING TEAMS</p>
            <div className="flex flex-wrap justify-center items-center gap-x-16 gap-y-6 opacity-40 grayscale">
              <span className="text-sm font-black tracking-widest font-mono text-slate-700">★ NEXUS</span>
              <span className="text-sm font-black tracking-widest font-mono text-slate-700">❂ CYBERDYNE</span>
              <span className="text-sm font-black tracking-widest font-mono text-slate-700">▲ STRATUS</span>
              <span className="text-sm font-black tracking-widest font-mono text-slate-700">❖ DATARETA</span>
              <span className="text-sm font-black tracking-widest font-mono text-slate-700">⎔ ORBITAL</span>
            </div>
          </div>
        </section>

        {/* ── Features Showcase Grid ── */}
        <section id="features" className="py-20 px-6 max-w-7xl mx-auto relative">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 font-display">
              Artisanal Intelligence Infrastructure
            </h2>
            <p className="text-slate-500 leading-relaxed font-medium max-w-2xl mx-auto">
              Modern enterprises require more than just a chatbot. They need a systematic knowledge engine that grows with their operations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: FileText, title: "Multi-Format RAG", desc: "Ingest PDFs, Notion pages, Zendesk tickets, and Slack archives with automated semantic chunking." },
              { icon: Shield, title: "Hallucination Controls", desc: "Adversarial verification layers ensure the AI only answers based on provided context, never inventing facts." },
              { icon: Bot, title: "Feedback Loops", desc: "Continuously improve accuracy with 'Human-in-the-loop' reinforcements from your expert support agents." },
              { icon: GlobeIcon, title: "Global Translation", desc: "Support customers in 100+ languages with native-level fluency, while maintaining technical accuracy." },
              { icon: CodeIcon, title: "Headless Deployment", desc: "Integrate your agent via robust APIs, Webhooks, or our pre-built float components and SDKs." },
              { icon: LockIcon, title: "SOC2 Compliance", desc: "Enterprise-grade security with PII masking, data residency controls, and end-to-end encryption." }
            ].map((f) => {
              const IconComp = f.icon;
              return (
                <div
                  key={f.title}
                  className="card p-6 transition-all duration-200 hover:-translate-y-1 text-left border border-slate-100 shadow-sm hover:shadow-md hover:border-forest-150 group bg-white"
                >
                  <div className="w-10 h-10 rounded-md bg-forest-50 border border-forest-100 flex items-center justify-center mb-4 transition-transform text-forest-600">
                    <IconComp className="w-5 h-5 stroke-[2]" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">{f.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Journey / Timeline Section ── */}
        <section className="py-20 px-6 max-w-7xl mx-auto border-t border-slate-200/50">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 font-display">
              A Systematic Journey to Automation
            </h2>
            <p className="text-slate-500 leading-relaxed font-medium">
              From raw data to accurate answers in milliseconds.
            </p>
          </div>

          <div className="relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-6 left-12 right-12 h-0.5 bg-slate-200" />
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 relative z-10">
              {[
                { step: "1", title: "Ingest", desc: "Upload your data sources (files, FAQs, manuals)." },
                { step: "2", title: "Process", desc: "Parsing text, sanitizing data, extracting key terms." },
                { step: "3", title: "Embed", desc: "Convert text into high-dimensional vector representations." },
                { step: "4", title: "Query", desc: "Retrieve relevant context with vector search." },
                { step: "5", title: "Synthesize", desc: "Formulate precise response using LLM." },
                { step: "6", title: "Resolve", desc: "Customer query is resolved and closed." }
              ].map((s) => (
                <div key={s.step} className="text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-forest-600 text-white flex items-center justify-center mx-auto text-sm font-bold shadow-md shadow-forest-100">
                    {s.step}
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 pt-1">{s.title}</h4>
                  <p className="text-[11px] text-slate-500 leading-normal max-w-[130px] mx-auto font-medium">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Master Your AI Experience Banner & Dashboard Mockup ── */}
        <section className="py-20 px-6 max-w-7xl mx-auto border-t border-slate-200/50">
          <div className="bg-gradient-to-tr from-forest-950 via-forest-900 to-forest-850 rounded-3xl p-8 lg:p-12 text-white grid lg:grid-cols-12 gap-8 items-center shadow-xl">
            
            <div className="lg:col-span-5 text-left space-y-6">
              <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white font-display">
                Master Your AI Experience
              </h2>
              <p className="text-forest-100/80 leading-relaxed text-xs md:text-sm font-medium">
                Gain absolute visibility into every interaction. Monitor citation accuracy, latency, and customer satisfaction in real-time.
              </p>
              
              <ul className="space-y-3.5 text-xs text-forest-200 list-none p-0">
                {["Advanced analytics on-demand", "Custom brand persona suite", "Real-time moderation monitoring"].map((c) => (
                  <li key={c} className="flex items-center gap-2.5 font-semibold">
                    <div className="w-4 h-4 rounded-full bg-forest-600 border border-forest-500 flex items-center justify-center text-white shrink-0">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                    {c}
                  </li>
                ))}
              </ul>

              <div className="pt-2">
                <Link
                  to="/signup"
                  className="btn-forest bg-white text-forest-900 hover:bg-forest-50 px-6 py-2.5 font-semibold no-underline"
                >
                  Explore Platform
                </Link>
              </div>
            </div>

            {/* Dashboard UI mockup */}
            <div className="lg:col-span-7 w-full">
              <div className="bg-white/95 rounded-2xl p-4 shadow-2xl border border-white/20 text-slate-800">
                {/* Header */}
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4.5 h-4.5 text-forest-600" />
                    <span className="text-xs font-bold text-slate-900">Performance Dashboard</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold">Active Widget • API Operational</span>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-3 my-3">
                  {[
                    { label: "Citation Accuracy", val: "99.98%", change: "+0.02%", color: "text-emerald-600" },
                    { label: "Avg Latency", val: "12ms", change: "-1.2ms", color: "text-emerald-600" },
                    { label: "CSAT Score", val: "4.95 / 5", change: "+1.1%", color: "text-emerald-600" }
                  ].map((st) => (
                    <div key={st.label} className="bg-slate-50 p-2.5 rounded-lg border border-slate-150 text-left">
                      <span className="text-[9px] text-slate-500 font-semibold block">{st.label}</span>
                      <span className="text-sm font-bold text-slate-900 mt-0.5 block">{st.val}</span>
                      <span className={`text-[9px] font-bold ${st.color} block mt-0.5`}>{st.change}</span>
                    </div>
                  ))}
                </div>

                {/* Mock Graph representation */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 mb-3 text-left">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-slate-800">Inbound Queries & Resolution Rates</span>
                    <span className="text-[9px] text-slate-500 font-medium">Last 7 Days</span>
                  </div>
                  {/* Visual SVG bar graphs */}
                  <div className="flex items-end justify-between h-20 pt-2 gap-2">
                    {[35, 52, 45, 68, 82, 91, 85].map((h, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                        <div className="w-full bg-forest-600/10 rounded-t h-full relative overflow-hidden flex items-end">
                          <div className="w-full bg-forest-600 rounded-t transition-all duration-300" style={{ height: `${h}%` }} />
                        </div>
                        <span className="text-[8px] text-slate-400 font-semibold">Day {idx+1}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Logs table */}
                <div className="text-left">
                  <span className="text-[10px] font-bold text-slate-800 block mb-1.5">Recent Resolving Logs</span>
                  <div className="space-y-1.5">
                    {[
                      { q: "What is the restocking fee?", status: "Resolved", doc: "Customer_Refund_Policy.pdf", confidence: "94.2%" },
                      { q: "How do I authenticate API calls?", status: "Resolved", doc: "Developer_API_v4_Docs.pdf", confidence: "99.1%" }
                    ].map((log, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 rounded-md border border-slate-150 text-[10px]">
                        <div className="truncate max-w-[200px] font-medium text-slate-800 text-left">
                          {log.q}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-slate-500 font-mono truncate max-w-[120px]">{log.doc}</span>
                          <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold">{log.confidence}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* ── Interactive RAG Simulator Sandbox ── */}
        <section id="rag-engine" className="py-20 px-6 max-w-7xl mx-auto relative border-t border-slate-200/50">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-forest-50 border border-forest-100 text-xs font-semibold text-forest-700 tracking-wider uppercase">
              <Cpu className="w-4 h-4" /> Live Interactive Sandbox
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 font-display">Visual RAG Pipeline</h2>
            <p className="text-slate-500 leading-relaxed font-medium">
              Explore how Retrieval-Augmented Generation processes documents, finds matches in vector space, and generates responses. Click simulate to see the pipeline flow.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Controller / Doc Selector Panel (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              
              {/* Document Selection Card */}
              <div className="card p-6 space-y-4 relative overflow-hidden border border-slate-100 shadow-sm bg-white">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-forest-600" />
                  Step 1: Select Knowledge Document
                </h3>
                
                <div className="space-y-2">
                  {Object.keys(sampleDocs).map((key) => {
                    const doc = sampleDocs[key];
                    const isSelected = selectedDocKey === key;
                    return (
                      <button
                        key={key}
                        onClick={() => handleDocumentSelect(key)}
                        className={`w-full flex items-center justify-between p-3.5 rounded-lg border transition-all text-left group cursor-pointer ${
                          isSelected
                            ? "bg-forest-50/50 border-forest-600 shadow-sm"
                            : "bg-white border-slate-200/60 hover:border-forest-500 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-md transition-colors border ${
                            isSelected 
                              ? "bg-forest-600 border-forest-600 text-white shadow-sm" 
                              : "bg-slate-50 border-slate-200/60 text-slate-500 group-hover:text-slate-800"
                          }`}>
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <p className={`text-xs font-semibold ${isSelected ? "text-forest-900" : "text-slate-700"}`}>
                              {doc.title}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{doc.size} • PDF Document</p>
                          </div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                          isSelected ? "border-forest-600 bg-forest-600 text-white" : "border-slate-300"
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Question Selection Card */}
              <div className="card p-6 space-y-4 relative border border-slate-100 shadow-sm bg-white">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-forest-600" />
                  Step 2: Choose Query or Ask Custom
                </h3>
                
                <div className="space-y-1.5">
                  {docData.questions.map((q) => {
                    const isSelected = currentQuery === q;
                    return (
                      <button
                        key={q}
                        onClick={() => {
                          setCurrentQuery(q);
                          setSimStep(0);
                          setDisplayedAnswer("");
                        }}
                        className={`w-full p-2.5 text-[11px] text-left rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-forest-50/50 border-forest-600 text-forest-900 font-semibold"
                            : "bg-white border-slate-200/60 text-slate-500 hover:text-slate-800 hover:border-forest-500"
                        }`}
                      >
                        {q}
                      </button>
                    );
                  })}
                </div>

                <div className="relative pt-1">
                  <input
                    type="text"
                    value={currentQuery}
                    onChange={(e) => {
                      setCurrentQuery(e.target.value);
                      setSimStep(0);
                      setDisplayedAnswer("");
                    }}
                    placeholder="Type a custom query..."
                    className="input-field w-full pl-3 pr-8 py-2 text-xs placeholder-slate-400"
                  />
                  <button
                    onClick={handleSimulate}
                    disabled={!currentQuery.trim()}
                    className="absolute right-1.5 top-[60%] -translate-y-1/2 p-1.5 rounded bg-forest-600 hover:bg-forest-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-0 shadow-md shadow-forest-100"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </div>

                <button
                  onClick={handleSimulate}
                  className="btn-forest w-full py-2.5 text-xs shadow-md shadow-forest-100"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Run RAG Simulation
                </button>
              </div>

            </div>

            {/* Visual RAG Pipeline Visualizer Panel (7 cols) */}
            <div className="lg:col-span-7 flex flex-col">
              <div className="card p-6 flex-1 flex flex-col justify-between relative min-h-[500px] border border-slate-100 shadow-sm bg-white">
                
                {/* Visual steps connector line */}
                <div className="absolute top-24 left-10 w-0.5 h-[58%] bg-slate-200 pointer-events-none" />

                {/* Pipeline Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <span className="text-xs font-semibold text-slate-900 tracking-wide uppercase flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-forest-600" /> Pipeline Observation Engine
                  </span>
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-slate-200/60 text-[10px] text-slate-500 font-semibold bg-slate-50">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Sandbox Mode
                  </span>
                </div>

                {/* Simulation Stages */}
                <div className="space-y-6 my-6 flex-1 text-left">
                  
                  {/* Step A: Input / Embedding */}
                  <div className={`flex gap-4 items-start relative transition-all duration-300 ${simStep >= 1 ? "opacity-100" : "opacity-35"}`}>
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 z-10 transition-all font-bold text-xs ${
                      simStep >= 1 ? "bg-forest-600 border-forest-600 text-white shadow-md shadow-forest-100" : "bg-slate-100 border-slate-200/60 text-slate-400"
                    }`}>
                      1
                    </div>
                    <div className="space-y-1.5 w-full">
                      <p className="text-xs font-semibold text-slate-800">Semantic Query Embedding</p>
                      {simStep === 1 ? (
                        <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200/60 text-xs text-slate-700 font-mono flex items-center gap-2 shadow-inner">
                          <Cpu className="w-3.5 h-3.5 animate-spin text-forest-600" /> Vectorizing: &quot;{currentQuery}&quot;
                        </div>
                      ) : simStep > 1 ? (
                        <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200/60 text-[10px] text-slate-500 font-mono max-w-md truncate shadow-inner">
                          Query Vector: [0.0815, -0.4721, 0.9912, 0.1254, -0.7301, ...]
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic font-medium">Waiting for simulation...</p>
                      )}
                    </div>
                  </div>

                  {/* Step B: Vector Similarity Search */}
                  <div className={`flex gap-4 items-start relative transition-all duration-300 ${simStep >= 2 ? "opacity-100" : "opacity-35"}`}>
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 z-10 transition-all font-bold text-xs ${
                      simStep >= 2 ? "bg-forest-600 border-forest-600 text-white shadow-md shadow-forest-100" : "bg-slate-100 border-slate-200/60 text-slate-400"
                    }`}>
                      2
                    </div>
                    <div className="space-y-2 w-full">
                      <p className="text-xs font-semibold text-slate-800">Vector Search Retrieval</p>
                      {simStep === 2 ? (
                        <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200/60 text-xs text-slate-700 font-mono flex items-center gap-2 shadow-inner">
                          <Database className="w-3.5 h-3.5 animate-bounce text-forest-600" /> Searching vector store...
                        </div>
                      ) : simStep > 2 ? (
                        <div className="space-y-2">
                          {docData.chunks
                            .filter(chunk => chunk.text.toLowerCase().includes(currentQuery.toLowerCase().split(" ")[0]) || chunk.id === 1)
                            .slice(0, 2)
                            .map((chunk, idx) => (
                              <div key={chunk.id} className="bg-slate-50 border border-slate-200/60 rounded-lg p-3 flex items-start justify-between gap-4 shadow-inner">
                                <div className="space-y-1">
                                  <span className="text-[9px] bg-forest-50 border border-forest-100 text-forest-700 px-2 py-0.5 rounded font-mono font-medium">Chunk #{chunk.id}</span>
                                  <p className="text-xs text-slate-700 leading-relaxed pt-1 font-sans text-left">{chunk.text}</p>
                                </div>
                                <span className="text-[10px] text-emerald-700 font-semibold font-mono bg-emerald-50 px-2 py-0.5 border border-emerald-100 rounded-md">
                                  {idx === 0 ? "94.2% Match" : "78.5% Match"}
                                </span>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic font-medium">Waiting for simulation...</p>
                      )}
                    </div>
                  </div>

                  {/* Step C: Context Construction & Prompt Injection */}
                  <div className={`flex gap-4 items-start relative transition-all duration-300 ${simStep >= 3 ? "opacity-100" : "opacity-35"}`}>
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 z-10 transition-all font-bold text-xs ${
                      simStep >= 3 ? "bg-forest-600 border-forest-600 text-white shadow-md shadow-forest-100" : "bg-slate-100 border-slate-200/60 text-slate-400"
                    }`}>
                      3
                    </div>
                    <div className="space-y-1.5 w-full">
                      <p className="text-xs font-semibold text-slate-800">Prompt Context Injection</p>
                      {simStep === 3 ? (
                        <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200/60 text-xs text-slate-700 font-mono flex items-center gap-2 shadow-inner">
                          <GitBranch className="w-3.5 h-3.5 animate-pulse text-forest-600" /> Structuring Prompt Context...
                        </div>
                      ) : simStep > 3 ? (
                        <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200/60 text-[10px] text-slate-500 font-mono max-h-24 overflow-y-auto leading-relaxed shadow-inner">
                          <span className="text-forest-600 font-semibold">&lt;system_instructions&gt;</span> Answer the user query using only the provided context. If unsure, do not hallucinate.<br />
                          <span className="text-forest-600 font-semibold">&lt;knowledge_context&gt;</span> {docData.chunks[0].text}<br />
                          <span className="text-forest-600 font-semibold">&lt;user_query&gt;</span> {currentQuery}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic font-medium">Waiting for simulation...</p>
                      )}
                    </div>
                  </div>

                </div>

                {/* Output Console Box (Step D) */}
                <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 mt-2 shadow-inner text-left">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 mb-2">
                    <span className="w-2 h-2 rounded-full bg-forest-600 animate-pulse" />
                    Generated AI Response
                  </div>
                  <div className="bg-white rounded-lg p-3 min-h-[70px] flex items-start border border-slate-200/60 shadow-sm">
                    {displayedAnswer ? (
                      <p className="text-xs font-medium text-slate-800 leading-relaxed font-sans text-left">{displayedAnswer}</p>
                    ) : simStep === 4 ? (
                      <div className="w-4 h-4 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <p className="text-xs text-slate-400 italic font-medium">AI Response will stream here once simulation completes.</p>
                    )}
                  </div>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* ── Capability Comparison Section ("Why Contexta-AI?") ── */}
        <section className="py-20 px-6 max-w-4xl mx-auto border-t border-slate-200/50">
          <div className="text-center mb-12 space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 font-display">Why Contexta-AI?</h2>
            <p className="text-slate-500 font-medium">Compare how verified knowledge RAG outclasses standard mechanisms.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-4 px-4">Capability</th>
                  <th className="py-4 px-4">Traditional FAQ</th>
                  <th className="py-4 px-4">Generic LLM</th>
                  <th className="py-4 px-4 text-forest-700 bg-forest-50/50 rounded-t-lg">Contexta-AI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                <tr>
                  <td className="py-4 px-4 font-semibold text-slate-950">Context Awareness</td>
                  <td className="py-4 px-4 text-red-500">None</td>
                  <td className="py-4 px-4">Partial</td>
                  <td className="py-4 px-4 text-forest-700 bg-forest-50/50 font-bold flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Full RAG-based
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-semibold text-slate-950">Brand Personality</td>
                  <td className="py-4 px-4">Static</td>
                  <td className="py-4 px-4">Unpredictable</td>
                  <td className="py-4 px-4 text-forest-700 bg-forest-50/50 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Authoritative
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-semibold text-slate-950">Update Frequency</td>
                  <td className="py-4 px-4 text-red-500">Manual Edit</td>
                  <td className="py-4 px-4">Training Required</td>
                  <td className="py-4 px-4 text-forest-700 bg-forest-50/50 font-bold flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Real-time Sync
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-semibold text-slate-950">Technical Accuracy</td>
                  <td className="py-4 px-4">Low</td>
                  <td className="py-4 px-4">Prone to Hallucinations</td>
                  <td className="py-4 px-4 text-forest-700 bg-forest-50/50 rounded-b-lg font-bold flex items-center gap-1.5 animate-pulse">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Citation Verified
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Pricing Calculator ── */}
        <section id="pricing" className="py-20 px-6 max-w-7xl mx-auto border-t border-slate-200/50 relative">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 font-display">Scalable Pricing for Artisanal Growth</h2>
            <p className="text-slate-500 leading-relaxed font-medium">
              Start free and scale as your knowledge base expands.
            </p>

            {/* Toggle monthly/annual */}
            <div className="flex justify-center items-center gap-3 pt-3">
              <span className={`text-xs font-semibold transition-colors ${!isAnnual ? "text-slate-900" : "text-slate-500"}`}>
                Monthly Billing
              </span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className="w-12 h-6.5 rounded-full bg-slate-100 border border-slate-200/60 p-1 flex items-center transition-all cursor-pointer relative"
              >
                <div className={`w-4.5 h-4.5 rounded-full bg-forest-600 transition-all ${
                  isAnnual ? "translate-x-5.5" : "translate-x-0"
                }`} />
              </button>
              <span className={`text-xs font-semibold transition-colors flex items-center gap-1.5 ${isAnnual ? "text-slate-900" : "text-slate-500"}`}>
                Annual Billing <span className="bg-forest-550 border border-forest-100 text-[9px] font-bold text-white bg-forest-600 px-2 py-0.5 rounded-full">Save 20%</span>
              </span>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
            
            {/* Tier 1: Starter */}
            <div className="card p-8 flex flex-col justify-between hover:border-slate-200 transition-all duration-200 text-left border border-slate-100 shadow-sm bg-white">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 font-display">Starter</h3>
                  <p className="text-xs text-slate-500 mt-1">For testing and personal sandbox systems</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-slate-900 font-display">$0</span>
                  <span className="text-xs text-slate-500">/ forever</span>
                </div>
                <hr className="border-slate-100" />
                <ul className="space-y-3.5 text-xs text-slate-650 list-none p-0">
                  {["100 Knowledge Documents", "250 AI Queries / min", "Basic Widget Styles"].map((item) => (
                    <li key={item} className="flex items-center gap-2 font-medium">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-8">
                <Link
                  to="/signup"
                  className="btn-forest-secondary w-full py-2.5 text-xs shadow-sm no-underline"
                >
                  Get Started
                </Link>
              </div>
            </div>

            {/* Tier 2: Pro (Featured) */}
            <div className="card border-2 border-forest-600 p-8 flex flex-col justify-between hover:border-forest-750 shadow-lg shadow-forest-50 relative transform md:-translate-y-2 text-left bg-white">
              <div className="absolute top-0 right-8 -translate-y-1/2 bg-forest-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md shadow-forest-100">
                Most Popular
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 font-display">Professional</h3>
                  <p className="text-xs text-slate-500 mt-1">For scaling support teams</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-slate-900 font-display">
                    ${isAnnual ? "399" : "499"}
                  </span>
                  <span className="text-xs text-slate-500">/ month</span>
                </div>
                <hr className="border-slate-100" />
                <ul className="space-y-3.5 text-xs text-slate-600 font-medium list-none p-0">
                  {[
                    "Unlimited Documents",
                    "10k AI Queries / min",
                    "Slack & Zendesk Integration",
                    "Custom Brand Persona"
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 font-semibold">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-8">
                <Link
                  to="/signup"
                  className="btn-forest w-full py-2.5 text-xs shadow-md shadow-forest-100 no-underline"
                >
                  Go Professional
                </Link>
              </div>
            </div>

            {/* Tier 3: Enterprise */}
            <div className="card p-8 flex flex-col justify-between hover:border-slate-200 transition-all duration-200 text-left border border-slate-100 shadow-sm bg-white">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 font-display">Enterprise</h3>
                  <p className="text-xs text-slate-500 mt-1">Custom solutions for heavy users</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-slate-900 font-display">Custom</span>
                </div>
                <hr className="border-slate-100" />
                <ul className="space-y-3.5 text-xs text-slate-600 list-none p-0">
                  {[
                    "Dedicated Vector Database",
                    "GDPR & HIPAA Compliance",
                    "On-prem Deployment",
                    "24/7 Priority Support"
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 font-medium">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-8">
                <Link
                  to="/signup"
                  className="btn-forest-secondary w-full py-2.5 text-xs shadow-sm no-underline"
                >
                  Contact Sales
                </Link>
              </div>
            </div>

          </div>
        </section>

        {/* ── Interactive FAQ Section ── */}
        <section id="faq" className="py-20 px-6 max-w-4xl mx-auto border-t border-slate-200/50 relative">
          
          <div className="text-center mb-12 space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 font-display">Frequently Asked Questions</h2>
            <p className="text-slate-500 font-medium">Everything you need to know about Contexta-AI infrastructure</p>
          </div>

          <div className="space-y-3 text-left">
            {[
              { q: "How does the PDF vector index work?", a: "When you upload a PDF file, our server extracts the raw text contents, splits the text into chunks of 1000 characters (with overlapping sections to preserve context), and computes an embedding vector using Google's generative models. These vectors are loaded into a FAISS index which supports lightning-fast cosine similarity lookups during chatbot conversations." },
              { q: "Is my data securely isolated from other users?", a: "Yes. Contexta-AI uses tenant isolation. Every user gets their own dedicated sub-directory for physical PDF storage and isolated FAISS index instances. Your vector embeddings are never pooled with, searched against, or exposed to other accounts." },
              { q: "How do I embed the support widget on my website?", a: "Integrating your chatbot is extremely simple. Once you index your documents, navigate to the Embed Widget tab to copy a single line script tag (CDN). Paste it before the closing </body> tag on any HTML or web application page. The support chat icon will immediately appear on the bottom right." },
              { q: "Can I customize the chatbot appearance and system instructions?", a: "Yes, you can edit the widget colors, chatbot title, placeholder greeting, and system prompts to match your brand style and corporate voice. You can also specify which documents form the knowledge base source for that specific widget." },
              { q: "What models does the RAG pipeline run on?", a: "By default, we support Google's Gemini-2.5-Flash for standard fast queries and Gemini-2.5-Pro for complex reasoning and multi-hop customer support interactions. You can configure your keys and switch models with a single click." }
            ].map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="card overflow-hidden hover:border-forest-600 transition-colors bg-white border border-slate-100 shadow-sm"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                    className="w-full flex justify-between items-center p-4 text-left font-semibold text-sm md:text-base text-slate-800 transition-colors cursor-pointer border-0 bg-transparent"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-forest-600" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>
                  <div className={`transition-all duration-200 ease-in-out overflow-hidden ${
                    isOpen ? "max-h-56 opacity-100 border-t border-slate-100" : "max-h-0 opacity-0 pointer-events-none"
                  }`}>
                    <p className="p-4 text-xs md:text-sm text-slate-600 leading-relaxed bg-slate-50/50 font-medium">
                      {faq.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </section>

        {/* ── Final CTA ── */}
        <section className="py-20 px-6 max-w-5xl mx-auto text-center relative">
          <div className="card py-16 px-8 lg:px-16 space-y-6 relative overflow-hidden bg-forest-600 text-white border-0 shadow-xl">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white font-display">
              Ready to Automate Customer Support?
            </h2>
            <p className="text-forest-100/90 max-w-md mx-auto text-xs md:text-sm leading-relaxed font-semibold font-sans">
              Join 200+ enterprise teams building trust-worthy knowledge systems with Contexta-AI.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
              <Link
                to="/signup"
                className="btn-forest bg-white text-forest-900 hover:bg-forest-50 px-6 py-3 font-semibold shadow-md shadow-forest-950/30 no-underline"
              >
                Try Started Free
              </Link>
              <Link
                to="/signup"
                className="btn-forest border border-white hover:bg-forest-700 px-6 py-3 font-semibold no-underline"
              >
                Book Enterprise Demo
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-100 bg-slate-50 relative z-10 font-sans">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 text-left">
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-forest-600 flex items-center justify-center shadow-md shadow-forest-100">
                  <Bot className="w-4.5 h-4.5 text-white stroke-[2]" />
                </div>
                <span className="text-lg font-bold tracking-tight text-slate-900 font-display">Contexta-AI</span>
              </div>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed font-medium">
                Empowering enterprise with custom AI infrastructure. Built for the artisanal enterprise.
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-650 font-semibold font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> System Operational
              </div>
            </div>
            {[
              { t: "Product", l: ["Features", "Integrations", "Pricing", "Changelog"] },
              { t: "Developers", l: ["Documentation", "API Reference", "Status"] },
              { t: "Company", l: ["About Us", "Careers", "Blog", "Press"] }
            ].map((col) => (
              <div key={col.t} className="space-y-3">
                <h4 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">{col.t}</h4>
                <ul className="space-y-2 text-xs text-slate-500 list-none p-0 font-semibold">
                  {col.l.map((link) => (
                    <li key={link}>
                      <a href="#" className="hover:text-forest-600 transition-colors duration-200 no-underline">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-center mt-8 pt-6 border-t border-slate-200/60 gap-4">
            <span className="text-[10px] text-slate-400 font-semibold">© 2026 Contexta-AI. All rights reserved. Built for the artisanal enterprise.</span>
          </div>
        </div>
      </footer>

      {/* ── Floating Chatbot Widget Demo ── */}
      <div className="fixed bottom-6 right-6 z-[99] flex flex-col items-end">
        {isChatOpen ? (
          <div className="card w-[360px] max-w-[calc(100vw-2rem)] h-[480px] flex flex-col shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200 bg-white border border-slate-100">
            {/* Header */}
            <div className="bg-slate-50 px-4 py-3 flex justify-between items-center border-b border-slate-100">
              <div className="flex items-center gap-2.5 text-left">
                <div className="w-8 h-8 rounded-lg bg-forest-600 flex items-center justify-center shadow-md shadow-forest-100">
                  <Bot className="w-4 h-4 text-white stroke-[2]" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-900">Contexta-AI Support</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] text-slate-500 font-medium">Always online (RAG Demo)</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer border-0 bg-transparent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 flex flex-col bg-slate-50/60 text-left">
              {chatMessages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-2 max-w-[85%] ${
                    m.sender === "user" ? "self-end flex-row-reverse" : "self-start"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded shrink-0 flex items-center justify-center text-[10px] shadow-sm ${
                      m.sender === "user" ? "bg-forest-600 text-white" : "bg-white border border-slate-100 text-slate-500"
                    }`}
                  >
                    {m.sender === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>
                  <div
                    className={`rounded-xl p-2.5 text-xs leading-relaxed ${
                      m.sender === "user"
                        ? "bg-forest-600 text-white font-medium shadow-md shadow-forest-50"
                        : "bg-white text-slate-800 border border-slate-100 shadow-sm"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}

              {isChatTyping && (
                <div className="flex gap-2 self-start max-w-[85%]">
                  <div className="w-6 h-6 rounded shrink-0 bg-white border border-slate-100 text-slate-500 flex items-center justify-center shadow-sm">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="bg-white border border-slate-100 rounded-xl p-2.5 flex gap-1 items-center shadow-sm">
                    <span className="w-1.5 h-1.5 bg-forest-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-forest-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-forest-600 rounded-full animate-bounce" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Actions Suggestions */}
            <div className="px-4 py-2 flex flex-wrap gap-1.5 bg-slate-50 border-t border-slate-100 font-sans">
              {[
                { label: "Restocking fee?", query: "What is the restocking fee?" },
                { label: "API rate limits?", query: "What are the API rate limits?" },
                { label: "Reset password?", query: "How do I reset my password?" }
              ].map((q) => (
                <button
                  key={q.label}
                  onClick={() => handleChatSend(q.query)}
                  className="bg-white hover:bg-forest-50 text-[10px] text-slate-650 hover:text-forest-700 border border-slate-200/60 hover:border-forest-200 rounded-full px-2.5 py-1 transition-all cursor-pointer font-semibold shadow-sm"
                >
                  {q.label}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleChatSend();
              }}
              className="bg-white p-3 border-t border-slate-100 flex gap-2 items-center"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask support chatbot..."
                className="input-field flex-1 px-3 py-1.5 text-xs placeholder-slate-400 font-medium"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="btn-forest p-1.5 rounded-lg shadow-md shadow-forest-100"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        ) : (
          <button
            onClick={() => setIsChatOpen(true)}
            className="w-12 h-12 rounded-full bg-forest-600 hover:bg-forest-700 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer relative group border-0 shadow-forest-200"
          >
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-white" />
            </span>
            <MessageSquare className="w-5 h-5 stroke-[2]" />
          </button>
        )}
      </div>

    </div>
  );
};

// --- Custom local mini icons to prevent bundle size issues ---
const GlobeIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <path d="M2 12h20" />
  </svg>
);

const CodeIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

const LockIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export default LandingPage;
