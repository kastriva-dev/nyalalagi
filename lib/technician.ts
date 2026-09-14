import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { ReportStatus } from "./report";

const allowedTransitions: Record<string, ReportStatus[]> = {
  ENGINEER_ASSIGNED: ["ENGINEER_ON_WAY", "REJECTED"],
  ENGINEER_ON_WAY: ["ARRIVED", "REJECTED"],
  ARRIVED: ["IN_PROGRESS", "REJECTED"],
  IN_PROGRESS: ["COMPLETED", "REJECTED"]
};

const timestampField: Partial<Record<ReportStatus, string>> = {
  ENGINEER_ON_WAY: "onTheWayAt",
  ARRIVED: "arrivedAt",
  IN_PROGRESS: "startedAt",
  COMPLETED: "completedAt"
};

export function canTechnicianTransition(from: string, to: ReportStatus) {
  return allowedTransitions[from]?.includes(to) ?? false;
}

export async function updateTechnicianStatus(
  reportId: string,
  currentStatus: string,
  nextStatus: ReportStatus
) {
  if (!db) throw new Error("Firebase Firestore belum dikonfigurasi.");
  if (!canTechnicianTransition(currentStatus, nextStatus)) {
    throw new Error(`Perubahan status ${currentStatus} → ${nextStatus} tidak diizinkan.`);
  }

  const payload: Record<string, unknown> = {
    status: nextStatus,
    updatedAt: serverTimestamp()
  };
  const field = timestampField[nextStatus];
  if (field) payload[field] = serverTimestamp();

  await updateDoc(doc(db, "reports", reportId), payload);
}
