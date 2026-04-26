
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { toast } from 'sonner';
import ErrorBoundary from '@/components/ErrorBoundary.jsx';

const LoginPageContent = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Invalid credentials');
      return;
    }

    setLoading(true);
    try {
      const result = await login(email, password);
      if (result?.success) {
        toast.success('Login successful');
        navigate(result.user?.role === 'admin' ? '/admin' : '/counter-select', { replace: true });
      } else {
        toast.error(result?.error || 'Invalid email or password');
      }
    } catch (error) {
      toast.error('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Helmet><title>Admin Login - AMIC Queue</title></Helmet>
      
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary-foreground font-bold text-3xl shadow-lg shadow-primary/20">
            A
          </div>
          <h1 className="text-3xl font-display font-black mb-2 text-foreground">System Login</h1>
          <p className="text-muted-foreground">Authenticate to access queue management</p>
        </div>

        <div className="bg-card border border-border/50 rounded-[2rem] shadow-xl p-8 sm:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                  id="email" 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-background text-foreground"
                  placeholder="name@example.com"
                  required
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 bg-background text-foreground"
                  required
                  dir="ltr"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-lg font-bold rounded-xl shadow-lg shadow-primary/20"
              disabled={loading}
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>Sign In <ArrowRight className="w-5 h-5 ml-2" /></>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

const LoginPage = () => (
  <ErrorBoundary>
    <LoginPageContent />
  </ErrorBoundary>
);

export default LoginPage;
