package mk.finki.vp.audio_extractor.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "vocabulary_words")
@Getter
@Setter
@NoArgsConstructor
public class VocabularyWord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String word;

    public VocabularyWord(String word) {
        this.word = word;
    }
}
