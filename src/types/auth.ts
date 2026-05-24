export interface AuthTokenPayload {
  sub: number;
  email: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  username: string;
  name: string;
  bio?: string | null;
  avatar?: string | null;
  headline?: string | null;
}