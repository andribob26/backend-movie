import { Module } from '@nestjs/common';
import { PersonsService } from './persons.service';
import { PersonsController } from './persons.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Person } from 'src/entities/person.entity';
import { File } from 'src/entities/file.entity';

@Module({
  imports: [SequelizeModule.forFeature([Person, File])],
  providers: [PersonsService],
  controllers: [PersonsController],
})
export class PersonsModule {}
