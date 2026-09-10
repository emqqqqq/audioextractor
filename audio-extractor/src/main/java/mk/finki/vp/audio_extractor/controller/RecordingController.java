package mk.finki.vp.audio_extractor.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import mk.finki.vp.audio_extractor.entity.Recording;
import mk.finki.vp.audio_extractor.service.RecordingService;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@RestController
@RequestMapping("/api/recordings")
@RequiredArgsConstructor
@Slf4j
public class RecordingController {

    private final RecordingService recordingService;

    @PostMapping
    public ResponseEntity<?> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "transcript", required = false) String transcript) {
        try {
            return ResponseEntity.ok(recordingService.process(file, transcript));
        } catch (RuntimeException | IOException e) {
            log.error("Failed to process recording: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<Recording>> list() {
        return ResponseEntity.ok(recordingService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Recording> getById(@PathVariable UUID id) {
        try {
            return ResponseEntity.ok(recordingService.findById(id));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}/audio")
    public ResponseEntity<Resource> downloadAudio(@PathVariable UUID id) {
        Recording recording;
        try {
            recording = recordingService.findById(id);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }

        Path audioPath = Paths.get(recording.getAudioPath());
        if (!Files.exists(audioPath)) {
            log.warn("Audio file missing on disk for recording {}: {}", id, recording.getAudioPath());
            return ResponseEntity.notFound().build();
        }

        String filename = recording.getOriginalFilename() != null
                ? recording.getOriginalFilename()
                : "recording";

        String safeFilename = filename.replaceAll("[^\\x20-\\x7E]", "_");
        String encodedFilename = java.net.URLEncoder.encode(filename, java.nio.charset.StandardCharsets.UTF_8)
                .replace("+", "%20");

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + safeFilename + "\"; filename*=UTF-8''" + encodedFilename)
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(new FileSystemResource(audioPath));
    }

    @PatchMapping("/{id}/name")
    public ResponseEntity<?> rename(@PathVariable UUID id, @RequestBody java.util.Map<String, String> body) {
        try {
            String name = body.getOrDefault("name", "").trim();
            if (name.isEmpty()) return ResponseEntity.badRequest().body(java.util.Map.of("error", "Name cannot be empty"));
            return ResponseEntity.ok(recordingService.rename(id, name));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{id}")
    public Recording update(@PathVariable UUID id, @RequestBody java.util.Map<String, String> body) {
        return recordingService.update(id, body.get("transcription"), body.get("extractedData"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        try {
            recordingService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
