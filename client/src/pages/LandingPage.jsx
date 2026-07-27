import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  User,
  Zap,
  Terminal,
  Activity,
  Layers,
  Copy,
  CheckCircle,
  Lock,
  Globe,
  CheckCircle2,
  Search,
  Sliders,
  Server,
} from "lucide-react";
import Toast from "../components/Toast";

// --- Mock documents and simulation data for the interactive RAG simulator ---
const sampleDocs = {
  refund_policy: {
    title: "Customer_Refund_Policy.pdf",
    size: "184 KB",
    chunks: [
      {
        id: 1,
        text: "Refund requests are processed within 5-7 business days from receipt. All standard physical returns are subject to a 10% restocking fee unless defective.",
        keyword: "restocking fee",
      },
      {
        id: 2,
        text: "Digital software licenses and subscription plans are eligible for a 100% refund within the first 14 days of purchase, provided no API keys were generated.",
        keyword: "digital",
      },
      {
        id: 3,
        text: "Returns must include all original packaging and accessories. Shipping fees are non-refundable except in cases where the return is due to our shipping error.",
        keyword: "shipping",
      },
    ],
    questions: [
      "What is the restocking fee?",
      "Can I get a refund on digital subscriptions?",
      "Are shipping fees refundable?",
    ],
    answers: {
      "What is the restocking fee?":
        "According to the Customer Refund Policy, physical returns are subject to a 10% restocking fee unless the item is defective. Refunds are processed within 5-7 business days.",
      "Can I get a refund on digital subscriptions?":
        "Yes, digital software licenses and subscription plans are eligible for a 100% refund within the first 14 days of purchase, as long as no API keys have been generated.",
      "Are shipping fees refundable?":
        "Generally, shipping fees are non-refundable. However, exceptions are made if the return is due directly to a shipping error on our part.",
      default:
        "Based on the Refund Policy PDF: Returns must include all original packaging. Physical returns incur a 10% restocking fee, while digital subscriptions have a 14-day refund window.",
    },
  },
  api_docs: {
    title: "Developer_API_v4_Docs.pdf",
    size: "412 KB",
    chunks: [
      {
        id: 1,
        text: "To authenticate requests, include the Authorization header with bearer token: Authorization: Bearer <API_KEY>. Keep keys secure and never expose them in client-side code.",
        keyword: "authenticate",
      },
      {
        id: 2,
        text: "The API rate limits are 60 requests per minute per key on the Free plan, and up to 5,000 requests per minute on the Enterprise plan.",
        keyword: "rate",
      },
      {
        id: 3,
        text: "Webhook payloads are sent via POST as JSON with a signature header 'X-Contexta-Signature' to verify origin integrity using your signing secret.",
        keyword: "webhook",
      },
    ],
    questions: [
      "How do I authenticate API calls?",
      "What are the API rate limits?",
      "How do Webhooks work?",
    ],
    answers: {
      "How do I authenticate API calls?":
        "To authenticate your API requests, you must pass the API key in the Authorization header as a Bearer token: `Authorization: Bearer <API_KEY>`. Never expose keys in client code.",
      "What are the API rate limits?":
        "API rate limits depend on your tier. The Free plan allows up to 60 requests/minute, while the Enterprise plan scales up to 5,000 requests/minute.",
      "How do Webhooks work?":
        "Webhooks send JSON payloads via HTTP POST. Security is maintained using the 'X-Contexta-Signature' header, which verifies payload origin integrity via your signing secret.",
      default:
        "Based on Developer API Docs: Requests are authenticated via Bearer tokens. Rate limits range from 60 to 5,000 requests/minute. Webhooks send POST events secured by signatures.",
    },
  },
  user_manual: {
    title: "User_Onboarding_Manual.pdf",
    size: "245 KB",
    chunks: [
      {
        id: 1,
        text: "Go to Account Settings > Security and click 'Reset Password'. A verification link will be sent to your registered email address, valid for 24 hours.",
        keyword: "password",
      },
      {
        id: 2,
        text: "Team collaboration: Invite administrators and billing managers via Team tab. Role permissions define access to API keys and raw customer logs.",
        keyword: "team",
      },
      {
        id: 3,
        text: "Integrate the support widget by copying the CDN script tag. Paste it at the bottom of the body tag on all pages where support is required.",
        keyword: "widget",
      },
    ],
    questions: [
      "How do I reset my password?",
      "How do I add team members?",
      "How is the support widget integrated?",
    ],
    answers: {
      "How do I reset my password?":
        "You can reset your password by going to Account Settings > Security, then clicking 'Reset Password'. A recovery link will be sent to your email and is valid for 24 hours.",
      "How do I add team members?":
        "Navigate to the Team tab to invite collaborators. You can assign roles (like Administrator or Billing Manager) to control key access and audit logs.",
      "How is the support widget integrated?":
        "Integration is simple: copy the CDN script tag from your settings and paste it at the bottom of the HTML `<body>` tag on your website pages.",
      default:
        "Based on User Onboarding Manual: Password resets are requested via Security Settings. Widgets are deployed by placing a CDN script tag in the HTML body. Team members can be invited via the Team tab.",
    },
  },
};

let landingChatMessageCounter = 0;
const nextLandingChatMessageId = (suffix = "") => {
  landingChatMessageCounter += 1;
  return `landing-chat-${landingChatMessageCounter}${suffix}`;
};

const codeSnippets = {
  iframe: `<iframe
  src="https://contexta.ai/widget/YOUR_COMPANY_ID"
  width="380"
  height="600"
  style="border:0;border-radius:16px;"
></iframe>`,
  react: `import { ContextaWidget } from '@contexta/react';

export default function App() {
  return <ContextaWidget companyId="YOUR_COMPANY_ID" position="bottom-right" />;
}`,
  curl: `curl -X POST https://api.contexta.ai/v1/chat \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"question": "What is the refund policy?"}'`,
};

const faqItems = [
  {
    question: "How does Contexta-AI index and process my PDF documents?",
    answer:
      "Contexta-AI splits your uploaded PDFs into optimized semantic chunks, generates vector embeddings using Google Gemini API, and indexes them inside a fast vector store (FAISS). When a user asks a question, we retrieve the exact relevant chunks and stream accurate answers with source citations.",
  },
  {
    question: "Is my customer and document data kept secure?",
    answer:
      "Yes! Documents are strictly isolated per account. Your documents are stored with end-to-end encryption, and we never use your private data to train public foundation models.",
  },
  {
    question: "Can I embed the chatbot on any website?",
    answer:
      "Absolutely. You can embed the chatbot using a simple one-line `<iframe>` snippet, a lightweight CDN script, or integrate directly via our REST API into React, Vue, Next.js, or WordPress.",
  },
  {
    question: "What happens if a user asks a question not in my documents?",
    answer:
      "Contexta-AI is engineered to avoid hallucinations. If no relevant chunks match the user's question, it gracefully informs the user that the information isn't available in the knowledge base.",
  },
  {
    question: "Can I try Contexta-AI for free without a credit card?",
    answer:
      "Yes! Our Developer Free Tier includes 10 document uploads, 200 monthly chat queries, and full widget customization. No credit card is required to sign up.",
  },
];

const LandingPage = () => {
  // RAG Simulator States
  const [selectedDocKey, setSelectedDocKey] = useState("refund_policy");
  const [currentQuery, setCurrentQuery] = useState("What is the restocking fee?");
  const [simStep, setSimStep] = useState(0); // 0: Idle, 1: Embedding, 2: Retrieving, 3: Generating, 4: Done
  const [displayedAnswer, setDisplayedAnswer] = useState("");

  // Bento Code Tab State
  const [activeCodeTab, setActiveCodeTab] = useState("iframe");

  // Product Showcase Tab State
  const [activeShowcaseTab, setActiveShowcaseTab] = useState("engine");

  // Pricing States
  const [isAnnual, setIsAnnual] = useState(true);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Toast State
  const [toastMsg, setToastMsg] = useState("");

  // Chatbot Widget Demo States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      id: "welcome",
      sender: "bot",
      text: "Hello! I'm your RAG-powered AI assistant. Ask me anything about our Refund Policy, Developer API, or Onboarding User Manual!",
    },
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

  const handleSimulate = () => {
    if (simStep > 0 && simStep < 4) return;
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
          const answer = docData.answers[currentQuery] || docData.answers["default"];
          let i = 0;
          simIntervalRef.current = setInterval(() => {
            setDisplayedAnswer((prev) => prev + answer.charAt(i));
            i++;
            if (i >= answer.length) {
              if (simIntervalRef.current) clearInterval(simIntervalRef.current);
            }
          }, 15);
        }, 1200);
      }, 1000);
    }, 1000);
  };

  const handleChatSend = (customText) => {
    const textToSend = customText || chatInput;
    if (!textToSend.trim() || isChatTyping) return;

    const userMsgId = nextLandingChatMessageId("-user");
    setChatMessages((prev) => [...prev, { id: userMsgId, sender: "user", text: textToSend }]);
    if (!customText) setChatInput("");
    setIsChatTyping(true);

    const msg = textToSend.toLowerCase().trim();
    let matchedAnswer = null;

    if (/^(hi|hello|hey|yo|greetings|hola)\b/i.test(msg)) {
      matchedAnswer =
        "Hello! I am Contexta-AI Support. Ask me anything about our Refund Policy, Developer API, or Onboarding User Manual!";
    } else if (/\b(how are you|how's it going)\b/i.test(msg)) {
      matchedAnswer =
        "I'm doing great! Ready to help you query your documents. What can I help you find today?";
    } else if (/\b(who are you|what is this)\b/i.test(msg)) {
      matchedAnswer =
        "I am a RAG (Retrieval-Augmented Generation) bot demonstrating how Contexta-AI ingests PDFs, indexes FAISS vectors, and streams precise answers.";
    }

    if (!matchedAnswer) {
      for (const docKey in sampleDocs) {
        const doc = sampleDocs[docKey];
        for (const q in doc.answers) {
          if (q === "default") continue;
          if (msg.includes(q.toLowerCase().replace(/[?.]/g, ""))) {
            matchedAnswer = doc.answers[q];
            break;
          }
        }
        if (matchedAnswer) break;
      }
    }

    if (!matchedAnswer) {
      matchedAnswer =
        "Based on your indexed documents:Physical returns have a 10% restocking fee. Digital subscriptions are refundable within 14 days. Bearer tokens authenticate API calls.";
    }

    setTimeout(() => {
      setIsChatTyping(false);
      const botMsgId = nextLandingChatMessageId("-bot");
      setChatMessages((prev) => [...prev, { id: botMsgId, sender: "bot", text: "" }]);

      let i = 0;
      chatIntervalRef.current = setInterval(() => {
        setChatMessages((prev) =>
          prev.map((m) => (m.id === botMsgId ? { ...m, text: m.text + matchedAnswer.charAt(i) } : m))
        );
        i++;
        if (i >= matchedAnswer.length) {
          if (chatIntervalRef.current) clearInterval(chatIntervalRef.current);
        }
      }, 15);
    }, 1000);
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setToastMsg("Copied snippet to clipboard!");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-forest-100 selection:text-forest-900 overflow-x-hidden relative">
      {/* ── Navigation Bar ── */}
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-slate-200/70 transition-all duration-300">
        <nav className="flex justify-between items-center max-w-7xl mx-auto px-6 h-16">
          <div className="flex items-center gap-10">
            <Link to="/" className="flex items-center gap-2.5 group no-underline">
              <img
                src="/logo.png"
                alt="Contexta-AI Logo"
                className="w-9 h-9 rounded-xl object-contain transition-all duration-200 group-hover:scale-105 shadow-md shadow-forest-200/50"
              />
              <span className="text-xl font-bold tracking-tight text-slate-900 font-display flex items-center gap-2">
                Contexta-AI
                <span className="px-2 py-0.5 rounded-full bg-forest-50 text-forest-700 text-[10px] font-bold border border-forest-100">
                  v4.2
                </span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
              <a href="#features" className="hover:text-forest-600 transition-colors no-underline">
                Features
              </a>
              <a href="#rag-engine" className="hover:text-forest-600 transition-colors no-underline">
                RAG Engine
              </a>
              <a href="#showcase" className="hover:text-forest-600 transition-colors no-underline">
                Showcase
              </a>
              <a href="#pricing" className="hover:text-forest-600 transition-colors no-underline">
                Pricing
              </a>
              <a href="#faq" className="hover:text-forest-600 transition-colors no-underline">
                FAQ
              </a>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors no-underline"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="btn-forest px-4 py-2 text-xs font-bold shadow-md shadow-forest-200 no-underline"
            >
              Start Free
            </Link>
          </div>
        </nav>
      </header>

      {/* ── Main Content ── */}
      <main className="relative z-10">
        {/* ── Section 1: Hero (Linear / Vercel Aesthetic) ── */}
        <section className="relative pt-20 pb-20 px-6 max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center">
          {/* Ambient Lighting Mesh */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-forest-200/30 via-indigo-100/40 to-transparent rounded-full blur-3xl pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 text-left space-y-6 relative z-10"
          >
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-forest-200/80 bg-white/90 text-xs font-bold text-forest-700 shadow-xs backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-forest-600 animate-pulse" />
              <span>Contexta Engine v4.2 • Live Vector RAG</span>
            </div>

            {/* Main Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] text-slate-900 font-display">
              Transform PDFs into <br />
              <span className="bg-gradient-to-r from-forest-700 via-forest-600 to-indigo-600 bg-clip-text text-transparent">
                Precision AI Knowledge
              </span>
            </h1>

            {/* Sub-headline */}
            <p className="text-sm sm:text-base text-slate-500 max-w-xl leading-relaxed font-medium">
              Automate 84% of support queries with enterprise-grade RAG pipelines. Ingest PDFs, build FAISS vector indices, and deploy a brand-trained chatbot in under 2 minutes.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-start items-center gap-3.5 pt-2">
              <Link
                to="/signup"
                className="btn-forest w-full sm:w-auto px-7 py-3.5 text-xs font-bold shadow-md shadow-forest-200 no-underline"
              >
                Start Free Evaluation <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#rag-engine"
                className="btn-forest-secondary w-full sm:w-auto px-6 py-3.5 text-xs font-bold no-underline"
              >
                <Play className="w-3.5 h-3.5 text-forest-600 fill-current" /> Try RAG Simulator
              </a>
            </div>

            {/* Micro proof badges */}
            <div className="pt-4 flex flex-wrap items-center gap-6 text-xs font-semibold text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-forest-600" /> No credit card needed
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-forest-600" /> 1-Line iframe embed
              </span>
            </div>
          </motion.div>

          {/* Right Side: Animated Product Frame */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 relative z-10"
          >
            <div className="w-full bg-white rounded-2xl border border-slate-200/80 shadow-2xl overflow-hidden group hover:border-forest-200 transition-all duration-300">
              {/* Window Bar */}
              <div className="bg-slate-900 text-slate-400 px-4 py-3 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 ml-2">
                    contexta-rag-telemetry.v4
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> ~140ms Latency
                </div>
              </div>

              {/* Window Body */}
              <div className="p-5 bg-slate-950 text-slate-200 font-mono text-xs space-y-4 text-left">
                {/* Live Stream Terminal Logs */}
                <div className="space-y-2 text-[11px] leading-relaxed">
                  <p className="text-slate-400">
                    <span className="text-forest-400">[SYSTEM]</span> Initializing FAISS Vector Store Index...
                  </p>
                  <p className="text-slate-300">
                    <span className="text-indigo-400">[INDEX]</span> Chunked Customer_Refund_Policy.pdf (184 KB &rarr; 3 Vectors)
                  </p>
                  <p className="text-emerald-400">
                    <span className="text-amber-400">[QUERY]</span> &quot;What is the restocking fee?&quot; &rarr; Match score: 0.96
                  </p>
                </div>

                {/* Simulated AI Streaming Card */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-sans">
                    <span className="flex items-center gap-1.5 text-forest-400 font-bold">
                      <Bot className="w-3.5 h-3.5" /> Gemini 1.5 Flash Output
                    </span>
                    <span className="text-slate-500">Source: Chunk #1</span>
                  </div>
                  <p className="text-slate-200 text-xs font-sans font-medium leading-relaxed">
                    Physical returns incur a 10% restocking fee unless defective. Processing completes in 5-7 business days.
                  </p>
                </div>

                {/* Bottom Telemetry Gauges */}
                <div className="pt-2 grid grid-cols-3 gap-3 border-t border-slate-800 text-[10px] font-sans">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <p className="text-slate-500 font-medium">Memory Usage</p>
                    <p className="text-xs font-bold text-white mt-0.5">142 MB</p>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <p className="text-slate-500 font-medium">Embedding Cost</p>
                    <p className="text-xs font-bold text-emerald-400 mt-0.5">$0.0001 / query</p>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <p className="text-slate-500 font-medium">Accuracy Score</p>
                    <p className="text-xs font-bold text-indigo-400 mt-0.5">99.8% FAISS</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── Section 2: Proof & Trust Bar ── */}
        <section className="py-12 border-y border-slate-200/70 bg-white">
          <div className="max-w-7xl mx-auto px-6 space-y-8">
            <p className="text-[11px] font-extrabold tracking-widest text-slate-400 uppercase text-center">
              POWERING RAG INFRASTRUCTURE FOR INNOVATIVE ENGINEERING TEAMS
            </p>
            <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6 opacity-60 font-mono text-xs font-black text-slate-700 tracking-wider">
              <span>★ NEXUS_AI</span>
              <span>❂ CYBERDYNE</span>
              <span>▲ STRATUS_LABS</span>
              <span>❖ DATARETA</span>
              <span>⎔ ORBITAL_SYS</span>
              <span>⚡ HYPERION</span>
            </div>

            {/* Metrics Ribbon */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-slate-100">
              {[
                { label: "Retrieval Accuracy", val: "99.9%", desc: "FAISS Vector Search" },
                { label: "Vector Chunks Indexed", val: "10M+", desc: "Gemini Embeddings" },
                { label: "Average Response Time", val: "<180ms", desc: "Streaming LLM" },
                { label: "Support Deflection", val: "84%", desc: "Automated Answers" },
              ].map((m, i) => (
                <div key={i} className="text-center space-y-1">
                  <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
                    {m.val}
                  </p>
                  <p className="text-xs font-bold text-slate-700">{m.label}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Section 3: Interactive RAG Simulator ── */}
        <section id="rag-engine" className="py-20 px-6 max-w-7xl mx-auto space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="px-3 py-1 rounded-full bg-forest-50 text-forest-700 text-xs font-bold border border-forest-100">
              Interactive Simulator
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-display">
              Experience the RAG Pipeline in Action
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Select a PDF document, choose a query, and watch how Contexta-AI chunks, retrieves vectors, and generates accurate answers.
            </p>
          </div>

          <div className="card p-6 md:p-8 bg-white border border-slate-200/80 shadow-lg space-y-8">
            {/* Document Selector Pills */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {Object.keys(sampleDocs).map((key) => (
                <button
                  key={key}
                  onClick={() => handleDocumentSelect(key)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    selectedDocKey === key
                      ? "bg-forest-600 text-white border-forest-600 shadow-sm"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  📄 {sampleDocs[key].title}
                </button>
              ))}
            </div>

            {/* Query Selector Buttons */}
            <div className="space-y-2 text-left">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Select Sample Question:
              </p>
              <div className="flex flex-wrap gap-2">
                {docData.questions.map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setCurrentQuery(q);
                      setSimStep(0);
                      setDisplayedAnswer("");
                    }}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-left border ${
                      currentQuery === q
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    ❓ {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Execute Simulation Button */}
            <div className="flex justify-center">
              <button
                onClick={handleSimulate}
                disabled={simStep > 0 && simStep < 4}
                className="btn-forest px-8 py-3 text-xs font-bold shadow-md shadow-forest-200"
              >
                {simStep > 0 && simStep < 4 ? (
                  <>
                    <Zap className="w-4 h-4 animate-spin text-white" /> Executing Pipeline...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 text-white fill-current" /> Run RAG Pipeline Simulation
                  </>
                )}
              </button>
            </div>

            {/* 4-Step Pipeline Status Timeline */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
              {[
                { step: 1, label: "1. Vector Embedding", desc: "Convert query to vector" },
                { step: 2, label: "2. FAISS Similarity Search", desc: "Search top 3 doc chunks" },
                { step: 3, label: "3. Context Extraction", desc: "Assemble prompt payload" },
                { step: 4, label: "4. Gemini LLM Answer", desc: "Stream response with sources" },
              ].map((st) => {
                const isActive = simStep >= st.step;
                return (
                  <div
                    key={st.step}
                    className={`p-3.5 rounded-xl border text-xs transition-all ${
                      isActive
                        ? "bg-forest-50/80 border-forest-200 text-forest-900 font-bold shadow-xs"
                        : "bg-slate-50 border-slate-200/60 text-slate-400 font-medium"
                    }`}
                  >
                    <p className="font-bold">{st.label}</p>
                    <p className="text-[10px] mt-0.5 opacity-80">{st.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* Output Answer Box */}
            <AnimatePresence>
              {(simStep === 4 || displayedAnswer) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 rounded-2xl bg-slate-900 text-slate-100 text-left space-y-3 font-sans shadow-md"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                    <span className="flex items-center gap-2 text-forest-400 font-bold">
                      <Bot className="w-4 h-4" /> Contexta-AI Streamed Output
                    </span>
                    <span className="px-2 py-0.5 rounded bg-forest-950 text-forest-400 text-[10px] font-mono border border-forest-800">
                      FAISS Match Score: 0.98
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-medium leading-relaxed">
                    {displayedAnswer}
                  </p>
                  <div className="pt-2 border-t border-slate-800 flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                    <span>Cited Document:</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                      {docData.title}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* ── Section 4: Asymmetrical Bento Box Feature Grid ── */}
        <section id="features" className="py-20 px-6 max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="px-3 py-1 rounded-full bg-forest-50 text-forest-700 text-xs font-bold border border-forest-100">
              Architectural Highlights
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-display">
              Engineered for Enterprise Performance
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Every component is built for maximum speed, bulletproof document isolation, and clean website integration.
            </p>
          </div>

          {/* Bento Grid Container */}
          <div className="grid md:grid-cols-3 gap-6 text-left">
            {/* Bento 1: Dark Mesh Hero Bento (Span 2 Cols) */}
            <div className="md:col-span-2 p-8 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-forest-950 text-white border border-slate-800 shadow-xl space-y-6 flex flex-col justify-between relative overflow-hidden group">
              <div className="space-y-3 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-forest-600/30 border border-forest-500/40 flex items-center justify-center text-forest-400">
                  <Database className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold font-display">FAISS Vector Search Engine</h3>
                <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-md">
                  Performs sub-millisecond semantic similarity search over millions of document chunks. Your PDFs are automatically indexed with high-dimensional Gemini vector embeddings.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono space-y-2 relative z-10">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>VECTOR SIMILARITY SCORE</span>
                  <span className="text-emerald-400 font-bold">Top Match: 99.4%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-forest-500 to-emerald-400 h-full w-[94%]" />
                </div>
              </div>
            </div>

            {/* Bento 2: Analytics Chart Bento */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-accent-50 border border-accent-100 flex items-center justify-center text-accent-600">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 font-display">Real-Time Telemetry</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Monitor chat query spikes, document chunk usage, and deflection metrics live.
                </p>
              </div>
              <div className="h-28 flex items-end gap-2 pt-4 border-t border-slate-100">
                {[40, 75, 60, 95, 80, 100].map((val, idx) => (
                  <div key={idx} className="flex-1 bg-slate-100 rounded-t h-full flex items-end">
                    <div
                      className="w-full bg-forest-600 rounded-t hover:bg-forest-700 transition-all"
                      style={{ height: `${val}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Bento 3: Developer Code Snippet Bento */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-forest-600" />
                  <h3 className="text-sm font-bold text-slate-900 font-display">1-Line Integration</h3>
                </div>
                <button
                  onClick={() => copyCode(codeSnippets[activeCodeTab])}
                  className="btn-secondary px-2.5 py-1 text-[11px] font-bold"
                >
                  <Copy className="w-3 h-3" /> Copy
                </button>
              </div>

              {/* Code Tab Switcher */}
              <div className="flex gap-1 p-1 bg-slate-100 rounded-lg text-[11px] font-bold text-slate-600">
                {["iframe", "react", "curl"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveCodeTab(tab)}
                    className={`flex-1 py-1 rounded-md transition-all uppercase ${
                      activeCodeTab === tab ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <pre className="p-3 rounded-xl bg-slate-900 text-slate-200 text-[10px] font-mono overflow-x-auto max-h-32 text-left leading-relaxed">
                <code>{codeSnippets[activeCodeTab]}</code>
              </pre>
            </div>

            {/* Bento 4: Pipeline Architecture Nodes (Span 2 Cols) */}
            <div className="md:col-span-2 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-display">RAG Architecture Workflow</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Seamless flow from raw PDF document ingestion to customer support widget.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">
                  Fully Automated
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs font-semibold">
                {[
                  { icon: FileText, label: "PDF Upload", desc: "PyPDF Chunking" },
                  { icon: Cpu, label: "Gemini Vector", desc: "768d Embeddings" },
                  { icon: Database, label: "FAISS Store", desc: "Sub-ms Search" },
                  { icon: MessageSquare, label: "Support Widget", desc: "Streamed Response" },
                ].map((node, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5 hover:border-forest-200 transition-colors"
                  >
                    <node.icon className="w-5 h-5 text-forest-600 mx-auto" />
                    <p className="font-bold text-slate-900">{node.label}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{node.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 5: Product Deep-Dive Tabbed Showcase ── */}
        <section id="showcase" className="py-20 px-6 max-w-7xl mx-auto space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="px-3 py-1 rounded-full bg-forest-50 text-forest-700 text-xs font-bold border border-forest-100">
              Product Deep-Dive
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-display">
              Built for Modern Product & Support Teams
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Explore the core modules powering Contexta-AI infrastructure.
            </p>
          </div>

          {/* Showcase Tabs */}
          <div className="flex flex-wrap justify-center gap-2 p-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-xs max-w-2xl mx-auto">
            {[
              { id: "engine", label: "Knowledge Engine", icon: Database },
              { id: "pipeline", label: "RAG Pipeline", icon: GitBranch },
              { id: "analytics", label: "Analytics & Logs", icon: BarChart3 },
              { id: "widget", label: "Widget Builder", icon: Code2 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveShowcaseTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  activeShowcaseTab === tab.id
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                    : "text-slate-600 border-transparent hover:bg-slate-50"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content Display Card */}
          <div className="card p-8 bg-white border border-slate-200/80 shadow-lg text-left max-w-4xl mx-auto space-y-6">
            {activeShowcaseTab === "engine" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900 font-display">
                    Document Chunking & Vector Indexing
                  </h3>
                  <span className="text-xs text-forest-600 font-bold">Automatic Split</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  PDF documents uploaded to Contexta-AI are automatically parsed into sentence-aware chunks, embedded using Gemini API vectors, and stored in per-user FAISS indexes.
                </p>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-mono space-y-2">
                  <div className="flex justify-between text-slate-700 font-bold">
                    <span>Customer_Refund_Policy.pdf</span>
                    <span className="text-emerald-600">STATUS: INDEXED</span>
                  </div>
                  <div className="text-[11px] text-slate-500 space-y-1">
                    <p>• Chunk #1: Physical returns (10% restocking fee)</p>
                    <p>• Chunk #2: Digital licenses (14-day refund window)</p>
                    <p>• Chunk #3: Shipping policy & non-refundable terms</p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeShowcaseTab === "pipeline" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900 font-display">
                    RAG Pipeline Inspector
                  </h3>
                  <span className="text-xs text-accent-600 font-bold">Gemini 1.5 Flash</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Inspect prompt payloads, retrieved doc chunks, and similarity scores to ensure maximum accuracy and zero hallucination.
                </p>
                <div className="p-4 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono space-y-2">
                  <p className="text-forest-400">[PROMPT PAYLOAD]</p>
                  <p className="text-[11px] text-slate-300">
                    System: &quot;Answer questions strictly using provided document chunks.&quot;
                  </p>
                  <p className="text-[11px] text-slate-400">Context Chunks: [184KB Refund Policy Doc]</p>
                </div>
              </motion.div>
            )}

            {activeShowcaseTab === "analytics" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900 font-display">
                    Usage Telemetry & Audit Logs
                  </h3>
                  <span className="text-xs text-emerald-600 font-bold">Live Stream</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Full visibility into chat query volume, response latency, and user satisfaction ratings.
                </p>
                <div className="grid grid-cols-3 gap-3 text-xs font-bold text-center">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <p className="text-slate-400 text-[10px]">TOTAL QUERIES</p>
                    <p className="text-lg text-slate-900 mt-1">12,840</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <p className="text-slate-400 text-[10px]">AVG LATENCY</p>
                    <p className="text-lg text-forest-600 mt-1">142ms</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <p className="text-slate-400 text-[10px]">DEFLECTION</p>
                    <p className="text-lg text-emerald-600 mt-1">84.2%</p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeShowcaseTab === "widget" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900 font-display">
                    Support Widget Customizer
                  </h3>
                  <span className="text-xs text-indigo-600 font-bold">Public Iframe</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Customize colors, title, greeting messages, and embed the floating widget on any domain.
                </p>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-mono">
                  <code>&lt;iframe src=&quot;https://contexta.ai/widget/YOUR_ID&quot; ... /&gt;</code>
                </div>
              </motion.div>
            )}
          </div>
        </section>

        {/* ── Section 6: Interactive Pricing Experience ── */}
        <section id="pricing" className="py-20 px-6 max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="px-3 py-1 rounded-full bg-forest-50 text-forest-700 text-xs font-bold border border-forest-100">
              Transparent Pricing
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-display">
              Simple Pricing for Teams of All Sizes
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Start free, scale as your knowledge base and support volume grow.
            </p>

            {/* Monthly / Annual Toggle */}
            <div className="pt-4 flex items-center justify-center gap-3">
              <span
                className={`text-xs font-bold ${!isAnnual ? "text-slate-900" : "text-slate-400"}`}
              >
                Monthly
              </span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className="w-12 h-6 rounded-full bg-slate-900 p-1 flex items-center transition-all cursor-pointer border-0"
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    isAnnual ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
              <span
                className={`text-xs font-bold flex items-center gap-1.5 ${
                  isAnnual ? "text-slate-900" : "text-slate-400"
                }`}
              >
                Annual Billing
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                  Save 20%
                </span>
              </span>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid md:grid-cols-3 gap-8 text-left items-stretch max-w-6xl mx-auto">
            {/* Tier 1: Free */}
            <div className="card p-8 bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900 font-display">Free Developer</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Ideal for testing RAG pipelines and personal projects.
                </p>
                <div className="pt-2">
                  <span className="text-4xl font-extrabold text-slate-900 font-display">$0</span>
                  <span className="text-xs text-slate-400 font-semibold"> / forever</span>
                </div>
                <div className="space-y-2.5 pt-4 text-xs font-semibold text-slate-700">
                  <p className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-forest-600 shrink-0" /> Up to 10 PDF Documents
                  </p>
                  <p className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-forest-600 shrink-0" /> 200 Chat Queries / mo
                  </p>
                  <p className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-forest-600 shrink-0" /> Standard Iframe Embed
                  </p>
                  <p className="flex items-center gap-2 text-slate-400">
                    <X className="w-4 h-4 text-slate-300 shrink-0" /> Custom Domain Support
                  </p>
                </div>
              </div>
              <Link to="/signup" className="btn-secondary w-full py-3 text-xs font-bold no-underline">
                Get Started Free
              </Link>
            </div>

            {/* Tier 2: Pro (Highlighted) */}
            <div className="card p-8 bg-white border-2 border-forest-600 shadow-xl flex flex-col justify-between space-y-6 relative overflow-hidden">
              <span className="absolute top-0 right-0 bg-forest-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                Most Popular
              </span>
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900 font-display">Pro Team</h3>
                <p className="text-xs text-slate-500 font-medium">
                  For growing startups and support engineering teams.
                </p>
                <div className="pt-2">
                  <span className="text-4xl font-extrabold text-slate-900 font-display">
                    ${isAnnual ? "39" : "49"}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold"> / month</span>
                </div>
                <div className="space-y-2.5 pt-4 text-xs font-semibold text-slate-700">
                  <p className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-forest-600 shrink-0" /> Up to 500 PDF Documents
                  </p>
                  <p className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-forest-600 shrink-0" /> 10,000 Chat Queries / mo
                  </p>
                  <p className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-forest-600 shrink-0" /> FAISS Sub-ms Vector Search
                  </p>
                  <p className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-forest-600 shrink-0" /> Custom Domain & Branding
                  </p>
                  <p className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-forest-600 shrink-0" /> 5 Team Member Seats
                  </p>
                </div>
              </div>
              <Link
                to="/signup"
                className="btn-forest w-full py-3 text-xs font-bold shadow-md shadow-forest-200 no-underline"
              >
                Start Pro Evaluation
              </Link>
            </div>

            {/* Tier 3: Enterprise */}
            <div className="card p-8 bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900 font-display">Enterprise</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Dedicated infrastructure with SLA guarantees.
                </p>
                <div className="pt-2">
                  <span className="text-4xl font-extrabold text-slate-900 font-display">Custom</span>
                </div>
                <div className="space-y-2.5 pt-4 text-xs font-semibold text-slate-700">
                  <p className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-forest-600 shrink-0" /> Unlimited PDF Documents
                  </p>
                  <p className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-forest-600 shrink-0" /> Custom Query Volumes
                  </p>
                  <p className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-forest-600 shrink-0" /> Dedicated FAISS Instances
                  </p>
                  <p className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-forest-600 shrink-0" /> 24/7 SLA & Dedicated Support
                  </p>
                </div>
              </div>
              <a href="#faq" className="btn-secondary w-full py-3 text-xs font-bold no-underline">
                Contact Enterprise Sales
              </a>
            </div>
          </div>
        </section>

        {/* ── Section 7: Interactive FAQ Accordion ── */}
        <section id="faq" className="py-20 px-6 max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <span className="px-3 py-1 rounded-full bg-forest-50 text-forest-700 text-xs font-bold border border-forest-100">
              Frequently Asked Questions
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-display">
              Everything You Need to Know
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Have questions about document security, indexing speed, or integration?
            </p>
          </div>

          <div className="space-y-4 text-left">
            {faqItems.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="card bg-white border border-slate-200/80 shadow-xs overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-slate-900 font-display cursor-pointer border-0 bg-transparent"
                  >
                    <span>{item.question}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-forest-600" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="px-5 pb-5 pt-0 text-xs text-slate-500 font-medium leading-relaxed border-t border-slate-100"
                      >
                        {item.answer}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Section 8: Grand Closing CTA Banner ── */}
        <section className="py-20 px-6 max-w-7xl mx-auto">
          <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-forest-950 text-white p-10 sm:p-16 text-center space-y-6 relative overflow-hidden border border-slate-800 shadow-2xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-forest-600/20 rounded-full blur-3xl pointer-events-none" />
            <span className="px-3.5 py-1.5 rounded-full bg-forest-900/80 border border-forest-700 text-forest-200 text-xs font-bold inline-block">
              Ready to Automate Customer Support?
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-display max-w-2xl mx-auto leading-tight">
              Build your AI knowledge engine today.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto font-medium leading-relaxed">
              Upload your first PDF, test queries in our playground, and embed the chatbot widget in under 2 minutes.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link
                to="/signup"
                className="btn-forest px-8 py-3.5 text-xs font-bold shadow-lg shadow-forest-900 no-underline"
              >
                Create Free Account <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="btn-secondary px-6 py-3.5 text-xs font-bold bg-slate-800 text-white border-slate-700 hover:bg-slate-700 no-underline"
              >
                Sign In to Dashboard
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Standalone Floating Support Chatbot Demo Widget ── */}
      <div className="fixed bottom-6 right-6 z-50">
        {isChatOpen ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-[360px] sm:w-[380px] h-[520px] bg-white rounded-2xl border border-slate-200/90 shadow-2xl flex flex-col overflow-hidden text-left"
          >
            {/* Widget Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-forest-600 flex items-center justify-center text-white shadow-xs">
                  <Bot className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold font-display">Contexta Support AI</h4>
                  <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live RAG Agent
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer border-0 bg-transparent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Widget Chat Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 text-xs">
              {chatMessages.map((m) => (
                <div
                  key={m.id}
                  className={`flex items-start gap-2 max-w-[85%] ${
                    m.sender === "user" ? "ml-auto flex-row-reverse" : ""
                  }`}
                >
                  <div
                    className={`p-3 rounded-2xl ${
                      m.sender === "user"
                        ? "bg-forest-600 text-white rounded-tr-xs font-medium"
                        : "bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs shadow-xs font-medium"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.text}</p>
                  </div>
                </div>
              ))}
              {isChatTyping && (
                <div className="flex items-center gap-2 text-slate-400 text-[11px] font-medium p-2">
                  <Bot className="w-3.5 h-3.5 text-forest-600 animate-bounce" /> Streaming response...
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Query Pills */}
            <div className="p-2.5 bg-white border-t border-slate-100 flex flex-wrap gap-1.5">
              {[
                "Restocking fee?",
                "API rate limits?",
                "Reset password?",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => handleChatSend(q)}
                  className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-forest-50 text-slate-600 hover:text-forest-700 text-[10px] font-bold transition-colors cursor-pointer border-0"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Widget Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleChatSend();
              }}
              className="p-3 bg-white border-t border-slate-200/70 flex items-center gap-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask support chatbot..."
                className="input-field flex-1 py-2 px-3 text-xs font-medium"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isChatTyping}
                className="btn-forest p-2 rounded-lg text-white disabled:opacity-40 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </motion.div>
        ) : (
          <button
            onClick={() => setIsChatOpen(true)}
            className="w-13 h-13 rounded-full bg-forest-600 hover:bg-forest-700 text-white flex items-center justify-center shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer border-0 shadow-forest-300 relative group"
            aria-label="Open support widget preview"
          >
            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
            <MessageSquare className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200/80 bg-white py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8 text-left text-xs font-medium text-slate-500">
          <div className="col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-forest-600 flex items-center justify-center text-white shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-slate-900 font-display">Contexta-AI</span>
            </div>
            <p className="max-w-sm text-slate-500 leading-relaxed font-medium">
              Enterprise PDF vector retrieval & RAG pipeline platform powered by Gemini 1.5 Flash and FAISS similarity indexing.
            </p>
            <p className="text-[10px] text-slate-400">
              © {new Date().getFullYear()} Contexta-AI Inc. All rights reserved.
            </p>
          </div>

          <div className="space-y-2">
            <p className="font-bold text-slate-900 uppercase text-[10px] tracking-wider">Product</p>
            <p><a href="#features" className="hover:text-forest-600 transition-colors no-underline">Features</a></p>
            <p><a href="#rag-engine" className="hover:text-forest-600 transition-colors no-underline">RAG Engine</a></p>
            <p><a href="#showcase" className="hover:text-forest-600 transition-colors no-underline">Showcase</a></p>
            <p><a href="#pricing" className="hover:text-forest-600 transition-colors no-underline">Pricing</a></p>
          </div>

          <div className="space-y-2">
            <p className="font-bold text-slate-900 uppercase text-[10px] tracking-wider">Developers</p>
            <p><Link to="/api-keys" className="hover:text-forest-600 transition-colors no-underline">API Docs</Link></p>
            <p><Link to="/widget-embed" className="hover:text-forest-600 transition-colors no-underline">Widget Embed</Link></p>
            <p><Link to="/rag-pipeline" className="hover:text-forest-600 transition-colors no-underline">Pipeline Config</Link></p>
          </div>

          <div className="space-y-2">
            <p className="font-bold text-slate-900 uppercase text-[10px] tracking-wider">Legal & Security</p>
            <p><a href="#faq" className="hover:text-forest-600 transition-colors no-underline">Privacy Policy</a></p>
            <p><a href="#faq" className="hover:text-forest-600 transition-colors no-underline">Terms of Service</a></p>
            <p><a href="#faq" className="hover:text-forest-600 transition-colors no-underline">Security Statement</a></p>
          </div>
        </div>
      </footer>

      <Toast message={toastMsg} onClose={() => setToastMsg("")} />
    </div>
  );
};

export default LandingPage;
