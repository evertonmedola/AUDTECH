import * as dotenv from 'dotenv';
dotenv.config();

import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import * as path from 'path';

const EXTENSOES_PERMITIDAS = ['.jpg', '.jpeg', '.png', '.pdf'];
const TAMANHO_MAXIMO = 10 * 1024 * 1024;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (_req, file) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isPdf = ext === '.pdf';
    return {
      folder: 'audtech/evidencias',
      resource_type: isPdf ? 'raw' : 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
      transformation: isPdf ? undefined : [{ quality: 'auto', fetch_format: 'auto' }],
    };
  },
});

export const multerEvidenciaConfig: MulterOptions = {
  storage,
  limits: { fileSize: TAMANHO_MAXIMO },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!EXTENSOES_PERMITIDAS.includes(ext)) {
      return cb(
        new BadRequestException(
          `Formato inválido. Arquivos permitidos: ${EXTENSOES_PERMITIDAS.join(', ')}`,
        ),
        false,
      );
    }
    cb(null, true);
  },
};

export { cloudinary };