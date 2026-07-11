import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../api/client';

export default function ResetPasswordPage() {
  const { token } = useParams();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const data = await apiClient.post('/auth/reset-password', {
        token: token,
        new_password: password,
      });
      setSuccess(data.message);
    } catch (err) {
      setError(err.detail || 'El enlace de reseteo es inválido o ha expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--ink)]">
      <div className="p-8 rounded-lg shadow-lg bg-[var(--surface)] w-full max-w-sm">
        <h2 className="text-2xl font-bold text-center text-white mb-6">NEXUS</h2>
        <h3 className="text-md font-bold text-center text-[var(--muted)] mb-6">Establecer Nueva Contraseña</h3>

        {success ? (
          <div className="text-center">
            <p className="text-[var(--positive)] text-sm mb-6">{success}</p>
            <Link to="/login" className="inline-block align-baseline font-bold text-sm text-[var(--accent)] hover:text-amber-400">
              Ir a Iniciar Sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-[var(--muted)] text-sm font-bold mb-2" htmlFor="password">Nueva Contraseña</label>
              <input
                className="w-full px-3 py-2 leading-tight text-white border rounded shadow appearance-none bg-[var(--surface-2)] border-[var(--line)] focus:outline-none focus:shadow-outline"
                id="password" type="password" placeholder="******************" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="mb-6">
              <label className="block text-[var(--muted)] text-sm font-bold mb-2" htmlFor="confirm-password">Confirmar Contraseña</label>
              <input
                className="w-full px-3 py-2 mb-3 leading-tight text-white border rounded shadow appearance-none bg-[var(--surface-2)] border-[var(--line)] focus:outline-none focus:shadow-outline"
                id="confirm-password" type="password" placeholder="******************" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              {error && <p className="text-xs italic text-[var(--danger)]">{error}</p>}
            </div>
            <button disabled={loading} className="w-full px-4 py-2 font-bold text-[var(--ink)] transition-colors bg-[var(--accent)] rounded hover:bg-amber-400 focus:outline-none focus:shadow-outline disabled:opacity-50" type="submit">
              {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}