import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../config/firebase";

export interface Host {
  id: string;
  name: string;
  // Add other host fields as needed
}

export const getHosts = async (): Promise<Host[]> => {
  try {
    const hostsRef = collection(db, "hosts");
    const querySnapshot = await getDocs(hostsRef);
    
    const hosts: Host[] = [];
    querySnapshot.forEach((doc) => {
      hosts.push({
        id: doc.id,
        name: doc.data().name || "",
        // Add other fields from doc.data() as needed
      });
    });
    
    return hosts;
  } catch (error) {
    console.error("Error fetching hosts:", error);
    throw new Error("Failed to fetch hosts");
  }
};

export const searchHosts = async (searchTerm: string): Promise<Host[]> => {
  try {
    const hostsRef = collection(db, "hosts");
    // Note: Firestore doesn't support case-insensitive search out of the box
    // For production, consider using Algolia or similar, or implementing client-side filtering
    const q = query(
      hostsRef,
      where("name", ">=", searchTerm),
      where("name", "<=", searchTerm + "\uf8ff")
    );
    
    const querySnapshot = await getDocs(q);
    const hosts: Host[] = [];
    querySnapshot.forEach((doc) => {
      hosts.push({
        id: doc.id,
        name: doc.data().name || "",
      });
    });
    
    return hosts;
  } catch (error) {
    console.error("Error searching hosts:", error);
    // If query fails, fall back to client-side filtering
    const allHosts = await getHosts();
    const searchLower = searchTerm.toLowerCase();
    return allHosts.filter((host) =>
      host.name.toLowerCase().includes(searchLower)
    );
  }
};

