import React, { useState } from 'react';
import TabNavigation from './components/TabNavigation';
import ChanceRecorder from './components/ChanceRecorder';
import RecordList from './components/RecordList';
import AnalysisView from './components/AnalysisView';

function App() {
  const [activeTab, setActiveTab] = useState('record');

  const renderContent = () => {
    switch (activeTab) {
      case 'record':
        return <ChanceRecorder />;
      case 'list':
        return <RecordList />;
      case 'analysis':
        return <AnalysisView />;
      default:
        return <ChanceRecorder />;
    }
  };

  return (
    <div className="App" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        {renderContent()}
      </div>
    </div>
  );
}

export default App;