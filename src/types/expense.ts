export type ExpenseCategory = 'travel' | 'food' | 'supplies' | 'equipment' | 'services' | 'other';
export type ExpenseStatus = 'pending' | 'approved' | 'rejected';

export interface ExpenseFilters {
  search?: string;
  category?: ExpenseCategory;
  status?: ExpenseStatus;
  startDate?: string;
  endDate?: string;
}
