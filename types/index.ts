export interface Payment {
  id: string;
  amount: number;
  date: string;
  note: string;
}

export interface Record {
  id: string;
  type: "lent" | "borrowed";
  name: string;
  amount: number;
  paid_amount: number;
  note: string;
  date: string;
  due_date: string;
  settled: boolean;
  settled_date: string;
  payments: Payment[];
  created: string;
  updated: string;
}

export interface PersonStats {
  name: string;
  totalLent: number;
  totalBorrowed: number;
  netBalance: number;
  recordCount: number;
  records: Record[];
}

export interface Summary {
  totalLent: number;
  totalBorrowed: number;
  netBalance: number;
  pendingReceivable: number;
  pendingPayable: number;
  settlementRate: number;
  totalRecords: number;
  settledRecords: number;
}

export interface MonthlyData {
  month: string;
  lent: number;
  borrowed: number;
}

export interface AppSettings {
  currency: string;
  theme: "dark" | "light" | "system";
  profileName: string;
  profilePhoto?: string;
  hasCompletedOnboarding?: boolean;
}

export type FilterType = "all" | "lent" | "borrowed" | "pending" | "settled";
export type SortType = "newest" | "oldest" | "highest" | "lowest";
