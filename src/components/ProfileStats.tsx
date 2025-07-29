import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface Profile {
  user_id: string;
  display_name: string;
  email: string;
  avatar_url?: string;
  isFollowing?: boolean;
}

interface WatchLog {
  id: string;
  title: string;
  image_url?: string;
  created_at: string;
}

interface ProfileStatsProps {
  stats: {
    followers_count: number;
    following_count: number;
    recent_movies: WatchLog[];
  };
  isOwnProfile: boolean;
  profileUserId: string;
}

export const ProfileStats = ({ stats, isOwnProfile, profileUserId }: ProfileStatsProps) => {
  const [dialogOpen, setDialogOpen] = useState<'followers' | 'following' | 'movies' | null>(null);
  const [followers, setFollowers] = useState<Profile[]>([]);
  const [following, setFollowing] = useState<Profile[]>([]);
  const [userFollowing, setUserFollowing] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchFollowers = async () => {
    setLoading(true);
    try {
      // First get the follow relationships
      const { data: followData, error: followError } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', profileUserId);

      if (followError) throw followError;

      if (!followData || followData.length === 0) {
        setFollowers([]);
        setLoading(false);
        return;
      }

      // Then get the profiles for those followers
      const followerIds = followData.map(f => f.follower_id);
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, display_name, email, avatar_url')
        .in('user_id', followerIds);

      if (profileError) throw profileError;

      const followersList = profileData || [];

      // Check which followers the current user is following
      if (user) {
        const { data: currentUserFollowing } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id);

        const followingSet = new Set(currentUserFollowing?.map(f => f.following_id) || []);
        setUserFollowing(followingSet);
      }

      setFollowers(followersList);
    } catch (error) {
      console.error('Error fetching followers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowing = async () => {
    setLoading(true);
    try {
      // First get the follow relationships
      const { data: followData, error: followError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', profileUserId);

      if (followError) throw followError;

      if (!followData || followData.length === 0) {
        setFollowing([]);
        setLoading(false);
        return;
      }

      // Then get the profiles for those users being followed
      const followingIds = followData.map(f => f.following_id);
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, display_name, email, avatar_url')
        .in('user_id', followingIds);

      if (profileError) throw profileError;

      const followingList = profileData || [];

      // Check which users the current user is following
      if (user) {
        const { data: currentUserFollowing } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id);

        const followingSet = new Set(currentUserFollowing?.map(f => f.following_id) || []);
        setUserFollowing(followingSet);
      }

      setFollowing(followingList);
    } catch (error) {
      console.error('Error fetching following:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFollow = async (targetUserId: string) => {
    if (!user) return;

    const isFollowing = userFollowing.has(targetUserId);

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);

        if (error) throw error;

        setUserFollowing(prev => {
          const newSet = new Set(prev);
          newSet.delete(targetUserId);
          return newSet;
        });

        toast({
          description: "Unfollowed user",
        });
      } else {
        const { error } = await supabase
          .from('follows')
          .insert([
            {
              follower_id: user.id,
              following_id: targetUserId,
            },
          ]);

        if (error) throw error;

        setUserFollowing(prev => new Set([...prev, targetUserId]));

        toast({
          description: "Following user",
        });
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast({
        variant: "destructive",
        description: "Failed to update follow status",
      });
    }
  };

  const openDialog = (type: 'followers' | 'following' | 'movies') => {
    setDialogOpen(type);
    if (type === 'followers') {
      fetchFollowers();
    } else if (type === 'following') {
      fetchFollowing();
    }
  };

  return (
    <>
      <div className="flex justify-center gap-8 py-6 border-t">
        <button
          onClick={() => openDialog('movies')}
          className="text-center hover:opacity-80 transition-opacity"
        >
          <div className="text-xl font-bold text-foreground">{stats.recent_movies?.length || 0}</div>
          <div className="text-sm text-muted-foreground">Movies</div>
        </button>
        <button
          onClick={() => openDialog('followers')}
          className="text-center hover:opacity-80 transition-opacity"
        >
          <div className="text-xl font-bold text-foreground">{stats.followers_count}</div>
          <div className="text-sm text-muted-foreground">Followers</div>
        </button>
        <button
          onClick={() => openDialog('following')}
          className="text-center hover:opacity-80 transition-opacity"
        >
          <div className="text-xl font-bold text-foreground">{stats.following_count}</div>
          <div className="text-sm text-muted-foreground">Following</div>
        </button>
      </div>

      <Dialog open={!!dialogOpen} onOpenChange={() => setDialogOpen(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogOpen === 'followers' && 'Followers'}
              {dialogOpen === 'following' && 'Following'}
              {dialogOpen === 'movies' && 'Recent Movies'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {dialogOpen === 'movies' && (
              <>
                {stats.recent_movies?.map((movie) => (
                  <Card key={movie.id}>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        {movie.image_url && (
                          <img
                            src={movie.image_url}
                            alt={movie.title}
                            className="w-12 h-16 object-cover rounded"
                          />
                        )}
                        <div>
                          <div className="font-medium">{movie.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(movie.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(!stats.recent_movies || stats.recent_movies.length === 0) && (
                  <p className="text-center text-muted-foreground py-4">No movies logged yet</p>
                )}
              </>
            )}

            {dialogOpen === 'followers' && (
              <>
                {loading ? (
                  <p className="text-center py-4">Loading...</p>
                ) : (
                  <>
                    {followers.map((follower) => (
                      <div key={follower.user_id} className="flex items-center justify-between p-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={follower.avatar_url} />
                            <AvatarFallback>
                              {follower.display_name?.charAt(0) || follower.email.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <Link 
                              to={`/user/${follower.user_id}`}
                              className="font-medium hover:text-primary transition-colors"
                            >
                              {follower.display_name || follower.email}
                            </Link>
                            <div className="text-sm text-muted-foreground">{follower.email}</div>
                          </div>
                        </div>
                        {user && user.id !== follower.user_id && (
                          <Button
                            variant={userFollowing.has(follower.user_id) ? "secondary" : "default"}
                            size="sm"
                            onClick={() => toggleFollow(follower.user_id)}
                          >
                            {userFollowing.has(follower.user_id) ? 'Following' : 'Follow'}
                          </Button>
                        )}
                      </div>
                    ))}
                    {followers.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">No followers yet</p>
                    )}
                  </>
                )}
              </>
            )}

            {dialogOpen === 'following' && (
              <>
                {loading ? (
                  <p className="text-center py-4">Loading...</p>
                ) : (
                  <>
                    {following.map((followedUser) => (
                      <div key={followedUser.user_id} className="flex items-center justify-between p-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={followedUser.avatar_url} />
                            <AvatarFallback>
                              {followedUser.display_name?.charAt(0) || followedUser.email.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <Link 
                              to={`/user/${followedUser.user_id}`}
                              className="font-medium hover:text-primary transition-colors"
                            >
                              {followedUser.display_name || followedUser.email}
                            </Link>
                            <div className="text-sm text-muted-foreground">{followedUser.email}</div>
                          </div>
                        </div>
                        {user && user.id !== followedUser.user_id && (
                          <Button
                            variant={userFollowing.has(followedUser.user_id) ? "secondary" : "default"}
                            size="sm"
                            onClick={() => toggleFollow(followedUser.user_id)}
                          >
                            {userFollowing.has(followedUser.user_id) ? 'Following' : 'Follow'}
                          </Button>
                        )}
                      </div>
                    ))}
                    {following.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">Not following anyone yet</p>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};