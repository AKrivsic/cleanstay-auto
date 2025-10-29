export default function HomePage() {
  if (typeof window !== 'undefined') {
    window.location.href = '/index.html';
    return null;
  }
  return (
    <main>
      <a href="/index.html">Pokračovat na homepage</a>
    </main>
  );
}


