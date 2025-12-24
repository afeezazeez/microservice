import {
    BulkCreateOptions,
    CreateOptions,
    DestroyOptions,
    FindOptions,
    Model,
    ModelStatic,
    SaveOptions,
    UpdateOptions,
    WhereOptions,
} from 'sequelize';
import { IBaseRepository } from './interfaces/base.repository.interface';
import { PaginationOptions } from '../interfaces/pagination.interface';

export class BaseRepository<T extends Model<T>> implements IBaseRepository<T> {
    protected model: ModelStatic<T>;

    constructor(model: ModelStatic<T>) {
        this.model = model;
    }

    async create(data: any, options?: CreateOptions): Promise<T> {
        return await this.model.create(data, options);
    }

    async findAll(options: FindOptions = {}, paginationOptions?: PaginationOptions): Promise<{ rows: T[]; count: number }> {
        const { page = 1, order = 'DESC', limit = 25 } = paginationOptions || {};

        const offset = (page - 1) * limit;

        const finalOptions: FindOptions = {
            ...options,
            limit,
            offset,
            order: options.order || [['created_at', order]],
        };

        const result = await this.model.findAndCountAll(finalOptions);

        return {
            rows: result.rows,
            count: result.count,
        };
    }

    async findAllWithoutPagination(options: FindOptions = {}): Promise<T[]> {
        return await this.model.findAll(options);
    }

    async findById(id: number, options?: FindOptions): Promise<T | null> {
        return await this.model.findByPk(id, options);
    }

    async findOne(options?: FindOptions): Promise<T | null> {
        return await this.model.findOne(options);
    }

    async findByUuid(uuid: string, options?: FindOptions): Promise<T | null> {
        return await this.model.findOne({
            where: { uuid } as unknown as WhereOptions<T>,
            ...options
        });
    }

    async update(id: number, data: Partial<T>, options?: UpdateOptions<T>): Promise<number> {
        const [affectedCount] = await this.model.update(data, {
            where: { id } as unknown as WhereOptions<T>,
            ...options
        });
        return affectedCount;
    }

    async updateByUuid(uuid: string, data: Partial<T>, options?: UpdateOptions<T>): Promise<number> {
        const [affectedCount] = await this.model.update(data, {
            where: { uuid } as unknown as WhereOptions<T>,
            ...options
        });
        return affectedCount;
    }

    async save(instance: T, options?: SaveOptions<T>): Promise<T> {
        await instance.save(options);
        return instance;
    }

    async delete(id: number, options?: DestroyOptions): Promise<number> {
        return await this.model.destroy({ where: { id } as unknown as WhereOptions<T>, ...options });
    }

    async hardDelete(id: number, options?: DestroyOptions): Promise<number> {
        return await this.model.destroy({
            where: { id } as unknown as WhereOptions<T>,
            force: true,
            ...options
        });
    }

    async destroy(options: DestroyOptions): Promise<number> {
        return await this.model.destroy(options);
    }

    async bulkCreate(data: Array<Partial<T["_creationAttributes"]>>, options?: BulkCreateOptions<T>): Promise<T[]> {
        return await this.model.bulkCreate(data as any, options);
    }

    async count(where: WhereOptions<T>): Promise<number> {
        return await this.model.count({ where });
    }
}
