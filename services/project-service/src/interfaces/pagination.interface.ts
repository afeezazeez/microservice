export interface PaginationOptions {
  page?: number;
    order?: 'ASC' | 'DESC';
  limit?: number;
}

export interface PaginationMeta {
    current_page: number;
    next_page: number | null;
    previous_page: number | null;
    per_page: number;
    total: number;
    last_page: number;
}
