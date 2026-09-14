"""
Automated SMS/WhatsApp alert service for SIH26083.

DIRECTLY IMPLEMENTS the problem statement's explicit ask: "an API capable
of pushing automated SMS/WhatsApp regional alerts or localized triggers for
city administration to initiate heat action plans."

HONESTY NOTE: this module is fully Twilio-ready — plug in real
TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_PHONE_NUMBER /
TWILIO_WHATSAPP_NUMBER environment variables and it sends real messages,
no code changes needed. Without those credentials (the case for this
hackathon build — a paid Twilio account wasn't purchased for the demo),
it runs in SIMULATED mode: it builds the exact message that would be sent,
returns it to the caller, and clearly labels the response as simulated
rather than pretending a message went out. This is the same honesty
pattern used for NDVI/NDBI/WBGT-Tg elsewhere in this app.
"""

import os

try:
    from twilio.rest import Client as TwilioClient
    TWILIO_SDK_AVAILABLE = True
except ImportError:
    TWILIO_SDK_AVAILABLE = False


def _twilio_configured() -> bool:
    return TWILIO_SDK_AVAILABLE and all([
        os.environ.get("TWILIO_ACCOUNT_SID"),
        os.environ.get("TWILIO_AUTH_TOKEN"),
    ])


def build_alert_message(action_plan: dict, channel: str = "sms") -> str:
    """
    Builds the alert text from a Heat Action Plan response. SMS version is
    kept short (most Indian telecom SMS gateways charge per 160-char
    segment); WhatsApp version can be a bit richer since there's no such
    per-segment cost pressure.
    """
    city = action_plan["city"]
    level = action_plan["overallAlertLevel"]
    wbgt = action_plan["wbgt"]
    restriction = action_plan["outdoorWorkAdvisory"]["restriction"]
    centers = action_plan["coolingCenters"]

    if channel == "whatsapp":
        lines = [
            f"🚨 *{city} Heat Alert: {level}*",
            f"WBGT: {wbgt}°C | Mortality Risk: {action_plan['mortalityRiskIndex']}/100",
            "",
            f"*Outdoor work:* {restriction}",
        ]
        if centers["triggered"]:
            lines.append(f"*Cooling centers:* {centers['centersRecommended']} activated citywide")
        if action_plan["powerGridAlert"]["triggered"]:
            lines.append(f"*Power grid:* elevated demand expected")
        if action_plan["hospitalCapacityAlert"]["exceedsCapacity"]:
            lines.append(f"*Hospitals:* surge capacity may be exceeded — coordinate regional support")
        lines.append("")
        lines.append("Stay hydrated. Avoid direct sun 12-4 PM. Check on elderly neighbors.")
        lines.append(f"— {city} Disaster Management Cell")
        return "\n".join(lines)

    # SMS — compact
    msg = f"{city} HEAT ALERT: {level}. WBGT {wbgt}C. {restriction}."
    if centers["triggered"]:
        msg += f" {centers['centersRecommended']} cooling centers open."
    msg += " Stay hydrated, avoid sun 12-4PM. -Disaster Mgmt"
    return msg


def send_alert(action_plan: dict, to_number: str, channel: str = "sms") -> dict:
    """
    Sends (or simulates sending) the alert. Returns a dict describing what
    happened — always includes the actual message text so the caller/UI
    can show exactly what would go out, whether or not it was really sent.
    """
    message_text = build_alert_message(action_plan, channel)

    if not _twilio_configured():
        return {
            "status": "simulated",
            "channel": channel,
            "toNumber": to_number,
            "message": message_text,
            "note": (
                "Twilio credentials not configured — this is a simulated send. "
                "Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER "
                "(and TWILIO_WHATSAPP_NUMBER for WhatsApp) as environment variables "
                "to send real messages with this same code path."
            ),
        }

    try:
        client = TwilioClient(os.environ["TWILIO_ACCOUNT_SID"], os.environ["TWILIO_AUTH_TOKEN"])

        if channel == "whatsapp":
            from_number = os.environ.get("TWILIO_WHATSAPP_NUMBER", "")
            result = client.messages.create(
                body=message_text,
                from_=f"whatsapp:{from_number}",
                to=f"whatsapp:{to_number}",
            )
        else:
            from_number = os.environ.get("TWILIO_PHONE_NUMBER", "")
            result = client.messages.create(
                body=message_text,
                from_=from_number,
                to=to_number,
            )

        return {
            "status": "sent",
            "channel": channel,
            "toNumber": to_number,
            "message": message_text,
            "twilioSid": result.sid,
        }
    except Exception as e:
        return {
            "status": "failed",
            "channel": channel,
            "toNumber": to_number,
            "message": message_text,
            "error": str(e),
        }
