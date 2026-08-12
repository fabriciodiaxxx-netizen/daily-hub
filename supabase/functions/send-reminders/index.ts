import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;
const vapidSubject = Deno.env.get("VAPID_SUBJECT")!;

webpush.setVapidDetails(
  vapidSubject,
  vapidPublicKey,
  vapidPrivateKey,
);

const supabase = createClient(
  supabaseUrl,
  serviceRoleKey,
);

function paraguayNow() {
  // Edge Functions trabajan en UTC; convertimos a America/Asuncion
  const now = new Date();

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Asuncion",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
  };
}

function dateMatchesReminder(reminder: any, dateString: string) {
  if (dateString < reminder.reminder_date) return false;
  if (
    reminder.repeat_end_date &&
    dateString > reminder.repeat_end_date
  ) return false;

  const date = new Date(`${dateString}T12:00:00-03:00`);
  const weekday = date.getDay();
  const type = reminder.repeat_type ?? "never";

  if (type === "never") {
    return dateString === reminder.reminder_date;
  }

  if (type === "daily") return true;
  if (type === "weekdays") return weekday >= 1 && weekday <= 5;
  if (type === "weekends") return weekday === 0 || weekday === 6;

  if (type === "weekly") {
    const original = new Date(
      `${reminder.reminder_date}T12:00:00-03:00`,
    );
    return weekday === original.getDay();
  }

  if (type === "custom") {
    return (reminder.repeat_days ?? []).includes(weekday);
  }

  return false;
}

function minutesBetween(timeA: string, timeB: string) {
  const [ah, am] = timeA.split(":").map(Number);
  const [bh, bm] = timeB.split(":").map(Number);
  return (ah * 60 + am) - (bh * 60 + bm);
}

Deno.serve(async () => {
  const now = paraguayNow();

  const { data: reminders, error: remindersError } =
    await supabase
      .from("reminders")
      .select("*")
      .not("reminder_time", "is", null);

  if (remindersError) {
    return new Response(remindersError.message, { status: 500 });
  }

  let sent = 0;

  for (const reminder of reminders ?? []) {
    if (!dateMatchesReminder(reminder, now.date)) continue;

    const completedDates =
      reminder.completed_dates ?? [];

    if (
      reminder.completed ||
      completedDates.includes(now.date)
    ) {
      continue;
    }

    const reminderTime =
      String(reminder.reminder_time).slice(0, 5);

    const leadMinutes =
      Number(reminder.reminder_minutes ?? 0);

    const delta =
      minutesBetween(reminderTime, now.time);

    // El Cron corre cada minuto.
    if (delta !== leadMinutes) continue;

    const { data: subscriptions } =
      await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", reminder.user_id);

    for (const sub of subscriptions ?? []) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          JSON.stringify({
            title: "Daily Hub",
            body: reminder.title,
            url: "/daily-hub/",
            tag: `reminder-${reminder.id}-${now.date}`,
          }),
        );

        sent++;
      } catch (error: any) {
        console.error("Push error:", error);

        // 404/410 = suscripción vencida: limpiarla.
        if (
          error?.statusCode === 404 ||
          error?.statusCode === 410
        ) {
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("id", sub.id);
        }
      }
    }
  }

  return Response.json({
    ok: true,
    checked_at: now,
    sent,
  });
});
