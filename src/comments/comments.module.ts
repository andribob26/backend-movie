import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Comment } from 'src/entities/comment.entity';

@Module({
  imports: [SequelizeModule.forFeature([Comment])],
  providers: [CommentsService],
})
export class CommentsModule {}
