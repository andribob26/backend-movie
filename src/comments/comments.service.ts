import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BaseResponse } from 'src/commons/interfaces/base-response.interface';
import { Comment } from 'src/entities/comment.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment)
    private readonly commentModel: typeof Comment,
  ) {}

  // async send(data: any): Promise<BaseResponse<Comment>> {
  // //   const transaction = await this.sequelize.transaction();

  // return
  // }
}
