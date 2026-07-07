import React, {useState, useEffect, useRef} from 'react';
import * as tf from '@tensorflow/tfjs';
import * as tfvis from '@tensorflow/tfjs-vis';

const SEQUENCE_LENGTH = 10;
const EPOCHS = 35;
const BATCHSIZE = 16;
const TOP_K = 5;
const LEARNING_RATE = 0.005;

export default function Wortvorhersage() {

    // State für den Auto-Modus
    const [isAutoRunning, setIsAutoRunning] = useState(false);

    // Aktueller Inhalt des Texteingabefelds
    const [promptText, setPromptText] = useState('');

    // Vokabular und Wort-Mappings
    const [vocabData, setVocabData] = useState(null);

    // TensorFlow-Modell
    const [model, setModel] = useState(null);

    // Aktuelle Vorhersagen
    const [predictions, setPredictions] = useState([]);

    // Trainingsstatus
    const [isTraining, setIsTraining] = useState(false);
    const [isModelReady, setIsModelReady] = useState(false);

    // Endlosschleife
    const [endlessWarning, setEndlessWarning] = useState('');

    // Trainingsfortschritt
    const [currentEpoch, setCurrentEpoch] = useState(0);
    const [metrics, setMetrics] = useState({loss: '-', acc: '-'});

    // Trainingsverlauf für Diagramm
    const [trainingHistory, setTrainingHistory] = useState([]);
    const trainingId = useRef(0);

    // Referenz für das tfvis-Diagramm
    const chartRef = useRef(null);

    // Experimentdaten speichern
    const [experimentHistory, setExperimentHistory] = useState([]);

    // Datensatz beim Start laden
    useEffect(() => {
        const fetchDataset = async () => {
            try {
                await tf.setBackend('webgl');
                await tf.ready();

                // Trainingsdatensatz laden

                // Grosser Datensatz
                //const response = await fetch('/model/trainingsdata_big.txt');

                // Mittelgrosser Datensatz
                const response = await fetch('/model/trainingsdata_medium.txt');

                // Kleiner Datensatz
                // const response = await fetch('/model/trainingsdata_small.txt');
                const rawText = await response.text();

                console.log("Datensatz erfolgreich geladen. Zeichenanzahl:", rawText.length);

                // Text bereinigen und Vokabular erstellen
                const cleanedText = cleanText(rawText);
                const vocab = buildVocabulary(cleanedText);

                setVocabData(vocab);

                console.log("Vokabular erfolgreich erstellt!");
                console.log("Größe des Vokabulars:", vocab.vocabSize);

                // 4. Sequenzen erstellen (laut Aufgabe mit Längen wie 5, 10, 15 experimentieren)
                const tensorBatches = createSequencesAsTensors(vocab.tokens, vocab.word2idx, SEQUENCE_LENGTH);
                // 3. In TensorFlow Tensoren umwandeln
                // xs wird ein 2D-Tensor: [Anzahl_Sequenzen, Sequenzlänge]
                const xs = tf.concat(tensorBatches.map(b => b.xs));
                const ys = tf.concat(tensorBatches.map(b => b.ys));

                // Einzelne Batches sofort aus dem Speicher löschen
                tensorBatches.forEach(b => {
                    b.xs.dispose();
                    b.ys.dispose();
                });

                console.log("Tensoren erfolgreich erstellt!");
                console.log("Shape von X (Eingabe):", xs.shape);
                console.log("Shape von Y (Label):", ys.shape);

                // Modell verzögert trainieren, um UI-Blockierung zu vermeiden
                setTimeout(async () => {
                    const trainedModel = await buildAndTrainModel(xs, ys, vocab.vocabSize);
                    setModel(trainedModel);

                    // Finale Tensoren aufräumen, nachdem das Modell sie kopiert hat
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
        chartRef.current.innerHTML = '';

        if (trainingHistory.length === 0)
            return;

        const lossData = trainingHistory.map((d, i) => ({x: i + 1, y: d.loss}));
        const accData = trainingHistory.map((d, i) => ({x: i + 1, y: d.acc}));

        const data = {
            values: [lossData, accData],
            series: ['Loss', 'Genauigkeit']
        };

        const options = {
            xLabel: 'Epoche',
            yLabel: 'Wert',
            height: 300,
        };

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
        }

        // 3. Netzwerk im Ausgangszustand neu erstellen und trainieren
        if (vocabData) {
            try {
                const tensorBatches = createSequencesAsTensors(vocabData.tokens, vocabData.word2idx, SEQUENCE_LENGTH);

                // Zusammenführen
                const xs = tf.concat(tensorBatches.map(b => b.xs));
                const ys = tf.concat(tensorBatches.map(b => b.ys));

                // Aufräumen der Batches
                tensorBatches.forEach(b => {
                    b.xs.dispose();
                    b.ys.dispose();
                });

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

    // Text bereinigen und normalisieren
    const cleanText = (text) => {
        // Alles in Kleinbuchstaben umwandeln
        let cleaned = text.toLowerCase();

        // Sonderzeichen und Zahlen entfernen, Umlaute behalten
        cleaned = cleaned.replace(/[^a-zäöüß\s]/g, ' ');

        // Mehrfache Leerzeichen und Zeilenumbrüche durch ein einziges Leerzeichen ersetzen
        cleaned = cleaned.replace(/\s+/g, ' ').trim();

        return cleaned;
    };

    // Hilfsfunktion, um Vokabular und Mappings erstellen
    const buildVocabulary = (text) => {
        // Text an Leerzeichen aufteilen
        const words = text.split(' ');

        // Map verwenden, um die Häufigkeit zu zählen und Unikate zu finden
        // Map ist bei großen Datenmengen effizienter als ein Object
        const wordCounts = new Map();

        for (const word of words) {
            if (!wordCounts.has(word)) {
                wordCounts.set(word, true);
            }
        }

        // Vokabular-Liste erstellen
        // OOV-Token direkt am Anfang hinzufuegen
        const uniqueWords = ['<OOV>', ...wordCounts.keys()];

        const word2idx = {};
        const idx2word = {};

        // Mappings effizient befüllen
        uniqueWords.forEach((word, index) => {
            word2idx[word] = index;
            idx2word[index] = word;
        });

        return {
            word2idx,
            idx2word,
            vocabSize: uniqueWords.length,
            tokens: words
        };
    };

    // Trainingssequenzen erstellen
    const createSequencesAsTensors = (tokens, word2idx, sequenceLength = 5, chunkSize = 1000) => {
        const sequencesX = [];
        const labelsY = [];
        const tensors = [];

        for (let i = 0; i < tokens.length - sequenceLength; i++) {
            const sequenceTokens = tokens.slice(i, i + sequenceLength);
            const targetToken = tokens[i + sequenceLength];

            const sequenceIds = sequenceTokens.map(word => word2idx[word] ?? 0);
            const targetId = word2idx[targetToken] ?? 0;

            sequencesX.push(sequenceIds);
            labelsY.push(targetId);

            // Wenn die Chunk-Größe erreicht ist, erzeugt Tensor und leert die Arrays
            if (sequencesX.length >= chunkSize) {
                tensors.push({
                    xs: tf.tensor2d(sequencesX, [sequencesX.length, sequenceLength]),
                    ys: tf.tensor1d(labelsY, 'float32')
                });
                sequencesX.length = 0;
                labelsY.length = 0;
            }
        }

        // Restliche Daten verarbeiten
        if (sequencesX.length > 0) {
            tensors.push({
                xs: tf.tensor2d(sequencesX, [sequencesX.length, sequenceLength]),
                ys: tf.tensor1d(labelsY, 'float32')
            });
        }

        return tensors; // Gibt ein Array von Tensor-Paaren zurück
    };

    // Model trainieren
    const buildAndTrainModel = async (xs, ys, vocabSize) => {
        const currentTraining = ++trainingId.current;
        const model = tf.sequential();

        // Embedding Layer
        model.add(tf.layers.embedding({
            inputDim: vocabSize, outputDim: 50,
            inputLength: SEQUENCE_LENGTH,
            embeddingsInitializer: 'glorotUniform'
        }));

        // 1. Hidden Layer: LSTM
        model.add(tf.layers.lstm({
            units: 100, returnSequences: false, kernelInitializer: 'glorotUniform',
            recurrentInitializer: 'glorotUniform'
        }));

        // 2. Hidden Layer: LSTM
        // model.add(tf.layers.lstm({
        //     units: 100,
        //     returnSequences: false,
        //     kernelInitializer: 'glorotUniform',
        //     recurrentInitializer: 'glorotUniform'
        // }));

        // 3. Output Layer: Dense Layer mit Softmax
        // Berechnet Wortwahrscheinlichkeiten
        model.add(tf.layers.dense({
            units: vocabSize, activation: 'softmax'
        }));

        // Sparse-Loss für numerische Klassen-IDs
        model.compile({
            optimizer: tf.train.adam(LEARNING_RATE),
            loss: 'sparseCategoricalCrossentropy', metrics: ['accuracy']
        });

        // Training starten: Status setzen
        setIsTraining(true);
        setTrainingHistory([]); // Verlauf vor dem Initialtraining leeren

        /// Gib Browser Zeit für ein Rendering-Update
        await new Promise(resolve => requestAnimationFrame(resolve));

        // Training starten
        await model.fit(xs, ys, {
            epochs: EPOCHS,
            batchSize: BATCHSIZE,
            callbacks: {
                onEpochBegin: async (epoch) => {
                    setCurrentEpoch(epoch + 1);
                },
                onEpochEnd: async (epoch, logs) => {
                    if (currentTraining !== trainingId.current) {
                        return;
                    }
                    // Werte für die UI und History vorbereiten
                    const lossVal = logs.loss;
                    const accVal = logs.accuracy !== undefined ? logs.accuracy : logs.acc;

                    // UI-Metriken aktualisieren
                    setMetrics({
                        loss: lossVal.toFixed(4),
                        acc: (accVal * 100).toFixed(1) + '%'
                    });

                    // Training-History für das manuelle tfvis-Diagramm aktualisieren
                    setTrainingHistory(prev => [...prev, {
                        loss: lossVal,
                        acc: accVal
                    }]);

                    // Experiment in die Tabelle speichern, wenn fertig
                    if (epoch === EPOCHS - 1) {
                        saveExperiment(lossVal, accVal);
                    }

                    // Thread freigeben
                    await tf.nextFrame();
                }
            }
        });

        // Training fertig
        setIsModelReady(true);
        setIsTraining(false);

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

    // Vorhersage ausführen
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

            // State aktualisieren und nächste Vorhersage anstossen
            setPromptText(updatedText);
            const nextTopK = await calculatePrediction(updatedText);
            setPredictions(nextTopK);
        }
    };

    // Automatische Wortfortsetzung starten
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
            learning: LEARNING_RATE,
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
                        {/* Eingabefeld */}
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
                    {/* Control-Buttons */}
                    <div className="wortvorhersage-controls p-5">

                        <div className="prediction-actions">
                            <button
                                type="button"
                                className="btn btn-cta fw-bold btn-fixed-width"
                                onClick={handlePredictClick}
                                disabled={!model || isTraining}
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
                                disabled={!model || isTraining || predictions.length === 0}
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
                        {/* Vorhersage-Container */}
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
                        <p className="chart-container-wrapper-text small">Warte auf Trainingsdaten...</p>
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
            </div>
            {/* Tabelle fuer Trainingsdaten */}
            <div className="mt-5">
                <h5 className="fw-bold mb-3">Trainingsdaten</h5>
                <div className="table-responsive">
                    <table className="table table-bordered table-hover">
                        <thead className="table-light">
                        <tr>
                            <th>Learning Rate</th>
                            <th>Sequenz</th>
                            <th>BatchSize</th>
                            <th>Epochen</th>
                            <th>Loss</th>
                            <th>Genauigkeit</th>
                        </tr>
                        </thead>
                        <tbody>
                        {experimentHistory.map((exp) => (
                            <tr key={exp.id}>
                                <td>{exp.learning}</td>
                                <td>{exp.seq}</td>
                                <td>{exp.batch}</td>
                                <td>{exp.epochs}</td>
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