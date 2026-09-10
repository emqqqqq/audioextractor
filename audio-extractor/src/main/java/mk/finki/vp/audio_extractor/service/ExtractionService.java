package mk.finki.vp.audio_extractor.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
public class ExtractionService {

    private static final Logger log = LoggerFactory.getLogger(ExtractionService.class);
    private static final String GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";

    private final RestClient restClient;
    private final String apiKey;
    private final ObjectMapper objectMapper;

    public ExtractionService(
            @Value("${groq.api.key}") String apiKey,
            ObjectMapper objectMapper) {
        this.apiKey = apiKey;
        this.objectMapper = objectMapper;
        this.restClient = RestClient.create();
    }

    public record ExtractionResult(String entitiesJson, String summary) {}

    private static final String SYSTEM_PROMPT = """
            You are an entity extraction assistant for Vezilka, a Macedonian voice-data capture application.
            You receive a Macedonian speech transcription and extract structured entities.

            Return ONLY a valid JSON object — no markdown, no extra text:
            {
              "entities": {
                "person_names": [],
                "dates": [],
                "items": [],
                "quantities": [],
                "prices": [],
                "locations": [],
                "topics": [],
                "key_facts": []
              },
              "summary": "one sentence in Macedonian describing the recording"
            }

            Rules:
            - key_facts entries must be "field: value" strings in Macedonian
            - Use empty arrays [] when no entities of that type are found
            - summary must always be present

            --- EXAMPLE 1 ---
            Input: "Денес на состанокот со Марко Петровски разговаравме за набавка на 50 компјутери по цена од 25.000 денари секој, за новата канцеларија во Скопје."
            Output:
            {
              "entities": {
                "person_names": ["Марко Петровски"],
                "dates": ["Денес"],
                "items": ["компјутери"],
                "quantities": ["50"],
                "prices": ["25.000 денари"],
                "locations": ["Скопје"],
                "topics": ["набавка на опрема", "деловен состанок"],
                "key_facts": ["производ: компјутери", "количина: 50", "цена: 25.000 денари", "локација: Скопје"]
              },
              "summary": "Состанок со Марко Петровски за набавка на 50 компјутери за канцеларијата во Скопје."
            }

            --- EXAMPLE 2 ---
            Input: "Потсетување: средбата со клиентот Ана Јовановска е закажана за петок во 14 часот во нашата канцеларија на бул. Партизански одреди 17."
            Output:
            {
              "entities": {
                "person_names": ["Ана Јовановска"],
                "dates": ["петок", "14 часот"],
                "items": [],
                "quantities": [],
                "prices": [],
                "locations": ["бул. Партизански одреди 17"],
                "topics": ["состанок со клиент"],
                "key_facts": ["клиент: Ана Јовановска", "ден: петок", "час: 14:00", "место: бул. Партизански одреди 17"]
              },
              "summary": "Потсетување за средба со Ана Јовановска во петок во 14 часот."
            }
            """;

    public ExtractionResult extract(String transcription, List<String> vocabHints) {
        String userMessage = "Transcription: " + transcription
                + (vocabHints.isEmpty() ? "" : "\nDomain vocabulary: " + String.join(", ", vocabHints));

        Map<String, Object> requestBody = Map.of(
                "model", "llama-3.3-70b-versatile",
                "messages", List.of(
                        Map.of("role", "system", "content", SYSTEM_PROMPT),
                        Map.of("role", "user",   "content", userMessage)
                ),
                "response_format", Map.of("type", "json_object"),
                "temperature", 0.1,
                "max_tokens", 1024
        );

        try {
            String raw = restClient.post()
                    .uri(GROQ_CHAT_URL)
                    .header("Authorization", "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(String.class);

            log.info("Groq extraction raw: {}", raw);

            JsonNode root    = objectMapper.readTree(raw);
            String content   = root.at("/choices/0/message/content").asText("").strip();

            if (content.isBlank()) {
                throw new RuntimeException("Llama returned empty extraction. Response: " + raw);
            }

            JsonNode parsed      = objectMapper.readTree(content);
            String entitiesJson  = objectMapper.writeValueAsString(parsed.path("entities"));
            String summary       = parsed.path("summary").asText("");

            log.info("Extraction done — summary: {}", summary);
            return new ExtractionResult(entitiesJson, summary);

        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Groq extraction call failed: " + e.getMessage(), e);
        }
    }
}
