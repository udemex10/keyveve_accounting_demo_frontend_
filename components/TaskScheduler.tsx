"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { format, addDays, differenceInDays, isPast, isToday, isSameDay, isWithinInterval } from "date-fns";
import axios from "axios";
import {
  Calendar as CalendarIcon,
  Users,
  CalendarDays,
  Clock,
  Check,
  AlertCircle,
  Loader2,
  BellRing,
  X,
  CheckCircle,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ArrowRightLeft,
  RefreshCw,
  Cloud,
  StickyNote,
  Plus,
  Trash2
} from "lucide-react";

/* ------------------------------------------------------------------
   Constants & Types
-------------------------------------------------------------------*/
const API_BASE_URL = "http://localhost:8000"; // still used for scheduling

// Calendar integration statuses
const CALENDAR_INTEGRATIONS = {
  outlook: { name: "Outlook Calendar", color: "blue" },
  google: { name: "Google Calendar", color: "red" },
};

interface Note {
  id: string; // uuid
  author: string;
  text: string;
  timestamp: string; // ISO
}

const TaskScheduler = ({ project, staffMembers, onTaskScheduled }) => {
  const { toast } = useToast();

  /* ------------------------------------------------------------------
   * Scheduling related state (existing)
   * ------------------------------------------------------------------*/
  const [selectedTask, setSelectedTask] = useState(null);
  const [schedulerOpen, setSchedulerOpen] = useState(false);
  const [staffId, setStaffId] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(addDays(new Date(), 1));
  const [calendarType, setCalendarType] = useState("none");
  const [calendarSyncInProgress, setCalendarSyncInProgress] = useState(false);
  const [viewMode, setViewMode] = useState("list");  // 'list' or 'calendar'
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [syncStatus, setSyncStatus] = useState({ syncing: false, lastSynced: null });
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [integrationStatus, setIntegrationStatus] = useState({
    outlook: true,
    google: false
  });

  /* ---------------- local notes state ---------------- */
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [noteInput, setNoteInput] = useState("");
  const [selectedTaskForNotes, setSelectedTaskForNotes] = useState(null);
  const [notesByTask, setNotesByTask] = useState<{ [taskId: number]: Note[] }>(
    {}
  );

  /* ---------------- helper fns ---------------- */
  const getStaffName = (id) =>
    staffMembers.find((s) => s.id === id)?.name || "Unknown";

  const addLocalNote = () => {
    if (!noteInput.trim() || !selectedTaskForNotes) return;
    const newNote: Note = {
      id: crypto.randomUUID(),
      author: "You", // or current user
      text: noteInput.trim(),
      timestamp: new Date().toISOString(),
    };
    setNotesByTask((prev) => {
      const existing = prev[selectedTaskForNotes.id] || [];
      return { ...prev, [selectedTaskForNotes.id]: [...existing, newNote] };
    });
    setNoteInput("");
  };

  const deleteLocalNote = (taskId: number, noteId: string) => {
    setNotesByTask((prev) => ({
      ...prev,
      [taskId]: prev[taskId].filter((n) => n.id !== noteId),
    }));
  };

  /* ------------------------------------------------------------------
   * Effects – load calendar events
   * ------------------------------------------------------------------*/
  useEffect(() => {
    if (!project?.tasks) return;
    const events = [];
    project.tasks.forEach((task) => {
      if (task.scheduled_start) {
        events.push({
          id: `task-${task.id}`,
          title: task.title,
          start: new Date(task.scheduled_start),
          end: task.scheduled_end ? new Date(task.scheduled_end) : null,
          assignee: task.assigned_to?.[0] || null,
          calendarType: "outlook", // mocked
          status: task.status,
          taskId: task.id,
        });
      }
    });
    setCalendarEvents(events);
  }, [project]);

  /* ------------------------------------------------------------------
   * Handlers – scheduling
   * ------------------------------------------------------------------*/
  const handleSelectTask = (task) => {
    setSelectedTask(task);
    setStaffId(task.assigned_to?.[0] || "");
    if (task.scheduled_start) setStartDate(new Date(task.scheduled_start));
    if (task.scheduled_end) setEndDate(new Date(task.scheduled_end));
    else setEndDate(addDays(new Date(task.scheduled_start || new Date()), 1));
    setSchedulerOpen(true);
  };

  // Schedule task and sync to calendar if needed
  const handleScheduleTask = async () => {
    if (!selectedTask || !staffId || !startDate) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please provide all required scheduling information."
      });
      return;
    }

    try {
      setCalendarSyncInProgress(true);

      // Format dates for API
      const formattedStartDate = format(startDate, "yyyy-MM-dd'T'HH:mm:ss");
      const formattedEndDate = format(endDate || startDate, "yyyy-MM-dd'T'HH:mm:ss");

      // Check if syncToCalendar is requested
      const calendarSync = calendarType !== "none" ? calendarType : null;

      // Call API to schedule task
      const response = await axios.post(`${API_BASE_URL}/tasks/${selectedTask.id}/schedule`, {
        task_id: selectedTask.id,
        staff_id: staffId,
        scheduled_start: formattedStartDate,
        scheduled_end: formattedEndDate,
        sync_to_calendar: calendarSync
      });

      // Handle calendar sync (mock for the prototype)
      if (calendarSync) {
        // Simulate calendar API delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Add to local calendar events
        setCalendarEvents(prev => [
          ...prev,
          {
            id: `task-${selectedTask.id}`,
            title: selectedTask.title,
            start: startDate,
            end: endDate,
            assignee: staffId,
            calendarType: calendarSync,
            status: selectedTask.status,
            taskId: selectedTask.id
          }
        ]);

        setSyncStatus({
          syncing: false,
          lastSynced: new Date().toISOString()
        });
      }

      // Update task in UI (normally this would be handled by reloading the project)
      if (onTaskScheduled) {
        onTaskScheduled({
          ...selectedTask,
          scheduled_start: formattedStartDate,
          scheduled_end: formattedEndDate,
          assigned_to: [staffId]
        });
      }

      toast({
        title: "Task scheduled",
        description: `Task "${selectedTask.title}" scheduled successfully${
          calendarSync ? ` and synced to ${CALENDAR_INTEGRATIONS[calendarSync].name}` : ""
        }.`
      });

      setSchedulerOpen(false);
    } catch (error) {
      console.error("Error scheduling task:", error);
      toast({
        variant: "destructive",
        title: "Scheduling failed",
        description: "Could not schedule task. Please try again."
      });
    } finally {
      setCalendarSyncInProgress(false);
    }
  };

  // Handle calendar navigation
  const handlePreviousMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentMonth(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentMonth(newDate);
  };

  // Connect calendar integration
  const handleConnectCalendar = async (calendarType) => {
    try {
      setSyncStatus({ syncing: true, lastSynced: null });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      setIntegrationStatus(prev => ({
        ...prev,
        [calendarType]: !prev[calendarType]
      }));

      setSyncStatus({
        syncing: false,
        lastSynced: new Date().toISOString()
      });

      toast({
        title: integrationStatus[calendarType] ? "Disconnected" : "Connected",
        description: `${CALENDAR_INTEGRATIONS[calendarType].name} has been ${
          integrationStatus[calendarType] ? "disconnected" : "connected"
        } successfully.`
      });
    } catch (error) {
      console.error(`Error ${integrationStatus[calendarType] ? "disconnecting" : "connecting"} calendar:`, error);
      toast({
        variant: "destructive",
        title: "Integration failed",
        description: `Could not ${integrationStatus[calendarType] ? "disconnect" : "connect"} calendar integration.`
      });
      setSyncStatus({ syncing: false, lastSynced: null });
    }
  };

  // Sync all events with calendar
  const handleSyncCalendar = async () => {
    try {
      setSyncStatus({ syncing: true, lastSynced: null });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      setSyncStatus({
        syncing: false,
        lastSynced: new Date().toISOString()
      });

      toast({
        title: "Calendar synced",
        description: "All scheduled tasks have been synced with your calendar."
      });
    } catch (error) {
      console.error("Error syncing calendar:", error);
      toast({
        variant: "destructive",
        title: "Sync failed",
        description: "Could not sync with calendar. Please try again."
      });
      setSyncStatus({ syncing: false, lastSynced: null });
    }
  };

  /* ---------------- notes dialog renderer ---------------- */
  const renderNotesDialog = () => (
    <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StickyNote className="h-5 w-5 text-primary" /> Notes for "
            {selectedTaskForNotes?.title}"
          </DialogTitle>
          <DialogDescription>
            Add quick internal notes. They stay only in this session.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-72 overflow-y-auto">
          {(notesByTask[selectedTaskForNotes?.id] || []).map((note) => (
            <div
              key={note.id}
              className="border rounded-md p-3 bg-muted/30 flex items-start gap-3"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {note.author.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm">{note.author}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(note.timestamp), "MMM d, yyyy h:mma")}
                  </span>
                </div>
                <p className="text-sm mt-1 whitespace-pre-wrap">{note.text}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-0"
                onClick={() => deleteLocalNote(selectedTaskForNotes.id, note.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}

          {/* Add note input */}
          <div className="flex items-start gap-2">
            <Input
              placeholder="Add a note..."
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addLocalNote();
              }}
            />
            <Button onClick={addLocalNote} className="gap-1">
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setNotesDialogOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Generate calendar grid for month view
  const generateCalendarGrid = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // Get first day of the month
    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay();

    // Get last day of the month
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();

    // Create grid with padding for days before first day of month
    const grid = [];
    let day = 1;

    // Generate 6 rows (max possible for a month)
    for (let i = 0; i < 6; i++) {
      const week = [];

      // Generate 7 columns (days of week)
      for (let j = 0; j < 7; j++) {
        if ((i === 0 && j < startingDayOfWeek) || day > totalDays) {
          // Padding for days not in current month
          week.push(null);
        } else {
          // Valid day in current month
          const date = new Date(year, month, day);

          // Find events for this day
          const dayEvents = calendarEvents.filter(event => {
            // Check if event starts or ends on this day, or spans over this day
            return (
              isSameDay(event.start, date) ||
              (event.end && isSameDay(event.end, date)) ||
              (event.end && isWithinInterval(date, { start: event.start, end: event.end }))
            );
          });

          week.push({
            date,
            day,
            events: dayEvents
          });

          day++;
        }
      }

      grid.push(week);

      // Stop if we've used all days of the month
      if (day > totalDays) {
        break;
      }
    }

    return grid;
  };

  // Render calendar day cell with events
  const renderCalendarDay = (dayData) => {
    if (!dayData) {
      return <div className="h-24 border bg-muted/20"></div>;
    }

    const isCurrentDay = isToday(dayData.date);
    const isPastDay = isPast(dayData.date) && !isToday(dayData.date);

    return (
      <div
        className={`h-24 border overflow-hidden ${
          isCurrentDay 
            ? "bg-primary/5 border-primary" 
            : isPastDay 
              ? "bg-muted/10 text-muted-foreground" 
              : ""
        }`}
      >
        <div className="flex justify-between items-center p-1">
          <span className={`text-xs ${isCurrentDay ? "font-bold text-primary" : ""}`}>
            {dayData.day}
          </span>
          {dayData.events.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {dayData.events.length}
            </Badge>
          )}
        </div>

        <ScrollArea className="h-[calc(100%-20px)]">
          <div className="p-1 space-y-1">
            {dayData.events.slice(0, 3).map((event, i) => (
              <div
                key={`${event.id}-${i}`}
                className={`text-xs rounded p-1 truncate border-l-2 ${
                  event.calendarType === "outlook" 
                    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-400" 
                    : "bg-red-50 dark:bg-red-900/20 border-red-400"
                }`}
              >
                {event.title}
              </div>
            ))}

            {dayData.events.length > 3 && (
              <div className="text-xs text-muted-foreground text-center">
                +{dayData.events.length - 3} more
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Main Task Scheduler Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <CardTitle className="flex items-center">
                <CalendarDays className="h-5 w-5 mr-2 text-primary" />
                Task Scheduling & Calendar
              </CardTitle>
              <CardDescription>
                Schedule tasks and sync with your calendar
              </CardDescription>
            </div>

            <div className="flex gap-2">
              <div className="flex border rounded-md overflow-hidden">
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-none px-3"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "calendar" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-none px-3"
                  onClick={() => setViewMode("calendar")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <ArrowRightLeft className="h-4 w-4" />
                    Calendar Settings
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Calendar Integrations</DialogTitle>
                    <DialogDescription>
                      Connect your calendars to sync scheduled tasks
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="space-y-4">
                      {Object.entries(CALENDAR_INTEGRATIONS).map(([type, info]) => (
                        <div key={type} className="flex items-center justify-between border rounded-lg p-3">
                          <div className="flex items-center gap-3">
                            <div className={`rounded-full w-8 h-8 flex items-center justify-center bg-${info.color}-100 text-${info.color}-600`}>
                              <CalendarIcon className="h-4 w-4" />
                            </div>
                            <div>
                              <h4 className="font-medium">{info.name}</h4>
                              <p className="text-xs text-muted-foreground">
                                {integrationStatus[type] ? "Connected" : "Not connected"}
                              </p>
                            </div>
                          </div>

                          <Button
                            variant={integrationStatus[type] ? "destructive" : "outline"}
                            size="sm"
                            onClick={() => handleConnectCalendar(type)}
                            disabled={syncStatus.syncing}
                          >
                            {syncStatus.syncing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : integrationStatus[type] ? (
                              "Disconnect"
                            ) : (
                              "Connect"
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-lg border p-3 bg-muted/30">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">Sync Calendar</h4>
                          <p className="text-xs text-muted-foreground">
                            Sync all scheduled tasks with connected calendars
                          </p>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={handleSyncCalendar}
                          disabled={syncStatus.syncing || (!integrationStatus.outlook && !integrationStatus.google)}
                        >
                          {syncStatus.syncing ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Syncing...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4" />
                              Sync Now
                            </>
                          )}
                        </Button>
                      </div>

                      {syncStatus.lastSynced && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Last synced: {format(new Date(syncStatus.lastSynced), "MMM d, yyyy h:mm a")}
                        </p>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {viewMode === "list" ? (
            // LIST VIEW
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {project?.tasks && project.tasks.length > 0 ? (
                    project.tasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">{task.title}</TableCell>
                        <TableCell>
                          {task.assigned_to && task.assigned_to.length > 0 ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {getStaffName(task.assigned_to[0])?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{getStaffName(task.assigned_to[0])}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={task.status === "completed" ? "default" : "outline"} className={
                            task.status === "completed"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : task.status === "in_progress"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                : task.status === "blocked"
                                  ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                          }>
                            {task.status === "completed" ? "Completed" :
                             task.status === "in_progress" ? "In Progress" :
                             task.status === "blocked" ? "Blocked" : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {task.scheduled_start ? (
                            <div className="flex flex-col">
                              <span className="text-sm">
                                {format(new Date(task.scheduled_start), "MMM d, yyyy")}
                              </span>
                              {task.scheduled_end && (
                                <span className="text-xs text-muted-foreground">
                                  to {format(new Date(task.scheduled_end), "MMM d, yyyy")}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Not scheduled</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              onClick={() => { setSelectedTaskForNotes(task); setNotesDialogOpen(true); }}
                            >
                              <StickyNote className="h-4 w-4" />
                              Notes
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => handleSelectTask(task)}
                            >
                              <CalendarIcon className="h-4 w-4" />
                              Schedule
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                        No tasks found for this project
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {project?.tasks && project.tasks.some(task => task.scheduled_start) && (
                <div className="rounded-lg border p-3 bg-blue-50/50 dark:bg-blue-900/10">
                  <div className="flex items-start">
                    <Cloud className="h-5 w-5 text-blue-600 dark:text-blue-500 mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-800 dark:text-blue-400">Calendar Integration</p>
                      <p className="text-sm text-blue-700 dark:text-blue-500">
                        Keep your team in sync by connecting your calendar and sharing schedules.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // CALENDAR VIEW
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Button variant="ghost" size="sm" onClick={handlePreviousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Previous month</span>
                </Button>

                <h3 className="font-medium">
                  {format(currentMonth, "MMMM yyyy")}
                </h3>

                <Button variant="ghost" size="sm" onClick={handleNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Next month</span>
                </Button>
              </div>

              <div className="grid grid-cols-7 mb-1">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-center text-xs font-medium py-1">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {generateCalendarGrid().map((week, i) => (
                  week.map((day, j) => (
                    <div key={`${i}-${j}`}>
                      {renderCalendarDay(day)}
                    </div>
                  ))
                ))}
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 rounded-sm bg-blue-400"></div>
                    <span className="text-xs">Outlook</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 rounded-sm bg-red-400"></div>
                    <span className="text-xs">Google</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleSyncCalendar}
                  disabled={syncStatus.syncing || (!integrationStatus.outlook && !integrationStatus.google)}
                >
                  {syncStatus.syncing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Sync Calendar
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Scheduler Dialog */}
      <Dialog open={schedulerOpen} onOpenChange={setSchedulerOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Schedule Task</DialogTitle>
            <DialogDescription>
              Assign and schedule this task to a team member's calendar
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {selectedTask && (
              <div className="rounded-lg p-3 bg-muted/30 border">
                <h4 className="font-medium">{selectedTask.title}</h4>
                {selectedTask.description && (
                  <p className="text-sm text-muted-foreground mt-1">{selectedTask.description}</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-start">
              <div className="sm:col-span-4 space-y-2">
                <Label htmlFor="assignee">Assign To</Label>
                <Select
                  value={staffId}
                  onValueChange={setStaffId}
                >
                  <SelectTrigger id="assignee" className="w-full">
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffMembers.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.name} ({staff.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-2 space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(startDate, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {
                        setStartDate(date);
                        // If end date is before start date, update it
                        if (endDate && date > endDate) {
                          setEndDate(addDays(date, 1));
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="sm:col-span-2 space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) => date < startDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="sm:col-span-4 space-y-3">
                <Label>Sync to Calendar</Label>
                <RadioGroup
                  defaultValue={calendarType}
                  onValueChange={setCalendarType}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="r0" />
                    <Label htmlFor="r0" className="cursor-pointer">Don't sync to calendar</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="outlook"
                      id="r1"
                      disabled={!integrationStatus.outlook}
                    />
                    <Label
                      htmlFor="r1"
                      className={`cursor-pointer flex items-center gap-2 ${!integrationStatus.outlook ? "text-muted-foreground" : ""}`}
                    >
                      <CalendarIcon className="h-4 w-4 text-blue-500" />
                      Outlook Calendar
                      {!integrationStatus.outlook && (
                        <Badge variant="outline" className="text-xs">
                          Not Connected
                        </Badge>
                      )}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="google"
                      id="r2"
                      disabled={!integrationStatus.google}
                    />
                    <Label
                      htmlFor="r2"
                      className={`cursor-pointer flex items-center gap-2 ${!integrationStatus.google ? "text-muted-foreground" : ""}`}
                    >
                      <CalendarIcon className="h-4 w-4 text-red-500" />
                      Google Calendar
                      {!integrationStatus.google && (
                        <Badge variant="outline" className="text-xs">
                          Not Connected
                        </Badge>
                      )}
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSchedulerOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleScheduleTask}
              disabled={calendarSyncInProgress}
              className="gap-2"
            >
              {calendarSyncInProgress ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CalendarIcon className="h-4 w-4" />
                  Schedule Task
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Render the notes dialog (logic defined in helper function) */}
      {renderNotesDialog()}
    </div>
  );
};

export default TaskScheduler;