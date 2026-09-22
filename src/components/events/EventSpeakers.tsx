import { useEventSpeakers } from "@/hooks/useEventSpeakers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Linkedin, Twitter, Globe, Users } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface EventSpeakersProps {
  eventId: string;
}

export function EventSpeakers({ eventId }: EventSpeakersProps) {
  const { data: speakers, isLoading } = useEventSpeakers(eventId);
  const { t, localizedField } = useLanguage();

  if (isLoading) {
    return (
      <section className="border-t border-event-border bg-event-background py-16">
        <div className="container-custom">
          <div className="text-center mb-12">
            <div className="h-10 w-48 bg-event-elevated animate-pulse rounded mx-auto mb-4" />
            <div className="h-6 w-72 bg-event-elevated animate-pulse rounded mx-auto" />
          </div>
        </div>
      </section>
    );
  }

  if (!speakers || speakers.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-event-border bg-event-surface py-16 md:py-20">
      <div className="container-custom">
        <div className="text-center mb-12 animate-fade-in-up">
          <h2 className="font-sora text-3xl font-bold text-event-foreground md:text-4xl">
            {t('meetSpeakers')}
          </h2>
          <p className="mt-3 text-event-muted max-w-2xl mx-auto">
            {t('meetSpeakers')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {speakers.map((speaker, index) => {
            const name = localizedField(speaker.name, speaker.name_fr);
            const title = localizedField(speaker.title, speaker.title_fr);
            const bio = localizedField(speaker.bio, speaker.bio_fr);
            
            return (
              <div
                key={speaker.id}
                className="rounded-lg border border-event-border bg-event-background p-6 transition-colors duration-300 hover:border-primary/60"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex flex-col items-center mb-4">
                  <Avatar className="w-28 h-28 mb-4 ring-2 ring-primary/40">
                    <AvatarImage src={speaker.photo_url} alt={name as string} />
                    <AvatarFallback className="event-gradient text-2xl text-primary-foreground">
                      {(name as string).split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <h3 className="font-sora text-xl font-bold text-center text-event-foreground mb-2">{name}</h3>
                  <Badge variant="outline" className="mb-3 border-event-border text-event-muted">
                    <Users className="h-3 w-3 mr-1" />
                    {title}
                  </Badge>
                </div>

                {bio && (
                  <p className="text-sm text-event-muted text-center mb-4 line-clamp-4">
                    {bio}
                  </p>
                )}

                <div className="flex justify-center gap-3">
                  {speaker.linkedin_url && (
                    <a
                      href={speaker.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full hover:bg-primary/10 transition-colors"
                    >
                      <Linkedin className="h-4 w-4 text-primary" />
                    </a>
                  )}
                  {speaker.twitter_url && (
                    <a
                      href={speaker.twitter_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full hover:bg-primary/10 transition-colors"
                    >
                      <Twitter className="h-4 w-4 text-primary" />
                    </a>
                  )}
                  {speaker.website_url && (
                    <a
                      href={speaker.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full hover:bg-primary/10 transition-colors"
                    >
                      <Globe className="h-4 w-4 text-primary" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
