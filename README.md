# Writetosee Data Remix3

A minimal Remix REST API application for write-to-see.

## Endpoints

All endpoints except `add-tutor` and `open-session` require an active session via cookie.

### Authentication

#### `POST /add-tutor`
Create a new tutor account.
- **Request Body**: `{ "email": "...", "password": "...", ... }`
- **Response**: `{ "success": true, "message": "Tutor added", "data": { "email": "...", "id": "..." } }`

#### `POST /open-session`
Login and receive a session cookie.
- **Request Body**: `{ "email": "...", "password": "..." }`
- **Response**: `{ "success": true, "message": "Session opened" }` (Set-Cookie header included)

#### `POST /close-session`
Logout and clear the session cookie.
- **Response**: `{ "success": true, "message": "Session closed" }`

### Lessons & Classes

#### `GET /retrieve-lessons`
Get all lessons and students associated with the logged-in tutor.
- **Response**: `{ "success": true, "tutor": {...}, "lessons": [{ "lessonId": "...", "students": [...], ... }] }`

#### `POST /add-lesson`
Create a new lesson with default data.
- **Response**: `{ "success": true, "message": "Lesson added", "data": {...} }`

#### `POST /update-lesson`
Update an existing lesson's data.
- **Request Body**: `{ "lessonCode": "...", "studentNames": ["...", "..."], ... }` (Accepts partial updates)
- **Response**: `{ "success": true, "message": "Lesson updated", "data": {...} }`

#### `POST /remove-lesson`
Remove a lesson.
- **Response**: `{ "success": true, "message": "Lesson removed" }`

#### `POST /activate-class`
Activate a class/lesson.
- **Response**: `{ "success": true, "message": "Class activated" }`

#### `POST /deactivate-class`
Deactivate a class/lesson.
- **Response**: `{ "success": true, "message": "Class deactivated" }`