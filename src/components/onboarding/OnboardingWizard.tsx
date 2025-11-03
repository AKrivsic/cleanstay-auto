"use client";

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { colors, spacing, typography, borderRadius, shadows } from '@/lib/design-system';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  component: React.ComponentType<OnboardingStepProps>;
  required: boolean;
}

interface OnboardingStepProps {
  data: any;
  onDataChange: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
  isFirst: boolean;
  isLast: boolean;
}

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: any) => void;
  type: 'client' | 'cleaner' | 'property';
}

// Step 1: Basic Information
function BasicInfoStep({ data, onDataChange, onNext, isFirst, isLast }: OnboardingStepProps) {
  const [formData, setFormData] = useState({
    name: data.name || '',
    email: data.email || '',
    phone: data.phone || '',
  });

  const handleChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onDataChange(newData);
  };

  const handleNext = () => {
    if (formData.name && formData.email) {
      onNext();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
      <div style={{ textAlign: 'center', marginBottom: spacing[4] }}>
        <div style={{ fontSize: '3rem', marginBottom: spacing[2] }}>👋</div>
        <h3 style={{ 
          fontSize: typography.fontSize.xl, 
          fontWeight: typography.fontWeight.semibold, 
          margin: 0,
          color: colors.text.primary 
        }}>
          Vítejte v CleanStay!
        </h3>
        <p style={{ 
          fontSize: typography.fontSize.base, 
          color: colors.text.secondary, 
          margin: 0 
        }}>
          Pojďme nastavit váš profil
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
        <Input
          label="Jméno *"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Zadejte vaše jméno"
        />
        
        <Input
          label="Email *"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder="vas@email.cz"
        />
        
        <Input
          label="Telefon"
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          placeholder="+420 123 456 789"
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: spacing[3] }}>
        <Button variant="primary" onClick={handleNext} disabled={!formData.name || !formData.email}>
          Pokračovat
        </Button>
      </div>
    </div>
  );
}

// Step 2: Role-specific Information
function RoleInfoStep({ data, onDataChange, onNext, onPrev, isFirst, isLast }: OnboardingStepProps) {
  const [formData, setFormData] = useState({
    role: data.role || '',
    notes: data.notes || '',
  });

  const handleChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onDataChange({ ...data, ...newData });
  };

  const handleNext = () => {
    if (formData.role) {
      onNext();
    }
  };

  const roles = [
    { value: 'client', label: 'Klient', description: 'Vlastník nemovitosti', icon: '🏠' },
    { value: 'cleaner', label: 'Uklízečka', description: 'Poskytovatel úklidových služeb', icon: '🧹' },
    { value: 'admin', label: 'Administrátor', description: 'Správce systému', icon: '⚙️' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
      <div style={{ textAlign: 'center', marginBottom: spacing[4] }}>
        <div style={{ fontSize: '3rem', marginBottom: spacing[2] }}>👤</div>
        <h3 style={{ 
          fontSize: typography.fontSize.xl, 
          fontWeight: typography.fontWeight.semibold, 
          margin: 0,
          color: colors.text.primary 
        }}>
          Jakou roli budete mít?
        </h3>
        <p style={{ 
          fontSize: typography.fontSize.base, 
          color: colors.text.secondary, 
          margin: 0 
        }}>
          Vyberte typ účtu, který nejlépe odpovídá vašim potřebám
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: spacing[3] }}>
        {roles.map((role) => (
          <Card
            key={role.value}
            hover
            onClick={() => handleChange('role', role.value)}
            style={{
              cursor: 'pointer',
              border: formData.role === role.value ? `2px solid ${colors.primary[500]}` : `1px solid ${colors.border.light}`,
              backgroundColor: formData.role === role.value ? colors.primary[50] : colors.background.primary,
            }}
          >
            <CardContent style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: spacing[2] }}>{role.icon}</div>
              <h4 style={{ 
                fontSize: typography.fontSize.base, 
                fontWeight: typography.fontWeight.medium, 
                margin: 0,
                color: colors.text.primary 
              }}>
                {role.label}
              </h4>
              <p style={{ 
                fontSize: typography.fontSize.sm, 
                color: colors.text.secondary, 
                margin: 0 
              }}>
                {role.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Input
        label="Poznámky"
        value={formData.notes}
        onChange={(e) => handleChange('notes', e.target.value)}
        placeholder="Doplňující informace..."
      />

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button variant="outline" onClick={onPrev}>
          Zpět
        </Button>
        <Button variant="primary" onClick={handleNext} disabled={!formData.role}>
          Pokračovat
        </Button>
      </div>
    </div>
  );
}

// Step 3: Additional Details
function AdditionalDetailsStep({ data, onDataChange, onNext, onPrev, isFirst, isLast }: OnboardingStepProps) {
  const [formData, setFormData] = useState({
    address: data.address || '',
    preferences: data.preferences || '',
  });

  const handleChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onDataChange({ ...data, ...newData });
  };

  const handleNext = () => {
    onNext();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
      <div style={{ textAlign: 'center', marginBottom: spacing[4] }}>
        <div style={{ fontSize: '3rem', marginBottom: spacing[2] }}>📝</div>
        <h3 style={{ 
          fontSize: typography.fontSize.xl, 
          fontWeight: typography.fontWeight.semibold, 
          margin: 0,
          color: colors.text.primary 
        }}>
          Doplňující informace
        </h3>
        <p style={{ 
          fontSize: typography.fontSize.base, 
          color: colors.text.secondary, 
          margin: 0 
        }}>
          Pomozte nám lépe vám sloužit
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
        <Input
          label="Adresa"
          value={formData.address}
          onChange={(e) => handleChange('address', e.target.value)}
          placeholder="Vaše adresa"
        />
        
        <Input
          label="Preference"
          value={formData.preferences}
          onChange={(e) => handleChange('preferences', e.target.value)}
          placeholder="Speciální požadavky nebo preference"
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button variant="outline" onClick={onPrev}>
          Zpět
        </Button>
        <Button variant="primary" onClick={handleNext}>
          Pokračovat
        </Button>
      </div>
    </div>
  );
}

// Step 4: Confirmation
function ConfirmationStep({ data, onNext, onPrev, isFirst, isLast }: OnboardingStepProps) {
  const handleComplete = () => {
    onNext();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
      <div style={{ textAlign: 'center', marginBottom: spacing[4] }}>
        <div style={{ fontSize: '3rem', marginBottom: spacing[2] }}>✅</div>
        <h3 style={{ 
          fontSize: typography.fontSize.xl, 
          fontWeight: typography.fontWeight.semibold, 
          margin: 0,
          color: colors.text.primary 
        }}>
          Skvěle! Jste připraveni
        </h3>
        <p style={{ 
          fontSize: typography.fontSize.base, 
          color: colors.text.secondary, 
          margin: 0 
        }}>
          Zkontrolujte údaje a dokončete registraci
        </p>
      </div>

      <Card>
        <CardHeader>
          <h4 style={{ 
            fontSize: typography.fontSize.lg, 
            fontWeight: typography.fontWeight.medium, 
            margin: 0,
            color: colors.text.primary 
          }}>
            Shrnutí profilu
          </h4>
        </CardHeader>
        <CardContent>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: colors.text.secondary }}>Jméno:</span>
              <span style={{ color: colors.text.primary, fontWeight: typography.fontWeight.medium }}>
                {data.name}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: colors.text.secondary }}>Email:</span>
              <span style={{ color: colors.text.primary, fontWeight: typography.fontWeight.medium }}>
                {data.email}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: colors.text.secondary }}>Role:</span>
              <Badge variant="primary">
                {data.role}
              </Badge>
            </div>
            {data.phone && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: colors.text.secondary }}>Telefon:</span>
                <span style={{ color: colors.text.primary, fontWeight: typography.fontWeight.medium }}>
                  {data.phone}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button variant="outline" onClick={onPrev}>
          Zpět
        </Button>
        <Button variant="primary" onClick={handleComplete}>
          Dokončit
        </Button>
      </div>
    </div>
  );
}

const steps: OnboardingStep[] = [
  {
    id: 'basic',
    title: 'Základní informace',
    description: 'Jméno a kontakt',
    icon: '👋',
    component: BasicInfoStep,
    required: true,
  },
  {
    id: 'role',
    title: 'Role',
    description: 'Typ účtu',
    icon: '👤',
    component: RoleInfoStep,
    required: true,
  },
  {
    id: 'details',
    title: 'Doplňující informace',
    description: 'Adresa a preference',
    icon: '📝',
    component: AdditionalDetailsStep,
    required: false,
  },
  {
    id: 'confirmation',
    title: 'Potvrzení',
    description: 'Zkontrolujte údaje',
    icon: '✅',
    component: ConfirmationStep,
    required: true,
  },
];

export function OnboardingWizard({ isOpen, onClose, onComplete, type }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardData, setWizardData] = useState<any>({});

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(wizardData);
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    setWizardData({});
    onClose();
  };

  const handleDataChange = (data: any) => {
    setWizardData({ ...wizardData, ...data });
  };

  const currentStepData = steps[currentStep];
  const StepComponent = currentStepData.component;

  const progress = ((currentStep + 1) / steps.length) * 100;

  const modalStyle: React.CSSProperties = {
    maxWidth: '600px',
    width: '90vw',
  };

  const progressBarStyle: React.CSSProperties = {
    width: '100%',
    height: '4px',
    backgroundColor: colors.gray[200],
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing[4],
  };

  const progressFillStyle: React.CSSProperties = {
    width: `${progress}%`,
    height: '100%',
    backgroundColor: colors.primary[500],
    transition: 'width 0.3s ease-in-out',
  };

  const stepIndicatorStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[4],
  };

  const stepDotStyle: React.CSSProperties = {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: colors.gray[300],
    transition: 'all 0.3s ease-in-out',
  };

  const activeStepDotStyle: React.CSSProperties = {
    ...stepDotStyle,
    backgroundColor: colors.primary[500],
    width: '12px',
    height: '12px',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Vytvoření ${type === 'client' ? 'klienta' : type === 'cleaner' ? 'uklízečky' : 'nemovitosti'}`}
      size="lg"
    >
      <div>
        <div style={progressBarStyle}>
          <div style={progressFillStyle} />
        </div>

        <div style={stepIndicatorStyle}>
          {steps.map((_, index) => (
            <div
              key={index}
              style={index <= currentStep ? activeStepDotStyle : stepDotStyle}
            />
          ))}
        </div>

        <div style={{ marginBottom: spacing[4] }}>
          <h3 style={{ 
            fontSize: typography.fontSize.lg, 
            fontWeight: typography.fontWeight.semibold, 
            margin: 0,
            color: colors.text.primary 
          }}>
            {currentStepData.title}
          </h3>
          <p style={{ 
            fontSize: typography.fontSize.sm, 
            color: colors.text.secondary, 
            margin: 0 
          }}>
            Krok {currentStep + 1} z {steps.length}
          </p>
        </div>

        <StepComponent
          data={wizardData}
          onDataChange={handleDataChange}
          onNext={handleNext}
          onPrev={handlePrev}
          isFirst={currentStep === 0}
          isLast={currentStep === steps.length - 1}
        />
      </div>
    </Modal>
  );
}
