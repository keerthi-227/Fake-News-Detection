export default function LoadingSpinner({ size = 20, color = '#fff' }) {
  return (
    <div style={{
      width: size,
      height: size,
      border: `2px solid rgba(255,255,255,0.15)`,
      borderTopColor: color,
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
      display: 'inline-block',
      flexShrink: 0
    }} />
  );
}