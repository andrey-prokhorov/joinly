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
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import { TimePicker } from "@mui/x-date-pickers/TimePicker"
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
    location: "",
    type: "",
    date: "",
    startTime: "",
    endTime: "",
}

export const CreateEventDialog = ({ open, onClose, onCreate }: Props) => {
    const [form, setForm] = useState<EventFormData>(emptyForm)

    const [startTimeValue, setStartTimetValue] = useState<Dayjs | null>(null)
    const [endTimeValue, setEndTimeValue] = useState<Dayjs | null>(null)

    const timeError: boolean =
    startTimeValue !== null &&
    endTimeValue !== null &&
    !endTimeValue.isAfter(startTimeValue)

    const canCreate = useMemo(() => {
        return (
            form.title.trim().length > 0 &&
            form.location.trim().length > 0 &&
            form.type !== "" &&
            form.date !== "" &&
            form.startTime.trim().length > 0 &&
            form.endTime.trim().length > 0
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
                    <TextField
                        label="Aktivitets namn"
                        placeholder="t.ex. Vasaloppet"
                        value={form.title}
                        onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                        autoFocus
                        fullWidth
                    />

                    <TextField
                        label="Stad"
                        placeholder="t.ex. Stockholm"
                        value={form.location}
                        onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                        fullWidth
                    />


                    <Select<EventType | "">
                        labelId="activity-type-label"
                        id="activity-type"
                        value={form.type ?? ""}
                        displayEmpty
                        renderValue={(v) => (v === "" ? "Aktivitetstyp" : String(v))}
                        onChange={(e) =>
                            setForm((p) => ({ ...p, type: e.target.value as EventType | "" }))
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


                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                                label="Datum"
                                format="YYYY/MM/DD"
                                value={form.date === "" ? null : dayjs(form.date)}
                                onChange={(v) =>
                                setForm((p) => ({ ...p, date: v ? v.toDate() : "" }))
                                }
                                slotProps={{
                                textField: {
                                    fullWidth: true,
                                    InputLabelProps: { shrink: true },
                                },
                                }}
                            />
                        </LocalizationProvider>


                        <LocalizationProvider dateAdapter={AdapterDayjs}>

                        <TimePicker
                            label="Tid start"
                            ampm={false}
                            value={startTimeValue}
                            onChange={(v) => {
                            setStartTimetValue(v)
                            setForm((p) => ({ ...p, startTime: v ? dayjs(v).format("HH:mm") : "" }))

                                if (v && endTimeValue && !endTimeValue.isAfter(v)) {
                                    setEndTimeValue(null)
                                    setForm((p) => ({ ...p, endTime: "" }))
                                }
                            }}
                            slotProps={{
                                textField: {
                                fullWidth: true,
                                InputLabelProps: { shrink: true },
                                },
                            }}
                        />

                        <TimePicker
                            label="Tid slut"
                            ampm={false}
                            value={endTimeValue}
                            onChange={(v) => {
                                setEndTimeValue(v)
                                setForm((p) => ({ ...p, endTime: v ? dayjs(v).format("HH:mm") : "" }))
                            }}
                            minTime={startTimeValue ? startTimeValue.add(5, "minute") : undefined}
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    InputLabelProps: { shrink: true },
                                    error: timeError,
                                    helperText: timeError ? "Sluttid måste vara efter starttid" : " ",
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
