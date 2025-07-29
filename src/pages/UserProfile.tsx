import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Film, ArrowLeft, UserPlus, UserMinus } from 'lucide-react';
import { ProfileStats } from '@/components/ProfileStats';

interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  favorite_genres?: string[];
  total_movies_logged: number;
}

interface Stats {
  followers_count: number;
  following_count: number;
  recent_movies: Array<{
    id: string;
    title: string;
    created_at: string;
    image_url?: string;
    emoji?: string;
  }>;
}

const UserProfile = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats>({ followers_count: 0, following_count: 0, recent_movies: [] });
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchProfile();
      fetchStats();
      checkFollowStatus();
    }
  }, [userId]);

  const fetchProfile = async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
    } else {
      setProfile(data);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    if (!userId) return;

    // Get followers count
    const { count: followersCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);

    // Get following count
    const { count: followingCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId);

    // Get recent movies
    const { data: recentMovies } = await supabase
      .from('watch_logs')
      .select('id, title, created_at, image_url, emoji')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    setStats({
      followers_count: followersCount || 0,
      following_count: followingCount || 0,
      recent_movies: recentMovies || []
    });
  };

  const checkFollowStatus = async () => {
    if (!user || !userId || user.id === userId) return;

    const { data } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', userId)
      .single();

    setIsFollowing(!!data);
  };

  const toggleFollow = async () => {
    if (!user || !userId) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);

        if (error) throw error;

        setIsFollowing(false);
        toast({
          description: `Unfollowed ${profile?.display_name || profile?.email}`,
        });
      } else {
        const { error } = await supabase
          .from('follows')
          .insert([
            {
              follower_id: user.id,
              following_id: userId,
            },
          ]);

        if (error) throw error;

        setIsFollowing(true);
        toast({
          description: `Following ${profile?.display_name || profile?.email}`,
        });
      }

      // Refresh stats
      fetchStats();
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast({
        variant: "destructive",
        description: "Failed to update follow status",
      });
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p>Profile not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/" className="flex items-center gap-3">
              <div className="text-3xl">🎬</div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Watchly</h1>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-2xl">
                  {profile.display_name?.charAt(0) || profile.email.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <h2 className="text-2xl font-bold">{profile.display_name || profile.email}</h2>
                  {user && user.id !== userId && (
                    <Button
                      onClick={toggleFollow}
                      disabled={followLoading}
                      variant={isFollowing ? "secondary" : "default"}
                    >
                      {isFollowing ? (
                        <>
                          <UserMinus className="h-4 w-4 mr-2" />
                          Unfollow
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Follow
                        </>
                      )}
                    </Button>
                  )}
                </div>
                
                {profile.bio && (
                  <p className="text-muted-foreground mb-4">{profile.bio}</p>
                )}

                {profile.favorite_genres && profile.favorite_genres.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {profile.favorite_genres.map((genre, index) => (
                      <Badge key={index} variant="secondary">{genre}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <ProfileStats 
            stats={stats} 
            isOwnProfile={user?.id === userId}
            profileUserId={profile?.user_id || ''}
          />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Film className="h-5 w-5" />
              Recent Movies
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recent_movies.length > 0 ? (
              <div className="space-y-3">
                {stats.recent_movies.map((movie, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    {movie.emoji && <span className="text-2xl">{movie.emoji}</span>}
                    <div className="flex-1">
                      <h4 className="font-medium">{movie.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(movie.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No movies logged yet.
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default UserProfile;