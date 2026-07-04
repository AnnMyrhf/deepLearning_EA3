import React, {useState, useEffect} from 'react';

export default function Wortvorhersage() {

    // State Toogle-Button-Logik
    const [isAutoRunning, setIsAutoRunning] = useState(false);

    // Inhalt Textfeld
    const [promptText, setPromptText] = useState('');

    // State für den geladenen Text (Rohdaten)
    const [rawText, setRawText] = useState('');

    // State für Vokabular und Mappings
    const [vocabData, setVocabData] = useState(null);

    // Text beim ersten Rendern der Komponente laden
    useEffect(() => {
        const fetchDataset = async () => {
            try {
                const response = await fetch('/data/trainingsdata_Sandwich_Inseln.txt');
                const rawText = await response.text();

                console.log("Datensatz erfolgreich geladen. Zeichenanzahl:", rawText.length);

                // 1. Bereinigen
                const cleanedText = cleanText(rawText);

                // 2. Vokabular aufbauen
                const vocab = buildVocabulary(cleanedText);

                // 3. Im State speichern
                setVocabData(vocab);

                console.log("Vokabular erfolgreich erstellt!");
                console.log("Größe des Vokabulars:", vocab.vocabSize);

            } catch (error) {
                console.error("Fehler beim Laden oder Verarbeiten:", error);
            }
        };

        fetchDataset();
    }, []); // Das leere Array sorgt dafür, dass dies nur einmal beim Mounten passiert

    // Zurücksetzen des Textfelds und Stoppen der Automatik
    const handleReset = () => {
        setPromptText('');
        setIsAutoRunning(false);
    };

    // Text bereinigen und normieren
    const cleanText = (text) => {
        // Alles in Kleinbuchstaben umwandeln
        let cleaned = text.toLowerCase();

        // Sonderzeichen und Zahlen entfernen, aber deutsche Umlaute behalten
        cleaned = cleaned.replace(/[^a-zäöüß\s]/g, ' ');

        // Mehrfache Leerzeichen und Zeilenumbrüche durch ein einziges Leerzeichen ersetzen
        cleaned = cleaned.replace(/\s+/g, ' ').trim();

        return cleaned;
    };

    // Hilfsfunktion, um Vokabular und Mappings erstellen
    const buildVocabulary = (text) => {
        // Text an den Leerzeichen in ein Array aus Wörtern aufteilen
        const words = text.split(' ');

        // Ein Set filtert automatisch alle Duplikate heraus
        const uniqueWords = [...new Set(words)];

        // WICHTIG: Das geforderte OOV-Token (Out of Vocabulary) für unbekannte Wörter hinzufügen
        // Wir setzen es ganz an den Anfang (Index 0)
        uniqueWords.unshift('<OOV>');

        const word2idx = {};
        const idx2word = {};

        // Mappings befüllen
        uniqueWords.forEach((word, index) => {
            word2idx[word] = index;
            idx2word[index] = word;
        });

        return {
            word2idx,
            idx2word,
            vocabSize: uniqueWords.length,
            tokens: words // Die bereinigte, chronologische Liste aller Wörter des Textes
        };
    };

    return (<div className="container py-5 mb-5 wortvorhersage-page">
            <header className="mb-4">
                <h1 className="display-4 fw-bold dashboard-title mb-3">
                    Wortvorhersage
                </h1>

                <p className="lead dashboard-subtitle mb-3">
                    Gib deinen Text ein und lass das neuronale Netz die wahrscheinlichsten folgenden Wörter berechnen.
                </p>
            </header>

            <div className="card border-0 shadow-sm p-4 mb-4 wortvorhersage-card">

                <div className="mb-4 text-start">
                    <label
                        htmlFor="promptInput"
                        className="prompt-label"
                    >
                        Text-Eingabe (Prompt)
                    </label>

                    <textarea
                        id="promptInput"
                        className="form-control text-input mb-2"
                        rows="4"
                        placeholder="Gib hier deinen Text aus vollständigen Wörtern ein..."
                        aria-describedby="promptHelp"
                        value={promptText}
                        onChange={(e) => setPromptText(e.target.value)}
                    />

                    <div className="d-flex justify-content-between align-items-start mt-2">
                        <div
                            id="promptHelp"
                            className="form-text text-secondary mb-0"
                        >
                            Bitte nur vollständige, durch Leerzeichen getrennte Wörter eingeben
                        </div>

                        <button
                            type="button"
                            className="btn btn-clear-results"
                            aria-label="Eingabe und Netzwerk zurücksetzen"
                            onClick={handleReset}
                        >
                            <span className="btn-icon">↺</span>Zurücksetzen
                        </button>
                    </div>
                </div>

                <div className="wortvorhersage-controls p-5">

                    <div className="prediction-actions">
                        <button
                            type="button"
                            className="btn btn-cta fw-bold btn-fixed-width"
                        >
                            Vorhersage
                        </button>

                        <button
                            type="button"
                            className="btn btn-primary-inverse fw-bold btn-fixed-width"
                        >
                            Weiter
                        </button>

                        {!isAutoRunning ? (
                            <button
                                type="button"
                                className="btn btn-secondary fw-bold btn-fixed-width"
                                onClick={() => setIsAutoRunning(true)}
                            >
                                Auto
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="btn btn-danger fw-bold btn-fixed-width"
                                onClick={() => setIsAutoRunning(false)}
                            >
                                Stopp
                            </button>
                        )}
                    </div>

                    <div className="wortvorhersage-status">
                        {isAutoRunning
                            ? 'Automatik läuft...'
                            : 'Warten auf Eingabe'}
                    </div>
                </div>

                <div
                    className="wortvorhersage-results dashboard-chart-card"
                    aria-live="polite"
                >
                    <h3 className="h6 fw-bold chart-card-title mb-3">
                        Wahrscheinlichste nächste Wörter
                    </h3>

                    <div className="prediction-word-list">
                        <button
                            type="button"
                            className="prediction-word-btn"
                        >
                            <span>und</span>
                            <span className="badge bg-secondary rounded-pill">
                            45%
                        </span>
                        </button>

                        <button
                            type="button"
                            className="prediction-word-btn"
                        >
                            <span>die</span>
                            <span className="badge bg-secondary rounded-pill">
                            30%
                        </span>
                        </button>

                        <button
                            type="button"
                            className="prediction-word-btn"
                        >
                            <span>aber</span>
                            <span className="badge bg-secondary rounded-pill">
                            15%
                        </span>
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}