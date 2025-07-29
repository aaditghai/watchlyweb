import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Trash2, User, Clock, Heart, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface WatchLog {
  id: string;
  title: string;
  caption?: string;
  emoji?: string;
  image_url?: string;
  is_post: boolean;
  created_at: string;
  user_id: string;
  profiles: {
    display_name: string;
    email: string;
    avatar_url?: string;
  };
}

interface MovieListProps {
  refreshTrigger?: number;
  showFeed?: boolean;
}

const MovieList = ({ refreshTrigger, showFeed = true }: MovieListProps) => {
  const [logs, setLogs] = useState<WatchLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchMovies = async () => {
    if (!user) return;

    try {
      if (showFeed) {
        // For feed: get user's own logs
        const { data: userLogs } = await supabase
          .from('watch_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        // Get posts from people the user follows
        const { data: followingData } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id);

        const followingIds = followingData?.map(f => f.following_id) || [];
        
        let feedLogs: any[] = [];
        if (followingIds.length > 0) {
          const { data } = await supabase
            .from('watch_logs')
            .select('*')
            .in('user_id', followingIds)
            .eq('is_post', true)
            .order('created_at', { ascending: false });
          
          feedLogs = data || [];
        }

        // Get all unique user IDs
        const allLogs = [...(userLogs || []), ...feedLogs];
        const userIds = [...new Set(allLogs.map(log => log.user_id))];

        // Get profiles for all users
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, display_name, email, avatar_url')
          .in('user_id', userIds);

        // Create a map of profiles
        const profilesMap = new Map();
        (profilesData || []).forEach(profile => {
          profilesMap.set(profile.user_id, profile);
        });

        // Attach profiles to logs
        const logsWithProfiles = allLogs.map(log => ({
          ...log,
          profiles: profilesMap.get(log.user_id) || {
            display_name: 'Unknown User',
            email: '',
            avatar_url: ''
          }
        }));

        // Sort by date
        logsWithProfiles.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setLogs(logsWithProfiles);
      } else {
        // For personal logs: show only user's own logs
        const { data: userLogs } = await supabase
          .from('watch_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        // Get user's profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('user_id, display_name, email, avatar_url')
          .eq('user_id', user.id)
          .single();

        const logsWithProfile = (userLogs || []).map(log => ({
          ...log,
          profiles: profileData || {
            display_name: 'You',
            email: user.email || '',
            avatar_url: ''
          }
        }));

        setLogs(logsWithProfile);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
    
    setLoading(false);
  };

  const deleteLog = async (logId: string) => {
    const { error } = await supabase
      .from('watch_logs')
      .delete()
      .eq('id', logId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete movie",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Deleted",
        description: "Movie removed from your log",
      });
      fetchMovies();
    }
  };

  useEffect(() => {
    if (user) {
      fetchMovies();
    }
  }, [user, refreshTrigger]);

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-lg mb-2">
          {showFeed 
            ? 'No posts yet'
            : 'No movies logged yet'
          }
        </p>
        <p className="text-sm text-muted-foreground">
          {showFeed 
            ? 'Follow some friends or create your first post!'
            : 'Start by logging your first movie!'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {logs.map((log) => (
        <Card key={log.id} className="overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-0">
            <div className="p-6">
              <div className="flex items-start gap-4">
                {log.image_url && (
                  <div className="w-24 h-32 flex-shrink-0 overflow-hidden rounded-xl shadow-md cursor-pointer"
                       onClick={() => setSelectedImage(log.image_url)}>
                    <img
                      src={log.image_url}
                      alt={log.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                {showFeed && log.profiles && (
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={log.profiles.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {log.profiles.display_name?.charAt(0) || log.profiles.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <Link 
                        to={`/user/${log.user_id}`}
                        className="font-medium text-sm hover:text-primary transition-colors cursor-pointer"
                      >
                        {log.user_id === user?.id ? 'You' : (log.profiles.display_name || log.profiles.email?.split('@')[0])}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    
                    {log.user_id === user?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteLog(log.id)}
                        className="ml-auto text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
                
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-lg">{log.title}</h3>
                  {log.emoji && <span className="text-lg">{log.emoji}</span>}
                </div>
                
                {log.caption && (
                  <p className="text-foreground mb-3 leading-relaxed">{log.caption}</p>
                )}
                
                {!showFeed && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}</span>
                    {log.user_id === user?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteLog(log.id)}
                        className="ml-auto text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          </CardContent>
        </Card>
      ))}
      
      {/* Image Popup Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl p-0 bg-transparent border-0">
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Full size"
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MovieList;