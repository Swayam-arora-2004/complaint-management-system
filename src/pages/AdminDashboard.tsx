import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { api, type ApiComplaint } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [complaints, setComplaints] = useState<ApiComplaint[]>([]);
  const [openComplaints, setOpenComplaints] = useState<ApiComplaint[]>([]);
  const [closedComplaints, setClosedComplaints] = useState<ApiComplaint[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "priority" | "status">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshComplaints = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api"}/admin/complaints`, {
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
        throw new Error('Failed to fetch complaints');
      }

      const data = await response.json();
      
      if (!data.ok) {
        throw new Error(data.message || 'Failed to load complaints');
      }

      const allComplaints = (data.data || []).map((c: any) => ({
        id: c._id,
        subject: c.subject,
        category: c.category,
        priority: c.priority,
        description: c.description,
        status: c.status,
        date: c.createdAt ? new Date(c.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        attachment: c.attachment?.filename,
        attachmentUrl: c.attachment ? `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api"}/complaints/${c._id}/attachments/${c.attachment.filename}` : undefined,
        comments: c.comments || [],
      }));

      setComplaints(allComplaints);
      applyFiltersAndSort(allComplaints);
    } catch (error: any) {
      console.error('Error loading complaints:', error);
      setError(error.message || "Failed to load complaints");
      toast({
        title: "Error",
        description: error.message || "Failed to load complaints",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFiltersAndSort = (complaintsList: ApiComplaint[]) => {
    let filtered = [...complaintsList];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((c) =>
        c.subject.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        c.id.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((c) => c.category === categoryFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "date") {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortBy === "priority") {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        comparison = (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
                     (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
      } else if (sortBy === "status") {
        const statusOrder = { new: 1, 'in-progress': 2, resolved: 3, closed: 4 };
        comparison = (statusOrder[a.status as keyof typeof statusOrder] || 0) - 
                     (statusOrder[b.status as keyof typeof statusOrder] || 0);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    // Separate open and closed
    const open = filtered.filter((c) => c.status !== 'closed');
    const closed = filtered.filter((c) => c.status === 'closed');

    setOpenComplaints(open);
    setClosedComplaints(closed);
  };

  useEffect(() => {
    if (!authLoading && user && (user.role === 'admin' || user.role === 'support_agent')) {
      refreshComplaints();
    } else if (!authLoading && user && user.role !== 'admin' && user.role !== 'support_agent') {
      // Redirect if not admin
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    applyFiltersAndSort(complaints);
  }, [searchQuery, categoryFilter, statusFilter, sortBy, sortOrder, complaints]);

  const renderComplaintsTable = (complaintsList: ApiComplaint[], title: string) => (
    <div className="mb-8">
      <h3 className="text-xl font-semibold text-foreground mb-4">{title} ({complaintsList.length})</h3>
      {complaintsList.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No {title.toLowerCase()} complaints</p>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">ID</TableHead>
                <TableHead className="font-semibold">Subject</TableHead>
                <TableHead className="font-semibold">Category</TableHead>
                <TableHead className="font-semibold">Priority</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {complaintsList.map((complaint) => (
                <TableRow
                  key={complaint.id}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => navigate(`/admin/complaint/${complaint.id}`)}
                >
                  <TableCell className="font-medium">{complaint.id}</TableCell>
                  <TableCell>{complaint.subject}</TableCell>
                  <TableCell className="capitalize">{complaint.category}</TableCell>
                  <TableCell className="capitalize">{complaint.priority}</TableCell>
                  <TableCell>
                    <StatusBadge status={complaint.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{complaint.date}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/complaint/${complaint.id}`)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header title="COMPLAINT MANAGEMENT SYSTEM - ADMIN" currentPage="Admin Dashboard" />
      
      <main className="mx-auto max-w-7xl p-6">
        <h2 className="text-3xl font-bold text-foreground mb-8">Admin Dashboard</h2>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg">
            <p className="text-destructive">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshComplaints}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        )}

        {isLoading && !error && (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading complaints...</p>
          </div>
        )}

        {/* Search and Filters */}
        {!isLoading && (
          <div className="flex flex-col gap-4 mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by subject, description, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="billing">Billing</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as any)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Descending</SelectItem>
                <SelectItem value="asc">Ascending</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => {
              setSearchQuery("");
              setCategoryFilter("all");
              setStatusFilter("all");
              setSortBy("date");
              setSortOrder("desc");
            }}>
              Reset
            </Button>
          </div>
        </div>
        )}

        {!isLoading && !error && (
          <>
            {/* Open Complaints Section */}
            {renderComplaintsTable(openComplaints, "Open Complaints")}

            {/* Closed Complaints Section */}
            {renderComplaintsTable(closedComplaints, "Closed Complaints")}
          </>
        )}
      </main>
    </div>
  );
}

