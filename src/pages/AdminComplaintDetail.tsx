import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Paperclip, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getAuthToken } from "@/lib/auth";

interface Complaint {
  id: string;
  subject: string;
  category: string;
  priority: string;
  description: string;
  status: "new" | "in-progress" | "resolved" | "closed";
  date: string;
  attachment?: string;
  attachmentUrl?: string;
  comments?: Array<{
    id: string;
    text: string;
    author: string;
    authorType: "user" | "support_agent";
    timestamp: string;
  }>;
  userId?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function AdminComplaintDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [commentText, setCommentText] = useState("");
  const [status, setStatus] = useState<Complaint["status"]>("new");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAttachmentViewer, setShowAttachmentViewer] = useState(false);
  const [attachmentBlobUrl, setAttachmentBlobUrl] = useState<string | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";
  const token = localStorage.getItem('auth_token');

  useEffect(() => {
    if (id) {
      loadComplaint();
    }
  }, [id]);

  const loadComplaint = async () => {
    if (!id) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/complaints/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please login again.');
        }
        if (response.status === 403) {
          throw new Error('Access denied. Admin privileges required.');
        }
        if (response.status === 404) {
          throw new Error('Complaint not found.');
        }
        throw new Error(`Failed to load complaint: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.ok) {
        throw new Error(data.message || 'Failed to load complaint');
      }

      const c = data.data;
      
      if (!c) {
        throw new Error('Complaint data is empty');
      }
      
      // Debug: Log comments to see what we're getting
      console.log('Complaint data:', c);
      console.log('Comments array:', c.comments);
      console.log('Comments length:', c.comments?.length);
      
      // Ensure comments is always an array
      const commentsArray = Array.isArray(c.comments) ? c.comments : [];
      
      // Safely build complaint object with all required fields
      const complaintId = c._id || c.id;
      if (!complaintId) {
        throw new Error('Complaint ID is missing');
      }
      
      try {
        setComplaint({
          id: complaintId.toString(),
          subject: c.subject || 'No subject',
          category: c.category || 'other',
          priority: c.priority || 'medium',
          description: c.description || 'No description',
          status: (c.status || 'new') as Complaint["status"],
          date: c.createdAt ? new Date(c.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          attachment: c.attachment?.filename,
          attachmentUrl: c.attachment?.filename ? `${API_BASE_URL}/admin/complaints/${complaintId}/attachments/${c.attachment.filename}` : undefined,
          comments: commentsArray.map((comment: any, index: number) => ({
            id: comment._id?.toString() || comment.id?.toString() || `comment-${index}`,
            text: comment.text || '',
            author: comment.author || 'User',
            authorType: (comment.authorType || 'user') as "user" | "support_agent",
            timestamp: comment.timestamp ? new Date(comment.timestamp).toISOString() : new Date().toISOString(),
          })),
          userId: c.userId ? {
            id: (c.userId._id || c.userId.id || '').toString(),
            name: c.userId.name || 'Unknown',
            email: c.userId.email || 'N/A',
          } : undefined,
        });
        setStatus((c.status || 'new') as Complaint["status"]);
      } catch (setError: any) {
        console.error('Error setting complaint state:', setError);
        throw new Error(`Failed to process complaint data: ${setError.message}`);
      }
    } catch (error: any) {
      console.error('Error loading complaint:', error);
      setError(error.message || "Failed to load complaint");
      setComplaint(null);
      toast({
        title: "Error",
        description: error.message || "Failed to load complaint",
        variant: "destructive",
      });
      // Don't auto-navigate, let user decide
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!id || !complaint) return;

    setIsUpdatingStatus(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/complaints/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      toast({
        title: "Success",
        description: "Status updated successfully",
      });

      await loadComplaint();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !id) return;

    setIsAddingComment(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/complaints/${id}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: commentText.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      toast({
        title: "Success",
        description: "Reply added successfully",
      });

      setCommentText("");
      await loadComplaint();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add comment",
        variant: "destructive",
      });
    } finally {
      setIsAddingComment(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="COMPLAINT MANAGEMENT SYSTEM - ADMIN" currentPage="Complaint Detail" />
        <main className="mx-auto max-w-4xl p-6">
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading complaint...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!complaint && !isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="COMPLAINT MANAGEMENT SYSTEM - ADMIN" currentPage="Complaint Detail" />
        <main className="mx-auto max-w-4xl p-6">
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <p className="text-muted-foreground">Complaint not found or failed to load.</p>
            <div className="flex gap-2">
              <Button variant="default" onClick={loadComplaint}>
                Retry
              </Button>
              <Button variant="outline" onClick={() => navigate("/admin/dashboard")}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Safety check - should not reach here if complaint is null, but just in case
  if (!complaint && !isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="COMPLAINT MANAGEMENT SYSTEM - ADMIN" currentPage="Complaint Detail" />
        <main className="mx-auto max-w-4xl p-6">
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            {error ? (
              <>
                <p className="text-destructive font-semibold">Error: {error}</p>
                <div className="flex gap-2">
                  <Button variant="default" onClick={loadComplaint}>
                    Retry
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/admin/dashboard")}>
                    Back to Dashboard
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-muted-foreground">Complaint not found or failed to load.</p>
                <div className="flex gap-2">
                  <Button variant="default" onClick={loadComplaint}>
                    Retry
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/admin/dashboard")}>
                    Back to Dashboard
                  </Button>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header title="COMPLAINT MANAGEMENT SYSTEM - ADMIN" currentPage="Complaint Detail" />
      
      <main className="mx-auto max-w-4xl p-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-foreground">Complaint Detail</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadComplaint} disabled={isLoading}>
              {isLoading ? "Refreshing..." : "Refresh"}
            </Button>
            <Button variant="outline" onClick={() => navigate("/admin/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Complaint Info */}
        <div className="rounded-lg border border-border bg-card p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Complaint ID</label>
              <p className="text-lg font-semibold text-foreground">{complaint?.id || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">User</label>
              <p className="text-lg text-foreground">{complaint?.userId?.name || 'Unknown'} ({complaint?.userId?.email || 'N/A'})</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Category</label>
              <p className="text-lg text-foreground capitalize">{complaint?.category || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Priority</label>
              <p className="text-lg text-foreground capitalize">{complaint?.priority || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Date</label>
              <p className="text-lg text-foreground">{complaint?.date ? formatDate(complaint.date) : 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div className="mt-2">
                <StatusBadge status={complaint?.status || 'new'} />
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="text-sm font-medium text-muted-foreground block mb-2">Subject:</label>
            <p className="text-lg font-semibold text-foreground">{complaint?.subject || 'N/A'}</p>
          </div>

          <div className="mb-6">
            <label className="text-sm font-medium text-muted-foreground block mb-2">Description:</label>
            <p className="text-foreground leading-relaxed">{complaint?.description || 'N/A'}</p>
          </div>

          <div className="mb-6">
            <label className="text-sm font-medium text-muted-foreground block mb-2">Attachment:</label>
            {complaint?.attachment || complaint?.attachmentUrl ? (
              <div className="flex items-center gap-4">
                <button
                  onClick={async () => {
                    if (complaint?.attachmentUrl) {
                      try {
                        // Fetch attachment as blob with authentication
                        const token = getAuthToken();
                        if (!token) {
                          throw new Error('Not authenticated');
                        }
                        
                        console.log('Fetching attachment from:', complaint.attachmentUrl);
                        const response = await fetch(complaint.attachmentUrl, {
                          headers: {
                            'Authorization': `Bearer ${token}`,
                          },
                        });
                        
                        console.log('Attachment response status:', response.status);
                        
                        if (!response.ok) {
                          const errorText = await response.text();
                          console.error('Attachment fetch error:', errorText);
                          throw new Error(`Failed to load attachment: ${response.status} ${response.statusText}`);
                        }
                        
                        const blob = await response.blob();
                        console.log('Blob created, size:', blob.size, 'type:', blob.type);
                        
                        if (blob.size === 0) {
                          throw new Error('Attachment file is empty');
                        }
                        
                        const blobUrl = URL.createObjectURL(blob);
                        setAttachmentBlobUrl(blobUrl);
                        setShowAttachmentViewer(true);
                      } catch (error: any) {
                        console.error('Error loading attachment:', error);
                        toast({
                          title: "Error",
                          description: error.message || "Failed to load attachment. Please try again.",
                          variant: "destructive",
                        });
                      }
                    } else {
                      setShowAttachmentViewer(true);
                    }
                  }}
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  <Eye className="h-4 w-4" />
                  <span className="font-medium">{complaint?.attachment || 'View Attachment'}</span>
                </button>
              </div>
            ) : (
              <p className="text-muted-foreground">No attachment</p>
            )}
          </div>

          {/* Status Update */}
          <div className="mb-6">
            <label className="text-sm font-medium text-muted-foreground block mb-2">Update Status:</label>
            <div className="flex gap-2">
              <Select value={status} onValueChange={(v) => setStatus(v as Complaint["status"])}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={handleUpdateStatus} 
                disabled={isUpdatingStatus || !complaint || status === complaint.status}
              >
                {isUpdatingStatus ? "Updating..." : "Update Status"}
              </Button>
            </div>
          </div>
        </div>

        {/* Comments */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-xl font-semibold text-foreground mb-6">
            Comments ({complaint?.comments?.length || 0})
          </h3>
          
          {complaint?.comments && complaint.comments.length > 0 ? (
            <div className="space-y-6 mb-6">
              {complaint.comments.map((comment, index) => {
                const isSupportAgent = comment.authorType === "support_agent";
                return (
                  <div 
                    key={comment.id || `comment-${index}`} 
                    className={`border-l-4 pl-4 py-3 rounded-r ${
                      isSupportAgent 
                        ? "border-primary bg-primary/5" 
                        : "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">
                          {comment.author || 'User'}
                        </span>
                        {isSupportAgent ? (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                            Support Agent
                          </span>
                        ) : (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                            Customer
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(comment.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{comment.text}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground mb-6 text-center py-4">No comments yet. Customer comments will appear here.</p>
          )}

          {/* Add Reply */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-2">Reply to Customer:</label>
              <Textarea
                placeholder="Type your reply here..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <Button onClick={handleAddComment} disabled={!commentText.trim() || isAddingComment}>
              {isAddingComment ? "Sending..." : "Send Reply"}
            </Button>
          </div>
        </div>
      </main>

      {/* Attachment Viewer Dialog */}
      {complaint && (
        <Dialog open={showAttachmentViewer} onOpenChange={(open) => {
          setShowAttachmentViewer(open);
          // Clean up blob URL when dialog closes
          if (!open && attachmentBlobUrl) {
            URL.revokeObjectURL(attachmentBlobUrl);
            setAttachmentBlobUrl(null);
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>{complaint.attachment || 'Attachment'}</DialogTitle>
              <DialogDescription>View attachment</DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              {attachmentBlobUrl || complaint.attachmentUrl ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      {complaint.attachment || 'Attachment'}
                    </p>
                  </div>
                  <div className="border rounded overflow-hidden bg-muted/50">
                    {(() => {
                      const fileName = complaint.attachment || '';
                      const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName);
                      const isPdf = /\.pdf$/i.test(fileName);
                      const displayUrl = attachmentBlobUrl || complaint.attachmentUrl;
                      
                      if (isImage && displayUrl) {
                        // Display images directly
                        return (
                          <div className="flex items-center justify-center bg-background p-4 min-h-[400px]">
                            <img
                              src={displayUrl}
                              alt={complaint.attachment || 'Attachment'}
                              className="max-w-full max-h-[70vh] object-contain rounded"
                              onError={(e) => {
                                console.error('Error loading image');
                                const img = e.target as HTMLImageElement;
                                img.style.display = 'none';
                                const parent = img.parentElement;
                                if (parent) {
                                  parent.innerHTML = `
                                    <div class="text-center py-8">
                                      <p class="text-muted-foreground mb-4">Failed to load image</p>
                                      <a href="${complaint.attachmentUrl}" target="_blank" class="text-primary hover:underline">
                                        Open in new tab
                                      </a>
                                    </div>
                                  `;
                                }
                              }}
                            />
                          </div>
                        );
                      } else if (isPdf && displayUrl) {
                        // Display PDFs in iframe
                        return (
                          <iframe
                            src={`${displayUrl}#toolbar=0`}
                            className="w-full h-[70vh]"
                            title="PDF Viewer"
                            style={{ border: 'none' }}
                            onError={(e) => {
                              console.error('Error loading PDF in iframe');
                              const iframe = e.target as HTMLIFrameElement;
                              iframe.style.display = 'none';
                              const parent = iframe.parentElement;
                              if (parent) {
                                parent.innerHTML = `
                                  <div class="text-center py-8">
                                    <p class="text-muted-foreground mb-4">PDF cannot be displayed in browser</p>
                                    <a href="${complaint.attachmentUrl}" target="_blank" class="text-primary hover:underline">
                                      Open PDF in new tab
                                    </a>
                                  </div>
                                `;
                              }
                            }}
                          />
                        );
                      } else if (displayUrl) {
                        // For other file types, try iframe first
                        return (
                          <iframe
                            src={displayUrl}
                            className="w-full h-[70vh]"
                            title="Attachment Viewer"
                            style={{ border: 'none' }}
                            onError={(e) => {
                              console.error('Error loading attachment in iframe');
                              const iframe = e.target as HTMLIFrameElement;
                              iframe.style.display = 'none';
                              const parent = iframe.parentElement;
                              if (parent) {
                                const fallback = document.createElement('div');
                                fallback.className = 'text-center py-8';
                                fallback.innerHTML = `
                                  <p class="text-muted-foreground mb-4">This file type cannot be displayed in browser</p>
                                  <a href="${complaint.attachmentUrl}" target="_blank" class="text-primary hover:underline">
                                    Open file in new tab
                                  </a>
                                `;
                                parent.appendChild(fallback);
                              }
                            }}
                          />
                        );
                      }
                    })()}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Attachment not available</p>
                  {complaint.attachment && (
                    <p className="text-sm text-muted-foreground">
                      Filename: {complaint.attachment}
                    </p>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

