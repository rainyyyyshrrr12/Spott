import { query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

export const getEventDashboard = query({
  args: {
    eventId: v.id("events"),
  },

  handler: async (ctx, { eventId }) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);

    if (!user) return null;

    const event = await ctx.db.get(eventId);
    if (!event) return null;

    // 🔒 Security: only organizer can access dashboard
    if (event.organizerId !== user._id) {
      throw new Error("Unauthorized");
    }

    const registrations = await ctx.db
      .query("registrations")
      .withIndex("by_event", (q) =>
        q.eq("eventId", eventId)
      )
      .collect();

    const checkedInCount = registrations.filter(r => r.checkedIn).length;
    const pendingCount = registrations.length - checkedInCount;

    const now = Date.now();
    const isEventPast = event.endDate < now;
    const isEventToday =
      new Date(event.startDate).toDateString() ===
      new Date().toDateString();

    const hoursUntilEvent = Math.max(
      0,
      Math.ceil((event.startDate - now) / (1000 * 60 * 60))
    );

    const totalRevenue =
      event.ticketType === "paid"
        ? registrations.length * (event.ticketPrice || 0)
        : 0;

    return {
      event,
      stats: {
        capacity: event.capacity,
        totalRegistrations: registrations.length,
        checkedInCount,
        pendingCount,
        totalRevenue,
        isEventPast,
        isEventToday,
        hoursUntilEvent,
        checkInRate:
          registrations.length === 0
            ? 0
            : Math.round((checkedInCount / registrations.length) * 100),
      },
    };
  },
});
