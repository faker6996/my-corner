import { LOG_LEVEL } from "@/lib/constants/enum";

export class SystemLog {
  id?: number;
  level?: LOG_LEVEL;
  event!: string;
  module?: string;
  action?: string;
  message?: string;
  user_id?: number | null;
  task_id?: number | null;
  task_image_id?: number | null;
  result_id?: number | null;
  request_id?: string | null;
  route?: string | null;
  method?: string | null;
  status_code?: number | null;
  ip_address?: string | null;
  user_agent?: string | null;
  details?: Record<string, any>;
  error_stack?: string | null;
  created_at?: Date;

  static table = 'system_logs';
  static jsonbColumns = ['details'];
  static columns = {
    id: 'id',
    level: 'level',
    event: 'event',
    module: 'module',
    action: 'action',
    message: 'message',
    user_id: 'user_id',
    task_id: 'task_id',
    task_image_id: 'task_image_id',
    result_id: 'result_id',
    request_id: 'request_id',
    route: 'route',
    method: 'method',
    status_code: 'status_code',
    ip_address: 'ip_address',
    user_agent: 'user_agent',
    details: 'details',
    error_stack: 'error_stack',
    created_at: 'created_at',
  } as const;

  constructor(data: Partial<SystemLog> = {}) {
    if (data && typeof data === 'object') Object.assign(this, data);
  }

  toJSON() {
    return {
      id: this.id,
      level: this.level,
      event: this.event,
      module: this.module,
      action: this.action,
      message: this.message,
      user_id: this.user_id,
      task_id: this.task_id,
      task_image_id: this.task_image_id,
      result_id: this.result_id,
      request_id: this.request_id,
      route: this.route,
      method: this.method,
      status_code: this.status_code,
      ip_address: this.ip_address,
      user_agent: this.user_agent,
      details: this.details,
      error_stack: this.error_stack,
      created_at: this.created_at?.toISOString(),
    };
  }
}
