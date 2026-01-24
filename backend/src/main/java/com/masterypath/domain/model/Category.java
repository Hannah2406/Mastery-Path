package com.masterypath.domain.model;

import jakarta.persistence.*;

@Entity
@Table(name = "category")
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(name = "decay_constant", nullable = false)
    private Double decayConstant = 0.03;

    public Category() {}

    public Category(String name, Double decayConstant) {
        this.name = name;
        this.decayConstant = decayConstant;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Double getDecayConstant() {
        return decayConstant;
    }

    public void setDecayConstant(Double decayConstant) {
        this.decayConstant = decayConstant;
    }
}
