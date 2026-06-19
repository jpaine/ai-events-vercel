import { Resend } from 'resend'

export async function POST(request) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  try {
    const { secret, newEvents, totalEvents } = await request.json()

    if (secret !== process.env.NOTIFY_SECRET) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!newEvents || newEvents.length === 0) {
      return Response.json({ skipped: true })
    }

    const eventList = newEvents
      .map(e => `<tr>
        <td style="padding:10px 16px;border-bottom:1px solid #21262d;color:#e6edf3;font-size:14px;font-weight:500">${e.name}</td>
        <td style="padding:10px 16px;border-bottom:1px solid #21262d;color:#8b949e;font-size:13px">${e.dates}</td>
        <td style="padding:10px 16px;border-bottom:1px solid #21262d;color:#8b949e;font-size:13px">${e.location}</td>
      </tr>`)
      .join('')

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px">

    <div style="margin-bottom:32px">
      <span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:#3fb950;text-transform:uppercase;letter-spacing:0.5px">
        ● AI Events 2026
      </span>
    </div>

    <h1 style="font-size:26px;font-weight:800;color:#f0f6fc;letter-spacing:-0.8px;margin:0 0 12px">
      ${newEvents.length} new event${newEvents.length > 1 ? 's' : ''} added
    </h1>
    <p style="color:#8b949e;font-size:15px;line-height:1.7;margin:0 0 32px">
      The AI Events tracker now has <strong style="color:#c9d1d9">${totalEvents} events</strong> across academic research and industry practice.
    </p>

    <table style="width:100%;border-collapse:collapse;border:1px solid #21262d;border-radius:6px;overflow:hidden;margin-bottom:32px">
      <thead>
        <tr style="background:#0d1117">
          <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:600;color:#484f58;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #21262d">Event</th>
          <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:600;color:#484f58;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #21262d">Dates</th>
          <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:600;color:#484f58;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #21262d">Location</th>
        </tr>
      </thead>
      <tbody style="background:#161b22">
        ${eventList}
      </tbody>
    </table>

    <a href="https://ai-events-vercel.vercel.app" style="display:inline-block;background:#238636;color:#f0f6fc;padding:10px 20px;border-radius:6px;font-size:13px;font-weight:500;text-decoration:none;margin-bottom:40px">
      View all events →
    </a>

    <div style="border-top:1px solid #21262d;padding-top:24px;color:#484f58;font-size:12px;line-height:1.6">
      You're receiving this because you subscribed to AI Events 2026 updates.<br>
      <a href="{{{ unsubscribe_url }}}" style="color:#58a6ff">Unsubscribe</a>
    </div>

  </div>
</body>
</html>`

    const { data, error } = await resend.broadcasts.create({
      audienceId: process.env.RESEND_AUDIENCE_ID,
      from: 'AI Events <onboarding@resend.dev>',
      replyTo: 'noreply@resend.dev',
      subject: `${newEvents.length} new event${newEvents.length > 1 ? 's' : ''} added to AI Events 2026`,
      html,
    })

    if (error) throw error

    await resend.broadcasts.send(data.id)

    return Response.json({ success: true, broadcastId: data.id, sent: newEvents.length })
  } catch (err) {
    console.error('Notify error:', err)
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
