/**
 * Repair Status Checker
 * Integrates with repair app API to check job status by phone number
 */

const REPAIR_APP_STATUS_API_URL =
  "https://nfd-repairs-app.vercel.app/api/jobs/check-status";

export interface RepairJob {
  id: string;
  job_ref: string;
  customer_name: string;
  customer_phone: string;
  device_make: string;
  device_model: string;
  issue: string;
  status: string;
  status_label: string;
  quoted_price?: number;
  price_total?: number;
  deposit_required?: boolean;
  deposit_amount?: number;
  deposit_received?: boolean;
  tracking_token?: string;
  tracking_url?: string;
  created_at: string;
  updated_at: string;
}

export interface RepairStatusResult {
  success: boolean;
  phone: string;
  jobs: RepairJob[];
  error?: string;
}

/**
 * Check repair job status by customer phone number
 */
export async function checkRepairStatus(
  phone: string,
): Promise<RepairStatusResult> {
  try {
    console.log("[Repair Status] Checking status for phone:", phone);

    const url = `${REPAIR_APP_STATUS_API_URL}?phone=${encodeURIComponent(phone)}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "[Repair Status] ❌ API error:",
        response.status,
        errorText,
      );
      return {
        success: false,
        phone,
        jobs: [],
        error: `API returned ${response.status}: ${errorText}`,
      };
    }

    const data = await response.json();
    console.log(
      "[Repair Status] ✅ Found",
      data.jobs?.length || 0,
      "job(s)",
    );

    return {
      success: true,
      phone: data.phone || phone,
      jobs: data.jobs || [],
    };
  } catch (error) {
    console.error("[Repair Status] ❌ Exception:", error);
    return {
      success: false,
      phone,
      jobs: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Format repair status for AI response
 */
export function formatRepairStatusForAI(
  result: RepairStatusResult,
): string | null {
  if (!result.success) {
    return null;
  }

  const { jobs } = result;

  // No jobs found - return null so AI can handle with special template
  if (jobs.length === 0) {
    return null;
  }

  // Single job
  if (jobs.length === 1) {
    const job = jobs[0];
    return formatSingleJob(job);
  }

  // Multiple jobs
  return formatMultipleJobs(jobs);
}

function formatSingleJob(job: RepairJob): string {
  const parts: string[] = [];

  parts.push(`📱 ${job.device_make} ${job.device_model} - ${job.issue}`);
  parts.push(`Status: ${job.status_label}`);
  parts.push(`Job Ref: ${job.job_ref}`);

  // Add status-specific message
  const statusMessage = getStatusSpecificMessage(job);
  if (statusMessage) {
    parts.push("");
    parts.push(statusMessage);
  }

  // Add tracking link if available
  if (job.tracking_url) {
    parts.push("");
    parts.push(`Track your repair: ${job.tracking_url}`);
  }

  return parts.join("\n");
}

function formatMultipleJobs(jobs: RepairJob[]): string {
  const parts: string[] = [];

  parts.push(`You have ${jobs.length} repairs with us:`);
  parts.push("");

  jobs.forEach((job, index) => {
    parts.push(
      `${index + 1}. 📱 ${job.device_make} ${job.device_model} - ${job.issue}`,
    );
    parts.push(`   Status: ${job.status_label}`);
    parts.push(`   Job Ref: ${job.job_ref}`);
    if (index < jobs.length - 1) {
      parts.push("");
    }
  });

  parts.push("");
  parts.push("Would you like details about a specific repair?");

  return parts.join("\n");
}

function getStatusSpecificMessage(job: RepairJob): string | null {
  switch (job.status) {
    case "READY_TO_COLLECT":
      return "Great news! Your device is ready to collect. Opening hours: https://maps.app.goo.gl/jAvhRuG61bssFcL7A";

    case "IN_REPAIR":
      return "Our technicians are currently working on your device. We'll update you when it's ready.";

    case "AWAITING_DEPOSIT":
      if (job.deposit_amount) {
        return `We need a £${job.deposit_amount.toFixed(2)} deposit to order parts. Please contact us to arrange payment.`;
      }
      return "We need a deposit to proceed with your repair. Please contact us to arrange payment.";

    case "PARTS_ORDERED":
      return "Parts have been ordered and we'll notify you when they arrive.";

    case "READY_TO_BOOK_IN":
      return "Your repair is ready to be booked in. You can drop your device off during opening hours.";

    case "RECEIVED":
      return "We've received your repair request and will assess it shortly.";

    case "COMPLETED":
      return "Your repair has been completed and collected. Thank you!";

    case "CANCELLED":
      return "This repair was cancelled.";

    default:
      return null;
  }
}

/**
 * Get template for when no jobs are found
 */
export function getNoJobsFoundTemplate(): string {
  return `I can't seem to find any repair jobs under this phone number.

This could be because:
• You're texting from a different number than the one used for booking
• The repair was booked under a different phone number

Please try:
1. Text from the phone number you used when booking the repair, OR
2. Reply with your job reference number (e.g., NFD-2024-001), OR
3. Let me know and I'll pass this to our team for assistance

How would you like to proceed?`;
}
