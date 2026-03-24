import 'express';

declare module 'express-serve-static-core' {
  interface User {
    id: string;
    email: string;
    role: string;
    permissions: string[];
  }

  interface Request {
    user?: User;
  }
}