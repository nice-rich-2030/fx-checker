import { useState, useCallback, useEffect } from 'react';

const DEFAULT_TIMEFRAMES = [
  { id: 1, name: '15M', displayName: '15分足', minutes: 15, isActive: true, displayOrder: 1 },
  { id: 2, name: '30M', displayName: '30分足', minutes: 30, isActive: true, displayOrder: 2 },
  { id: 3, name: '1H', displayName: '1時間足', minutes: 60, isActive: true, displayOrder: 3 },
  { id: 4, name: '4H', displayName: '4時間足', minutes: 240, isActive: true, displayOrder: 4 },
  { id: 5, name: '1D', displayName: '日足', minutes: 1440, isActive: true, displayOrder: 5 }
];

const STORAGE_KEY = 'fx-checker-timeframes';

const useTimeframes = () => {
  const [timeframes, setTimeframes] = useState([]);
  const [error, setError] = useState(null);

  const loadTimeframes = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedTimeframes = JSON.parse(stored);
        setTimeframes(parsedTimeframes);
      } else {
        const defaultTimeframes = DEFAULT_TIMEFRAMES.map(tf => ({
          ...tf,
          createdAt: new Date().toISOString()
        }));
        setTimeframes(defaultTimeframes);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultTimeframes));
      }
      setError(null);
    } catch (err) {
      setError('時間足データの読み込みに失敗しました');
      console.error('Timeframes load error:', err);
    }
  }, []);

  const saveTimeframes = useCallback((updatedTimeframes) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTimeframes));
      setTimeframes(updatedTimeframes);
      setError(null);
    } catch (err) {
      setError('時間足データの保存に失敗しました');
      console.error('Timeframes save error:', err);
    }
  }, []);

  const addTimeframe = useCallback((timeframeData) => {
    try {
      const { name, displayName, minutes } = timeframeData;
      
      if (!name || !displayName || !minutes) {
        throw new Error('時間足データが不完全です');
      }

      const exists = timeframes.some(tf => 
        tf.name.toLowerCase() === name.toLowerCase() || tf.minutes === minutes
      );

      if (exists) {
        throw new Error('この時間足は既に存在します');
      }

      const newTimeframe = {
        id: Math.max(...timeframes.map(tf => tf.id), 0) + 1,
        name: name.toUpperCase(),
        displayName,
        minutes: parseInt(minutes),
        isActive: true,
        displayOrder: timeframes.length + 1,
        createdAt: new Date().toISOString()
      };

      const updatedTimeframes = [...timeframes, newTimeframe];
      saveTimeframes(updatedTimeframes);
      return newTimeframe;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [timeframes, saveTimeframes]);

  const updateTimeframe = useCallback((timeframeId, updates) => {
    try {
      const updatedTimeframes = timeframes.map(tf => 
        tf.id === timeframeId 
          ? { ...tf, ...updates, updatedAt: new Date().toISOString() }
          : tf
      );
      saveTimeframes(updatedTimeframes);
    } catch (err) {
      setError('時間足の更新に失敗しました');
      throw err;
    }
  }, [timeframes, saveTimeframes]);

  const deleteTimeframe = useCallback((timeframeId) => {
    try {
      const updatedTimeframes = timeframes.filter(tf => tf.id !== timeframeId);
      saveTimeframes(updatedTimeframes);
    } catch (err) {
      setError('時間足の削除に失敗しました');
      throw err;
    }
  }, [timeframes, saveTimeframes]);

  const reorderTimeframes = useCallback((reorderedTimeframes) => {
    try {
      const updatedTimeframes = reorderedTimeframes.map((tf, index) => ({
        ...tf,
        displayOrder: index + 1,
        updatedAt: new Date().toISOString()
      }));
      saveTimeframes(updatedTimeframes);
    } catch (err) {
      setError('時間足の並び替えに失敗しました');
      throw err;
    }
  }, [saveTimeframes]);

  const getActiveTimeframes = useCallback(() => {
    return timeframes
      .filter(tf => tf.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [timeframes]);

  const getTimeframeById = useCallback((timeframeId) => {
    return timeframes.find(tf => tf.id === timeframeId);
  }, [timeframes]);

  const getTimeframeByName = useCallback((timeframeName) => {
    return timeframes.find(tf => tf.name.toLowerCase() === timeframeName.toLowerCase());
  }, [timeframes]);

  useEffect(() => {
    loadTimeframes();
  }, [loadTimeframes]);

  return {
    timeframes,
    activeTimeframes: getActiveTimeframes(),
    error,
    addTimeframe,
    updateTimeframe,
    deleteTimeframe,
    reorderTimeframes,
    getTimeframeById,
    getTimeframeByName,
    loadTimeframes
  };
};

export default useTimeframes;