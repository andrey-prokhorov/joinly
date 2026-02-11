//Placeholder
export enum EventType {
    Bike = "Cykla",
    running = "Jogga",
    Motorcykle = "Motorcykel",
}

export interface EventFormData {
    id:string
    title: string
    description: string
    category: string
    startTime: Date|""
    endTime: Date|""
    city: string
    cityDistrict: string
    createdAt: Date|""
}
