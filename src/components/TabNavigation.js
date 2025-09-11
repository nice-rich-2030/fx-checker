import React from 'react';

const TabNavigation = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'record', label: '記録', icon: '📝' },
    { id: 'list', label: '一覧', icon: '📋' },
    { id: 'analysis', label: '分析', icon: '📊' }
  ];

  return (
    <div style={{
      display: 'flex',
      backgroundColor: '#f8f9fa',
      borderBottom: '1px solid #dee2e6',
      marginBottom: '20px'
    }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            flex: 1,
            padding: '15px 10px',
            border: 'none',
            backgroundColor: activeTab === tab.id ? '#007bff' : 'transparent',
            color: activeTab === tab.id ? 'white' : '#333',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: activeTab === tab.id ? 'bold' : 'normal',
            borderBottom: activeTab === tab.id ? '3px solid #0056b3' : '3px solid transparent',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ marginBottom: '4px' }}>{tab.icon}</div>
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default TabNavigation;