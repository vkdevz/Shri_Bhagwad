package com.bhagavadgita.api.entity;

import lombok.*;

import java.io.Serializable;
import java.util.Objects;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class VerseDilemmaId implements Serializable {
    private Long dilemmaId;
    private Long verseId;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        VerseDilemmaId that = (VerseDilemmaId) o;
        return Objects.equals(dilemmaId, that.dilemmaId) && Objects.equals(verseId, that.verseId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(dilemmaId, verseId);
    }
}
