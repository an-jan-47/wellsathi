import {
  Stethoscope,
  Baby,
  HeartPulse,
  Sparkles,
  Bone,
  Ear,
  Eye,
  Users,
  Brain,
  Smile,
  Droplet,
  Dumbbell,
  Leaf,
  Flower2,
  Syringe,
  TestTube2,
  ScanLine,
  Microscope,
  Wind
} from 'lucide-react';
import React from 'react';

export const SPECIALTY_ICONS: Record<string, React.ElementType> = {
  'General Medicine': Stethoscope,
  'Pediatrics': Baby,
  'Cardiology': HeartPulse,
  'Dermatology': Sparkles,
  'Orthopedics': Bone,
  'ENT': Ear,
  'Ophthalmology': Eye,
  'Gynecology': Users,
  'Neurology': Brain,
  'Psychiatry': Brain,
  'Dentistry': Smile,
  'Urology': Droplet,
  'Physiotherapy': Dumbbell,
  'Homeopathy': Flower2,
  'Ayurveda': Leaf,
  'General Surgery': Syringe,
  'Radiology': ScanLine,
  'Pathology': Microscope,
  'Anesthesiology': Wind,
  'Oncology': TestTube2,
};

export function getSpecialtyIcon(specialty: string): React.ElementType {
  return SPECIALTY_ICONS[specialty] || Stethoscope;
}
