import { JwtPayload } from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload; // Solo el payload (id_usuario, email, nombre_completo)
    }
  }
}