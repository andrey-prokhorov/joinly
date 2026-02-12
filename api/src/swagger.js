import swaggerJSDoc from "swagger-jsdoc"

export function createOpenApiSpec() {
	return swaggerJSDoc({
		definition: {
			openapi: "3.0.3",
			info: {
				title: "Joinly API",
				version: "1.0.0",
			},
			components: {
				securitySchemes: {
					bearerAuth: {
						type: "http",
						scheme: "bearer",
						bearerFormat: "JWT",
					},
				},
				schemas: {
					Event: {
						type: "object",
						properties: {
							id: {
								type: "string",
								format: "uuid",
								example: "550e8400-e29b-41d4-a716-446655440000",
								description: "Unique identifier for the event",
							},
							title: {
								type: "string",
								example: "Summer Music Festival",
								description: "Event title",
							},
							description: {
								type: "string",
								example: "A great music festival with local artists",
								description: "Event description",
							},
							category: {
								type: "string",
								example: "music",
								description: "Event category",
							},
							start_time: {
								type: "string",
								format: "date-time",
								example: "2024-07-15T18:00:00Z",
								description: "Event start time in ISO 8601 format",
							},
							end_time: {
								type: "string",
								format: "date-time",
								example: "2024-07-15T23:00:00Z",
								description: "Event end time in ISO 8601 format",
							},
							city: {
								type: "string",
								example: "Stockholm",
								description: "City where the event takes place",
							},
							city_district: {
								type: "string",
								nullable: true,
								example: "Södermalm",
								description: "City district (optional)",
							},
							creator_user_id: {
								type: "string",
								example: "550e8400-e29b-41d4-a716-446655440000",
								description:
									"ID of the user who created the event (stored as string)",
							},
							created_at: {
								type: "string",
								format: "date-time",
								example: "2024-07-01T10:00:00Z",
								description: "Event creation timestamp",
							},
						},
						required: [
							"id",
							"title",
							"description",
							"category",
							"start_time",
							"end_time",
							"city",
							"creator_user_id",
							"created_at",
						],
					},
					User: {
						type: "object",
						properties: {
							id: {
								type: "string",
								format: "uuid",
								example: "550e8400-e29b-41d4-a716-446655440000",
								description: "Unique identifier for the user",
							},
							email: {
								type: "string",
								format: "email",
								example: "user@example.com",
								description: "User's email address",
							},
							name: {
								type: "string",
								nullable: true,
								example: "John Doe",
								description: "User's display name",
							},
							role: {
								type: "string",
								example: "user",
								description: "User's role in the system",
								enum: ["user", "admin"],
							},
						},
						required: ["id", "email", "role"],
					},
					Error: {
						type: "object",
						properties: {
							success: {
								type: "boolean",
								example: false,
							},
							message: {
								type: "string",
								example: "Error message",
							},
						},
						required: ["message"],
					},
					EventRegistration: {
						type: "object",
						properties: {
							id: {
								type: "integer",
								example: 1,
								description: "Registration ID",
							},
							event_id: {
								type: "string",
								format: "uuid",
								example: "550e8400-e29b-41d4-a716-446655440000",
								description: "ID of the event",
							},
							user_id: {
								type: "string",
								format: "uuid",
								example: "550e8400-e29b-41d4-a716-446655440000",
								description: "ID of the registered user",
							},
							created_at: {
								type: "string",
								format: "date-time",
								example: "2026-02-12T10:00:00Z",
								description: "When the registration was created",
							},
						},
						required: ["id", "event_id", "user_id", "created_at"],
					},
				},
			},
		},
		apis: ["./src/routes/**/*.ts"],
	})
}
