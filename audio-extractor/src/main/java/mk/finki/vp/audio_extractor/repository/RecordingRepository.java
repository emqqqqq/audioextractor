package mk.finki.vp.audio_extractor.repository;

import mk.finki.vp.audio_extractor.entity.Recording;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface RecordingRepository extends JpaRepository<Recording, UUID> {
}
