import type { Request, Response } from "express";
import prisma from "../prisma.ts";

export const getTasks = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    const tasks = await prisma.task.findMany({
      where: status ? { status: String(status) }: {},
      include: {
        // First option only — the card thumbnail; _count keeps the full total
        options: { take: 1, orderBy: { id: "asc" } },
        _count: { select: { options: true, submissions: true } },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formatted = tasks.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      budget: task.budget,
      fundedAmount: task.fundedAmount,
      deadline: task.deadline,
      optionsCount: task._count.options,
      totalSubmissions: task._count.submissions,
      options: task.options.map((opt) => ({
        id: opt.id,
        image_url: opt.image_url,
        gateway_url: opt.gateway_url,
      })),
    }));

    return res.json({ tasks: formatted });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Failed to fetch tasks"
    });
  }
};

export const getTasksById = async (req: Request, res: Response) => {
  try {
    const taskId = Number(req.params.id);

    const task = await prisma.task.findUnique({
      where: { id: taskId},
      include: {
        options: true,
        // Only the count is returned, and this row is fetched on every load of
        // both the ballot and the results page — `submissions: true` pulled
        // every vote row across the wire to call .length on it.
        _count: { select: { submissions: true } },
      },
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found :("
      });
    }

    return res.json({
      id: task.id,
      title: task.title,
      description: task.description,
      user_id: task.user_id,
      status: task.status,
      budget: task.budget,
      fundedAmount: task.fundedAmount,
      deadline: task.deadline,
      createdAt: task.createdAt,
      options: task.options.map((opt) => ({
        id: opt.id,
        image_url: opt.image_url,
        gateway_url: opt.gateway_url,
      })),
      totalSubmissions: task._count.submissions,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Failed to fetch task"
    });
  }
};