import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";

interface OTPVerificationProps {
  phone: string;
  onVerified: () => void;
  onBack: () => void;
}

const OTPVerification = ({ phone, onVerified, onBack }: OTPVerificationProps) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(30);
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (timer > 0) {
      const t = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [timer]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError("");

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every((d) => d !== "") && newOtp.join("").length === 6) {
      // Simulate verification — in production, verify via Twilio
      setTimeout(() => {
        if (newOtp.join("") === "123456") {
          onVerified();
        } else {
          // For demo, accept any 6-digit code
          onVerified();
        }
      }, 500);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = () => {
    setTimer(30);
    setOtp(["", "", "", "", "", ""]);
    inputRefs.current[0]?.focus();
  };

  const maskedPhone = phone ? `***-***-${phone.replace(/\D/g, "").slice(-4)}` : "your phone";

  return (
    <div className="flex flex-col items-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
        <Phone className="h-8 w-8 text-accent" />
      </div>
      <h2 className="mb-2 font-display text-2xl font-bold text-foreground">Verify your phone</h2>
      <p className="mb-8 text-center text-sm text-muted-foreground">
        We sent a 6-digit code to {maskedPhone}
      </p>

      <div className="mb-6 flex gap-3">
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="h-14 w-12 rounded-xl border border-border bg-card text-center text-xl font-semibold text-foreground outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/30"
          />
        ))}
      </div>

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      <div className="mb-8 text-sm text-muted-foreground">
        {timer > 0 ? (
          <span>Resend code in {timer}s</span>
        ) : (
          <button onClick={handleResend} className="text-accent hover:underline">
            Resend code
          </button>
        )}
      </div>

      <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to form
      </button>
    </div>
  );
};

export default OTPVerification;
