import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../Context/AuthContext';
import { Loader2, Phone } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { toast } from "sonner";
import logo from "../../assets/General Policy (5).png"
import SiteSelectionDialog from './SiteSelectionDialog';

// interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
//   children: React.ReactNode;
// }

const LoginPage1: React.FC = () => {
  // States for phone and OTP
  const [phone, setPhone] = useState<string>('');
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [isLoadingOTP, setIsLoadingOTP] = useState<boolean>(false);
  const [isLoadingLogin, setIsLoadingLogin] = useState<boolean>(false);
  const [resendTimeout, setResendTimeout] = useState<number>(0);
  const [showSiteSelection, setShowSiteSelection] = useState<boolean>(false);
  // const [countryCode, setCountryCode] = useState<string>('+91'); // Default to India, can be changed
  
  // References for OTP input fields
  const otpRefs = useRef<React.RefObject<HTMLInputElement>[]>([]);
  otpRefs.current = Array(6).fill(0).map((_, i) => otpRefs.current[i] || React.createRef<HTMLInputElement>());
  
  const { sendOTP, verifyOTP, setUserSites } = useAuth();

  // Handle resend timeout countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendTimeout > 0) {
      timer = setTimeout(() => setResendTimeout(resendTimeout - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimeout]);

  // Validate phone number (basic validation)
  const isValidPhone = (): boolean => {
    const phonePattern = /^\d{10}$/;
    return phonePattern.test(phone);
  };

  // Handle phone number input changes
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length <= 10) {
      setPhone(value);
    }
  };

  // Handle requesting OTP
  const handleRequestOTP = async (): Promise<void> => {
    if (!isValidPhone()) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoadingOTP(true);
    const loadingToast = toast.loading('Sending OTP...');
    
    try {
        // Call the actual sendOTP service with the full phone number
        await sendOTP(phone);
        
        setOtpSent(true);
        setResendTimeout(30); // 30 second countdown
        setOtp(['', '', '', '', '', ''])
        
        toast.dismiss(loadingToast);
        toast.success('OTP sent successfully!');
        
        // Focus the first OTP input field
        setTimeout(() => {
          if (otpRefs.current[0] && otpRefs.current[0].current) {
            otpRefs.current[0].current.focus();
          }
        }, 100);
        
    } catch (error: unknown) {
      toast.dismiss(loadingToast);
      
      // Handle different types of errors
      if (error instanceof Error) {
        // Check if it's a network error or API error
        if (error.message.includes('Failed to fetch') || error.message.includes('Network Error')) {
          toast.error('Network error. Please check your connection and try again.');
        } else if (error.message.includes('not registered') || error.message.includes('Phone number')) {
          toast.error(error.message);
        } else {
          toast.error(error.message || 'Failed to send OTP. Please try again.');
        }
      } else {
        toast.error('Failed to send OTP. Please try again.');
      }
      
      console.error('OTP sending failed:', error);
  } finally {
        setIsLoadingOTP(false);
    }
  };

  // Handle OTP digit input
  const handleOtpChange = (index: number, value: string): void => {
    if (value.length > 1) {
      // Handle paste event
      const pastedValue = value.slice(0, 6);
      const newOtp = [...otp];
      
      for (let i = 0; i < pastedValue.length; i++) {
        if (i + index < 6) {
          newOtp[i + index] = pastedValue[i];
        }
      }
      
      setOtp(newOtp);
      
      // Focus the appropriate field
      const focusIndex = Math.min(index + pastedValue.length, 5);
      if (otpRefs.current[focusIndex] && otpRefs.current[focusIndex].current) {
        otpRefs.current[focusIndex].current.focus();
      }
      
    } else {
      // Handle single digit input
      const newOtp = [...otp];
      newOtp[index] = value.replace(/\D/g, ''); // Allow only digits
      setOtp(newOtp);
      
      // Auto-focus next input if current input is filled
      if (value && index < 5) {
        if (otpRefs.current[index + 1] && otpRefs.current[index + 1].current) {
          otpRefs.current[index + 1].current.focus();
        }
      }
    }
  };

  // Handle backspace in OTP input
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // If current field is empty and backspace is pressed, focus the previous field
      if (otpRefs.current[index - 1] && otpRefs.current[index - 1].current) {
        otpRefs.current[index - 1].current.focus();
      }
    }
  };

  // Handle login with OTP
  const handleLogin = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    const enteredOtp = otp.join('');
    if (enteredOtp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }
    
    setIsLoadingLogin(true);
    const loadingToast = toast.loading('Verifying OTP...');
    
    try {
      // Call the actual verifyOTP service
      await verifyOTP(phone, enteredOtp);
      
      toast.dismiss(loadingToast);
      toast.success('OTP verified!');
      
      // Show site selection dialog
      setShowSiteSelection(true);
      
    } catch (error: unknown) {
      toast.dismiss(loadingToast);
      
      // Handle different types of errors
      if (error instanceof Error) {
        // Check if it's a network error or API error
        if (error.message.includes('Failed to fetch') || error.message.includes('Network Error')) {
          toast.error('Network error. Please check your connection and try again.');
        } else if (error.message.includes('OTP') || error.message.includes('Invalid') || error.message.includes('expired')) {
          toast.error(error.message);
        } else {
          toast.error('Invalid OTP. Please try again.');
        }
      } else {
        toast.error('Invalid OTP. Please try again.');
      }
      
      console.error('Login failed:', error);
    } finally {
      setIsLoadingLogin(false);
    }
  };

  const handleSitesSelected = async (selectedSites: string[]) => {
    try {
      await setUserSites(selectedSites);
      toast.success('Login successful! Redirecting...');
    } catch (error) {
      console.error('Failed to set user sites:', error);
      toast.error('Failed to set user sites. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white">
        {/* Logo container - added at the top center of the card */}
        <div className="flex justify-center mt-6">
          <img 
            src={logo} 
            alt="Company Logo" 
            className="h-18 w-auto" 
            // You can adjust the height (h-16) as needed
          />
        </div>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
          <CardDescription>
            {otpSent 
              ? 'Enter the OTP sent to your mobile number'
              : 'Enter your mobile number to receive an OTP'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {!otpSent ? (
              // Phone number input
              <div className="space-y-2">
                <Label htmlFor="phone">Mobile Number</Label>
                <div className="flex">
                <div className="relative w-20 flex items-center justify-center h-10 rounded-l-md bg-gray-100">
                  <span className="text-sm font-medium text-gray-700">+91</span>
                </div>
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="10-digit mobile number"
                      value={phone}
                      onChange={handlePhoneChange}
                      className="pl-10 rounded-l-none"
                      required
                    />
                  </div>
                </div>
              </div>
            ) : (
              // OTP input
              <div className="space-y-4">
                <Label htmlFor="otp">Enter 6-digit OTP</Label>
                <div className="flex justify-between space-x-2">
                  {Array(6).fill(0).map((_, index) => (
                    <Input
                      key={index}
                      ref={otpRefs.current[index]}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      className="w-12 h-12 text-center text-lg border-gray-200 focus-visible:1 focus-visible:border-gray-300"
                      value={otp[index]}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      required
                    />
                  ))}
                </div>
                
                <div className="pt-2 text-center">
                  {resendTimeout > 0 ? (
                    <p className="text-sm text-gray-500">
                      Resend OTP in {resendTimeout} seconds
                    </p>
                  ) : (
                    <Button 
                      type="button" 
                      variant="link" 
                      className="text-sm p-0 h-auto"
                      onClick={handleRequestOTP}
                      disabled={isLoadingOTP}
                    >
                      Resend OTP
                    </Button>
                  )}
                </div>
              </div>
            )}
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          {!otpSent ? (
            <Button 
              className="w-full text-white"
              style={{background: "#0f50ba"}}
              onClick={handleRequestOTP}
              disabled={!isValidPhone() || isLoadingOTP}
            >
              {isLoadingOTP ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Sending OTP...</span>
                </div>
              ) : (
                'Get OTP'
              )}
            </Button>
          ) : (
            <Button 
              className="w-full text-white "
              style={{background: "#0f50ba"}}
              onClick={handleLogin}
              disabled={otp.join('').length !== 6 || isLoadingLogin}
            >
              {isLoadingLogin ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying...</span>
                </div>
              ) : (
                'Sign in'
              )}
            </Button>
          )}
          
          {otpSent && (
            <Button 
              type="button" 
              variant="outline" 
              className="w-full border-gray-300"
              onClick={() => setOtpSent(false)}
              disabled={isLoadingLogin}
            >
              Change Mobile Number
            </Button>
          )}
        </CardFooter>
      </Card>
      <SiteSelectionDialog
        isOpen={showSiteSelection}
        onClose={() => setShowSiteSelection(false)}
        onSitesSelected={handleSitesSelected}
      />
    </div>
  );
};

// This Select component is a simple styled select dropdown
// const Select: React.FC<SelectProps> = ({ children, ...props }) => {
//   return (
//     <select
//       {...props}
//       className={`block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${props.className || ''}`}
//     >
//       {children}
//     </select>
//   );
// };

export default LoginPage1;