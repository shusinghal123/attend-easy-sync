
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/lib/store";
import TeacherLogin from "@/components/TeacherLogin";

const Index = () => {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  return <TeacherLogin />;
};

export default Index;
