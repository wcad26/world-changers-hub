import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Youtube, MapPin, Mail, Phone } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { t } = useLanguage();
  return <footer className="bg-gray-50 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800">
      <div className="container-custom py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          <div className="space-y-4">
            <Link to="/" className="inline-block">
              <img src="/lovable-uploads/366be6c2-b04b-4b05-a73a-cff2d9452c69.png" alt="World Changers Association" className="w-full md:h-24 md:w-auto" />
            </Link>
            <p className="text-gray-600 dark:text-gray-400 max-w-md">
              {t('footerMission')}
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-600 hover:text-wca-purple dark:text-gray-400 dark:hover:text-wca-teal transition-colors" aria-label="Facebook">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-600 hover:text-wca-purple dark:text-gray-400 dark:hover:text-wca-teal transition-colors" aria-label="Twitter">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-600 hover:text-wca-purple dark:text-gray-400 dark:hover:text-wca-teal transition-colors" aria-label="Instagram">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-gray-600 hover:text-wca-purple dark:text-gray-400 dark:hover:text-wca-teal transition-colors" aria-label="YouTube">
                <Youtube size={20} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-lg mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="text-gray-600 hover:text-wca-purple dark:text-gray-400 dark:hover:text-wca-teal transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/locations" className="text-gray-600 hover:text-wca-purple dark:text-gray-400 dark:hover:text-wca-teal transition-colors">
                  Our Locations
                </Link>
              </li>
              <li>
                <Link to="/events" className="text-gray-600 hover:text-wca-purple dark:text-gray-400 dark:hover:text-wca-teal transition-colors">
                  Events
                </Link>
              </li>
              <li>
                <Link to="/media" className="text-gray-600 hover:text-wca-purple dark:text-gray-400 dark:hover:text-wca-teal transition-colors">
                  Media & Sermons
                </Link>
              </li>
              <li>
                <Link to="/store" className="text-gray-600 hover:text-wca-purple dark:text-gray-400 dark:hover:text-wca-teal transition-colors">
                  Store/Library
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-lg mb-4">Resources</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/blog" className="text-gray-600 hover:text-wca-purple dark:text-gray-400 dark:hover:text-wca-teal transition-colors">
                  News & Blog
                </Link>
              </li>
              <li>
                <Link to="/counseling" className="text-gray-600 hover:text-wca-purple dark:text-gray-400 dark:hover:text-wca-teal transition-colors">
                  Counseling
                </Link>
              </li>
              <li>
                <Link to="/fundraising" className="text-gray-600 hover:text-wca-purple dark:text-gray-400 dark:hover:text-wca-teal transition-colors">
                  Fundraising Projects
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-600 hover:text-wca-purple dark:text-gray-400 dark:hover:text-wca-teal transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-600 hover:text-wca-purple dark:text-gray-400 dark:hover:text-wca-teal transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-lg mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <MapPin size={18} className="mr-2 mt-0.5 text-wca-purple" />
                <span className="text-gray-600 dark:text-gray-400">Jardin Logbaba, Douala, Cameroon</span>
              </li>
              <li className="flex items-center">
                <Mail size={18} className="mr-2 text-wca-purple" />
                <a href="mailto:info@wcaglobal.org" className="text-gray-600 hover:text-wca-purple dark:text-gray-400 dark:hover:text-wca-teal transition-colors">
                  info@wcaglobal.org
                </a>
              </li>
              <li className="flex items-center">
                <Phone size={18} className="mr-2 text-wca-purple" />
                <a href="tel:+23767568130" className="text-gray-600 hover:text-wca-purple dark:text-gray-400 dark:hover:text-wca-teal transition-colors">+237 690 63 48 60</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 mt-12 pt-8 flex justify-center items-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            © {currentYear} World Changers Association.
          </p>
        </div>
      </div>
    </footer>;
}