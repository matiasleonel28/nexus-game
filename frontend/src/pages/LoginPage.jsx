import { useState } from 'react';
import { useAuth } from '../context/AuthContext'
import { useNavigate, useLocation, Link } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError]         = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password, rememberMe);
      navigate(from, { replace: true });
    } catch (err) {
      // Mostrar el mensaje del backend si está disponible, o uno genérico
      setError(err?.detail || err?.message || 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--ink)]">
      <div className="p-8 rounded-lg shadow-lg bg-[var(--surface)] w-full max-w-sm">
        <div>
          <h1 className="text-2xl font-bold text-center text-white mb-1">NEXUS</h1>
          <h2 className="text-md font-bold text-center text-[var(--muted)] mb-6">Iniciar Sesión</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-[var(--muted)] text-sm font-bold mb-2" htmlFor="email">Email</label>
            <input
              className="w-full px-3 py-2 leading-tight text-white border rounded shadow appearance-none bg-[var(--surface-2)] border-[var(--line)] focus:outline-none focus:border-[var(--accent)]"
              id="email" type="email" placeholder="tu@email.com" value={email}
              onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="mb-6">
            <label className="block text-[var(--muted)] text-sm font-bold mb-2" htmlFor="password">Contraseña</label>
            <input
              className="w-full px-3 py-2 mb-3 leading-tight text-white border rounded shadow appearance-none bg-[var(--surface-2)] border-[var(--line)] focus:outline-none focus:border-[var(--accent)]"
              id="password" type="password" placeholder="******************" value={password}
              onChange={(e) => setPassword(e.target.value)} required />
            {error && <p className="text-xs italic text-[var(--danger)]">{error}</p>}
          </div>
          <div className="mb-6">
            <label className="flex items-center text-sm text-[var(--muted)]">
              <input
                className="h-4 w-4 accent-[var(--accent)] bg-[var(--surface-2)] border-[var(--line)] rounded"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="ml-2">Recordarme</span>
            </label>
          </div>
          <div className="flex flex-col items-center justify-between gap-4">
            <button
              disabled={isLoading}
              className="w-full px-4 py-2 font-bold text-[var(--ink)] transition-colors bg-[var(--accent)] rounded hover:bg-[var(--accent-strong)] focus:outline-none disabled:opacity-50"
              type="submit"
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
            <div className="w-full flex justify-between text-xs">
              <Link to="/register" className="inline-block align-baseline font-bold text-[var(--muted)] hover:text-[var(--accent)]">
                Crear una cuenta
              </Link>
              <Link to="/forgot-password" className="inline-block align-baseline font-bold text-[var(--muted)] hover:text-[var(--accent)]">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}