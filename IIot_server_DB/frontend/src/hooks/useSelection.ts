import { useState, useCallback, useMemo } from 'react';

const EMPTY_SET = new Set<never>();

/**
 * จัดการการเลือกหลายรายการ (Box Select) สำหรับตารางในหน้า Manager ต่างๆ
 * รีเซ็ตการเลือกอัตโนมัติเมื่อ resetKey เปลี่ยน (โดยไม่ต้องใช้ useEffect)
 */
export function useSelection<K extends string | number>(
  pageKeys: K[],
  resetKey = ''
) {
  const [state, setState] = useState<{ key: string; keys: Set<K> }>(() => ({
    key: resetKey,
    keys: new Set(),
  }));

  const selectedKeys = useMemo<Set<K>>(
    () => (state.key === resetKey ? state.keys : (EMPTY_SET as Set<K>)),
    [state, resetKey]
  );

  const clearSelection = useCallback(() => {
    setState({ key: resetKey, keys: new Set() });
  }, [resetKey]);

  const allOnPageSelected =
    pageKeys.length > 0 && pageKeys.every((k) => selectedKeys.has(k));

  const toggleSelectAll = useCallback(() => {
    setState((prev) => {
      const base = prev.key === resetKey ? prev.keys : new Set<K>();
      const next = new Set(base);
      const allSelected = pageKeys.length > 0 && pageKeys.every((k) => next.has(k));
      if (allSelected) {
        pageKeys.forEach((k) => next.delete(k));
      } else {
        pageKeys.forEach((k) => next.add(k));
      }
      return { key: resetKey, keys: next };
    });
  }, [pageKeys, resetKey]);

  const toggleSelectOne = useCallback(
    (key: K) => {
      setState((prev) => {
        const base = prev.key === resetKey ? prev.keys : new Set<K>();
        const next = new Set(base);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return { key: resetKey, keys: next };
      });
    },
    [resetKey]
  );

  return {
    selectedKeys,
    allOnPageSelected,
    toggleSelectAll,
    toggleSelectOne,
    clearSelection,
  };
}
