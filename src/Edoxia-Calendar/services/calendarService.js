import { db } from '../../firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, writeBatch } from 'firebase/firestore';

const COLLECTION_NAME = 'calendar_events';

export const calendarService = {
  // Ajouter un événement
  addEvent: async (eventData) => {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...eventData,
        createdAt: new Date().toISOString()
      });
      return { id: docRef.id, ...eventData };
    } catch (error) {
      console.error("Error adding event: ", error);
      throw error;
    }
  },

  // Ajouter plusieurs événements (Batch)
  addMultipleEvents: async (events) => {
    try {
      const batch = writeBatch(db);

      events.forEach(event => {
        // Create a ref with auto-ID
        const docRef = doc(collection(db, COLLECTION_NAME));
        batch.set(docRef, { ...event, createdAt: new Date().toISOString() });
      });

      await batch.commit();
    } catch (error) {
      console.error("Error batch adding events: ", error);
      throw error;
    }
  },

  // Récupérer tous les événements (filtrage côté client pour l'instant)
  getEvents: async () => {
    try {
      const q = query(collection(db, COLLECTION_NAME));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching events: ", error);
      throw error;
    }
  },

  // Mettre à jour un événement
  updateEvent: async (id, data) => {
    try {
      const eventRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(eventRef, data);
      return { id, ...data };
    } catch (error) {
      console.error("Error updating event: ", error);
      throw error;
    }
  },

  // Supprimer un événement
  deleteEvent: async (id) => {
    try {
      const eventRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(eventRef);
      return id;
    } catch (error) {
      console.error("Error deleting event: ", error);
      throw error;
    }
  },

  // Helper to expand recurring events for view
  expandRecurringEvents: (events) => {
    let expanded = [];
    events.forEach(event => {
      if (event.isRecurrent && event.recurrence && event.recurrence.active) {
        // Expand
        const { start, end, dayOfWeek, startTime, endTime } = event.recurrence;
        const [startH, startM] = startTime.split(':');
        const [endH, endM] = endTime.split(':');

        // We use local time components to avoid UTC shifts
        const startDate = new Date(start);
        const endDate = new Date(end);
        const targetDay = parseInt(dayOfWeek);

        let current = new Date(startDate);
        // Safety break to prevent infinite loops if end date is missing (though required)
        // max 500 instances per event to be safe
        let count = 0;
        while (current <= endDate && count < 500) {
          if (current.getDay() === targetDay) {
            // Create Instance
            const instanceStart = new Date(current);
            instanceStart.setHours(parseInt(startH), parseInt(startM));

            const instanceEnd = new Date(current);
            instanceEnd.setHours(parseInt(endH), parseInt(endM));

            expanded.push({
              ...event,
              id: `${event.id}_${current.getTime()}`, // unique instance id
              originalId: event.id, // reference to parent
              start: instanceStart.toISOString(),
              end: instanceEnd.toISOString(),
              isInstance: true
            });
          }
          current.setDate(current.getDate() + 1);
          count++;
        }
      } else {
        expanded.push(event);
      }
    });
    return expanded;
  }
};
