import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { formatPrice } from '../constants'

// store keys and colors
const STORE_COLORS = {
  steam: 'var(--accent)',
  xbox: 'var(--positive)',
  eshop: 'var(--danger)',
}
const STORE_LABELS = {
  steam: 'Steam',
  xbox: 'Xbox Store',
  eshop: 'Nintendo eShop',
}

export default function PriceChart({ history }) {
  // history is an object like: { steam: [{date, price, currency}], eshop: [...] }
  
  const { data, storeKeys } = useMemo(() => {
    if (!history) return { data: [], storeKeys: [] }

    // Collect all unique dates
    const allDates = new Set()
    const stores = Object.keys(history)
    
    stores.forEach(store => {
      history[store].forEach(point => {
        allDates.add(point.date.split('T')[0])
      })
    })

    if (allDates.size < 2) return { data: [], storeKeys: [] }

    const sortedDates = Array.from(allDates).sort()
    
    // Build combined data array
    const chartData = sortedDates.map(dateStr => {
      const row = { name: dateStr }
      stores.forEach(store => {
        // Find if this store has a price for this date
        const pt = history[store].find(p => p.date.startsWith(dateStr))
        if (pt) row[store] = pt.price
      })
      return row
    })

    return { data: chartData, storeKeys: stores }
  }, [history])

  if (!data || data.length < 2) {
    return (
      <div className="flex items-center justify-center h-32 border border-dashed border-[var(--line)] rounded bg-[var(--surface-2)]">
        <p className="text-xs text-[var(--muted)] italic font-semibold">Todavía no hay suficiente historial</p>
      </div>
    )
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded shadow-xl p-3 text-xs font-sans">
          <p className="font-bold text-[var(--text)] mb-2 pb-2 border-b border-[var(--line)]">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4 mb-1">
              <span style={{ color: entry.color }} className="font-semibold">
                {STORE_LABELS[entry.dataKey] || entry.dataKey}
              </span>
              <span className="font-num text-[var(--text)] font-bold">
                {formatPrice(entry.value)}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-48 w-full mt-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="var(--muted)" 
            fontSize={10} 
            tickMargin={10}
            tickFormatter={(val) => {
              const d = new Date(val);
              return `${d.getDate()}/${d.getMonth() + 1}`;
            }}
          />
          <YAxis 
            stroke="var(--muted)" 
            fontSize={10} 
            tickFormatter={(val) => `$${val}`}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          {storeKeys.map(store => (
            <Line
              key={store}
              type="monotone"
              dataKey={store}
              stroke={STORE_COLORS[store] || '#8b5cf6'}
              strokeWidth={2}
              dot={{ r: 3, fill: STORE_COLORS[store], strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
