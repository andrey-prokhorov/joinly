import type { EventFormData } from "@/types/event"

type CreateEvent = {
    title: string
    description: string
    category: string
    start_time: Date
    end_time: Date
    city: string
    city_district: string
}

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJ0ZXN0QHRlc3Quc2UiLCJyb2xlIjoidXNlciIsImlhdCI6MTc3MDk3NzI4NCwiZXhwIjoxNzcxMDYzNjg0fQ.bjTKYhGn_rJEruFzwVdRt78F32gUMwaQWGpi2EbV0Fk"

export async function createEvent(event:EventFormData){
    if (event.title === ""|| event.description === ""|| event.category === ""|| event.start_time === "" || event.end_time === "" || event.city === "" || event.city_district === ""){
        throw new Error("required fields are empty")
    }

    const newEvent: CreateEvent = {
        title: event.title,
        description:event.description,
        category:event.category,
        start_time: event.start_time,
        end_time: event.end_time,
        city: event.city,
        city_district: event.city_district
    }
    console.log("data: "+ JSON.stringify(newEvent))


    const res = await fetch("/api/events", {
        method: "POST",
        headers: {
            "Authorization":`Bearer ${token}`,
            "Content-Type":"application/json"
        },
        body: JSON.stringify(newEvent),
    })

    if (!res.ok) {
        const text = await res.text().catch(() => "")
        throw new Error(`Create event failed (${res.status}): ${text}`)
    }

    const data = (await res.json()) as EventFormData
    console.log("data: "+ data)

    const createdEvent: EventFormData = {
        id: data.id,
        title: data.title,
        description: data.description,
        category: data.category,
        start_time: data.start_time instanceof Date ? data.start_time : new Date(data.start_time),
        end_time: data.end_time instanceof Date ? data.end_time : new Date(data.end_time),
        city: data.city,
        city_district: data.city_district,
        created_at: data.created_at instanceof Date ? data.created_at : new Date(data.created_at),
    }

    console.log("Event created: " + createdEvent) 
    
    return createdEvent;
}


