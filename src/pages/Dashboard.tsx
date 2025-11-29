import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { StatusBadge } from "@/components/StatusBadge";
import { ChatBot } from "@/components/ChatBot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { useNavigate } from "react-router-dom";
import { Search, Trash2, FileText } from "lucide-react";
import { getComplaints, deleteComplaint, type Complaint } from "@/lib/complaints";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [complaintId, setComplaintId] = useState("");
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all-status");

  const refreshComplaints = async () => {
    try {
      const allComplaints = await getComplaints();
      setComplaints(allComplaints);
      applyFilters(allComplaints, categoryFilter, statusFilter);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load complaints",
        variant: "destructive",
      });
    }
  };

  const applyFilters = (complaintsList: Complaint[], category: string, status: string) => {
    let filtered = [...complaintsList];

    // Filter by category
    if (category !== "all") {
      filtered = filtered.filter((c) => 
        c.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Filter by status
    if (status !== "all-status") {
      filtered = filtered.filter((c) => c.status === status);
    }

    setFilteredComplaints(filtered);
  };

  useEffect(() => {
    // Load complaints from backend
    refreshComplaints();
    
    // Refresh when window gains focus (in case complaint was added in another tab)
    const handleFocus = () => {
      refreshComplaints();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  useEffect(() => {
    applyFilters(complaints, categoryFilter, statusFilter);
  }, [categoryFilter, statusFilter, complaints]);

  const handleResetFilters = () => {
    setCategoryFilter("all");
    setStatusFilter("all-status");
    applyFilters(complaints, "all", "all-status");
  };

  const handleDeleteComplaint = async (id: string, subject: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when clicking delete
    
    try {
      const deleted = await deleteComplaint(id);
      if (deleted) {
        toast({
          title: "Complaint Deleted",
          description: `"${subject}" has been deleted successfully.`,
        });
        await refreshComplaints();
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

  return (
    <div className="min-h-screen bg-background">
      <Header title="COMPLAINT MANAGEMENT SYSTEM" hideDashboardButton showSubmitButton currentPage="Dashboard" />
      
      <main className="mx-auto max-w-7xl p-6">
        <h2 className="text-3xl font-bold text-foreground mb-8">My Complaints</h2>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Complaints</SelectItem>
              <SelectItem value="technical">Technical Issue</SelectItem>
              <SelectItem value="billing">Billing</SelectItem>
              <SelectItem value="general">General Inquiry</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-status">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button onClick={() => navigate("/submit")}>Submit Complaint</Button>
            <Button variant="outline" onClick={handleResetFilters}>Reset</Button>
          </div>
        </div>

        {/* Go to Complaint ID */}
        <div className="flex gap-2 items-center mb-6">
          <Input
            placeholder="Enter Complaint ID (e.g., C1234)"
            value={complaintId}
            onChange={(e) => setComplaintId(e.target.value)}
            className="max-w-xs"
          />
          <Button 
            onClick={() => complaintId && navigate(`/complaint/${complaintId}`)}
            disabled={!complaintId}
          >
            <Search className="h-4 w-4 mr-2" />
            Go to Complaint
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">ID</TableHead>
                <TableHead className="font-semibold">Subject</TableHead>
                <TableHead className="font-semibold">Category</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredComplaints.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {complaints.length === 0 
                      ? "No complaints yet. Submit a complaint to get started."
                      : "No complaints match the selected filters."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredComplaints.map((complaint) => (
                  <TableRow 
                    key={complaint.id} 
                    className="cursor-pointer hover:bg-muted/30"
                    onClick={() => navigate(`/complaint/${complaint.id}`)}
                  >
                    <TableCell className="font-medium">{complaint.id}</TableCell>
                    <TableCell>{complaint.subject}</TableCell>
                    <TableCell className="capitalize">{complaint.category.replace(/([A-Z])/g, " $1").trim()}</TableCell>
                    <TableCell>
                      <StatusBadge status={complaint.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{complaint.date}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the complaint
                              "{complaint.subject}" and all its comments.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={(e) => handleDeleteComplaint(complaint.id, complaint.subject, e)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

      </main>

      <ChatBot />
    </div>
  );
}
