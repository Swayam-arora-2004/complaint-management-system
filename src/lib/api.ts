// API service layer for backend integration
import { getAuthToken } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";

export interface ApiComplaint {
  id: string;
  subject: string;
  category: string;
  priority: string;
  description: string;
  status: "new" | "in-progress" | "resolved" | "closed";
  date: string;
  attachment?: string;
  attachmentUrl?: string; // URL to download attachment from backend
  comments?: ApiComment[];
  satisfactionPending?: boolean;
}

export interface ApiComment {
  id: string;
  text: string;
  author: string;
  authorType: "user" | "support_agent";
  timestamp: string;
  parentCommentId?: string; // For reply threads
}

// API functions - Connected to backend
export const api = {
  // Complaints
  getComplaints: async (): Promise<ApiComplaint[]> => {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/complaints`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required');
      }
      throw new Error('Failed to fetch complaints');
    }

    const data = await response.json();
    // Transform MongoDB _id to id and format date
    return data.data.map((complaint: any) => ({
      id: complaint._id,
      subject: complaint.subject,
      category: complaint.category,
      priority: complaint.priority,
      description: complaint.description,
      status: complaint.status,
      date: complaint.createdAt ? new Date(complaint.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      attachment: complaint.attachment?.filename,
      attachmentUrl: complaint.attachment ? `${API_BASE_URL}/complaints/${complaint._id}/attachments/${complaint.attachment.filename}` : undefined,
      comments: complaint.comments?.map((c: any) => ({
        id: c._id || c.id,
        text: c.text,
        author: c.author,
        authorType: c.authorType || 'user',
        timestamp: c.timestamp || new Date().toISOString(),
      })) || [],
      satisfactionPending: complaint.satisfactionPending || false,
    }));
  },

  getComplaintById: async (id: string): Promise<ApiComplaint | null> => {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/complaints/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      if (response.status === 401) throw new Error('Authentication required');
      throw new Error('Failed to fetch complaint');
    }

    const data = await response.json();
    const complaint = data.data;
    
    return {
      id: complaint._id,
      subject: complaint.subject,
      category: complaint.category,
      priority: complaint.priority,
      description: complaint.description,
      status: complaint.status,
      date: complaint.createdAt ? new Date(complaint.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      attachment: complaint.attachment?.filename,
      attachmentUrl: complaint.attachment ? `${API_BASE_URL}/complaints/${complaint._id}/attachments/${complaint.attachment.filename}` : undefined,
      comments: complaint.comments?.map((c: any) => ({
        id: c._id || c.id,
        text: c.text,
        author: c.author,
        authorType: c.authorType || 'user',
        timestamp: c.timestamp || new Date().toISOString(),
      })) || [],
      satisfactionPending: complaint.satisfactionPending || false,
    };
  },

  createComplaint: async (complaint: Omit<ApiComplaint, "id" | "status" | "date" | "comments">, attachment?: File): Promise<ApiComplaint> => {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const formData = new FormData();
    formData.append('subject', complaint.subject);
    formData.append('category', complaint.category);
    formData.append('priority', complaint.priority);
    formData.append('description', complaint.description);
    
    if (attachment) {
      formData.append('attachment', attachment);
    }

    const response = await fetch(`${API_BASE_URL}/complaints`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create complaint');
    }

    const data = await response.json();
    const created = data.data;
    
    return {
      id: created._id,
      subject: created.subject,
      category: created.category,
      priority: created.priority,
      description: created.description,
      status: created.status,
      date: created.createdAt ? new Date(created.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      attachment: created.attachment?.filename,
      attachmentUrl: created.attachment ? `${API_BASE_URL}/complaints/${created._id}/attachments/${created.attachment.filename}` : undefined,
      comments: [],
    };
  },

  updateComplaintStatus: async (id: string, status: ApiComplaint["status"]): Promise<void> => {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/complaints/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update status');
    }
  },

  deleteComplaint: async (id: string): Promise<void> => {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/complaints/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete complaint');
    }
  },

  // Comments
  addComment: async (complaintId: string, text: string): Promise<ApiComment> => {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/complaints/${complaintId}/comments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add comment');
    }

    const data = await response.json();
    const comment = data.data;
    
    return {
      id: comment._id || comment.id,
      text: comment.text,
      author: comment.author,
      authorType: comment.authorType || 'user',
      timestamp: comment.timestamp || new Date().toISOString(),
    };
  },

  // Attachments
  getAttachmentUrl: (complaintId: string, filename: string): string => {
    return `${API_BASE_URL}/complaints/${complaintId}/attachments/${filename}`;
  },

  // Satisfaction confirmation
  confirmSatisfaction: async (complaintId: string, satisfied: boolean): Promise<void> => {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}/complaints/${complaintId}/confirm-satisfaction`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ satisfied }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to confirm satisfaction');
    }
  },
};

