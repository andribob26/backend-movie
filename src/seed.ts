import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Sequelize } from 'sequelize-typescript';
import countriesJsonRaw from '../countries-data.json';
import genresJsonRaw from '../genres-data.json';
import ageRatingsJsonRaw from '../rating-age.json';
import { Country } from './entities/country.entity';
import { InferCreationAttributes } from 'sequelize';
import { Genre } from './entities/genre.entity';
import { AgeRating } from './entities/age-rating.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const sequelize = app.get(Sequelize);

  // Pastikan ambil default jika diperlukan
  const countriesJson = (countriesJsonRaw as any)?.default ?? countriesJsonRaw;

  try {
    await sequelize.authenticate();
    console.log('Database connected');

    // bulk insert / update
    // await Country.bulkCreate(
    //   countriesJson.map((country: any) => ({
    //     name: country.name,
    //     code: country.code,
    //   })) as InferCreationAttributes<Country>[],
    //   {
    //     updateOnDuplicate: ['name', 'code'], // field yang diupdate kalau duplikat
    //   },
    // );

    // await Genre.bulkCreate(
    //   genresJsonRaw.map((genre: any) => ({
    //     name: genre.name,
    //   })) as InferCreationAttributes<Genre>[],
    //   {
    //     updateOnDuplicate: ['name'], // field yang diupdate kalau duplikat
    //   },
    // );

    await AgeRating.bulkCreate(
      ageRatingsJsonRaw.map((aRating: any) => ({
        name: aRating.name,
        code: aRating.code,
        category: aRating.category,
      })) as InferCreationAttributes<AgeRating>[],
      {
        updateOnDuplicate: ['name'], // field yang diupdate kalau duplikat
      },
    );

    console.log('Seeding done!');
  } catch (err) {
    console.error('Seeding failed', err);
  } finally {
    await app.close();
  }
}

bootstrap();
