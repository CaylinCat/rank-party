import { useEffect, useRef, useState } from "react";

export function useCountdown(
  duration: number,
  onComplete: () => void,
  enabled: boolean,
  resetKey: string | null
) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const timerKeyRef = useRef<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(duration);

  useEffect(() => {
    if (!enabled || !resetKey) return;
    if (timerKeyRef.current === resetKey) return;
    timerKeyRef.current = resetKey;
    setSecondsLeft(duration);

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onCompleteRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [duration, enabled, resetKey]);

  return secondsLeft;
}
