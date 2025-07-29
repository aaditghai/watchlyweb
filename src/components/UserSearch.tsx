import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus, UserMinus, Users, Search, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Profile {
  user_id: string;
  display_name: string;
  email: string;
  avatar_url?: string;
  isFollowing?: boolean;
}

const UserSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<Profile[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchFollowing = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);

    setFollowing(data?.map(f => f.following_id) || []);
  };

  const searchUsers = async (term: string) => {
    if (!term.trim() || !user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, display_name, email, avatar_url')
      .neq('user_id', user.id)
      .or(`display_name.ilike.%${term}%, email.ilike.%${term}%`)
      .limit(10);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to search users",
        variant: "destructive",
      });
    } else {
      const usersWithFollowStatus = (data || []).map(u => ({
        ...u,
        isFollowing: following.includes(u.user_id)
      }));
      setUsers(usersWithFollowStatus);
    }
    setLoading(false);
  };

  const toggleFollow = async (targetUserId: string, isCurrentlyFollowing: boolean) => {
    if (!user) return;

    if (isCurrentlyFollowing) {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to unfollow user",
          variant: "destructive",
        });
      } else {
        setFollowing(prev => prev.filter(id => id !== targetUserId));
        setUsers(prev => prev.map(u => 
          u.user_id === targetUserId ? { ...u, isFollowing: false } : u
        ));
        toast({
          title: "Unfollowed",
          description: "User removed from your following list",
        });
      }
    } else {
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: targetUserId
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to follow user",
          variant: "destructive",
        });
      } else {
        setFollowing(prev => [...prev, targetUserId]);
        setUsers(prev => prev.map(u => 
          u.user_id === targetUserId ? { ...u, isFollowing: true } : u
        ));
        toast({
          title: "Following",
          description: "User added to your following list",
        });
      }
    }
  };

  useEffect(() => {
    fetchFollowing();
  }, [user]);

  useEffect(() => {
    if (searchQuery) {
      const timeoutId = setTimeout(() => {
        searchUsers(searchQuery);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setUsers([]);
    }
  }, [searchQuery, following]);

  const copyInviteLink = () => {
    const inviteLink = `${window.location.origin}/auth?ref=${user?.id}`;
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: "Invite link copied!",
      description: "Share this link with friends to invite them to Watchly",
    });
  };

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Find & Invite Friends
        </CardTitle>
        <CardDescription>
          Search for users already on Watchly or invite new friends
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email or display name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" onClick={copyInviteLink}>
            <Share2 className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Invite Link</span>
          </Button>
        </div>
        
        {loading && <p className="text-center text-muted-foreground">Searching...</p>}
        
        <div className="space-y-2">
          {users.map((profile) => (
            <div key={profile.user_id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback>
                    {profile.display_name?.charAt(0) || profile.email.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div 
                  className="flex-1 min-w-0 cursor-pointer" 
                  onClick={() => navigate(`/user/${profile.user_id}`)}
                >
                  <h4 className="font-medium truncate hover:text-primary transition-colors">
                    {profile.display_name || 'Anonymous User'}
                  </h4>
                  <p className="text-sm text-muted-foreground truncate">{profile.email}</p>
                </div>
              </div>
              <Button
                variant={profile.isFollowing ? "outline" : "default"}
                size="sm"
                onClick={() => toggleFollow(profile.user_id, profile.isFollowing || false)}
                className="flex-shrink-0"
              >
                {profile.isFollowing ? (
                  <>
                    <UserMinus className="h-4 w-4 mr-1" />
                    Unfollow
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-1" />
                    Follow
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>

        {searchQuery && !loading && users.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-2">
              No users found matching "{searchQuery}"
            </p>
            <p className="text-sm text-muted-foreground">
              Invite them to join Watchly with your invite link!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserSearch;