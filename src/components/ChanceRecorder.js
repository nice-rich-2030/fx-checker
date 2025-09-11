import React, { useState, useCallback } from 'react';
import useCurrencyPairs from '../hooks/useCurrencyPairs';
import useTimeframes from '../hooks/useTimeframes';
import useEntryPatterns from '../hooks/useEntryPatterns';
import useChanceRecords from '../hooks/useChanceRecords';

const ChanceRecorder = () => {
  const { activePairs } = useCurrencyPairs();
  const { activeTimeframes } = useTimeframes();
  const { activePatterns, categories } = useEntryPatterns();
  const { addRecord, getTodaysRecords, error: recordError } = useChanceRecords();

  const [selectedPair, setSelectedPair] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState('');
  const [selectedPattern, setSelectedPattern] = useState('');
  const [selectedDirection, setSelectedDirection] = useState('');
  const [confidence, setConfidence] = useState(3);
  const [memo, setMemo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const todaysRecords = getTodaysRecords();

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    setSuccessMessage('');

    try {
      await addRecord({
        currencyPair: selectedPair,
        timeframe: selectedTimeframe,
        pattern: selectedPattern,
        direction: selectedDirection,
        confidence,
        memo
      });

      setSelectedPair('');
      setSelectedTimeframe('');
      setSelectedPattern('');
      setSelectedDirection('');
      setConfidence(3);
      setMemo('');
      setSuccessMessage('チャンス記録を保存しました');
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setSubmitError(err.message || '保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedPair, selectedTimeframe, selectedPattern, selectedDirection, confidence, memo, addRecord]);

  const isFormValid = selectedPair && selectedTimeframe && selectedPattern && selectedDirection;

  const getPatternsByCategory = useCallback((category) => {
    return activePatterns.filter(pattern => pattern.category === category);
  }, [activePatterns]);

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h1>FXチャンス記録ツール</h1>
      
      {recordError && (
        <div style={{ padding: '10px', backgroundColor: '#ffebee', border: '1px solid #f44336', marginBottom: '20px' }}>
          エラー: {recordError}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ marginBottom: '30px' }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            通貨ペア *
          </label>
          <select 
            value={selectedPair} 
            onChange={(e) => setSelectedPair(e.target.value)}
            style={{ width: '100%', padding: '8px', fontSize: '16px' }}
            required
          >
            <option value="">選択してください</option>
            {activePairs.map(pair => (
              <option key={pair.id} value={pair.name}>
                {pair.name} ({pair.category})
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            時間足 *
          </label>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {activeTimeframes.map(timeframe => (
              <button
                key={timeframe.id}
                type="button"
                onClick={() => setSelectedTimeframe(timeframe.name)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ccc',
                  backgroundColor: selectedTimeframe === timeframe.name ? '#007bff' : 'white',
                  color: selectedTimeframe === timeframe.name ? 'white' : 'black',
                  cursor: 'pointer'
                }}
              >
                {timeframe.displayName}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            エントリーパターン *
          </label>
          {categories.map(category => (
            <div key={category} style={{ marginBottom: '10px' }}>
              <h4 style={{ margin: '10px 0 5px 0', color: '#666' }}>{category}</h4>
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                {getPatternsByCategory(category).map(pattern => (
                  <button
                    key={pattern.id}
                    type="button"
                    onClick={() => setSelectedPattern(pattern.name)}
                    style={{
                      padding: '6px 12px',
                      border: '1px solid #ccc',
                      backgroundColor: selectedPattern === pattern.name ? '#28a745' : 'white',
                      color: selectedPattern === pattern.name ? 'white' : 'black',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                    title={pattern.description}
                  >
                    {pattern.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            エントリー方向 *
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            {['ロング', 'ショート'].map(direction => (
              <button
                key={direction}
                type="button"
                onClick={() => setSelectedDirection(direction)}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #ccc',
                  backgroundColor: selectedDirection === direction ? 
                    (direction === 'ロング' ? '#28a745' : '#dc3545') : 'white',
                  color: selectedDirection === direction ? 'white' : 'black',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                {direction}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            確信度: {confidence}
          </label>
          <input
            type="range"
            min="1"
            max="5"
            value={confidence}
            onChange={(e) => setConfidence(parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666' }}>
            <span>1(低)</span>
            <span>2</span>
            <span>3(中)</span>
            <span>4</span>
            <span>5(高)</span>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            メモ (任意、200文字以内)
          </label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            maxLength="200"
            style={{ width: '100%', height: '80px', padding: '8px', fontSize: '14px' }}
            placeholder="根拠やその他の情報を記入してください"
          />
          <div style={{ fontSize: '12px', color: '#666', textAlign: 'right' }}>
            {memo.length}/200文字
          </div>
        </div>

        {submitError && (
          <div style={{ padding: '10px', backgroundColor: '#ffebee', border: '1px solid #f44336', marginBottom: '10px' }}>
            {submitError}
          </div>
        )}

        {successMessage && (
          <div style={{ padding: '10px', backgroundColor: '#e8f5e8', border: '1px solid #28a745', marginBottom: '10px' }}>
            {successMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={!isFormValid || isSubmitting}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: isFormValid ? '#007bff' : '#ccc',
            color: 'white',
            border: 'none',
            fontSize: '16px',
            cursor: isFormValid ? 'pointer' : 'not-allowed'
          }}
        >
          {isSubmitting ? '保存中...' : 'チャンス記録を保存'}
        </button>
      </form>

      <div>
        <h2>今日の記録 ({todaysRecords.length}件)</h2>
        {todaysRecords.length === 0 ? (
          <p style={{ color: '#666' }}>今日はまだ記録がありません</p>
        ) : (
          <div>
            {todaysRecords.slice(0, 5).map(record => (
              <div key={record.id} style={{ 
                border: '1px solid #ddd', 
                padding: '10px', 
                marginBottom: '10px',
                backgroundColor: '#f9f9f9'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <strong>{record.currencyPair}</strong>
                  <span style={{ fontSize: '12px', color: '#666' }}>
                    {new Date(record.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <div>
                  {record.timeframe} | {record.pattern} | 
                  <span style={{ color: record.direction === 'ロング' ? '#28a745' : '#dc3545' }}>
                    {record.direction}
                  </span>
                  | 確信度: {record.confidence}
                </div>
                {record.memo && (
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                    {record.memo}
                  </div>
                )}
              </div>
            ))}
            {todaysRecords.length > 5 && (
              <p style={{ color: '#666', fontSize: '14px' }}>
                他 {todaysRecords.length - 5} 件の記録があります
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChanceRecorder;