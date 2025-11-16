import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../config/firebase";
import { Visitor } from "./visitors";
import { Violation, ViolationStatus } from "../types/violations";
import { getViolations } from "./violations";

export interface VehicleInfo {
  plateNumber: string;
  vehicle?: Visitor;
  violations: Violation[];
  violationCount: number;
  hostName?: string;
  hostPhone?: string;
  hostId?: string;
  name?: string; // Visitor/owner name
  vehicleCategory?: string;
  gpsId?: string;
}

export const searchVehicleByPlate = async (
  plateNumber: string
): Promise<VehicleInfo | null> => {
  try {
    const plateUpper = plateNumber.trim().toUpperCase();

    // Search in visitors collection
    const visitorsRef = collection(db, "visitors");
    const q = query(visitorsRef, where("plateNumber", "==", plateUpper));
    const querySnapshot = await getDocs(q);

    let vehicle: Visitor | undefined;
    let hostName: string | undefined;
    let hostPhone: string | undefined;
    let hostId: string | undefined;
    let name: string | undefined;
    let vehicleCategory: string | undefined;
    let gpsId: string | undefined;

    if (!querySnapshot.empty) {
      const visitorDoc = querySnapshot.docs[0];
      vehicle = {
        id: visitorDoc.id,
        ...(visitorDoc.data() as any),
      };
      hostName = vehicle.hostName;
      hostId = vehicle.hostId;
      name = vehicle.name;
      vehicleCategory = vehicle.vehicleCategory;
      gpsId = vehicle.gpsId;
    }

    // Get violation history for this plate
    const violations = await getViolations({ plateNumber: plateUpper });

    // If we have a visitor record, we might have host info
    // Otherwise, try to get it from the first violation if available
    if (!hostName && violations.length > 0) {
      const firstViolation = violations[0];
      if (firstViolation.hostName) {
        hostName = firstViolation.hostName;
        hostId = firstViolation.hostId;
        hostPhone = firstViolation.hostPhone;
      }
    }

    if (violations.length === 0 && !vehicle) {
      // No vehicle found and no violations
      return null;
    }

    return {
      plateNumber: plateUpper,
      vehicle,
      violations,
      violationCount: violations.length,
      hostName,
      hostPhone,
      hostId,
      name,
      vehicleCategory,
      gpsId,
    };
  } catch (error) {
    console.error("Error searching vehicle by plate:", error);
    throw new Error("Failed to search vehicle");
  }
};

export const getVehicleHistory = async (
  plateNumber: string
): Promise<Violation[]> => {
  try {
    return await getViolations({ plateNumber });
  } catch (error) {
    console.error("Error fetching vehicle history:", error);
    throw new Error("Failed to fetch vehicle history");
  }
};

export const getHostByPlate = async (
  plateNumber: string
): Promise<{ hostId?: string; hostName?: string; hostPhone?: string } | null> => {
  try {
    const plateUpper = plateNumber.trim().toUpperCase();

    // First try to find in visitors collection
    const visitorsRef = collection(db, "visitors");
    const q = query(visitorsRef, where("plateNumber", "==", plateUpper));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const visitorData = querySnapshot.docs[0].data();
      return {
        hostId: visitorData.hostId,
        hostName: visitorData.hostName,
      };
    }

    // If not found in visitors, check violations
    const violations = await getViolations({ plateNumber: plateUpper });
    if (violations.length > 0) {
      const firstViolation = violations[0];
      if (firstViolation.hostId || firstViolation.hostName) {
        return {
          hostId: firstViolation.hostId,
          hostName: firstViolation.hostName,
          hostPhone: firstViolation.hostPhone,
        };
      }
    }

    return null;
  } catch (error) {
    console.error("Error getting host by plate:", error);
    throw new Error("Failed to get host information");
  }
};

