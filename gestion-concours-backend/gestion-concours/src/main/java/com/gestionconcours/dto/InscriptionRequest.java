package com.gestionconcours.dto;



public class InscriptionRequest {
    
    private String username;
    private String email;
    private String password;
    private String role; // Optionnel (ila bġiti t-khlli l-client y-khtar wla y-kon default "CLIENT")

    // Getters and Setters
    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}