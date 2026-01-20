"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  RefreshCw,
  Loader2,
  Twitter,
  Linkedin,
  Instagram,
  FileText,
  Send,
  X,
  CheckCircle2,
  Images,
  AlertCircle,
  Plus,
  Eye,
  MoreHorizontal,
  ArrowUpRight,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useBrand } from "@/contexts/brand-context";

interface Content {
  id: string;
  platform: string;
  copy_primary: string;
  copy_hashtags: string[] | null;
  copy_carousel_slides: unknown[] | null;
  status: string;
  scheduled_for: string | null;
  published_at: string | null;
  created_at: string;
  ideas?: {
    concept: string;
    angle: string;
  };
}

interface ContentImage {
  id: string;
  url: string;
}

const platformIcons: Record<string, React.ReactNode> = {
  twitter: <Twitter className="h-3 w-3" />,
  linkedin: <Linkedin className="h-3 w-3" />,
  instagram: <Instagram className="h-3 w-3" />,
};

const platformColors: Record<string, string> = {
  twitter: "bg-sky-500",
  linkedin: "bg-blue-600",
  instagram: "bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500",
};

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  published: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  approved: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  draft: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  failed: "bg-red-500/20 text-red-400 border-red-500/30",
};

const statusDotColors: Record<string, string> = {
  scheduled: "bg-blue-500",
  published: "bg-emerald-500",
  approved: "bg-amber-500",
  draft: "bg-gray-400",
};

type ViewMode = "month" | "week";

export default function CalendarPage() {
  const { selectedBrand } = useBrand();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [content, setContent] = useState<Content[]>([]);
  const [contentImages, setContentImages] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [newScheduleDate, setNewScheduleDate] = useState("");
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [isUnscheduling, setIsUnscheduling] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [hoveredContentId, setHoveredContentId] = useState<string | null>(null);

  // Fetch all scheduled and published content
  useEffect(() => {
    fetchContent();
  }, [selectedBrand?.id]);

  const fetchContent = async () => {
    setIsLoading(true);
    try {
      // Fetch scheduled, published, and approved content
      const params = selectedBrand?.id ? `brandId=${selectedBrand.id}&` : "";
      const [scheduledRes, publishedRes, approvedRes] = await Promise.all([
        fetch(`/api/content?${params}status=scheduled&limit=100`),
        fetch(`/api/content?${params}status=published&limit=100`),
        fetch(`/api/content?${params}status=approved&limit=50`),
      ]);

      const [scheduledData, publishedData, approvedData] = await Promise.all([
        scheduledRes.json(),
        publishedRes.json(),
        approvedRes.json(),
      ]);

      const allContent = [
        ...(scheduledData.content || []),
        ...(publishedData.content || []),
        ...(approvedData.content || []),
      ];

      setContent(allContent);

      // Fetch images for content with images
      for (const item of allContent) {
        if (item.id && !contentImages[item.id]) {
          fetchImageForContent(item.id);
        }
      }
    } catch (error) {
      console.error("Error fetching content:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchImageForContent = async (contentId: string) => {
    try {
      const res = await fetch(`/api/images/generate?contentId=${contentId}`);
      const data = await res.json();
      if (data.success && data.images && data.images.length > 0) {
        const firstValidImage = data.images.find((img: ContentImage) =>
          img.url && !img.url.startsWith("placeholder:")
        );
        if (firstValidImage) {
          setContentImages(prev => ({
            ...prev,
            [contentId]: firstValidImage.url
          }));
        }
      }
    } catch (err) {
      console.error("Error fetching image:", err);
    }
  };

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  // Build calendar grid (6 weeks x 7 days = 42 cells)
  const calendarDays = useMemo(() => {
    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Previous month days
    const prevMonth = new Date(year, month, 0);
    const prevMonthDays = prevMonth.getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: new Date(year, month, day),
        isCurrentMonth: true,
      });
    }

    // Next month days to fill the grid
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [year, month, startingDayOfWeek, daysInMonth]);

  // Week view days
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  }, [currentDate]);

  // Group content by date
  const contentByDate = useMemo(() => {
    const map: Record<string, Content[]> = {};
    content.forEach((item) => {
      const dateStr = item.scheduled_for
        ? new Date(item.scheduled_for).toDateString()
        : item.published_at
        ? new Date(item.published_at).toDateString()
        : null;

      if (dateStr) {
        if (!map[dateStr]) {
          map[dateStr] = [];
        }
        map[dateStr].push(item);
      }
    });
    return map;
  }, [content]);

  // Get content for a specific date
  const getContentForDate = (date: Date) => {
    return contentByDate[date.toDateString()] || [];
  };

  // Get upcoming scheduled content (next 7 days)
  const upcomingContent = useMemo(() => {
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return content
      .filter((item) => {
        if (item.status !== "scheduled" || !item.scheduled_for) return false;
        const scheduledDate = new Date(item.scheduled_for);
        return scheduledDate >= now && scheduledDate <= sevenDaysLater;
      })
      .sort(
        (a, b) =>
          new Date(a.scheduled_for!).getTime() -
          new Date(b.scheduled_for!).getTime()
      );
  }, [content]);

  // Get approved content ready to schedule
  const readyToSchedule = useMemo(() => {
    return content.filter((item) => item.status === "approved");
  }, [content]);

  // Navigation handlers
  const goToPrevious = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(year, month - 1, 1));
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() - 7);
      setCurrentDate(newDate);
    }
  };

  const goToNext = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(year, month + 1, 1));
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + 7);
      setCurrentDate(newDate);
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Reschedule handler
  const handleReschedule = async () => {
    if (!selectedContent || !newScheduleDate) return;

    setIsRescheduling(true);
    try {
      const scheduledFor = new Date(newScheduleDate).toISOString();

      const res = await fetch("/api/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedContent.id,
          scheduled_for: scheduledFor,
          status: "scheduled",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "Content rescheduled successfully" });
        setRescheduleDialogOpen(false);
        fetchContent();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to reschedule" });
      }
    } catch (error) {
      console.error("Error rescheduling:", error);
      setMessage({ type: "error", text: "Network error - please try again" });
    } finally {
      setIsRescheduling(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Unschedule handler
  const handleUnschedule = async (contentId: string) => {
    setIsUnscheduling(contentId);
    try {
      const res = await fetch("/api/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: contentId,
          scheduled_for: null,
          status: "approved",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "Content unscheduled" });
        fetchContent();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to unschedule" });
      }
    } catch (error) {
      console.error("Error unscheduling:", error);
      setMessage({ type: "error", text: "Network error - please try again" });
    } finally {
      setIsUnscheduling(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Open reschedule dialog
  const openRescheduleDialog = (item: Content) => {
    setSelectedContent(item);
    const defaultDate = item.scheduled_for
      ? new Date(item.scheduled_for).toISOString().slice(0, 16)
      : (() => {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(9, 0, 0, 0);
          return tomorrow.toISOString().slice(0, 16);
        })();
    setNewScheduleDate(defaultDate);
    setRescheduleDialogOpen(true);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  const selectedDateContent = selectedDate ? getContentForDate(selectedDate) : [];

  // Render content card for calendar
  const renderContentPill = (item: Content, isCompact = true) => {
    const hasImage = contentImages[item.id];
    const hasCarousel = item.copy_carousel_slides && item.copy_carousel_slides.length > 0;

    if (isCompact) {
      return (
        <TooltipProvider key={item.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] cursor-pointer transition-all hover:ring-2 hover:ring-primary/50",
                  item.status === "published" ? "bg-emerald-500/20" : "bg-blue-500/20"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  openRescheduleDialog(item);
                }}
                onMouseEnter={() => setHoveredContentId(item.id)}
                onMouseLeave={() => setHoveredContentId(null)}
              >
                <div className={cn("w-4 h-4 rounded flex items-center justify-center text-white", platformColors[item.platform])}>
                  {platformIcons[item.platform]}
                </div>
                <span className="truncate max-w-[80px]">
                  {item.scheduled_for && new Date(item.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="w-64 p-0">
              <div className="p-3">
                {hasImage && (
                  <div className="mb-2 rounded-md overflow-hidden aspect-[4/3]">
                    <img src={hasImage} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <p className="text-sm font-medium mb-1">
                  {item.ideas?.concept || item.copy_primary.slice(0, 60)}...
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn("text-[10px]", statusColors[item.status])}>
                    {item.status}
                  </Badge>
                  {hasCarousel && (
                    <Badge variant="secondary" className="text-[10px]">
                      <Images className="h-2.5 w-2.5 mr-1" />
                      {item.copy_carousel_slides?.length}
                    </Badge>
                  )}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <div
        key={item.id}
        className="flex items-start gap-3 rounded-lg border p-3 bg-card hover:bg-muted/50 transition-colors cursor-pointer group"
        onClick={() => openRescheduleDialog(item)}
      >
        {hasImage && (
          <div className="w-14 h-14 rounded-md overflow-hidden flex-shrink-0">
            <img src={hasImage} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <div
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded text-white flex-shrink-0",
                platformColors[item.platform] || "bg-gray-500"
              )}
            >
              {platformIcons[item.platform] || <FileText className="h-3 w-3" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {item.ideas?.concept || item.copy_primary.slice(0, 40)}...
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={cn("text-[10px]", statusColors[item.status])}>
                  {item.status}
                </Badge>
                {item.scheduled_for && (
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(item.scheduled_for).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
                {hasCarousel && (
                  <Badge variant="secondary" className="text-[10px] h-4">
                    <Images className="mr-1 h-2.5 w-2.5" />
                    {item.copy_carousel_slides?.length}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {item.status === "scheduled" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-red-500"
              onClick={(e) => {
                e.stopPropagation();
                handleUnschedule(item.id);
              }}
              disabled={isUnscheduling === item.id}
            >
              {isUnscheduling === item.id ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <X className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      </div>
    );
  };

  // Render week view
  const renderWeekView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="border rounded-xl overflow-hidden bg-card">
        {/* Week header */}
        <div className="grid grid-cols-8 border-b">
          <div className="p-3 border-r bg-muted/30">
            <span className="text-xs text-muted-foreground">Time</span>
          </div>
          {weekDays.map((day, idx) => (
            <div
              key={idx}
              className={cn(
                "p-3 text-center cursor-pointer transition-colors",
                isToday(day) && "bg-primary/10",
                isSelected(day) && "bg-primary/20",
                idx < 6 && "border-r"
              )}
              onClick={() => setSelectedDate(day)}
            >
              <p className="text-xs text-muted-foreground">
                {day.toLocaleDateString("en-US", { weekday: "short" })}
              </p>
              <p className={cn(
                "text-lg font-semibold",
                isToday(day) && "text-primary"
              )}>
                {day.getDate()}
              </p>
              {getContentForDate(day).length > 0 && (
                <div className="flex justify-center gap-0.5 mt-1">
                  {getContentForDate(day).slice(0, 3).map((item, i) => (
                    <div key={i} className={cn("h-1.5 w-1.5 rounded-full", statusDotColors[item.status])} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Time grid */}
        <div className="max-h-[500px] overflow-y-auto">
          {hours.slice(6, 22).map((hour) => (
            <div key={hour} className="grid grid-cols-8 border-b last:border-b-0">
              <div className="p-2 border-r bg-muted/10 text-xs text-muted-foreground text-right pr-3">
                {hour.toString().padStart(2, '0')}:00
              </div>
              {weekDays.map((day, idx) => {
                const dayContent = getContentForDate(day).filter((item) => {
                  if (!item.scheduled_for) return false;
                  const scheduledHour = new Date(item.scheduled_for).getHours();
                  return scheduledHour === hour;
                });

                return (
                  <div
                    key={idx}
                    className={cn(
                      "p-1 min-h-[50px]",
                      idx < 6 && "border-r",
                      isToday(day) && "bg-primary/5"
                    )}
                  >
                    {dayContent.map((item) => renderContentPill(item, true))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Calendar</h1>
          <p className="text-muted-foreground">
            Plan and schedule your content publishing
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center rounded-lg border p-1">
            <Button
              variant={viewMode === "month" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setViewMode("month")}
            >
              Month
            </Button>
            <Button
              variant={viewMode === "week" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setViewMode("week")}
            >
              Week
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={fetchContent}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-3",
            message.type === "success"
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "bg-red-500/20 text-red-400 border border-red-500/30"
          )}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {message.text}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-4 lg:grid-cols-3">
        {/* Calendar */}
        <Card className={cn(viewMode === "week" ? "xl:col-span-4 lg:col-span-3" : "xl:col-span-3 lg:col-span-2")}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <Button variant="outline" size="icon" onClick={goToPrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-xl">
                {viewMode === "month"
                  ? monthName
                  : `${weekDays[0].toLocaleDateString("default", { month: "short", day: "numeric" })} - ${weekDays[6].toLocaleDateString("default", { month: "short", day: "numeric", year: "numeric" })}`
                }
              </CardTitle>
              <Button variant="outline" size="icon" onClick={goToNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : viewMode === "week" ? (
              renderWeekView()
            ) : (
              <>
                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (day) => (
                      <div
                        key={day}
                        className="p-2 text-xs font-medium text-muted-foreground"
                      >
                        {day}
                      </div>
                    )
                  )}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map(({ date, isCurrentMonth }, index) => {
                    const dayContent = getContentForDate(date);
                    const hasContent = dayContent.length > 0;
                    const scheduledCount = dayContent.filter(
                      (c) => c.status === "scheduled"
                    ).length;
                    const publishedCount = dayContent.filter(
                      (c) => c.status === "published"
                    ).length;

                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedDate(date)}
                        className={cn(
                          "relative min-h-[100px] rounded-lg p-2 text-left transition-all hover:bg-muted/80 border",
                          !isCurrentMonth && "text-muted-foreground/30 bg-muted/20",
                          isCurrentMonth && "bg-card",
                          isToday(date) && isCurrentMonth && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                          isSelected(date) && "bg-primary/10 border-primary"
                        )}
                      >
                        {/* Date number */}
                        <span
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium",
                            isToday(date) && isCurrentMonth && "bg-primary text-primary-foreground"
                          )}
                        >
                          {date.getDate()}
                        </span>

                        {/* Content previews */}
                        {hasContent && isCurrentMonth && (
                          <div className="mt-1 space-y-1">
                            {dayContent.slice(0, 2).map((item) => renderContentPill(item, true))}
                            {dayContent.length > 2 && (
                              <p className="text-[10px] text-muted-foreground text-center">
                                +{dayContent.length - 2} more
                              </p>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="mt-4 flex items-center justify-center gap-6 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <span>Scheduled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span>Published</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-amber-500" />
                    <span>Approved</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Sidebar - only show in month view */}
        {viewMode === "month" && (
          <div className="space-y-6">
            {/* Selected Date Content */}
            {selectedDate && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {selectedDate.toLocaleDateString("default", {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                      })}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setSelectedDate(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription>
                    {selectedDateContent.length} post
                    {selectedDateContent.length !== 1 ? "s" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {selectedDateContent.length === 0 ? (
                    <div className="text-center py-6">
                      <CalendarIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                      <p className="text-sm text-muted-foreground">
                        No posts on this date
                      </p>
                      <Button variant="outline" size="sm" className="mt-3">
                        <Plus className="h-3 w-3 mr-1" />
                        Schedule content
                      </Button>
                    </div>
                  ) : (
                    selectedDateContent.map((item) => renderContentPill(item, false))
                  )}
                </CardContent>
              </Card>
            )}

            {/* Upcoming Posts */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Upcoming
                </CardTitle>
                <CardDescription>Next 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : upcomingContent.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6">
                    <CalendarIcon className="mb-3 h-8 w-8 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground text-center">
                      No posts scheduled
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {upcomingContent.slice(0, 5).map((item) => renderContentPill(item, false))}
                    {upcomingContent.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center pt-2">
                        +{upcomingContent.length - 5} more scheduled
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ready to Schedule */}
            {readyToSchedule.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Ready to Schedule
                  </CardTitle>
                  <CardDescription>Approved & waiting</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {readyToSchedule.slice(0, 3).map((item) => renderContentPill(item, false))}
                    {readyToSchedule.length > 3 && (
                      <a
                        href="/content?status=approved"
                        className="block text-xs text-primary text-center pt-2 hover:underline"
                      >
                        View all {readyToSchedule.length} approved posts
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedContent?.status === "approved" ? "Schedule" : "Reschedule"} Post
            </DialogTitle>
            <DialogDescription>
              {selectedContent?.status === "approved"
                ? "Choose when you want this content to be published."
                : "Select a new date and time for this post."}
            </DialogDescription>
          </DialogHeader>
          {selectedContent && (
            <div className="py-4 space-y-4">
              {/* Content Preview */}
              <div className="flex items-start gap-3 rounded-lg border p-3 bg-muted/30">
                {contentImages[selectedContent.id] && (
                  <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                    <img
                      src={contentImages[selectedContent.id]}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded text-white flex-shrink-0",
                        platformColors[selectedContent.platform] || "bg-gray-500"
                      )}
                    >
                      {platformIcons[selectedContent.platform] || <FileText className="h-3 w-3" />}
                    </div>
                    <p className="text-sm font-medium truncate">
                      {selectedContent.ideas?.concept || selectedContent.copy_primary.slice(0, 40)}...
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">
                    {selectedContent.platform} • {selectedContent.copy_carousel_slides?.length || 0} slides
                  </p>
                </div>
              </div>

              {/* Date Time Input */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Date and Time
                </label>
                <Input
                  type="datetime-local"
                  value={newScheduleDate}
                  onChange={(e) => setNewScheduleDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRescheduleDialogOpen(false)}
              disabled={isRescheduling}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReschedule}
              disabled={isRescheduling || !newScheduleDate}
            >
              {isRescheduling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {selectedContent?.status === "approved"
                    ? "Scheduling..."
                    : "Rescheduling..."}
                </>
              ) : (
                <>
                  <Clock className="mr-2 h-4 w-4" />
                  {selectedContent?.status === "approved"
                    ? "Schedule"
                    : "Reschedule"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
