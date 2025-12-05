import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

/**
 * API Key Management for Webchat
 *
 * GET /api/webchat/keys - List all API keys (masked)
 * POST /api/webchat/keys - Create new API key
 * DELETE /api/webchat/keys?id=xxx - Delete API key
 */

// Generate a secure API key
function generateApiKey(): {
  fullKey: string;
  keyHash: string;
  keyPrefix: string;
} {
  const randomBytes = crypto.randomBytes(32);
  const fullKey = "nfdr_" + randomBytes.toString("base64url");
  const keyHash = crypto.createHash("sha256").update(fullKey).digest("hex");
  const keyPrefix = fullKey.substring(0, 12);

  return { fullKey, keyHash, keyPrefix };
}

export async function GET() {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all API keys (without the actual key hash for security)
    const { data: keys, error } = await supabase
      .from("api_keys")
      .select(
        "id, name, key_prefix, permissions, rate_limit_per_minute, last_used_at, expires_at, active, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[API Keys] Error fetching:", error);
      return NextResponse.json(
        { error: "Failed to fetch API keys" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      keys: keys || [],
    });
  } catch (error) {
    console.error("[API Keys] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name = "Webchat Widget",
      rate_limit_per_minute = 60,
      expires_in_days = null,
    } = body;

    // Generate new API key
    const { fullKey, keyHash, keyPrefix } = generateApiKey();

    // Calculate expiry if specified
    let expiresAt = null;
    if (expires_in_days && expires_in_days > 0) {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + expires_in_days);
      expiresAt = expiry.toISOString();
    }

    // Insert API key
    const { data: newKey, error } = await supabase
      .from("api_keys")
      .insert({
        name,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        permissions: ["webchat"],
        rate_limit_per_minute,
        expires_at: expiresAt,
        active: true,
      })
      .select("id, name, key_prefix, created_at")
      .single();

    if (error) {
      console.error("[API Keys] Error creating:", error);
      return NextResponse.json(
        { error: "Failed to create API key" },
        { status: 500 }
      );
    }

    // Return the full key ONLY on creation (never stored/shown again)
    return NextResponse.json({
      success: true,
      key: {
        ...newKey,
        full_key: fullKey, // Only shown once!
      },
      warning: "Save this API key now! It won't be shown again.",
    });
  } catch (error) {
    console.error("[API Keys] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const keyId = request.nextUrl.searchParams.get("id");

    if (!keyId) {
      return NextResponse.json({ error: "Key ID required" }, { status: 400 });
    }

    // Delete API key
    const { error } = await supabase.from("api_keys").delete().eq("id", keyId);

    if (error) {
      console.error("[API Keys] Error deleting:", error);
      return NextResponse.json(
        { error: "Failed to delete API key" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "API key deleted",
    });
  } catch (error) {
    console.error("[API Keys] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
