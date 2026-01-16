import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import { useRegionBySlug } from '@/hooks/useRegionBySlug';
import { generateSlug } from '@/utils/slugUtils';
import type { Region } from '@/hooks/useRegions';

const RegionSpecificRegister = () => {
  const { regionCode } = useParams<{ regionCode: string }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const regionIdentifier = regionCode?.toLowerCase();
  const looksLikeSlug = !!regionIdentifier && regionIdentifier.includes('-');

  const { data: regionFromSlug, isLoading: regionSlugLoading } = useRegionBySlug(
    looksLikeSlug ? regionIdentifier : undefined
  );

  const { data: regionFromCode, isLoading: regionCodeLoading } = useQuery({
    queryKey: ['region-by-code', regionIdentifier],
    queryFn: async () => {
      if (!regionIdentifier) return null;

      const { data, error } = await supabase
        .from('regions')
        .select('*')
        .eq('code', regionIdentifier.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return (data as Region | null) ?? null;
    },
    enabled: !!regionIdentifier && !looksLikeSlug,
  });

  const region = (regionFromSlug ?? regionFromCode) as Region | null;
  const regionLoading = regionSlugLoading || regionCodeLoading;
  const regionLoginSlug = region ? generateSlug(region.name) : undefined;

  // Fetch regional roles for the region
  const { data: regionalRoles, isLoading: rolesLoading, isFetched: rolesFetched } = useQuery({
    queryKey: ['regional-roles-for-region', region?.id],
    queryFn: async () => {
      if (!region?.id) return [];

      const { data, error } = await supabase
        .from('regional_roles')
        .select('id, name, description')
        .eq('region_id', region.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!region?.id,
  });

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

    if (!selectedRoleId) {
      toast({
        title: "Role Required",
        description: "Please select a role to request access for.",
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

    if (!region) {
      toast({
        title: "Region Not Found",
        description: "Unable to find the specified region. Please try again.",
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
            last_name: lastName.trim(),
            region_id: region.id
          },
          emailRedirectTo: `${window.location.origin}/auth/regions/${generateSlug(region.name)}`
        }
      });

      if (signUpError) {
        console.error('RegionSpecificRegister: Sign up error:', signUpError);
        toast({
          title: "Registration Failed",
          description: signUpError.message || "Failed to create account. Please try again.",
          variant: "destructive"
        });
        return;
      }

      if (authData.user) {
        // Create pending role for approval with region association and requested regional role
        try {
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: authData.user.id,
              role: 'regional_admin',
              region_id: region.id,
              status: 'pending',
              is_active: false,
              requested_regional_role_id: selectedRoleId
            });

          if (roleError) {
            console.error('RegionSpecificRegister: Role creation error:', roleError);
          }
        } catch (roleErr) {
          console.error('RegionSpecificRegister: Role creation exception:', roleErr);
        }

        setIsRegistered(true);
        toast({
          title: "Registration Submitted!",
          description: `Your account has been created for ${region.name} and is pending approval.`,
        });
      }

    } catch (error: any) {
      console.error('RegionSpecificRegister: Unexpected error during registration:', error);
      toast({
        title: "Registration Error",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (regionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-wca-teal/10 via-wca-teal/5 to-wca-purple/10 flex items-center justify-center p-4">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-wca-teal" />
          <span className="text-lg text-muted-foreground">Loading region...</span>
        </div>
      </div>
    );
  }

  if (!region) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-wca-teal/10 via-wca-teal/5 to-wca-purple/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-semibold text-destructive">
              Region Not Found
            </CardTitle>
            <CardDescription>
              The specified region could not be found.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate('/auth/regions')}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Region Selection
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isRegistered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-wca-teal/10 via-wca-teal/5 to-wca-purple/10 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        
        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-wca-teal to-wca-purple bg-clip-text text-transparent">
                  {region.name}
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
                <p>Your regional admin account for <strong>{region.name}</strong> has been created and is now pending approval.</p>
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
                  onClick={() => navigate(`/auth/regions/${regionLoginSlug}`)}
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
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-wca-teal to-wca-purple bg-clip-text text-transparent">
                {region.name}
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
              Request Access to {region.name}
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

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Requested Role *
                </label>
                <Select value={selectedRoleId} onValueChange={setSelectedRoleId} disabled={isLoading || rolesLoading}>
                  <SelectTrigger className="h-11 bg-white/50 border-gray-200 focus:border-wca-teal focus:ring-wca-teal/20">
                    <SelectValue placeholder={rolesLoading ? "Loading roles..." : "Select a role"} />
                  </SelectTrigger>
                  <SelectContent>
                    {regionalRoles?.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{role.name}</span>
                          {role.description && (
                            <span className="text-xs text-muted-foreground">{role.description}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {rolesFetched && regionalRoles?.length === 0 && (
                  <p className="text-sm text-amber-600 mt-1">
                    No roles have been configured for this region yet. Please contact the regional administrator.
                  </p>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-700">
                  <strong>Note:</strong> Your registration for {region.name} will be reviewed by a Super Administrator. 
                  You'll receive an email notification once approved.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-wca-teal to-wca-teal/80 hover:from-wca-teal/90 hover:to-wca-teal/70 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                disabled={isLoading || !selectedRoleId || regionalRoles?.length === 0}
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
                onClick={() => navigate(`/auth/regions/${regionLoginSlug}`)}
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
            onClick={() => navigate('/auth/regions')}
            disabled={isLoading}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to region selection
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RegionSpecificRegister;