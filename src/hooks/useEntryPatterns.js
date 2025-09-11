import { useState, useCallback, useEffect } from 'react';

const DEFAULT_PATTERNS = [
  // リバーサルパターン
  { id: 1, name: 'ヘッドアンドショルダー', category: 'リバーサル', description: '三つの山で中央が最も高いパターン', reliability: 4 },
  { id: 2, name: '逆ヘッドアンドショルダー', category: 'リバーサル', description: '三つの谷で中央が最も深いパターン', reliability: 4 },
  { id: 3, name: 'ダブルトップ', category: 'リバーサル', description: '二つの山が同じ高さのパターン', reliability: 3 },
  { id: 4, name: 'ダブルボトム', category: 'リバーサル', description: '二つの谷が同じ深さのパターン', reliability: 3 },
  { id: 5, name: 'トリプルトップ', category: 'リバーサル', description: '三つの山が同じ高さのパターン', reliability: 4 },
  { id: 6, name: 'トリプルボトム', category: 'リバーサル', description: '三つの谷が同じ深さのパターン', reliability: 4 },
  
  // 継続パターン
  { id: 7, name: 'フラッグ', category: '継続', description: 'トレンド方向と逆の小さな矩形', reliability: 3 },
  { id: 8, name: 'ペナント', category: '継続', description: '小さな三角形の継続パターン', reliability: 3 },
  { id: 9, name: 'ウェッジ', category: '継続', description: '楔形の継続パターン', reliability: 3 },
  { id: 10, name: '三角形', category: '継続', description: '上昇・下降・対称三角形', reliability: 2 },
  { id: 11, name: 'レクタングル', category: '継続', description: '水平なサポート・レジスタンス', reliability: 3 },
  
  // N字パターン
  { id: 12, name: 'N字上昇', category: 'N字', description: 'N字型の上昇パターン', reliability: 3 },
  { id: 13, name: 'N字下降', category: 'N字', description: 'N字型の下降パターン', reliability: 3 },
  { id: 14, name: 'W字', category: 'N字', description: 'W字型のボトムパターン', reliability: 3 },
  { id: 15, name: 'M字', category: 'N字', description: 'M字型のトップパターン', reliability: 3 },
  
  // ハーモニックパターン
  { id: 16, name: 'ガートレー', category: 'ハーモニック', description: 'フィボナッチ比率による調和パターン', reliability: 4 },
  { id: 17, name: 'バット', category: 'ハーモニック', description: 'ガートレーの変形パターン', reliability: 4 },
  { id: 18, name: 'バタフライ', category: 'ハーモニック', description: '蝶のような形のパターン', reliability: 4 },
  { id: 19, name: 'クラブ', category: 'ハーモニック', description: 'カニのような形のパターン', reliability: 4 },
  
  // その他
  { id: 20, name: 'ブレイクアウト', category: 'その他', description: 'サポート・レジスタンス突破', reliability: 3 },
  { id: 21, name: 'プルバック', category: 'その他', description: 'ブレイク後の押し戻し', reliability: 2 },
  { id: 22, name: '押し目買い', category: 'その他', description: '上昇トレンドでの押し目', reliability: 3 },
  { id: 23, name: '戻り売り', category: 'その他', description: '下降トレンドでの戻り', reliability: 3 }
];

const STORAGE_KEY = 'fx-checker-entry-patterns';

const useEntryPatterns = () => {
  const [patterns, setPatterns] = useState([]);
  const [error, setError] = useState(null);

  const loadPatterns = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedPatterns = JSON.parse(stored);
        setPatterns(parsedPatterns);
      } else {
        const defaultPatterns = DEFAULT_PATTERNS.map(pattern => ({
          ...pattern,
          isCustom: false,
          isActive: true,
          displayOrder: pattern.id,
          createdAt: new Date().toISOString()
        }));
        setPatterns(defaultPatterns);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPatterns));
      }
      setError(null);
    } catch (err) {
      setError('エントリーパターンデータの読み込みに失敗しました');
      console.error('Entry patterns load error:', err);
    }
  }, []);

  const savePatterns = useCallback((updatedPatterns) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPatterns));
      setPatterns(updatedPatterns);
      setError(null);
    } catch (err) {
      setError('エントリーパターンデータの保存に失敗しました');
      console.error('Entry patterns save error:', err);
    }
  }, []);

  const addPattern = useCallback((patternData) => {
    try {
      const { name, category, description = '', reliability = 3 } = patternData;
      
      if (!name || !category) {
        throw new Error('パターン名とカテゴリは必須です');
      }

      const exists = patterns.some(pattern => 
        pattern.name.toLowerCase() === name.toLowerCase()
      );

      if (exists) {
        throw new Error('このパターンは既に存在します');
      }

      const reliabilityValue = Math.max(1, Math.min(5, parseInt(reliability)));

      const newPattern = {
        id: Math.max(...patterns.map(p => p.id), 0) + 1,
        name: name.trim(),
        category,
        description: description.trim(),
        reliability: reliabilityValue,
        isCustom: true,
        isActive: true,
        displayOrder: patterns.length + 1,
        createdAt: new Date().toISOString()
      };

      const updatedPatterns = [...patterns, newPattern];
      savePatterns(updatedPatterns);
      return newPattern;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [patterns, savePatterns]);

  const updatePattern = useCallback((patternId, updates) => {
    try {
      const updatedPatterns = patterns.map(pattern => {
        if (pattern.id === patternId) {
          const updatedPattern = { ...pattern, ...updates };
          if (updates.reliability !== undefined) {
            updatedPattern.reliability = Math.max(1, Math.min(5, parseInt(updates.reliability)));
          }
          updatedPattern.updatedAt = new Date().toISOString();
          return updatedPattern;
        }
        return pattern;
      });
      savePatterns(updatedPatterns);
    } catch (err) {
      setError('エントリーパターンの更新に失敗しました');
      throw err;
    }
  }, [patterns, savePatterns]);

  const deletePattern = useCallback((patternId) => {
    try {
      const pattern = patterns.find(p => p.id === patternId);
      if (pattern && !pattern.isCustom) {
        throw new Error('デフォルトパターンは削除できません');
      }
      
      const updatedPatterns = patterns.filter(pattern => pattern.id !== patternId);
      savePatterns(updatedPatterns);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [patterns, savePatterns]);

  const getPatternsByCategory = useCallback((category) => {
    return patterns
      .filter(pattern => pattern.category === category && pattern.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [patterns]);

  const getActivePatterns = useCallback(() => {
    return patterns
      .filter(pattern => pattern.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [patterns]);

  const getPatternCategories = useCallback(() => {
    const categories = [...new Set(patterns.map(pattern => pattern.category))];
    return categories.sort();
  }, [patterns]);

  const getPatternById = useCallback((patternId) => {
    return patterns.find(pattern => pattern.id === patternId);
  }, [patterns]);

  const searchPatterns = useCallback((searchTerm) => {
    if (!searchTerm) return getActivePatterns();
    
    const term = searchTerm.toLowerCase();
    return patterns
      .filter(pattern => 
        pattern.isActive && (
          pattern.name.toLowerCase().includes(term) ||
          pattern.description.toLowerCase().includes(term) ||
          pattern.category.toLowerCase().includes(term)
        )
      )
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [patterns, getActivePatterns]);

  useEffect(() => {
    loadPatterns();
  }, [loadPatterns]);

  return {
    patterns,
    activePatterns: getActivePatterns(),
    categories: getPatternCategories(),
    error,
    addPattern,
    updatePattern,
    deletePattern,
    getPatternsByCategory,
    getPatternById,
    searchPatterns,
    loadPatterns
  };
};

export default useEntryPatterns;