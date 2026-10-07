package com.gestionconcours.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
public class PdfPageConverterService {

    private static final int RENDER_DPI = 180; // 180 DPI assure une excellente netteté pour les formules, tableaux et textes

    /**
     * Convertit toutes les pages d'un document PDF en images PNG haute fidélité.
     * Conserve fidèlement la mise en page originale : textes, formules mathématiques, tableaux, images et styles.
     *
     * @param pdfFile Le fichier PDF original
     * @param outputDirectory Dossier où stocker les images générées
     * @param filePrefix Préfixe unique pour les noms de fichiers des pages
     * @return Liste des noms des fichiers images générés (ex: ["uuid_page_1.png", "uuid_page_2.png"])
     * @throws IOException En cas d'erreur de lecture du PDF ou d'écriture des images
     */
    public List<String> convertPdfToPngPages(File pdfFile, File outputDirectory, String filePrefix) throws IOException {
        if (!outputDirectory.exists()) {
            outputDirectory.mkdirs();
        }

        List<String> generatedImageFileNames = new ArrayList<>();

        try (PDDocument document = Loader.loadPDF(pdfFile)) {
            PDFRenderer renderer = new PDFRenderer(document);
            int pageCount = document.getNumberOfPages();

            for (int pageIndex = 0; pageIndex < pageCount; pageIndex++) {
                // Rendu haute résolution RGB
                BufferedImage pageImage = renderer.renderImageWithDPI(pageIndex, RENDER_DPI, ImageType.RGB);

                int pageNumber = pageIndex + 1;
                String imageFileName = filePrefix + "_page_" + pageNumber + ".png";
                File outputFile = new File(outputDirectory, imageFileName);

                ImageIO.write(pageImage, "PNG", outputFile);
                generatedImageFileNames.add(imageFileName);
            }
        }

        return generatedImageFileNames;
    }
}
