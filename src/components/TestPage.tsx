import { useAuth } from '../contexts/AuthContext';

export default function TestPage() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div style={{ color: 'white', padding: '20px' }}>Loading...</div>;
  }

  return (
    <div style={{
      background: '#000',
      color: '#fff',
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      minHeight: '100vh'
    }}>
      <h1>🧪 Test Page</h1>
      <p>Current User: {currentUser ? JSON.stringify(currentUser) : 'Not logged in'}</p>
      <p>Auth Status: {loading ? 'Loading' : currentUser ? 'Logged in' : 'Not logged in'}</p>
    </div>
  );
}
