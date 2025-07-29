// Using TMDB API - free tier allows up to 1000 requests per day
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || '3fd2be6f0c70a2a598f084ddfb75487c';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

export interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  overview: string;
  vote_average?: number;
  genre_ids?: number[];
}

export interface TVShow {
  id: number;
  name: string;
  poster_path: string | null;
  first_air_date: string;
  overview: string;
  vote_average?: number;
  genre_ids?: number[];
}

export type MediaItem = Movie | TVShow;

class TMDBService {
  private apiKey: string;

  constructor() {
    this.apiKey = TMDB_API_KEY;
  }

  private async makeRequest(endpoint: string): Promise<any> {
    try {
      const response = await fetch(`${TMDB_BASE_URL}${endpoint}`);
      if (!response.ok) {
        throw new Error(`TMDB API Error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('TMDB API Error:', error);
      // Fallback to mock data if API fails
      if (endpoint.includes('/search/movie')) {
        const query = new URL(`${TMDB_BASE_URL}${endpoint}`).searchParams.get('query') || '';
        return this.getMockMovieResults(query);
      }
      if (endpoint.includes('/search/tv')) {
        const query = new URL(`${TMDB_BASE_URL}${endpoint}`).searchParams.get('query') || '';
        return this.getMockTVResults(query);
      }
      if (endpoint.includes('/discover/movie')) {
        return this.getMockPopularMovies();
      }
      throw error;
    }
  }

  private getMockMovieResults(query: string) {
    const mockMovies = [
      { id: 1, title: "The Shawshank Redemption", poster_path: "/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg", release_date: "1994-09-23", overview: "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency." },
      { id: 2, title: "The Godfather", poster_path: "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg", release_date: "1972-03-14", overview: "The aging patriarch of an organized crime dynasty transfers control to his reluctant son." },
      { id: 3, title: "The Dark Knight", poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg", release_date: "2008-07-14", overview: "Batman raises the stakes in his war on crime with the help of Lt. Jim Gordon and DA Harvey Dent." },
      { id: 4, title: "Pulp Fiction", poster_path: "/dM2w364MScsjFf8pfMbaWUcWrR.jpg", release_date: "1994-09-10", overview: "The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence and redemption." },
      { id: 5, title: "Forrest Gump", poster_path: "/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg", release_date: "1994-06-23", overview: "The presidencies of Kennedy and Johnson through the eyes of an Alabama man with an IQ of 75." },
      { id: 6, title: "Inception", poster_path: "/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg", release_date: "2010-07-15", overview: "A thief who steals corporate secrets through dream-sharing technology is given the inverse task." },
      { id: 7, title: "The Matrix", poster_path: "/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg", release_date: "1999-03-30", overview: "A computer hacker learns about the true nature of his reality and his role in the war against its controllers." },
      { id: 8, title: "Goodfellas", poster_path: "/aKuFiU82s5ISJpGZp7YkIr3kCUd.jpg", release_date: "1990-09-12", overview: "The story of Henry Hill and his life in the mob, covering his relationship with his wife Karen Hill." },
      { id: 9, title: "Interstellar", poster_path: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg", release_date: "2014-11-05", overview: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival." },
      { id: 10, title: "Parasite", poster_path: "/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg", release_date: "2019-05-30", overview: "A poor family schemes to become employed by a wealthy family by infiltrating their household." },
      { id: 11, title: "Spirited Away", poster_path: "/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg", release_date: "2001-07-20", overview: "During her family's move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods and witches." },
      { id: 12, title: "The Lion King", poster_path: "/sKCr78MXSLixwmZ8DyJLrpMsd15.jpg", release_date: "1994-06-15", overview: "Lion prince Simba and his father are targeted by his bitter uncle, who wants to ascend the throne himself." }
    ];

    const filtered = mockMovies.filter(movie => 
      movie.title.toLowerCase().includes(query.toLowerCase())
    );

    return { results: filtered };
  }

  private getMockTVResults(query: string) {
    const mockTVShows = [
      { id: 1, name: "Breaking Bad", poster_path: "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg", first_air_date: "2008-01-20", overview: "A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine." },
      { id: 2, name: "Game of Thrones", poster_path: "/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg", first_air_date: "2011-04-17", overview: "Seven noble families fight for control of the mythical land of Westeros." },
      { id: 3, name: "Stranger Things", poster_path: "/49WJfeN0moxb9IPfGn8AIqMGskD.jpg", first_air_date: "2016-07-15", overview: "When a young boy vanishes, a small town uncovers a mystery involving secret experiments." },
      { id: 4, name: "The Office", poster_path: "/7DJKHzAi83BmQrWLrYYOqcoKfhR.jpg", first_air_date: "2005-03-24", overview: "A mockumentary on a group of typical office workers, where the workday consists of ego clashes." },
      { id: 5, name: "Friends", poster_path: "/f496cm9enuEsZkSPzCwnTESEK5s.jpg", first_air_date: "1994-09-22", overview: "Follows the personal and professional lives of six twenty to thirty-something-year-old friends living in Manhattan." },
      { id: 6, name: "The Crown", poster_path: "/1M876KPjulVwppEpldhdc8V4o68.jpg", first_air_date: "2016-11-04", overview: "Follows the political rivalries and romance of Queen Elizabeth II's reign and the events that shaped the second half of the 20th century." },
      { id: 7, name: "Squid Game", poster_path: "/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg", first_air_date: "2021-09-17", overview: "Hundreds of cash-strapped players accept a strange invitation to compete in children's games." },
      { id: 8, name: "Wednesday", poster_path: "/9PFonBhy4cQy7Jz20NpMygczOkv.jpg", first_air_date: "2022-11-23", overview: "Follows Wednesday Addams' years as a student at Nevermore Academy." }
    ];

    const filtered = mockTVShows.filter(show => 
      show.name.toLowerCase().includes(query.toLowerCase())
    );

    return { results: filtered };
  }

  async searchMovies(query: string): Promise<Movie[]> {
    if (!query.trim()) return [];
    
    const response = await this.makeRequest(`/search/movie?api_key=${this.apiKey}&query=${encodeURIComponent(query)}`);
    return response.results || [];
  }

  async searchTVShows(query: string): Promise<TVShow[]> {
    if (!query.trim()) return [];
    
    const response = await this.makeRequest(`/search/tv?api_key=${this.apiKey}&query=${encodeURIComponent(query)}`);
    return response.results || [];
  }

  async getPopularMovies(): Promise<Movie[]> {
    const response = await this.makeRequest(`/discover/movie?api_key=${this.apiKey}&sort_by=popularity.desc&page=1`);
    return response.results || [];
  }

  private getMockPopularMovies() {
    const mockMovies = [
      { id: 1, title: "The Shawshank Redemption", poster_path: "/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg", release_date: "1994-09-23", overview: "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency." },
      { id: 2, title: "The Godfather", poster_path: "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg", release_date: "1972-03-14", overview: "The aging patriarch of an organized crime dynasty transfers control to his reluctant son." }
    ];
    return { results: mockMovies };
  }

  getImageUrl(posterPath: string): string {
    return `${TMDB_IMAGE_BASE_URL}${posterPath}`;
  }

  async searchAll(query: string): Promise<(Movie | TVShow)[]> {
    const [movies, tvShows] = await Promise.all([
      this.searchMovies(query),
      this.searchTVShows(query)
    ]);

    return [...movies, ...tvShows];
  }
}

export const tmdbService = new TMDBService();