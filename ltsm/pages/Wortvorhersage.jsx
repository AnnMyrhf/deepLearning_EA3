import React, {useState} from 'react';

export default function Wortvorhersage() {

    // State Toogle-Button-Logik
    const [isAutoRunning, setIsAutoRunning] = useState(false);

    // Inhalt Textfeld
    const [promptText, setPromptText] = useState('');

    // Zurücksetzen des Textfelds und Stoppen der Automatik
    const handleReset = () => {
        setPromptText('');
        setIsAutoRunning(false);
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
                        className="form-label h5 fw-bold card-label d-block mb-3"
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
                            className="btn btn-clear-results fw-bold p-0 ms-3 mt-1"
                            aria-label="Eingabe und Netzwerk zurücksetzen"
                            onClick={handleReset}
                        >
                            <span className="btn-icon">↺</span>
                            Zurücksetzen
                        </button>
                    </div>
                </div>

                <div className="wortvorhersage-controls p-5">

                    <div className="d-flex flex-wrap gap-3 align-items-center justify-content-center">

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

                    <div className="wortvorhersage-status text-center mt-4 text-secondary small fw-bold">
                        {isAutoRunning
                            ? 'Automatik läuft...'
                            : 'Warten auf Eingabe'}
                    </div>
                </div>

                <div
                    className="p-4 border rounded-4 dashboard-chart-card shadow-sm text-start mt-4 wortvorhersage-results"
                    aria-live="polite"
                >
                    <h3 className="h6 fw-bold chart-card-title mb-3">
                        Wahrscheinlichste nächste Wörter
                    </h3>

                    <div className="d-flex flex-wrap gap-2">
                        <button
                            type="button"
                            className="btn btn-outline-secondary rounded-pill d-flex align-items-center gap-2"
                        >
                            <span>und</span>
                            <span className="badge bg-secondary rounded-pill">
                            45%
                        </span>
                        </button>

                        <button
                            type="button"
                            className="btn btn-outline-secondary rounded-pill d-flex align-items-center gap-2"
                        >
                            <span>die</span>
                            <span className="badge bg-secondary rounded-pill">
                            30%
                        </span>
                        </button>

                        <button
                            type="button"
                            className="btn btn-outline-secondary rounded-pill d-flex align-items-center gap-2"
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