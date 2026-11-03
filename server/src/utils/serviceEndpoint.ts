import { type Request, type Response } from "express";

/*
 * Staff endpoints all have the same shape: run a service call, wrap the
 * result as `{ success, data }`, and translate thrown `statusCode`
 * errors (see `httpError`) into responses.
 */
export const serviceEndpoint =
  (run: (req: Request) => Promise<unknown>, fallbackMessage: string) =>
  async (req: Request, res: Response) => {
    try {
      const data = await run(req);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      const statusCode = (error as { statusCode?: number })?.statusCode;

      if (!statusCode) {
        console.error(error);
      }

      return res.status(statusCode ?? 500).json({
        success: false,
        message:
          statusCode && error instanceof Error ? error.message : fallbackMessage,
      });
    }
  };
