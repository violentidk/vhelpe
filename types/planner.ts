export interface PlannerTask {
  id: string;
  title: string;
  deadline: string;
  status: "todo" | "in_progress" | "done";
  progress: number;
  created_at: string;
}
