import { Resend } from 'resend'

export async function POST(request) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  try {
    const { email } = await request.json()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'Valid email required' }, { status: 400 })
    }

    await resend.contacts.create({
      email,
      audienceId: process.env.RESEND_AUDIENCE_ID,
      unsubscribed: false,
    })

    return Response.json({ success: true })
  } catch (err) {
    console.error('Subscribe error:', err)
    return Response.json({ error: 'Failed to subscribe' }, { status: 500 })
  }
}
