import { 
  Users, Target, Shield, Award, Check, Heart, Star, Globe, 
  Zap, Book, Trophy, Lightbulb, Handshake, MapPin, Phone,
  Mail, Calendar, Clock, ArrowRight, MessageCircle, Laptop,
  Coffee, Camera, Music, Palette, Code, Briefcase, GraduationCap
} from 'lucide-react';

export const iconMapping: Record<string, React.ComponentType<any>> = {
  Users,
  Target,
  Shield,
  Award,
  Check,
  Heart,
  Star,
  Globe,
  Zap,
  Book,
  Trophy,
  Lightbulb,
  Handshake,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Clock,
  ArrowRight,
  MessageCircle,
  Laptop,
  Coffee,
  Camera,
  Music,
  Palette,
  Code,
  Briefcase,
  GraduationCap
};

export const renderIcon = (iconName: string, className?: string) => {
  const IconComponent = iconMapping[iconName];
  if (!IconComponent) {
    // Fallback to Users icon if the specified icon is not found
    return <Users className={className} />;
  }
  return <IconComponent className={className} />;
};