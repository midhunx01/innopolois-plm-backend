import { ReportRepoType } from "../repository";

// Reports are thin pass-throughs over aggregate queries (FRD §15). Kept in a
// service layer so future business rules (date ranges, targets) have a home.
const dashboard = (repo: ReportRepoType) => repo.dashboard();
const purchaseValue = (repo: ReportRepoType) => repo.purchaseValueByStatus();
const vendorPerformance = (repo: ReportRepoType) => repo.vendorPerformance();
const stockValue = (repo: ReportRepoType) => repo.stockValueByWarehouse();
const vendorSpend = (repo: ReportRepoType) => repo.vendorSpend();
const projectCost = (repo: ReportRepoType) => repo.projectCost();

export const reportService = {
  dashboard,
  purchaseValue,
  vendorPerformance,
  stockValue,
  vendorSpend,
  projectCost,
};
