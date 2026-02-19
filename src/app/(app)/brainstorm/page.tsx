'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Heart, MessageCircle, Send, Loader2, Hash, Lightbulb } from 'lucide-react';

interface Comment {
    _id: string;
    author: { name: string; email: string };
    content: string;
    createdAt: string;
}

interface Post {
    _id: string;
    author: { _id: string; name: string; email: string; role: string };
    content: string;
    tags: string[];
    likes: { _id: string; name: string }[];
    comments: Comment[];
    createdAt: string;
}

export default function BrainstormPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [newPost, setNewPost] = useState('');
    const [newTags, setNewTags] = useState('');
    const [posting, setPosting] = useState(false);
    const [commentingOn, setCommentingOn] = useState<string | null>(null);
    const [commentText, setCommentText] = useState('');

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const res = await fetch('/api/brainstorm/list');
            const data = await res.json();
            if (data.posts) {
                setPosts(data.posts);
            }
        } catch (err) {
            console.error('Failed to fetch posts', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePost = async () => {
        if (!newPost.trim()) return;
        
        setPosting(true);
        try {
            const tags = newTags.split(',').map(t => t.trim()).filter(Boolean);
            const res = await fetch('/api/brainstorm/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newPost, tags }),
            });
            if (res.ok) {
                setNewPost('');
                setNewTags('');
                fetchPosts();
            }
        } catch (err) {
            console.error('Failed to create post', err);
        } finally {
            setPosting(false);
        }
    };

    const handleLike = async (postId: string) => {
        try {
            const res = await fetch(`/api/brainstorm/${postId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'like' }),
            });
            if (res.ok) {
                const data = await res.json();
                setPosts(posts.map(p => p._id === postId ? data.post : p));
            }
        } catch (err) {
            console.error('Failed to like post', err);
        }
    };

    const handleComment = async (postId: string) => {
        if (!commentText.trim()) return;
        
        try {
            const res = await fetch(`/api/brainstorm/${postId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'comment', content: commentText }),
            });
            if (res.ok) {
                const data = await res.json();
                setPosts(posts.map(p => p._id === postId ? data.post : p));
                setCommentText('');
                setCommentingOn(null);
            }
        } catch (err) {
            console.error('Failed to comment', err);
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'founder': return 'bg-purple-100 text-purple-700';
            case 'teamlead': return 'bg-blue-100 text-blue-700';
            case 'intern': return 'bg-green-100 text-green-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div>
                <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <Lightbulb className="h-7 w-7 text-yellow-500" />
                    Brainstorm
                </h2>
                <p className="text-muted-foreground">Share ideas, collaborate, and innovate together.</p>
            </div>

            {/* Create Post */}
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <Textarea
                        placeholder="Share your idea, thought, or question..."
                        value={newPost}
                        onChange={(e) => setNewPost(e.target.value)}
                        rows={3}
                        className="resize-none"
                    />
                    <div className="flex items-center gap-4">
                        <div className="flex-1 flex items-center gap-2">
                            <Hash className="h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Tags (comma separated)"
                                value={newTags}
                                onChange={(e) => setNewTags(e.target.value)}
                                className="flex-1"
                            />
                        </div>
                        <Button onClick={handleCreatePost} disabled={posting || !newPost.trim()}>
                            {posting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                            Post
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Posts Feed */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : posts.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        No posts yet. Be the first to share an idea!
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {posts.map((post) => (
                        <Card key={post._id}>
                            <CardHeader className="pb-2">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback>{post.author.name.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold">{post.author.name}</span>
                                            <Badge variant="outline" className={getRoleBadgeColor(post.author.role)}>
                                                {post.author.role}
                                            </Badge>
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(post.createdAt).toLocaleDateString()} at {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pb-3">
                                <p className="whitespace-pre-wrap">{post.content}</p>
                                {post.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {post.tags.map((tag, i) => (
                                            <Badge key={i} variant="secondary" className="text-xs">
                                                #{tag}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="border-t pt-3 flex flex-col gap-3">
                                <div className="flex items-center gap-4 w-full">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleLike(post._id)}
                                        className="gap-2"
                                    >
                                        <Heart className={`h-4 w-4 ${post.likes.length > 0 ? 'fill-red-500 text-red-500' : ''}`} />
                                        {post.likes.length}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setCommentingOn(commentingOn === post._id ? null : post._id)}
                                        className="gap-2"
                                    >
                                        <MessageCircle className="h-4 w-4" />
                                        {post.comments.length}
                                    </Button>
                                </div>

                                {/* Comments */}
                                {post.comments.length > 0 && (
                                    <div className="w-full space-y-2 pl-4 border-l-2">
                                        {post.comments.slice(-3).map((comment) => (
                                            <div key={comment._id} className="text-sm">
                                                <span className="font-medium">{comment.author.name}</span>
                                                <span className="text-muted-foreground ml-2">{comment.content}</span>
                                            </div>
                                        ))}
                                        {post.comments.length > 3 && (
                                            <span className="text-xs text-muted-foreground">
                                                +{post.comments.length - 3} more comments
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* New Comment */}
                                {commentingOn === post._id && (
                                    <div className="flex gap-2 w-full">
                                        <Input
                                            placeholder="Write a comment..."
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleComment(post._id)}
                                        />
                                        <Button size="sm" onClick={() => handleComment(post._id)}>
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
