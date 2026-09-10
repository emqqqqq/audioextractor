package mk.finki.vp.audio_extractor.controller;

import lombok.RequiredArgsConstructor;
import mk.finki.vp.audio_extractor.entity.VocabularyWord;
import mk.finki.vp.audio_extractor.repository.VocabularyWordRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/vocabulary")
@RequiredArgsConstructor
public class VocabularyController {

    private final VocabularyWordRepository repository;

    @GetMapping
    public List<VocabularyWord> list() {
        return repository.findAll();
    }

    @PostMapping
    public ResponseEntity<VocabularyWord> add(@RequestBody Map<String, String> body) {
        String word = body.get("word");
        if (word == null || word.isBlank()) return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(repository.save(new VocabularyWord(word.trim())));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (!repository.existsById(id)) return ResponseEntity.notFound().build();
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
