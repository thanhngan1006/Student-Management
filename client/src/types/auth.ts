export type Role = "admin" | "student" | "advisor";

export interface User {
  id: string;
  name: string;
  role: Role;
  username: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
