import React from "react";
import { motion } from "framer-motion";
import { Globe, ArrowUpRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

// Custom SVG Icons for GitHub & LinkedIn to guarantee compatibility and crisp rendering
const GithubIcon = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

const LinkedinIcon = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.74a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2z" />
  </svg>
);

const teamMembers = [
  {
    id: "dhruv-panchal",
    name: "Dhruv Panchal",
    position: "Team Leader & Full Stack Developer",
    duty: "Project planning, architecture, frontend development, backend development, deployment, code reviews, mentoring team members.",
    description:
      "Leads the development process from idea to deployment while ensuring code quality and delivering scalable applications.",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    portfolioUrl: "https://dhruvpanchal.dev",
    githubUrl: "https://github.com",
    linkedinUrl: "https://linkedin.com",
  },
  {
    id: "aarav-shah",
    name: "Aarav Shah",
    position: "Frontend Developer & UI Designer",
    duty: "Responsive UI development, component design, accessibility, animations, user experience.",
    description:
      "Focused on crafting beautiful and intuitive user interfaces with excellent user experience.",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    portfolioUrl: "https://aaravshah.design",
    githubUrl: "https://github.com",
    linkedinUrl: "https://linkedin.com",
  },
  {
    id: "riya-patel",
    name: "Riya Patel",
    position: "Backend Developer & Database Engineer",
    duty: "API development, authentication, database management, server optimization, cloud integration.",
    description:
      "Builds secure and scalable backend systems that power modern web applications.",
    image:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
    portfolioUrl: "https://riyapatel.tech",
    githubUrl: "https://github.com",
    linkedinUrl: "https://linkedin.com",
  },
];

// Motion Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.18,
      delayChildren: 0.1,
    },
  },
};

const heroVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function TeamPage() {
  return (
    <div
      className="min-h-screen w-full font-sans antialiased selection:bg-[#6D9886]/20 selection:text-[#212121]"
      style={{ backgroundColor: "#F6F6F6", color: "#212121" }}
    >
      {/* Top Header / Navigation Bar */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#F6F6F6]/80 border-b border-[rgba(217,202,179,0.45)]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 h-20 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2.5 text-[#212121] font-bold text-xl tracking-tight transition-opacity hover:opacity-80"
          >
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm"
              style={{ backgroundColor: "#6D9886" }}
            >
              <Sparkles className="w-4 h-4 text-[#F6F6F6]" />
            </span>
            Contexta AI
          </Link>

          <nav className="flex items-center gap-6">
            <Link
              to="/"
              className="text-sm font-medium text-[#6B6B6B] hover:text-[#212121] transition-colors"
            >
              Home
            </Link>
            <Link
              to="/team"
              className="text-sm font-semibold text-[#212121] relative after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-[2px] after:bg-[#6D9886] after:rounded-full"
            >
              Our Team
            </Link>
            <Link
              to="/login"
              className="hidden sm:inline-flex items-center justify-center text-xs font-semibold px-4 py-2 rounded-xl transition-all duration-200"
              style={{
                backgroundColor: "#6D9886",
                color: "#F6F6F6",
              }}
            >
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 sm:px-8 py-16 md:py-24">
        {/* Hero Section */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={heroVariants}
          className="text-center max-w-3xl mx-auto mb-16 md:mb-24 space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-[#D9CAB3]/40 text-[#212121] border border-[rgba(217,202,179,0.45)]">
            <span>People Behind The Product</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#212121] leading-tight">
            Our Team
          </h1>

          <p className="text-lg sm:text-xl text-[#6B6B6B] font-normal leading-relaxed max-w-2xl mx-auto">
            Meet the passionate people building exceptional digital experiences.
          </p>
        </motion.section>

        {/* Team Grid Section */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={containerVariants}
          aria-label="Team Members"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch"
        >
          {teamMembers.map((member) => (
            <motion.article
              key={member.id}
              variants={cardVariants}
              whileHover={{
                y: -8,
                boxShadow:
                  "0 20px 35px -10px rgba(33, 33, 33, 0.12), 0 10px 15px -5px rgba(33, 33, 33, 0.06)",
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex flex-col justify-between h-full group"
              style={{
                backgroundColor: "#D9CAB3",
                padding: "32px",
                borderRadius: "20px",
                border: "1px solid rgba(217,202,179,0.45)",
                boxShadow:
                  "0 4px 20px -2px rgba(33, 33, 33, 0.05), 0 2px 6px -1px rgba(33, 33, 33, 0.03)",
              }}
            >
              {/* Card Header & Profile Picture */}
              <div>
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <motion.img
                      src={member.image}
                      alt={member.name}
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.3 }}
                      className="w-[140px] h-[140px] rounded-full object-cover shadow-md border-4 border-white transition-transform duration-300"
                    />
                  </div>
                </div>

                {/* Name & Position */}
                <div className="text-center mb-6 space-y-1.5">
                  <h2 className="text-2xl font-bold tracking-tight text-[#212121]">
                    {member.name}
                  </h2>
                  <p
                    className="text-sm font-semibold tracking-wide"
                    style={{ color: "#6D9886" }}
                  >
                    {member.position}
                  </p>
                </div>

                {/* Professional Description */}
                <p className="text-sm text-[#6B6B6B] text-center leading-relaxed mb-6">
                  {member.description}
                </p>

                {/* Main Responsibility / Duty Section */}
                <div className="bg-[#F6F6F6]/60 rounded-xl p-4 mb-8 border border-[rgba(217,202,179,0.45)]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#212121] mb-1.5">
                    Main Responsibility
                  </h3>
                  <p className="text-xs text-[#6B6B6B] leading-normal">
                    {member.duty}
                  </p>
                </div>
              </div>

              {/* Card Footer: Portfolio Button & Social Links */}
              <div className="pt-2 flex flex-col gap-5 mt-auto">
                <motion.a
                  href={member.portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="w-full flex items-center justify-center gap-2 text-sm font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#6D9886] focus:ring-offset-2"
                  style={{
                    backgroundColor: "#6D9886",
                    color: "#F6F6F6",
                    borderRadius: "12px",
                    padding: "12px 24px",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#567A6B")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "#6D9886")
                  }
                >
                  <span>View Portfolio</span>
                  <ArrowUpRight className="w-4 h-4" />
                </motion.a>

                {/* Social Icons */}
                <div className="flex items-center justify-center gap-4 pt-1">
                  <motion.a
                    href={member.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${member.name}'s GitHub Profile`}
                    whileHover={{ scale: 1.15, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-full text-[#212121] hover:text-[#6D9886] transition-colors focus:outline-none focus:ring-2 focus:ring-[#6D9886]"
                  >
                    <GithubIcon className="w-5 h-5" />
                  </motion.a>

                  <motion.a
                    href={member.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${member.name}'s LinkedIn Profile`}
                    whileHover={{ scale: 1.15, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-full text-[#212121] hover:text-[#6D9886] transition-colors focus:outline-none focus:ring-2 focus:ring-[#6D9886]"
                  >
                    <LinkedinIcon className="w-5 h-5" />
                  </motion.a>

                  <motion.a
                    href={member.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${member.name}'s Personal Website`}
                    whileHover={{ scale: 1.15, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-full text-[#212121] hover:text-[#6D9886] transition-colors focus:outline-none focus:ring-2 focus:ring-[#6D9886]"
                  >
                    <Globe className="w-5 h-5" />
                  </motion.a>
                </div>
              </div>
            </motion.article>
          ))}
        </motion.section>
      </main>

      {/* Footer Section */}
      <footer className="w-full border-t border-[rgba(217,202,179,0.45)] bg-[#F6F6F6] py-8 text-center text-xs text-[#6B6B6B]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Contexta AI. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-[#212121] transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-[#212121] transition-colors">
              Terms of Service
            </Link>
            <Link to="/team" className="hover:text-[#212121] transition-colors font-medium text-[#212121]">
              Our Team
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
