import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Loader2, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { Navigate } from 'react-router-dom';

export default function LoginPage() {
    const { login, isAuthenticated, isLoading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    if (isAuthenticated && !isLoading) {
        return <Navigate to="/" replace />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;

        setIsSubmitting(true);
        await login(email, password);
        setIsSubmitting(false);
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[10%] left-[10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] opacity-30 animate-pulse" />
                <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-[100px] opacity-20" />
            </div>

            <div className="w-full max-w-md bg-card/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 z-10 animate-fade-in relative">
                <div className="flex flex-col items-center mb-8">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-primary/25">
                        <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                        Welcome Back
                    </h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Sign in to ConvergeOS
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground ml-1">WORK EMAIL</Label>
                        <div className="relative group">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                type="email"
                                placeholder="name@convergedigitals.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-9 bg-background/50 border-white/5 focus:border-primary/50 transition-all"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground ml-1">PASSWORD</Label>
                        <div className="relative group">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-9 pr-9 bg-background/50 border-white/5 focus:border-primary/50 transition-all"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        <div className="flex justify-end">
                            <a href="#" className="text-xs text-primary hover:text-primary/80 transition-colors">
                                Forgot password?
                            </a>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-11 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all duration-300 font-medium"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Signing in...
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-white/5 text-center">
                    <p className="text-xs text-muted-foreground">
                        Restricted Access. Converge Digitals Internal System.
                    </p>
                </div>
            </div>
        </div>
    );
}
