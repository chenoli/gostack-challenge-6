import { getRepository, getCustomRepository } from 'typeorm';

import Category from '../models/Category';
import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome' | undefined;
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const categoriesRepository = getRepository(Category);
    const transactionRepository = getCustomRepository(TransactionsRepository);

    const balance = await transactionRepository.getBalance();

    if (type === 'outcome' && value > balance.total) {
      throw new AppError('Not enough balance!', 400);
    }

    let foundCategory = await categoriesRepository.findOne({
      where: {
        title: category,
      },
    });

    if (!foundCategory) {
      foundCategory = categoriesRepository.create({
        title: category,
      });

      await categoriesRepository.save(foundCategory);
    }

    const transaction = transactionRepository.create({
      title,
      category_id: foundCategory.id,
      type,
      value,
    });

    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
