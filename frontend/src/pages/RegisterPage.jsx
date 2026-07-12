import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => { document.title = 'Crear cuenta — Nexus'; }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    try {
      await register(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      const msg = err.detail === 'Email ya registrado'
        ? 'Este email ya está en uso. Por favor, intenta iniciar sesión.'
        : (err.message || 'Ocurrió un error inesperado durante el registro.');
      setError(msg);
      addToast(msg, 'error');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--ink)]">
      <div className="p-8 rounded-lg shadow-lg bg-[var(--surface)] w-full max-w-sm">
        <h2 className="text-2xl font-bold text-center text-white mb-6">NEXUS</h2>
        <h3 className="text-md font-bold text-center text-[var(--muted)] mb-6">Crear cuenta</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-[var(--muted)] text-sm font-bold mb-2" htmlFor="email">Correo electrónico</label>
            <input
              className="w-full px-3 py-2 leading-tight text-white border rounded shadow appearance-none bg-[var(--surface-2)] border-[var(--line)] focus:outline-none focus:shadow-outline"
              id="email" type="email" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="mb-4">
            <label className="block text-[var(--muted)] text-sm font-bold mb-2" htmlFor="password">Contraseña</label>
            <input
              className="w-full px-3 py-2 leading-tight text-white border rounded shadow appearance-none bg-[var(--surface-2)] border-[var(--line)] focus:outline-none focus:shadow-outline"
              id="password" type="password" placeholder="******************" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div className="mb-6">
            <label className="block text-[var(--muted)] text-sm font-bold mb-2" htmlFor="confirm-password">Confirmar contraseña</label>
            <input
              className="w-full px-3 py-2 mb-3 leading-tight text-white border rounded shadow appearance-none bg-[var(--surface-2)] border-[var(--line)] focus:outline-none focus:shadow-outline"
              id="confirm-password" type="password" placeholder="******************" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            {error && <p className="text-xs italic text-[var(--danger)]">{error}</p>}
          </div>
          <div className="flex flex-col items-center justify-between gap-4">
            <button className="w-full px-4 py-2 font-bold text-[var(--ink)] transition-colors bg-[var(--accent)] rounded hover:bg-[var(--accent-strong)] focus:outline-none focus:shadow-outline" type="submit">
              Registrarse
            </button>
            <Link to="/login" className="inline-block align-baseline font-bold text-sm text-[var(--accent)] hover:text-[var(--accent-strong)]">
              ¿Ya tenés cuenta? Iniciá sesión
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}