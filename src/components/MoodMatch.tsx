import { useState } from 'react';
import { Sparkles, Heart, Film } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

const MoodMatch = () => {
  const [mood, setMood] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  interface MovieRecommendation {
    title: string;
    explanation: string;
    poster_url?: string;
    tmdb_id?: number;
    release_year?: number;
    overview?: string;
  }

  const [recommendations, setRecommendations] = useState<MovieRecommendation[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<MovieRecommendation | null>(null);
  const [movieDetails, setMovieDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mood.trim()) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-mood-recommendations', {
        body: { mood }
      });

      if (error) throw error;
      
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMovieDetails = async (tmdbId: number) => {
    console.log('Fetching details for TMDB ID:', tmdbId);
    setDetailsLoading(true);
    try {
      const detailsResponse = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}?api_key=8a4d4f4ec18ce1c2d0b5e0e8b0e9f9b1`);
      console.log('Details response status:', detailsResponse.status);
      
      if (!detailsResponse.ok) {
        console.error('Failed to fetch movie details:', detailsResponse.status);
        setMovieDetails(null);
        return;
      }
      
      const details = await detailsResponse.json();
      console.log('Movie details:', details);
      
      // Fetch credits and providers in parallel
      const [creditsResponse, providersResponse] = await Promise.all([
        fetch(`https://api.themoviedb.org/3/movie/${tmdbId}/credits?api_key=8a4d4f4ec18ce1c2d0b5e0e8b0e9f9b1`),
        fetch(`https://api.themoviedb.org/3/movie/${tmdbId}/watch/providers?api_key=8a4d4f4ec18ce1c2d0b5e0e8b0e9f9b1`)
      ]);

      const credits = creditsResponse.ok ? await creditsResponse.json() : { cast: [], crew: [] };
      const providers = providersResponse.ok ? await providersResponse.json() : { results: {} };

      setMovieDetails({
        ...details,
        cast: credits.cast?.slice(0, 6) || [],
        director: credits.crew?.find((person: any) => person.job === 'Director')?.name || 'Unknown',
        streaming: providers.results?.US || {}
      });
    } catch (error) {
      console.error('Error fetching movie details:', error);
      setMovieDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleMovieClick = (movie: MovieRecommendation) => {
    console.log('Movie clicked:', movie);
    setSelectedMovie(movie);
    if (movie.tmdb_id) {
      console.log('Has TMDB ID, fetching details:', movie.tmdb_id);
      fetchMovieDetails(movie.tmdb_id);
    } else {
      console.log('No TMDB ID available');
      setMovieDetails(null);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-card to-secondary/20 border-accent/20 shadow-[var(--shadow-warm)] max-w-2xl mx-auto">{/* ... keep existing code (card content) */}
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-3 text-2xl font-bold">
          <Sparkles className="h-6 w-6 text-accent animate-pulse" />
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            MoodMatch ✨
          </span>
        </CardTitle>
        <p className="text-muted-foreground font-medium">
          Tell us how you're feeling, and we'll find the perfect watch for your vibe! 🎭
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Heart className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-accent" />
            <Input
              placeholder="How are you feeling today? (e.g., cozy, adventurous, nostalgic...)"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="pl-12 h-12 rounded-2xl border-accent/30 focus:border-primary bg-gradient-to-r from-background to-secondary/10 text-base"
              disabled={isLoading}
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={!mood.trim() || isLoading}
            className="w-full h-12 rounded-2xl bg-gradient-to-r from-primary to-accent font-bold text-lg hover:shadow-[var(--shadow-warm)] transition-all duration-300"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Finding your perfect match...
              </div>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Get My Recommendations
              </>
            )}
          </Button>
        </form>

        {recommendations.length > 0 && (
          <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-bold text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Perfect for your "{mood}" mood! 🎬
            </h3>
            
            <div className="grid gap-4">
              {recommendations.map((rec, index) => (
                <div
                  key={index}
                  onClick={() => handleMovieClick(rec)}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-gradient-to-r from-secondary/30 to-accent/20 border border-accent/20 hover:shadow-[var(--shadow-card)] transition-all duration-200 cursor-pointer hover:scale-[1.02]"
                >
                  {rec.poster_url ? (
                    <img
                      src={rec.poster_url}
                      alt={rec.title}
                      className="w-16 h-20 object-cover rounded-xl shadow-md flex-shrink-0"
                      onError={(e) => {
                        // Fallback if image fails to load
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-16 h-20 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-md flex-shrink-0 ${rec.poster_url ? 'hidden' : ''}`}>
                    <Film className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-lg text-foreground">{rec.title}</h4>
                      {rec.release_year && (
                        <Badge variant="secondary" className="text-xs">
                          {rec.release_year}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{rec.explanation}</p>
                    <p className="text-xs text-accent mt-1 font-medium">Click for details →</p>
                  </div>
                </div>
              ))}
            </div>
            
            <Button
              variant="outline"
              onClick={() => {
                setRecommendations([]);
                setMood('');
              }}
              className="w-full mt-4 rounded-2xl border-accent/30 font-medium"
            >
              Try Another Mood
            </Button>
          </div>
        )}
      </CardContent>
      
      {/* Movie Details Dialog */}
      <Dialog open={!!selectedMovie} onOpenChange={() => setSelectedMovie(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{selectedMovie?.title}</DialogTitle>
          </DialogHeader>
          
          {detailsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : movieDetails ? (
            <div className="space-y-6">
              <div className="flex gap-4">
                {movieDetails.poster_path && (
                  <img
                    src={`https://image.tmdb.org/t/p/w300${movieDetails.poster_path}`}
                    alt={movieDetails.title}
                    className="w-32 h-48 object-cover rounded-lg shadow-lg flex-shrink-0"
                  />
                )}
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{movieDetails.release_date?.split('-')[0]}</Badge>
                    <Badge variant="outline">{Math.floor(movieDetails.runtime / 60)}h {movieDetails.runtime % 60}m</Badge>
                    <Badge variant="outline">⭐ {movieDetails.vote_average?.toFixed(1)}</Badge>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-1">Director</h4>
                    <p className="text-sm text-muted-foreground">{movieDetails.director}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-1">Genres</h4>
                    <div className="flex flex-wrap gap-1">
                      {movieDetails.genres?.map((genre: any) => (
                        <Badge key={genre.id} variant="secondary" className="text-xs">
                          {genre.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Overview</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {movieDetails.overview || selectedMovie?.explanation}
                </p>
              </div>
              
              {movieDetails.cast?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Cast</h4>
                  <div className="flex flex-wrap gap-2">
                    {movieDetails.cast.map((actor: any) => (
                      <Badge key={actor.id} variant="outline" className="text-xs">
                        {actor.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {(movieDetails.streaming?.flatrate?.length > 0 || movieDetails.streaming?.rent?.length > 0) && (
                <div>
                  <h4 className="font-semibold mb-2">Where to Watch</h4>
                  <div className="space-y-2">
                    {movieDetails.streaming?.flatrate?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Streaming</p>
                        <div className="flex flex-wrap gap-2">
                          {movieDetails.streaming.flatrate.map((provider: any) => (
                            <Badge key={provider.provider_id} variant="secondary" className="text-xs">
                              {provider.provider_name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {movieDetails.streaming?.rent?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Rent/Buy</p>
                        <div className="flex flex-wrap gap-2">
                          {movieDetails.streaming.rent.map((provider: any) => (
                            <Badge key={provider.provider_id} variant="outline" className="text-xs">
                              {provider.provider_name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">Movie details not available</p>
              <p className="text-sm text-muted-foreground mt-2">{selectedMovie?.explanation}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default MoodMatch;