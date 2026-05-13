export interface MonthlyComparison {
  current_month_income: string;
  current_month_expense: string;
  previous_month_income: string;
  previous_month_expense: string;
  income_delta: string;
  expense_delta: string;
  current_month_start: string;
  current_month_end: string;
  previous_month_start: string;
  previous_month_end: string;
}


export interface CategoryBreakdown {
  category_id: string | null;
  category_name: string;
  category_color: string | null;
  total_spent: string;
  transaction_count: number;
}


export interface AnalyticsOverview {
  monthly_comparison: MonthlyComparison;
  category_breakdown: CategoryBreakdown[];
  period_start: string;
  period_end: string;
}