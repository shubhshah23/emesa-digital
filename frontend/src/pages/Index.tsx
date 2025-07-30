
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileCheck, CreditCard, CheckCircle, XCircle, Settings, Users, Package, History, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ComponentRequirementsForm from "@/components/ComponentRequirementsForm";
import AuthenticationModal from "@/components/AuthenticationModal";
import AdminDashboard from "@/components/AdminDashboard";
import OrderHistory from "@/components/OrderHistory";
import OrderList from "../components/OrderList";
import OrderForm from "../components/OrderForm";
import Navbar from "@/components/Navbar";
import { getProfile, updateProfile } from "../lib/api";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [currentView, setCurrentView] = useState<'form' | 'history'>('form');
  const { toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token && !user) {
      getProfile()
        .then(setUser)
        .catch(() => setUser(null));
    }
    // eslint-disable-next-line
  }, []);

  const handleLogin = async (userData: any) => {
    try {
      // Fetch complete user profile from backend
      const completeUserData = await getProfile();
      setUser(completeUserData);
      setShowAuth(false);
      setCurrentView('history'); // Go to order history after login
      toast({
        title: "Login Successful",
        description: `Welcome back, ${completeUserData.email}!`,
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Fallback to basic user data if profile fetch fails
      setUser(userData);
      setShowAuth(false);
      setCurrentView('history'); // Go to order history after login
      toast({
        title: "Login Successful",
        description: `Welcome back, ${userData.email}!`,
      });
    }
  };

  const handleLogout = () => {
    // Remove tokens from storage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    console.log(localStorage.getItem('access_token'))
    console.log(localStorage.getItem('refresh_token'))
    setUser(null);
    setCurrentView('form');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    // Optionally, force a reload to ensure clean state
    // window.location.reload();
  };

  if (user?.role === 'admin') {
    return <AdminDashboard user={user} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 overflow-visible">
      {user === null && (
        <Navbar
          variant="landing"
          onLogin={() => setShowAuth(true)}
        />
      )}
      {user && user.role === 'admin' && (
        <Navbar
          variant="admin"
          onLogout={handleLogout}
        />
      )}
      {user && user.role !== 'admin' && (
        <Navbar
          variant="client"
          activeTab={currentView}
          onForm={() => setCurrentView('form')}
          onHistory={() => setCurrentView('history')}
          onLogout={handleLogout}
          userName={user.name || user.email || ''}
        />
      )}
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-32">
        {!user ? (
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Professional Custom Component Manufacturing
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Upload your CAD files, specify requirements, and get high-quality custom components 
              manufactured with precision and delivered on time.
            </p>
            
            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <Card className="border-gray-200 hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <Upload className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <CardTitle className="text-xl">Upload CAD Files</CardTitle>
                  <CardDescription>
                    Simply upload your STEP files and specify your requirements
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card className="border-gray-200 hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <Settings className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <CardTitle className="text-xl">Expert Review</CardTitle>
                  <CardDescription>
                    Our engineers manually review each project for feasibility
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card className="border-gray-200 hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <Package className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <CardTitle className="text-xl">Quality Manufacturing</CardTitle>
                  <CardDescription>
                    High-precision manufacturing with quality guarantees
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>

            <Button size="lg" onClick={() => setShowAuth(true)} className="bg-primary hover:bg-primary-dark">
              Get Started Today
            </Button>
          </div>
        ) : (
          <>
            {user && user.role !== 'admin' && currentView === 'history' ? (
              <OrderHistory user={user} onBack={() => setCurrentView('form')} />
            ) : null}
            {user && user.role !== 'admin' && currentView !== 'history' ? (
              <ComponentRequirementsForm 
                user={user} 
                onNavigateToHistory={() => setCurrentView('history')} 
              />
            ) : null}
          </>
        )}

        {/* Workflow Section - Only show if not logged in */}
        {!user && (
          <div className="mt-16">
            <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Our Simple 4-Step Process
            </h3>
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-gray-500" />
                </div>
                <h4 className="text-lg font-semibold mb-2">1. Sign Up</h4>
                <p className="text-gray-600">Create your account with email and password</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-8 w-8 text-gray-500" />
                </div>
                <h4 className="text-lg font-semibold mb-2">2. Submit Requirements</h4>
                <p className="text-gray-600">Upload STEP files and specify your needs</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="h-8 w-8 text-gray-500" />
                </div>
                <h4 className="text-lg font-semibold mb-2">3. Secure Payment</h4>
                <p className="text-gray-600">Authorize payment (charged only after approval)</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-gray-500" />
                </div>
                <h4 className="text-lg font-semibold mb-2">4. Expert Review</h4>
                <p className="text-gray-600">Manual review and manufacturing approval</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-600 text-sm">
              © 2025 Emesa Digital. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <AuthenticationModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onLogin={handleLogin}
      />
    </div>
  );
};

export default Index;
