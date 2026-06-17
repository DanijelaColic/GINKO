'use client';

import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

type Props = {
  currentStep: 1 | 2 | 3;
};

export default function BookingStepsBar({ currentStep }: Props) {
  const t = useTranslations('bookingWidget.stepper');

  const steps: { n: 1 | 2 | 3; label: string }[] = [
    { n: 1, label: t('step1') },
    { n: 2, label: t('step2') },
    { n: 3, label: t('step3') },
  ];

  return (
    <div className="flex items-start justify-center mb-10 select-none">
      {steps.map((step, i) => (
        <div key={step.n} className="flex items-start">
          <div className="flex flex-col items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                currentStep > step.n
                  ? 'bg-primary text-white'
                  : currentStep === step.n
                    ? 'bg-primary text-white ring-4 ring-primary/15'
                    : 'bg-stone border border-stone text-muted'
              }`}
            >
              {currentStep > step.n ? <Check size={14} /> : step.n}
            </div>
            <span
              className={`text-xs font-medium whitespace-nowrap transition-colors ${
                currentStep === step.n
                  ? 'text-text'
                  : currentStep > step.n
                    ? 'text-primary'
                    : 'text-muted'
              }`}
            >
              {step.label}
            </span>
          </div>

          {i < steps.length - 1 && (
            <div
              className={`h-px w-10 sm:w-16 mx-2 mt-4 shrink-0 transition-colors ${
                currentStep > step.n ? 'bg-primary' : 'bg-stone'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
