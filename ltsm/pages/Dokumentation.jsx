export default function Dokumentation() {
    return (<div className="container py-5 mb-5 pb-5">
            <div className="row justify-content-center">
                {/* Haupt-Header */}
                <h1 className="display-4 fw-bold text-light mb-4">Dokumentation</h1>
                <p className="lead text-secondary mb-4">
                    Nachfolgend werden die technische und fachliche Umsetzung der Web-Anwendung erläutert. Dargestellt
                    werden der TechStack, die technischen Besonderheiten, Implementierung und Logik sowie die
                    Quellen. </p>
                <nav className="mb-4">
                    <ul className="list-unstyled d-flex flex-column gap-2">
                        <li><a href="#frameworks" className="text-primary text-decoration-none hover-link">→ Frameworks
                            & Infrastruktur</a></li>
                        <li><a href="#techBesonderheiten" className="text-primary text-decoration-none hover-link">→
                            Technische Besonderheiten</a></li>
                        <li><a href="#implementierung" className="text-primary text-decoration-none hover-link">→
                            Implementierung & Logik</a></li>
                        <li><a href="#quellen" className="text-primary text-decoration-none hover-link">→ Quellen</a>
                        </li>
                    </ul>
                </nav>
                {/* Frameworks & Tools */}
                <div className="mb-4">
                    <h2 id="frameworks" className="h4 fw-bold text-light border-bottom border-secondary pb-2 mb-4">
                        Frameworks & Infrastruktur
                    </h2>
                    <ul className="list-group list-group-flush">
                        <li className="list-group-item bg-transparent text-secondary border-secondary px-0 py-3">
                            <strong className="text-light">React</strong><p>Dient als Frontend-Framework für eine
                            komponentenbasierte Architektur. Die Nutzung von Hooks (useState, useEffect, useRef)
                            ermöglicht ein effizientes State-Management und eine reaktive Benutzeroberfläche.</p>
                        </li>
                        <li className="list-group-item bg-transparent text-secondary border-secondary px-0 py-3">
                            <strong className="text-light">TensorFlow.js</strong><p>Kern-Bibliothek zur Erstellung, zum
                            Training und zur Vorhersage mittels neuronaler Netze direkt im Browser.</p>
                        </li>
                        <li className="list-group-item bg-transparent text-secondary border-secondary px-0 py-3">
                            <strong className="text-light">tfjs-vis</strong><p>Wird als Modell-Visor zur Visualisierung
                            des
                            Trainingsverlaufs (Loss und Genauigkeit) genutzt.</p>
                        </li>
                        <li className="list-group-item bg-transparent text-secondary border-secondary px-0 py-3">
                            <strong className="text-light">Bootstrap 5</strong> <p>Wird für das responsive Layout und
                            die UI-Komponenten verwendet, um eine konsistente Darstellung auf mobilen und
                            Desktop-Endgeräten zu gewährleisten.</p></li>
                        <li className="list-group-item bg-transparent text-secondary border-secondary px-0 py-3">
                            <strong className="text-light">Vite</strong> <p>Modernes Build-Tool für schnelle
                            Entwicklungszyklen sowie optimierte Productions Builds.</p></li>
                        <li className="list-group-item bg-transparent text-secondary border-secondary px-0 py-3">
                            <strong className="text-light">Render</strong> <p>Plattform für Hosting und Continuous
                            Deployment (CD), um Aktualisierungen automatisiert bereitzustellen.</p></li>
                    </ul>
                </div>
                {/* Technische Besonderheiten */}
                <div className="mb-4">
                    <h2 id="techBesonderheiten"
                        className="h4 fw-bold text-light border-bottom border-secondary pb-2 mb-4">
                        Technische Besonderheiten
                    </h2>
                    <ul className="list-group list-group-flush">
                        <li className="list-group-item bg-transparent text-secondary border-secondary px-0 py-3">
                            <strong className="text-light">Speicherverwaltung</strong>
                            <p>Temporäre Tensoren und nicht mehr benötigte GPU-Ressourcen werden gezielt mit .dispose()
                                freigegeben, um Speicherverbrauch und WebGL-Probleme zu reduzieren.</p>
                        </li>
                        <li className="list-group-item bg-transparent text-secondary border-secondary px-0 py-3">
                            <strong className="text-light">Nicht-blockierende UI</strong>
                            <p>Durch regelmäßige Übergaben an den Browser-Eventloop mittels requestAnimationFrame() und
                                tf.nextFrame() bleibt die Oberfläche während längerer Trainingsprozesse bedienbar.</p>
                        </li>
                        <li className="list-group-item bg-transparent text-secondary border-secondary px-0 py-3">
                            <strong className="text-light">Schutz vor Modell-Kollaps</strong>
                            <p>Ein Überwachungsmechanismus prüft während der automatischen Textgenerierung, ob fünfmal
                                in
                                Folge dasselbe Wort generiert wurde. Bei Erkennung einer solchen Endlosschleife wird der
                                Auto-Modus sofort gestoppt und der User darauf hingewiesen.</p>
                        </li>
                        <li className="list-group-item bg-transparent text-secondary border-secondary px-0 py-3">
                            <strong className="text-light">Ressourcenschonende Sequenzerstellung</strong>
                            <p>Die Funktion createSequencesAsTensors verarbeitet die Tokens in "Chunks" (Standardgröße
                                1000), um RAM-Probleme bei der Tensor-Generierung zu umgehen.</p>
                        </li>
                        <li className="list-group-item bg-transparent text-secondary border-secondary px-0 py-3">
                            <strong className="text-light">Theme-Management</strong>
                            <p>Wie bereits bei EA 1 & 2 werden zentrale CSS-Variablen für ein konsistentes Design
                                zwischen
                                Light- und Dark Mode genutzt und über das Attribut [data-bs-theme] gesteuert.</p>
                        </li>
                    </ul>
                </div>
                {/* Implementierung & Logik */}
                <div className="mb-4">
                    <h2 id="implementierung" className="h4 fw-bold text-light border-bottom border-secondary pb-2 mb-4">
                        Implementierung & Logik
                    </h2>
                    <ul className="list-group list-group-flush">
                        <li id="automatische-uebersetzung"
                            className="list-group-item bg-transparent text-secondary border-secondary px-0 py-3">
                            <strong className="text-light">Modell-Architektur & Training
                            </strong>
                            <p>Die Modell-Architektur besteht aus einer Embedding-Layer (Output Dimension 50), einer
                                LSTM-Layer (100 Units) und einer Dense-Output-Layer mit
                                Softmax-Aktivierung. Als Loss-Funktion wird sparseCategoricalCrossentropy verwendet.
                                Optimiert wird das Modell mit dem Adam-Optimizer und einer Learning Rate von 0.005. Das
                                Training über 35 Epochen mit einer Batch Size von 16 sowie die anschließende Berechnung der Vorhersagen erfolgen
                                vollständig clientseitig im Browser mit WebGL-Beschleunigung.</p>
                        </li>
                        <li id="automatische-uebersetzung"
                            className="list-group-item bg-transparent text-secondary border-secondary px-0 py-3">
                            <strong className="text-light">Datenaufbereitung
                            </strong>
                            <p>Der mittels KI erstellte Datensatz zum Thema "Reisen und Urlaub" (Roh-Zeichenanzahl:
                                11.368)
                                wird für das Training im deutschen Sprachraum bereinigt. Dabei werden Sonderzeichen und
                                Zahlen entfernt, deutsche Umlaute (ä, ö, ü, ß) jedoch explizit beibehalten. Aus diesem
                                bereinigten Text wird ein eindeutiges Vokabular extrahiert. Es umfasst inklusive des
                                integrierten OOV-Tokens insgesamt 789 Wörter. Durch den Token bleiben User-Eingaben
                                außerhalb des Trainingsvokabulars verarbeitbar.</p>
                        </li>
                        <li id="automatische-uebersetzung"
                            className="list-group-item bg-transparent text-secondary border-secondary px-0 py-3">
                            <strong className="text-light">Top-K-Vorhersage
                            </strong>
                            <p>Die Ausgabe beschränkt sich nicht auf das wahrscheinlichste Wort, sondern zeigt die fünf
                                wahrscheinlichsten Kandidaten inklusive Wahrscheinlichkeit an.</p>
                        </li>
                        <li id="automatische-uebersetzung"
                            className="list-group-item bg-transparent text-secondary border-secondary px-0 py-3">
                            <strong className="text-light">Visualisierung
                            </strong>
                            <p>Während des Live-Trainings informieren ein animierter Fortschrittsbalken sowie
                                Echtzeit-Metriken (Loss und Genauigkeit) über den aktuellen Status und dienen als
                                visuelle
                                Überbrückung. Parallel dazu generiert die tfjs-vis-Bibliothek ein dynamisches
                                Liniendiagramm, das den Verlauf von Loss und Genauigkeit über alle Epochen hinweg
                                darstellt. </p>
                        </li>

                    </ul>
                </div>
                {/* Quellen*/}
                <div className="mb-4">
                    <h2 id="quellen" className="h4 fw-bold text-light border-bottom border-secondary pb-2 mb-4">
                        Quellen
                    </h2>
                    <ul className="text-secondary ps-4">
                        <li className="mb-2"><strong>Modulskript DeepLearning:</strong> Theoretische Grundlagen zu Deep
                            Learning, neuronalen Netzen und Long Short-Term Memory
                        </li>
                        <li className="mb-2"><strong> TensorFlow.js Dokumentation & Tutorials:</strong> Referenz zur
                            Modell-Implementierung udd Konfigurationen
                        </li>
                        <li className="mb-2"><strong>Stackoverflow:</strong> Unterstützung beim Debugging sowie bei der
                            Lösung spezifischer technischer Probleme
                        </li>
                        <li className="mb-2"><strong>Austausch mit anderen Kursteilnehmenden:</strong> Allgemeiner
                            Erfahrungsaustausch, Durchführung von Modell-Experimenten sowie konstruktives Feedback zu
                            UI und Usability
                        </li>
                        <li className="mb-2"><strong>ChatGPT & Gemini:</strong> Unterstützung beim Debugging,
                            Code-Refactoring, der Erstellung von Code-Kommentaren und beim UI-Design
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    )
}