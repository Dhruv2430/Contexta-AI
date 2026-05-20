import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Bot,
  Database,
  GitBranch,
  BarChart3,
  Rocket,
  Activity,
  ArrowRight,
  Shield,
  Zap,
  Globe,
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

  // Update query when document changes
  useEffect(() => {
    if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    setCurrentQuery(sampleDocs[selectedDocKey].questions[0]);
    setSimStep(0);
    setDisplayedAnswer("");
  }, [selectedDocKey]);

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
    const newUserMessage = { id: Date.now().toString(), sender: "user", text: msg };
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
      const newBotMsgId = Date.now().toString() + "_bot";
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
    <div className="min-h-screen bg-[#070A13] text-slate-100 font-sans selection:bg-cyan-500 selection:text-black overflow-hidden relative">
      
      {/* ── Background Grids & Glows ── */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none opacity-40" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[30%] right-1/4 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-1/3 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-[#070A13]/85 backdrop-blur-md border-b border-slate-900 transition-all duration-300">
        <nav className="flex justify-between items-center max-w-7xl mx-auto px-6 h-16">
          <div className="flex items-center gap-10">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-all duration-300">
                <Bot className="w-5 h-5 text-black stroke-[2.5]" />
              </div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Contexta<span className="text-cyan-400 font-extrabold">-AI</span>
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              {["Features", "RAG Engine", "Pricing", "FAQ"].map((l) => (
                <a
                  key={l}
                  href={`#${l.toLowerCase().replace(" ", "-")}`}
                  className="text-sm font-medium text-slate-400 hover:text-white transition-colors duration-200"
                >
                  {l}
                </a>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-medium text-slate-300 hover:text-white transition-all duration-200"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-xs font-semibold text-white rounded-xl group bg-gradient-to-br from-cyan-400 to-blue-600 hover:text-black focus:ring-4 focus:outline-none focus:ring-cyan-800 transition-all duration-300 cursor-pointer mt-2"
            >
              <span className="relative px-4 py-2 transition-all ease-in duration-75 bg-[#090D1A] rounded-lg group-hover:bg-opacity-0 font-bold">
                Get Started Free
              </span>
            </Link>
          </div>
        </nav>
      </header>

      {/* ── Main Content ── */}
      <main className="relative z-10">
        
        {/* ── Hero Section ── */}
        <section className="relative pt-24 pb-20 px-6 max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto space-y-8">
            
            {/* Tagline */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/25 bg-cyan-950/20 text-xs text-cyan-400 font-semibold shadow-inner shadow-cyan-500/5 animate-fade-in">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Next-Gen RAG System with Vector Isolation</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.08] text-white">
              Ground Your AI Agents In <br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 bg-clip-text text-transparent">
                Verified Knowledge.
              </span>
            </h1>

            {/* Sub-headline */}
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Upload documents, automatically chunk and index them into an isolated vector database, and deploy context-aware chatbots in minutes.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
              <Link
                to="/signup"
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-extrabold rounded-2xl shadow-lg shadow-cyan-500/20 hover:shadow-cyan-400/35 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 group"
              >
                Deploy AI Widget <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#rag-engine"
                className="w-full sm:w-auto px-8 py-3.5 border border-slate-800 bg-slate-900/50 hover:bg-slate-900 text-slate-300 hover:text-white font-semibold rounded-2xl hover:border-slate-600 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current text-cyan-400" /> See RAG Sandbox
              </a>
            </div>

            {/* Stats badges */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-16 max-w-5xl mx-auto">
              {[
                { v: "< 12ms", label: "Semantic Retrieval" },
                { v: "99.98%", label: "Context Accuracy" },
                { v: "100%", label: "Vector Store Isolation" },
                { v: "1-Click", label: "Embeddable Widget" }
              ].map((stat, i) => (
                <div key={i} className="border border-slate-900 bg-slate-950/40 backdrop-blur-sm rounded-2xl p-5 hover:border-slate-800 transition-colors duration-300">
                  <div className="text-2xl md:text-3xl font-black text-white">{stat.v}</div>
                  <div className="text-xs text-slate-400 font-medium mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ── Interactive RAG Simulator Sandbox ── */}
        <section id="rag-engine" className="py-24 px-6 max-w-7xl mx-auto relative">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-1 text-xs font-bold text-cyan-400 tracking-wider uppercase">
              <Cpu className="w-4 h-4" /> Live Interactive Sandbox
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white">Visual RAG Pipeline</h2>
            <p className="text-slate-400 leading-relaxed">
              Explore how Retrieval-Augmented Generation processes documents, finds matches in vector space, and generates responses. Click simulate to see the pipeline flow.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Controller / Doc Selector Panel (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              
              {/* Document Selection Card */}
              <div className="border border-slate-900 bg-slate-950/70 rounded-3xl p-6 space-y-5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  Step 1: Select Knowledge Document
                </h3>
                
                <div className="space-y-3">
                  {Object.keys(sampleDocs).map((key) => {
                    const doc = sampleDocs[key];
                    const isSelected = selectedDocKey === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedDocKey(key)}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left group cursor-pointer ${
                          isSelected
                            ? "bg-slate-900 border-cyan-500/50 shadow-lg shadow-cyan-500/5"
                            : "bg-slate-950 border-slate-900 hover:border-slate-800 hover:bg-slate-900/40"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl transition-colors ${
                            isSelected ? "bg-cyan-400 text-black" : "bg-slate-900 text-slate-400 group-hover:text-slate-200"
                          }`}>
                            <FileText className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <p className={`text-sm font-semibold ${isSelected ? "text-white" : "text-slate-300"}`}>
                              {doc.title}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">{doc.size} • PDF Document</p>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                          isSelected ? "border-cyan-400 bg-cyan-400 text-black" : "border-slate-800"
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Question Selection Card */}
              <div className="border border-slate-900 bg-slate-950/70 rounded-3xl p-6 space-y-5 shadow-2xl relative">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Step 2: Choose Query or Ask Custom
                </h3>
                
                <div className="space-y-2">
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
                        className={`w-full p-3 text-xs text-left rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-slate-900/80 border-blue-500/40 text-blue-300 font-semibold"
                            : "bg-slate-950 border-slate-900 hover:border-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {q}
                      </button>
                    );
                  })}
                </div>

                <div className="relative pt-2">
                  <input
                    type="text"
                    value={currentQuery}
                    onChange={(e) => {
                      setCurrentQuery(e.target.value);
                      setSimStep(0);
                      setDisplayedAnswer("");
                    }}
                    placeholder="Type a custom query..."
                    className="w-full pl-4 pr-10 py-3 text-xs rounded-xl bg-slate-950 border border-slate-900 text-slate-100 placeholder-slate-600 focus:border-cyan-500/60 focus:outline-none transition-all"
                  />
                  <button
                    onClick={handleSimulate}
                    disabled={!currentQuery.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-cyan-400 hover:bg-cyan-500 text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={handleSimulate}
                  className="w-full py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-cyan-400 to-blue-500 text-black hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 shadow-md shadow-cyan-500/10 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" /> Run RAG Simulation
                </button>
              </div>

            </div>

            {/* Visual RAG Pipeline Visualizer Panel (7 cols) */}
            <div className="lg:col-span-7 flex flex-col">
              <div className="border border-slate-900 bg-slate-950/70 rounded-3xl p-6 flex-1 flex flex-col justify-between shadow-2xl relative min-h-[500px]">
                
                {/* Visual steps overlay/connector line */}
                <div className="absolute top-24 left-10 w-0.5 h-[58%] bg-slate-900 pointer-events-none" />

                {/* Pipeline Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-900">
                  <span className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-cyan-400" /> Pipeline Observation Engine
                  </span>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Sandbox Mode
                  </span>
                </div>

                {/* Simulation Stages */}
                <div className="space-y-6 my-6 flex-1">
                  
                  {/* Step A: Input / Embedding */}
                  <div className={`flex gap-4 items-start relative transition-all duration-300 ${simStep >= 1 ? "opacity-100" : "opacity-35"}`}>
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 z-10 transition-all font-bold text-xs ${
                      simStep >= 1 ? "bg-cyan-500 border-cyan-500 text-black" : "bg-slate-950 border-slate-800 text-slate-500"
                    }`}>
                      1
                    </div>
                    <div className="space-y-1.5 w-full">
                      <p className="text-xs font-bold text-slate-300">Semantic Query Embedding</p>
                      {simStep === 1 ? (
                        <div className="bg-slate-900/60 rounded-xl p-3 border border-cyan-500/25 animate-pulse text-xs text-cyan-400 font-mono flex items-center gap-3">
                          <Cpu className="w-3.5 h-3.5 animate-spin" /> Vectorizing: &quot;{currentQuery}&quot;
                        </div>
                      ) : simStep > 1 ? (
                        <div className="bg-slate-900/40 rounded-xl p-2.5 border border-slate-900 text-[10px] text-slate-400 font-mono max-w-md truncate">
                          Query Vector: [0.0815, -0.4721, 0.9912, 0.1254, -0.7301, ...]
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic">Waiting for simulation...</p>
                      )}
                    </div>
                  </div>

                  {/* Step B: Vector Similarity Search */}
                  <div className={`flex gap-4 items-start relative transition-all duration-300 ${simStep >= 2 ? "opacity-100" : "opacity-35"}`}>
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 z-10 transition-all font-bold text-xs ${
                      simStep >= 2 ? "bg-cyan-500 border-cyan-500 text-black" : "bg-slate-950 border-slate-800 text-slate-500"
                    }`}>
                      2
                    </div>
                    <div className="space-y-2 w-full">
                      <p className="text-xs font-bold text-slate-300">Vector Search Retrieval</p>
                      {simStep === 2 ? (
                        <div className="bg-slate-900/60 rounded-xl p-3 border border-cyan-500/25 animate-pulse text-xs text-cyan-400 font-mono flex items-center gap-2">
                          <Database className="w-3.5 h-3.5 animate-bounce" /> Searching vector store (Cosine Similarity)...
                        </div>
                      ) : simStep > 2 ? (
                        <div className="space-y-2">
                          {docData.chunks
                            .filter(chunk => chunk.text.toLowerCase().includes(currentQuery.toLowerCase().split(" ")[0]) || chunk.id === 1)
                            .slice(0, 2)
                            .map((chunk, idx) => (
                              <div key={chunk.id} className="bg-[#090E1D] border border-cyan-500/10 rounded-xl p-3 flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                  <span className="text-[9px] bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded font-mono">Chunk #{chunk.id}</span>
                                  <p className="text-xs text-slate-300 leading-relaxed pt-1 font-sans">{chunk.text}</p>
                                </div>
                                <span className="text-[10px] text-emerald-400 font-bold font-mono bg-emerald-950/20 px-2 py-0.5 border border-emerald-500/15 rounded">
                                  {idx === 0 ? "94.2% Match" : "78.5% Match"}
                                </span>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic">Waiting for simulation...</p>
                      )}
                    </div>
                  </div>

                  {/* Step C: Context Construction & Prompt Injection */}
                  <div className={`flex gap-4 items-start relative transition-all duration-300 ${simStep >= 3 ? "opacity-100" : "opacity-35"}`}>
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 z-10 transition-all font-bold text-xs ${
                      simStep >= 3 ? "bg-cyan-500 border-cyan-500 text-black" : "bg-slate-950 border-slate-800 text-slate-500"
                    }`}>
                      3
                    </div>
                    <div className="space-y-1.5 w-full">
                      <p className="text-xs font-bold text-slate-300">Prompt Context Injection</p>
                      {simStep === 3 ? (
                        <div className="bg-slate-900/60 rounded-xl p-3 border border-cyan-500/25 animate-pulse text-xs text-cyan-400 font-mono flex items-center gap-2">
                          <GitBranch className="w-3.5 h-3.5 animate-pulse" /> Structuring Prompt Context...
                        </div>
                      ) : simStep > 3 ? (
                        <div className="bg-[#0D1224]/80 rounded-xl p-3 border border-slate-900 text-[10px] text-slate-400 font-mono max-h-24 overflow-y-auto leading-relaxed">
                          <span className="text-blue-400">&lt;system_instructions&gt;</span> Answer the user query using only the provided context. If unsure, do not hallucinate.<br />
                          <span className="text-blue-400">&lt;knowledge_context&gt;</span> {docData.chunks[0].text}<br />
                          <span className="text-blue-400">&lt;user_query&gt;</span> {currentQuery}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic">Waiting for simulation...</p>
                      )}
                    </div>
                  </div>

                </div>

                {/* Output Console Box (Step D) */}
                <div className="bg-slate-950 border border-slate-900 rounded-2xl p-4 mt-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300 mb-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    Generated AI Response
                  </div>
                  <div className="bg-[#090D18] rounded-xl p-3 min-h-[70px] flex items-start border border-slate-900">
                    {displayedAnswer ? (
                      <p className="text-xs font-medium text-slate-200 leading-relaxed font-sans">{displayedAnswer}</p>
                    ) : simStep === 4 ? (
                      <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <p className="text-xs text-slate-600 italic">AI Response will stream here once simulation completes.</p>
                    )}
                  </div>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* ── Features Showcase Grid ── */}
        <section id="features" className="py-24 px-6 max-w-7xl mx-auto relative border-t border-slate-900/60">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/10 text-xs text-cyan-400 font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Capabilities
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white">Built for High-Growth Teams</h2>
            <p className="text-slate-400 leading-relaxed">
              Every detail is tuned for speed, isolation, security, and developer convenience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Bot, title: "Context-Aware Agents", desc: "Deploy bots that resolve tickets with precise semantic knowledge, eliminating hallucination entirely.", color: "from-cyan-400 to-blue-500" },
              { icon: Database, title: "Isolated Vector Store", desc: "Separate vector stores per account powered by light-weight FAISS indices for maximum tenant isolation.", color: "from-emerald-400 to-teal-500" },
              { icon: GitBranch, title: "Dynamic Chunking", desc: "Smart text splitter with customized overlap parameters maintains continuity of complex terms.", color: "from-blue-400 to-indigo-500" },
              { icon: BarChart3, title: "Actionable Analytics", desc: "Track response rate, average resolution time, token usage, and user satisfaction scores in real-time.", color: "from-purple-400 to-pink-500" },
              { icon: Rocket, title: "CD / Multi-model", desc: "Swap LLMs seamlessly (Gemini-2.5, Pro models) with zero refactoring and rolling infrastructure updates.", color: "from-orange-400 to-red-500" },
              { icon: Shield, title: "End-To-End Security", desc: "All files hashed, isolated, and encrypted. Secure JWT authorization protects every endpoint from unauthorized access.", color: "from-yellow-400 to-amber-500" }
            ].map((f, i) => (
              <div
                key={f.title}
                className="group border border-slate-900/80 bg-slate-950/40 hover:border-slate-800/80 hover:bg-slate-950/90 rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <div className={`w-11 h-11 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform`}>
                  <f.icon className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Pricing Calculator ── */}
        <section id="pricing" className="py-24 px-6 max-w-7xl mx-auto border-t border-slate-900/60 relative">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold text-white">Predictable, Scale-Friendly Pricing</h2>
            <p className="text-slate-400 leading-relaxed">
              No hidden fees. Upgrade, downgrade, or cancel at any time.
            </p>

            {/* Toggle monthly/annual */}
            <div className="flex justify-center items-center gap-3 pt-4">
              <span className={`text-xs font-semibold transition-colors ${!isAnnual ? "text-cyan-400" : "text-slate-400"}`}>
                Monthly Billing
              </span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className="w-12 h-6.5 rounded-full bg-slate-900 border border-slate-850 p-1 flex items-center transition-all cursor-pointer relative"
              >
                <div className={`w-4.5 h-4.5 rounded-full bg-cyan-400 transition-all ${
                  isAnnual ? "translate-x-5.5" : "translate-x-0"
                }`} />
              </button>
              <span className={`text-xs font-semibold transition-colors flex items-center gap-1.5 ${isAnnual ? "text-cyan-400" : "text-slate-400"}`}>
                Annual Billing <span className="bg-emerald-950 border border-emerald-500/10 text-[9px] font-bold text-emerald-400 px-2 py-0.5 rounded-full">Save 20%</span>
              </span>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            
            {/* Tier 1: Starter */}
            <div className="border border-slate-900 bg-slate-950/40 rounded-3xl p-8 flex flex-col justify-between hover:border-slate-800 transition-all duration-300 relative">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Starter</h3>
                  <p className="text-xs text-slate-500 mt-1">For testing and personal sandbox systems</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">$0</span>
                  <span className="text-xs text-slate-500">/ forever</span>
                </div>
                <hr className="border-slate-900" />
                <ul className="space-y-3.5 text-xs text-slate-300">
                  {["1 Document (PDF)", "1 Active Chat Widget", "Max 1,000 queries / month", "Standard Gemini-2.0-Flash model", "Community Discord support"].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-8">
                <Link
                  to="/signup"
                  className="w-full py-3 rounded-xl border border-slate-850 hover:border-slate-650 hover:bg-slate-900/20 font-bold text-xs text-slate-200 hover:text-white transition-all block text-center"
                >
                  Deploy Free Sandbox
                </Link>
              </div>
            </div>

            {/* Tier 2: Pro (Featured) */}
            <div className="border border-cyan-500/35 bg-slate-950/80 rounded-3xl p-8 flex flex-col justify-between hover:border-cyan-400/50 shadow-2xl shadow-cyan-500/5 relative transform md:-translate-y-2">
              <div className="absolute top-0 right-8 -translate-y-1/2 bg-gradient-to-r from-cyan-400 to-blue-500 text-black text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                Most Popular
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Pro Developer</h3>
                  <p className="text-xs text-cyan-400/80 mt-1">For running live production customer widgets</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-white">
                    ${isAnnual ? "39" : "49"}
                  </span>
                  <span className="text-xs text-slate-500">/ month</span>
                </div>
                <hr className="border-slate-800" />
                <ul className="space-y-3.5 text-xs text-slate-200 font-medium">
                  {[
                    "Up to 25 Documents (PDF)",
                    "5 Active Chat Widgets",
                    "Max 50,000 queries / month",
                    "Support for Gemini-2.5-Flash & Pro models",
                    "Real-time analytics dashboard",
                    "Embeddable custom widget CDN link",
                    "Email Support (24h SLA)"
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-8">
                <Link
                  to="/signup"
                  className="w-full py-3.5 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-350 hover:to-blue-450 text-black font-extrabold text-xs rounded-xl transition-transform active:scale-98 block text-center shadow-lg shadow-cyan-500/10"
                >
                  Start 14-Day Free Trial
                </Link>
              </div>
            </div>

            {/* Tier 3: Enterprise */}
            <div className="border border-slate-900 bg-slate-950/40 rounded-3xl p-8 flex flex-col justify-between hover:border-slate-800 transition-all duration-300 relative">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Enterprise</h3>
                  <p className="text-xs text-slate-500 mt-1">For high volume traffic & custom setups</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">
                    ${isAnnual ? "159" : "199"}
                  </span>
                  <span className="text-xs text-slate-500">/ month</span>
                </div>
                <hr className="border-slate-900" />
                <ul className="space-y-3.5 text-xs text-slate-300">
                  {[
                    "Unlimited Documents",
                    "Unlimited Chat Widgets",
                    "Unlimited Queries / Month",
                    "Custom LLM API route selection",
                    "Priority Vector Storage Rebuilds",
                    "API access & analytics webhooks",
                    "Dedicated support manager (Slack/Meet)"
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-8">
                <Link
                  to="/signup"
                  className="w-full py-3 rounded-xl border border-slate-850 hover:border-slate-650 hover:bg-slate-900/20 font-bold text-xs text-slate-200 hover:text-white transition-all block text-center"
                >
                  Contact Sales Team
                </Link>
              </div>
            </div>

          </div>
        </section>

        {/* ── Interactive FAQ Section ── */}
        <section id="faq" className="py-24 px-6 max-w-4xl mx-auto border-t border-slate-900/60 relative">
          
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-1 text-xs font-bold text-cyan-400 tracking-wider uppercase">
              <HelpCircle className="w-4 h-4" /> FAQ
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white">Frequently Asked Questions</h2>
            <p className="text-slate-400">Everything you need to know about Contexta-AI infrastructure</p>
          </div>

          <div className="space-y-4">
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
                  className="border border-slate-900 bg-slate-950/30 rounded-2xl overflow-hidden hover:border-slate-800 transition-colors"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                    className="w-full flex justify-between items-center p-5 text-left font-bold text-sm md:text-base text-white hover:text-cyan-400 transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="w-5 h-5 text-cyan-400" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                  </button>
                  <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isOpen ? "max-h-56 opacity-100 border-t border-slate-900" : "max-h-0 opacity-0 pointer-events-none"
                  }`}>
                    <p className="p-5 text-xs md:text-sm text-slate-400 leading-relaxed bg-slate-950/70">
                      {faq.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </section>

        {/* ── Final CTA ── */}
        <section className="py-24 px-6 max-w-5xl mx-auto text-center relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent rounded-3xl blur-3xl pointer-events-none" />
          <div className="border border-slate-900/60 bg-slate-950/50 rounded-3xl py-16 px-8 lg:px-16 space-y-6 relative overflow-hidden shadow-2xl">
            
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">Ready to Deploy Contextual Support?</h2>
            <p className="text-slate-400 max-w-md mx-auto text-xs md:text-sm leading-relaxed">
              Join engineering teams shipping accurate, secure, and RAG-integrated customer support systems with Contexta-AI.
            </p>
            <div className="pt-4 flex justify-center">
              <Link
                to="/signup"
                className="px-8 py-3.5 bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-extrabold rounded-xl shadow-lg shadow-cyan-500/10 hover:shadow-cyan-400/25 transition-all duration-300 hover:scale-[1.02] flex items-center gap-2 group"
              >
                Create Account <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-900 bg-slate-950/70 relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                  <Bot className="w-4.5 h-4.5 text-black stroke-[2.5]" />
                </div>
                <span className="text-lg font-bold tracking-tight text-white">Contexta<span className="text-cyan-400">-AI</span></span>
              </div>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                Enterprise-grade RAG pipelines and vector database index engines for developers.
              </p>
              <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-bold font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> All Systems Operational
              </div>
            </div>
            {[
              { t: "Platform", l: ["Features", "RAG Engine", "Pricing", "Security"] },
              { t: "Documentation", l: ["API Reference", "SDKs", "CDN Widgets", "Status"] },
              { t: "Company", l: ["About Us", "Blog", "Contact", "Privacy"] }
            ].map((col) => (
              <div key={col.t} className="space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">{col.t}</h4>
                <ul className="space-y-2.5 text-xs text-slate-400">
                  {col.l.map((link) => (
                    <li key={link}>
                      <a href="#" className="hover:text-cyan-400 transition-colors duration-200">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-center mt-12 pt-8 border-t border-slate-900 gap-4">
            <span className="text-[11px] text-slate-650">© 2026 Contexta-AI. All rights reserved.</span>
            <div className="flex gap-6 text-[11px] text-slate-600">
              {["Terms of Service", "Privacy Policy", "SLA Status"].map((l) => (
                <a key={l} href="#" className="hover:text-cyan-400 transition-colors duration-200">{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ── Floating Chatbot Widget Demo ── */}
      <div className="fixed bottom-6 right-6 z-[99] flex flex-col items-end">
        {isChatOpen ? (
          <div className="w-[360px] max-w-[calc(100vw-2rem)] h-[480px] bg-[#090D1A]/95 border border-slate-900 rounded-3xl flex flex-col shadow-2xl backdrop-blur-md overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
            {/* Header */}
            <div className="bg-[#0e1426] px-4 py-3.5 flex justify-between items-center border-b border-slate-900">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/10">
                  <Bot className="w-4.5 h-4.5 text-black stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white">Contexta-AI Support</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-slate-400 font-medium">Always online (RAG Demo)</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
              {chatMessages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-2 max-w-[85%] ${
                    m.sender === "user" ? "self-end flex-row-reverse" : "self-start"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-md shrink-0 flex items-center justify-center text-[10px] ${
                      m.sender === "user" ? "bg-cyan-950 text-cyan-400" : "bg-slate-900 text-slate-400"
                    }`}
                  >
                    {m.sender === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>
                  <div
                    className={`rounded-2xl p-3 text-xs leading-relaxed ${
                      m.sender === "user"
                        ? "bg-gradient-to-br from-cyan-400 to-blue-500 text-black font-semibold rounded-tr-none"
                        : "bg-[#0c1224] text-slate-200 border border-slate-900 rounded-tl-none"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}

              {isChatTyping && (
                <div className="flex gap-2 self-start max-w-[85%]">
                  <div className="w-6 h-6 rounded-md shrink-0 bg-slate-900 text-slate-400 flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="bg-[#0c1224] border border-slate-900 rounded-2xl rounded-tl-none p-3 flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Actions Suggestions */}
            <div className="px-4 py-2 flex flex-wrap gap-1.5 bg-slate-950 border-t border-slate-900">
              {[
                { label: "Restocking fee?", query: "What is the restocking fee?" },
                { label: "API rate limits?", query: "What are the API rate limits?" },
                { label: "Reset password?", query: "How do I reset my password?" }
              ].map((q) => (
                <button
                  key={q.label}
                  onClick={() => handleChatSend(q.query)}
                  className="bg-[#090D1A] hover:bg-slate-900 text-[10px] text-cyan-400 border border-cyan-500/10 hover:border-cyan-400/40 rounded-full px-2.5 py-1.5 transition-all cursor-pointer font-medium"
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
              className="bg-[#0e1426] p-3 border-t border-slate-900 flex gap-2 items-center"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask support chatbot..."
                className="flex-1 bg-[#090D1A] border border-slate-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-500/50 text-slate-200 placeholder-slate-600 font-medium"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="p-2 rounded-xl bg-cyan-400 text-black hover:bg-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        ) : (
          <button
            onClick={() => setIsChatOpen(true)}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-black flex items-center justify-center shadow-xl shadow-cyan-500/15 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer relative group"
          >
            <span className="absolute -top-1.5 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-400" />
            </span>
            <MessageSquare className="w-6 h-6 stroke-[2]" />
          </button>
        )}
      </div>

    </div>
  );
};

export default LandingPage;
