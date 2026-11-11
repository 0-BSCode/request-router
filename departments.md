# Department rules

| Request type    | Department               |
| --------------- | ------------------------ |
| Towels          | Housekeeping             |
| Late checkout   | Front desk               |
| Complaint       | Front desk               |
| Tour            | Concierge                |
| Unknown request | Front desk, needs review |

These three departments are assumptions from the brief, not supplied resort policy. Routing is fixed in application code; the LLM extracts request types and cannot choose departments.

A known request with a missing or ambiguous room also becomes a front-desk review task with a null room and a clarification reply. Unknown requests preserve a clear room if one was supplied. Known portions of a message still route normally when another portion needs review. If more than one issue applies to an item, missing/ambiguous room takes precedence as the review reason, and its original type/details are retained.

Unsupported/uncertain language, invalid or failed extraction, and messages without actionable requests create one whole-message front-desk review task with the original text. No room is inferred when extraction is untrusted. An extraction failure does not itself claim that the guest omitted their room.

Split one task per distinct action, even within one department. Keep quantities and timing in that action's details. Repeated mentions of the same request are not extra tasks. A shared explicit room can apply to several requests; explicit different rooms stay separate. Room labels can contain letters. Having 220 rooms does not establish a valid numeric room range.
