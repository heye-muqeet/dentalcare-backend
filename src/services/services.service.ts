import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Service } from '../schemas/service.schema';

@Injectable()
export class ServicesService {
  constructor(@InjectModel(Service.name) private readonly serviceModel: Model<Service>) {}

  list(organization: string) {
    return this.serviceModel.find({ organization }).lean();
  }

  create(payload: Partial<Service>) {
    return this.serviceModel.create(payload);
  }
}


