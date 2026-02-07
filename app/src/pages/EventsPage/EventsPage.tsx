import { List, ListItem, ListItemButton, ListItemText, Typography } from "@mui/material"
import { InfoBox } from "@/components/InfoBox/InfoBox"
import { PageLayout } from "../../components/PageLayout/PageLayout"

export const EventsPage = () => (
	<PageLayout>
		<Typography variant="h4" sx={{ fontWeight: 700, mb: 7 }}>
			List med aktiviteter
		</Typography>

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
	</PageLayout>
)
