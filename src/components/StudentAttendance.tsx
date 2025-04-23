
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useAppStore } from "@/lib/store";
import { Check } from "lucide-react";

export default function StudentAttendance() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [name, setName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [studentId, setStudentId] = useState("");
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attendanceRecordId, setAttendanceRecordId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [verified, setVerified] = useState(false);
  const [attempts, setAttempts] = useState(0);
  
  const {
    sessions,
    addAttendanceRecord,
    verifyAttendance
  } = useAppStore();
  
  // Find the active session matching the ID from the URL
  const session = sessions.find(
    s => s.qrCode.includes(sessionId || "") && s.isActive
  );
  
  useEffect(() => {
    if (!session) {
      toast({
        variant: "destructive",
        title: "Invalid Session",
        description: "This attendance session is not active or doesn't exist.",
      });
      
      // Redirect after a delay
      const timeout = setTimeout(() => {
        navigate("/");
      }, 3000);
      
      return () => clearTimeout(timeout);
    }
  }, [session, navigate, toast]);
  
  const handleSubmitDetails = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (!session) return;
      
      const record = addAttendanceRecord(
        session.id,
        name,
        rollNumber,
        studentId
      );
      
      setAttendanceRecordId(record.id);
      setSubmitted(true);
      
      toast({
        title: "Form Submitted",
        description: "Please enter the OTP announced by your teacher.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "There was an error submitting your details.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!attendanceRecordId) return;
    
    setIsSubmitting(true);
    setAttempts(prev => prev + 1);
    
    try {
      const success = verifyAttendance(attendanceRecordId, otp);
      
      if (success) {
        setVerified(true);
        toast({
          title: "Attendance Marked",
          description: "Your attendance has been successfully verified.",
        });
      } else {
        // Check if max attempts reached
        if (attempts >= 2) {
          toast({
            variant: "destructive",
            title: "Too Many Attempts",
            description: "You've reached the maximum number of attempts.",
          });
          
          // Redirect after a delay
          setTimeout(() => {
            navigate("/");
          }, 3000);
        } else {
          toast({
            variant: "destructive",
            title: "Invalid OTP",
            description: `Incorrect or expired OTP. ${2 - attempts} attempts remaining.`,
          });
          setOtp("");
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Verification Error",
        description: "An error occurred during verification.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-xl text-center">Invalid Session</CardTitle>
            <CardDescription className="text-center">
              This attendance session is not active or doesn't exist.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p>Redirecting to home page...</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center border-b pb-6">
          <CardTitle className="text-2xl font-bold">Student Attendance</CardTitle>
          <CardDescription>
            Please complete the form to mark your attendance
          </CardDescription>
        </CardHeader>
        
        {verified ? (
          <CardContent className="pt-6 flex flex-col items-center">
            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Check className="h-10 w-10 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold text-center mb-2">Attendance Marked!</h3>
            <p className="text-gray-600 text-center">
              Your attendance has been successfully recorded and verified.
            </p>
          </CardContent>
        ) : !submitted ? (
          <form onSubmit={handleSubmitDetails}>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Full Name
                </label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="border-blue-200 focus:border-blue-400"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="rollNumber" className="text-sm font-medium">
                  Roll Number
                </label>
                <Input
                  id="rollNumber"
                  placeholder="CS12345"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  required
                  className="border-blue-200 focus:border-blue-400"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="studentId" className="text-sm font-medium">
                  Student ID
                </label>
                <Input
                  id="studentId"
                  placeholder="STD12345"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  required
                  className="border-blue-200 focus:border-blue-400"
                />
              </div>
            </CardContent>
            
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP}>
            <CardContent className="pt-6 space-y-4">
              <p className="text-sm text-center text-gray-600 mb-2">
                Enter the 6-digit OTP announced by your teacher
              </p>
              
              <div className="space-y-2">
                <Input
                  id="otp"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  maxLength={6}
                  pattern="\d{6}"
                  className="text-center text-xl tracking-widest border-blue-200 focus:border-blue-400"
                />
                <p className="text-xs text-center text-gray-500">
                  OTP is valid for 20 seconds only
                </p>
              </div>
            </CardContent>
            
            <CardFooter className="flex-col gap-2">
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isSubmitting || otp.length !== 6}
              >
                {isSubmitting ? "Verifying..." : "Verify OTP"}
              </Button>
              
              <p className="text-xs text-gray-500 text-center">
                {3 - attempts} attempts remaining
              </p>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
