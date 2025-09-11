import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Media } from '../schemas/media.schema';
import { v2 as cloudinary } from 'cloudinary';
type Uploaded = any;

@Injectable()
export class MediaService {
  constructor(@InjectModel(Media.name) private readonly mediaModel: Model<Media>) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async upload(file: Uploaded, meta: any) {
    let url = meta.url || '';
    if (file && file.buffer) {
      url = await new Promise<string>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ resource_type: 'auto' }, (err, result) => {
          if (err) return reject(err);
          resolve(result?.secure_url || result?.url || '');
        });
        stream.end(file.buffer);
      });
    }
    return this.mediaModel.create({ ...meta, url });
  }

  findById(id: string) {
    return this.mediaModel.findById(id).lean();
  }
}


