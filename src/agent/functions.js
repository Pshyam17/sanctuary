/**
 * OpenAI-compatible tool definitions for NIM.
 * NIM (meta/llama-3.3-70b-instruct) accepts the standard `tools` array
 * with `type: "function"` wrappers and returns `tool_calls` on completions.
 */

export const tools = [
  {
    type: "function",
    function: {
      name: "add_task",
      description: "Add a task to Preethi's path list",
      parameters: {
        type: "object",
        properties: {
          text: { type: "string", description: "Short task text in her own voice" },
          tag: { type: "string", enum: ["life", "work", "self"] },
        },
        required: ["text", "tag"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "complete_task",
      description: "Mark a task done by fuzzy matching her description to an existing task",
      parameters: {
        type: "object",
        properties: {
          description: { type: "string", description: "Words she used to describe the completed task" },
        },
        required: ["description"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_day_schedule",
      description: "Rewrite the full notification schedule for today based on her morning check-in",
      parameters: {
        type: "object",
        properties: {
          energy_level: { type: "number", description: "1-5 scale" },
          movement_type: { type: "string", enum: ["walk", "skate", "long_skate"] },
          focus_area: { type: "string", description: "career, rest, admin, mixed" },
          notes: { type: "string", description: "Her own words from the check-in" },
        },
        required: ["energy_level", "movement_type"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_notification",
      description: "Rewrite a specific notification slot at a given time",
      parameters: {
        type: "object",
        properties: {
          time: { type: "string", description: "e.g. 9:15am" },
          new_message: { type: "string" },
          tag: { type: "string", enum: ["career", "body", "mind"] },
        },
        required: ["time", "new_message"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_notification",
      description: "Add a new notification to today's schedule",
      parameters: {
        type: "object",
        properties: {
          time: { type: "string" },
          message: { type: "string" },
          tag: { type: "string", enum: ["career", "body", "mind"] },
          book_reference: { type: "string" },
        },
        required: ["time", "message", "tag"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_avoiding",
      description: "Update the list of things Preethi is currently avoiding",
      parameters: {
        type: "object",
        properties: {
          items: { type: "array", items: { type: "string" } },
        },
        required: ["items"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_emotional_state",
      description: "Set her home-screen emotional avatar to fog, stone, or hollow",
      parameters: {
        type: "object",
        properties: {
          state: { type: "string", enum: ["fog", "stone", "hollow"] },
        },
        required: ["state"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "clear_done_tasks",
      description: "Remove all completed tasks from her path",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "draft_message",
      description: "Draft an email or LinkedIn message for Preethi to copy",
      parameters: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["linkedin_outreach", "follow_up_email", "thank_you_email", "cold_email"],
          },
          context: { type: "string", description: "Who it's for and what it's about" },
        },
        required: ["type", "context"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "regenerate_slot",
      description: "Regenerate notification slots after a mid-day state change",
      parameters: {
        type: "object",
        properties: {
          reason: { type: "string" },
          new_energy: { type: "number" },
        },
        required: ["reason"],
      },
    },
  },
]
