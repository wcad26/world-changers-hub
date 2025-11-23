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
    .min(10, "Phone number must be at least 10 characters")
    .max(20, "Phone number must be less than 20 characters"),
  
  whatsapp_number: z.string()
    .trim()
    .min(10, "WhatsApp number must be at least 10 characters")
    .max(20, "WhatsApp number must be less than 20 characters")
    .optional(),
  
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
    .optional(),
  
  emergency_contact_name: z.string()
    .trim()
    .max(100, "Name must be less than 100 characters")
    .optional(),
  
  emergency_contact_phone: z.string()
    .trim()
    .min(10, "Phone must be at least 10 characters")
    .max(20, "Phone must be less than 20 characters")
    .optional(),
  
  is_baptized: z.boolean().optional(),
  
  baptism_date: z.string().optional(),
  
  ministry_interests: z.array(z.string()).optional(),
  
  skills_talents: z.string()
    .trim()
    .max(500, "Skills and talents must be less than 500 characters")
    .optional(),
  
  dcg_id: z.string().uuid().optional(),
}).refine((data) => {
  // If is_baptized is true, baptism_date should be provided
  if (data.is_baptized && !data.baptism_date) {
    return false;
  }
  return true;
}, {
  message: "Please provide your baptism date",
  path: ["baptism_date"]
});

export type MemberRegistrationFormData = z.infer<typeof memberRegistrationSchema>;
