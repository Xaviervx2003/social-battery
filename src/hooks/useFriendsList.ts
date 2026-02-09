import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  documentId,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { UserData } from "../contexts/AuthContext";
// Importamos a interface Friend do novo componente para manter consistência
import { Friend } from "../components/friends/FriendItem";

export function useFriendsList(currentUser: UserData | null) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) return;
    setLoading(true);

    const q1 = query(
      collection(db, "friend_requests"),
      where("to", "==", currentUser.uid),
      where("status", "==", "accepted"),
    );
    const q2 = query(
      collection(db, "friend_requests"),
      where("from", "==", currentUser.uid),
      where("status", "==", "accepted"),
    );

    const updateFriendsList = (snapshotTo: any, snapshotFrom: any) => {
      const connectionsTo = snapshotTo?.docs || [];
      const connectionsFrom = snapshotFrom?.docs || [];
      const combinedDocs = [...connectionsTo, ...connectionsFrom];
      const friendMap = new Map();
      const friendUids: string[] = [];

      combinedDocs.forEach((d: any) => {
        const data = d.data();
        const friendUid = data.from === currentUser.uid ? data.to : data.from;
        if (friendUid && !friendUids.includes(friendUid)) {
          friendUids.push(friendUid);
          friendMap.set(friendUid, { requestId: d.id, ...data });
        }
      });

      if (friendUids.length === 0) {
        setFriends([]);
        setLoading(false);
        return;
      }

      const safeFriendUids = friendUids.slice(0, 30);
      const usersRef = collection(db, "users");
      const qUsers = query(usersRef, where(documentId(), "in", safeFriendUids));

      const unsubUsers = onSnapshot(qUsers, (userSnap) => {
        const friendsData: Friend[] = [];
        userSnap.forEach((docUser) => {
          const uData = docUser.data() as UserData;
          const requestData = friendMap.get(docUser.id);
          const batteryVal = uData.batteryLevel ?? uData.currentBattery ?? 0;

          friendsData.push({
            ...uData,
            uid: docUser.id,
            requestId: requestData.requestId,
            streak: requestData.streak || 0,
            finalBattery: batteryVal,
            lastInteraction: requestData.lastInteraction,
          });
        });

        friendsData.sort((a, b) => {
          const scoreA = 100 - a.finalBattery + (a.streak || 0) * 5;
          const scoreB = 100 - b.finalBattery + (b.streak || 0) * 5;
          return scoreB - scoreA;
        });

        setFriends(friendsData);
        setLoading(false);
      });
      return unsubUsers;
    };

    let unsubUsersRef: (() => void) | null = null;
    let snapToCache: any = null;
    let snapFromCache: any = null;

    const runUpdate = () => {
      if (unsubUsersRef) unsubUsersRef();
      if (snapToCache && snapFromCache) {
        unsubUsersRef = updateFriendsList(snapToCache, snapFromCache) || null;
      }
    };

    const unsub1 = onSnapshot(q1, (snap) => {
      snapToCache = snap;
      runUpdate();
    });
    const unsub2 = onSnapshot(q2, (snap) => {
      snapFromCache = snap;
      runUpdate();
    });

    return () => {
      unsub1();
      unsub2();
      if (unsubUsersRef) unsubUsersRef();
    };
  }, [currentUser]);

  return { friends, loading };
}
