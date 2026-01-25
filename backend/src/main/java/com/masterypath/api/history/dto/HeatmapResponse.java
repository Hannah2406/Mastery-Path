package com.masterypath.api.history.dto;

import java.time.LocalDate;
import java.util.Map;

public class HeatmapResponse {
    private Map<String, Integer> contributions; // date -> count
    private int totalPractices;
    private int currentStreak;
    private int longestStreak;

    public HeatmapResponse() {}

    public HeatmapResponse(Map<String, Integer> contributions, int totalPractices, int currentStreak, int longestStreak) {
        this.contributions = contributions;
        this.totalPractices = totalPractices;
        this.currentStreak = currentStreak;
        this.longestStreak = longestStreak;
    }

    public Map<String, Integer> getContributions() {
        return contributions;
    }

    public void setContributions(Map<String, Integer> contributions) {
        this.contributions = contributions;
    }

    public int getTotalPractices() {
        return totalPractices;
    }

    public void setTotalPractices(int totalPractices) {
        this.totalPractices = totalPractices;
    }

    public int getCurrentStreak() {
        return currentStreak;
    }

    public void setCurrentStreak(int currentStreak) {
        this.currentStreak = currentStreak;
    }

    public int getLongestStreak() {
        return longestStreak;
    }

    public void setLongestStreak(int longestStreak) {
        this.longestStreak = longestStreak;
    }
}
