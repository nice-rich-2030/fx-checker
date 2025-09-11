import { useState, useCallback, useEffect } from 'react';

const DEFAULT_CURRENCY_PAIRS = [
  'USD/JPY', 'EUR/USD', 'GBP/USD', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD',
  'EUR/JPY', 'GBP/JPY', 'CHF/JPY', 'AUD/JPY', 'CAD/JPY', 'NZD/JPY',
  'EUR/GBP', 'EUR/CHF', 'EUR/AUD', 'EUR/CAD', 'EUR/NZD',
  'GBP/CHF', 'GBP/AUD', 'GBP/CAD', 'GBP/NZD',
  'AUD/CHF', 'AUD/CAD', 'AUD/NZD',
  'CHF/CAD', 'CAD/CHF', 'NZD/CAD'
];

const STORAGE_KEY = 'fx-checker-currency-pairs';

const useCurrencyPairs = () => {
  const [pairs, setPairs] = useState([]);
  const [error, setError] = useState(null);

  const loadPairs = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedPairs = JSON.parse(stored);
        setPairs(parsedPairs);
      } else {
        const defaultPairs = DEFAULT_CURRENCY_PAIRS.map((pair, index) => ({
          id: index + 1,
          name: pair,
          category: getCurrencyCategory(pair),
          isActive: true,
          displayOrder: index + 1,
          createdAt: new Date().toISOString()
        }));
        setPairs(defaultPairs);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPairs));
      }
      setError(null);
    } catch (err) {
      setError('通貨ペアデータの読み込みに失敗しました');
      console.error('Currency pairs load error:', err);
    }
  }, []);

  const savePairs = useCallback((updatedPairs) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPairs));
      setPairs(updatedPairs);
      setError(null);
    } catch (err) {
      setError('通貨ペアデータの保存に失敗しました');
      console.error('Currency pairs save error:', err);
    }
  }, []);

  const addPair = useCallback((pairName) => {
    try {
      if (!pairName || typeof pairName !== 'string') {
        throw new Error('無効な通貨ペア名です');
      }
      
      const exists = pairs.some(pair => 
        pair.name.toLowerCase() === pairName.toLowerCase()
      );
      
      if (exists) {
        throw new Error('この通貨ペアは既に存在します');
      }

      const newPair = {
        id: Math.max(...pairs.map(p => p.id), 0) + 1,
        name: pairName.toUpperCase(),
        category: getCurrencyCategory(pairName),
        isActive: true,
        displayOrder: pairs.length + 1,
        createdAt: new Date().toISOString()
      };

      const updatedPairs = [...pairs, newPair];
      savePairs(updatedPairs);
      return newPair;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [pairs, savePairs]);

  const updatePair = useCallback((pairId, updates) => {
    try {
      const updatedPairs = pairs.map(pair => 
        pair.id === pairId 
          ? { ...pair, ...updates, updatedAt: new Date().toISOString() }
          : pair
      );
      savePairs(updatedPairs);
    } catch (err) {
      setError('通貨ペアの更新に失敗しました');
      throw err;
    }
  }, [pairs, savePairs]);

  const deletePair = useCallback((pairId) => {
    try {
      const updatedPairs = pairs.filter(pair => pair.id !== pairId);
      savePairs(updatedPairs);
    } catch (err) {
      setError('通貨ペアの削除に失敗しました');
      throw err;
    }
  }, [pairs, savePairs]);

  const reorderPairs = useCallback((reorderedPairs) => {
    try {
      const updatedPairs = reorderedPairs.map((pair, index) => ({
        ...pair,
        displayOrder: index + 1,
        updatedAt: new Date().toISOString()
      }));
      savePairs(updatedPairs);
    } catch (err) {
      setError('通貨ペアの並び替えに失敗しました');
      throw err;
    }
  }, [savePairs]);

  const getActivePairs = useCallback(() => {
    return pairs.filter(pair => pair.isActive).sort((a, b) => a.displayOrder - b.displayOrder);
  }, [pairs]);

  useEffect(() => {
    loadPairs();
  }, [loadPairs]);

  return {
    pairs,
    activePairs: getActivePairs(),
    error,
    addPair,
    updatePair,
    deletePair,
    reorderPairs,
    loadPairs
  };
};

function getCurrencyCategory(pairName) {
  const majorPairs = ['USD/JPY', 'EUR/USD', 'GBP/USD', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD'];
  const crossPairs = ['EUR/JPY', 'GBP/JPY', 'CHF/JPY', 'AUD/JPY', 'CAD/JPY', 'NZD/JPY', 'EUR/GBP', 'EUR/CHF'];
  
  if (majorPairs.includes(pairName)) return 'メジャー';
  if (crossPairs.includes(pairName)) return 'クロス';
  return 'エキゾチック';
}

export default useCurrencyPairs;