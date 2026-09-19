# Audio Extractor (Vezilka)

A web application that records/receives an audio recording in Macedonian, transcribes it with Whisper (via Groq), and then uses an LLM (Llama via Groq) to automatically extract structured data (names, dates, items, quantities, prices, locations, topics, key facts) along with a short summary of the content.

It's designed for quickly archiving voice notes, meetings, reminders, and similar content — the recording gets converted into searchable, structured data instead of remaining just an audio file.

## Technologies

**Frontend**
- React 19 + Vite
- JavaScript / TypeScript (mixed)
- Tailwind CSS
- Framer Motion (animations)
- Axios / Fetch API for backend communication
- Lucide React (icons)

**Backend**
- Spring Boot 3 (Java)
- Spring Web (REST API)
- Spring Data JPA / Hibernate
- PostgreSQL (JSONB column for extracted entities)
- Lombok
- Groq API — Whisper `whisper-large-v3` for transcription and `llama-3.3-70b-versatile` for entity extraction

## Key Features

- **Upload / record audio** — send an audio file (or browser recording) to the backend
- **Transcription** — if a transcript from the browser doesn't already exist, the backend sends the audio to Groq Whisper (language=mk) and receives text
- **Automatic entity extraction** — an LLM (Groq Llama) analyzes the transcript and returns structured JSON: names, dates, items, quantities, prices, locations, topics, and key facts, plus a short summary in Macedonian
- **Vocabulary** — a list of domain-specific words passed to the LLM to assist with extraction (CRUD via `/api/vocabulary`)
- **Recording history** — view, rename, edit transcript/data, and delete recordings
- **Download** the original audio for each recording
- **Dashboard / History** pages in React for reviewing results

## Architecture

```
audioextractor/
├── audio-extractor/          # Spring Boot backend
│   └── src/main/java/mk/finki/vp/audio_extractor/
│       ├── controller/        # RecordingController, VocabularyController
│       ├── service/           # RecordingService, TranscriptionService, ExtractionService
│       ├── entity/            # Recording, VocabularyWord
│       ├── repository/        # Spring Data JPA repositories
│       └── config/            # CorsConfig
└── frontend/                  # React + Vite frontend
    └── src/
        ├── pages/
        │   ├── Landing.jsx      # homepage (logo, features, orb, theme) — active
        │   ├── Upload.jsx       # audio upload/drag&drop
        │   ├── Dashboard.jsx    # data overview
        │   ├── History.jsx      # recording history
        │   └── Onboarding.jsx   # alternative welcome screen — exists in the code, but not wired into App.jsx
        ├── components/         # Sidebar, UI components
        └── api/                # api.js — Axios client
```

`App.jsx` only routes between landing, upload, dashboard, and history. `Onboarding.jsx` remains in the repository as an unconnected component — it isn't loaded anywhere in the current app flow.

## API (Spring Boot, `/api`)

| Method | Route | Description |
|---|---|---|
| POST | `/api/recordings` | Receive an audio file (+ optional transcript), transcribe and extract data |
| GET | `/api/recordings` | List all recordings |
| GET | `/api/recordings/{id}` | Details for a single recording |
| GET | `/api/recordings/{id}/audio` | Download the original audio |
| PATCH | `/api/recordings/{id}/name` | Rename a recording |
| PATCH | `/api/recordings/{id}` | Update transcript/extracted data |
| DELETE | `/api/recordings/{id}` | Delete a recording (and the file on disk) |
| GET | `/api/vocabulary` | List vocabulary words |
| POST | `/api/vocabulary` | Add a word |
| DELETE | `/api/vocabulary/{id}` | Delete a word |

## ⚠️ Required Configuration Before Startup

`application.properties` is in `.gitignore` and does not exist in the repository. Without it, the backend won't start — Spring Boot will throw an error on startup because there's no configured database (`spring.datasource.url`) and no Groq key (`groq.api.key` has no default value in the code).

**Steps:**

1. Copy `application.properties.example` to `audio-extractor/src/main/resources/application.properties`
2. Fill in the values (database + Groq key)
3. Only then start the backend / `run.bat`

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/audio_extractor
spring.datasource.username=postgres
spring.datasource.password=postgres
spring.datasource.driver-class-name=org.postgresql.Driver

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

groq.api.key=YOUR_GROQ_API_KEY
```

A (free) Groq API key can be obtained from console.groq.com.

**Note on `run.bat`:** if `application.properties` isn't configured, Spring Boot crashes immediately on startup and port `:8080` never becomes active.

## Installation and Startup

Clone the repository:

```bash
git clone https://github.com/emqqqqq/audioextractor
cd audioextractor
```

### Prerequisites

- Java 21+ and Maven (or the `mvnw` included in the repository)
- Node.js and npm
- PostgreSQL (database `audio_extractor`)
- Groq API key (console.groq.com)

### Backend

```
cd audio-extractor
```

Make sure `application.properties` is configured (see the section above), then start it:

```
./mvnw spring-boot:run
```

The backend runs at `http://localhost:8080`.

### Frontend

```
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` (Vite dev server with a proxy to `/api`).

### Quick Start (Windows)

In the root directory there's a `run.bat` that automatically:

1. Checks/starts PostgreSQL
2. Starts the Spring Boot backend on `:8080`
3. Starts the Vite frontend on `:5173`
4. Opens `http://localhost:5173` in the browser

`run.bat` does not create `application.properties` for you — it must already be set up beforehand (see the configuration section above).