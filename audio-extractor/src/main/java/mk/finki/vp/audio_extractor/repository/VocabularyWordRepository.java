
package mk.finki.vp.audio_extractor.repository;

import mk.finki.vp.audio_extractor.entity.VocabularyWord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface VocabularyWordRepository extends JpaRepository<VocabularyWord, UUID> {
}
