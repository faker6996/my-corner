import { LOG_LEVEL } from "@/lib/constants/enum";
import { systemLogRepo } from "@/lib/modules/admins/system_log/repositories/system_log_repo";

export interface ListLogsParams {
  level?: LOG_LEVEL;
  event?: string;
  taskId?: number;
  imageId?: number;
  resultId?: number;
  userId?: number;
  q?: string;
  sinceMinutes?: number;
  from?: Date;
  to?: Date;
  page: number;
  pageSize: number;
}

export const systemLogApp = {
  async listLogs(params: ListLogsParams) {
    const { rows, total } = await systemLogRepo.listLogs(params);
    const { page, pageSize } = params;
    const hasMore = page * pageSize < total;

    return {
      data: rows,
      total,
      page,
      pageSize,
      hasMore,
    };
  },
};
