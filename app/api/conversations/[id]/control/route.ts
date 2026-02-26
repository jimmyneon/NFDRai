/**
 * API endpoints for manual AI control per conversation
 * Allows John to override AI behavior for specific conversations
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  deactivateHumanControlWindow,
  permanentlyMuteAI,
  setSafeFAQOnlyMode,
  getHumanControlStatus,
  activateHumanControlWindow,
} from "@/app/lib/human-control-window";

/**
 * GET /api/conversations/[id]/control
 * Get current AI control status for a conversation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const conversationId = params.id;

    const status = await getHumanControlStatus(conversationId);

    return NextResponse.json({
      success: true,
      status,
    });
  } catch (error: any) {
    console.error("[Control API] Error getting status:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/conversations/[id]/control
 * Update AI control mode for a conversation
 * 
 * Body:
 * {
 *   "action": "enable_ai" | "mute_temporarily" | "mute_permanently" | "safe_faq_only",
 *   "hours": 2 (optional, for mute_temporarily)
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const conversationId = params.id;
    const body = await request.json();
    const { action, hours } = body;

    console.log(`[Control API] Action: ${action} for conversation ${conversationId}`);

    switch (action) {
      case "enable_ai":
        // Deactivate Human Control Window - AI can respond normally
        await deactivateHumanControlWindow(conversationId);
        return NextResponse.json({
          success: true,
          message: "AI enabled - will respond normally",
        });

      case "mute_temporarily":
        // Activate Human Control Window for specified hours (default 2)
        const muteHours = hours || 2;
        await activateHumanControlWindow(
          conversationId,
          `Manually muted for ${muteHours} hours`
        );
        return NextResponse.json({
          success: true,
          message: `AI muted for ${muteHours} hours - only safe FAQs allowed`,
        });

      case "mute_permanently":
        // Permanently mute AI for this conversation
        await permanentlyMuteAI(conversationId);
        return NextResponse.json({
          success: true,
          message: "AI permanently muted - human only mode",
        });

      case "safe_faq_only":
        // Set to safe FAQ only mode
        await setSafeFAQOnlyMode(conversationId);
        return NextResponse.json({
          success: true,
          message: "Safe FAQ only mode - AI responds to hours/location/parking only",
        });

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("[Control API] Error updating control:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
