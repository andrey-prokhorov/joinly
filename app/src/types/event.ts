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
    start_time: Date|""
    end_time: Date|""
    city: string
    city_district: string
    created_at: Date|""
}
