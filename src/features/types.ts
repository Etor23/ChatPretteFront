// ====== Modelos que coinciden con el backend ======
export interface UserResponse {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  birthDate?: string | Date;
  createdAt?: string | Date;
}

export interface LoginResponse {
  user: UserResponse;
  is_new: boolean;
}

// ====== Estado del auth en el frontend ======
export interface AuthState {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ====== Forms ======
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  birthDate: Date | null;
}