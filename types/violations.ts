import { Timestamp } from "firebase/firestore";

export enum ViolationStatus {
  PENDING = "pending",
  WARNING_SENT = "warning_sent",
  ESCALATED = "escalated",
  RESOLVED = "resolved",
  HOST_COMPLIED = "host_complied",
}

export interface ViolationData {
  plateNumber: string;
  location: string;
  gpsId?: string;
  geofenceZone?: string;
  status: ViolationStatus;
  detectedAt: Timestamp;
  warningSentAt?: Timestamp;
  escalatedAt?: Timestamp;
  resolvedAt?: Timestamp;
  hostId?: string;
  hostName?: string;
  hostPhone?: string;
  violationType?: string;
  photoUrl?: string;
  notes?: string;
  createdBy: string; // BPSO user ID
  ticketIssued: boolean;
}

export interface Violation extends ViolationData {
  id: string;
}

export interface ViolationFilter {
  status?: ViolationStatus | ViolationStatus[];
  plateNumber?: string;
  location?: string;
  startDate?: Timestamp;
  endDate?: Timestamp;
  minViolationCount?: number;
}

export interface ComplaintData {
  title: string;
  description: string;
  reporterName?: string;
  reporterPhone?: string;
  location?: string;
  plateNumber?: string;
  violationId?: string; // Link to related violation
  status: ComplaintStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy?: string;
}

export interface Complaint extends ComplaintData {
  id: string;
}

export enum ComplaintStatus {
  PENDING = "pending",
  IN_REVIEW = "in_review",
  RESOLVED = "resolved",
  DISMISSED = "dismissed",
}

