export default function Clients() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <header style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: 'white', padding: '20px 40px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
          Clients
        </h1>
        <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
          Manage client information and relationships
        </p>
      </header>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '60px',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '20px', color: '#6b7280', margin: 0 }}>
            Clients page - Coming Soon
          </h2>
          <p style={{ color: '#9ca3af', marginTop: '12px' }}>
            This feature is under development
          </p>
        </div>
      </div>
    </div>
  )
}
