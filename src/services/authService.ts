import api, { AUTH_TOKEN_KEY } from "./apiService";
import type { LoginResponse, UserResponse } from "../features/types";

const persistAuthToken = (token?: string) => {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
};

const USER_KEY = "chatprett_user";

const normalizeUserResponse = (user: any): UserResponse => {
  if (!user) return user;
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    avatar_url: user.avatar_url || user.avatar,
    birthDate: user.birthDate || user.birthdate,
    createdAt: user.createdAt || user.created_at,
  } as UserResponse;
};

const persistUser = (user?: any) => {
  if (user) {
    const normalized = normalizeUserResponse(user);
    localStorage.setItem(USER_KEY, JSON.stringify(normalized));
  }
};

const clearUser = () => {
  localStorage.removeItem(USER_KEY);
};

// ====== REGISTER ======
// Llamamos al backend para crear usuario y recibir token propio
export async function registerUser(
  email: string,
  password: string,
  username: string,
  birthDate?: Date | null
): Promise<LoginResponse> {
  const response = await api.post<any>("/auth/register", {
    email,
    password,
    username,
    birthDate: birthDate ? birthDate.toISOString() : undefined,
  });

  const token = response.data?.token;
  persistAuthToken(token);
  persistUser(response.data?.user);

  return response.data as LoginResponse;
}

// ====== LOGIN ======
// Autenticamos contra el backend y guardamos token
export async function loginUser(
  email: string,
  password: string
): Promise<LoginResponse> {
  const response = await api.post<any>("/auth/login", {
    email,
    password,
  });

  const token = response.data?.token;
  persistAuthToken(token);

  persistUser(response.data?.user);

  return response.data as LoginResponse;
}

// ====== GET ME ======
export async function getMe(): Promise<UserResponse> {
  const response = await api.get<UserResponse>("/auth/me");
  return response.data;
}

// ====== UPDATE ME ======
export async function updateMe(payload: { username?: string; birthDate?: string | null }): Promise<UserResponse> {
  const response = await api.put<any>("/auth/me", payload);
  const user = response.data;
  persistUser(user);
  return normalizeUserResponse(user);
}

// ====== LOGOUT ======
export async function logoutUser(): Promise<void> {
  try {
    await api.post("/auth/logout");
  } catch {
    // ignore
  }
  localStorage.removeItem(AUTH_TOKEN_KEY);
  clearUser();
}

export { USER_KEY };