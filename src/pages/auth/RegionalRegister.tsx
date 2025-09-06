import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Users, Loader2, CheckCircle } from 'lucide-react';


const RegionalRegister = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !firstName || !lastName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim()
          },
          emailRedirectTo: `${window.location.origin}/auth/regional`
        }
      });

      if (signUpError) {
        console.error('RegionalRegister: Sign up error:', signUpError);
        toast({
          title: "Registration Failed",
          description: signUpError.message || "Failed to create account. Please try again.",
          variant: "destructive"
        });
        return;
      }

      if (authData.user) {
        // Create pending role for approval
        try {
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: authData.user.id,
              role: 'regional_admin',
              status: 'pending',
              is_active: false
            });

          if (roleError) {
            console.error('RegionalRegister: Role creation error:', roleError);
          }
        } catch (roleErr) {
          console.error('RegionalRegister: Role creation exception:', roleErr);
        }

        setIsRegistered(true);
        toast({
          title: "Registration Submitted!",
          description: "Your account has been created and is pending approval from a Super Administrator.",
        });
      }

    } catch (error: any) {
      console.error('RegionalRegister: Unexpected error during registration:', error);
      toast({
        title: "Registration Error",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isRegistered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-wca-teal/10 via-wca-teal/5 to-wca-purple/10 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        
        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <img src="/lovable-uploads/15519acb-f856-4cf5-a23d-3e9451b2b146.png" alt="WCA Logo" className="w-12 h-12 rounded-lg" />
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-wca-teal to-wca-purple bg-clip-text text-transparent">
                  WCA
                </h1>
                <p className="text-sm text-muted-foreground">
                  Regional Portal Registration
                </p>
              </div>
            </div>
          </div>

          <Card className="backdrop-blur-sm bg-white/80 border-white/20 shadow-2xl">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-semibold text-green-700">
                Registration Submitted!
              </CardTitle>
              <CardDescription className="text-center space-y-2">
                <p>Your regional admin account has been created and is now pending approval.</p>
                <p className="text-sm text-muted-foreground">
                  You will receive an email notification once a Super Administrator approves your account.
                </p>
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">What happens next?</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• A Super Administrator will review your registration</li>
                  <li>• You'll receive an email once approved</li>
                  <li>• You can then sign in using your credentials</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate('/auth/regional')}
                >
                  Sign In Page
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate('/')}
                >
                  Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-wca-teal/10 via-wca-teal/5 to-wca-purple/10 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <img src="/lovable-uploads/15519acb-f856-4cf5-a23d-3e9451b2b146.png" alt="WCA Logo" className="w-12 h-12 rounded-lg" />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-wca-teal to-wca-purple bg-clip-text text-transparent">
                WCA
              </h1>
              <p className="text-sm text-muted-foreground">
                Regional Portal Registration
              </p>
            </div>
          </div>
        </div>

        <Card className="backdrop-blur-sm bg-white/80 border-white/20 shadow-2xl">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-semibold">
              Request Regional Access
            </CardTitle>
            <CardDescription>
              Submit your registration for regional administrator access
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-11 bg-white/50 border-gray-200 focus:border-wca-teal focus:ring-wca-teal/20"
                    disabled={isLoading}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-11 bg-white/50 border-gray-200 focus:border-wca-teal focus:ring-wca-teal/20"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 bg-white/50 border-gray-200 focus:border-wca-teal focus:ring-wca-teal/20"
                  disabled={isLoading}
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 bg-white/50 border-gray-200 focus:border-wca-teal focus:ring-wca-teal/20 pr-10"
                    disabled={isLoading}
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-700">
                  <strong>Note:</strong> Your registration will be reviewed by a Super Administrator. 
                  You'll receive an email notification once approved.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-wca-teal to-wca-teal/80 hover:from-wca-teal/90 hover:to-wca-teal/70 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Registration...</span>
                  </div>
                ) : (
                  <span>Submit Registration</span>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Already have an approved account?
              </p>
              <Button
                variant="link"
                className="text-wca-teal hover:text-wca-teal/80 font-medium p-0 h-auto"
                onClick={() => navigate('/auth/regional')}
                disabled={isLoading}
              >
                Sign in instead
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => navigate('/')}
            disabled={isLoading}
          >
            ← Back to main site
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RegionalRegister;