export const tools = [
  {
    functionDeclarations: [
      {
        name: "add_task",
        description: "Add a task to Preethi's path list",
        parameters: {
          type: "OBJECT",
          properties: {
            text: { type: "STRING" },
            tag: { type: "STRING", enum: ["life", "work", "self"] },
          },
          required: ["text", "tag"],
        },
      },
      {
        name: "complete_task",
        description: "Mark a task done by matching description",
        parameters: {
          type: "OBJECT",
          properties: { description: { type: "STRING" } },
          required: ["description"],
        },
      },
      {
        name: "set_day_schedule",
        description: "Rewrite the full notification schedule for today",
        parameters: {
          type: "OBJECT",
          properties: {
            energy_level: { type: "NUMBER" },
            focus_area: { type: "STRING" },
            movement_type: { type: "STRING", enum: ["walk", "skate", "long_skate"] },
            notes: { type: "STRING" },
          },
          required: ["energy_level", "movement_type"],
        },
      },
      {
        name: "update_notification",
        description: "Rewrite a specific notification slot",
        parameters: {
          type: "OBJECT",
          properties: {
            time: { type: "STRING" },
            new_message: { type: "STRING" },
            tag: { type: "STRING", enum: ["career", "body", "mind"] },
          },
          required: ["time", "new_message"],
        },
      },
      {
        name: "add_notification",
        description: "Add a new notification to the schedule",
        parameters: {
          type: "OBJECT",
          properties: {
            time: { type: "STRING" },
            message: { type: "STRING" },
            tag: { type: "STRING", enum: ["career", "body", "mind"] },
            book_reference: { type: "STRING" },
          },
          required: ["time", "message", "tag"],
        },
      },
      {
        name: "update_avoiding",
        description: "Update what Preethi is currently avoiding",
        parameters: {
          type: "OBJECT",
          properties: {
            items: { type: "ARRAY", items: { type: "STRING" } },
          },
          required: ["items"],
        },
      },
      {
        name: "set_emotional_state",
        description: "Set fog / stone / hollow on home screen",
        parameters: {
          type: "OBJECT",
          properties: {
            state: { type: "STRING", enum: ["fog", "stone", "hollow"] },
          },
          required: ["state"],
        },
      },
      {
        name: "clear_done_tasks",
        description: "Remove all completed tasks",
        parameters: { type: "OBJECT", properties: {} },
      },
      {
        name: "draft_message",
        description: "Draft an email or LinkedIn message for Preethi to copy",
        parameters: {
          type: "OBJECT",
          properties: {
            type: {
              type: "STRING",
              enum: ["linkedin_outreach", "follow_up_email", "thank_you_email", "cold_email"],
            },
            context: { type: "STRING" },
          },
          required: ["type", "context"],
        },
      },
      {
        name: "regenerate_slot",
        description: "Regenerate one or more notification slots after a mid-day state change",
        parameters: {
          type: "OBJECT",
          properties: {
            reason: { type: "STRING" },
            new_energy: { type: "NUMBER" },
          },
          required: ["reason"],
        },
      },
    ],
  },
]
