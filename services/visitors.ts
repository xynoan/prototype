import { Timestamp, addDoc, collection, getDocs, orderBy, query } from "firebase/firestore";
import { auth, db } from "../config/firebase";

export interface VisitorData {
  name: string;
  hostId: string;
  hostName: string;
  plateNumber: string;
  vehicleCategory: string;
  gpsId: string;
  createdAt: Timestamp;
  createdBy: string; // guard user ID
}

export interface Visitor extends VisitorData {
  id: string;
}

export const createVisitor = async (
  name: string,
  hostId: string,
  hostName: string,
  plateNumber: string,
  vehicleCategory: string,
  gpsId: string
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
      gpsId: gpsId.trim(),
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

export const getVisitors = async (): Promise<Visitor[]> => {
  try {
    const visitorsRef = collection(db, "visitors");
    const q = query(visitorsRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const visitors: Visitor[] = [];
    querySnapshot.forEach((doc) => {
      visitors.push({
        id: doc.id,
        ...(doc.data() as VisitorData),
      });
    });
    
    return visitors;
  } catch (error) {
    console.error("Error fetching visitors:", error);
    throw new Error("Failed to fetch visitors");
  }
};

