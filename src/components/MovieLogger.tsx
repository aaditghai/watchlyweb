import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, X } from 'lucide-react';
import EmojiPicker from '@/components/EmojiPicker';

interface MovieLoggerProps {
  onMovieLogged: () => void;
}

const MovieLogger = ({ onMovieLogged }: MovieLoggerProps) => {
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [emoji, setEmoji] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !user) return null;

    setUploading(true);
    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('movie-photos')
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('movie-photos')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error: any) {
      toast({
        title: "Error uploading image",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, isPost: boolean = false) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a movie or show title",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to log movies",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Upload image if one is selected
    let imageUrl = null;
    if (imageFile) {
      imageUrl = await uploadImage();
    }

    const { error } = await supabase
      .from('watch_logs')
      .insert([
        {
          user_id: user.id,
          title: title.trim(),
          caption: caption.trim() || null,
          emoji: emoji.trim() || null,
          image_url: imageUrl,
          is_post: isPost,
        }
      ]);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: isPost ? "Posted!" : "Movie logged!",
        description: isPost 
          ? `Your post about "${title}" is now live!` 
          : `Added "${title}" to your watch list`,
      });
      resetForm();
      onMovieLogged();
    }
    setLoading(false);
  };

  const resetForm = () => {
    setTitle('');
    setCaption('');
    setEmoji('');
    setImageFile(null);
    setImagePreview('');
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Share What You're Watching</CardTitle>
        <CardDescription>
          Log a movie privately or create a post to share with friends
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="post" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="post">Create Post</TabsTrigger>
            <TabsTrigger value="log">Quick Log</TabsTrigger>
          </TabsList>
          
          <TabsContent value="post" className="space-y-4">
            <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-4">
              <Input
                placeholder="Movie or show title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
              />
              <div className="flex gap-2">
                <EmojiPicker
                  onEmojiSelect={setEmoji}
                  selectedEmoji={emoji}
                />
                <div className="flex-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Button type="button" variant="outline" size="sm" disabled={uploading}>
                      <Upload className="h-4 w-4 mr-2" />
                      {imageFile ? 'Change Photo' : 'Add Photo'}
                    </Button>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                  </label>
                  {imagePreview && (
                    <div className="relative mt-2 inline-block">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="h-20 w-20 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 p-0"
                        onClick={removeImage}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <Textarea
                placeholder="What did you think? Share your thoughts..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                disabled={loading}
                rows={3}
              />
              <Button type="submit" disabled={loading || uploading || !title.trim()} className="w-full">
                {loading || uploading ? "Posting..." : "Post to Feed"}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="log" className="space-y-4">
            <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
              <Input
                placeholder="Movie or show title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
              />
              <Button type="submit" disabled={loading || uploading || !title.trim()} className="w-full">
                {loading || uploading ? "Logging..." : "Quick Log"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MovieLogger;