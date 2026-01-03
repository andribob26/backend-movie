export interface PaginationResponse<T> {
  message: string;
  data: T[];
  total: number;
  page: number;
  limit: number;
  lastPage: number;
}
