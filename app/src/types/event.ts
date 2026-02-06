//Placeholder
export enum EventType {
    Bike = "Cykla",
    running = "Jogga",
    Motorcykle = "Motorcykel",
}

export interface EventFormData {
    id:number|""
    title: string
    location: string
    type: EventType|""
    date: Date|""
    startTime: string
    endTime: string
}
