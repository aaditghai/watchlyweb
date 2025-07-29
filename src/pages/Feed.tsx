import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Film, Search, User, LogOut, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import MovieList from '@/components/MovieList';
import UserSearch from '@/components/UserSearch';
import FloatingCreatePost from '@/components/FloatingCreatePost';
import { MoodMatchButton } from '@/components/MoodMatchButton';

const Feed = () => {
  const { user, signOut } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showUserSearch, setShowUserSearch] = useState(false);

  const handlePostCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-accent/10">
        <div className="text-center max-w-2xl mx-auto px-6">
          <div className="text-8xl mb-8">🎬</div>
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent leading-tight">
            Welcome to Watchly
          </h1>
          <p className="text-xl text-foreground/80 mb-10 leading-relaxed">
            Your cozy corner of the internet to track every movie night, share hot takes, and discover what your friends are binge-watching! ✨
          </p>
          <Link to="/auth">
            <Button size="lg" className="h-14 px-8 text-lg font-bold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 rounded-2xl shadow-[var(--shadow-warm)] hover:shadow-xl transition-all duration-300">
              Start Your Journey 🍿
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
      <header className="sticky top-0 z-40 bg-gradient-to-r from-background/95 to-secondary/30 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-accent/20">
        <div className="max-w-4xl mx-auto px-4 py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="text-3xl">🎬</div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Watchly</h1>
          </Link>
          
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowUserSearch(!showUserSearch)}
              className="flex items-center gap-2 rounded-xl font-medium"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Find Friends</span>
            </Button>
            
            <MoodMatchButton />
            
            <Link to="/profile">
              <Button variant="secondary" size="sm" className="rounded-xl font-medium">
                <User className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Profile</span>
              </Button>
            </Link>
            
            <Button variant="ghost" size="sm" onClick={signOut} className="rounded-xl">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-4 pb-20">
        {showUserSearch && (
          <div className="pt-6">
            <UserSearch />
          </div>
        )}
        
        <div className="pt-6">
          <MovieList refreshTrigger={refreshTrigger} showFeed={true} />
        </div>
      </main>

      <FloatingCreatePost onPostCreated={handlePostCreated} />
    </div>
  );
};

export default Feed;