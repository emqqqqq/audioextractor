package mk.finki.vp.audio_extractor.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

@Service
public class TranscriptionService {

    private static final Logger log = LoggerFactory.getLogger(TranscriptionService.class);
    private static final String GROQ_STT_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
    private static final String CRLF = "\r\n";

    private final HttpClient httpClient;
    private final String apiKey;
    private final ObjectMapper objectMapper;

    public TranscriptionService(
            @Value("${groq.api.key}") String apiKey,
            ObjectMapper objectMapper) {
        this.apiKey = apiKey;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(30))
                .build();
    }

    public String transcribe(byte[] audioBytes, String filename) {
        String safeFilename = (filename != null && !filename.isBlank()) ? filename : "recording.webm";
        String mimeType = safeFilename.endsWith(".mp4") ? "audio/mp4"
                        : safeFilename.endsWith(".ogg") ? "audio/ogg"
                        : "audio/webm";

        String boundary = "----VezilkaBoundary" + Long.toHexString(System.currentTimeMillis());

        try {
            byte[] body = buildMultipart(boundary, safeFilename, mimeType, audioBytes);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(GROQ_STT_URL))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                    .timeout(Duration.ofSeconds(120))
                    .POST(HttpRequest.BodyPublishers.ofByteArray(body))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            String raw = response.body();

            log.info("Groq Whisper HTTP {}: {}", response.statusCode(), raw);

            if (response.statusCode() != 200) {
                throw new RuntimeException("Groq Whisper error " + response.statusCode() + ": " + raw);
            }

            JsonNode node = objectMapper.readTree(raw);
            String text = node.path("text").asText("").strip();

            if (text.isBlank()) {
                throw new RuntimeException("Whisper returned empty transcription. Response: " + raw);
            }

            log.info("Transcribed {} chars: '{}'",
                    text.length(), text.length() > 80 ? text.substring(0, 80) + "…" : text);
            return text;

        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Groq Whisper call failed: " + e.getMessage(), e);
        }
    }

    private byte[] buildMultipart(String boundary, String filename, String mimeType, byte[] audioBytes)
            throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        // file part
        writeLine(out, "--" + boundary);
        writeLine(out, "Content-Disposition: form-data; name=\"file\"; filename=\"" + filename + "\"");
        writeLine(out, "Content-Type: " + mimeType);
        writeLine(out, "");
        out.write(audioBytes);
        writeLine(out, "");

        // text fields
        writeTextField(out, boundary, "model",           "whisper-large-v3");
        writeTextField(out, boundary, "language",        "mk");
        writeTextField(out, boundary, "response_format", "json");
        writeTextField(out, boundary, "temperature",     "0");

        // closing boundary
        writeLine(out, "--" + boundary + "--");
        return out.toByteArray();
    }

    private void writeTextField(ByteArrayOutputStream out, String boundary, String name, String value)
            throws IOException {
        writeLine(out, "--" + boundary);
        writeLine(out, "Content-Disposition: form-data; name=\"" + name + "\"");
        writeLine(out, "");
        writeLine(out, value);
    }

    private void writeLine(ByteArrayOutputStream out, String line) throws IOException {
        out.write((line + CRLF).getBytes(StandardCharsets.UTF_8));
    }
}
