"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import type { PlannerTask } from "@/types/planner";

export function PlannerBoard() {
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");

  const loadTasks = async () => {
    const response = await fetch("/api/planner");
    const data = await response.json();
    if (response.ok) setTasks(data.tasks ?? []);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const createTask = async () => {
    if (!title || !deadline) return;

    const response = await fetch("/api/planner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, deadline, progress: 0 }),
    });

    if (response.ok) {
      setTitle("");
      setDeadline("");
      loadTasks();
    }
  };

  const updateTask = async (id: string, progress: number, status: PlannerTask["status"]) => {
    await fetch(`/api/planner/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ progress, status }),
    });
    loadTasks();
  };

  const deleteTask = async (id: string) => {
    await fetch(`/api/planner/${id}`, { method: "DELETE" });
    loadTasks();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Planner & Checklist</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 md:grid-cols-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
          />
          <Input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
          <Button onClick={createTask}>Add Task</Button>
        </div>
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="rounded-xl border border-border p-3">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{task.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Deadline: {format(new Date(task.deadline), "PPP")}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => deleteTask(task.id)}>
                  Remove
                </Button>
              </div>
              <Progress value={task.progress} />
              <div className="mt-2 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    updateTask(
                      task.id,
                      Math.min(100, task.progress + 20),
                      task.progress + 20 >= 100 ? "done" : "in_progress",
                    )
                  }
                >
                  +20%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateTask(task.id, 100, "done")}
                >
                  Mark done
                </Button>
              </div>
            </div>
          ))}
          {!tasks.length && <p className="text-sm text-muted-foreground">No tasks yet.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
