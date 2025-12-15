/**
 * Database schema type definitions for ERM modules
 * Add table interfaces as you create migrations
 */

// Base entity with common fields
export interface BaseEntity {
    id: number;
    created_at: string;
    updated_at: string;
}

// Example: Personnel module
export interface Personnel extends BaseEntity {
    first_name: string;
    last_name: string;
    email: string | null;
    department_id: number | null;
    role: string | null;
    status: "active" | "inactive" | "pending";
}

// Example: Calendar event
export interface CalendarEvent extends BaseEntity {
    title: string;
    description: string | null;
    start_time: string;
    end_time: string;
    all_day: boolean;
    location: string | null;
    organizer_id: number;
}

// Example: Chat message
export interface ChatMessage extends BaseEntity {
    channel_id: number;
    sender_id: number;
    content: string;
    message_type: "text" | "file" | "system";
}

// Add more interfaces as modules are developed
