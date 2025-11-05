import { useEventSpeakers } from "@/hooks/useEventSpeakers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Linkedin, Twitter, Globe, Users } from "lucide-react";

interface EventSpeakersProps {
  eventId: string;
}

export function EventSpeakers({ eventId }: EventSpeakersProps) {
  const { data: speakers, isLoading } = useEventSpeakers(eventId);

  if (isLoading) {
    return (
      <section className="py-20 bg-background">
        <div className="container-custom">
          <div className="text-center mb-12">
            <div className="h-10 w-48 bg-muted animate-pulse rounded mx-auto mb-4" />
            <div className="h-6 w-96 bg-muted animate-pulse rounded mx-auto" />
          </div>
        </div>
      </section>
    );
  }

  if (!speakers || speakers.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/20">
      <div className="container-custom">
        <div className="text-center mb-12 animate-fade-in-up">
          <h2 className="text-fluid-3xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Meet Our Speakers
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Learn from industry experts and thought leaders
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {speakers.map((speaker, index) => (
            <div
              key={speaker.id}
              className="glass-panel-soft p-6 hover:scale-105 transition-all duration-300 animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex flex-col items-center mb-4">
                <Avatar className="w-32 h-32 mb-4 ring-4 ring-primary/20">
                  <AvatarImage src={speaker.photo_url} alt={speaker.name} />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground">
                    {speaker.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                
                <h3 className="text-xl font-bold text-center mb-2">{speaker.name}</h3>
                <Badge variant="outline" className="mb-3">
                  <Users className="h-3 w-3 mr-1" />
                  {speaker.title}
                </Badge>
              </div>

              {speaker.bio && (
                <p className="text-sm text-muted-foreground text-center mb-4 line-clamp-4">
                  {speaker.bio}
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
          ))}
        </div>
      </div>
    </section>
  );
}
