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
    .trim()
    .min(2, "Occupation must be at least 2 characters")
    .max(100, "Occupation must be less than 100 characters")
    .transform((val) => val === '' ? undefined : val)
    .optional(),
  
  emergency_contact_name: z.string()
    .trim()
    .max(100, "Name must be less than 100 characters")
    .transform((val) => val === '' ? undefined : val)
    .optional(),
  
  emergency_contact_phone: z.string()
    .trim()
    .min(6, "Phone must be at least 6 characters")
    .max(20, "Phone must be less than 20 characters")
    .transform((val) => val === '' ? undefined : val)
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
  
  referral_person_name: z.string()
    .trim()
    .max(100, "Name must be less than 100 characters")
    .transform((val) => val === '' ? undefined : val)
    .optional(),
  
  referral_other_details: z.string()
    .trim()
    .max(200, "Details must be less than 200 characters")
    .transform((val) => val === '' ? undefined : val)
    .optional()
}).refine((data) => {
  // If referral_source is "invited_by", referral_person_name is required
  if (data.referral_source === "invited_by" && !data.referral_person_name) {
    return false;
  }
  return true;
}, {
  message: "Please provide the name of the person who invited you",
  path: ["referral_person_name"]
}).refine((data) => {
  // If referral_source is "other", referral_other_details is required
  if (data.referral_source === "other" && !data.referral_other_details) {
    return false;
  }
  return true;
}, {
  message: "Please provide details about how you heard about us",
  path: ["referral_other_details"]
});

export type VisitorRegistrationFormData = z.infer<typeof visitorRegistrationSchema>;