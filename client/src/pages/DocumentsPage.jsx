import { useEffect, useState, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import useMobileSidebar from "../hooks/useMobileSidebar";
import api from "../services/api";
import { Upload, FileText, Trash2, Loader2, AlertCircle, CheckCircle, RefreshCw, Clock, HardDrive } from "lucide-react";

// ---------------------------------------------------------------------------
// DocumentsPage
//
// FIXES:
// - 3-state upload feedback: green (processed), amber (pending/failed), red (error)
// - Retry indexing button for failed documents
// - Optimistic UI: immediately adds document to list on success
// - Proper loading/error states
// - Mobile responsive with hamburger sidebar
// ---------------------------------------------------------------------------

const formatSize = (bytes) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const StatusBadge = ({ status }) => {
  const map = {
    processed: { cls: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20", icon: CheckCircle, label: "Processed" },
    pending:   { cls: "bg-amber-500/10 text-amber-400 border border-amber-500/20", icon: Clock, label: "Pending" },
    failed:    { cls: "bg-red-500/10 text-red-400 border border-red-500/20", icon: AlertCircle, label: "Failed" },
  };
  const s = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${s.cls}`}>
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
  const { isOpen, toggle, close } = useMobileSidebar();

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/documents");
      setDocuments(data.documents || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load documents.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File is too large. Maximum size is 10MB.");
      return;
    }

    const formData = new FormData();
    formData.append("document", file);

    setUploading(true);
    setUploadProgress("Uploading...");
    setError("");

    try {
      const { data, status } = await api.post("/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const pct = Math.round((progressEvent.loaded / (progressEvent.total || 1)) * 100);
          setUploadProgress(pct < 100 ? `Uploading... ${pct}%` : "Processing with AI...");
        },
      });

      if (data.document) {
        // Optimistic insert — add immediately to the list
        setDocuments((prev) => [data.document, ...prev]);
      }

      if (status === 202) {
        // Upload succeeded but AI indexing failed — show amber warning
        setError(`⚠️ ${data.message}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress("");
      // Reset file input
      e.target.value = "";
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this document? This action cannot be undone.")) return;
    try {
      await api.delete(`/documents/${id}`);
      setDocuments((prev) => prev.filter((d) => (d._id || d.id) !== id));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete document.");
    }
  };

  const handleReindex = async (id) => {
    setReindexingId(id);
    setError("");
    try {
      const { data } = await api.post(`/documents/${id}/reindex`);
      // Update the document status in the list
      setDocuments((prev) =>
        prev.map((d) =>
          (d._id || d.id) === id
            ? { ...d, processingStatus: data.processingStatus || "processed" }
            : d
        )
      );
      if (!data.success) {
        setError(`⚠️ ${data.message}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Re-indexing failed.");
    } finally {
      setReindexingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#070A13] text-slate-100 flex">
      <Sidebar active="Documents" mobileOpen={isOpen} onMobileClose={close} />
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <Topbar onMenuToggle={toggle} />
        <main className="flex-1 p-4 sm:p-6 space-y-6 overflow-y-auto">
          <div className="animate-fade-in">
            <h1 className="text-xl font-bold text-white">Documents</h1>
            <p className="text-sm text-slate-400 mt-0.5">Upload PDF documents to build your AI knowledge base.</p>
          </div>

          {/* Upload Zone */}
          <div className="bg-[#0A0F1D] border border-slate-900/60 rounded-2xl p-6 shadow-lg">
            <label
              className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl py-10 px-4 transition-all duration-300 cursor-pointer
                ${uploading ? "border-cyan-500/40 bg-cyan-500/5" : "border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-500/5"}`}
            >
              <input
                type="file"
                accept=".pdf"
                onChange={handleUpload}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              {uploading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                  <p className="text-sm font-semibold text-cyan-400">{uploadProgress}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                    <Upload className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-200">Click to upload a PDF</p>
                    <p className="text-xs text-slate-500 mt-1">Maximum file size: 10MB</p>
                  </div>
                </div>
              )}
            </label>
          </div>

          {/* Error/Warning */}
          {error && (
            <div className={`rounded-xl p-4 flex items-start gap-3 text-sm border ${error.startsWith("⚠️") ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{error.replace("⚠️ ", "")}</p>
            </div>
          )}

          {/* Document List */}
          {loading ? (
            <div className="bg-[#0A0F1D] border border-slate-900/60 rounded-2xl p-10 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
            </div>
          ) : documents.length === 0 ? (
            <div className="bg-[#0A0F1D] border border-slate-900/60 rounded-2xl p-10 text-center">
              <HardDrive className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No documents uploaded yet. Upload your first PDF above to get started.</p>
            </div>
          ) : (
            <div className="bg-[#0A0F1D] border border-slate-900/60 rounded-2xl overflow-hidden shadow-lg">
              <div className="px-5 py-4 border-b border-slate-900 flex items-center justify-between">
                <h2 className="text-sm font-bold text-white">Your Documents</h2>
                <span className="text-xs text-slate-400 font-semibold">{documents.length} document{documents.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="divide-y divide-slate-900">
                {documents.map((doc) => {
                  const id = doc._id || doc.id;
                  const isReindexing = reindexingId === id;
                  return (
                    <div key={id} className="p-4 sm:p-5 flex items-start sm:items-center gap-4 hover:bg-slate-900/10 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20 animate-fade-in">
                        <FileText className="w-5 h-5 text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-200 truncate">{doc.originalName}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <span className="text-xs text-slate-500 font-semibold">{formatSize(doc.fileSize)}</span>
                          {doc.pageCount > 0 && <span className="text-xs text-slate-500 font-semibold">• {doc.pageCount} pages</span>}
                          <StatusBadge status={doc.processingStatus} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {doc.processingStatus === "failed" && (
                          <button
                            onClick={() => handleReindex(id)}
                            disabled={isReindexing}
                            title="Retry AI indexing"
                            className="p-2 rounded-lg hover:bg-cyan-500/10 text-cyan-400 transition-colors disabled:opacity-50 cursor-pointer border-0 bg-transparent"
                          >
                            {isReindexing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(id)}
                          className="p-2 rounded-lg hover:bg-red-500/15 text-slate-500 hover:text-red-400 transition-colors cursor-pointer border-0 bg-transparent"
                          title="Delete document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default DocumentsPage;
