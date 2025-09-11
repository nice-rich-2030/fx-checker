import React, { useMemo } from 'react';
import useChanceRecords from '../hooks/useChanceRecords';

const AnalysisView = () => {
  const { records, getStatistics } = useChanceRecords();
  
  const stats = useMemo(() => getStatistics(), [getStatistics]);
  
  const monthlyData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const thisMonthRecords = records.filter(record => {
      const recordDate = new Date(record.createdAt);
      return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
    });
    
    const lastMonthRecords = records.filter(record => {
      const recordDate = new Date(record.createdAt);
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const year = currentMonth === 0 ? currentYear - 1 : currentYear;
      return recordDate.getMonth() === lastMonth && recordDate.getFullYear() === year;
    });
    
    return {
      thisMonth: thisMonthRecords.length,
      lastMonth: lastMonthRecords.length,
      change: thisMonthRecords.length - lastMonthRecords.length
    };
  }, [records]);

  const topPatterns = useMemo(() => {
    return Object.entries(stats.patternCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([pattern, count]) => ({ pattern, count }));
  }, [stats.patternCounts]);

  const topCurrencyPairs = useMemo(() => {
    return Object.entries(stats.currencyPairCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([pair, count]) => ({ pair, count }));
  }, [stats.currencyPairCounts]);

  const renderChart = (data, title, colorClass) => (
    <div style={{
      backgroundColor: 'white',
      padding: '20px',
      border: '1px solid #dee2e6',
      borderRadius: '8px',
      marginBottom: '20px'
    }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>{title}</h3>
      {data.length === 0 ? (
        <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>データがありません</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {data.map((item, index) => {
            const label = item.pattern || item.pair;
            const maxCount = Math.max(...data.map(d => d.count));
            const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
            
            return (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ minWidth: '120px', fontSize: '14px' }}>{label}</div>
                <div style={{ 
                  flex: 1, 
                  height: '20px', 
                  backgroundColor: '#f0f0f0', 
                  borderRadius: '10px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${percentage}%`,
                    backgroundColor: colorClass === 'blue' ? '#007bff' : 
                                   colorClass === 'green' ? '#28a745' : '#17a2b8',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <div style={{ minWidth: '30px', fontSize: '14px', fontWeight: 'bold' }}>
                  {item.count}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ marginTop: 0, marginBottom: '30px' }}>分析ダッシュボード</h2>
      
      {/* 統計カード */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          backgroundColor: '#007bff',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '5px' }}>
            {stats.totalRecords}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>総記録数</div>
        </div>

        <div style={{
          backgroundColor: '#28a745',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '5px' }}>
            {stats.executedTrades}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>実行済み</div>
        </div>

        <div style={{
          backgroundColor: '#17a2b8',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '5px' }}>
            {stats.successRate}%
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>成功率</div>
        </div>

        <div style={{
          backgroundColor: '#6c757d',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
            {monthlyData.thisMonth}
            {monthlyData.change !== 0 && (
              <span style={{ 
                fontSize: '14px', 
                marginLeft: '8px',
                color: monthlyData.change > 0 ? '#90EE90' : '#FFB6C1'
              }}>
                {monthlyData.change > 0 ? '+' : ''}{monthlyData.change}
              </span>
            )}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>今月の記録</div>
        </div>
      </div>

      {/* チャート */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
        gap: '20px' 
      }}>
        {renderChart(topCurrencyPairs, 'トップ通貨ペア', 'blue')}
        {renderChart(topPatterns, 'トップエントリーパターン', 'green')}
      </div>

      {/* ロング/ショート比率 */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>ロング/ショート比率</h3>
        {stats.totalRecords === 0 ? (
          <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>データがありません</p>
        ) : (
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '20px',
                height: '20px',
                backgroundColor: '#28a745',
                borderRadius: '4px'
              }} />
              <span>ロング: {stats.directionCounts['ロング'] || 0}件</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '20px',
                height: '20px',
                backgroundColor: '#dc3545',
                borderRadius: '4px'
              }} />
              <span>ショート: {stats.directionCounts['ショート'] || 0}件</span>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              {stats.totalRecords > 0 && (
                <span style={{ color: '#666' }}>
                  比率 {Math.round(((stats.directionCounts['ロング'] || 0) / stats.totalRecords) * 100)}% : {Math.round(((stats.directionCounts['ショート'] || 0) / stats.totalRecords) * 100)}%
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {records.length === 0 && (
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '40px',
          textAlign: 'center',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          color: '#666'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>📈</div>
          <h3 style={{ margin: '0 0 10px 0' }}>まだ記録がありません</h3>
          <p style={{ margin: 0 }}>チャンスを記録すると、こちらで分析結果が表示されます</p>
        </div>
      )}
    </div>
  );
};

export default AnalysisView;