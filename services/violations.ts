import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  Unsubscribe,
} from "firebase/firestore";
import { auth, db } from "../config/firebase";
import {
  Violation,
  ViolationData,
  ViolationStatus,
  ViolationFilter,
} from "../types/violations";

export const createViolation = async (
  plateNumber: string,
  location: string,
  violationType?: string,
  gpsId?: string,
  geofenceZone?: string,
  hostId?: string,
  hostName?: string,
  hostPhone?: string,
  photoUrl?: string,
  notes?: string
): Promise<string> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    const violationData: ViolationData = {
      plateNumber: plateNumber.trim().toUpperCase(),
      location: location.trim(),
      gpsId: gpsId?.trim(),
      geofenceZone: geofenceZone?.trim(),
      status: ViolationStatus.PENDING,
      detectedAt: Timestamp.now(),
      violationType: violationType?.trim(),
      hostId: hostId?.trim(),
      hostName: hostName?.trim(),
      hostPhone: hostPhone?.trim(),
      photoUrl: photoUrl,
      notes: notes?.trim(),
      createdBy: user.uid,
      ticketIssued: false,
    };

    const violationsRef = collection(db, "violations");
    const docRef = await addDoc(violationsRef, violationData);

    return docRef.id;
  } catch (error: any) {
    console.error("Error creating violation:", error);
    throw new Error(error.message || "Failed to create violation");
  }
};

export const getViolations = async (
  filter?: ViolationFilter
): Promise<Violation[]> => {
  try {
    const violationsRef = collection(db, "violations");
    let q = query(violationsRef, orderBy("detectedAt", "desc"));

    if (filter) {
      const conditions: any[] = [];
      
      if (filter.status) {
        if (Array.isArray(filter.status)) {
          conditions.push(where("status", "in", filter.status));
        } else {
          conditions.push(where("status", "==", filter.status));
        }
      }

      if (filter.plateNumber) {
        conditions.push(where("plateNumber", "==", filter.plateNumber.toUpperCase()));
      }

      if (filter.location) {
        conditions.push(where("location", ">=", filter.location));
        conditions.push(where("location", "<=", filter.location + "\uf8ff"));
      }

      if (filter.startDate) {
        conditions.push(where("detectedAt", ">=", filter.startDate));
      }

      if (filter.endDate) {
        conditions.push(where("detectedAt", "<=", filter.endDate));
      }

      if (conditions.length > 0) {
        q = query(violationsRef, ...conditions, orderBy("detectedAt", "desc"));
      }
    }

    const querySnapshot = await getDocs(q);
    const violations: Violation[] = [];
    
    querySnapshot.forEach((doc) => {
      violations.push({
        id: doc.id,
        ...(doc.data() as ViolationData),
      });
    });

    return violations;
  } catch (error) {
    console.error("Error fetching violations:", error);
    throw new Error("Failed to fetch violations");
  }
};

export const getActiveAlerts = async (): Promise<Violation[]> => {
  try {
    return await getViolations({
      status: [ViolationStatus.ESCALATED, ViolationStatus.PENDING],
    });
  } catch (error) {
    console.error("Error fetching active alerts:", error);
    throw new Error("Failed to fetch active alerts");
  }
};

export const getViolationById = async (id: string): Promise<Violation | null> => {
  try {
    const violationRef = doc(db, "violations", id);
    const violationSnap = await getDoc(violationRef);

    if (violationSnap.exists()) {
      return {
        id: violationSnap.id,
        ...(violationSnap.data() as ViolationData),
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching violation:", error);
    throw new Error("Failed to fetch violation");
  }
};

export const updateViolationStatus = async (
  id: string,
  status: ViolationStatus,
  additionalFields?: Partial<ViolationData>
): Promise<void> => {
  try {
    const violationRef = doc(db, "violations", id);
    const updateData: any = {
      status,
    };

    if (status === ViolationStatus.WARNING_SENT) {
      updateData.warningSentAt = Timestamp.now();
    } else if (status === ViolationStatus.ESCALATED) {
      updateData.escalatedAt = Timestamp.now();
    } else if (status === ViolationStatus.RESOLVED || status === ViolationStatus.HOST_COMPLIED) {
      updateData.resolvedAt = Timestamp.now();
    }

    if (additionalFields) {
      Object.assign(updateData, additionalFields);
    }

    await updateDoc(violationRef, updateData);
  } catch (error: any) {
    console.error("Error updating violation status:", error);
    throw new Error(error.message || "Failed to update violation status");
  }
};

export const subscribeToActiveAlerts = (
  callback: (count: number) => void
): Unsubscribe => {
  const violationsRef = collection(db, "violations");
  const q = query(
    violationsRef,
    where("status", "in", [ViolationStatus.ESCALATED, ViolationStatus.PENDING]),
    orderBy("detectedAt", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      callback(snapshot.size);
    },
    (error) => {
      console.error("Error in active alerts subscription:", error);
    }
  );
};

export const subscribeToViolations = (
  filter: ViolationFilter | undefined,
  callback: (violations: Violation[]) => void
): Unsubscribe => {
  const violationsRef = collection(db, "violations");
  let q = query(violationsRef, orderBy("detectedAt", "desc"));

  if (filter) {
    const conditions: any[] = [];
    
    if (filter.status) {
      if (Array.isArray(filter.status)) {
        conditions.push(where("status", "in", filter.status));
      } else {
        conditions.push(where("status", "==", filter.status));
      }
    }

    if (filter.plateNumber) {
      conditions.push(where("plateNumber", "==", filter.plateNumber.toUpperCase()));
    }

    if (conditions.length > 0) {
      q = query(violationsRef, ...conditions, orderBy("detectedAt", "desc"));
    }
  }

  return onSnapshot(
    q,
    (snapshot) => {
      const violations: Violation[] = [];
      snapshot.forEach((doc) => {
        violations.push({
          id: doc.id,
          ...(doc.data() as ViolationData),
        });
      });
      callback(violations);
    },
    (error) => {
      console.error("Error in violations subscription:", error);
    }
  );
};

export const getRepeatOffenders = async (
  minViolationCount: number = 2
): Promise<Map<string, Violation[]>> => {
  try {
    const allViolations = await getViolations();
    const violationsByPlate = new Map<string, Violation[]>();

    allViolations.forEach((violation) => {
      const plate = violation.plateNumber;
      if (!violationsByPlate.has(plate)) {
        violationsByPlate.set(plate, []);
      }
      violationsByPlate.get(plate)!.push(violation);
    });

    // Filter to only plates with minimum violation count
    const repeatOffenders = new Map<string, Violation[]>();
    violationsByPlate.forEach((violations, plate) => {
      if (violations.length >= minViolationCount) {
        repeatOffenders.set(plate, violations);
      }
    });

    return repeatOffenders;
  } catch (error) {
    console.error("Error fetching repeat offenders:", error);
    throw new Error("Failed to fetch repeat offenders");
  }
};

