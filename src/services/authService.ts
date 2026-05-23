import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "../config/firebase";
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
    birthDate: user.birthDate || user.birthdate || user.birth_date,
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

// ====== GOOGLE LOGIN ======
export async function loginWithGoogle(): Promise<LoginResponse> {
  let firebaseUser;

  try {
    const result = await signInWithPopup(auth, googleProvider);
    firebaseUser = result.user;
  } catch (err: any) {
    // COOP puede bloquear window.closed pero Firebase puede haber autenticado al usuario
    if (auth.currentUser) {
      firebaseUser = auth.currentUser;
    } else {
      throw err;
    }
  }

  const idToken = await firebaseUser.getIdToken(true);
  const response = await api.post<any>("/auth/google", { idToken });

  // El backend valida Firebase ID tokens directamente (no emite JWT propio).
  // Guardamos el idToken para PrivateRoute; el interceptor siempre renueva el token vía auth.currentUser.
  persistAuthToken(response.data?.token ?? idToken);
  persistUser(response.data?.user);

  return response.data as LoginResponse;
}

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
    birth_date: birthDate ? birthDate.toISOString().split("T")[0] : undefined,
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
  const storedUser = localStorage.getItem(USER_KEY);
  const userId = storedUser ? JSON.parse(storedUser).id : null;
  if (!userId) throw new Error("Usuario no autenticado");

  const body: Record<string, any> = {};
  if (payload.username !== undefined) body.username = payload.username;
  if (payload.birthDate !== undefined) body.birth_date = payload.birthDate;

  const response = await api.put<any>(`/users/${userId}`, body);
  const user = response.data;
  persistUser(user);
  return normalizeUserResponse(user);
}

// ====== AVATAR ======
export async function uploadAvatar(userId: string, file: File): Promise<UserResponse> {
  const formData = new FormData();
  formData.append("avatar", file);

  // Content-Type debe ser undefined para que el browser lo ponga con el boundary correcto
  const response = await api.post<any>(`/users/${userId}/avatar`, formData, {
    headers: { "Content-Type": undefined },
  });

  const user = normalizeUserResponse(response.data);
  persistUser(user);
  return user;
}

// ====== LOGOUT ======
export async function logoutUser(): Promise<void> {
  try {
    await api.post("/auth/logout");
  } catch {
    // ignore
  }
  await signOut(auth).catch(() => {});
  localStorage.removeItem(AUTH_TOKEN_KEY);
  clearUser();
}

export { USER_KEY };