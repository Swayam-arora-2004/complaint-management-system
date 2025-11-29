import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { StatusBadge } from "@/components/StatusBadge";
import { ChatBot } from "@/components/ChatBot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Paperclip, Trash2, RefreshCw } from "lucide-react";
import { getComplaintById, addCommentToComplaint, deleteComplaint, type Complaint } from "@/lib/complaints";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { getAuthToken } from "@/lib/auth";

export default function ComplaintDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [commentText, setCommentText] = useState("");
  const [showSatisfactionDialog, setShowSatisfactionDialog] = useState(false);
  const [showAttachmentViewer, setShowAttachmentViewer] = useState(false);
  const [isConfirmingSatisfaction, setIsConfirmingSatisfaction] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [previousStatus, setPreviousStatus] = useState<string | null>(null);
  const [satisfactionDialogShown, setSatisfactionDialogShown] = useState(false);
  const [attachmentBlobUrl, setAttachmentBlobUrl] = useState<string | null>(null);
  // Only users can comment - support agent comments come from backend

  const loadComplaint = async (showLoading = false) => {
    if (!id) return;
    
    if (showLoading) {
      setIsRefreshing(true);
    }
    
    try {
      const foundComplaint = await getComplaintById(id);
      if (foundComplaint) {
        const currentStatus = foundComplaint.status;
        const currentSatisfactionPending = foundComplaint.satisfactionPending || false;
        
        // Check if status changed from non-resolved to resolved
        const statusChangedToResolved = previousStatus && previousStatus !== 'resolved' && currentStatus === 'resolved';
        
        // Debug logging
        console.log('Complaint Status Check:', {
          currentStatus,
          previousStatus,
          statusChangedToResolved,
          satisfactionPending: currentSatisfactionPending,
          dialogShown: satisfactionDialogShown
        });
        
        setComplaint(foundComplaint);
        
        // Check if complaint is resolved and needs satisfaction confirmation
        // Show dialog when status is resolved AND satisfaction is pending
        if (currentStatus === 'resolved' && currentSatisfactionPending) {
          // Always show dialog if status is resolved and satisfaction is pending
          // Check if dialog is not already open to prevent multiple dialogs
          if (!showSatisfactionDialog) {
            console.log('Status is resolved with satisfaction pending - showing dialog', {
              currentStatus,
              currentSatisfactionPending,
              previousStatus,
              satisfactionDialogShown,
              showSatisfactionDialog
            });
            
            // Show toast notification
            toast({
              title: "Complaint Resolved",
              description: "Your complaint has been resolved. Please confirm your satisfaction.",
              duration: 5000,
            });
            
            // Show dialog immediately - use setTimeout to ensure state is set
            setTimeout(() => {
              setShowSatisfactionDialog(true);
              setSatisfactionDialogShown(true);
            }, 100);
          }
        } else if (currentStatus !== 'resolved') {
          // If status is not resolved, reset the dialog shown flag
          setSatisfactionDialogShown(false);
          setShowSatisfactionDialog(false);
        }
        
        // Update previous status after all checks
        setPreviousStatus(currentStatus);
      } else {
        toast({
          title: "Complaint Not Found",
          description: "The complaint you're looking for doesn't exist.",
          variant: "destructive",
        });
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load complaint",
        variant: "destructive",
      });
      navigate("/dashboard");
    } finally {
      if (showLoading) {
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    // Reset satisfaction dialog shown flag when component mounts or id changes
    // This ensures the dialog can show again if the complaint status changes
    setSatisfactionDialogShown(false);
    setShowSatisfactionDialog(false);
    setPreviousStatus(null);
    
    loadComplaint();
    
    // Auto-refresh when window gains focus (user switches back to tab)
    const handleFocus = () => {
      loadComplaint();
    };
    window.addEventListener('focus', handleFocus);
    
    // Auto-refresh every 10 seconds to check for status changes and new comments (faster for status changes)
    const refreshInterval = setInterval(() => {
      loadComplaint();
    }, 10000);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(refreshInterval);
    };
  }, [id, navigate, toast]);

  const handleAddComment = async () => {
    if (!commentText.trim() || !id) return;

    try {
      // Only users can add comments - support agent comments come from backend
      await addCommentToComplaint(id, {
        text: commentText.trim(),
        author: "User",
        authorType: "user",
      });

      // Reload complaint to show new comment
      await loadComplaint();

      setCommentText("");
      toast({
        title: "Comment Added",
        description: "Your comment has been added successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add comment",
        variant: "destructive",
      });
    }
  };

  const handleDeleteComplaint = async () => {
    if (!id) return;

    try {
      const deleted = await deleteComplaint(id);
      if (deleted) {
        toast({
          title: "Complaint Deleted",
          description: "Your complaint has been deleted successfully.",
        });
        navigate("/dashboard");
      } else {
        toast({
          title: "Error",
          description: "Failed to delete the complaint.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete the complaint.",
        variant: "destructive",
      });
    }
  };

  const handleConfirmSatisfaction = async (satisfied: boolean) => {
    if (!id) return;

    setIsConfirmingSatisfaction(true);
    try {
      await api.confirmSatisfaction(id, satisfied);

      setShowSatisfactionDialog(false);
      setSatisfactionDialogShown(true); // Mark as shown so it doesn't appear again
      
      if (satisfied) {
        toast({
          title: "Thank You!",
          description: "Your complaint has been closed. We appreciate your feedback!",
        });
        // Reload complaint to show updated status
        await loadComplaint();
      } else {
        toast({
          title: "Noted",
          description: "You can continue the conversation with our support team.",
        });
        // Reload complaint
        await loadComplaint();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to confirm satisfaction",
        variant: "destructive",
      });
    } finally {
      setIsConfirmingSatisfaction(false);
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

  if (!complaint) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="COMPLAINT MANAGEMENT SYSTEM" currentPage="Complaint Detail" />
        <main className="mx-auto max-w-4xl p-6">
          <p className="text-muted-foreground">Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header title="COMPLAINT MANAGEMENT SYSTEM" currentPage="Complaint Detail" />
      
      <main className="mx-auto max-w-4xl p-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-foreground">Complaint Detail</h2>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => loadComplaint(true)} 
              disabled={isRefreshing}
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
            {complaint.status === 'resolved' && complaint.satisfactionPending && !satisfactionDialogShown && (
              <Button 
                variant="default" 
                onClick={() => {
                  setShowSatisfactionDialog(true);
                  setSatisfactionDialogShown(true);
                }}
                size="sm"
              >
                Confirm Satisfaction
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Dashboard
            </Button>
            <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Complaint
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your complaint
                  "{complaint.subject}" and all its comments.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteComplaint} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          </div>
        </div>

        {/* Complaint Info */}
        <div className="rounded-lg border border-border bg-card p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Complaint ID</label>
              <p className="text-lg font-semibold text-foreground">{complaint.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Category</label>
              <p className="text-lg text-foreground">{complaint.category}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Priority</label>
              <p className="text-lg text-foreground capitalize">{complaint.priority}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Date</label>
              <p className="text-lg text-foreground">{formatDate(complaint.date)}</p>
            </div>
          </div>

          <div className="mb-6">
            <label className="text-sm font-medium text-muted-foreground block mb-2">Subject:</label>
            <p className="text-lg font-semibold text-foreground">{complaint.subject}</p>
          </div>

          <div className="mb-6">
            <label className="text-sm font-medium text-muted-foreground block mb-2">Description:</label>
            <p className="text-foreground leading-relaxed">{complaint.description}</p>
          </div>

          <div className="mb-6">
            <label className="text-sm font-medium text-muted-foreground block mb-2">Attachment:</label>
            {complaint.attachment || complaint.attachmentUrl ? (
              <div className="flex items-center gap-4">
                <button
                  onClick={async () => {
                    if (complaint.attachmentUrl) {
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
                  <Paperclip className="h-4 w-4" />
                  <span className="font-medium">{complaint.attachment || 'View Attachment'}</span>
                </button>
              </div>
            ) : (
              <p className="text-muted-foreground">No attachment</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-2">Status:</label>
            <StatusBadge status={complaint.status} />
          </div>
        </div>

        {/* Comments */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-xl font-semibold text-foreground mb-6">
            Comments ({complaint.comments?.length || 0})
          </h3>
          
          {complaint.comments && complaint.comments.length > 0 ? (
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
                            You
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
            <p className="text-muted-foreground mb-6 text-center py-4">
              No comments yet. Support team replies will appear here.
            </p>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-2">Add Comment</label>
              <Textarea
                placeholder="Type your comment here..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <Button onClick={handleAddComment} disabled={!commentText.trim()}>
              Add Comment
            </Button>
          </div>
        </div>
      </main>

      {/* Satisfaction Confirmation Dialog */}
      <AlertDialog 
        open={showSatisfactionDialog}
        onOpenChange={(open) => {
          // Only allow closing if user is confirming satisfaction (choosing an option)
          // Prevent closing by clicking outside or pressing ESC
          if (!open && !isConfirmingSatisfaction) {
            // Don't close - user must make a choice
            return;
          }
          setShowSatisfactionDialog(open);
        }}
      >
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Complaint Resolved</AlertDialogTitle>
            <AlertDialogDescription className="text-base pt-2">
              Your complaint has been marked as resolved by our support team. Are you satisfied with the resolution?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              • <strong>Yes</strong> - Close the complaint and mark it as completed<br/>
              • <strong>No</strong> - Continue the conversation with our support team
            </p>
          </div>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel 
              onClick={() => handleConfirmSatisfaction(false)}
              disabled={isConfirmingSatisfaction}
              className="mr-0"
            >
              No, Continue Conversation
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleConfirmSatisfaction(true)}
              disabled={isConfirmingSatisfaction}
              className="bg-primary"
            >
              {isConfirmingSatisfaction ? "Processing..." : "Yes, Close Complaint"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

      <ChatBot />
    </div>
  );
}
