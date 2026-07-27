import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import useMobileSidebar from "../hooks/useMobileSidebar";
import api from "../services/api";
import Toast from "../components/Toast";
import { TableSkeleton } from "../components/SkeletonLoader";
import {
  Upload,
  FileText,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Clock,
  HardDrive,
  Sparkles,
  FileCheck,
  Search,
} from "lucide-react";

const formatSize = (bytes) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const StatusBadge = ({ status }) => {
  const map = {
    processed: {
      cls: "bg-emerald-50 text-emerald-700 border-emerald-100",
      icon: CheckCircle,
      label: "Indexed",
    },
    pending: {
      cls: "bg-amber-50 text-amber-700 border-amber-100",
      icon: Clock,
      label: "Processing",
    },
    failed: {
      cls: "bg-red-50 text-red-700 border-red-100",
      icon: AlertCircle,
      label: "Failed",
    },
  };
  const s = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${s.cls}`}>
      <s.icon className="w-3 h-3" />
      {s.label}
    </span>
  );
};

const DocumentsPage = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [reindexingId, setReindexingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const { isOpen, toggle, close } = useMobileSidebar();

  const loadDocuments = async () => {
    try {
      const { data } = await api.get("/documents");
      setDocuments(data.documents || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load documents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleFileUpload = async (file) => {
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Only PDF files are supported for vector embedding.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB maximum limit.");
      return;
    }

    const formData = new FormData();
    formData.append("document", file);

    setUploading(true);
    setUploadProgress("Uploading file...");
    setError("");

    try {
      const { data } = await api.post("/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const pct = Math.round((progressEvent.loaded / (progressEvent.total || 1)) * 100);
          setUploadProgress(pct < 100 ? `Uploading... ${pct}%` : "Creating Vector Embeddings...");
        },
      });

      setDocuments((prev) => [data.document, ...prev]);
      setToastMsg(`"${file.name}" uploaded and indexed successfully!`);
    } catch (err) {
      setError(err.response?.data?.message || "Document upload failed.");
    } finally {
      setUploading(false);
      setUploadProgress("");
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleReindex = async (docId, fileName) => {
    setReindexingId(docId);
    try {
      await api.post(`/documents/${docId}/reindex`);
      setToastMsg(`Re-indexing triggered for "${fileName}"`);
      await loadDocuments();
    } catch (err) {
      setError(err.response?.data?.message || "Re-indexing failed.");
    } finally {
      setReindexingId(null);
    }
  };

  const handleDelete = async (docId, fileName) => {
    try {
      await api.delete(`/documents/${docId}`);
      setDocuments((prev) => prev.filter((d) => d._id !== docId));
      setToastMsg(`Deleted "${fileName}"`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete document.");
    } finally {
      setDeleteId(null);
    }
  };

  const filteredDocs = documents.filter((doc) =>
    doc.filename?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-700 flex">
      <Sidebar active="Documents" mobileOpen={isOpen} onMobileClose={close} />
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <Topbar onMenuToggle={toggle} />

        <main className="flex-1 p-6 md:p-8 space-y-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 font-display">
                Knowledge Base Documents
              </h1>
              <p className="text-xs md:text-sm text-slate-500 mt-1 font-medium">
                Upload PDFs to split, chunk, and generate FAISS vector embeddings for AI retrieval.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 text-xs font-bold text-slate-700 shadow-xs flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-forest-600" />
                {documents.length} File{documents.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center justify-between text-xs font-semibold shadow-xs"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => setError("")}
                className="text-red-500 hover:text-red-700 font-bold underline cursor-pointer border-0 bg-transparent"
              >
                Dismiss
              </button>
            </motion.div>
          )}

          {/* Drag and Drop Zone */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative card p-8 border-2 border-dashed text-center transition-all duration-200 ${
              dragActive
                ? "border-forest-600 bg-forest-50/50 shadow-md scale-[1.01]"
                : "border-slate-300 hover:border-forest-400 bg-white"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".pdf"
              onChange={handleInputChange}
              disabled={uploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
            />
            <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
              <div className="w-14 h-14 rounded-2xl bg-forest-50 border border-forest-100 flex items-center justify-center text-forest-600 shadow-xs">
                {uploading ? (
                  <Loader2 className="w-7 h-7 animate-spin text-forest-600" />
                ) : (
                  <Upload className="w-7 h-7 text-forest-600" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-display">
                  {uploading ? uploadProgress : "Drop your PDF file here, or click to browse"}
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  Supports PDF format up to 10MB • Auto-indexed with Gemini & FAISS
                </p>
              </div>
            </div>
          </motion.div>

          {/* Document Table Section */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field w-full pl-10 pr-4 py-2 text-xs font-medium"
                />
              </div>
              <button
                onClick={loadDocuments}
                className="btn-secondary px-3 py-2 text-xs font-bold w-full sm:w-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                Refresh List
              </button>
            </div>

            {loading ? (
              <TableSkeleton rows={4} cols={4} />
            ) : filteredDocs.length === 0 ? (
              <div className="card p-12 text-center bg-white border border-slate-200/70 space-y-3">
                <FileCheck className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800 font-display">
                  {searchTerm ? "No matching documents found" : "No documents uploaded yet"}
                </h3>
                <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto">
                  {searchTerm
                    ? "Try a different search term or clear the filter."
                    : "Upload a PDF above to start building your AI context index."}
                </p>
              </div>
            ) : (
              <div className="card bg-white border border-slate-200/70 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-3.5 px-4">Document Name</th>
                        <th className="py-3.5 px-4">Size</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4">Uploaded</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                      {filteredDocs.map((doc) => (
                        <tr
                          key={doc._id}
                          className="hover:bg-slate-50/70 transition-colors group"
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-forest-50 border border-forest-100 flex items-center justify-center shrink-0 text-forest-600">
                                <FileText className="w-4 h-4" />
                              </div>
                              <span className="font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                                {doc.filename}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 font-medium">
                            {formatSize(doc.size)}
                          </td>
                          <td className="py-3.5 px-4">
                            <StatusBadge status={doc.status} />
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 font-medium">
                            {new Date(doc.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {doc.status === "failed" && (
                                <button
                                  onClick={() => handleReindex(doc._id, doc.filename)}
                                  disabled={reindexingId === doc._id}
                                  className="btn-forest-secondary px-2.5 py-1 text-[11px] font-bold"
                                  title="Retry Indexing"
                                >
                                  <RefreshCw
                                    className={`w-3 h-3 ${
                                      reindexingId === doc._id ? "animate-spin" : ""
                                    }`}
                                  />
                                  Retry
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(doc._id, doc.filename)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer border-0 bg-transparent"
                                title="Delete document"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <Toast message={toastMsg} onClose={() => setToastMsg("")} />
    </div>
  );
};

export default DocumentsPage;
