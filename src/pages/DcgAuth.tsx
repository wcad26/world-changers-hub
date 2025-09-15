import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';


const DcgAuth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user, hasRole, getAvailablePortals } = useAuth();

  useEffect(() => {
    // If user is already authenticated, check if they have multiple roles
    if (user) {
      const availablePortals = getAvailablePortals();
      
      if (availablePortals.length > 1) {
        navigate('/portal-selector');
      } else if (hasRole('dcg_admin')) {
        navigate('/dcg/dashboard');
      } else if (hasRole('regional_admin')) {
        navigate('/admin/regional/dashboard');
      } else if (hasRole('super_admin')) {
        navigate('/admin/super/dashboard');
      }
    }
  }, [user, hasRole, getAvailablePortals, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (data.user) {
        // Check if user has any admin roles
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .in('role', ['dcg_admin', 'regional_admin', 'super_admin'])
          .eq('is_active', true);

        if (!roleData || roleData.length === 0) {
          setError('Access denied. This portal is for authorized users only.');
          await supabase.auth.signOut();
          return;
        }

        // Check if user has multiple roles and redirect accordingly
        if (roleData.length > 1) {
          navigate('/portal-selector');
        } else if (roleData.some(role => role.role === 'dcg_admin')) {
          navigate('/dcg/dashboard');
        } else if (roleData.some(role => role.role === 'regional_admin')) {
          navigate('/admin/regional/dashboard');
        } else if (roleData.some(role => role.role === 'super_admin')) {
          navigate('/admin/super/dashboard');
        }
      }
    } catch (err: any) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <CardTitle className="text-2xl font-bold text-center">DCG Portal</CardTitle>
          <CardDescription className="text-center">
            Sign in to your DCG management portal
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default DcgAuth;