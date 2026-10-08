import { notFound } from "next/navigation";
import { ForbiddenError, NotFoundError } from "@/lib/data";

/** Maps "missing" and "not yours" to the same 404, so client ids never leak. */
export async function orNotFound<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ForbiddenError) notFound();
    throw error;
  }
}
