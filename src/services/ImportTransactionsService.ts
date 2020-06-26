import fs from 'fs';
import csvParse from 'csv-parse';
import { getRepository, In } from 'typeorm';

import Category from '../models/Category';
import Transaction from '../models/Transaction';

interface TransactionSummary {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filepath: string): Promise<Transaction[]> {
    const categories: string[] = [];
    const transactions: TransactionSummary[] = [];

    const categoriesRepository = getRepository(Category);
    const transactionsRepository = getRepository(Transaction);

    const readStream = fs.createReadStream(filepath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readStream.pipe(parseStream);

    parseCSV.on('data', line => {
      const [title, type, value, category] = line;

      categories.push(category);
      transactions.push({
        title,
        type,
        value,
        category,
      });
    });

    await new Promise(resolve => parseCSV.on('end', resolve));

    const existentCategories = await categoriesRepository.find({
      where: {
        title: In(categories),
      },
    });

    const existentCategoriesTitles = existentCategories.map(
      (category: Category) => category.title,
    );

    const addCategoryTitles = categories
      .filter(category => !existentCategoriesTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoriesRepository.create(
      addCategoryTitles.map(title => ({
        title,
      })),
    );

    await categoriesRepository.save(newCategories);

    const finalCategories = [...existentCategories, ...newCategories];
    const createdTransactions = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionsRepository.save(createdTransactions);
    await fs.promises.unlink(filepath);

    return createdTransactions;
  }
}

export default ImportTransactionsService;
