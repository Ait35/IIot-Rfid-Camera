import { useState, useCallback } from 'react';

/**
 * จัดการสถานะการแบ่งหน้าฝั่ง Client และรีเซ็ตกลับหน้า 1 อัตโนมัติเมื่อ resetKey เปลี่ยน
 * (ใช้การเทียบ key ระหว่าง render เพื่อลดการใช้ useEffect ซ้ำซ้อน)
 */
export function useClientPagination<T>(
  items: T[],
  pageSize = 10,
  resetKey = ''
) {
  const [pageState, setPageState] = useState({ key: resetKey, page: 1 });

  const currentPage = pageState.key === resetKey ? pageState.page : 1;

  const setCurrentPage = useCallback(
    (page: number) => {
      setPageState({ key: resetKey, page });
    },
    [resetKey]
  );

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = items.slice((safePage - 1) * pageSize, safePage * pageSize);

  return {
    currentPage,
    setCurrentPage,
    totalPages,
    safePage,
    paginated,
  };
}
