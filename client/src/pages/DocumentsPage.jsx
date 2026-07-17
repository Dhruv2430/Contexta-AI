import { useEffect, useState } from "react";
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
    processed: { cls: "bg-emerald-55 bg-emerald-50 text-emerald-700 border border-emerald-100", icon: CheckCircle, label: "Processed" },
    pending:   { cls: "bg-amber-50 text-amber-700 border border-amber-100", icon: Clock, label: "Pending" },
    failed:    { cls: "bg-red-55 bg-red-50 text-red-600 border border-red-150", icon: AlertCircle, label: "Failed" },
  };
  const s = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${s.cls}`}>
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

  useEffect(() => {
    let active = true;

    const loadDocuments = async () => {
      try {
        const { data } = await api.get("/documents");
        if (!active) return;
        setDocuments(data.documents || []);
        setError("");
      } catch (err) {
        if (!active) return;
        setError(err.response?.data?.message || "Failed to load documents.");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDocuments();

    return () => {
      active = false;
    };
  }, []);

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
    <div className="min-h-screen bg-slate-50 text-slate-700 flex">
      <Sidebar active="Documents" mobileOpen={isOpen} onMobileClose={close} />
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <Topbar onMenuToggle={toggle} />
        <main className="flex-1 p-6 md:p-8 space-y-6 md:space-y-8 overflow-y-auto">
          <div className="animate-fade-in text-left">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 font-display">Documents</h1>
            <p className="text-sm text-slate-500 mt-1.5 font-medium">Upload PDF documents to build your AI knowledge base.</p>
          </div>

          {/* Upload Zone */}
          <div className="card p-6 bg-white border border-slate-200/60 shadow-sm">
            <label
              className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-lg py-10 px-4 transition-all duration-200 cursor-pointer
                ${uploading ? "border-forest-600 bg-forest-50/10" : "border-slate-300 hover:border-forest-500 hover:bg-slate-50/50"}`}
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
                  <Loader2 className="w-8 h-8 text-forest-600 animate-spin" />
                  <p className="text-sm font-semibold text-slate-700">{uploadProgress}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm text-forest-600">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-800">Click to upload a PDF</p>
                    <p className="text-xs text-slate-400 mt-1">Maximum file size: 10MB</p>
                  </div>
                </div>
              )}
            </label>
          </div>

          {/* Error/Warning */}
          {error && (
            <div className={`rounded-lg p-4 flex items-start gap-3 text-sm border ${error.startsWith("⚠️") ? "bg-amber-50 border-amber-200 text-amber-700 font-medium" : "bg-red-50 border-red-200 text-red-600 font-medium"}`}>
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{error.replace("⚠️ ", "")}</p>
            </div>
          )}

          {/* Document List */}
          {loading ? (
            <div className="card p-6 space-y-4 animate-pulse bg-white border border-slate-200/60 shadow-sm">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div className="h-4 bg-slate-100 rounded w-28" />
                <div className="h-4 bg-slate-100 rounded w-16" />
              </div>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 py-3 border-b border-slate-50 last:border-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-slate-100 rounded w-3/4" />
                      <div className="h-2.5 bg-slate-100 rounded w-1/4" />
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-slate-100" />
                  </div>
                ))}
              </div>
            </div>
          ) : documents.length === 0 ? (
            <div className="card p-12 text-center border-dashed border-2 border-slate-200 bg-white shadow-sm">
              <div className="w-12 h-12 rounded-full bg-forest-50 border border-forest-100 flex items-center justify-center mx-auto mb-4 text-forest-600">
                <HardDrive className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800 mb-1">No documents uploaded</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed font-medium">
                Ingest a PDF above. The system will automatically chunk, embed, and load it into your isolated FAISS vector index.
              </p>
            </div>
          ) : (
            <div className="card overflow-hidden bg-white border border-slate-200/60 shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase">Your Documents</h2>
                <span className="text-xs text-slate-500 font-semibold">{documents.length} document{documents.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="divide-y divide-slate-100">
                {documents.map((doc) => {
                  const id = doc._id || doc.id;
                  const isReindexing = reindexingId === id;
                  return (
                    <div key={id} className="px-6 py-4 flex items-start sm:items-center gap-4 hover:bg-slate-50/40 transition-colors text-left">
                      <div className="w-9 h-9 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-xs text-slate-400">
                        <FileText className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-700 truncate">{doc.originalName}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs text-slate-400 font-medium">{formatSize(doc.fileSize)}</span>
                          {doc.pageCount > 0 && <span className="text-xs text-slate-400 font-medium">• {doc.pageCount} pages</span>}
                          <StatusBadge status={doc.processingStatus} />
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {doc.processingStatus === "failed" && (
                          <button
                            onClick={() => handleReindex(id)}
                            disabled={isReindexing}
                            title="Retry AI indexing"
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-0 bg-transparent"
                          >
                            {isReindexing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(id)}
                          className="p-2 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-red-600 transition-all cursor-pointer border-0 bg-transparent"
                          title="Delete document"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
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
