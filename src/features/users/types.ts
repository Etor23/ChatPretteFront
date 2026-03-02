// Users types
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  status?: 'online' | 'offline' | 'away';
  lastSeen?: Date;
}

export interface UserState {
  users: User[];
  currentUser: User | null;
  isLoading: boolean;
}
