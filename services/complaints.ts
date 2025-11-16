import {
  Timestamp,
  addDoc,
  collection,
  doc,
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
  Complaint,
  ComplaintData,
  ComplaintStatus,
} from "../types/violations";

export const createComplaint = async (
  title: string,
  description: string,
  reporterName?: string,
  reporterPhone?: string,
  location?: string,
  plateNumber?: string,
  violationId?: string
): Promise<string> => {
  try {
    const user = auth.currentUser;

    const complaintData: ComplaintData = {
      title: title.trim(),
      description: description.trim(),
      reporterName: reporterName?.trim(),
      reporterPhone: reporterPhone?.trim(),
      location: location?.trim(),
      plateNumber: plateNumber?.trim().toUpperCase(),
      violationId: violationId?.trim(),
      status: ComplaintStatus.PENDING,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy: user?.uid,
    };

    const complaintsRef = collection(db, "complaints");
    const docRef = await addDoc(complaintsRef, complaintData);

    return docRef.id;
  } catch (error: any) {
    console.error("Error creating complaint:", error);
    throw new Error(error.message || "Failed to create complaint");
  }
};

export const getComplaints = async (
  status?: ComplaintStatus
): Promise<Complaint[]> => {
  try {
    const complaintsRef = collection(db, "complaints");
    let q = query(complaintsRef, orderBy("createdAt", "desc"));

    if (status) {
      q = query(complaintsRef, where("status", "==", status), orderBy("createdAt", "desc"));
    }

    const querySnapshot = await getDocs(q);
    const complaints: Complaint[] = [];

    querySnapshot.forEach((doc) => {
      complaints.push({
        id: doc.id,
        ...(doc.data() as ComplaintData),
      });
    });

    return complaints;
  } catch (error) {
    console.error("Error fetching complaints:", error);
    throw new Error("Failed to fetch complaints");
  }
};

export const updateComplaintStatus = async (
  id: string,
  status: ComplaintStatus,
  additionalFields?: Partial<ComplaintData>
): Promise<void> => {
  try {
    const complaintRef = doc(db, "complaints", id);
    const updateData: any = {
      status,
      updatedAt: Timestamp.now(),
    };

    if (additionalFields) {
      Object.assign(updateData, additionalFields);
    }

    await updateDoc(complaintRef, updateData);
  } catch (error: any) {
    console.error("Error updating complaint status:", error);
    throw new Error(error.message || "Failed to update complaint status");
  }
};

export const subscribeToComplaints = (
  status: ComplaintStatus | undefined,
  callback: (complaints: Complaint[]) => void
): Unsubscribe => {
  const complaintsRef = collection(db, "complaints");
  let q = query(complaintsRef, orderBy("createdAt", "desc"));

  if (status) {
    q = query(complaintsRef, where("status", "==", status), orderBy("createdAt", "desc"));
  }

  return onSnapshot(
    q,
    (snapshot) => {
      const complaints: Complaint[] = [];
      snapshot.forEach((doc) => {
        complaints.push({
          id: doc.id,
          ...(doc.data() as ComplaintData),
        });
      });
      callback(complaints);
    },
    (error) => {
      console.error("Error in complaints subscription:", error);
    }
  );
};

