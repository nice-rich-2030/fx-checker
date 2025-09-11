import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'fx-checker-saved-filters';
const MAX_SAVED_FILTERS = 10;

const useSavedFilters = () => {
  const [savedFilters, setSavedFilters] = useState([]);
  const [error, setError] = useState(null);

  const loadSavedFilters = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedFilters = JSON.parse(stored);
        setSavedFilters(parsedFilters);
      } else {
        setSavedFilters([]);
      }
      setError(null);
    } catch (err) {
      setError('保存済みフィルターの読み込みに失敗しました');
      console.error('Saved filters load error:', err);
    }
  }, []);

  const saveSavedFilters = useCallback((updatedFilters) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFilters));
      setSavedFilters(updatedFilters);
      setError(null);
    } catch (err) {
      setError('保存済みフィルターの保存に失敗しました');
      console.error('Saved filters save error:', err);
    }
  }, []);

  const saveFilter = useCallback((name, filterData) => {
    try {
      if (!name || typeof name !== 'string' || name.trim() === '') {
        throw new Error('フィルター名を入力してください');
      }

      const trimmedName = name.trim();
      
      if (trimmedName.length > 50) {
        throw new Error('フィルター名は50文字以内で入力してください');
      }

      const exists = savedFilters.some(filter => 
        filter.name.toLowerCase() === trimmedName.toLowerCase()
      );

      if (exists) {
        throw new Error('この名前のフィルターは既に存在します');
      }

      if (savedFilters.length >= MAX_SAVED_FILTERS) {
        throw new Error(`保存できるフィルターは最大${MAX_SAVED_FILTERS}個までです`);
      }

      const hasActiveFilter = Object.values(filterData).some(value => 
        value !== '' && value !== 1 && value !== null && value !== undefined
      );

      if (!hasActiveFilter) {
        throw new Error('保存するフィルター条件を設定してください');
      }

      const newFilter = {
        id: generateId(),
        name: trimmedName,
        filters: { ...filterData },
        createdAt: new Date().toISOString(),
        usageCount: 0
      };

      const updatedFilters = [...savedFilters, newFilter];
      saveSavedFilters(updatedFilters);
      return newFilter;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [savedFilters, saveSavedFilters]);

  const deleteFilter = useCallback((filterId) => {
    try {
      const updatedFilters = savedFilters.filter(filter => filter.id !== filterId);
      saveSavedFilters(updatedFilters);
    } catch (err) {
      setError('フィルターの削除に失敗しました');
      throw err;
    }
  }, [savedFilters, saveSavedFilters]);

  const updateFilterUsage = useCallback((filterId) => {
    try {
      const updatedFilters = savedFilters.map(filter => 
        filter.id === filterId 
          ? { ...filter, usageCount: filter.usageCount + 1, lastUsedAt: new Date().toISOString() }
          : filter
      );
      saveSavedFilters(updatedFilters);
    } catch (err) {
      console.error('Filter usage update error:', err);
    }
  }, [savedFilters, saveSavedFilters]);

  const getFilterById = useCallback((filterId) => {
    return savedFilters.find(filter => filter.id === filterId);
  }, [savedFilters]);

  const getPopularFilters = useCallback((limit = 5) => {
    return [...savedFilters]
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }, [savedFilters]);

  const getRecentFilters = useCallback((limit = 5) => {
    return [...savedFilters]
      .sort((a, b) => new Date(b.lastUsedAt || b.createdAt) - new Date(a.lastUsedAt || a.createdAt))
      .slice(0, limit);
  }, [savedFilters]);

  const exportFilters = useCallback(() => {
    try {
      const exportData = {
        filters: savedFilters,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };
      return JSON.stringify(exportData, null, 2);
    } catch (err) {
      setError('フィルターのエクスポートに失敗しました');
      throw err;
    }
  }, [savedFilters]);

  const importFilters = useCallback((importData) => {
    try {
      const parsed = JSON.parse(importData);
      
      if (!parsed.filters || !Array.isArray(parsed.filters)) {
        throw new Error('無効なフィルターデータです');
      }

      const validFilters = parsed.filters.filter(filter => 
        filter.name && filter.filters && typeof filter.filters === 'object'
      );

      if (validFilters.length === 0) {
        throw new Error('有効なフィルターが見つかりません');
      }

      const totalAfterImport = savedFilters.length + validFilters.length;
      if (totalAfterImport > MAX_SAVED_FILTERS) {
        throw new Error(`インポート後のフィルター数が上限(${MAX_SAVED_FILTERS}個)を超えます`);
      }

      const importedFilters = validFilters.map(filter => ({
        ...filter,
        id: generateId(),
        importedAt: new Date().toISOString(),
        usageCount: 0
      }));

      const updatedFilters = [...savedFilters, ...importedFilters];
      saveSavedFilters(updatedFilters);
      
      return importedFilters.length;
    } catch (err) {
      setError(err.message || 'フィルターのインポートに失敗しました');
      throw err;
    }
  }, [savedFilters, saveSavedFilters]);

  useEffect(() => {
    loadSavedFilters();
  }, [loadSavedFilters]);

  return {
    savedFilters,
    error,
    saveFilter,
    deleteFilter,
    updateFilterUsage,
    getFilterById,
    getPopularFilters,
    getRecentFilters,
    exportFilters,
    importFilters,
    loadSavedFilters
  };
};

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export default useSavedFilters;