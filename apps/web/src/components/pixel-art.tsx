type PixelArtProps = {
  rows: string[];
  palette: Record<string, string>; // "." atau karakter tak terdaftar = transparan
  title?: string;
  className?: string;
};

// Menggambar pixel art dari teks, jadi tidak butuh file gambar
export function PixelArt({ rows, palette, title, className }: PixelArtProps) {
  const height = rows.length;
  const width = rows[0]?.length ?? 0;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      shapeRendering="crispEdges"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={className}
    >
      {rows.flatMap((row, y) =>
        [...row].map((ch, x) => {
          const fill = palette[ch];
          return fill ? (
            <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} style={{ fill }} />
          ) : null;
        }),
      )}
    </svg>
  );
}