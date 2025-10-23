import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChanceRecorder from '../ChanceRecorder';

jest.mock('../../hooks/useCurrencyPairs');
jest.mock('../../hooks/useTimeframes');
jest.mock('../../hooks/useEntryPatterns');
jest.mock('../../hooks/useChanceRecords');

import useCurrencyPairs from '../../hooks/useCurrencyPairs';
import useTimeframes from '../../hooks/useTimeframes';
import useEntryPatterns from '../../hooks/useEntryPatterns';
import useChanceRecords from '../../hooks/useChanceRecords';

const mockCurrencyPairs = [
  { id: 1, name: 'USD/JPY', category: 'メジャー' },
  { id: 2, name: 'EUR/USD', category: 'メジャー' }
];

const mockTimeframes = [
  { id: 1, name: '1H', displayName: '1時間足' },
  { id: 2, name: '4H', displayName: '4時間足' }
];

const mockPatterns = [
  { id: 1, name: 'ダブルトップ', category: 'リバーサル', description: 'テスト' },
  { id: 2, name: 'フラッグ', category: '継続', description: 'テスト' }
];

const mockAddRecord = jest.fn();
const mockGetTodaysRecords = jest.fn();

describe('ChanceRecorder', () => {
  beforeEach(() => {
    useCurrencyPairs.mockReturnValue({
      activePairs: mockCurrencyPairs
    });

    useTimeframes.mockReturnValue({
      activeTimeframes: mockTimeframes
    });

    useEntryPatterns.mockReturnValue({
      activePatterns: mockPatterns,
      categories: ['リバーサル', '継続']
    });

    useChanceRecords.mockReturnValue({
      addRecord: mockAddRecord,
      getTodaysRecords: mockGetTodaysRecords,
      error: null
    });

    mockGetTodaysRecords.mockReturnValue([]);
    mockAddRecord.mockClear();
    mockGetTodaysRecords.mockClear();
  });

  test('コンポーネントが正しくレンダリングされる', () => {
    render(<ChanceRecorder />);

    expect(screen.getByText('チャンス記録')).toBeInTheDocument();
    expect(screen.getByText('通貨ペア *')).toBeInTheDocument();
    expect(screen.getByText('時間足 *')).toBeInTheDocument();
    expect(screen.getByText('エントリーパターン *')).toBeInTheDocument();
    expect(screen.getByText('エントリー方向 *')).toBeInTheDocument();
  });

  test('通貨ペア選択ができる', async () => {
    const user = userEvent.setup();
    render(<ChanceRecorder />);
    
    const currencySelect = screen.getByRole('combobox');
    await user.selectOptions(currencySelect, 'USD/JPY');
    
    expect(currencySelect.value).toBe('USD/JPY');
  });

  test('時間足選択ができる', async () => {
    const user = userEvent.setup();
    render(<ChanceRecorder />);
    
    const timeframeButton = screen.getByText('1時間足');
    await user.click(timeframeButton);
    
    expect(timeframeButton).toHaveStyle('background-color: #007bff');
  });

  test('エントリーパターン選択ができる', async () => {
    const user = userEvent.setup();
    render(<ChanceRecorder />);
    
    const patternButton = screen.getByText('ダブルトップ');
    await user.click(patternButton);
    
    expect(patternButton).toHaveStyle('background-color: #28a745');
  });

  test('エントリー方向選択ができる', async () => {
    const user = userEvent.setup();
    render(<ChanceRecorder />);
    
    const directionButton = screen.getByText('ロング');
    await user.click(directionButton);
    
    expect(directionButton).toHaveStyle('background-color: #28a745');
  });

  test('確信度スライダーが機能する', async () => {
    const user = userEvent.setup();
    render(<ChanceRecorder />);
    
    const slider = screen.getByRole('slider');
    await user.click(slider);
    fireEvent.change(slider, { target: { value: '4' } });
    
    expect(screen.getByText('確信度: 4')).toBeInTheDocument();
  });

  test('メモ入力ができる', async () => {
    const user = userEvent.setup();
    render(<ChanceRecorder />);
    
    const memoTextarea = screen.getByPlaceholderText('根拠やその他の情報を記入してください');
    await user.type(memoTextarea, 'テストメモ');
    
    expect(memoTextarea.value).toBe('テストメモ');
    expect(screen.getByText('5/200文字')).toBeInTheDocument();
  });

  test('必須項目が入力されるまでボタンが無効化される', () => {
    render(<ChanceRecorder />);
    
    const submitButton = screen.getByText('チャンス記録を保存');
    expect(submitButton).toBeDisabled();
  });

  test('フォーム送信が正しく動作する', async () => {
    const user = userEvent.setup();
    mockAddRecord.mockResolvedValue({ id: '1' });
    
    render(<ChanceRecorder />);
    
    await user.selectOptions(screen.getByRole('combobox'), 'USD/JPY');
    await user.click(screen.getByText('1時間足'));
    await user.click(screen.getByText('ダブルトップ'));
    await user.click(screen.getByText('ショート'));
    
    const submitButton = screen.getByText('チャンス記録を保存');
    expect(submitButton).toBeEnabled();
    
    await user.click(submitButton);
    
    expect(mockAddRecord).toHaveBeenCalledWith({
      currencyPair: 'USD/JPY',
      timeframe: '1H',
      pattern: 'ダブルトップ',
      direction: 'ショート',
      confidence: 3,
      memo: '',
      chartUrl: ''
    });
  });

  test('送信成功時にフォームがリセットされる', async () => {
    const user = userEvent.setup();
    mockAddRecord.mockResolvedValue({ id: '1' });
    
    render(<ChanceRecorder />);
    
    await user.selectOptions(screen.getByRole('combobox'), 'USD/JPY');
    await user.click(screen.getByText('1時間足'));
    await user.click(screen.getByText('ダブルトップ'));
    await user.click(screen.getByText('ロング'));
    
    await user.click(screen.getByText('チャンス記録を保存'));
    
    await waitFor(() => {
      expect(screen.getByRole('combobox').value).toBe('');
      expect(screen.getByText('確信度: 3')).toBeInTheDocument();
    });
  });

  test('今日の記録が表示される', () => {
    const mockTodaysRecords = [
      {
        id: '1',
        currencyPair: 'USD/JPY',
        timeframe: '1H',
        pattern: 'ダブルトップ',
        direction: 'ショート',
        confidence: 4,
        memo: 'テスト記録',
        createdAt: new Date().toISOString()
      }
    ];
    
    mockGetTodaysRecords.mockReturnValue(mockTodaysRecords);
    
    render(<ChanceRecorder />);
    
    expect(screen.getByText('今日の記録 (1件)')).toBeInTheDocument();
    expect(screen.getByText('USD/JPY')).toBeInTheDocument();
    expect(screen.getByText('ショート', { selector: 'span' })).toBeInTheDocument();
  });

  test('記録がない場合のメッセージが表示される', () => {
    mockGetTodaysRecords.mockReturnValue([]);
    
    render(<ChanceRecorder />);
    
    expect(screen.getByText('今日の記録 (0件)')).toBeInTheDocument();
    expect(screen.getByText('今日はまだ記録がありません')).toBeInTheDocument();
  });

  test('エラーメッセージが表示される', async () => {
    const user = userEvent.setup();
    mockAddRecord.mockRejectedValue(new Error('テストエラー'));
    
    render(<ChanceRecorder />);
    
    await user.selectOptions(screen.getByRole('combobox'), 'USD/JPY');
    await user.click(screen.getByText('1時間足'));
    await user.click(screen.getByText('ダブルトップ'));
    await user.click(screen.getByText('ロング'));
    await user.click(screen.getByText('チャンス記録を保存'));
    
    await waitFor(() => {
      expect(screen.getByText('テストエラー')).toBeInTheDocument();
    });
  });
});