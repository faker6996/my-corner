import { baseRepo } from "@/lib/modules/common/base_repo";
import { safeQuery } from "@/lib/modules/common/safe_query";
import { SystemLog } from "@/lib/models/system_log";
import type { ListLogsParams } from "../applications/system_log_app";
import { LOG_LEVEL } from "@/lib/constants/enum";

export const systemLogRepo = {
  async create(payload: Partial<SystemLog>) {
    const now = new Date();
    const log = new SystemLog({
      level: payload.level ?? LOG_LEVEL.INFO,
      event: payload.event!,
      module: payload.module,
      action: payload.action,
      message: payload.message,
      user_id: payload.user_id ?? null,
      task_id: payload.task_id ?? null,
      task_image_id: payload.task_image_id ?? null,
      result_id: payload.result_id ?? null,
      request_id: payload.request_id ?? null,
      route: payload.route ?? null,
      method: payload.method ?? null,
      status_code: payload.status_code ?? null,
      ip_address: payload.ip_address ?? null,
      user_agent: payload.user_agent ?? null,
      details: payload.details ?? {},
      error_stack: payload.error_stack ?? null,
      created_at: now,
    });
    return baseRepo.insert<SystemLog>(log);
  },

  async listLogs(params: ListLogsParams): Promise<{ rows: any[]; total: number }> {
    const { level, event, taskId, imageId, resultId, userId, q, sinceMinutes, from, to, page, pageSize } = params;

    const where: string[] = [];
    const values: any[] = [];

    const allowedLevels = Object.values(LOG_LEVEL) as string[];
    if (level && allowedLevels.includes(level)) {
      values.push(level);
      where.push(`level = $${values.length}`);
    }
    if (event) {
      values.push(event);
      where.push(`event = $${values.length}`);
    }
    if (typeof taskId === "number" && !Number.isNaN(taskId)) {
      values.push(taskId);
      where.push(`task_id = $${values.length}`);
    }
    if (typeof imageId === "number" && !Number.isNaN(imageId)) {
      values.push(imageId);
      where.push(`task_image_id = $${values.length}`);
    }
    if (typeof resultId === "number" && !Number.isNaN(resultId)) {
      values.push(resultId);
      where.push(`result_id = $${values.length}`);
    }
    if (typeof userId === "number" && !Number.isNaN(userId)) {
      values.push(userId);
      where.push(`user_id = $${values.length}`);
    }
    if (sinceMinutes && Number.isFinite(sinceMinutes) && sinceMinutes > 0) {
      values.push(sinceMinutes);
      where.push(`created_at >= NOW() - ($${values.length}::int || ' minutes')::interval`);
    }
    if (from instanceof Date && !Number.isNaN(from.getTime())) {
      values.push(from);
      where.push(`created_at >= $${values.length}`);
    }
    if (to instanceof Date && !Number.isNaN(to.getTime())) {
      values.push(to);
      where.push(`created_at <= $${values.length}`);
    }
    if (q) {
      values.push(`%${q}%`);
      const idx = values.length;
      // reuse same placeholder for all three columns
      where.push(`(message ILIKE $${idx} OR event ILIKE $${idx} OR module ILIKE $${idx})`);
    }

    const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const offset = (page - 1) * pageSize;

    const countSql = `SELECT COUNT(*)::int AS cnt FROM system_logs ${whereSQL}`;
    const { rows: countRows } = await safeQuery(countSql, values);
    const total: number = countRows[0]?.cnt ?? 0;

    const dataSql = `
      SELECT id, level, event, module, action, message, user_id, task_id, task_image_id, result_id,
             request_id, route, method, status_code, ip_address, user_agent, details,
             created_at
      FROM system_logs
      ${whereSQL}
      ORDER BY created_at DESC, id DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;
    const { rows } = await safeQuery(dataSql, [...values, pageSize, offset]);

    return { rows, total };
  },
};
