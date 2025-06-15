
import * as z from 'zod';

export const communicationFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  messageType: z.string().min(1, 'Message type is required'),
  content: z.string().min(1, 'Content is required'),
  audience: z.string().min(1, 'Audience is required'),
  channels: z.array(z.string()).min(1, 'At least one channel is required'),
  sendNow: z.boolean().default(true),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().optional(),
});

export type CommunicationFormValues = z.infer<typeof communicationFormSchema>;

export const superAdminCommunicationFormSchema = communicationFormSchema.extend({
  targetRegionIds: z.array(z.string()).min(1, 'At least one region is required'),
}).refine(data => {
    if (!data.sendNow) {
        return !!data.scheduledDate && !!data.scheduledTime;
    }
    return true;
}, {
    message: 'Scheduled date and time are required for scheduled sending',
    path: ['scheduledDate'],
});

export type SuperAdminCommunicationFormSchema = z.infer<typeof superAdminCommunicationFormSchema>;
