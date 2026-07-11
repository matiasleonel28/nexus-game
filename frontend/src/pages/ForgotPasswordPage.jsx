import { useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const data = await apiClient.post('/auth/forgot-password', { email });
      setMessage(data.message);
    } catch {
      // Incluso si hay un error, mostramos un mensaje genérico por seguridad.
      setMessage('Si existe una cuenta con ese email, se ha enviado un enlace para restablecer la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--ink)]">
      <div className="p-8 rounded-lg shadow-lg bg-[var(--surface)] w-full max-w-sm">
        <h2 className="text-2xl font-bold text-center text-white mb-6">NEXUS</h2>
        <h3 className="text-md font-bold text-center text-[var(--muted)] mb-6">Restablecer Contraseña</h3>
        
        {message ? (
          <div className="text-center">
            <p className="text-[var(--positive)] text-sm mb-6">{message}</p>
            <Link to="/login" className="inline-block align-baseline font-bold text-sm text-[var(--accent)] hover:text-amber-400">
              Volver a Iniciar Sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="text-[var(--muted)] text-sm mb-4">Ingresa tu email y te enviaremos un enlace para que puedas volver a entrar a tu cuenta.</p>
            <div className="mb-6">
              <label className="block text-[var(--muted)] text-sm font-bold mb-2" htmlFor="email">Email</label>
              <input
                className="w-full px-3 py-2 leading-tight text-white border rounded shadow appearance-none bg-[var(--surface-2)] border-[var(--line)] focus:outline-none focus:shadow-outline"
                id="email" type="email" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <button disabled={loading} className="w-full px-4 py-2 font-bold text-[var(--ink)] transition-colors bg-[var(--accent)] rounded hover:bg-amber-400 focus:outline-none focus:shadow-outline disabled:opacity-50" type="submit">
              {loading ? 'Enviando...' : 'Enviar enlace de restablecimiento'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}