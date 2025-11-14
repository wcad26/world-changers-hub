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
    .min(10, "Phone number must be at least 10 characters")
    .max(20, "Phone number must be less than 20 characters"),
  
  address: z.string()
    .trim()
    .min(10, "Address must be at least 10 characters")
    .max(200, "Address must be less than 200 characters")
});

export type VisitorRegistrationFormData = z.infer<typeof visitorRegistrationSchema>;