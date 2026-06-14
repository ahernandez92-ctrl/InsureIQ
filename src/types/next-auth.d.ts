import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      npn?: string | null;
      state?: string | null;
    };
  }

  interface User {
    role?: string;
    npn?: string | null;
    state?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    npn?: string | null;
    state?: string | null;
  }
}