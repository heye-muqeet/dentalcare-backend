import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Expense } from '../schemas/expense.schema';

@Injectable()
export class ExpensesService {
  constructor(@InjectModel(Expense.name) private readonly expenseModel: Model<Expense>) {}

  list(organization: string, filters: any, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const query: any = { organization, deletedAt: 0 };
    if (filters.category) query.category = filters.category;
    if (filters.startDate || filters.endDate) {
      query.date = {};
      if (filters.startDate) query.date.$gte = parseInt(filters.startDate, 10);
      if (filters.endDate) query.date.$lte = parseInt(filters.endDate, 10);
    }
    return this.expenseModel.find(query).skip(skip).limit(limit).lean();
  }

  private generateExpenseNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 9000 + 1000);
    return `EXP-${year}${month}-${random}`;
  }

  create(payload: Partial<Expense>) {
    const expenseNumber = this.generateExpenseNumber();
    const date = Date.now();
    return this.expenseModel.create({ ...payload, expenseNumber, date });
  }

  async summary(organization: string) {
    return this.expenseModel.aggregate([
      { $match: { organization } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
    ]);
  }
}


