import React, {useState, useEffect} from 'react';
import * as tf from '@tensorflow/tfjs'

const SEQUENCE_LENGTH = 5;

export default function Wortvorhersage() {
    const [model, setModel] = useState(null);
    const [wordIndex, setWordIndex] = useState(null);
    const [idxToWord, setIdxToWord] = useState(null);
    const [promptText, setPromptText] = useState('');
    const [predictions, setPredictions] = useState([]);
    const [isAutoRunning, setIsAutoRunning] = useState(false);

// 1. Modell und Mappings beim Start laden
    useEffect(() => {
        const loadResources = async () => {
            try {
                await tf.setBackend('webgl');
                await tf.ready();
                console.log("Lade Modell...");
                const model = await tf.loadGraphModel('/model/model.json')
                setModel(model);

                const response = await fetch('/model/word_index.json');
                const word2idx = await response.json();
                setWordIndex(word2idx);

                const idx2word = Object.fromEntries(Object.entries(word2idx).map(([k, v]) => [v, k]));
                setIdxToWord(idx2word);

                console.log("Modell und Vokabular erfolgreich geladen!");
                console.log("MODEL:", model);
                console.log("EXECUTOR:", model.executor);
                console.log("INPUTS:", model.inputs);
            } catch (error) {
                console.error("Fehler beim Laden:", error);
            }
        };

        // Hier wird die Funktion aufgerufen:
        loadResources();
    }, []); // Hier endet das Array der Abhängigkeiten

    const handleReset = () => {
        setPromptText('');
        setPredictions([]);
        setIsAutoRunning(false);
    };

    // Vorhersage-Logik
    const calculatePrediction = async (currentText) => {
        if (!model || !wordIndex || !idxToWord) return [];

        const words = currentText
            .toLowerCase()
            .replace(/[^a-zäöüß\s]/g, " ")
            .split(/\s+/)
            .filter(Boolean);

        let inputIds = words.slice(-SEQUENCE_LENGTH).map(w => wordIndex[w] || 0);

        while (inputIds.length < SEQUENCE_LENGTH) {
            inputIds.unshift(0);
        }

        const inputTensor = tf.tensor2d(
            [inputIds],
            [1, SEQUENCE_LENGTH],
            "float32"
        );

        const output = await model.executeAsync(inputTensor);

        const top3 = Array.from(probs)
            .map((prob, index) => ({ prob, index }))
            .sort((a, b) => b.prob - a.prob)
            .slice(0, 3)
            .map(item => ({
                word: idxToWord[item.index] || "<UNK>",
                probability: Math.round(item.prob * 100)
            }));

        inputTensor.dispose();
        output.dispose();

        return top3;
       };

    // Wird aufgerufen, wenn der Nutzer auf "Vorhersage" klickt
    const handlePredictClick = async () => {
        const top3 = await calculatePrediction(promptText);
        setPredictions(top3);
    };

    const handleNext = async () => {
        // Nur ausführen, wenn wir Vorhersagen haben
        if (predictions.length > 0) {
            // Das wahrscheinlichste Wort steht an Index 0
            const bestWord = predictions[0].word;

            // Neuen Text zusammensetzen
            const newText = (promptText + ' ' + bestWord).trim();

            // Textfeld aktualisieren
            setPromptText(newText);

            // Direkt die nächste Vorhersage mit dem neuen Text berechnen
            const nextTop3 = await calculatePrediction(newText);
            setPredictions(nextTop3);
        }
    };
    // Auto-Funktion (überwacht den Schalter isAutoRunning, wenn er aktiv ist, löst er nach einer bestimmten Zeit (z. B. 1,5 Sekunden) automatisch die handleWeiter-Funktion aus)
    useEffect(() => {
        let timer;

        if (isAutoRunning && predictions.length > 0) {
            // setTimeout anstelle von setInterval ist sicherer,
            // damit sich Berechnungen nicht überschneiden
            timer = setTimeout(() => {
                handleNext();
            }, 1500); // 1.5 Sekunden Pause zwischen den Wörtern
        }

        // Timer aufräumen, wenn die Komponente neu rendert oder gestoppt wird
        return () => clearTimeout(timer);
    }, [isAutoRunning, promptText, predictions]);


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
                            onClick={handlePredictClick}
                            disabled={!model} // Button deaktivieren, solange das Modell lädt/trainiert
                        >
                            Vorhersage
                        </button>

                        <button
                            type="button"
                            className="btn btn-primary-inverse fw-bold btn-fixed-width"
                            onClick={handleNext}
                            disabled={predictions.length === 0}
                        >
                            Weiter
                        </button>

                        {!isAutoRunning ? (
                            <button
                                type="button"
                                className="btn btn-secondary fw-bold btn-fixed-width"
                                onClick={() => setIsAutoRunning(true)}
                                disabled={!model} // Button deaktivieren, solange das Modell lädt/trainiert
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
                        {predictions.length > 0 ? (
                            predictions.map((pred, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    className="prediction-word-btn"
                                    // Optional: Bei Klick das Wort zum promptText hinzufügen
                                    onClick={() => setPromptText(promptText + ' ' + pred.word)}
                                >
                                    <span>{pred.word}</span>
                                    <span className="badge bg-secondary rounded-pill">
                    {pred.probability}%
                </span>
                                </button>
                            ))
                        ) : (
                            <p className="text-muted">Noch keine Vorhersage vorhanden.</p>
                        )}
                    </div>
                    {/* Diagramm für Loss & Accurency */}
                </div>
            </div>
        </div>
    );
}