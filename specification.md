# Database

We will use a sqlite database in the root directory called `database.db`.

The database will have the following schema:

```sql
-- TUTOR ---------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tutor (
  tutorId        INTEGER        PRIMARY KEY,
  tutorCode      TEXT           NOT NULL UNIQUE DEFAULT (hex(randomblob(16))),

  sessionCode    TEXT           NULL,

  data           jsonb          NOT NULL        DEFAULT '{}',

  email          TEXT           NOT NULL,
  passwordHash   TEXT           NOT NULL,
  isActive       INTEGER        NOT NULL DEFAULT 1,
  
  updatedAt      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tutor_email_passwordHash ON tutor(email, passwordHash);

-- LESSON ------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lesson (
  lessonId       INTEGER        PRIMARY KEY,
  lessonCode     TEXT           NOT NULL UNIQUE DEFAULT (hex(randomblob(16))),

  tutorId        INTEGER        NOT NULL,

  data           jsonb          NOT NULL        DEFAULT '{}',
  isActive       INTEGER        NOT NULL DEFAULT 1,
  
  updatedAt      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY(tutorId) REFERENCES tutor(tutorId) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_lesson_tutorId ON lesson(tutorId);

-- STUDENT ------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS student (
  studentId      INTEGER        PRIMARY KEY,
  studentCode    TEXT           NOT NULL UNIQUE DEFAULT (hex(randomblob(16))),

  classCode      TEXT           NULL,

  tutorId        INTEGER        NOT NULL,
  lessonId       INTEGER        NOT NULL,

  data           jsonb          NOT NULL DEFAULT '{}',
  isActive       INTEGER        NOT NULL DEFAULT 1,
  
  updatedAt      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY(tutorId) REFERENCES tutor(tutorId) ON DELETE CASCADE
  FOREIGN KEY(lessonId) REFERENCES lesson(lessonId) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_student_tutorId ON student(tutorId);
CREATE INDEX IF NOT EXISTS idx_student_lessonId ON student(lessonId); 

-- MANUSCRIPT ---------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS manuscript (
  manuscriptId   INTEGER        PRIMARY KEY,
  manuscriptCode TEXT           NOT NULL UNIQUE DEFAULT (hex(randomblob(16))),

  studentId      INTEGER        NOT NULL,

  text           TEXT           NULL,
  isActive       INTEGER        NOT NULL DEFAULT 1,
  
  updatedAt      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP, 

  FOREIGN KEY(studentId) REFERENCES student(studentId) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_manuscript_studentId ON manuscript(studentId);

-- PANEL ---------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS panel (
  panelId        INTEGER        PRIMARY KEY,

  manuscriptId   INTEGER        NOT NULL,

  panelNo        INTEGER        NOT NULL,

  data           jsonb          NOT NULL        DEFAULT '{}',
  isActive       INTEGER        NOT NULL DEFAULT 1,
  
  updatedAt      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP, 

  FOREIGN KEY(manuscriptId) REFERENCES manuscript(manuscriptId) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_panel_manuscriptId ON panel(manuscriptId);
CREATE UNIQUE INDEX IF NOT EXISTS idx_panel_manuscriptId_panelNo ON panel(manuscriptId, panelNo);

```