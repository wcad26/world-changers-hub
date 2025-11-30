import { useState, useEffect } from 'react';
import SuperAdminLayout from '@/components/admin/SuperAdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Upload, Eye, Save, Loader2 } from 'lucide-react';
import { useHomepageContent } from '@/hooks/useHomepageContent';
import { HomepageContentData } from '@/hooks/useGlobalContent';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';

const defaultHomepageContent: HomepageContentData = {
  hero: {
    slides: [
      {
        id: '1',
        image: '/public/lovable-uploads/366be6c2-b04b-4b05-a73a-cff2d9452c69.png',
        title: 'Welcome to World Christian Assembly',
        subtitle: 'Building Tomorrow\'s Leaders Today',
        description: 'Empowering communities through spiritual growth, leadership development, and transformative service worldwide.',
        primaryButton: { text: 'Learn More', link: '/about' },
        secondaryButton: { text: 'Find a Location', link: '/locations' }
      }
    ],
    tagline: 'Join our community of purpose-driven leaders'
  },
  mission: {
    title: 'Our Mission',
    description: 'We are committed to building a network of fellowships that are spiritually, intellectually, and economically empowered to bring positive change.',
    missions: [
      {
        icon: 'Users',
        title: 'Win, Train, Transform',
        description: 'Win the lost at all cost, train them as ministers, transform and empower them into effective leaders.',
        points: [
          'Outreach programs to reach the unreached',
          'Comprehensive leadership training',
          'Spiritual and professional development'
        ]
      },
      {
        icon: 'Brain',
        title: 'Capacity Building',
        description: 'Promote capacity building for all leaders through education, mentorship, and practical experiences.',
        points: [
          'Skill development workshops',
          'Mentorship programs',
          'Educational resources'
        ]
      },
      {
        icon: 'Shield',
        title: 'Accountability & Integrity',
        description: 'Ensure strict accountability for leadership transparency and integrity in all aspects.',
        points: [
          'Financial transparency',
          'Ethical leadership training',
          'Accountability structures'
        ]
      }
    ]
  },
  features: {
    title: 'Everything You Need In One Place',
    description: 'Explore our wide range of services and resources designed to support your spiritual journey and leadership development.',
    features: [
      {
        icon: 'MapPin',
        title: 'WCA Centers & DCG Homes',
        description: 'Find fellowship centers and discipleship group homes near you with detailed information.',
        link: '/locations'
      },
      {
        icon: 'Calendar',
        title: 'Events Calendar',
        description: 'Stay updated with upcoming events, conferences, and gatherings across all locations.',
        link: '/events'
      },
      {
        icon: 'Film',
        title: 'Media & Sermons',
        description: 'Access our library of videos, sermons, and teachings to grow your spiritual life.',
        link: '/media'
      },
      {
        icon: 'BookOpen',
        title: 'Store & Library',
        description: 'Purchase books, resources, and materials or borrow from our extensive library.',
        link: '/store'
      },
      {
        icon: 'Heart',
        title: 'Counseling Services',
        description: 'Schedule appointments with our trained counselors for spiritual guidance.',
        link: '/counseling'
      },
      {
        icon: 'BarChart3',
        title: 'Fundraising Projects',
        description: 'Support and track our ongoing fundraising projects and initiatives.',
        link: '/fundraising'
      }
    ]
  },
  events: {
    title: 'Upcoming Events',
    description: 'Join us at our upcoming events and be part of our growing community.',
    events: [
      {
        id: '1',
        title: 'Leadership Conference 2023',
        date: 'December 15-17, 2023',
        location: 'Main Center, City',
        image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'
      },
      {
        id: '2',
        title: 'Youth Empowerment Workshop',
        date: 'January 5, 2024',
        location: 'East Branch, Downtown',
        image: 'https://images.unsplash.com/photo-1536337005238-94b997371b40?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80'
      },
      {
        id: '3',
        title: 'Community Outreach Program',
        date: 'January 20, 2024',
        location: 'Various Locations',
        image: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'
      }
    ]
  },
  testimonials: {
    title: 'Stories of Transformation',
    description: 'Hear from members of our community whose lives have been changed through our programs and fellowships.',
    testimonials: [
      {
        id: '1',
        quote: 'The leadership training I received at WCA transformed not just my career, but my entire approach to life and service.',
        author: 'Michael Johnson',
        role: 'Business Leader'
      },
      {
        id: '2',
        quote: 'Finding WCA was a turning point in my spiritual journey. The community here has become like family to me.',
        author: 'Sarah Williams',
        role: 'Community Member'
      },
      {
        id: '3',
        quote: 'The mentorship program equipped me with the tools I needed to make a real difference in my community.',
        author: 'David Chen',
        role: 'Social Entrepreneur'
      }
    ]
  },
  newsletter: {
    title: 'Stay Updated With WCA',
    description: 'Subscribe to our newsletter to receive updates about events, resources, and opportunities to get involved.',
    placeholder: 'Enter your email',
    buttonText: 'Subscribe',
    disclaimer: 'We respect your privacy. Unsubscribe at any time.'
  }
};

export default function HomepageSettings() {
  const { data: contentData, updateContent, isUpdating } = useHomepageContent();
  const { toast } = useToast();
  const [formData, setFormData] = useState<HomepageContentData>(defaultHomepageContent);
  const [uploadingSlides, setUploadingSlides] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (contentData?.content) {
      try {
        const content = contentData.content as unknown as HomepageContentData;
        setFormData(content);
      } catch (error) {
        console.error('Error setting homepage content:', error);
        setFormData(defaultHomepageContent);
      }
    }
  }, [contentData]);

  const handleSave = () => {
    updateContent(formData);
  };

  const addSlide = () => {
    const newSlide = {
      id: Date.now().toString(),
      image: '',
      title: '',
      subtitle: '',
      description: '',
      primaryButton: { text: 'Learn More', link: '/about' },
      secondaryButton: { text: 'Find a Location', link: '/locations' }
    };
    setFormData(prev => ({
      ...prev,
      hero: {
        ...prev.hero,
        slides: [...prev.hero.slides, newSlide]
      }
    }));
  };

  const removeSlide = (slideId: string) => {
    setFormData(prev => ({
      ...prev,
      hero: {
        ...prev.hero,
        slides: prev.hero.slides.filter(slide => slide.id !== slideId)
      }
    }));
  };

  const updateSlide = (slideId: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      hero: {
        ...prev.hero,
        slides: prev.hero.slides.map(slide =>
          slide.id === slideId ? { ...slide, [field]: value } : slide
        )
      }
    }));
  };

  const handleImageUpload = async (slideId: string, file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    setUploadingSlides(prev => ({ ...prev, [slideId]: true }));

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `homepage_slide_${slideId}_${Date.now()}.${fileExt}`;
      const filePath = `homepage/slides/${fileName}`;

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from('member-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('member-photos')
        .getPublicUrl(filePath);

      // Update slide image
      updateSlide(slideId, 'image', publicUrl);

      toast({
        title: "Success",
        description: "Image uploaded successfully!",
      });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingSlides(prev => ({ ...prev, [slideId]: false }));
    }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">
            Manage the content displayed on your homepage
          </p>
          <Button onClick={handleSave} disabled={isUpdating}>
            <Save className="w-4 h-4 mr-2" />
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        <Tabs defaultValue="hero" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="hero">Hero Section</TabsTrigger>
            <TabsTrigger value="mission">Mission</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
            <TabsTrigger value="newsletter">Newsletter</TabsTrigger>
          </TabsList>

          <TabsContent value="hero">
            <Card>
              <CardHeader>
                <CardTitle>Hero Section Carousel</CardTitle>
                <CardDescription>
                  Manage the hero section slides displayed at the top of your homepage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    value={formData.hero.tagline}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      hero: { ...prev.hero, tagline: e.target.value }
                    }))}
                    placeholder="Enter hero tagline"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Slides</h3>
                    <Button onClick={addSlide} variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Slide
                    </Button>
                  </div>

                  {formData.hero.slides.map((slide, index) => (
                    <Card key={slide.id}>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-base">Slide {index + 1}</CardTitle>
                          {formData.hero.slides.length > 1 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeSlide(slide.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label>Hero Image</Label>
                          <div className="space-y-3">
                            {slide.image && (
                              <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                                <img 
                                  src={slide.image} 
                                  alt="Current slide image"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleImageUpload(slide.id, file);
                                  }
                                }}
                                disabled={uploadingSlides[slide.id]}
                                className="hidden"
                                id={`image-upload-${slide.id}`}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => document.getElementById(`image-upload-${slide.id}`)?.click()}
                                disabled={uploadingSlides[slide.id]}
                              >
                                {uploadingSlides[slide.id] ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Uploading...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload Image
                                  </>
                                )}
                              </Button>
                              {slide.image && (
                                <span className="text-sm text-muted-foreground">
                                  Image uploaded successfully
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Title</Label>
                            <Input
                              value={slide.title}
                              onChange={(e) => updateSlide(slide.id, 'title', e.target.value)}
                              placeholder="Enter slide title"
                            />
                          </div>
                          <div>
                            <Label>Subtitle</Label>
                            <Input
                              value={slide.subtitle}
                              onChange={(e) => updateSlide(slide.id, 'subtitle', e.target.value)}
                              placeholder="Enter slide subtitle"
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={slide.description}
                            onChange={(e) => updateSlide(slide.id, 'description', e.target.value)}
                            placeholder="Enter slide description"
                            rows={3}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mission">
            <Card>
               <CardHeader>
                 <CardTitle>Mission Section</CardTitle>
                 <CardDescription>
                   Configure the mission section content. Note: The main heading "OUR MISSION" is fixed and cannot be changed here.
                 </CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                   <p className="text-sm text-blue-700 dark:text-blue-300">
                     <strong>Main Heading:</strong> "OUR MISSION" (Fixed heading that appears at the top of the section)
                   </p>
                 </div>
                 <div>
                   <Label>Section Title</Label>
                   <Input
                     value={formData.mission.title}
                     onChange={(e) => setFormData(prev => ({
                       ...prev,
                       mission: { ...prev.mission, title: e.target.value }
                     }))}
                     placeholder="Enter mission section title"
                   />
                 </div>
                <div>
                  <Label>Section Description</Label>
                  <Textarea
                    value={formData.mission.description}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      mission: { ...prev.mission, description: e.target.value }
                    }))}
                    placeholder="Enter mission section description"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features">
            <Card>
              <CardHeader>
                <CardTitle>Features Section</CardTitle>
                <CardDescription>
                  Configure the features section content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Section Title</Label>
                  <Input
                    value={formData.features.title}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      features: { ...prev.features, title: e.target.value }
                    }))}
                    placeholder="Enter features section title"
                  />
                </div>
                <div>
                  <Label>Section Description</Label>
                  <Textarea
                    value={formData.features.description}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      features: { ...prev.features, description: e.target.value }
                    }))}
                    placeholder="Enter features section description"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle>Events Section</CardTitle>
                <CardDescription>
                  Configure the events section content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Section Title</Label>
                  <Input
                    value={formData.events.title}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      events: { ...prev.events, title: e.target.value }
                    }))}
                    placeholder="Enter events section title"
                  />
                </div>
                <div>
                  <Label>Section Description</Label>
                  <Textarea
                    value={formData.events.description}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      events: { ...prev.events, description: e.target.value }
                    }))}
                    placeholder="Enter events section description"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="testimonials">
            <Card>
              <CardHeader>
                <CardTitle>Testimonials Section</CardTitle>
                <CardDescription>
                  Configure the testimonials section content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Section Title</Label>
                  <Input
                    value={formData.testimonials.title}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      testimonials: { ...prev.testimonials, title: e.target.value }
                    }))}
                    placeholder="Enter testimonials section title"
                  />
                </div>
                <div>
                  <Label>Section Description</Label>
                  <Textarea
                    value={formData.testimonials.description}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      testimonials: { ...prev.testimonials, description: e.target.value }
                    }))}
                    placeholder="Enter testimonials section description"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="newsletter">
            <Card>
              <CardHeader>
                <CardTitle>Newsletter Section</CardTitle>
                <CardDescription>
                  Configure the newsletter section content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Section Title</Label>
                  <Input
                    value={formData.newsletter.title}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      newsletter: { ...prev.newsletter, title: e.target.value }
                    }))}
                    placeholder="Enter newsletter section title"
                  />
                </div>
                <div>
                  <Label>Section Description</Label>
                  <Textarea
                    value={formData.newsletter.description}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      newsletter: { ...prev.newsletter, description: e.target.value }
                    }))}
                    placeholder="Enter newsletter section description"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Input Placeholder</Label>
                    <Input
                      value={formData.newsletter.placeholder}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        newsletter: { ...prev.newsletter, placeholder: e.target.value }
                      }))}
                      placeholder="Enter input placeholder"
                    />
                  </div>
                  <div>
                    <Label>Button Text</Label>
                    <Input
                      value={formData.newsletter.buttonText}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        newsletter: { ...prev.newsletter, buttonText: e.target.value }
                      }))}
                      placeholder="Enter button text"
                    />
                  </div>
                </div>
                <div>
                  <Label>Disclaimer Text</Label>
                  <Input
                    value={formData.newsletter.disclaimer}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      newsletter: { ...prev.newsletter, disclaimer: e.target.value }
                    }))}
                    placeholder="Enter disclaimer text"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SuperAdminLayout>
  );
}