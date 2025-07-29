import { useState, useRef } from 'react';
import { Plus, Camera, Smile, Send, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import MovieSearchDialog from './MovieSearchDialog';
import EmojiPicker from './EmojiPicker';

interface FloatingCreatePostProps {
  onPostCreated: () => void;
}

const FloatingCreatePost = ({ onPostCreated }: FloatingCreatePostProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [movieSearchOpen, setMovieSearchOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<{
    title: string;
    poster_url?: string;
    tmdb_id?: number;
  } | null>(null);
  const [caption, setCaption] = useState('');
  const [emoji, setEmoji] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !user) return null;

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
    }
  };

  const handleSubmit = async () => {
    if (!selectedMovie?.title.trim()) {
      setMovieSearchOpen(true);
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create posts",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    let imageUrl = null;
    if (imageFile) {
      imageUrl = await uploadImage();
    }

    // Use movie poster if no custom image uploaded
    const finalImageUrl = imageUrl || selectedMovie.poster_url || null;

    const { error } = await supabase
      .from('watch_logs')
      .insert([
        {
          user_id: user.id,
          title: selectedMovie.title.trim(),
          caption: caption.trim() || null,
          emoji: emoji.trim() || null,
          image_url: finalImageUrl,
          is_post: true,
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
        title: "Posted! 🎬",
        description: `Your post about "${selectedMovie.title}" is now live!`,
      });
      resetForm();
      setIsOpen(false);
      onPostCreated();
    }
    setLoading(false);
  };

  const resetForm = () => {
    setSelectedMovie(null);
    setCaption('');
    setEmoji('');
    setImageFile(null);
    setImagePreview('');
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Image upload triggered');
    const file = event.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('File selected:', file.name, file.type);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            size="lg"
            className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-[var(--shadow-warm)] hover:shadow-xl transition-all duration-300 z-50 bg-gradient-to-br from-primary to-accent border-0 hover:scale-110 hover:rotate-3"
          >
            <Plus className="h-7 w-7 text-primary-foreground" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg bg-gradient-to-br from-card to-secondary/20 border-accent/20">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Share Your Watch 🎬</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Selected Movie Display */}
            {selectedMovie ? (
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-secondary/30 to-accent/20 rounded-2xl border border-accent/30 shadow-[var(--shadow-card)]">
                {selectedMovie.poster_url ? (
                  <img
                    src={selectedMovie.poster_url}
                    alt={selectedMovie.title}
                    className="w-16 h-20 object-cover rounded-xl shadow-md"
                  />
                ) : (
                  <div className="w-16 h-20 bg-gradient-to-br from-muted to-muted/70 rounded-xl flex items-center justify-center shadow-md">
                    <Film className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-bold text-lg text-foreground">{selectedMovie.title}</p>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setMovieSearchOpen(true)}
                    className="p-0 h-auto text-accent hover:text-primary font-medium"
                  >
                    ✨ Switch it up
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => setMovieSearchOpen(true)}
                className="w-full h-16 border-2 border-dashed border-accent/50 bg-gradient-to-br from-secondary/20 to-accent/10 hover:from-secondary/30 hover:to-accent/20 rounded-2xl text-lg font-medium"
              >
                <Film className="h-5 w-5 mr-3" />
                What did you watch? 🍿
              </Button>
            )}

            {/* Caption */}
            <Textarea
              placeholder="Spill the tea ☕ What did you think? Was it a vibe or nah? ✨"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={4}
              className="resize-none border-accent/30 focus:border-primary rounded-2xl bg-gradient-to-br from-background to-secondary/10 text-base"
            />

            {/* Photo and Emoji Options */}
            <div className="flex gap-3">
              <EmojiPicker onEmojiSelect={setEmoji} selectedEmoji={emoji} />
              
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                ref={fileInputRef}
              />
              <Button 
                type="button" 
                variant="secondary" 
                className="flex-1 h-12 rounded-xl font-medium"
                onClick={() => {
                  console.log('Photo button clicked');
                  fileInputRef.current?.click();
                }}
              >
                <Camera className="h-5 w-5 mr-2" />
                {imageFile ? '📸 Switch Photo' : '📷 Add a Photo'}
              </Button>
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="relative group">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-56 object-cover rounded-2xl shadow-[var(--shadow-card)] border-2 border-accent/20"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-3 right-3 rounded-full h-8 w-8 p-0 opacity-90 hover:opacity-100 transition-opacity"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview('');
                  }}
                >
                  ×
                </Button>
              </div>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={loading || !selectedMovie}
              className="w-full h-14 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 rounded-2xl text-lg font-bold shadow-[var(--shadow-warm)] hover:shadow-xl transition-all duration-300 border-0"
              size="lg"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground"></div>
                  <span>Sharing the vibes...</span>
                </div>
              ) : (
                <>
                  <Send className="h-5 w-5 mr-3" />
                  Share with the World ✨
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <MovieSearchDialog
        open={movieSearchOpen}
        onOpenChange={setMovieSearchOpen}
        onSelectMovie={setSelectedMovie}
      />
    </>
  );
};

export default FloatingCreatePost;