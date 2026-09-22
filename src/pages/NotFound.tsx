
import { useLocation, Link } from "@/lib/router-compat";
import { useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center py-20">
        <div className="container-custom">
          <div className="max-w-md mx-auto text-center">
            <h1 className="text-7xl md:text-9xl font-bold text-gradient bg-gradient-to-r from-wca-purple to-wca-violet bg-clip-text text-transparent mb-4">
              404
            </h1>
            <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <Link to="/" className="button-primary inline-flex items-center">
              <Home size={18} className="mr-2" />
              Return to Home
            </Link>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default NotFound;
