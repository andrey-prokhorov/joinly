import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    MenuItem,
    Select,
    Stack,
    TextField,
} from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"
import { useMemo, useState } from "react"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import dayjs, { Dayjs } from "dayjs"
import { EventType, type EventFormData } from "@/types/event"

type Props = {
    open: boolean
    onClose: () => void
    onCreate: (data: EventFormData) => void
}

const emptyForm: EventFormData = {
    id:"",
    title: "",
    description: "",
    category: "",
    start_time: "",
    end_time: "",
    city: "",
    city_district: "",
    created_at: ""
}

export const CreateEventDialog = ({ open, onClose, onCreate }: Props) => {
    const [form, setForm] = useState<EventFormData>(emptyForm)

    const [startTimeValue, setStartTimetValue] = useState<Dayjs | null>(null)
    const [endTimeValue, setEndTimeValue] = useState<Dayjs | null>(null)

    startTimeValue !== null &&
    endTimeValue !== null &&
    !endTimeValue.isAfter(startTimeValue)

    const canCreate = useMemo(() => {
        return (
            form.title.trim().length > 0 &&
            form.description.trim().length > 0 &&
            form.category !== "" &&
            form.start_time !== "" &&
            form.end_time !== "" &&
            form.city.trim().length > 0
        )
    }, [form])

    const handleClose = () => {
        onClose()
        setForm(emptyForm)
        setStartTimetValue(null)
        setEndTimeValue(null)
    }

    const handleCreate = () => {
        if (!canCreate) return
        onCreate(form)
        handleClose()
    }

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
            <DialogTitle sx={{ pr: 6, fontWeight: 700, bgcolor: "secondary.light" }}>
                Skapa aktivitet
                <IconButton
                    aria-label="stäng"
                    onClick={handleClose}
                    sx={{ position: "absolute", right: 12, top: 12 }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ pt: 3 }}>
                <Stack spacing={2.25}>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                        <TextField
                            label="Titel"
                            placeholder="t.ex. Vasaloppet"
                            value={form.title}
                            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                            autoFocus
                            fullWidth
                        />

                        <Select<string>
                            labelId="activity-type-label"
                            id="activity-type"
                            value={form.category ?? ""}
                            displayEmpty
                            renderValue={(v) => (v === "" ? "Aktivitetstyp" : v)}
                            onChange={(e) =>
                                setForm((p) => ({ ...p, category: e.target.value as string }))
                            }
                            >
                                <MenuItem value="" disabled>
                                    Aktivitetstyp
                                </MenuItem>

                                {Object.entries(EventType).map(([key, value]) => (
                                    <MenuItem key={key} value={value}>
                                        {value}
                                    </MenuItem>
                                ))}
                        </Select>
                    </Stack>

                    <TextField
                        label="Beskrivning"
                        placeholder="t.ex. längdskidåkning längs Gustav Vasas rutt år 1520"
                        value={form.description}
                        onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                        autoFocus
                        multiline
                        minRows={3}
                        fullWidth
                    />


                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                        <TextField
                            label="Stad"
                            placeholder="t.ex. Sälen"
                            value={form.city}
                            onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                            fullWidth
                        />

                        <TextField
                            label="Stadsdel"
                            placeholder="t.ex. Berga by"
                            value={form.city_district}
                            onChange={(e) => setForm((p) => ({ ...p, city_district: e.target.value }))}
                            fullWidth
                        />
                    </Stack>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DateTimePicker
                                label="Starttid"
                                ampm={false}
                                format="YYYY/MM/DD HH:mm"
                                value={form.start_time === "" ? null : dayjs(form.start_time)}
                                onChange={(v) =>
                                    setForm((p) => ({ ...p, start_time: v ? v.toDate() : "" }))
                                }
                                slotProps={{
                                    textField: {
                                    fullWidth: true,
                                    InputLabelProps: { shrink: true },
                                    },
                                }}
                            />

                            <DateTimePicker
                                label="Sluttid"
                                ampm={false}
                                format="YYYY/MM/DD HH:mm"
                                value={form.end_time === "" ? null : dayjs(form.end_time)}
                                onChange={(v) =>
                                    setForm((p) => ({ ...p, end_time: v ? v.toDate() : "" }))
                                }
                                minDateTime={
                                    form.start_time === "" ? undefined : dayjs(form.start_time).add(5, "minute")
                                }
                                slotProps={{
                                    textField: {
                                    fullWidth: true,
                                    InputLabelProps: { shrink: true },
                                    error:
                                        form.start_time !== "" &&
                                        form.end_time !== "" &&
                                        !dayjs(form.end_time).isAfter(dayjs(form.start_time)),
                                    helperText:
                                        form.start_time !== "" &&
                                        form.end_time !== "" &&
                                        !dayjs(form.end_time).isAfter(dayjs(form.start_time))
                                        ? "Sluttid måste vara minst 5 min efter starttid"
                                        : " ",
                                    },
                                }}
                            />
                        </LocalizationProvider>
                    </Stack>
                </Stack>
            </DialogContent>

            <Divider />

            <DialogActions sx={{ p: 2, bgcolor: "secondary.light" }}>
                <Button onClick={handleClose}>Stäng</Button>
                <Button variant="contained" onClick={handleCreate} disabled={!canCreate}>Skapa</Button>
            </DialogActions>
        </Dialog>
    )
}
