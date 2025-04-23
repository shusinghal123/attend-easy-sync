
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppStore } from "@/lib/store";
import TeacherLogin from "@/components/TeacherLogin";

const Index = () => {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Don't redirect to dashboard if the URL is for student attendance
    if (location.pathname.startsWith("/attend/")) {
      // If we're on an attendance URL, redirect directly to the student attendance page
      const sessionId = location.pathname.split("/attend/")[1];
      navigate(`/attend/${sessionId}`);
      return;
    }
    
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate, location.pathname]);

  // Only render teacher login if we're not on an attendance URL
  return !location.pathname.startsWith("/attend/") ? <TeacherLogin /> : null;
};

export default Index;
