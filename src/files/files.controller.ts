import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Req,
  Res,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { lookup as mimeLookup } from 'mime-types';
import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs';
import * as fileType from 'file-type';

@Controller('files')
export class FilesController {
  @Get('*')
  async getFile(@Req() req: Request, @Res() res: Response) {
    const { w: width, h: height } = req.query;

    // Jika backend pakai globalPrefix /api
    const urlPath = req.url.replace(/^\/api\/files\//, '').split('?')[0];

    const baseDir = path.resolve(process.cwd(), 'files');
    const filePath = path.join(baseDir, urlPath);
    const resolvedPath = path.resolve(filePath);

    if (!resolvedPath.startsWith(baseDir)) {
      throw new ForbiddenException('Access denied');
    }

    if (!fs.existsSync(resolvedPath)) {
      throw new NotFoundException('File not found');
    }

    // ==== 🔹 Tambahan: dukung SRT ====
    const allowedImageTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/avif',
    ];
    const allowedImageExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];

    const allowedSubtitleExt = ['.srt'];
    const allowedSubtitleTypes = ['application/x-subrip', 'text/plain'];

    const ext = path.extname(resolvedPath).toLowerCase();

    // MIME lookup (fallback untuk SRT)
    let mimeType =
      mimeLookup(resolvedPath) ||
      (ext === '.srt' ? 'application/x-subrip' : '');

    const isImage = allowedImageExt.includes(ext);
    const isSubtitle = allowedSubtitleExt.includes(ext);

    if (!isImage && !isSubtitle) {
      throw new ForbiddenException('Only image or subtitle files are allowed');
    }

    // ==== 🖼️ Jika IMAGE → validasi magic bytes + resize ====
    if (isImage) {
      const buffer = fs.readFileSync(resolvedPath);
      const type = await fileType.fromBuffer(buffer);

      if (!type || !allowedImageTypes.includes(type.mime)) {
        throw new ForbiddenException('File content is not a valid image');
      }

      const isResizeRequested = width || height;
      if (isResizeRequested) {
        const w = width ? parseInt(width as string, 10) : null;
        const h = height ? parseInt(height as string, 10) : null;

        const maxSize = 2000;
        if ((w && w > maxSize) || (h && h > maxSize)) {
          throw new BadRequestException(`Max width/height is ${maxSize}`);
        }

        const image = sharp(resolvedPath);
        if (w && h) image.resize(w, h);
        else if (w) image.resize(w);
        else if (h) image.resize(null, h);

        res.type(type.mime);
        return image.pipe(res);
      }

      res.type(type.mime);
      return fs.createReadStream(resolvedPath).pipe(res);
    }

    // ==== 🎬 Jika SRT → stream apa adanya ====
    if (isSubtitle) {
      // Pastikan dikirim sebagai text
      res.type(mimeType || 'text/plain; charset=utf-8');
      return fs.createReadStream(resolvedPath).pipe(res);
    }
  }
}
