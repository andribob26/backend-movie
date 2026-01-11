import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { BaseResponse } from 'src/commons/interfaces/base-response.interface';
import { Movie } from 'src/entities/movie.entity';
import { InjectModel } from '@nestjs/sequelize';
import { Genre } from 'src/entities/genre.entity';
import { Country } from 'src/entities/country.entity';
import { Video } from 'src/entities/video.entity';
import { Model, Sequelize } from 'sequelize-typescript';
import { File } from 'src/entities/file.entity';
import { InferCreationAttributes, Op } from 'sequelize';
import { AgeRating } from 'src/entities/age-rating.entity';
import {
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
  S3Client,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { ConfigService } from '@nestjs/config';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import * as https from 'https';
import { Subtitle } from 'src/entities/subtitle.entity';
import { MovieGenre } from 'src/entities/movie-genre.entity';
import { Character } from 'src/entities/character.entity';
import { PaginationResponse } from 'src/commons/interfaces/pagination-response.interface';
import { Person } from 'src/entities/person.entity';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { VideoAlternative } from 'src/entities/video-alternative.entity';

const NAME = 'Movie';

@Injectable()
export class MoviesService {
  private s3: S3Client;
  private bucket: string;
  constructor(
    @InjectModel(Movie)
    private readonly movieModel: typeof Movie,
    @InjectModel(Character)
    private readonly characterModel: typeof Character,
    @InjectModel(Country)
    private readonly countryModel: typeof Country,
    @InjectModel(AgeRating)
    private readonly ageRatingModel: typeof AgeRating,
    @InjectModel(File)
    private readonly fileModel: typeof File,
    @InjectModel(Video)
    private readonly videoModel: typeof Video,
    @InjectModel(Subtitle)
    private readonly subtitleModel: typeof Subtitle,
    @InjectModel(MovieGenre)
    private readonly movieGenreModel: typeof MovieGenre,
    @InjectModel(VideoAlternative)
    private readonly videoAlternativeModel: typeof VideoAlternative,
    private readonly sequelize: Sequelize,
    private readonly configService: ConfigService,
  ) {
    const accessKeyId = this.configService.get('OBJECT_STORAGE_KEY');
    const secretAccessKey = this.configService.get('OBJECT_STORAGE_SECRET');
    const endpoint = this.configService.get('OBJECT_STORAGE_ENDPOINT');
    const region = this.configService.get('OBJECT_STORAGE_REGION');
    this.bucket = this.configService.get('OBJECT_STORAGE_BUCKET') ?? '';

    if (!accessKeyId || !secretAccessKey || !endpoint) {
      throw new Error(`Missing credentials for object storage`);
    }

    this.s3 = new S3Client({
      region: region ?? 'auto',
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
      requestHandler: new NodeHttpHandler({
        httpsAgent: new https.Agent({
          keepAlive: true,
          maxSockets: 50,
        }),
      }),
    });
  }

  private streamToString(stream: Readable): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    });
  }

  private async getDurationFromS3(
    bucket: string,
    key: string,
  ): Promise<string | null> {
    try {
      const command = new GetObjectCommand({ Bucket: bucket, Key: key });
      const response = await this.s3.send(command);

      if (!response.Body) {
        throw new Error('Empty response body');
      }

      const content = await this.streamToString(response.Body as Readable);

      const totalSeconds = content
        .split('\n')
        .filter((line) => line.startsWith('#EXTINF:'))
        .map((line) =>
          parseFloat(line.replace('#EXTINF:', '').replace(',', '').trim()),
        )
        .reduce((acc, val) => acc + val, 0);

      if (!isFinite(totalSeconds) || totalSeconds <= 0) {
        throw new Error('Invalid or empty EXTINF duration');
      }

      const rounded = Math.round(totalSeconds);
      const hours = Math.floor(rounded / 3600);
      const minutes = Math.floor((rounded % 3600) / 60);
      const seconds = rounded % 60;

      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds
          .toString()
          .padStart(2, '0')}`;
      }
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    } catch (err) {
      console.log('error get duration', err);
      return null;
    }
  }

  private async findFirstPlaylist(prefix: string): Promise<string | null> {
    let continuationToken: string | undefined = undefined;

    do {
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: `${prefix}/`,
        ContinuationToken: continuationToken,
      });

      const response = (await this.s3.send(
        command,
      )) as ListObjectsV2CommandOutput;

      if (response.Contents) {
        // filter yang cuma index.m3u8
        const playlist = response.Contents.find((obj: any) =>
          obj.Key?.endsWith('index.m3u8'),
        );
        if (playlist?.Key) {
          // pastikan file benar-benar ada (opsional)
          try {
            await this.s3.send(
              new HeadObjectCommand({ Bucket: this.bucket, Key: playlist.Key }),
            );
            return playlist.Key;
          } catch (err) {
            // skip jika file somehow tidak ada
          }
        }
      }

      continuationToken = response.IsTruncated
        ? response.NextContinuationToken
        : undefined;
    } while (continuationToken);

    return null; // tidak ada playlist sama sekali
  }

  private queryOpt = ({ where = {}, orderField = '', orderDirection = '' }) => {
    return {
      where,
      attributes: [
        'id',
        'title',
        'slug',
        'trailerUrl',
        'rating',
        'source',
        'resolution',
        'duration',
        'yearOfRelease',
        'synopsis',
        'budget',
        'worldwideGross',
        'updatedAt',
        'createdAt',
      ],
      include: [
        {
          model: File,
          as: 'poster',
          attributes: ['id', 'fileName', 'folder', 'originalName', 'mimeType'],
        },
        {
          model: Video,
          as: 'video',
          attributes: ['id', 'fileName', 'hlsObject', 'prefix'],
        },
        {
          model: Subtitle,
          as: 'subtitles',
          attributes: ['id', 'language'],
          include: [
            {
              model: File,
              as: 'file',
              attributes: [
                'id',
                'fileName',
                'folder',
                'originalName',
                'mimeType',
              ],
            },
          ],
        },
        {
          model: AgeRating,
          as: 'ageRating',
          attributes: ['id', 'code', 'name'],
        },
        { model: Country, as: 'country', attributes: ['id', 'name'] },
        {
          model: Genre,
          as: 'genres',
          attributes: ['id', 'name'],
          through: { attributes: [] },
        },
        {
          model: Person,
          as: 'persons',
          attributes: ['id', 'name', 'position'],
          through: {
            model: Character,
            as: 'character',
            attributes: ['id', 'character'],
          },
        },
      ],
      order: [[orderField, orderDirection]],
    };
  };

  async findAll(data: {
    page?: number;
    limit?: number;
    search: string;
    orderBy: string;
    orderDirection: 'ASC' | 'DESC';
  }): Promise<PaginationResponse<Movie>> {
    const { page, limit, search, orderBy, orderDirection } = data;

    const where: any = {};

    if (search && search.trim() !== '') {
      where.title = {
        [Op.iLike]: `%${search}%`,
      };
    }

    const orderByMap: Record<string, string> = {
      title: 'title',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    };

    const orderField = orderByMap[orderBy] ?? 'createdAt';

    const offset =
      page !== undefined && limit !== undefined
        ? (page - 1) * limit
        : undefined;

    const queryOptions: any = this.queryOpt({
      where,
      orderField,
      orderDirection,
    });

    if (offset !== undefined && limit !== undefined) {
      queryOptions.offset = offset;
      queryOptions.limit = limit;
    }

    const { rows, count } = await this.movieModel.findAndCountAll(queryOptions);

    return {
      message: `${NAME} fetched successfully`,
      data: rows,
      total: count,
      page: page ?? 1,
      limit: limit ?? count,
      lastPage: limit ? Math.ceil(count / limit) : 1,
    };
  }

  async create(data: CreateMovieDto): Promise<BaseResponse<Movie>> {
    const transaction = await this.sequelize.transaction();

    try {
      // ====== VALIDASI FOREIGN KEY ======
      if (data.countryId) {
        const country = await this.countryModel.findByPk(data.countryId, {
          transaction,
        });
        if (!country) throw new NotFoundException('Country not found');
      }

      if (data.ageRatingId) {
        const country = await this.ageRatingModel.findByPk(data.ageRatingId, {
          transaction,
        });
        if (!country) throw new NotFoundException('Age Rating not found');
      }

      if (data.fileId) {
        const file = await this.fileModel.findByPk(data.fileId, {
          transaction,
        });
        if (!file) throw new NotFoundException('File not found');
        await file.update({ isUsed: true }, { transaction });
      }

      let duration: string | null = null;

      if (data.videoId) {
        const video = await this.videoModel.findByPk(data.videoId, {
          transaction,
        });
        if (!video) throw new NotFoundException('Video not found');

        const m3u8Key = await this.findFirstPlaylist(video.dataValues.prefix);
        if (!m3u8Key) throw new Error('No HLS playlist found');

        duration = await this.getDurationFromS3(this.bucket, m3u8Key);
        console.log('Duration:', duration);

        // const m3u8Key = `${video.dataValues.prefix}/240p/index.m3u8`;
        // duration = await this.getDurationFromS3(this.bucket, m3u8Key);
      }

      // ====== CREATE MOVIE ======
      const movie = await this.movieModel.create(
        {
          title: data.title,
          slug: data.slug,
          rating: data.rating,
          source: data.source,
          resolution: data.resolution,
          yearOfRelease: data.yearOfRelease,
          synopsis: data.synopsis,
          duration: duration,
          budget: data.budget,
          worldwideGross: data.worldwideGross,
          trailerUrl: data.trailerUrl,
          fileId: data.fileId,
          videoId: data.videoId,
          ageRatingId: data.ageRatingId,
          countryId: data.countryId,
        } as InferCreationAttributes<Movie>,
        { transaction },
      );

      // ====== ASSOCIATE SUBTITLES ======
      if (data.subtitles && data.subtitles.length > 0) {
        await this.subtitleModel.bulkCreate(
          data.subtitles.map(
            (s) =>
              ({
                movieId: movie.dataValues.id,
                fileId: s.fileId,
                language: s.language,
              }) as InferCreationAttributes<Subtitle>,
          ),
          { transaction },
        );

        const fileIds = data.subtitles
          .map((s) => s.fileId)
          .filter(Boolean) as string[];

        if (fileIds.length > 0) {
          await this.fileModel.update(
            { isUsed: true },
            {
              where: { id: { [Op.in]: fileIds } },
              transaction,
            },
          );
        }
      }

      // ====== ASSOCIATE CHARACTERS ======
      if (data.characters && data.characters.length > 0) {
        await this.characterModel.bulkCreate(
          data.characters.map(
            (c) =>
              ({
                movieId: movie.dataValues.id,
                personId: c.personId,
                character: c.character,
              }) as InferCreationAttributes<Character>,
          ),
          { transaction },
        );
      }

      // ====== ASSOCIATE GENRES ======
      if (data.genres && data.genres.length > 0) {
        await this.movieGenreModel.bulkCreate(
          data.genres.map(
            (g) =>
              ({
                movieId: movie.dataValues.id,
                genreId: g.genreId,
              }) as InferCreationAttributes<MovieGenre>,
          ),
          { transaction },
        );
      }

      if (data.videoAlternatives && data.videoAlternatives.length > 0) {
        await this.videoAlternativeModel.bulkCreate(
          data.videoAlternatives.map(
            (va) =>
              ({
                movieId: movie.dataValues.id,
                provider: va.provider,
                source: va.source,
              }) as InferCreationAttributes<VideoAlternative>,
          ),
          { transaction },
        );
      }

      await transaction.commit();
      return { message: `${NAME} created successfully`, data: movie };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async update(id: string, data: UpdateMovieDto): Promise<BaseResponse<Movie>> {
    const transaction = await this.sequelize.transaction();

    try {
      // ====== FIND MOVIE ======
      const movie = await this.movieModel.findByPk(id, { transaction });
      if (!movie) throw new NotFoundException('Movie not found');

      // ====== VALIDASI FOREIGN KEY ======
      if (data.countryId) {
        const country = await this.countryModel.findByPk(data.countryId, {
          transaction,
        });
        if (!country) throw new NotFoundException('Country not found');
      }

      if (data.ageRatingId) {
        const ageRating = await this.ageRatingModel.findByPk(data.ageRatingId, {
          transaction,
        });
        if (!ageRating) throw new NotFoundException('Age Rating not found');
      }

      if (data.fileId && data.fileId !== movie.dataValues.fileId) {
        const file = await this.fileModel.findByPk(data.fileId, {
          transaction,
        });
        if (!file) throw new NotFoundException('File not found');

        // file lama (optional: release)
        if (movie.dataValues.fileId) {
          await this.fileModel.update(
            { isUsed: false },
            { where: { id: movie.dataValues.fileId }, transaction },
          );
        }

        await file.update({ isUsed: true }, { transaction });
      }

      let duration = movie.dataValues.duration;

      if (data.videoId && data.videoId !== movie.dataValues.videoId) {
        const video = await this.videoModel.findByPk(data.videoId, {
          transaction,
        });
        if (!video) throw new NotFoundException('Video not found');

        const m3u8Key = await this.findFirstPlaylist(video.dataValues.prefix);
        if (!m3u8Key) throw new Error('No HLS playlist found');

        console.log(m3u8Key, 'm3u8Key m3u8Key m3u8Key m3u8Key');

        duration = await this.getDurationFromS3(this.bucket, m3u8Key);
        console.log('Duration:', duration);
      }

      // ====== UPDATE MOVIE ======
      await movie.update(
        {
          title: data.title,
          slug: data.slug,
          rating: data.rating,
          source: data.source,
          resolution: data.resolution,
          yearOfRelease: data.yearOfRelease,
          synopsis: data.synopsis,
          duration,
          budget: data.budget,
          worldwideGross: data.worldwideGross,
          trailerUrl: data.trailerUrl,
          fileId: data.fileId,
          videoId: data.videoId,
          ageRatingId: data.ageRatingId,
          countryId: data.countryId,
        },
        { transaction },
      );

      // ====== UPDATE SUBTITLES ======
      if (data.subtitles) {
        // Ambil file lama dulu
        const oldSubtitles = await this.subtitleModel.findAll({
          where: { movieId: movie.dataValues.id },
          transaction,
        });

        // hanya ambil fileId yang valid (bukan null)
        const oldFileIds = oldSubtitles
          .map((s) => s.dataValues.fileId)
          .filter(Boolean) as string[];

        console.log(oldSubtitles, 'oldSubtitles');

        if (oldFileIds.length > 0) {
          await this.fileModel.update(
            { isUsed: false },
            {
              where: { id: { [Op.in]: oldFileIds } },
              transaction,
            },
          );
        }

        // Hapus subtitle lama
        await this.subtitleModel.destroy({
          where: { movieId: movie.dataValues.id },
          transaction,
        });

        // Tambahkan subtitle baru
        if (data.subtitles.length > 0) {
          await this.subtitleModel.bulkCreate(
            data.subtitles.map(
              (s) =>
                ({
                  movieId: movie.dataValues.id,
                  fileId: s.fileId,
                  language: s.language,
                }) as InferCreationAttributes<Subtitle>,
            ),
            { transaction },
          );

          // Set isUsed true untuk file baru
          const newFileIds = data.subtitles
            .map((s) => s.fileId)
            .filter(Boolean) as string[];
          if (newFileIds.length > 0) {
            await this.fileModel.update(
              { isUsed: true },
              { where: { id: { [Op.in]: newFileIds } }, transaction },
            );
          }
        }
      }

      // ====== UPDATE CHARACTERS ======
      if (data.characters) {
        await this.characterModel.destroy({
          where: { movieId: movie.dataValues.id },
          transaction,
        });

        if (data.characters.length > 0) {
          await this.characterModel.bulkCreate(
            data.characters.map(
              (c) =>
                ({
                  movieId: movie.dataValues.id,
                  personId: c.personId,
                  character: c.character,
                }) as InferCreationAttributes<Character>,
            ),
            { transaction },
          );
        }
      }

      // ====== UPDATE GENRES ======
      if (data.genres) {
        await this.movieGenreModel.destroy({
          where: { movieId: movie.dataValues.id },
          transaction,
        });

        if (data.genres.length > 0) {
          await this.movieGenreModel.bulkCreate(
            data.genres.map(
              (g) =>
                ({
                  movieId: movie.dataValues.id,
                  genreId: g.genreId,
                }) as InferCreationAttributes<MovieGenre>,
            ),
            { transaction },
          );
        }
      }

      // ====== UPDATE PLAYERS ======
      if (data.videoAlternatives) {
        await this.videoAlternativeModel.destroy({
          where: { movieId: movie.dataValues.id },
          transaction,
        });

        if (data.videoAlternatives.length > 0) {
          await this.videoAlternativeModel.bulkCreate(
            data.videoAlternatives.map(
              (va) =>
                ({
                  movieId: movie.dataValues.id,
                  provider: va.provider,
                  source: va.source,
                }) as InferCreationAttributes<VideoAlternative>,
            ),
            { transaction },
          );
        }
      }

      await transaction.commit();
      return { message: `${NAME} updated successfully`, data: movie };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
