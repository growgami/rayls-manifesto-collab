'use client';

import { useState, useEffect } from 'react';
import { useIpTracking } from '@/features/tracking/modules/ip/hooks/useIpTracking';

export default function IpTrackingTestPage() {
  const [sessionId, setSessionId] = useState<string>('');
  const [trackingEnabled, setTrackingEnabled] = useState<boolean>(true);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [currentUrl, setCurrentUrl] = useState<string>('Loading...');
  const [useMockEndpoint, setUseMockEndpoint] = useState<boolean>(false);

  // Generate a session ID and set URL on mount
  useEffect(() => {
    const newSessionId = `test-session-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    setSessionId(newSessionId);
    setCurrentUrl(window.location.href);
  }, []);

  // Use the IP tracking hook with dynamic endpoint
  const {
    ipId,
    ipAddress,
    isLoading,
    error
  } = useIpTracking({
    sessionId,
    enabled: trackingEnabled && sessionId !== '',
    endpoint: useMockEndpoint ? '/api/ip-mock' : '/api/ip'
  });

  // Track results for testing
  useEffect(() => {
    if (ipId || error) {
      const result = {
        timestamp: new Date().toISOString(),
        sessionId,
        ipId,
        ipAddress,
        error: error || null,
        success: !!ipId
      };
      setTestResults(prev => [result, ...prev]);
    }
  }, [ipId, ipAddress, error, sessionId]);

  const handleManualTest = () => {
    // Generate new session ID to trigger a fresh test
    const newSessionId = `manual-test-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    setSessionId(newSessionId);
  };

  const toggleTracking = () => {
    setTrackingEnabled(!trackingEnabled);
  };

  const toggleMockMode = () => {
    setUseMockEndpoint(!useMockEndpoint);
    // Clear results when switching modes
    setTestResults([]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const testDatabaseConnection = async () => {
    try {
      const response = await fetch('/api/test-db');
      const data = await response.json();
      console.log('Database test result:', data);

      if (data.success) {
        alert(`✅ Database connection successful!\n\nDatabase: ${data.database}\nCollection: ${data.collection}\nDocument count: ${data.documentCount}`);
      } else {
        alert(`❌ Database test failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Database test error:', error);
      alert(`❌ Database test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testDirectConnection = async () => {
    try {
      const response = await fetch('/api/test-connection');
      const data = await response.json();
      console.log('Direct connection test result:', data);

      if (data.success) {
        alert(`✅ Direct MongoDB connection successful!\n\nDatabase: ${data.database}\nCollections: ${data.collections.join(', ')}`);
      } else {
        const troubleshooting = data.troubleshooting;
        const message = `❌ Direct connection failed: ${data.details.message}\n\nPossible causes:\n${troubleshooting.possibleCauses.map((c: string, i: number) => `${i + 1}. ${c}`).join('\n')}\n\nNext steps:\n${troubleshooting.nextSteps.join('\n')}`;
        alert(message);
      }
    } catch (error) {
      console.error('Direct connection test error:', error);
      alert(`❌ Direct connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            IP Tracking Test Suite
          </h1>
          <p className="text-gray-400 text-lg">
            Testing the IP tracking functionality and useIpTracking hook
          </p>
        </div>

        {/* Current Status Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></span>
            Current Session Status
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Session ID</label>
              <code className="block bg-gray-900 px-3 py-2 rounded text-sm font-mono break-all">
                {sessionId || 'Generating...'}
              </code>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Tracking Status</label>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                trackingEnabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {trackingEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">API Mode</label>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                useMockEndpoint ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'
              }`}>
                {useMockEndpoint ? 'Mock (In-Memory)' : 'Real (MongoDB)'}
              </span>
            </div>
          </div>

          {/* Current Result */}
          {isLoading && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-3"></div>
                <span className="text-blue-400">Tracking IP address...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
              <h3 className="font-medium text-red-400 mb-2">Error</h3>
              <code className="text-sm text-red-300">{error}</code>
            </div>
          )}

          {ipId && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-4">
              <h3 className="font-medium text-green-400 mb-2">Success</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-400">IP ID: </span>
                  <code className="text-green-300 text-sm">{ipId}</code>
                </div>
                <div>
                  <span className="text-sm text-gray-400">IP Address: </span>
                  <code className="text-green-300 text-sm">{ipAddress || 'Hidden/Unknown'}</code>
                </div>
                <div>
                  <span className="text-sm text-gray-400">User Agent: </span>
                  <code className="text-green-300 text-sm break-all">{navigator.userAgent}</code>
                </div>
              </div>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleManualTest}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
              Run New Test
            </button>
            <button
              onClick={toggleTracking}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                trackingEnabled
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {trackingEnabled ? 'Disable Tracking' : 'Enable Tracking'}
            </button>
            <button
              onClick={toggleMockMode}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                useMockEndpoint
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              {useMockEndpoint ? 'Use Real API' : 'Use Mock API'}
            </button>
            <button
              onClick={clearResults}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-medium transition-colors"
            >
              Clear Results
            </button>
            <button
              onClick={testDatabaseConnection}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
            >
              Test Database
            </button>
            <button
              onClick={testDirectConnection}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg font-medium transition-colors"
            >
              Test Direct Connection
            </button>
          </div>
        </div>

        {/* Test Results History */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Test Results History</h2>
            <span className="text-sm text-gray-400">
              {testResults.length} test{testResults.length !== 1 ? 's' : ''} completed
            </span>
          </div>

          {testResults.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No test results yet. Run a test to see results here.
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${
                    result.success
                      ? 'border-green-500/30 bg-green-500/5'
                      : 'border-red-500/30 bg-red-500/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${
                      result.success ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {result.success ? ' Success' : ' Failed'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-400">Session: </span>
                      <code className="text-gray-300">{result.sessionId.substring(0, 20)}...</code>
                    </div>
                    {result.ipId && (
                      <div>
                        <span className="text-gray-400">IP ID: </span>
                        <code className="text-green-300">{result.ipId}</code>
                      </div>
                    )}
                    {result.ipAddress && (
                      <div>
                        <span className="text-gray-400">IP: </span>
                        <code className="text-green-300">{result.ipAddress}</code>
                      </div>
                    )}
                    {result.error && (
                      <div className="md:col-span-2">
                        <span className="text-gray-400">Error: </span>
                        <code className="text-red-300">{result.error}</code>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Technical Info */}
        <div className="mt-6 bg-gray-800/30 border border-gray-700/50 rounded-lg p-4">
          <details className="text-sm">
            <summary className="cursor-pointer font-medium text-gray-300 hover:text-white">
              Technical Details
            </summary>
            <div className="mt-3 space-y-2 text-gray-400">
              <p><strong>API Endpoint:</strong> <code>{useMockEndpoint ? '/api/ip-mock' : '/api/ip'}</code> {useMockEndpoint && <span className="text-orange-400">(Mock Mode)</span>}</p>
              <p><strong>Hook:</strong> <code>useIpTracking</code></p>
              <p><strong>Database Collection:</strong> <code>{'{process.env.MONGODB_IP_DATA_COLLECTION || "ipData"}'}</code></p>
              <p><strong>Environment:</strong> <code>{process.env.NODE_ENV || 'development'}</code></p>
              <p><strong>Current URL:</strong> <code>{currentUrl}</code></p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}