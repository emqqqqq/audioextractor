package mk.finki.vp.audio_extractor.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import mk.finki.vp.audio_extractor.entity.Recording;
import mk.finki.vp.audio_extractor.repository.RecordingRepository;
import mk.finki.vp.audio_extractor.repository.VocabularyWordRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.util.stream.Collectors;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecordingService {

    private final RecordingRepository recordingRepository;
    private final VocabularyWordRepository vocabularyWordRepository;
    private final TranscriptionService transcriptionService;
    private final ExtractionService extractionService;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    public Recording process(MultipartFile file, String providedTranscript) throws IOException {
        byte[] bytes     = file.getBytes();
        String audioPath = saveAudio(bytes, file.getOriginalFilename());

        List<String> vocabHints = vocabularyWordRepository.findAll()
                .stream().map(w -> w.getWord()).collect(Collectors.toList());

        String transcription;
        if (providedTranscript != null && !providedTranscript.isBlank()) {
            log.info("Using browser live transcript ({} chars)", providedTranscript.length());
            transcription = providedTranscript;
        } else {
            log.info("No live transcript — falling back to Groq Whisper");
            transcription = transcriptionService.transcribe(bytes, file.getOriginalFilename());
        }

        log.info("Running Groq Llama extraction, {} vocab hints", vocabHints.size());
        ExtractionService.ExtractionResult extraction = extractionService.extract(transcription, vocabHints);

        Recording recording = new Recording();
        recording.setOriginalFilename(file.getOriginalFilename());
        recording.setAudioPath(audioPath);
        recording.setTranscription(transcription);
        recording.setExtractedData(extraction.entitiesJson());

        return recordingRepository.save(recording);
    }

    public List<Recording> findAll() {
        return recordingRepository.findAll();
    }

    public Recording findById(UUID id) {
        return recordingRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Recording not found: " + id));
    }

    public Recording rename(UUID id, String newName) {
        Recording recording = findById(id);
        recording.setOriginalFilename(newName.trim());
        return recordingRepository.save(recording);
    }

    public Recording update(UUID id, String transcription, String extractedData) {
        Recording r = findById(id);
        if (transcription != null) r.setTranscription(transcription);
        if (extractedData != null) r.setExtractedData(extractedData);
        return recordingRepository.save(r);
    }

    @Transactional
    public void delete(UUID id) {
        Recording recording = findById(id);
        recordingRepository.delete(recording);
        try {
            Files.deleteIfExists(Paths.get(recording.getAudioPath()));
        } catch (IOException e) {
            log.warn("Could not delete audio file '{}' for recording {}: {}",
                    recording.getAudioPath(), id, e.getMessage());
        }
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private String saveAudio(byte[] bytes, String originalFilename) throws IOException {
        Path uploadPath = Paths.get(uploadDir);
        Files.createDirectories(uploadPath);

        String ext = (originalFilename != null && originalFilename.contains("."))
                ? originalFilename.substring(originalFilename.lastIndexOf('.'))
                : ".webm";

        Path dest = uploadPath.resolve(UUID.randomUUID() + ext);
        Files.write(dest, bytes);
        return dest.toString();
    }

}
