import { ImageFile } from '@/lib/models/image_file';
import { safeQuery } from '@/lib/modules/common/safe_query';
import { baseRepo } from '@/lib/modules/common/base_repo';

const table = 'image_files';

export const imageFileRepo = {
  async create(data: Partial<ImageFile>): Promise<ImageFile> {
    const payload = new ImageFile({ ...data, created_at: data.created_at ?? new Date(), updated_at: data.updated_at ?? new Date() });
    const inserted = await baseRepo.insert<ImageFile>(payload);
    return new ImageFile(inserted);
  },

  async findById(id: string): Promise<ImageFile | null> {
    const found = await baseRepo.getByField<ImageFile>(ImageFile as any, 'id' as any, id);
    return found ? new ImageFile(found) : null;
  },

  async findByPath(p: string): Promise<ImageFile | null> {
    const found = await baseRepo.getByField<ImageFile>(ImageFile as any, 'path' as any, p);
    return found ? new ImageFile(found) : null;
  },

  async findByTaskId(taskId: string): Promise<ImageFile[]> {
    const rows = await baseRepo.findManyByFields<ImageFile>(ImageFile as any, { task_id: taskId } as any, {
      orderBy: ['created_at'] as any,
      orderDirections: { created_at: 'DESC' } as any,
      allowedOrderFields: ['created_at', 'id'] as any
    });
    return rows.map(r => new ImageFile(r as any));
  },

  async getRecent(limit: number = 10): Promise<ImageFile[]> {
    const all = await baseRepo.getAll<ImageFile>(ImageFile as any, {
      orderBy: ['created_at'] as any,
      orderDirections: { created_at: 'DESC' } as any,
      allowedOrderFields: ['created_at', 'id'] as any
    });
    return all.slice(0, limit).map(r => new ImageFile(r as any));
  },

  async updateTaskId(imageId: string, taskId: string | null): Promise<boolean> {
    const updated = await baseRepo.update<ImageFile>(new ImageFile({ id: imageId, task_id: taskId ?? undefined, updated_at: new Date() }));
    return !!updated;
  },

  async delete(id: string): Promise<boolean> {
    try { await baseRepo.deleteById<ImageFile>(ImageFile as any, id as any); return true; } catch { return false; }
  },

  async getStorageStats(): Promise<{ totalFiles: number; totalSize: number; avgSize: number; }> {
    const result = await safeQuery(`
      SELECT 
        COUNT(*)::int as total_files,
        COALESCE(SUM(size), 0)::bigint as total_size,
        COALESCE(AVG(size), 0)::bigint as avg_size
      FROM ${table}
    `);
    const row = result.rows[0];
    return {
      totalFiles: row.total_files,
      totalSize: parseInt(row.total_size),
      avgSize: parseInt(row.avg_size)
    };
  }
};
