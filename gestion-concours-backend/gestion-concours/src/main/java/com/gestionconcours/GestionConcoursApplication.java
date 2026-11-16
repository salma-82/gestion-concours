package com.gestionconcours;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class GestionConcoursApplication {

    public static void main(String[] args) {
        SpringApplication.run(GestionConcoursApplication.class, args);
    }
}
