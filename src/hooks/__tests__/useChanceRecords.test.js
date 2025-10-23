import { renderHook, act } from '@testing-library/react';
import useChanceRecords from '../useChanceRecords';

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

describe('useChanceRecords', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('初期化時は空のレコード配列がロードされる', () => {
    const { result } = renderHook(() => useChanceRecords());
    
    expect(result.current.records).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  test('新しいレコードを追加できる', () => {
    const { result } = renderHook(() => useChanceRecords());
    
    const recordData = {
      currencyPair: 'USD/JPY',
      timeframe: '1H',
      pattern: 'ダブルトップ',
      direction: 'ショート',
      confidence: 4,
      memo: 'テストメモ'
    };

    act(() => {
      result.current.addRecord(recordData);
    });

    expect(result.current.records.length).toBe(1);
    expect(result.current.records[0].currencyPair).toBe('USD/JPY');
    expect(result.current.records[0].direction).toBe('ショート');
    expect(result.current.records[0].confidence).toBe(4);
    expect(result.current.records[0].memo).toBe('テストメモ');
    expect(result.current.records[0].id).toBeDefined();
    expect(result.current.records[0].createdAt).toBeDefined();
  });

  test('必須項目が不足している場合エラーが発生する', () => {
    const { result } = renderHook(() => useChanceRecords());
    
    expect(() => {
      act(() => {
        result.current.addRecord({
          currencyPair: 'USD/JPY',
          timeframe: '1H'
        });
      });
    }).toThrow('必須項目が不足しています');
  });

  test('無効な方向を指定した場合エラーが発生する', () => {
    const { result } = renderHook(() => useChanceRecords());
    
    expect(() => {
      act(() => {
        result.current.addRecord({
          currencyPair: 'USD/JPY',
          timeframe: '1H',
          pattern: 'テスト',
          direction: '無効な方向'
        });
      });
    }).toThrow('方向はロングまたはショートを選択してください');
  });

  test('レコードを更新できる', () => {
    const { result } = renderHook(() => useChanceRecords());
    
    act(() => {
      result.current.addRecord({
        currencyPair: 'USD/JPY',
        timeframe: '1H',
        pattern: 'テスト',
        direction: 'ロング'
      });
    });

    const recordId = result.current.records[0].id;

    act(() => {
      result.current.updateRecord(recordId, {
        tradeExecuted: true,
        tradeResult: '成功'
      });
    });

    expect(result.current.records[0].tradeExecuted).toBe(true);
    expect(result.current.records[0].tradeResult).toBe('成功');
    expect(result.current.records[0].updatedAt).toBeDefined();
  });

  test('レコードを削除できる', () => {
    const { result } = renderHook(() => useChanceRecords());
    
    act(() => {
      result.current.addRecord({
        currencyPair: 'USD/JPY',
        timeframe: '1H',
        pattern: 'テスト',
        direction: 'ロング'
      });
    });

    const recordId = result.current.records[0].id;

    act(() => {
      result.current.deleteRecord(recordId);
    });

    expect(result.current.records.length).toBe(0);
  });

  test('フィルターでレコードを検索できる', () => {
    const { result } = renderHook(() => useChanceRecords());

    act(() => {
      result.current.addRecord({
        currencyPair: 'USD/JPY',
        timeframe: '1H',
        pattern: 'ダブルトップ',
        direction: 'ショート'
      });
    });

    act(() => {
      result.current.addRecord({
        currencyPair: 'EUR/USD',
        timeframe: '4H',
        pattern: 'ダブルボトム',
        direction: 'ロング'
      });
    });

    const filteredRecords = result.current.getRecordsByFilter({
      currencyPair: 'USD/JPY'
    });

    expect(filteredRecords.length).toBe(1);
    expect(filteredRecords[0].currencyPair).toBe('USD/JPY');
  });

  test('統計情報を正しく計算する', () => {
    const { result } = renderHook(() => useChanceRecords());

    act(() => {
      result.current.addRecord({
        currencyPair: 'USD/JPY',
        timeframe: '1H',
        pattern: 'ダブルトップ',
        direction: 'ショート'
      });
    });

    act(() => {
      result.current.addRecord({
        currencyPair: 'USD/JPY',
        timeframe: '4H',
        pattern: 'ダブルボトム',
        direction: 'ロング'
      });
    });

    const recordId = result.current.records[0].id;

    act(() => {
      result.current.updateRecord(recordId, {
        tradeExecuted: true,
        tradeResult: '成功'
      });
    });

    const stats = result.current.getStatistics();

    expect(stats.totalRecords).toBe(2);
    expect(stats.executedTrades).toBe(1);
    expect(stats.successfulTrades).toBe(1);
    expect(stats.successRate).toBe('100.0');
    expect(stats.currencyPairCounts['USD/JPY']).toBe(2);
    expect(stats.directionCounts['ショート']).toBe(1);
    expect(stats.directionCounts['ロング']).toBe(1);
  });

  test('メモの文字数制限をチェックする', () => {
    const { result } = renderHook(() => useChanceRecords());
    
    const longMemo = 'a'.repeat(201);
    
    expect(() => {
      act(() => {
        result.current.addRecord({
          currencyPair: 'USD/JPY',
          timeframe: '1H',
          pattern: 'テスト',
          direction: 'ロング',
          memo: longMemo
        });
      });
    }).toThrow('メモは200文字以内で入力してください');
  });

  test('確信度の範囲をチェックする', () => {
    const { result } = renderHook(() => useChanceRecords());
    
    act(() => {
      result.current.addRecord({
        currencyPair: 'USD/JPY',
        timeframe: '1H',
        pattern: 'テスト',
        direction: 'ロング',
        confidence: 10
      });
    });

    expect(result.current.records[0].confidence).toBe(5);

    act(() => {
      result.current.addRecord({
        currencyPair: 'EUR/USD',
        timeframe: '1H',
        pattern: 'テスト',
        direction: 'ロング',
        confidence: -1
      });
    });

    expect(result.current.records[1].confidence).toBe(1);
  });
});