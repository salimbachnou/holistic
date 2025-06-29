/**
 * Type definitions for the application
 */

// User types
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'client' | 'professional' | 'admin';
  profileImage?: string;
  phone?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Professional extends User {
  role: 'professional';
  profession: string;
  specializations: string[];
  bio?: string;
  address?: string;
  businessHours?: BusinessHour[];
  services?: Service[];
  rating?: {
    average: number;
    totalReviews: number;
  };
  contactInfo?: {
    phone: string;
    website?: string;
    socialMedia?: {
      instagram?: string;
      facebook?: string;
      twitter?: string;
      linkedin?: string;
    };
  };
}

export interface Client extends User {
  role: 'client';
  favoriteIds?: string[];
  favorites?: Professional[];
}

export interface Admin extends User {
  role: 'admin';
  permissions: string[];
}

// Authentication types
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface ProfessionalRegisterData extends RegisterData {
  profession: string;
  specializations: string;
  phone: string;
}

// Service types
export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  professionalId: string;
  createdAt: string;
  updatedAt: string;
}

// Booking types
export interface Booking {
  id: string;
  clientId: string;
  professionalId: string;
  serviceId: string;
  date: string;
  time: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  client?: Client;
  professional?: Professional;
  service?: Service;
}

// Product types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  professionalId: string;
  category: string;
  tags: string[];
  status: 'available' | 'out_of_stock' | 'discontinued';
  createdAt: string;
  updatedAt: string;
  professional?: Professional;
}

// Review types
export interface Review {
  id: string;
  clientId: string;
  professionalId: string;
  serviceId?: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  client?: Client;
  professional?: Professional;
  service?: Service;
}

// UI types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

export interface UIState {
  loading: boolean;
  notification: Notification | null;
  error: string | null;
}

// Utility types
export interface BusinessHour {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Redux action types
export interface Action<T = any> {
  type: string;
  payload?: T;
  error?: boolean;
  meta?: any;
}

// Form types
export interface FormValues {
  [key: string]: any;
}

export interface FormErrors {
  [key: string]: string;
}

export interface FormTouched {
  [key: string]: boolean;
}

export interface UseFormResult {
  values: FormValues;
  errors: FormErrors;
  touched: FormTouched;
  isSubmitting: boolean;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (event?: React.FormEvent<HTMLFormElement>) => Promise<void>;
  resetForm: (newValues?: FormValues) => void;
  setFieldValue: (name: string, value: any) => void;
  setMultipleFields: (newValues: FormValues) => void;
  hasError: (name: string) => boolean;
  getErrorMessage: (name: string) => string | null;
}
