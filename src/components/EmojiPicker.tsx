import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const EMOJI_OPTIONS = [
  '🎬', '🍿', '🎭', '🎪', '🎨', '🎯', '🎲', '🎸', '🎤', '🎧',
  '❤️', '😍', '😂', '😢', '😱', '🤔', '😴', '🤯', '🔥', '⭐',
  '👍', '👎', '✨', '💫', '🌟', '🎉', '🎊', '💯', '🚀', '💎'
];

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  selectedEmoji?: string;
}

const EmojiPicker = ({ onEmojiSelect, selectedEmoji }: EmojiPickerProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary" className="w-16 h-12 rounded-xl font-medium">
          {selectedEmoji || '😊'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-gradient-to-br from-card to-secondary/20 border-accent/20 rounded-2xl p-4">
        <h4 className="font-bold text-center mb-3 text-foreground">Pick your vibe! ✨</h4>
        <div className="grid grid-cols-10 gap-2">
          {EMOJI_OPTIONS.map((emoji) => (
            <Button
              key={emoji}
              variant="ghost"
              className="h-10 w-10 p-0 text-lg hover:bg-accent/20 rounded-xl hover:scale-110 transition-all duration-200"
              onClick={() => onEmojiSelect(emoji)}
            >
              {emoji}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default EmojiPicker;