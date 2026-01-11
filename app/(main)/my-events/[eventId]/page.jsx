"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  TrendingUp,
  Clock,
  Trash2,
  QrCode,
  Loader2,
  CheckCircle,
  Download,
  Search,
  Eye,
} from "lucide-react";

import { useConvexQuery, useConvexMutation } from "@/hooks/use-convex-query";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { getCategoryIcon, getCategoryLabel } from "@/lib/data";
import QRScannerModal from "../_components/qr-scanner-modal";
import { AttendeeCard } from "../_components/attendee-card";

export default function EventDashboardPage() {
  const { eventId } = useParams();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showQRScanner, setShowQRScanner] = useState(false);

  // ✅ Correct dashboard query (event-specific)
  const { data: dashboardData, isLoading } = useConvexQuery(
    api.dashboard.getEventDashboard,
    { eventId }
  );

  const { data: registrations, isLoading: loadingRegistrations } =
    useConvexQuery(api.registrations.getEventRegistrations, { eventId });

  // ✅ Correct delete mutation
  const { mutate: deleteEvent, isLoading: isDeleting } =
    useConvexMutation(api.events.deleteEvent);

  // ⛔ Loading state
  if (isLoading || loadingRegistrations) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  // ⛔ Safety guard (VERY IMPORTANT)
  if (!dashboardData || !dashboardData.event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Event not found</p>
      </div>
    );
  }

  const { event, stats } = dashboardData;

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this event? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      await deleteEvent({ eventId });
      toast.success("Event deleted successfully");
      router.push("/my-events");
    } catch (error) {
      toast.error(error.message || "Failed to delete event");
    }
  };

  const filteredRegistrations = registrations?.filter((reg) => {
    const q = searchQuery.toLowerCase();
    const matches =
      reg.attendeeName.toLowerCase().includes(q) ||
      reg.attendeeEmail.toLowerCase().includes(q) ||
      reg.qrCode.toLowerCase().includes(q);

    if (activeTab === "checked-in") return matches && reg.checkedIn;
    if (activeTab === "pending") return matches && !reg.checkedIn;
    return matches;
  });

  return (
    <div className="min-h-screen pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Back */}
        <Button
          variant="ghost"
          onClick={() => router.push("/my-events")}
          className="gap-2 mb-6 -ml-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Events
        </Button>

        {/* Cover Image */}
        {event.coverImage && (
          <div className="relative h-[350px] rounded-2xl overflow-hidden mb-6">
            <Image
              src={event.coverImage}
              alt={event.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">{event.title}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
              <Badge variant="outline">
                {getCategoryIcon(event.category)}{" "}
                {getCategoryLabel(event.category)}
              </Badge>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {format(event.startDate, "PPP")}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {event.locationType === "online"
                  ? "Online"
                  : `${event.city}, ${event.state || event.country}`}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/events/${event.slug}`)}
            >
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>
            <Button
              variant="outline"
              className="text-red-500"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>

        {/* QR Scanner */}
        {stats.isEventToday && !stats.isEventPast && (
          <Button
            className="w-full mb-6 gap-2 bg-gradient-to-r from-orange-500 via-pink-500 to-red-500 text-white"
            onClick={() => setShowQRScanner(true)}
          >
            <QrCode className="w-5 h-5" />
            Scan QR Code to Check-In
          </Button>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard icon={Users} label="Capacity" value={`${stats.totalRegistrations}/${stats.capacity}`} />
          <StatCard icon={CheckCircle} label="Checked In" value={stats.checkedInCount} />
          <StatCard
            icon={TrendingUp}
            label={event.ticketType === "paid" ? "Revenue" : "Check-in Rate"}
            value={event.ticketType === "paid" ? `₹${stats.totalRevenue}` : `${stats.checkInRate}%`}
          />
          <StatCard
            icon={Clock}
            label="Time Left"
            value={stats.isEventPast ? "Ended" : `${stats.hoursUntilEvent}h`}
          />
        </div>

        {/* Attendees */}
        <h2 className="text-2xl font-bold mb-4">Attendee Management</h2>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="checked-in">Checked In</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
          </TabsList>

          <div className="flex gap-3 my-4">
            <Input
              placeholder="Search attendee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <TabsContent value={activeTab}>
            {filteredRegistrations?.length ? (
              filteredRegistrations.map((r) => (
                <AttendeeCard key={r._id} registration={r} />
              ))
            ) : (
              <p className="text-muted-foreground text-center py-10">
                No attendees found
              </p>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {showQRScanner && (
        <QRScannerModal
          isOpen={showQRScanner}
          onClose={() => setShowQRScanner(false)}
        />
      )}
    </div>
  );
}

/* Small helper */
function StatCard({ icon: Icon, label, value }) {
  return (
    <Card>
      <CardContent className="p-6 flex items-center gap-3">
        <div className="p-3 bg-muted rounded-lg">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
