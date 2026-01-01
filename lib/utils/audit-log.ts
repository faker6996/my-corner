import { systemLogRepo } from "@/lib/modules/admins/system_log/repositories/system_log_repo";
import { LOG_EVENT, LOG_LEVEL } from "@/lib/constants/enum";

export async function logSystemEvent(ctx: {
  event: LOG_EVENT | string;
  module?: string;
  action?: string;
  message?: string;
  level?: LOG_LEVEL;
  userId?: number;
  taskId?: number;
  imageId?: number;
  resultId?: number;
  route?: string;
  method?: string;
  statusCode?: number;
  ip?: string;
  ua?: string;
  details?: any;
  errorStack?: string;
}) {
  try {
    // Only persist warning and error levels as requested
    const level = ctx.level ?? LOG_LEVEL.INFO;
    if (level !== LOG_LEVEL.WARN && level !== LOG_LEVEL.ERROR) return;
    await systemLogRepo.create({
      event: ctx.event,
      module: ctx.module,
      action: ctx.action,
      message: ctx.message,
      level,
      user_id: ctx.userId,
      task_id: ctx.taskId,
      task_image_id: ctx.imageId,
      result_id: ctx.resultId,
      route: ctx.route,
      method: ctx.method,
      status_code: ctx.statusCode,
      ip_address: ctx.ip,
      user_agent: ctx.ua,
      details: ctx.details,
      error_stack: ctx.errorStack,
    });
  } catch (e) {
    // Avoid throwing in logging path
    console.error("[SystemLog] Failed to write log", e);
  }
}
