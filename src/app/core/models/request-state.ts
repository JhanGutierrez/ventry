export interface RequestState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}