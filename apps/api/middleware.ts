import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization || req.get('Authorization');
  try {
    console.log(header);
    let data = jwt.verify(header, process.env.JWT_SECRET!) as jwt.JwtPayload;
    req.userId = data.sub as string;
    next();
  } catch (e) {
    res.status(403).send('');
  }
}
