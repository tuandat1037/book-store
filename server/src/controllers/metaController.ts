import { Request, Response } from 'express';
import { query } from '../config/db.js';

// Authors moved to authorController.ts (full CRUD).
export async function getPublishers(req: Request, res: Response) {
  try {
    const publishers = await query('SELECT * FROM publishers ORDER BY name ASC');
    res.json({ publishers });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
