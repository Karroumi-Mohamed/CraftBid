export interface User {
  id: number;
  name: string;
  email: string;
  roles: { id: number; name: string }[];
  email_verified_at: string | null;
  avatar?: string | null;
} 