package com.masterypath.domain.model;

import jakarta.persistence.*;

@Entity
@Table(name = "path", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "name"})
})
public class Path {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User owner;

    @Column(nullable = false)
    private String name;

    private String description;

    public Path() {}

    public Path(String name, String description) {
        this.name = name;
        this.description = description;
    }

    public Path(User owner, String name, String description) {
        this.owner = owner;
        this.name = name;
        this.description = description;
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public User getOwner() {
        return owner;
    }

    public void setOwner(User owner) {
        this.owner = owner;
    }
}
