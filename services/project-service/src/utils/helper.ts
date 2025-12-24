import { Request } from 'express';
import { PaginationOptions, PaginationMeta } from '../interfaces/pagination.interface';
import configService from './config/config.service';

export const extractPaginationAndSorting = (req: Request): PaginationOptions => {
    const page = Number(req.query.page) || 1;
    const sortDirection = (req.query.sortDirection as 'ASC' | 'DESC') || 'DESC';
    const limit = Number(req.query.perPage || configService.get('DEFAULT_PAGINATION') || 25);

    return {
        page,
        order: sortDirection,
        limit
    };
};

export function generatePaginationMeta(count: number, page: number, limit: number): PaginationMeta {
    const totalPages = Math.ceil(count / limit);

    return {
        current_page: page,
        next_page: page < totalPages ? page + 1 : null,
        previous_page: page > 1 ? page - 1 : null,
        per_page: limit,
        total: count,
        last_page: totalPages,
    };
}

