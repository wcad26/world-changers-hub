import { z } from 'zod';

export const visitorRegistrationSchema = z.object({
  first_name: z.string()
    .trim()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be less than 50 characters"),
  
  last_name: z.string()
    .trim()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be less than 50 characters"),
  
  email: z.string()
    .trim()
    .email("Please enter a valid email address")
    .max(255, "Email must be less than 255 characters"),
  
  phone: z.string()
    .trim()
    .min(6, "Phone number must be at least 6 characters")
    .max(20, "Phone number must be less than 20 characters"),
  
  address: z.string()
    .trim()
    .min(10, "Address must be at least 10 characters")
    .max(200, "Address must be less than 200 characters"),
  
  date_of_birth: z.string()
    .optional(),
  
  gender: z.string()
    .optional(),
  
  occupation: z.string()
    .optional(),
  
  rated_event_id: z.string().uuid().optional(),
  
  event_satisfaction_rating: z.number()
    .int()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5")
    .optional(),
  
  referral_source: z.string()
    .trim()
    .optional(),

  referral_social_media: z.string()
    .trim()
    .optional(),
  
  referral_member_ids: z.array(z.string().uuid()).optional(),

  referral_relationship_type: z.enum(['spouse', 'parent', 'child', 'sibling', 'guardian', 'other']).optional(),
  
  referral_other_details: z.string()
    .trim()
    .max(200, "Details must be less than 200 characters")
    .transform((val) => val === '' ? undefined : val)
    .optional(),
  
  join_interest: z.enum(['yes', 'no', 'undecided']).optional(),
}).refine((data) => {
  if (data.referral_source === "invited_by" && (!data.referral_member_ids || data.referral_member_ids.length === 0)) {
    return false;
  }
  return true;
}, {
  message: "Please select at least one person who invited you",
  path: ["referral_member_ids"]
}).refine((data) => {
  if (data.referral_source === "invited_by" && !data.referral_relationship_type) {
    return false;
  }
  return true;
}, {
  message: "Please select a relationship type",
  path: ["referral_relationship_type"]
}).refine((data) => {
  if (data.referral_source === "other" && !data.referral_other_details) {
    return false;
  }
  return true;
}, {
  message: "Please provide details about how you heard about us",
  path: ["referral_other_details"]
}).refine((data) => {
  if (data.referral_source === "social_media" && !data.referral_social_media) {
    return false;
  }
  return true;
}, {
  message: "Please select a social media platform",
  path: ["referral_social_media"]
});

export type VisitorRegistrationFormData = z.infer<typeof visitorRegistrationSchema>;
