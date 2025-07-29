import { useState, useEffect } from 'react';
import { Search, Film, Tv, Plus, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { tmdbService, type Movie, type TVShow } from '@/services/tmdb';

interface MovieSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectMovie: (movie: { title: string; poster_url?: string; tmdb_id?: number }) => void;
}

const MovieSearchDialog = ({ open, onOpenChange, onSelectMovie }: MovieSearchDialogProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<(Movie | TVShow)[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [selectedForDetails, setSelectedForDetails] = useState<Movie | TVShow | null>(null);
  const [movieDetails, setMovieDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchMovies = async () => {
      setLoading(true);
      try {
        const searchResults = await tmdbService.searchAll(query);
        setResults(searchResults);
      } catch (error) {
        console.error('Error searching movies:', error);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(searchMovies, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSelectMovie = (item: Movie | TVShow) => {
    const title = 'title' in item ? item.title : item.name;
    const poster_url = item.poster_path ? tmdbService.getImageUrl(item.poster_path) : undefined;
    
    onSelectMovie({
      title,
      poster_url,
      tmdb_id: item.id
    });
    
    onOpenChange(false);
    setQuery('');
    setResults([]);
  };

  const handleCustomSubmit = () => {
    if (customTitle.trim()) {
      onSelectMovie({ title: customTitle.trim() });
      onOpenChange(false);
      setCustomTitle('');
      setShowCustom(false);
      setQuery('');
    }
  };

  const fetchMovieDetails = async (item: Movie | TVShow) => {
    setDetailsLoading(true);
    try {
      const isMovie = 'title' in item;
      const endpoint = isMovie ? 'movie' : 'tv';
      
      const [detailsResponse, creditsResponse] = await Promise.all([
        fetch(`https://api.themoviedb.org/3/${endpoint}/${item.id}?api_key=3fd2be6f0c70a2a598f084ddfb75487c`),
        fetch(`https://api.themoviedb.org/3/${endpoint}/${item.id}/credits?api_key=3fd2be6f0c70a2a598f084ddfb75487c`)
      ]);

      if (!detailsResponse.ok || !creditsResponse.ok) {
        throw new Error('Failed to fetch details');
      }

      const details = await detailsResponse.json();
      const credits = await creditsResponse.json();

      setMovieDetails({
        ...details,
        cast: credits.cast?.slice(0, 6) || [],
        director: credits.crew?.find((person: any) => person.job === 'Director')?.name || 'Unknown',
        isMovie
      });
    } catch (error) {
      console.error('Error fetching details:', error);
      setMovieDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleShowDetails = (item: Movie | TVShow, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedForDetails(item);
    fetchMovieDetails(item);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl font-bold">
            <Film className="h-6 w-6 text-primary" />
            <span>Find Your Film</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!showCustom ? (
            <>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search for movies and shows..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-12 h-12 rounded-xl"
                />
              </div>

              <ScrollArea className="h-80">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : results.length > 0 ? (
                  <div className="space-y-3">
                    {results.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-4 rounded-xl hover:bg-secondary/30 cursor-pointer transition-all duration-200"
                        onClick={() => handleSelectMovie(item)}
                      >
                        {item.poster_path ? (
                          <img
                            src={tmdbService.getImageUrl(item.poster_path)}
                            alt={'title' in item ? item.title : item.name}
                            className="w-14 h-20 object-cover rounded-xl shadow-md"
                          />
                        ) : (
                          <div className="w-14 h-20 bg-muted rounded-xl flex items-center justify-center">
                            {'title' in item ? <Film className="h-7 w-7 text-muted-foreground" /> : <Tv className="h-7 w-7 text-muted-foreground" />}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-lg break-words text-foreground">
                            {'title' in item ? item.title : item.name}
                          </p>
                          <p className="text-sm text-muted-foreground font-medium break-words">
                            {'release_date' in item ? item.release_date?.split('-')[0] : item.first_air_date?.split('-')[0]}
                            {' • '}
                             <span className="text-accent">{'title' in item ? '🎬 Movie' : '📺 TV Show'}</span>
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleShowDetails(item, e)}
                          className="self-start"
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : query.trim() ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Film className="h-12 w-12 mx-auto mb-4 text-accent/50" />
                    <p className="text-lg font-medium">No matches for "{query}" 🤔</p>
                    <p className="text-sm mt-1">Try a different title or add your own below!</p>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="text-4xl mb-4">🍿</div>
                    <p className="text-lg font-medium">What's on your watchlist?</p>
                    <p className="text-sm mt-1">Search for any movie or show to get started!</p>
                  </div>
                )}
              </ScrollArea>

              <Button
                variant="outline"
                onClick={() => setShowCustom(true)}
                className="w-full h-12 rounded-2xl border-2 border-dashed border-accent/50 bg-gradient-to-r from-secondary/20 to-accent/10 hover:from-secondary/30 hover:to-accent/20 font-medium"
              >
                <Plus className="h-5 w-5 mr-2" />
                Can't find it? Add your own! ✨
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <Input
                placeholder="What's the title? We'll add it to your collection! 🎭"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit()}
                autoFocus
                className="h-12 rounded-2xl border-accent/30 focus:border-primary bg-gradient-to-r from-background to-secondary/10 text-base"
              />
              <div className="flex gap-3">
                <Button 
                  onClick={handleCustomSubmit} 
                  disabled={!customTitle.trim()}
                  className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-primary to-accent font-bold"
                >
                  Add It! ✨
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCustom(false)}
                  className="h-12 rounded-2xl border-accent/30"
                >
                  Back
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
      
      {/* Movie Details Dialog */}
      <Dialog open={!!selectedForDetails} onOpenChange={() => setSelectedForDetails(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {selectedForDetails && ('title' in selectedForDetails ? selectedForDetails.title : selectedForDetails.name)}
            </DialogTitle>
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
                    alt={movieDetails.isMovie ? movieDetails.title : movieDetails.name}
                    className="w-32 h-48 object-cover rounded-lg shadow-lg flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      {movieDetails.isMovie 
                        ? movieDetails.release_date?.split('-')[0] 
                        : movieDetails.first_air_date?.split('-')[0]
                      }
                    </Badge>
                    {movieDetails.runtime && (
                      <Badge variant="outline">
                        {Math.floor(movieDetails.runtime / 60)}h {movieDetails.runtime % 60}m
                      </Badge>
                    )}
                    <Badge variant="outline">⭐ {movieDetails.vote_average?.toFixed(1)}</Badge>
                    <Badge variant="outline">
                      {movieDetails.isMovie ? '🎬 Movie' : '📺 TV Show'}
                    </Badge>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-1">Director</h4>
                    <p className="text-sm text-muted-foreground break-words">{movieDetails.director}</p>
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
                <p className="text-sm text-muted-foreground leading-relaxed break-words">
                  {movieDetails.overview}
                </p>
              </div>
              
              {movieDetails.cast?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Cast</h4>
                  <div className="flex flex-wrap gap-2">
                    {movieDetails.cast.map((actor: any) => (
                      <Badge key={actor.id} variant="outline" className="text-xs break-words">
                        {actor.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    if (selectedForDetails) {
                      handleSelectMovie(selectedForDetails);
                      setSelectedForDetails(null);
                    }
                  }}
                  className="flex-1"
                >
                  Select This {movieDetails.isMovie ? 'Movie' : 'Show'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedForDetails(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">Details not available</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default MovieSearchDialog;