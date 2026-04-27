import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "../config/firebase";
import api from "./apiService";
import type { LoginResponse, UserResponse } from "../features/types";

// ====== REGISTER ======
// 1. Crea usuario en Firebase
// 2. Llama al backend para crear perfil en MongoDB
export async function registerUser(
  email: string,
  password: string,
  username: string
): Promise<LoginResponse> {
  // 1. Crear en Firebase
  const firebaseUser = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  try {
    // 2. Crear perfil en nuestro backend
    const response = await api.post<LoginResponse>("/auth/register", {
      username,
    });

    return response.data;
  } catch (error) {
    // Si falla el backend, eliminamos el usuario de Firebase para no dejar basura
    await firebaseUser.user.delete();
    throw error;
  }
}

// ====== LOGIN ======
// 1. Autentica con Firebase
// 2. Llama al backend para obtener perfil de MongoDB
export async function loginUser(
  email: string,
  password: string
): Promise<LoginResponse> {
  // 1. Login en Firebase
  await signInWithEmailAndPassword(auth, email, password);

  // 2. Obtener perfil del backend
  const response = await api.post<LoginResponse>("/auth/login");

  return response.data;
}

// ====== GET ME ======
export async function getMe(): Promise<UserResponse> {
  const response = await api.get<UserResponse>("/auth/me");
  return response.data;
}

// ====== LOGOUT ======
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}