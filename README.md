# Audio Extractor (Vezilka)

Веб-апликација која снима/прима аудио запис на македонски јазик, го транскрибира со Whisper (преку Groq), а потоа со LLM (Llama преку Groq) автоматски извлекува структурирани податоци (имиња, датуми, ставки, количини, цени, локации, теми, клучни факти) и кратко резиме од содржината.

Наменета е за брзо архивирање на говорни белешки, состаноци, потсетувања и слично — снимката се претвора во пребарливи, структурирани податоци наместо да остане само аудио фајл.

---

## Технологии

**Frontend**
- React 19 + Vite
- JavaScript / TypeScript (мешано)
- Tailwind CSS
- Framer Motion (анимации)
- Axios / Fetch API за комуникација со бекендот
- Lucide React (икони)

**Backend**
- Spring Boot 3 (Java)
- Spring Web (REST API)
- Spring Data JPA / Hibernate
- PostgreSQL (JSONB колона за извлечените ентитети)
- Lombok
- Groq API — Whisper `whisper-large-v3` за транскрипција и `llama-3.3-70b-versatile` за екстракција на ентитети

---

## Клучни функционалности

- **Upload / снимање аудио** — праќање на аудио фајл (или веб-снимка) до бекендот
- **Транскрипција** — ако не постои веќе транскрипт од браузерот, бекендот праќа аудио до Groq Whisper (`language=mk`) и добива текст
- **Автоматска екстракција на ентитети** — LLM (Groq Llama) го анализира транскриптот и враќа структуриран JSON: имиња на лица, датуми, ставки, количини, цени, локации, теми и клучни факти, плус кратко резиме на македонски
- **Речник (Vocabulary)** — листа на домен-специфични зборови што се проследуваат до LLM-то како помош при екстракцијата (CRUD преку `/api/vocabulary`)
- **Историја на снимки** — преглед, преименување, уредување на транскрипт/податоци и бришење снимки
- **Преземање на оригиналното аудио** за секоја снимка
- **Dashboard / History страници** во React за преглед на резултатите

---

## Архитектура

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
        │   ├── Landing.jsx      # почетна страница (лого, features, orb, тема) — активна
        │   ├── Upload.jsx       # upload/drag&drop на аудио
        │   ├── Dashboard.jsx    # преглед на податоци
        │   ├── History.jsx      # историја на снимки
        │   └── Onboarding.jsx   # алтернативен welcome екран — постои во кодот, но не е поврзан во App.jsx
        ├── components/         # Sidebar, UI компоненти
        └── api/                # api.js — Axios клиент
```

> `App.jsx` рутира само меѓу `landing`, `upload`, `dashboard` и `history`. `Onboarding.jsx` останува во репозиториумот како неповрзана компонента — не се вчитува никаде во тековниот тек на апликацијата.

### API (Spring Boot, `/api`)

| Метод | Рута | Опис |
|---|---|---|
| POST | `/api/recordings` | Прими аудио фајл (+ опционален транскрипт), транскрибирај и екстрактирај податоци |
| GET | `/api/recordings` | Листа на сите снимки |
| GET | `/api/recordings/{id}` | Детали за една снимка |
| GET | `/api/recordings/{id}/audio` | Преземи го оригиналното аудио |
| PATCH | `/api/recordings/{id}/name` | Промени име на снимка |
| PATCH | `/api/recordings/{id}` | Ажурирај транскрипт/извлечени податоци |
| DELETE | `/api/recordings/{id}` | Избриши снимка (и фајлот на диск) |
| GET | `/api/vocabulary` | Листа на зборови од речникот |
| POST | `/api/vocabulary` | Додади збор |
| DELETE | `/api/vocabulary/{id}` | Избриши збор |

---

## ⚠️ Задолжителна конфигурација пред стартување

`application.properties` е во `.gitignore` и **не постои во репозиториумот**. Без него бекендот нема да стартува — Spring Boot ќе фрли грешка при стартување бидејќи нема конфигурирана база (`spring.datasource.url`) и нема Groq клуч (`groq.api.key` нема default вредност во кодот).

**Чекори:**

1. Копирај го `application.properties.example` во `audio-extractor/src/main/resources/application.properties`
2. Пополни ги вредностите (база + Groq клуч)
3. Дури тогаш стартувај го бекендот / `run.bat`

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

Groq API клуч (бесплатен) се зема од [console.groq.com](https://console.groq.com).

> **Напомена за `run.bat`:** ако `application.properties` не е конфигуриран, Spring Boot паѓа веднаш при стартување и портата `:8080` никогаш нема да стане активна. 
---

## Инсталација и стартување

### Предуслови
- Java 21+ и Maven (или `mvnw` во репозиториумот)
- Node.js и npm
- PostgreSQL (база `audio_extractor`)
- Groq API клуч ([console.groq.com](https://console.groq.com))

### Backend

```bash
cd audio-extractor
```

Провери дека `application.properties` е конфигуриран (види секција погоре), потоа стартувај:

```bash
./mvnw spring-boot:run
```

Бекендот тргнува на `http://localhost:8080`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Фронтендот тргнува на `http://localhost:5173` (Vite dev server со proxy до `/api`).

### Брз старт (Windows)

Во главниот директориум има `run.bat` кој автоматски:
1. Проверува/стартува PostgreSQL
2. Стартува Spring Boot бекендот на `:8080`
3. Стартува Vite фронтендот на `:5173`
4. Го отвора `http://localhost:5173` во browser

> `run.bat` **не** креира `application.properties` наместо тебе — тоа мора да е веќе поставено претходно (види секцијата за конфигурација погоре)