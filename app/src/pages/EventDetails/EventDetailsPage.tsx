import {
    Box,
    Button,
    Divider,
    Stack,
    List,
    ListItem,
    ListItemText,
    Typography,
    Avatar,
    Chip,
} from "@mui/material"
import { useEffect, useState } from "react"
import { useParams } from "@tanstack/react-router"
import { apiService } from "@/api"
import { InfoBox } from "@/components/InfoBox/InfoBox"
import { PageLayout } from "../../components/PageLayout/PageLayout"
import { EventChat } from "../../components/EventChat/EventChat"

interface Event {
    id: string
    title: string
    city: string
    city_district: string | null
    category: string
    start_time: string
    end_time: string
    description: string
}

interface EventUser {
    id: string
    name: string
    email: string
}

// Generate a random color code
const generateRandomColor = (): string => {
    const hue = Math.floor(Math.random() * 360)
    const saturation = Math.floor(Math.random() * 30) + 70 // 70-100%
    const lightness = Math.floor(Math.random() * 20) + 50 // 50-70%
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

// formattera datum SE:
const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("sv-SE", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    })
}

// event längd:
const getDuration = (start: string, end: string) => {
    const diffMs = new Date(end).getTime() - new Date(start).getTime()
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    if (hours === 0) return `${minutes} min`
    if (minutes === 0) return `${hours} tim`
    return `${hours} h ${minutes} min`
}

export const EventDetailsPage = () => {
    const { eventId } = useParams({ from: "/events-detail/$eventId" })
    const [event, setEvent] = useState<Event | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [isRegistered, setIsRegistered] = useState(false)
    const [participants, setParticipants] = useState<EventUser[]>([])
    const [userInfoMap, setUserInfoMap] = useState<Record<string, { color: string; name: string }>>({})
   // const currentUserId = "current-user" // TODO: Get from auth context

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch event details
                const eventResponse = await apiService.getEvent(eventId)
                if (eventResponse.ok) {
                    const eventData = await eventResponse.json()
                    setEvent(eventData)
                } else {
                    setError("Kunde inte hämta eventdetaljer")
                }

                // Fetch registered users for this event
                const usersResponse = await apiService.getEventRegistrations(eventId)
                if (usersResponse.ok) {
                    const usersData = await usersResponse.json()
                    const users = usersData.registrations || []
                    setParticipants(users)

                    // Build user info map for each user (color + name)
                    const infoMap: Record<string, { color: string; name: string }> = {}
                    users.forEach((user: EventUser) => {
                        infoMap[user.id] = {
                            color: generateRandomColor(),
                            name: user.name,
                        }
                    })
                    setUserInfoMap(infoMap)
                }

                // TODO: Check if user is registered for this event
                setIsRegistered(true)
            } catch (_error) {
                setError("Ett fel uppstod vid hämtning av data")
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [eventId])



    const handleJoinEvent = () => {
        setIsRegistered(true)
        // TODO: Call API to register user for event
    }

    const handleLeaveEvent = () => {
        setIsRegistered(false)
        // TODO: Call API to unregister user from event
    }

    if (loading) {
        return (
            <PageLayout>
                <Typography>Laddar eventdetaljer...</Typography>
            </PageLayout>
        )
    }

    if (error || !event) {
        return (
            <PageLayout>
                <Typography color="error">{error || "Event hittades inte"}</Typography>
            </PageLayout>
        )
    }

    return (
        <PageLayout>
            <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={3}
                sx={{
                    mb: 4,
                }}
            >
                {/* Event Details Column */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack spacing={3}>
                        {/* Event Header */}
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
                                {event.title}
                            </Typography>
                            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                                <Chip label={event.category} color="primary" variant="outlined" />
                                <Chip
                                    label={`${event.city}${event.city_district ? `, ${event.city_district}` : ""}`}
                                    variant="outlined"
                                />
                            </Stack>
                        </Box>

                        {/* Event Information */}
                        <InfoBox>
                            <Stack spacing={2}>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "text.secondary" }}>
                                        Starttid
                                    </Typography>
                                    <Typography variant="body1">{formatDate(event.start_time)}</Typography>
                                </Box>

                                <Divider />

                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "text.secondary" }}>
                                        Sluttid
                                    </Typography>
                                    <Typography variant="body1">{formatDate(event.end_time)}</Typography>
                                </Box>

                                <Divider />

                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "text.secondary" }}>
                                        Varaktighet
                                    </Typography>
                                    <Typography variant="body1">
                                        {getDuration(event.start_time, event.end_time)}
                                    </Typography>
                                </Box>

                                <Divider />

                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "text.secondary" }}>
                                        Beskrivning
                                    </Typography>
                                    <Typography variant="body1">{event.description}</Typography>
                                </Box>
                            </Stack>
                        </InfoBox>

                        {/* Action Buttons */}
                        <Stack direction="row" spacing={2}>
                            {isRegistered ? (
                                <>
                                    <Button variant="contained" color="primary" fullWidth>
                                        Delta
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        fullWidth
                                        onClick={handleLeaveEvent}
                                    >
                                        Lämna event
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    variant="contained"
                                    color="primary"
                                    fullWidth
                                    onClick={handleJoinEvent}
                                >
                                    Anmäl mig
                                </Button>
                            )}
                        </Stack>

                        {/* Participants Section */}
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                                Deltagare ({participants.length})
                            </Typography>
                            <InfoBox>
                                <List>
                                    {participants.map((participant) => {
                                        const userInfo = userInfoMap[participant.id]
                                        return (
                                            <ListItem key={participant.id}>
                                                <Avatar
                                                    sx={{
                                                        mr: 2,
                                                        bgcolor: userInfo?.color || generateRandomColor(),
                                                        color: "#fff",
                                                        fontWeight: "bold",
                                                    }}
                                                >
                                                    {participant.name.charAt(0)}
                                                </Avatar>
                                                <ListItemText
                                                    primary={participant.name}
                                                    secondary={participant.email}
                                                />
                                            </ListItem>
                                        )
                                    })}
                                </List>
                            </InfoBox>
                        </Box>
                    </Stack>
                </Box>
                <EventChat eventId={eventId} userInfoMap={userInfoMap} />

            </Stack>
        </PageLayout>
    )
}

