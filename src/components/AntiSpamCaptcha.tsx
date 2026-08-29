import { RotateCcw, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface MathCaptcha {
  text: string;
  answer: number;
}

export function convertBengaliToEnglishDigits(str: string): string {
  const bnToEn: Record<string, string> = {
    "০": "0",
    "১": "1",
    "২": "2",
    "৩": "3",
    "৪": "4",
    "৫": "5",
    "৬": "6",
    "৭": "7",
    "৮": "8",
    "৯": "9",
  };
  return str.replace(/[০-৯]/g, (digit) => bnToEn[digit] ?? digit);
}

export function generateMathCaptcha(): MathCaptcha {
  const ops = ["+", "-", "*"] as const;
  const op = ops[Math.floor(Math.random() * ops.length)];

  let a = 0;
  let b = 0;
  let ans = 0;

  if (op === "+") {
    a = Math.floor(Math.random() * 10); // 0..9
    b = Math.floor(Math.random() * (10 - a)); // 0..(9 - a)
    ans = a + b;
  } else if (op === "-") {
    a = Math.floor(Math.random() * 10); // 0..9
    b = Math.floor(Math.random() * (a + 1)); // 0..a
    ans = a - b;
  } else {
    // Multiplication with result in 0..9
    const validPairs: [number, number][] = [
      [0, 2], [0, 5], [0, 9],
      [1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 7], [1, 8], [1, 9],
      [2, 0], [2, 1], [2, 2], [2, 3], [2, 4],
      [3, 0], [3, 1], [3, 2], [3, 3],
      [4, 0], [4, 1], [4, 2],
      [5, 0], [5, 1],
      [6, 0], [6, 1],
      [7, 0], [7, 1],
      [8, 0], [8, 1],
      [9, 0], [9, 1],
    ];
    const pair = validPairs[Math.floor(Math.random() * validPairs.length)] ?? [2, 3];
    a = pair[0];
    b = pair[1];
    ans = a * b;
  }

  const opSymbol = op === "*" ? "×" : op;
  return {
    text: `${a} ${opSymbol} ${b} = ?`,
    answer: ans,
  };
}

interface AntiSpamCaptchaProps {
  value: string;
  onChange: (val: string) => void;
  onRefresh?: () => void;
  currentProblem: MathCaptcha;
  lang?: "bn" | "en";
}

export function AntiSpamCaptcha({
  value,
  onChange,
  onRefresh,
  currentProblem,
  lang = "bn",
}: AntiSpamCaptchaProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border/80 bg-muted/25 px-3.5 py-2.5 shadow-xs">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground/90">
        <ShieldCheck className="size-4 text-primary shrink-0" />
        <span>{lang === "bn" ? "স্প্যাম সুরক্ষা:" : "Anti-Spam:"}</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="inline-flex items-center rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1 font-mono text-sm font-bold text-primary">
          {currentProblem.text}
        </span>

        <Input
          type="text"
          inputMode="numeric"
          pattern="[0-9০-৯]*"
          maxLength={2}
          placeholder="?"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-16 bg-background text-center font-mono text-sm font-bold text-foreground focus-visible:ring-1"
          aria-label={lang === "bn" ? "ক্যাপচা সমাধান" : "Captcha solution"}
        />

        {onRefresh && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            className="size-8 rounded-full text-muted-foreground hover:text-foreground"
            title={lang === "bn" ? "নতুন প্রশ্ন আনুন" : "Get new question"}
          >
            <RotateCcw className="size-3.5" />
          </Button>
        )}
      </div>

      <span className="text-[11px] text-muted-foreground">
        {lang === "bn" ? "(ফলাফল ০ থেকে ৯ এর মধ্যে)" : "(Result is between 0-9)"}
      </span>
    </div>
  );
}
