'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MailDiagnosticsPage() {
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();

  const runDiagnostics = async () => {
    if (!userId) {
      setError('User ID is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResults(null);

      const response = await fetch(`/api/diagnostics/mail?userId=${encodeURIComponent(userId)}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to run diagnostics');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Mail System Diagnostics</h1>
      
      <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-yellow-800 font-medium">⚠️ This page is for administrator use only.</p>
        <p className="text-yellow-700">It will run comprehensive diagnostics on the mail system.</p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">User ID to test:</label>
        <div className="flex">
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Enter User ID"
            className="flex-grow px-3 py-2 border rounded-l"
          />
          <button
            onClick={runDiagnostics}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-r font-medium hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? 'Running...' : 'Run Diagnostics'}
          </button>
        </div>
        {error && (
          <p className="mt-2 text-red-600">{error}</p>
        )}
      </div>

      {results && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-100 px-4 py-3 border-b">
            <h2 className="text-lg font-medium">Diagnostic Results</h2>
            <p className="text-sm text-gray-600">Timestamp: {results.timestamp}</p>
          </div>
          
          <div className="p-4">
            {/* User Information */}
            <div className="mb-6">
              <h3 className="text-md font-medium mb-2">User Information</h3>
              {results.user ? (
                <div className="bg-white p-3 border rounded">
                  <p><strong>ID:</strong> {results.user.id}</p>
                  <p><strong>Email:</strong> {results.user.email}</p>
                  <p><strong>Status:</strong> {results.user.status}</p>
                  <p><strong>Auth Method:</strong> {results.user.authMethod}</p>
                  <p><strong>Key ID:</strong> {results.user.keyId}</p>
                </div>
              ) : (
                <p className="text-red-600">User not found</p>
              )}
            </div>
            
            {/* Mail Account */}
            <div className="mb-6">
              <h3 className="text-md font-medium mb-2">Mail Account</h3>
              {results.mailAccount ? (
                <div className="bg-white p-3 border rounded">
                  <p><strong>ID:</strong> {results.mailAccount.id}</p>
                  <p><strong>Email:</strong> {results.mailAccount.email}</p>
                  <p><strong>Username:</strong> {results.mailAccount.username}</p>
                  <p><strong>Password Hash Type:</strong> {results.mailAccount.passwordHashType}</p>
                </div>
              ) : (
                <p className="text-red-600">No mail account found</p>
              )}
            </div>
            
            {/* Database Connections */}
            <div className="mb-6">
              <h3 className="text-md font-medium mb-2">Database Connections</h3>
              <div className="bg-white p-3 border rounded">
                <p>
                  <strong>Main DB:</strong> 
                  <span className={results.databaseConnections.main ? 'text-green-600 ml-2' : 'text-red-600 ml-2'}>
                    {results.databaseConnections.main ? '✓ Connected' : '✗ Failed'}
                  </span>
                </p>
                <p>
                  <strong>Mail DB:</strong> 
                  <span className={results.databaseConnections.mail ? 'text-green-600 ml-2' : 'text-red-600 ml-2'}>
                    {results.databaseConnections.mail ? '✓ Connected' : '✗ Failed'}
                  </span>
                </p>
              </div>
            </div>
            
            {/* Mail Server */}
            <div className="mb-6">
              <h3 className="text-md font-medium mb-2">Mail Server</h3>
              <div className="bg-white p-3 border rounded">
                <p>
                  <strong>Connection:</strong> 
                  <span className={results.mailServer.connection ? 'text-green-600 ml-2' : 'text-red-600 ml-2'}>
                    {results.mailServer.connection ? '✓ Available' : '✗ Unavailable'}
                  </span>
                </p>
                <p>
                  <strong>Dovecot Running:</strong> 
                  <span className={results.mailServer.dovecotRunning ? 'text-green-600 ml-2' : 'text-red-600 ml-2'}>
                    {results.mailServer.dovecotRunning ? '✓ Yes' : '✗ No'}
                  </span>
                </p>
              </div>
            </div>
            
            {/* IMAP Tests */}
            <div className="mb-6">
              <h3 className="text-md font-medium mb-2">IMAP Connection Tests</h3>
              <div className="bg-white border rounded overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Method</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Result</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {results.imapTests.length > 0 ? (
                      results.imapTests.map((test, index) => (
                        <tr key={index} className={test.success ? 'bg-green-50' : ''}>
                          <td className="px-4 py-2 text-sm">{test.method}</td>
                          <td className="px-4 py-2 text-sm">
                            {test.success ? (
                              <span className="text-green-600 font-medium">✓ Success</span>
                            ) : (
                              <span className="text-red-600">✗ Failed</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {test.success ? (
                              test.inbox ? (
                                <span>Inbox found with {test.inbox.exists} messages</span>
                              ) : (
                                <span>Connected but could not open INBOX</span>
                              )
                            ) : (
                              <span className="text-red-600">{test.error}</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="px-4 py-2 text-sm text-gray-500 text-center">
                          No IMAP tests ran
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Environment Info */}
            <div className="mb-6">
              <h3 className="text-md font-medium mb-2">Environment</h3>
              <div className="bg-white p-3 border rounded">
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(results.environment).map(([key, value]) => (
                    <p key={key}><strong>{key}:</strong> {value?.toString()}</p>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Conclusion */}
            <div className="mb-6">
              <h3 className="text-md font-medium mb-2">Conclusion</h3>
              <div className={`p-3 border rounded ${results.conclusion.success ? 'bg-green-50' : 'bg-red-50'}`}>
                <p className={`font-bold mb-2 ${results.conclusion.success ? 'text-green-700' : 'text-red-700'}`}>
                  {results.conclusion.success ? '✓ Tests passed successfully!' : '✗ Issues detected'}
                </p>
                
                {results.conclusion.issues.length > 0 && (
                  <div className="mb-4">
                    <p className="font-medium mb-1">Issues:</p>
                    <ul className="list-disc pl-5">
                      {results.conclusion.issues.map((issue, idx) => (
                        <li key={idx} className="text-red-600">{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {results.conclusion.recommendations.length > 0 && (
                  <div>
                    <p className="font-medium mb-1">Recommendations:</p>
                    <ul className="list-disc pl-5">
                      {results.conclusion.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}