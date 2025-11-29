import { api } from './api';
import type { ApiComplaint, ApiComment } from './api';

export interface Complaint {
  id: string;
  subject: string;
  category: string;
  priority: string;
  description: string;
  status: "new" | "in-progress" | "resolved" | "closed";
  date: string;
  attachment?: string;
  attachmentUrl?: string; // URL to download attachment from backend
  comments?: Comment[];
  satisfactionPending?: boolean;
}

export interface Comment {
  id: string;
  text: string;
  author: string;
  authorType?: "user" | "support_agent"; // Distinguish user vs support agent
  timestamp: string;
  parentCommentId?: string; // For reply threads
}

// Get all complaints from backend API
export const getComplaints = async (): Promise<Complaint[]> => {
  try {
    return await api.getComplaints();
  } catch (error) {
    console.error("Error fetching complaints:", error);
    return [];
  }
};

// Save a new complaint to backend
export const saveComplaint = async (
  complaintData: Omit<Complaint, "id" | "status" | "date" | "comments">,
  attachmentFile?: File
): Promise<Complaint> => {
  try {
    return await api.createComplaint(complaintData, attachmentFile);
  } catch (error) {
    console.error("Error creating complaint:", error);
    throw error;
  }
};

// Get a specific complaint by ID from backend
export const getComplaintById = async (id: string): Promise<Complaint | undefined> => {
  try {
    return await api.getComplaintById(id) || undefined;
  } catch (error) {
    console.error("Error fetching complaint:", error);
    return undefined;
  }
};

// Add a comment to a complaint via backend
export const addCommentToComplaint = async (
  complaintId: string, 
  comment: Omit<Comment, "id" | "timestamp">
): Promise<void> => {
  try {
    await api.addComment(complaintId, comment.text);
  } catch (error) {
    console.error("Error adding comment:", error);
    throw error;
  }
};

// Update complaint status via backend
export const updateComplaintStatus = async (
  complaintId: string, 
  status: Complaint["status"]
): Promise<void> => {
  try {
    await api.updateComplaintStatus(complaintId, status);
  } catch (error) {
    console.error("Error updating status:", error);
    throw error;
  }
};

// Delete a complaint via backend
export const deleteComplaint = async (complaintId: string): Promise<boolean> => {
  try {
    await api.deleteComplaint(complaintId);
    return true;
  } catch (error) {
    console.error("Error deleting complaint:", error);
    return false;
  }
};

