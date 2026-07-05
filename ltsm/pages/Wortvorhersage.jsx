import React, { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as tfvis from '@tensorflow/tfjs-vis';

const SEQUENCE_LENGTH = 5;
const EPOCHS = 10;
const BATCHSIZE = 32;
const TOP_K = 5;

export default function Wortvorhersage() {

    // State Toogle-Button-Logik
    const [isAutoRunning, setIsAutoRunning] = useState(false);

    // Inhalt Textfeld
    const [promptText, setPromptText] = useState('');

    // State für Vokabular und Mappings
    const [vocabData, setVocabData] = useState(null);

    // State, um das TensorFlow-Modell später zu speichern
    const [model, setModel] = useState(null);

    // State für die berechneten Vorhersagen
    const [predictions, setPredictions] = useState([]);

    // State um Training zu tracken
    const [isTraining, setIsTraining] = useState(false);

    const [isModelReady, setIsModelReady] = useState(false);

    // States für Endloschleifen bei Automatik-Funktion
    const [endlessWarning, setEndlessWarning] = useState('');

    // States fuer den Traningsfortschritt
    const [currentEpoch, setCurrentEpoch] = useState(0);
    const [metrics, setMetrics] = useState({loss: '-', acc: '-'});

    // State für den Traningsverlauf
    const [trainingHistory, setTrainingHistory] = useState([]);

    // Referenz für den Container des tfvis-Diagramms
    const chartRef = useRef(null);

    // State für Doku der Experimente
    const [experimentHistory, setExperimentHistory] = useState([]);

    // Text beim ersten Rendern der Komponente laden
    useEffect(() => {
        const fetchDataset = async () => {
            try {
                await tf.setBackend('webgl');
                await tf.ready();

                // Grosser Datensatz
                //const response = await fetch('/model/trainingsdata_big.txt');

                // Kleiner Datensatz
                const response = await fetch('/model/trainingsdata_small.txt');
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

                // 4. Sequenzen erstellen (laut Aufgabe mit Längen wie 5, 10, 15 experimentieren)
                const {sequencesX, labelsY} = createSequences(vocab.tokens, vocab.word2idx, SEQUENCE_LENGTH);

                // 3. In TensorFlow Tensoren umwandeln
                // xs wird ein 2D-Tensor: [Anzahl_Sequenzen, Sequenzlänge]
                const xs = tf.tensor2d(sequencesX, [sequencesX.length, SEQUENCE_LENGTH]);

                // ys wird ein 1D-Tensor mit den Ziel-IDs
                const ys = tf.tensor1d(labelsY, 'float32');

                console.log("Tensoren erfolgreich erstellt!");
                console.log("Shape von X (Eingabe):", xs.shape);
                console.log("Shape von Y (Label):", ys.shape);

                // Modell aufbauen und trainieren (Training startet kurz verzögert, damit die UI flüssig bleibt)
                setTimeout(async () => {
                    const trainedModel = await buildAndTrainModel(xs, ys, vocab.vocabSize);
                    setModel(trainedModel);

                    xs.dispose();
                    ys.dispose();

                    console.log("Modell ist bereit für Vorhersagen!");
                }, 500);

            } catch (error) {
                console.error("Fehler beim Laden oder Verarbeiten:", error);
            }
        };

        fetchDataset();
    }, []); // Das leere Array sorgt dafür, dass dies nur einmal beim Mounten passiert

    // Effect zum Zeichnen des tfvis Diagramms, sobald sich die History ändert
    useEffect(() => {
        if (!chartRef.current) return;

        if (trainingHistory.length === 0) {
            chartRef.current.innerHTML = '';
            return;
        }
        const lossData = trainingHistory.map((d, i) => ({x: i + 1, y: d.loss}));
        const accData = trainingHistory.map((d, i) => ({x: i + 1, y: d.acc}));

        const data = {
            values: [lossData, accData],
            series: ['Loss', 'Genauigkeit']
        };

        const options = {
            xLabel: 'Epoche)',
            yLabel: 'Wert',
            height: 300
        };

        //chartRef.current.innerHTML = '';

        tfvis.render.linechart(chartRef.current, data, options);

    }, [trainingHistory]);

    const handleReset = async () => {
        // 1. UI-States zurücksetzen
        setIsAutoRunning(false);
        setPromptText('');
        setPredictions([]);
        setIsModelReady(false);
        setEndlessWarning('');
        setTrainingHistory([]);

        // 2. Altes Modell aus dem WebGL-Speicher löschen
        if (model) {
            model.dispose(); // Gibt GPU-Ressourcen frei
            setModel(null);
            console.log("Altes Modell erfolgreich aus dem Speicher gelöscht");
        }

        // 3. Netzwerk im Ausgangszustand neu erstellen und trainieren
        if (vocabData) {
            try {
                const {sequencesX, labelsY} = createSequences(vocabData.tokens, vocabData.word2idx, SEQUENCE_LENGTH);

                const xs = tf.tensor2d(sequencesX, [sequencesX.length, SEQUENCE_LENGTH]);
                const ys = tf.tensor1d(labelsY, 'float32');

                // Kurz verzögern, damit die UI den Ladezustand anzeigen kann
                setTimeout(async () => {
                    const trainedModel = await buildAndTrainModel(xs, ys, vocabData.vocabSize);
                    setModel(trainedModel);

                    // Temporäre Tensoren nach dem Training sofort aufräumen
                    xs.dispose();
                    ys.dispose();

                    console.log("Modell wurde erfolgreich auf den Ausgangszustand zurückgesetzt!");
                }, 200);

            } catch (error) {
                console.error("Fehler beim Reset des Modells:", error);
            }
        }
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
            word2idx, idx2word, vocabSize: uniqueWords.length, tokens: words // Die bereinigte, chronologische Liste aller Wörter des Textes
        };
    };

    // Trainingssequenzen erstellen
    const createSequences = (tokens, word2idx, sequenceLength = 5) => {
        const sequencesX = [];
        const labelsY = [];

        // Wir iterieren durch das Array, stoppen aber früh genug,
        // damit wir am Ende nicht über das Array hinausschießen
        for (let i = 0; i < tokens.length - sequenceLength; i++) {

            // Schneide ein Fenster der Länge sequenceLength aus
            const sequenceTokens = tokens.slice(i, i + sequenceLength);

            // Das Wort direkt nach dem Fenster ist unser Ziel
            const targetToken = tokens[i + sequenceLength];

            // Wandle die Wörter in ihre entsprechenden IDs (Zahlen) um
            const sequenceIds = sequenceTokens.map(word => word2idx[word] ?? 0);
            const targetId = word2idx[targetToken] ?? 0;

            // Füge sie unseren finalen Arrays hinzu
            sequencesX.push(sequenceIds);
            labelsY.push(targetId);
        }

        return {
            sequencesX, labelsY
        };
    };

    // Model trainieren
    const buildAndTrainModel = async (xs, ys, vocabSize) => {
        const model = tf.sequential();

        // 1. Embedding Layer
        // Wandelt die Wort-IDs in dichte Vektoren um
        model.add(tf.layers.embedding({
            inputDim: vocabSize, outputDim: 50, // Dimensionalität der Einbettung
            inputLength: 5, // Muss der SEQUENCE_LENGTH entsprechen
            embeddingsInitializer: 'glorotUniform' // Diese Methode ist schneller und standardmäßig empfohlen
        }));

        // 2. Hidden Layer: LSTM (Mindestens 100 Units laut Aufgabe)
        model.add(tf.layers.lstm({
            units: 100, returnSequences: false, kernelInitializer: 'glorotUniform', // Initialisierer für die Gewichte
            recurrentInitializer: 'glorotUniform' // Initialisierer für die rekurrenten Gewichte
        }));

        // 3. Output Layer: Dense Layer mit Softmax
        // Gibt Wahrscheinlichkeiten für jedes mögliche Wort im Vokabular aus
        model.add(tf.layers.dense({
            units: vocabSize, activation: 'softmax'
        }));

        // 4. Kompilieren
        // Wir nutzen 'sparseCategoricalCrossentropy', da unsere Labels (Y) einfache IDs und keine One-Hot-Vektoren sind
        model.compile({
            optimizer: tf.train.adam(0.01), // Learning Rate von 0.01 laut Aufgabe
            loss: 'sparseCategoricalCrossentropy', metrics: ['accuracy']
        });

        // Training starten: Status setzen
        setIsTraining(true);
        setTrainingHistory([]); // Verlauf vor dem Initialtraining leeren

        /// Gib dem Browser Zeit für ein Rendering-Update
        await new Promise(resolve => requestAnimationFrame(resolve));

        // Training starten
        await model.fit(xs, ys, {
            epochs: EPOCHS, batchSize: BATCHSIZE, callbacks: {
                onEpochBegin: async (epoch) => {
                    // Setzt die aktuelle Epoche (Index startet bei 0, daher + 1)
                    setCurrentEpoch(epoch + 1);
                }, onEpochEnd: async (epoch, logs) => {
                    const currentLoss = logs.loss.toFixed(4);
                    const currentAcc = logs.accuracy !== undefined ? logs.accuracy : logs.acc;                    // Speichert die aktuellen Werte für die UI
                    setMetrics({
                        loss: logs.loss.toFixed(4), acc: (currentAcc * 100).toFixed(1) + '%'
                    });

                    setTrainingHistory(prev => [...prev, {
                        id: `I-${epoch + 1}`,
                        label: `Epoche ${epoch + 1}`,
                        loss: currentLoss,
                        acc: currentAcc
                    }]);

                    // Speichert das Experiment automatisch nach der letzten Epoche
                    if (epoch === EPOCHS - 1) {
                        saveExperiment(parseFloat(currentLoss), parseFloat(currentAcc));
                    }

                    // Zwingt TensorFlow, den Haupt-Thread kurz freizugeben, damit React rendern kann
                    await tf.nextFrame();
                }
            }
        });

        // Training fertig
        setIsModelReady(true);
        setIsTraining(false);

        const finalMetrics = trainingHistory[trainingHistory.length - 1];
        if (finalMetrics) {
            saveExperiment(parseFloat(finalMetrics.loss), parseFloat(finalMetrics.acc));
        }

        // Zusammenfassung Architektur zur Überprüfung in Konsole ausgeben
        model.summary();

        return model;
    };

    // Reine Berechnungsfunktion, die einen Text als Parameter annimmt
    const calculatePrediction = async (currentText) => {
        if (!model || !vocabData || !currentText) return [];

        const {word2idx, idx2word} = vocabData;

        const cleanedText = cleanText(currentText);
        let inputTokens = cleanedText.split(' ').filter(word => word.length > 0);

        if (inputTokens.length > SEQUENCE_LENGTH) {
            inputTokens = inputTokens.slice(-SEQUENCE_LENGTH);
        } else if (inputTokens.length < SEQUENCE_LENGTH) {
            const padding = Array(SEQUENCE_LENGTH - inputTokens.length).fill('<OOV>');
            inputTokens = [...padding, ...inputTokens];
        }

        const inputIds = inputTokens.map(word => word2idx[word] ?? word2idx['<OOV>']);
        const inputTensor = tf.tensor2d([inputIds], [1, SEQUENCE_LENGTH]);

        const predictionTensor = model.predict(inputTensor);

        const probabilities = await predictionTensor.data();

        const probsArray = Array.from(probabilities).map((prob, index) => ({
            prob, index
        }));

        probsArray.sort((a, b) => b.prob - a.prob);

        const topK = probsArray.slice(0, TOP_K).map(item => ({
            word: idx2word[item.index], probability: Math.round(item.prob * 100)
        }));

        inputTensor.dispose();
        predictionTensor.dispose();

        return topK;
    };

    const handlePredictClick = async () => {
        const topK = await calculatePrediction(promptText);
        setPredictions(topK);
    };

    const handleWordClick = async (word) => {
        // Text direkt zusammensetzen, um die Asynchronität von React zu umgehen
        const updatedText = (promptText + ' ' + word).trim();
        setPromptText(updatedText);

        // Sofort die neue Vorhersage für den aktualisierten Text berechnen
        const nextTopK = await calculatePrediction(updatedText);
        setPredictions(nextTopK);
    };

    // Wird aufgerufen, wenn der Nutzer auf "Vorhersage" klickt
    const handleNext = async () => {
        if (predictions.length > 0) {
            const bestWord = predictions[0].word;
            const updatedText = (promptText + ' ' + bestWord).trim();

            // Endlosschleifen erkennen
            const wordsArray = updatedText.split(' ');
            if (wordsArray.length >= 5) {
                const lastFiveWords = wordsArray.slice(-5);
                // Prüfen, ob das exakt selbe Wort 5-mal hintereinander kam
                const isLooping = lastFiveWords.every(word => word === bestWord);

                if (isLooping) {
                    setIsAutoRunning(false); // Stoppt den Auto-Modus sofort
                    setEndlessWarning('Modell-Kollaps erkannt! Bitte auf "Zurücksetzen" klicken.');
                    setPromptText(updatedText);
                    return; // Bricht das weitere Training ab, um die Gewichte zu schützen
                }
            }
            // Warnung löschen, wenn alles normal läuft
            setEndlessWarning('');
            // 1. Tokens sicher aufbereiten (Padding)
            const cleanedText = cleanText(updatedText);
            let inputTokens = cleanedText.split(' ').filter(word => word.length > 0);

            if (inputTokens.length > SEQUENCE_LENGTH) {
                inputTokens = inputTokens.slice(-SEQUENCE_LENGTH);
            } else if (inputTokens.length < SEQUENCE_LENGTH) {
                const padding = Array(SEQUENCE_LENGTH - inputTokens.length).fill('<OOV>');
                inputTokens = [...padding, ...inputTokens];
            }

            // 2. IDs umwandeln
            const inputIds = inputTokens.map(word => vocabData.word2idx[word] ?? vocabData.word2idx['<OOV>']);
            const targetId = vocabData.word2idx[bestWord];

            // 3. Training
            setIsTraining(true);
            const xsLive = tf.tensor2d([inputIds], [1, SEQUENCE_LENGTH]);
            const ysLive = tf.tensor1d([targetId], 'float32');

            await model.fit(xsLive, ysLive, {
                epochs: 1,
                verbose: 0,
                callbacks: {
                    onEpochEnd: async (epoch, logs) => {
                        const liveLoss = logs.loss.toFixed(4);
                        const liveAcc = logs.accuracy !== undefined ? logs.accuracy : logs.acc;

                        setMetrics({
                            loss: liveLoss, acc: (liveAcc * 100).toFixed(1) + '%'
                        });

                        // Online-Learning Schritte ebenfalls visualisieren
                        setTrainingHistory(prev => [...prev, {
                            id: `L-${Date.now()}`,
                            label: `Live-Schritt`,
                            loss: liveLoss,
                            acc: liveAcc
                        }]);
                    }
                }
            });

            xsLive.dispose();
            ysLive.dispose();
            setIsTraining(false);

            // 4. State aktualisieren (JETZT KORREKT HIER)
            setPromptText(updatedText);
            const nextTopK = await calculatePrediction(updatedText);
            setPredictions(nextTopK);
        }
    };

    // Auto-Funktion (überwacht den Schalter isAutoRunning, wenn er aktiv ist, löst er nach einer bestimmten Zeit (z. B. 1,5 Sekunden) automatisch die handleWeiter-Funktion aus)
    useEffect(() => {
        if (!isAutoRunning || predictions.length === 0) return;

        const timer = setTimeout(async () => {
            await handleNext();
        }, 1500);

        return () => clearTimeout(timer);
    }, [isAutoRunning, promptText, predictions]);

    const saveExperiment = (loss, acc) => {
        const newExperiment = {
            id: experimentHistory.length + 1,
            seq: SEQUENCE_LENGTH,
            batch: BATCHSIZE,
            epochs: EPOCHS,
            k: TOP_K,
            loss: loss.toFixed(4),
            acc: acc.toFixed(4)
        };
        setExperimentHistory([...experimentHistory, newExperiment]);
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

            {!model ? (<div className="container py-5 text-center">
                    <div className="card border-0 shadow-sm p-5 mx-auto training-loading-card">
                        <div className="wortvorhersage-status mb-4">
                            {isTraining ? (<span
                                className="training-status-box">Modell lernt gerade...</span>) : ('Modell wird initialisiert...')}
                        </div>
                        {isTraining && (
                            <div className="mt-2 text-start">
                                <div className="d-flex justify-content-between mb-2 training-progress-info">
                                        <span className="fw-bold text-secondary">
                                        Epoche {currentEpoch} von {EPOCHS}
                                        </span>
                                </div>
                                <div className="progress mb-4 training-progress">
                                    <div
                                        className="progress-bar progress-bar-striped progress-bar-animated bg-warning"
                                        role="progressbar"
                                        style={{width: `${(currentEpoch / EPOCHS) * 100}%`}}
                                        aria-valuenow={currentEpoch}
                                        aria-valuemin="0"
                                        aria-valuemax={EPOCHS}
                                    />
                                </div>
                                <div className="d-flex justify-content-around p-3 rounded training-metrics-box">
                                    <div className="text-center">
                                        <span className="training-text small d-block">Loss-Wert</span>
                                        <strong className="text-danger h5 mb-0">{metrics.loss}</strong>
                                    </div>
                                    <div className="text-center">
                                        <span className="training-text small d-block">Genauigkeit</span>
                                        <strong className="text-success h5 mb-0">{metrics.acc}</strong>
                                    </div>
                                </div>
                            </div>)}
                    </div>
                </div>
            ) : (
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
                                disabled={!model || isTraining} // Button deaktivieren, solange das Modell lädt/trainiert
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

                            {!isAutoRunning ? (<button
                                type="button"
                                className="btn btn-secondary fw-bold btn-fixed-width"
                                onClick={() => setIsAutoRunning(true)}
                                disabled={!model || isTraining}// Button deaktivieren, solange das Modell lädt/trainiert
                            >
                                Auto
                            </button>) : (<button
                                type="button"
                                className="btn btn-danger fw-bold btn-fixed-width"
                                onClick={() => setIsAutoRunning(false)}
                            >
                                Stopp
                            </button>)}
                        </div>

                        <div className="wortvorhersage-status">
                            {isAutoRunning ? 'Automatik läuft...' : 'Warten auf Eingabe'}
                        </div>
                        {endlessWarning && (
                            <div className="alert alert-danger mt-3 mx-auto model-collapse-alert" role="alert">
                                <strong>Hinweis:</strong> {endlessWarning}
                            </div>
                        )}
                    </div>

                    <div
                        className="wortvorhersage-results dashboard-chart-card"
                        aria-live="polite"
                    >
                        <h3 className="h6 fw-bold chart-card-title mb-3">
                            Wahrscheinlichste nächste Wörter
                        </h3>

                        <div className="prediction-word-list">
                            {predictions.length > 0 ? (predictions.map((pred, idx) => (<button
                                key={idx}
                                type="button"
                                className="prediction-word-btn"
                                onClick={() => handleWordClick(pred.word)}
                            >
                                <span>{pred.word}</span>
                                <span className="badge bg-secondary rounded-pill">
                    {pred.probability}%
                </span>
                            </button>))) : (<p className="text-muted"> Noch keine Vorhersage vorhanden.
                            </p>)}
                        </div>
                    </div>
                </div>
                    )}
                    {/* Diagramm fuer Trainingsdaten */}
                    <div className="mt-4">
                        <h5 className="fw-bold mb-2">
                            Trainingsverlauf
                        </h5>
                    <div className="chart-container-wrapper p-3 border rounded bg-light">
                          {trainingHistory.length === 0 && (
                            <p className="text-muted small">Warte auf Trainingsdaten...</p>
                        )}
                        <div
                            ref={chartRef}
                            className="w-100"
                            style={{
                                minHeight: '300px',
                                display: trainingHistory.length > 0 ? 'block' : 'none'
                            }}
                        ></div>
                    </div>
                    </div>{/* NEU: Tabelle für Experimente-Dokumentation */}
            <div className="mt-5">
                <h5 className="fw-bold mb-3">Dokumentation der Experimente</h5>
                <div className="table-responsive">
                    <table className="table table-bordered table-hover">
                        <thead className="table-light">
                        <tr>
                            <th>Nr.</th>
                            <th>Sequenz</th>
                            <th>Batch</th>
                            <th>Epochen</th>
                            <th>k-Wert</th>
                            <th>Loss</th>
                            <th>Genauigkeit</th>
                        </tr>
                        </thead>
                        <tbody>
                        {experimentHistory.map((exp) => (
                            <tr key={exp.id}>
                                <td>{exp.id}</td>
                                <td>{exp.seq}</td>
                                <td>{exp.batch}</td>
                                <td>{exp.epochs}</td>
                                <td>{exp.k}</td>
                                <td>{exp.loss}</td>
                                <td>{exp.acc}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
    </div>
    );
}