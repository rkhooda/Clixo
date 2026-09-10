import type { Request, Response } from "express";
import prisma from "../prisma.ts";


// Shows all tasks created by a user and sub count
export const getMyTasks = async (req: Request, res: Response) => {
  try {
    const walletAddress = (req as any).auth?.walletAddress;
    if (!walletAddress) {
      return res.status(401).json({
        message: "Unauthorized"
      });
    }

    const user = await prisma.user.findFirst({
      where: {
        address: {
          equals: walletAddress,
          mode: "insensitive",
        },
      },
    });

    if (!user) {
      return res.json({ tasks: [] });
    }

    const tasks = await prisma.task.findMany({
      where: { user_id: user.id },
      include: {
        options: true,
        // Only the count is returned. `submissions: true` fetched every vote
        // row for every task the creator owns just to call .length on it.
        _count: { select: { submissions: true } },
      },
      orderBy: {
        createdAt: "desc"
      },
    });

    const formatted = tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      budget: task.budget,
      fundedAmount: task.fundedAmount,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      user_id: task.user_id,
      signature: task.signature,
      amount: task.amount,
      deadline: task.deadline,
      totalSubmissions: task._count.submissions,
      options: task.options.map(opt => ({
        id: opt.id,
        ipfs_cid: opt.ipfs_cid,
        ipfs_uri: opt.ipfs_uri,
        gateway_url: opt.gateway_url,
        image_url: opt.image_url,
        option_id: opt.option_id,
        task_id: opt.task_id,
      }))
    }));

    res.json({ tasks: formatted });
  } catch (err) {
    console.error("getMyTasks error:", err);
    res.status(500).json({
      message: "Failed to fetch tasks"
    });
  }
};

// Shows all submissions by worker
export const getMySubmissions = async (req: Request, res: Response) => {
  try {
    const workerId = (req as any).auth?.workerId;
    if (!workerId) {
      return res.status(401).json({
        message: "Unauthorized"
      });
    }
  
    const submissions = await prisma.submission.findMany({
      where: { worker_id: workerId },
      // Selects rather than includes: the response uses four task columns and
      // two option columns. The old `task: { include: { options: true } }`
      // fetched every option of every task the worker has ever voted on and
      // then read none of them.
      select: {
        task_id: true,
        option_id: true,
        createdAt: true,
        task: { select: { status: true, title: true, budget: true } },
        option: { select: { gateway_url: true, image_url: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  
    const formatted = submissions.map(sub => ({
      taskId: sub.task_id,
      optionId: sub.option_id,
      taskStatus: sub.task.status,
      submittedAt: sub.createdAt,
      taskTitle: sub.task.title,
      taskBudget: sub.task.budget,
      optionPickedImage: sub.option.gateway_url || sub.option.image_url,
      // We can also calculate if they earned something if task is SETTLED
      earnedEth: sub.task.status === "SETTLED" ? (sub.task.budget * 0.001 / sub.task.budget).toFixed(4) : "0" // Mocked calculation for now
    }));
  
    res.json({ submissions: formatted });

  } catch (err) {
    console.error("getMySubmissions error:", err);
    res.status(500).json({
      message: "Failed to fetch submissions"
    });
  }
};

// Shows worker earnings
export const getMyEarnings = async (req: Request, res: Response) => {
  try {
    const workerId = (req as any).auth?.workerId;
    if (!workerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const worker = await prisma.worker.findUnique({
      where: { id: workerId },
    });
    if (!worker) {
      return res.status(404).json({
        message: "Worker not found"
      });
    }

    const totalEarned = worker.pending_amount + worker.locked_amount;

    res.json({
      pending: worker.pending_amount,
      locked: worker.locked_amount,
      totalEarned,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch earnings"
    });
  }
};

// Show funding history of user (funding ledger)
export const getMyFundingHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).auth?.workerId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const fundings = await prisma.funding.findMany({
      where: { user_id: userId },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      fundings: fundings.map(f => ({
        credits: f.credits,
        source: f.source,
        txHash: f.txHash,
        createdAt: f.createdAt,
      })),
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch funding history"
    });
  }
};
