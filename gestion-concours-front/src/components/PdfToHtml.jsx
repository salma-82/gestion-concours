import { useState } from "react";
import { PDF2HTML } from "pdf2html-client";

export default function PdfToHtml() {
    const [file, setFile] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState("");

    const handleFileChange = (e) => {
        const selectedFile = e.target.files?.[0];

        if (!selectedFile) return;

        if (selectedFile.type !== "application/pdf") {
            setError("Veuillez sélectionner un fichier PDF.");
            return;
        }

        setFile(selectedFile);
        setResult(null);
        setError("");
        setProgress(0);
    };

    const convertPdf = async () => {
        if (!file) {
            setError("Veuillez sélectionner un PDF.");
            return;
        }

        try {
            setLoading(true);
            setError("");
            setProgress(0);

            const converter = new PDF2HTML({
                enableOCR: false,

                enableFontMapping: true,

                parserStrategy: "auto",

                htmlOptions: {
                    format: "html+inline-css",

                    preserveLayout: true,

                    responsive: false,

                    darkMode: false,

                    imageFormat: "base64",

                    textLayout: "absolute",

                    textLayoutPasses: 1,

                    textPipeline: "legacy",

                    includeExtractedText: true
                }
            });

            const output = await converter.convert(file, (p) => {
                console.log(p);

                if (p?.progress !== undefined) {
                    setProgress(p.progress);
                }
            });

            console.log("===== PDF → HTML RESULT =====");
            console.log(output);

            setResult(output);

            converter.dispose();

        } catch (err) {
            console.error("PDF conversion error:", err);

            setError(
                err?.message ||
                "Une erreur est survenue pendant la conversion du PDF."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: "30px" }}>

            <h1>PDF → HTML</h1>

            <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
            />

            {file && (
                <p>
                    PDF sélectionné : <strong>{file.name}</strong>
                </p>
            )}

            <button
                onClick={convertPdf}
                disabled={!file || loading}
                style={{
                    marginTop: "15px",
                    padding: "10px 20px",
                    cursor: "pointer"
                }}
            >
                {loading
                    ? `Conversion... ${Math.round(progress)}%`
                    : "Convertir en HTML"}
            </button>

            {error && (
                <div
                    style={{
                        marginTop: "20px",
                        padding: "15px",
                        background: "#ffe5e5",
                        color: "#b00000"
                    }}
                >
                    {error}
                </div>
            )}

            {result && (
                <div style={{ marginTop: "30px" }}>

                    <h2>Résumé converti</h2>

                    <div
                        style={{
                            border: "1px solid #ddd",
                            padding: "30px",
                            background: "#fff",
                            overflow: "auto"
                        }}
                        dangerouslySetInnerHTML={{
                            __html: result.html
                        }}
                    />

                </div>
            )}

        </div>
    );
}