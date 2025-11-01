import { Timestamp, addDoc, collection } from "firebase/firestore";
import { auth, db } from "../config/firebase";

export interface VisitorData {
  name: string;
  hostId: string;
  hostName: string;
  plateNumber: string;
  vehicleCategory: string;
  createdAt: Timestamp;
  createdBy: string; // guard user ID
}

export const createVisitor = async (
  name: string,
  hostId: string,
  hostName: string,
  plateNumber: string,
  vehicleCategory: string
): Promise<string> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    const visitorData: VisitorData = {
      name: name.trim(),
      hostId,
      hostName,
      plateNumber: plateNumber.trim().toUpperCase(),
      vehicleCategory,
      createdAt: Timestamp.now(),
      createdBy: user.uid,
    };

    const visitorsRef = collection(db, "visitors");
    const docRef = await addDoc(visitorsRef, visitorData);

    return docRef.id;
  } catch (error: any) {
    console.error("Error creating visitor:", error);
    throw new Error(error.message || "Failed to create visitor");
  }
};

