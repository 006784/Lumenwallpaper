export interface SessionUser {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
}

export interface FrameSession {
  user: SessionUser;
  expiresAt: string;
}
