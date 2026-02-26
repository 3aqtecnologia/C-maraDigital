function Block({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className ?? ''}`} />
}

export function TableSkeleton({ cols = 5, rows = 5 }: { cols?: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} aria-hidden="true">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-6 py-4">
              <Block className={`h-4 ${j === 1 ? 'w-3/4' : 'w-full'}`} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export function CardListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-hidden="true" aria-label="Carregando...">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="card flex items-center gap-4">
          <Block className="w-10 h-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Block className="h-4 w-48" />
            <Block className="h-3 w-64" />
          </div>
          <Block className="h-6 w-20 rounded-full flex-shrink-0" />
          <Block className="h-4 w-4 rounded-full flex-shrink-0" />
        </div>
      ))}
    </div>
  )
}
