
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { jwtLogin, register, getProfile } from "../lib/api";

interface AuthenticationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: {id: string, email: string, role: 'client' | 'admin'}) => void;
}

const AuthenticationModal = ({ isOpen, onClose, onLogin }: AuthenticationModalProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      await register({
        username: email,
        email,
        password,
      });
      // Immediately log in after registration
      const { access, refresh } = await jwtLogin(email, password);
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      const userData = await getProfile();
      onLogin({
        id: userData.id,
        email: userData.email,
        role: userData.role
      });
      toast({
        title: "Account Created",
        description: "Your account has been successfully created!",
      });
      setIsLoading(false);
      resetForm();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.detail || "Registration failed",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { access, refresh } = await jwtLogin(email, password);
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      // Fetch user profile with new token
      const userData = await getProfile();
      onLogin({
        id: userData.id,
        email: userData.email,
        role: userData.role
      });
      setIsLoading(false);
      resetForm();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.detail || "Login failed",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" style={{ fontFamily: 'Roboto, system-ui, sans-serif' }}>
        <DialogHeader>
          <DialogTitle>Access Your Account</DialogTitle>
          <DialogDescription>
            Sign in to your existing account or create a new one to get started.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white">
            <TabsTrigger value="login" className="data-[state=active]:text-gray-900 data-[state=active]:font-bold data-[state=inactive]:text-gray-400 data-[state=inactive]:font-normal bg-white focus-visible:ring-0 focus:ring-0 focus:outline-none">Login</TabsTrigger>
            <TabsTrigger value="signup" className="data-[state=active]:text-gray-900 data-[state=active]:font-bold data-[state=inactive]:text-gray-400 data-[state=inactive]:font-normal bg-white focus-visible:ring-0 focus:ring-0 focus:outline-none">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>
            <div className="text-sm text-gray-600 mt-4">
              <p>Demo accounts:</p>
              <p>• Client: client@emesa.com</p>
              <p>• Admin: admin@emesa.com</p>
            </div>
          </TabsContent>
          <TabsContent value="signup" className="space-y-4">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AuthenticationModal;
