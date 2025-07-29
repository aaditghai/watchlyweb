import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Film, Users, UserPlus, Camera, Edit, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
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

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats>({ followers_count: 0, following_count: 0, recent_movies: [] });
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [favoriteGenres, setFavoriteGenres] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchStats();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
    } else {
      setProfile(data);
      setDisplayName(data.display_name || '');
      setBio(data.bio || '');
      setFavoriteGenres(data.favorite_genres?.join(', ') || '');
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    if (!user) return;

    // Get followers count
    const { count: followersCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', user.id);

    // Get following count
    const { count: followingCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', user.id);

    // Get recent movies
    const { data: recentMovies } = await supabase
      .from('watch_logs')
      .select('id, title, created_at, image_url, emoji')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    setStats({
      followers_count: followersCount || 0,
      following_count: followingCount || 0,
      recent_movies: recentMovies || []
    });
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      toast({
        title: "Avatar updated!",
        description: "Your profile picture has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !profile) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName,
        bio: bio,
        favorite_genres: favoriteGenres.split(',').map(g => g.trim()).filter(g => g)
      })
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setIsEditing(false);
      fetchProfile();
      toast({
        title: "Profile updated!",
        description: "Your profile has been updated successfully.",
      });
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
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
      <header className="sticky top-0 z-40 bg-gradient-to-r from-background/95 to-secondary/30 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-accent/20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              to="/" 
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Back to Feed</span>
            </Link>
            <div className="flex items-center gap-3">
              <div className="text-3xl">🎬</div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Watchly</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback className="text-2xl">
                    {profile.display_name?.charAt(0) || profile.email.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90">
                  <Camera className="h-4 w-4" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  {isEditing ? (
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Display name"
                      className="text-2xl font-bold h-auto border-0 px-0 focus-visible:ring-0"
                    />
                  ) : (
                    <h2 className="text-2xl font-bold">{profile.display_name || profile.email}</h2>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {isEditing ? 'Save' : 'Edit'}
                  </Button>
                </div>
                

                {isEditing ? (
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    className="mb-4"
                  />
                ) : (
                  profile.bio && (
                    <p className="text-muted-foreground mb-4">{profile.bio}</p>
                  )
                )}

                {isEditing ? (
                  <Input
                    value={favoriteGenres}
                    onChange={(e) => setFavoriteGenres(e.target.value)}
                    placeholder="Favorite genres (comma separated)"
                  />
                ) : (
                  profile.favorite_genres && profile.favorite_genres.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {profile.favorite_genres.map((genre, index) => (
                        <Badge key={index} variant="secondary">{genre}</Badge>
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>
          </CardHeader>
          <ProfileStats 
            stats={stats} 
            isOwnProfile={true}
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
                No movies logged yet. Start watching and logging!
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Profile;