import { Film } from 'lucide-react';
import { Link } from 'react-router-dom';
import MovieList from '@/components/MovieList';

const MyLogs = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Film className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Watchly</h1>
          </Link>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">My Watch History</h2>
          <p className="text-muted-foreground">
            All the movies and shows you've logged
          </p>
        </div>
        <MovieList showFeed={false} />
      </main>
    </div>
  );
};

export default MyLogs;