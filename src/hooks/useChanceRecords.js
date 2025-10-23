import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'fx-checker-chance-records';

const useChanceRecords = () => {
  const [records, setRecords] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadRecords = useCallback(() => {
    setIsLoading(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedRecords = JSON.parse(stored);
        setRecords(parsedRecords);
      } else {
        setRecords([]);
      }
      setError(null);
    } catch (err) {
      setError('記録データの読み込みに失敗しました');
      console.error('Records load error:', err);
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveRecords = useCallback((updatedRecords) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecords));
      setRecords(updatedRecords);
      setError(null);
    } catch (err) {
      setError('記録データの保存に失敗しました');
      console.error('Records save error:', err);
      throw err;
    }
  }, []);

  const addRecord = useCallback((recordData) => {
    try {
      const { currencyPair, timeframe, pattern, direction, confidence = 3, memo = '', chartUrl = '' } = recordData;

      if (!currencyPair || !timeframe || !pattern || !direction) {
        throw new Error('必須項目が不足しています');
      }

      if (!['ロング', 'ショート'].includes(direction)) {
        throw new Error('方向はロングまたはショートを選択してください');
      }

      const confidenceValue = Math.max(1, Math.min(5, parseInt(confidence)));

      if (memo && memo.length > 200) {
        throw new Error('メモは200文字以内で入力してください');
      }

      const newRecord = {
        id: generateId(),
        currencyPair,
        timeframe,
        pattern,
        direction,
        confidence: confidenceValue,
        memo: memo.trim(),
        chartUrl: chartUrl.trim(),
        tradeExecuted: false,
        tradeResult: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const updatedRecords = [...records, newRecord];
      saveRecords(updatedRecords);
      return newRecord;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [records, saveRecords]);

  const updateRecord = useCallback((recordId, updates) => {
    try {
      const recordExists = records.some(record => record.id === recordId);
      if (!recordExists) {
        throw new Error('更新対象の記録が見つかりません');
      }

      const updatedRecords = records.map(record => {
        if (record.id === recordId) {
          const updatedRecord = { ...record, ...updates };
          
          if (updates.confidence !== undefined) {
            updatedRecord.confidence = Math.max(1, Math.min(5, parseInt(updates.confidence)));
          }
          
          if (updates.memo !== undefined && updates.memo.length > 200) {
            throw new Error('メモは200文字以内で入力してください');
          }
          
          updatedRecord.updatedAt = new Date().toISOString();
          return updatedRecord;
        }
        return record;
      });

      saveRecords(updatedRecords);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [records, saveRecords]);

  const deleteRecord = useCallback((recordId) => {
    try {
      const updatedRecords = records.filter(record => record.id !== recordId);
      saveRecords(updatedRecords);
    } catch (err) {
      setError('記録の削除に失敗しました');
      throw err;
    }
  }, [records, saveRecords]);

  const getRecordsByDateRange = useCallback((startDate, endDate) => {
    return records.filter(record => {
      const recordDate = new Date(record.createdAt);
      return recordDate >= startDate && recordDate <= endDate;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [records]);

  const getRecordsByFilter = useCallback((filters) => {
    let filteredRecords = [...records];

    if (filters.currencyPair) {
      filteredRecords = filteredRecords.filter(record => 
        record.currencyPair === filters.currencyPair
      );
    }

    if (filters.timeframe) {
      filteredRecords = filteredRecords.filter(record => 
        record.timeframe === filters.timeframe
      );
    }

    if (filters.pattern) {
      filteredRecords = filteredRecords.filter(record => 
        record.pattern === filters.pattern
      );
    }

    if (filters.direction) {
      filteredRecords = filteredRecords.filter(record => 
        record.direction === filters.direction
      );
    }

    if (filters.minConfidence) {
      filteredRecords = filteredRecords.filter(record => 
        record.confidence >= filters.minConfidence
      );
    }

    if (filters.tradeExecuted !== undefined) {
      filteredRecords = filteredRecords.filter(record => 
        record.tradeExecuted === filters.tradeExecuted
      );
    }

    return filteredRecords.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [records]);

  const getTodaysRecords = useCallback(() => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    return getRecordsByDateRange(startOfDay, endOfDay);
  }, [getRecordsByDateRange]);

  const getStatistics = useCallback(() => {
    const totalRecords = records.length;
    const executedTrades = records.filter(r => r.tradeExecuted).length;
    const successfulTrades = records.filter(r => r.tradeExecuted && r.tradeResult === '成功').length;
    
    const currencyPairCounts = records.reduce((acc, record) => {
      acc[record.currencyPair] = (acc[record.currencyPair] || 0) + 1;
      return acc;
    }, {});

    const patternCounts = records.reduce((acc, record) => {
      acc[record.pattern] = (acc[record.pattern] || 0) + 1;
      return acc;
    }, {});

    const directionCounts = records.reduce((acc, record) => {
      acc[record.direction] = (acc[record.direction] || 0) + 1;
      return acc;
    }, {});

    return {
      totalRecords,
      executedTrades,
      successfulTrades,
      successRate: executedTrades > 0 ? (successfulTrades / executedTrades * 100).toFixed(1) : 0,
      currencyPairCounts,
      patternCounts,
      directionCounts
    };
  }, [records]);

  const searchRecords = useCallback((searchTerm) => {
    if (!searchTerm) return records;
    
    const term = searchTerm.toLowerCase();
    return records.filter(record => 
      record.currencyPair.toLowerCase().includes(term) ||
      record.pattern.toLowerCase().includes(term) ||
      record.memo.toLowerCase().includes(term)
    ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [records]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  return {
    records,
    error,
    isLoading,
    addRecord,
    updateRecord,
    deleteRecord,
    getRecordsByDateRange,
    getRecordsByFilter,
    getTodaysRecords,
    getStatistics,
    searchRecords,
    loadRecords
  };
};

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export default useChanceRecords;