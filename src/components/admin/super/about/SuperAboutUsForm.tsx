import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGlobalContent, GlobalContentData } from '@/hooks/useGlobalContent';
import { Plus, Trash2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const globalContentSchema = z.object({
  hero: z.object({
    slides: z.array(z.object({
      id: z.string(),
      image: z.string().min(1, "Image is required"),
      title: z.string().min(1, "Title is required"),
      subtitle: z.string().min(1, "Subtitle is required"),
      description: z.string().min(1, "Description is required"),
    })).min(1, "At least one slide is required"),
    mission_points: z.array(z.string().min(1, "Mission point cannot be empty")).min(1, "At least one mission point is required"),
  }),
  values: z.array(z.object({
    icon: z.string().min(1, 'Icon is required'),
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
  })),
  milestones: z.array(z.object({
    year: z.string().min(1, 'Year is required'),
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
  })),
  team: z.array(z.object({
    name: z.string().min(1, 'Name is required'),
    role: z.string().min(1, 'Role is required'),
    image: z.string().min(1, 'Image is required'),
    bio: z.string().min(1, 'Bio is required'),
  })),
  cta: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
  }),
});

const SuperAboutUsForm = () => {
  const { data, isLoading, updateContent, isUpdating } = useGlobalContent();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const form = useForm<GlobalContentData>({
    defaultValues: {
      hero: {
        slides: [{
          id: "1",
          image: "",
          title: "",
          subtitle: "",
          description: "",
        }],
        mission_points: [""],
      },
      values: [{ icon: '', title: '', description: '' }],
      milestones: [{ year: '', title: '', description: '' }],
      team: [{ name: '', role: '', image: '', bio: '' }],
      cta: { title: '', description: '' },
    },
  });

  // Field arrays for dynamic sections
  const { fields: slidesFields, append: appendSlide, remove: removeSlide } = useFieldArray({
    control: form.control,
    name: "hero.slides"
  });


  const { fields: valuesFields, append: appendValue, remove: removeValue } = useFieldArray({
    control: form.control,
    name: "values"
  });

  const { fields: milestonesFields, append: appendMilestone, remove: removeMilestone } = useFieldArray({
    control: form.control,
    name: "milestones"
  });

  const { fields: teamFields, append: appendTeam, remove: removeTeam } = useFieldArray({
    control: form.control,
    name: "team"
  });

  useEffect(() => {
    if (data?.content) {
      const content = data.content as any as GlobalContentData;
      if (!content.hero?.slides || content.hero.slides.length === 0) {
        content.hero = {
          ...content.hero,
          slides: [{
            id: "1",
            image: "",
            title: "",
            subtitle: "",
            description: "",
          }]
        };
      }
      form.reset(content);
    }
  }, [data, form]);

  const handleHeroImageUpload = async (file: File, slideIndex: number) => {
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `hero-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('about-hero-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('about-hero-images')
        .getPublicUrl(filePath);

      const currentSlides = form.getValues("hero.slides");
      currentSlides[slideIndex].image = publicUrl;
      form.setValue("hero.slides", currentSlides);

      toast({
        title: "Success",
        description: "Hero image uploaded successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload hero image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = async (file: File, teamIndex: number) => {
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `team-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('member-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('member-photos')
        .getPublicUrl(filePath);

      const currentTeam = form.getValues("team");
      currentTeam[teamIndex].image = publicUrl;
      form.setValue("team", currentTeam);

      toast({
        title: "Success",
        description: "Team member image uploaded successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: GlobalContentData) => {
    updateContent(data);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="hero" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="hero">Hero Section</TabsTrigger>
            <TabsTrigger value="values">Values</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="cta">Call to Action</TabsTrigger>
          </TabsList>

          <TabsContent value="hero" className="space-y-6">
            <div className="space-y-4">
              <FormLabel>Hero Slides</FormLabel>
              {slidesFields.map((field, index) => (
                <div key={field.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Slide {index + 1}</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeSlide(index)}
                      disabled={slidesFields.length === 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <FormField
                    control={form.control}
                    name={`hero.slides.${index}.image`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slide Image</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleHeroImageUpload(file, index);
                              }}
                              disabled={uploading}
                            />
                            {field.value && (
                              <img 
                                src={field.value} 
                                alt={`Slide ${index + 1}`}
                                className="h-32 w-full object-cover rounded border"
                              />
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`hero.slides.${index}.subtitle`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subtitle</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter slide subtitle" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`hero.slides.${index}.title`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter slide title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`hero.slides.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter slide description" 
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={() => appendSlide({
                  id: `slide-${Date.now()}`,
                  image: "",
                  title: "",
                  subtitle: "",
                  description: "",
                })}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Slide
              </Button>
            </div>

            <div className="space-y-4">
              <FormLabel>Mission Points</FormLabel>
              {form.watch('hero.mission_points')?.map((_, index) => (
                <div key={index} className="flex gap-2">
                  <FormField
                    control={form.control}
                    name={`hero.mission_points.${index}`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="Enter mission point" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const points = form.getValues('hero.mission_points');
                      points.splice(index, 1);
                      form.setValue('hero.mission_points', points);
                    }}
                    disabled={form.watch('hero.mission_points')?.length === 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const points = form.getValues('hero.mission_points') || [];
                  form.setValue('hero.mission_points', [...points, ""]);
                }}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Mission Point
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="values" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Values Section</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {valuesFields.map((field, index) => (
                  <Card key={field.id}>
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Value {index + 1}</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeValue(index)}
                          disabled={valuesFields.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name={`values.${index}.icon`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Icon (Lucide name)</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Heart, Users, etc." />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`values.${index}.title`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`values.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea {...field} rows={2} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => appendValue({ icon: '', title: '', description: '' })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Value
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="milestones" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Timeline Milestones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {milestonesFields.map((field, index) => (
                  <Card key={field.id}>
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Milestone {index + 1}</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeMilestone(index)}
                          disabled={milestonesFields.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name={`milestones.${index}.year`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Year</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="2024" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`milestones.${index}.title`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`milestones.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea {...field} rows={2} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => appendMilestone({ year: '', title: '', description: '' })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Milestone
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Leadership Team</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {teamFields.map((field, index) => (
                  <Card key={field.id}>
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Team Member {index + 1}</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeTeam(index)}
                          disabled={teamFields.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`team.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`team.${index}.role`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Role</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name={`team.${index}.image`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Profile Image</FormLabel>
                            <FormControl>
                              <div className="space-y-2">
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleImageUpload(file, index);
                                  }}
                                  disabled={uploading}
                                />
                                {field.value && (
                                  <img 
                                    src={field.value} 
                                    alt="Team member"
                                    className="h-32 w-32 object-cover rounded border"
                                  />
                                )}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`team.${index}.bio`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bio</FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={3} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => appendTeam({ name: '', role: '', image: '', bio: '' })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Team Member
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cta" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Call to Action Section</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="cta.title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cta.description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button type="submit" disabled={isUpdating || uploading}>
            {isUpdating ? "Updating..." : uploading ? "Uploading..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default SuperAboutUsForm;