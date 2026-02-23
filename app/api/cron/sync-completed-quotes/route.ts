import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { checkRepairStatus } from "@/app/lib/repair-status-checker";

/**
 * Daily cron job to sync completed quotes from repair app
 * Checks all accepted quotes and updates status to completed if repair is done
 * 
 * Vercel Cron: Runs daily at 2am UTC
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("[Cron] Starting daily quote completion sync...");

    const supabase = createServiceClient();

    // Get all accepted quotes (sent to repair app but not yet marked completed)
    const { data: acceptedQuotes, error: fetchError } = await supabase
      .from("quote_requests")
      .select("id, phone, name, device_make, device_model")
      .eq("status", "accepted");

    if (fetchError) {
      console.error("[Cron] Error fetching accepted quotes:", fetchError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch quotes" },
        { status: 500 }
      );
    }

    if (!acceptedQuotes || acceptedQuotes.length === 0) {
      console.log("[Cron] No accepted quotes to check");
      return NextResponse.json({
        success: true,
        message: "No accepted quotes to check",
        checked: 0,
        completed: 0,
      });
    }

    console.log(`[Cron] Checking ${acceptedQuotes.length} accepted quotes...`);

    let completedCount = 0;
    const results = [];

    // Check each accepted quote against repair app
    for (const quote of acceptedQuotes) {
      try {
        console.log(`[Cron] Checking quote ${quote.id} for ${quote.phone}...`);

        // Call repair app API to check job status
        const statusResult = await checkRepairStatus(quote.phone);

        if (!statusResult.success || statusResult.jobs.length === 0) {
          console.log(
            `[Cron] No jobs found for quote ${quote.id} (${quote.phone})`
          );
          results.push({
            quote_id: quote.id,
            phone: quote.phone,
            status: "no_jobs_found",
          });
          continue;
        }

        // Find matching job (by device make/model)
        const matchingJob = statusResult.jobs.find(
          (job) =>
            job.device_make === quote.device_make &&
            job.device_model === quote.device_model
        );

        if (!matchingJob) {
          console.log(
            `[Cron] No matching job found for quote ${quote.id} (${quote.device_make} ${quote.device_model})`
          );
          results.push({
            quote_id: quote.id,
            phone: quote.phone,
            status: "no_match",
          });
          continue;
        }

        console.log(
          `[Cron] Found job ${matchingJob.job_ref} with status: ${matchingJob.status}`
        );

        // Check if job is completed or collected
        if (
          matchingJob.status === "COMPLETED" ||
          matchingJob.status === "COLLECTED"
        ) {
          console.log(
            `[Cron] ✅ Job ${matchingJob.job_ref} is complete - updating quote ${quote.id}`
          );

          // Update quote status to completed
          const { error: updateError } = await supabase
            .from("quote_requests")
            .update({
              status: "completed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", quote.id);

          if (updateError) {
            console.error(
              `[Cron] Error updating quote ${quote.id}:`,
              updateError
            );
            results.push({
              quote_id: quote.id,
              phone: quote.phone,
              status: "update_failed",
              error: updateError.message,
            });
          } else {
            completedCount++;
            results.push({
              quote_id: quote.id,
              phone: quote.phone,
              job_ref: matchingJob.job_ref,
              status: "completed",
            });
          }
        } else {
          console.log(
            `[Cron] Job ${matchingJob.job_ref} still in progress (${matchingJob.status})`
          );
          results.push({
            quote_id: quote.id,
            phone: quote.phone,
            job_ref: matchingJob.job_ref,
            job_status: matchingJob.status,
            status: "in_progress",
          });
        }
      } catch (error) {
        console.error(`[Cron] Error checking quote ${quote.id}:`, error);
        results.push({
          quote_id: quote.id,
          phone: quote.phone,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    console.log(
      `[Cron] ✅ Sync complete: ${completedCount} quotes marked as completed`
    );

    return NextResponse.json({
      success: true,
      message: `Checked ${acceptedQuotes.length} quotes, marked ${completedCount} as completed`,
      checked: acceptedQuotes.length,
      completed: completedCount,
      results,
    });
  } catch (error) {
    console.error("[Cron] Fatal error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
