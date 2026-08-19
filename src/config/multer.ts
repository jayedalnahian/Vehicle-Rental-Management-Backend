import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { env } from './env';
import { BadRequestError } from '../utils/errors';

const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export const uploadDirectory = path.resolve(env.uploadPath);

fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDirectory),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${base}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (
      !ALLOWED_IMAGE_MIME_TYPES.includes(
        file.mimetype as (typeof ALLOWED_IMAGE_MIME_TYPES)[number],
      )
    ) {
      cb(new BadRequestError('Only image files are allowed'));
      return;
    }
    cb(null, true);
  },
});