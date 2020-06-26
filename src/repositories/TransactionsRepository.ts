import { Repository, getRepository, EntityRepository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactionsRepository = getRepository(Transaction);

    const transactions = await transactionsRepository.find();

    const income = transactions
      .filter(transaction => transaction.type === 'income')
      .reduce((sum, current) => {
        return sum + current.value;
      }, 0);

    const outcome = transactions
      .filter(transaction => transaction.type === 'outcome')
      .reduce((sum, current) => {
        return sum + current.value;
      }, 0);

    const total = income - outcome;

    return {
      income,
      outcome,
      total,
    };
  }
}

export default TransactionsRepository;
