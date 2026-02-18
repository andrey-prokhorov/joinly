import { Button, List, ListItem, ListItemButton, ListItemText, Stack, Typography } from "@mui/material"
import { InfoBox } from "@/components/InfoBox/InfoBox"
import { PageLayout } from "../../components/PageLayout/PageLayout"
import { CreateEventDialog } from "../../components/Event/CreateEventDialog"
import { useState } from "react"
import { createEvent } from "../../hooks/events/UseCreatEvent"

export const EventsPage = () => {
  const [open, setOpen] = useState(false)

  return (
    <PageLayout>
 			<Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 7 }}>
 				<Typography variant="h4" sx={{ fontWeight: 700 }}>
 					Lista med aktiviteter
 				</Typography>

 				<Button variant="contained" onClick={() => setOpen(true)}>
 					Skapa aktivitet
 				</Button>
 			</Stack>

      <InfoBox sx={{ justifyContent: "left" }}>
        <List aria-label="contacts">
          <ListItem disablePadding>
            <ListItemButton>
              <ListItemText primary="Cykling - Göteborg - Imorgon 10:00" />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton>
              <ListItemText primary="Motorcykeltur - Malmö - Idag 15:00" />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton>
              <ListItemText primary="Löpning - Stockholm - Idag 18:00" />
            </ListItemButton>
          </ListItem>
        </List>
      </InfoBox>

      <CreateEventDialog
        open={open}
        onClose={() => setOpen(false)}
        onCreate={async (data) => {
          try {
            const result = await createEvent(data)
            console.log(result)
            setOpen(false)
          } catch (err) {
            console.error(err)
          }
        }}
      />

    </PageLayout>
  )
}