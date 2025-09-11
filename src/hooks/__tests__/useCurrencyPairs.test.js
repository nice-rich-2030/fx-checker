import { renderHook, act } from '@testing-library/react';
import useCurrencyPairs from '../useCurrencyPairs';

const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => store[key] = value.toString(),
    removeItem: (key) => delete store[key],
    clear: () => store = {}
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('useCurrencyPairs', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('初期化時にデフォルト通貨ペアがロードされる', () => {
    const { result } = renderHook(() => useCurrencyPairs());
    
    expect(result.current.pairs.length).toBeGreaterThan(0);
    expect(result.current.pairs[0].name).toBe('USD/JPY');
    expect(result.current.pairs[0].category).toBe('メジャー');
  });

  test('新しい通貨ペアを追加できる', () => {
    const { result } = renderHook(() => useCurrencyPairs());
    
    act(() => {
      result.current.addPair('BTC/USD');
    });

    const addedPair = result.current.pairs.find(pair => pair.name === 'BTC/USD');
    expect(addedPair).toBeDefined();
    expect(addedPair.category).toBe('エキゾチック');
    expect(addedPair.isActive).toBe(true);
  });

  test('重複した通貨ペアを追加しようとするとエラーが発生する', () => {
    const { result } = renderHook(() => useCurrencyPairs());
    
    expect(() => {
      act(() => {
        result.current.addPair('USD/JPY');
      });
    }).toThrow('この通貨ペアは既に存在します');
  });

  test('通貨ペアを更新できる', () => {
    const { result } = renderHook(() => useCurrencyPairs());
    
    const firstPairId = result.current.pairs[0].id;
    
    act(() => {
      result.current.updatePair(firstPairId, { isActive: false });
    });

    const updatedPair = result.current.pairs.find(pair => pair.id === firstPairId);
    expect(updatedPair.isActive).toBe(false);
    expect(updatedPair.updatedAt).toBeDefined();
  });

  test('通貨ペアを削除できる', () => {
    const { result } = renderHook(() => useCurrencyPairs());
    
    const initialCount = result.current.pairs.length;
    const firstPairId = result.current.pairs[0].id;
    
    act(() => {
      result.current.deletePair(firstPairId);
    });

    expect(result.current.pairs.length).toBe(initialCount - 1);
    expect(result.current.pairs.find(pair => pair.id === firstPairId)).toBeUndefined();
  });

  test('アクティブな通貨ペアのみを取得できる', () => {
    const { result } = renderHook(() => useCurrencyPairs());
    
    const firstPairId = result.current.pairs[0].id;
    
    act(() => {
      result.current.updatePair(firstPairId, { isActive: false });
    });

    expect(result.current.activePairs.length).toBe(result.current.pairs.length - 1);
    expect(result.current.activePairs.find(pair => pair.id === firstPairId)).toBeUndefined();
  });

  test('通貨ペアの並び替えができる', () => {
    const { result } = renderHook(() => useCurrencyPairs());
    
    const originalPairs = [...result.current.pairs];
    const reorderedPairs = [originalPairs[1], originalPairs[0], ...originalPairs.slice(2)];
    
    act(() => {
      result.current.reorderPairs(reorderedPairs);
    });

    expect(result.current.pairs[0].displayOrder).toBe(1);
    expect(result.current.pairs[1].displayOrder).toBe(2);
  });

  test('無効な通貨ペア名でエラーが発生する', () => {
    const { result } = renderHook(() => useCurrencyPairs());
    
    expect(() => {
      act(() => {
        result.current.addPair('');
      });
    }).toThrow('無効な通貨ペア名です');

    expect(() => {
      act(() => {
        result.current.addPair(null);
      });
    }).toThrow('無効な通貨ペア名です');
  });

  test('データがlocalStorageに保存される', () => {
    const { result } = renderHook(() => useCurrencyPairs());
    
    act(() => {
      result.current.addPair('TEST/USD');
    });

    const stored = localStorage.getItem('fx-checker-currency-pairs');
    expect(stored).toBeTruthy();
    
    const parsedData = JSON.parse(stored);
    expect(parsedData.some(pair => pair.name === 'TEST/USD')).toBe(true);
  });
});