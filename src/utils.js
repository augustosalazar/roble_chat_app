const COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#06b6d4','#3b82f6','#8b5cf6','#ec4899']
export function colorFromId(id) {
  let h = 0
  for (let i = 0; i < (id || '').length; i++) h = ((h << 5) - h) + id.charCodeAt(i)
  return COLORS[Math.abs(h) % COLORS.length]
}
