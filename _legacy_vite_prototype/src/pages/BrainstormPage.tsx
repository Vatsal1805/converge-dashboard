import { useState } from 'react';
import { mockIdeas, mockUsers } from '@/data/mockData';
import { Idea } from '@/data/types';
import { useRole } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, ThumbsUp, MessageSquare, CheckCircle, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function BrainstormPage() {
  const { currentUser } = useRole();
  const [ideas, setIdeas] = useState<Idea[]>(mockIdeas);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});

  const filtered = ideas.filter(i =>
    i.title.toLowerCase().includes(search.toLowerCase()) ||
    i.description.toLowerCase().includes(search.toLowerCase())
  );

  const toggleUpvote = (ideaId: string) => {
    setIdeas(ideas.map(i => {
      if (i.id !== ideaId) return i;
      const hasVoted = i.upvotes.includes(currentUser.id);
      return { ...i, upvotes: hasVoted ? i.upvotes.filter(id => id !== currentUser.id) : [...i.upvotes, currentUser.id] };
    }));
  };

  const addComment = (ideaId: string) => {
    const text = commentTexts[ideaId]?.trim();
    if (!text) return;
    setIdeas(ideas.map(i => {
      if (i.id !== ideaId) return i;
      return {
        ...i,
        comments: [...i.comments, { id: `c${Date.now()}`, authorId: currentUser.id, content: text, createdAt: new Date().toISOString() }]
      };
    }));
    setCommentTexts(prev => ({ ...prev, [ideaId]: '' }));
  };

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    const newIdea: Idea = {
      id: `i${Date.now()}`,
      title: newTitle,
      description: newDesc,
      authorId: currentUser.id,
      tags: [],
      upvotes: [],
      comments: [],
      approved: false,
      attachments: [],
      createdAt: new Date().toISOString(),
    };
    setIdeas([newIdea, ...ideas]);
    setNewTitle('');
    setNewDesc('');
    setShowCreate(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Brainstorm Room</h1>
          <p className="text-muted-foreground text-sm">{ideas.length} ideas · Internal innovation feed</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Post Idea</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Share Your Idea</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Idea Title</Label><Input className="mt-1" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Summarize your idea in one line..." /></div>
              <div><Label>Description</Label><Textarea className="mt-1 h-32" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Describe your idea in detail — what problem does it solve? What's the expected outcome?" /></div>
              <Button className="w-full" onClick={handleCreate}>Post Idea</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search ideas..." className="pl-9 max-w-sm" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="space-y-4">
        {filtered.map(idea => {
          const author = mockUsers.find(u => u.id === idea.authorId);
          const hasVoted = idea.upvotes.includes(currentUser.id);
          const timeAgo = new Date(idea.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

          return (
            <div key={idea.id} className="bg-card border rounded-xl p-5 space-y-4">
              {/* Header */}
              <div className="flex items-start gap-3">
                <Avatar className="h-9 w-9 flex-shrink-0">
                  <AvatarFallback className="text-xs bg-primary/20 text-primary font-semibold">{author?.avatar}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold">{author?.name}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{timeAgo}</span>
                    {idea.approved && (
                      <span className="flex items-center gap-1 text-xs text-success font-medium">
                        <CheckCircle className="h-3 w-3" /> Approved
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-base mt-1">{idea.title}</h3>
                </div>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">{idea.description}</p>

              {idea.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {idea.tags.map(t => <span key={t} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">#{t}</span>)}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-4 pt-2 border-t">
                <button
                  onClick={() => toggleUpvote(idea.id)}
                  className={`flex items-center gap-1.5 text-sm transition-colors ${hasVoted ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <ThumbsUp className="h-4 w-4" /> {idea.upvotes.length}
                </button>
                <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <MessageSquare className="h-4 w-4" /> {idea.comments.length}
                </button>
              </div>

              {/* Comments */}
              {idea.comments.length > 0 && (
                <div className="space-y-3 pt-2 border-t">
                  {idea.comments.map(comment => {
                    const commenter = mockUsers.find(u => u.id === comment.authorId);
                    return (
                      <div key={comment.id} className="flex gap-2">
                        <Avatar className="h-6 w-6 flex-shrink-0 mt-0.5">
                          <AvatarFallback className="text-[9px] bg-muted text-muted-foreground">{commenter?.avatar}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2">
                          <span className="text-xs font-semibold">{commenter?.name}</span>
                          <p className="text-xs text-muted-foreground mt-0.5">{comment.content}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add Comment */}
              <div className="flex gap-2 pt-1">
                <Avatar className="h-7 w-7 flex-shrink-0">
                  <AvatarFallback className="text-[10px] bg-primary/20 text-primary font-semibold">{currentUser.avatar}</AvatarFallback>
                </Avatar>
                <div className="flex-1 flex gap-2">
                  <Input
                    placeholder="Add a comment..."
                    className="h-8 text-sm flex-1"
                    value={commentTexts[idea.id] || ''}
                    onChange={e => setCommentTexts(prev => ({ ...prev, [idea.id]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && addComment(idea.id)}
                  />
                  <Button size="sm" variant="ghost" className="h-8 px-3 text-xs" onClick={() => addComment(idea.id)}>Post</Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
