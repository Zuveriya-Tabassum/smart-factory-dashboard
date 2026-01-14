import { Link } from 'react-router-dom'

export default function Unauthorized() {
  return (
    <div style={{ maxWidth: 420, margin: '24px auto' }}>
      <h2>Unauthorized</h2>
      <p>You do not have permission to view this page.</p>
      <Link to="/">Go to Dashboard</Link>
    </div>
  )
}