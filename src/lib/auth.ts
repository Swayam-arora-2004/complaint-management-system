// Authentication service for backend API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";

export interface AuthResponse {
  ok: boolean;
  message: string;
  data?: {
    token: string;
    user: {
      id: string;
      name: string;
      email: string;
      role?: 'user' | 'support_agent' | 'admin';
    };
  };
}

// Store token in localStorage
export const setAuthToken = (token: string) => {
  localStorage.setItem('auth_token', token);
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

export const removeAuthToken = () => {
  localStorage.removeItem('auth_token');
};

// Register user
export const register = async (name: string, email: string, password: string): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, email, password }),
  });

  const data = await response.json();
  
  if (data.ok && data.data?.token) {
    setAuthToken(data.data.token);
  }
  
  return data;
};

// Login user (supports both email and admin username)
export const login = async (emailOrUsername: string, password: string): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: emailOrUsername, password }),
  });

  const data = await response.json();
  
  if (data.ok && data.data?.token) {
    setAuthToken(data.data.token);
  }
  
  return data;
};

// Google OAuth login
export const googleLogin = async (googleId: string, email: string, name: string): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/google`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ googleId, email, name }),
  });

  const data = await response.json();
  
  if (data.ok && data.data?.token) {
    setAuthToken(data.data.token);
  }
  
  return data;
};

// Apple OAuth login
export const appleLogin = async (appleId: string, email: string, name: string): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/apple`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ appleId, email, name }),
  });

  const data = await response.json();
  
  if (data.ok && data.data?.token) {
    setAuthToken(data.data.token);
  }
  
  return data;
};

// Get current user
export const getCurrentUser = async () => {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      removeAuthToken();
      return null;
    }

    const data = await response.json();
    return data.ok ? data.data : null;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
};

// Logout
export const logout = () => {
  removeAuthToken();
};

