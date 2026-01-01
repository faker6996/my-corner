export function saveToLocalStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return; // tránh lỗi SSR
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Lỗi khi lưu localStorage với key "${key}":`, error);
    throw new Error(`Không thể lưu dữ liệu vào localStorage với key "${key}"`);
  }
}

export function loadFromLocalStorage<T>(key: string, defaultOrClass: T | (new (data: any) => T)): T {
  if (typeof window === "undefined") {
    return defaultOrClass instanceof Function ? new defaultOrClass({}) : defaultOrClass;
  }

  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return defaultOrClass instanceof Function ? new defaultOrClass({}) : defaultOrClass;
    }

    // Một số key (ví dụ 'theme') trước đây lưu thẳng chuỗi 'light' | 'dark' | 'system'
    // nên không phải JSON hợp lệ. Trả về trực tiếp trong trường hợp này.
    if (raw === "light" || raw === "dark" || raw === "system") {
      return raw as unknown as T;
    }

    const parsed = JSON.parse(raw);

    // Nếu defaultOrClass là constructor, tạo instance
    if (defaultOrClass instanceof Function) {
      return new defaultOrClass(parsed);
    }

    // Ngược lại, chỉ dùng giá trị thô
    return parsed;
  } catch (e) {
    console.error(`Lỗi khi đọc localStorage key "${key}":`, e, 'Raw data:', localStorage.getItem(key));
    // Xóa dữ liệu bị hỏng và trả về default
    try {
      localStorage.removeItem(key);
    } catch {}
    return defaultOrClass instanceof Function ? new defaultOrClass({}) : defaultOrClass;
  }
}

export function removeFromLocalStorage(key: string): void {
  if (typeof window === "undefined") return; // tránh lỗi khi SSR

  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Lỗi khi xoá localStorage với key "${key}":`, error);
    throw new Error(`Không thể xoá dữ liệu trong localStorage với key "${key}"`);
  }
}
