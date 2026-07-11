import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { getStats } from '../api/games';

export default function StatsChart() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    let active = true;
    getStats()
      .then(data => {
        if (active) setStats(data);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  if (loading) {
    return <div className="animate-pulse h-64 bg-[var(--surface-2)] rounded-lg"></div>;
  }

  if (!stats) return null;

  const completed = stats.counts.completed || 0;
  const abandoned = stats.counts.abandoned || 0;
  const total = completed + abandoned;
  
  const completionData = [
    { name: 'Completados', value: completed, color: 'var(--accent)' },
    { name: 'Abandonados', value: abandoned, color: 'var(--danger)' }
  ];

  const abandonedGenres = Object.entries(stats.abandoned_by_genre)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // top 5 géneros abandonados

  return (
    <div className="mb-8">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm font-bold text-[var(--text)] uppercase tracking-wider mb-4 hover:text-[var(--accent)] transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2" strokeLinecap="round"
             className={`transition-transform ${isOpen ? 'rotate-90' : ''}`}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
        Mis Stats
      </button>

      {isOpen && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Gráfico de Tasa de Finalización */}
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-lg p-5">
            <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider mb-4 text-center">
              Tasa de Finalización
            </h3>
        
        {total === 0 ? (
          <div className="h-48 flex items-center justify-center text-[var(--muted)] text-sm">
            No hay juegos completados ni abandonados aún.
          </div>
        ) : (
          <div className="h-48 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={completionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {completionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--ink)', borderColor: 'var(--line)', borderRadius: '4px' }}
                  itemStyle={{ color: 'var(--text)', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-num font-bold text-[var(--text)]">
                {Math.round((completed / total) * 100)}%
              </span>
              <span className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Completados</span>
            </div>
          </div>
        )}
      </div>

      {/* Gráfico de Géneros Abandonados */}
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-lg p-5">
        <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider mb-4 text-center">
          Géneros que más abandonás
        </h3>
        
        {abandonedGenres.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-[var(--muted)] text-sm">
            No abandonaste juegos con género registrado.
          </div>
        ) : (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={abandonedGenres}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--line)" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--muted)', fontSize: 10, fontWeight: 'bold' }}
                  width={80}
                />
                <Tooltip 
                  cursor={{ fill: 'var(--surface-2)' }}
                  contentStyle={{ backgroundColor: 'var(--ink)', borderColor: 'var(--line)', borderRadius: '4px' }}
                />
                <Bar dataKey="count" fill="var(--danger)" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
        </div>
      )}
    </div>
  );
}
