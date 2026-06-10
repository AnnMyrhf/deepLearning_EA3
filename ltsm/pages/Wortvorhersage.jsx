import React from 'react';

export default function Wortvorhersage() {
    return (<div className="container py-5 mb-5">
        <header className="mb-4">
            <h1 className="display-4 fw-bold dashboard-title mb-3">Wortvorhersage</h1>
            <p className="lead dashboard-subtitle mb-3">
                Gib deinen Text ein und lass das neuronale Netz die wahrscheinlichsten folgenden Wörter berechnen.
            </p>
        </header>

        <div className="card border-0 shadow-sm epoch-card p-4 mb-4">
            {/* Prompt-Eingabe */}
            <div className="mb-4 text-start">
                <label htmlFor="promptInput" className="form-label h5 fw-bold epoch-card-label d-block mb-2">
                    Text-Eingabe (Prompt)
                </label>
                <textarea
                    id="promptInput"
                    className="form-control epoch-input mb-2"
                    rows="4"
                    placeholder="Gib hier deinen Text aus vollständigen Wörtern ein..."
                    aria-describedby="promptHelp"
                ></textarea>
                {/* Help-Text und Reset-Button  */}
                <div className="d-flex justify-content-between align-items-start mt-2">
                    <div id="promptHelp" className="form-text text-secondary mb-0">
                        Bitte nur vollständige, durch Leerzeichen getrennte Wörter eingeben
                    </div>
                    <button
                        type="button"
                        className="btn btn-clear-results fw-bold p-0 ms-3 mt-1"
                        aria-label="Eingabe und Netzwerk zurücksetzen"
                    >
                        <span className="btn-icon">↺</span> Zurücksetzen
                    </button>
                </div>
            </div>
            {/* Kontroll-Buttons */}
            <div className="d-flex flex-wrap gap-3 mb-4 align-items-center">
                <button
                    type="button"
                    className="btn btn-cta fw-bold"
                    aria-label="Wahrscheinlichkeiten für das nächste Wort berechnen"
                >Vorhersage
                </button>
                <button
                    type="button"
                    className="btn btn-custom-inverse fw-bold"
                    aria-label="Wahrscheinlichstes Wort annehmen und weiter"
                >
                    Weiter <span className="btn-icon ms-1"></span>
                </button>
                <div className="btn-group" role="group" aria-label="Automatische Vorhersage">
                    <button
                        type="button"
                        className="btn btn-primary fw-bold"
                        aria-label="Automatisch 10 Wörter vorhersagen"
                    >
                        Auto
                    </button>
                    <button
                        type="button"
                        className="btn btn-secondary-inverse fw-bold"
                        aria-label="Automatische Vorhersage anhalten"
                    >
                        Stopp
                    </button>
                </div>
            </div>
            {/* Auswahl eines der nächsten Wörter */}
            <div className="p-4 border rounded-4 dashboard-chart-card shadow-sm text-start" aria-live="polite">
                <h3 className="h6 fw-bold chart-card-title mb-3">Wahrscheinlichste nächste Wörter</h3>

                {/* Beispielhafte Darstellung der generierten Wörter */}
                <div className="d-flex flex-wrap gap-2">
                    <button
                        type="button"
                        className="btn btn-outline-secondary rounded-pill d-flex align-items-center gap-2"
                        aria-label="Wort 'und' mit 45% Wahrscheinlichkeit auswählen"
                    >
                        <span>und</span>
                        <span className="badge bg-secondary rounded-pill">45%</span>
                    </button>

                    <button
                        type="button"
                        className="btn btn-outline-secondary rounded-pill d-flex align-items-center gap-2"
                        aria-label="Wort 'die' mit 30% Wahrscheinlichkeit auswählen"
                    >
                        <span>die</span>
                        <span className="badge bg-secondary rounded-pill">30%</span>
                    </button>

                    <button
                        type="button"
                        className="btn btn-outline-secondary rounded-pill d-flex align-items-center gap-2"
                        aria-label="Wort 'aber' mit 15% Wahrscheinlichkeit auswählen"
                    >
                        <span>aber</span>
                        <span className="badge bg-secondary rounded-pill">15%</span>
                    </button>
                </div>

                {/* Fallback-Text, wenn noch keine Vorhersage gestartet wurde */}
                {/* <div className="py-4 small placeholder-text text-center">Vorhersage starten für Visualisierung</div> */}
            </div>
        </div>
    </div>);
}