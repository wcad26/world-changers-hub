-- Insert default homepage content
INSERT INTO public.global_content (page_type, content, created_by) VALUES (
  'homepage',
  '{
    "hero": {
      "slides": [
        {
          "id": "1",
          "image": "/public/lovable-uploads/366be6c2-b04b-4b05-a73a-cff2d9452c69.png",
          "title": "Welcome to World Christian Assembly",
          "subtitle": "Building Tomorrow''s Leaders Today",
          "description": "Empowering communities through spiritual growth, leadership development, and transformative service worldwide.",
          "primaryButton": { "text": "Learn More", "link": "/about" },
          "secondaryButton": { "text": "Find a Location", "link": "/locations" }
        }
      ],
      "tagline": "Join our community of purpose-driven leaders"
    },
    "mission": {
      "title": "Our Mission",
      "description": "We are committed to building a network of fellowships that are spiritually, intellectually, and economically empowered to bring positive change.",
      "missions": [
        {
          "icon": "Users",
          "title": "Win, Train, Transform",
          "description": "Win the lost at all cost, train them as ministers, transform and empower them into effective leaders.",
          "points": [
            "Outreach programs to reach the unreached",
            "Comprehensive leadership training",
            "Spiritual and professional development"
          ]
        },
        {
          "icon": "Brain",
          "title": "Capacity Building",
          "description": "Promote capacity building for all leaders through education, mentorship, and practical experiences.",
          "points": [
            "Skill development workshops",
            "Mentorship programs",
            "Educational resources"
          ]
        },
        {
          "icon": "Shield",
          "title": "Accountability & Integrity",
          "description": "Ensure strict accountability for leadership transparency and integrity in all aspects.",
          "points": [
            "Financial transparency",
            "Ethical leadership training",
            "Accountability structures"
          ]
        }
      ]
    },
    "features": {
      "title": "Everything You Need In One Place",
      "description": "Explore our wide range of services and resources designed to support your spiritual journey and leadership development.",
      "features": [
        {
          "icon": "MapPin",
          "title": "WCA Centers & DCG Homes",
          "description": "Find fellowship centers and discipleship group homes near you with detailed information.",
          "link": "/locations"
        },
        {
          "icon": "Calendar",
          "title": "Events Calendar",
          "description": "Stay updated with upcoming events, conferences, and gatherings across all locations.",
          "link": "/events"
        },
        {
          "icon": "Film",
          "title": "Media & Sermons",
          "description": "Access our library of videos, sermons, and teachings to grow your spiritual life.",
          "link": "/media"
        }
      ]
    },
    "events": {
      "title": "Upcoming Events",
      "description": "Join us at our upcoming events and be part of our growing community.",
      "events": []
    },
    "testimonials": {
      "title": "Stories of Transformation",
      "description": "Hear from members of our community whose lives have been changed through our programs and fellowships.",
      "testimonials": []
    },
    "newsletter": {
      "title": "Stay Updated With WCA",
      "description": "Subscribe to our newsletter to receive updates about events, resources, and opportunities to get involved.",
      "placeholder": "Enter your email",
      "buttonText": "Subscribe",
      "disclaimer": "We respect your privacy. Unsubscribe at any time."
    }
  }'::jsonb,
  NULL
) ON CONFLICT (page_type) DO NOTHING;