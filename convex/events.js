import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new event
export const createEvent = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.string(),
    tags: v.array(v.string()),
    startDate: v.number(),
    endDate: v.number(),
    timezone: v.string(),
    locationType: v.union(v.literal("physical"), v.literal("online")),
    venue: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.string(),
    state: v.optional(v.string()),
    country: v.string(),
    capacity: v.number(),
    ticketType: v.union(v.literal("free"), v.literal("paid")),
    ticketPrice: v.optional(v.number()),
    coverImage: v.optional(v.string()),
    themeColor: v.optional(v.string()),
    hasPro: v.optional(v.boolean()), // runtime only
  },

  handler: async (ctx, args) => {
    try {
      const user = await ctx.runQuery(internal.users.getCurrentUser);

      // 🔑 separate runtime-only flag
      const { hasPro, ...eventData } = args;
      const isPro = !!hasPro;

      // ❌ Free user limit
      if (!isPro && user.freeEventsCreated >= 1) {
        throw new Error(
          "Free event limit reached. Please upgrade to Pro to create more events."
        );
      }

      const defaultColor = "#1e3a8a";

      // ❌ Custom color without Pro
      if (
        !isPro &&
        eventData.themeColor &&
        eventData.themeColor !== defaultColor
      ) {
        throw new Error(
          "Custom theme colors are a Pro feature. Please upgrade to Pro."
        );
      }

      const themeColor = isPro ? eventData.themeColor : defaultColor;

      const slug = eventData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      // ✅ INSERT (NO hasPro here)
      const eventId = await ctx.db.insert("events", {
        ...eventData,
        themeColor,
        slug: `${slug}-${Date.now()}`,
        organizerId: user._id,
        organizerName: user.name,
        registrationCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // ✅ increment only for free users
      if (!isPro) {
        await ctx.db.patch(user._id, {
          freeEventsCreated: user.freeEventsCreated + 1,
        });
      }

      return eventId;
    } catch (error) {
      throw new Error(`Failed to create event: ${error.message}`);
    }
  },
});

// Get event by slug
export const getEventBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("events")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

// Get events by organizer
export const getMyEvents = query({
  handler: async (ctx) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);

    return await ctx.db
      .query("events")
      .withIndex("by_organizer", (q) => q.eq("organizerId", user._id))
      .order("desc")
      .collect();
  },
});

// Delete event
export const deleteEvent = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);

    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    if (event.organizerId !== user._id) {
      throw new Error("You are not authorized to delete this event");
    }

    const registrations = await ctx.db
      .query("registrations")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    for (const r of registrations) {
      await ctx.db.delete(r._id);
    }

    await ctx.db.delete(args.eventId);

    if (event.ticketType === "free" && user.freeEventsCreated > 0) {
      await ctx.db.patch(user._id, {
        freeEventsCreated: user.freeEventsCreated - 1,
      });
    }

    return { success: true };
  },
});
