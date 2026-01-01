import { safeQuery } from "@/lib/modules/common/safe_query";

export const sqlQueryRepo = {
  async execute(sql: string, params: any[] = []) {
    return safeQuery(sql, params);
  },
};

