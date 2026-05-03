import { z } from 'zod';

export const memberRegistrationSchema = z.object({
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
    .min(9, "Phone number must be at least 9 characters")
    .max(20, "Phone number must be less than 20 characters")
    .refine(
      (val) => (val.match(/\d/g) || []).length >= 9,
      "Phone number must contain at least 9 digits"
    ),
  
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
  
  
  ministry_interests: z.array(z.string()).optional(),
  
  has_completed_foundation_school: z.string().optional(),
  
  foundation_school_date: z.string().optional(),
  
  is_baptized: z.string().optional(),
  
  baptism_date: z.string().optional(),
  
  dcg_id: z.string().uuid("Please select a DCG"),
  
  relationships: z.array(z.object({
    relationship_type: z.string(),
    member_ids: z.array(z.string().uuid()),
  })).optional(),
});

export type MemberRegistrationFormData = z.infer<typeof memberRegistrationSchema>;
