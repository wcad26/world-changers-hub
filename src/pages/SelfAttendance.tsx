import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, AlertCircle, Loader2, Calendar, MapPin, UserCheck } from "lucide-react";
import { z } from "zod";
import { format } from "date-fns";

const emailSchema = z.string().trim().email("Please enter a valid email address").max(255);

const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

const SelfAttendance: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [event, setEvent] = useState<any>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [emailError, setEmailError] = useState("");

  useEffect(() => {
    if (!eventId) return;
    const fetchEvent = async () => {
      setLoadingEvent(true);
      
      let query;
      if (isUUID(eventId)) {
        query = supabase
          .from('events')
          .select('id, name, start_datetime, end_datetime, location_name, address')
          .eq('id', eventId)
          .single();
      } else {
        // Try slug lookup
        query = supabase
          .from('events')
          .select('id, name, start_datetime, end_datetime, location_name, address')
          .eq('slug', eventId)
          .single();
      }

      const { data, error } = await query;

      if (error || !data) {
        // If slug failed, try slug history
        if (!isUUID(eventId)) {
          const { data: historyEntry } = await supabase
            .from('event_slug_history')
            .select('event_id')
            .eq('old_slug', eventId)
            .maybeSingle();
          
          if (historyEntry) {
            const { data: historicalEvent } = await supabase
              .from('events')
              .select('id, name, start_datetime, end_datetime, location_name, address')
              .eq('id', historyEntry.event_id)
              .single();
            
            if (historicalEvent) {
              setEvent(historicalEvent);
              setLoadingEvent(false);
              return;
            }
          }
        }
        setEvent(null);
      } else {
        setEvent(data);
      }
      setLoadingEvent(false);
    };
    fetchEvent();
  }, [eventId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    setResult(null);

    const validation = emailSchema.safeParse(email);
    if (!validation.success) {
      setEmailError(validation.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('self-attendance', {
        body: { event_id: event.id, email: validation.data },
      });

      if (error) {
        setResult({ success: false, message: error.message || "An error occurred. Please try again." });
      } else if (data?.error) {
        setResult({ success: false, message: data.error });
      } else {
        setResult({ success: true, message: data?.message || "Attendance marked successfully!" });
      }
    } catch (err: any) {
      setResult({ success: false, message: err.message || "Network error. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingEvent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Event Not Found</h2>
            <p className="text-muted-foreground">This event does not exist or the link is invalid.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit mb-2">
            <UserCheck className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-xl">{event.name}</CardTitle>
          <CardDescription className="space-y-1">
            <div className="flex items-center justify-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{format(new Date(event.start_datetime), 'MMMM d, yyyy • h:mm a')}</span>
            </div>
            {event.location_name && (
              <div className="flex items-center justify-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                <span>{event.location_name}</span>
              </div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result?.success ? (
            <Alert className="border-primary/20 bg-primary/5">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <AlertTitle className="text-primary">Attendance Confirmed!</AlertTitle>
              <AlertDescription className="text-muted-foreground">{result.message}</AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Your Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter the email registered with WCA"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                  disabled={isSubmitting}
                  autoFocus
                />
                {emailError && <p className="text-sm text-destructive">{emailError}</p>}
                <p className="text-xs text-muted-foreground">
                  Use the email address you registered with. Only registered members and visitors can mark attendance.
                </p>
              </div>

              {result && !result.success && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{result.message}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting || !email.trim()}>
                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Marking Attendance...</> : "Mark My Attendance"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SelfAttendance;
