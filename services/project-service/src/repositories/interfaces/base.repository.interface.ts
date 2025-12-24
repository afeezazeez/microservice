import { BulkCreateOptions, CreateOptions, DestroyOptions, FindOptions, Model, SaveOptions, UpdateOptions, WhereOptions } from 'sequelize';
import { PaginationOptions } from '../../interfaces/pagination.interface';

export interface IBaseRepository<T extends Model> {
    create(data: any, options?: CreateOptions): Promise<T>;
    findAll(options?: FindOptions, paginationOptions?: PaginationOptions): Promise<{ rows: T[]; count: number }>;
  findAllWithoutPagination(options?: FindOptions): Promise<T[]>;
  findById(id: number, options?: FindOptions): Promise<T | null>;
  findOne(options?: FindOptions): Promise<T | null>;
    findByUuid(uuid: string, options?: FindOptions): Promise<T | null>;
    update(id: number, data: Partial<T>, options?: UpdateOptions<T>): Promise<number>;
    updateByUuid(uuid: string, data: Partial<T>, options?: UpdateOptions<T>): Promise<number>;
    save(instance: T, options?: SaveOptions<T>): Promise<T>;
  delete(id: number, options?: DestroyOptions): Promise<number>;
    hardDelete(id: number, options?: DestroyOptions): Promise<number>;
    destroy(options: DestroyOptions): Promise<number>;
    bulkCreate(data: Array<Partial<T["_creationAttributes"]>>, options?: BulkCreateOptions<T>): Promise<T[]>;
    count(where: WhereOptions<T>): Promise<number>;
}
