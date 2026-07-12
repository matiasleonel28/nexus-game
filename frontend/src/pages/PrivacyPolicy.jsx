import React from 'react';
import { NavLink } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[var(--ink)] text-[var(--text)] p-8 flex flex-col items-center justify-center">
      <div className="max-w-3xl w-full bg-[var(--surface)] p-8 rounded-lg border border-[var(--line)] shadow-xl">
        <h1 className="text-3xl font-bold text-white mb-6 tracking-tight">Política de Privacidad</h1>
        
        <div className="space-y-6 text-sm text-[var(--muted)] leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">1. Datos que recolectamos</h2>
            <p>Recolectamos únicamente tu correo electrónico, preferencias de juego (horas disponibles, tolerancia al estrés) y los juegos que agregas a tu biblioteca o wishlist. No compartimos ni vendemos tu información a terceros.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">2. Uso de la información</h2>
            <p>Usamos tus datos exclusivamente para proveerte los servicios de Nexus: recomendaciones personalizadas, organización de tu biblioteca y alertas de ofertas de precios según tus preferencias.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">3. Tus derechos y eliminación de datos</h2>
            <p>Tienes control total sobre tu información. A través de la API, puedes exportar todos tus datos en formato JSON en cualquier momento, o eliminar permanentemente tu cuenta y toda la información asociada sin dejar rastro.</p>
          </section>
        </div>
        
        <div className="mt-8 pt-6 border-t border-[var(--line)]">
          <NavLink to="/" className="text-[var(--accent)] hover:text-white transition-colors text-sm font-semibold uppercase tracking-wider">
            &larr; Volver al inicio
          </NavLink>
        </div>
      </div>
    </div>
  );
}
