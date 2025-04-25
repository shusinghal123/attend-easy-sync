
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AttendanceRecord, AttendanceSession, Student, Teacher } from './types';
import { v4 as uuidv4 } from 'uuid';
import { mockTeachers } from './types';

interface AppState {
  // Auth
  currentTeacher: Teacher | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  
  // Sessions
  currentSession: AttendanceSession | null;
  sessions: AttendanceSession[];
  createSession: (teacherId: string) => AttendanceSession;
  generateOtp: (sessionId: string) => string;
  endSession: (sessionId: string) => void;
  
  // Attendance
  attendanceRecords: AttendanceRecord[];
  addAttendanceRecord: (
    sessionId: string, 
    studentName: string, 
    rollNumber: string, 
    studentId: string
  ) => AttendanceRecord;
  verifyAttendance: (recordId: string, otp: string) => boolean;
  
  // Utility
  getSessionRecords: (sessionId: string) => AttendanceRecord[];
  getActiveSession: () => AttendanceSession | null;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth state
      currentTeacher: null,
      isAuthenticated: false,
      
      // Sessions state
      currentSession: null,
      sessions: [],
      
      // Attendance state
      attendanceRecords: [],
      
      // Auth actions
      login: (email: string, password: string) => {
        const teacher = mockTeachers.find(
          (t) => t.email === email && t.password === password
        );
        
        if (teacher) {
          set({ currentTeacher: teacher, isAuthenticated: true });
          return true;
        }
        return false;
      },
      
      logout: () => {
        set({ 
          currentTeacher: null, 
          isAuthenticated: false,
          currentSession: null 
        });
      },
      
      // Session actions
      createSession: (teacherId: string) => {
        const sessionId = uuidv4();
        const newSession: AttendanceSession = {
          id: sessionId,
          teacherId,
          createdAt: new Date().toISOString(),
          // Use absolute URL with window.location.origin to ensure it works when scanned
          qrCode: `${window.location.origin}/attend/${sessionId}`,
          otp: null,
          otpGeneratedAt: null,
          expiresAt: null,
          isActive: true,
        };
        
        set((state) => ({ 
          sessions: [...state.sessions, newSession],
          currentSession: newSession
        }));
        
        return newSession;
      },
      
      generateOtp: (sessionId: string) => {
        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 20000); // 20 seconds expiry
        
        set((state) => ({
          sessions: state.sessions.map((session) => {
            if (session.id === sessionId) {
              return { 
                ...session, 
                otp, 
                otpGeneratedAt: now.toISOString(),
                expiresAt: expiresAt.toISOString() 
              };
            }
            return session;
          }),
          currentSession: state.currentSession && state.currentSession.id === sessionId
            ? { 
                ...state.currentSession, 
                otp, 
                otpGeneratedAt: now.toISOString(),
                expiresAt: expiresAt.toISOString() 
              }
            : state.currentSession
        }));
        
        return otp;
      },
      
      endSession: (sessionId: string) => {
        set((state) => ({
          sessions: state.sessions.map((session) => {
            if (session.id === sessionId) {
              return { ...session, isActive: false };
            }
            return session;
          }),
          currentSession: state.currentSession && state.currentSession.id === sessionId
            ? { ...state.currentSession, isActive: false }
            : state.currentSession
        }));
      },
      
      // Attendance actions
      addAttendanceRecord: (sessionId, studentName, rollNumber, studentId) => {
        const newRecord: AttendanceRecord = {
          id: uuidv4(),
          sessionId,
          studentId,
          studentName,
          rollNumber,
          timestamp: new Date().toISOString(),
          verified: false,
        };
        
        set((state) => ({ 
          attendanceRecords: [...state.attendanceRecords, newRecord] 
        }));
        
        return newRecord;
      },
      
      verifyAttendance: (recordId, otp) => {
        const state = get();
        const record = state.attendanceRecords.find(r => r.id === recordId);
        
        if (!record) return false;
        
        const session = state.sessions.find(s => s.id === record.sessionId);
        if (!session) return false;
        
        // Check if OTP matches and is not expired
        const isOtpValid = session.otp === otp;
        const isNotExpired = session.expiresAt ? new Date(session.expiresAt) > new Date() : false;
        
        if (isOtpValid && isNotExpired) {
          set((state) => ({
            attendanceRecords: state.attendanceRecords.map((r) => {
              if (r.id === recordId) {
                return { ...r, verified: true };
              }
              return r;
            })
          }));
          return true;
        }
        
        return false;
      },
      
      // Utility methods
      getSessionRecords: (sessionId) => {
        return get().attendanceRecords.filter(
          record => record.sessionId === sessionId
        );
      },
      
      getActiveSession: () => {
        const sessions = get().sessions;
        return sessions.find(session => session.isActive) || null;
      }
    }),
    {
      name: 'attendance-app-storage'
    }
  )
);
