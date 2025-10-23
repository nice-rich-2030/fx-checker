import React, { useState, useCallback, useMemo } from 'react';
import useChanceRecords from '../hooks/useChanceRecords';
import useCurrencyPairs from '../hooks/useCurrencyPairs';
import useTimeframes from '../hooks/useTimeframes';
import useEntryPatterns from '../hooks/useEntryPatterns';
import useSavedFilters from '../hooks/useSavedFilters';

const RecordList = () => {
  const { records, getRecordsByFilter, searchRecords, updateRecord, deleteRecord } = useChanceRecords();
  const { activePairs } = useCurrencyPairs();
  const { activeTimeframes } = useTimeframes();
  const { activePatterns } = useEntryPatterns();
  const { savedFilters, saveFilter, deleteFilter, updateFilterUsage } = useSavedFilters();

  const [filters, setFilters] = useState({
    currencyPair: '',
    timeframe: '',
    pattern: '',
    direction: '',
    minConfidence: 1,
    tradeExecuted: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveFilterName, setSaveFilterName] = useState('');

  const filteredRecords = useMemo(() => {
    let result = records;
    
    if (searchTerm) {
      result = searchRecords(searchTerm);
    } else {
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(([key, value]) => 
          value !== '' && value !== 1 && value !== null
        )
      );
      
      if (Object.keys(activeFilters).length > 0) {
        result = getRecordsByFilter(activeFilters);
      }
    }
    
    return result;
  }, [records, filters, searchTerm, getRecordsByFilter, searchRecords]);

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      currencyPair: '',
      timeframe: '',
      pattern: '',
      direction: '',
      minConfidence: 1,
      tradeExecuted: ''
    });
    setSearchTerm('');
  }, []);

  const handleTradeExecuted = useCallback((recordId, executed) => {
    updateRecord(recordId, { tradeExecuted: executed });
  }, [updateRecord]);

  const handleTradeResult = useCallback((recordId, result) => {
    updateRecord(recordId, { tradeResult: result });
  }, [updateRecord]);

  const applySavedFilter = useCallback((savedFilter) => {
    setFilters(savedFilter.filters);
    setSearchTerm('');
    updateFilterUsage(savedFilter.id);
  }, [updateFilterUsage]);

  const handleSaveFilter = useCallback(() => {
    try {
      saveFilter(saveFilterName, filters);
      setSaveFilterName('');
      setShowSaveDialog(false);
    } catch (err) {
      alert(err.message);
    }
  }, [saveFilter, saveFilterName, filters]);

  const handleDeleteSavedFilter = useCallback((filterId) => {
    if (window.confirm('このフィルターを削除しますか？')) {
      deleteFilter(filterId);
    }
  }, [deleteFilter]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(value => 
      value !== '' && value !== 1 && value !== null
    ).length + (searchTerm ? 1 : 0);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ marginTop: 0 }}>記録一覧 ({filteredRecords.length}件)</h2>
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            padding: '8px 16px',
            backgroundColor: showFilters ? '#007bff' : '#f8f9fa',
            color: showFilters ? 'white' : '#333',
            border: '1px solid #dee2e6',
            cursor: 'pointer'
          }}
        >
          フィルター {getActiveFilterCount() > 0 && `(${getActiveFilterCount()})`}
        </button>
      </div>

      {showFilters && (
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          marginBottom: '20px',
          border: '1px solid #dee2e6'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                検索
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="通貨ペア、パターン、メモで検索"
                style={{ width: '100%', padding: '8px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                通貨ペア
              </label>
              <select
                value={filters.currencyPair}
                onChange={(e) => handleFilterChange('currencyPair', e.target.value)}
                style={{ width: '100%', padding: '8px' }}
              >
                <option value="">すべて</option>
                {activePairs.map(pair => (
                  <option key={pair.id} value={pair.name}>{pair.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                時間足
              </label>
              <select
                value={filters.timeframe}
                onChange={(e) => handleFilterChange('timeframe', e.target.value)}
                style={{ width: '100%', padding: '8px' }}
              >
                <option value="">すべて</option>
                {activeTimeframes.map(tf => (
                  <option key={tf.id} value={tf.name}>{tf.displayName}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                パターン
              </label>
              <select
                value={filters.pattern}
                onChange={(e) => handleFilterChange('pattern', e.target.value)}
                style={{ width: '100%', padding: '8px' }}
              >
                <option value="">すべて</option>
                {activePatterns.map(pattern => (
                  <option key={pattern.id} value={pattern.name}>{pattern.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                方向
              </label>
              <select
                value={filters.direction}
                onChange={(e) => handleFilterChange('direction', e.target.value)}
                style={{ width: '100%', padding: '8px' }}
              >
                <option value="">すべて</option>
                <option value="ロング">ロング</option>
                <option value="ショート">ショート</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                実行状況
              </label>
              <select
                value={filters.tradeExecuted}
                onChange={(e) => handleFilterChange('tradeExecuted', e.target.value === '' ? '' : e.target.value === 'true')}
                style={{ width: '100%', padding: '8px' }}
              >
                <option value="">すべて</option>
                <option value="true">実行済み</option>
                <option value="false">未実行</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={clearFilters}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              フィルタークリア
            </button>
            
            <button
              onClick={() => setShowSaveDialog(true)}
              disabled={getActiveFilterCount() === 0}
              style={{
                padding: '8px 16px',
                backgroundColor: getActiveFilterCount() > 0 ? '#28a745' : '#ccc',
                color: 'white',
                border: 'none',
                cursor: getActiveFilterCount() > 0 ? 'pointer' : 'not-allowed'
              }}
            >
              フィルター保存
            </button>
          </div>

          {savedFilters.length > 0 && (
            <div style={{ marginTop: '15px' }}>
              <h4 style={{ margin: '0 0 10px 0' }}>保存済みフィルター</h4>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {savedFilters.map(savedFilter => (
                  <div key={savedFilter.id} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <button
                      onClick={() => applySavedFilter(savedFilter)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      {savedFilter.name}
                    </button>
                    <button
                      onClick={() => handleDeleteSavedFilter(savedFilter.id)}
                      style={{
                        padding: '6px 8px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {filteredRecords.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          {getActiveFilterCount() > 0 ? '条件に一致する記録がありません' : '記録がありません'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredRecords.map(record => (
            <div
              key={record.id}
              style={{
                border: '1px solid #dee2e6',
                padding: '15px',
                backgroundColor: 'white',
                borderLeft: `4px solid ${record.direction === 'ロング' ? '#28a745' : '#dc3545'}`
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                    <strong style={{ fontSize: '18px' }}>{record.currencyPair}</strong>
                    <span style={{ 
                      backgroundColor: record.direction === 'ロング' ? '#d4edda' : '#f8d7da',
                      color: record.direction === 'ロング' ? '#155724' : '#721c24',
                      padding: '2px 8px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {record.direction}
                    </span>
                  </div>
                  <div style={{ color: '#666', fontSize: '14px' }}>
                    {record.timeframe} | {record.pattern} | 確信度: {record.confidence}
                  </div>
                </div>
                <div style={{ textAlign: 'right', color: '#666', fontSize: '12px' }}>
                  {formatDate(record.createdAt)}
                </div>
              </div>

              {record.memo && (
                <div style={{
                  backgroundColor: '#f8f9fa',
                  padding: '8px',
                  marginBottom: '10px',
                  fontSize: '14px',
                  borderLeft: '3px solid #007bff'
                }}>
                  {record.memo}
                </div>
              )}

              {record.chartUrl && (
                <div style={{ marginTop: '10px', marginBottom: '10px' }}>
                  <img
                    src={record.chartUrl}
                    alt="Chart"
                    style={{ maxWidth: '100%', height: 'auto', border: '1px solid #ddd', display: 'block' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <div style={{ display: 'none', padding: '10px', fontSize: '12px', color: '#999', textAlign: 'center', backgroundColor: '#f8f9fa' }}>
                    画像を読み込めません
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <input
                    type="checkbox"
                    checked={record.tradeExecuted}
                    onChange={(e) => handleTradeExecuted(record.id, e.target.checked)}
                  />
                  実行済み
                </label>

                {record.tradeExecuted && (
                  <select
                    value={record.tradeResult || ''}
                    onChange={(e) => handleTradeResult(record.id, e.target.value)}
                    style={{ padding: '4px 8px' }}
                  >
                    <option value="">結果未設定</option>
                    <option value="成功">成功</option>
                    <option value="失敗">失敗</option>
                  </select>
                )}

                <button
                  onClick={() => deleteRecord(record.id)}
                  style={{
                    marginLeft: 'auto',
                    padding: '4px 8px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                  onClick={(e) => {
                    if (window.confirm('この記録を削除しますか？')) {
                      deleteRecord(record.id);
                    }
                  }}
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showSaveDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            minWidth: '300px',
            maxWidth: '500px'
          }}>
            <h3 style={{ margin: '0 0 15px 0' }}>フィルターを保存</h3>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                フィルター名
              </label>
              <input
                type="text"
                value={saveFilterName}
                onChange={(e) => setSaveFilterName(e.target.value)}
                placeholder="例: USD/JPY ロング 高確信度"
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc' }}
                maxLength="50"
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setSaveFilterName('');
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                キャンセル
              </button>
              <button
                onClick={handleSaveFilter}
                disabled={!saveFilterName.trim()}
                style={{
                  padding: '8px 16px',
                  backgroundColor: saveFilterName.trim() ? '#28a745' : '#ccc',
                  color: 'white',
                  border: 'none',
                  cursor: saveFilterName.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecordList;