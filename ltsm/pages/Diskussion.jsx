export default function Diskussion() {
    return (
        <div className="container py-5 mb-5 pb-5">
            <div className="row justify-content-center">
                {/* Haupt-Header */}
                <h1 className="display-4 fw-bold text-light mb-4">Diskussion</h1>
                <div className="mb-5">
                    <p>
                        Das Modell wird direkt im Browser mit TensorFlow.js und WebGL trainiert. Für größere Datensätze
                        ist das sicher nicht die optimale Lösung, für den verwendeten Datensatz (11.368 Zeichen,
                        Vokabulargröße 789) funktionierte das Live-Training jedoch ganz gut. Die Trainingsläufe
                        liefen flüssig, ohne dass das UI einfror oder der Browser überlastet wurde. Für größere
                        Datensätze würde ich das Training allerdings auf jeden Fall auf einer GPU, z. B. mit Python in Google
                        Colab oder lokal, durchführen.

                        Genau das hatte ich ursprünglich auch geplant. Aufgrund von Kompatibilitätsproblemen zwischen
                        Keras 3 und TensorFlow.js ließ sich das Modell in Colab mit Python 3 jedoch nicht direkt in ein
                        TFJS-kompatibles Format exportieren. Ein lokales Training habe ich ebenfalls ausprobiert, musste
                        diesen Ansatz aufgrund technischer Schwierigkeiten aber wieder verwerfen. Mit etwas mehr Zeit
                        hätte ich dieses Problem sicherlich auch lösen können.

                        Bei der Modell-Architektur und der Entwicklungskonfiguration habe ich aus dieses Mal wieder viel
                        experimentiert (Auszug daraus siehe Tabelle unten):</p>
                    <ul className="list-group list-group-flush">
                        <li id="automatische-uebersetzung"
                            className="list-group-item bg-transparent text-secondary border-secondary px-0 py-3">
                            <strong className="text-light">Sequenzlänge
                            </strong>
                            <p>Die Erhöhung der Sequenzlänge von 5 auf 10 verbesserte den Loss und die Genauigkeit,
                                während eine weitere Steigerung auf 15 zu einer Verschlechterung führte.</p>
                        </li>
                        <li id="automatische-uebersetzung"
                            className="list-group-item bg-transparent text-secondary border-secondary px-0 py-3">
                            <strong className="text-light">Learning Rate
                            </strong>
                            <p>Mit 0.001 hat das Model kaum etwas gelernt (Unteranpassung) aber bei 0.005 hat es perfekt
                                konvergiert und die besten Ergebnisse geliefert.</p>
                        </li>
                        <li id="automatische-uebersetzung"
                            className="list-group-item bg-transparent text-secondary border-secondary px-0 py-3">
                            <strong className="text-light">Batch Size
                            </strong>
                            <p>Die Reduzierung der Batch Size von 64 auf 16 hat für eine spürbare Steigerung der
                                Stabilität während des Trainings gesorgt.</p>
                        </li>
                        <li id="automatische-uebersetzung"
                            className="list-group-item bg-transparent text-secondary border-secondary px-0 py-3">
                            <strong className="text-light">Layer Struktur
                            </strong>
                            <p>Der Vergleich zwischen einem und zwei Hidden Layern (mit je 100 LSTM Units) ergab, dass
                                die Architektur mit einem Hidden Layer bei gleichen Units nahezu identische, teils sogar
                                leicht bessere Ergebnisse erzielte (Loss: 0.1184 und Genauigkeit: 0.9959). Deshalb habe
                                ich
                                mich final für das effizientere Modell mit einem Hidden Layer entschieden.</p>
                        </li>
                    </ul>
                    <p>Auffällig war, dass die Vorhersagen je nach Top-k-Wert (1 bis 20) teilweise stark schwankten.
                        Vermutlich liegt das am vergleichsweise kleinen Trainingsdatensatz, wodurch das Modell bei
                        vielen Wortfolgen mehrere ähnlich wahrscheinliche Fortsetzungen berechnet.</p>
                    <p>Für das Modell habe ich nur einen kleinen, nicht-sensiblen Datensatz verwendet, weshalb kein
                        Datenschutzrisiko besteht. Sollte der Trainingsdatensatz jedoch personenbezogene oder
                        vertrauliche Informationen enthalten, könnte es ein Datenschutzrisiko darstellen, da solche
                        Informationen unter Umständen ungewollt rekonstruiert und ausgegeben werden könnten.</p>
                </div>
            </div>
            {/* Tabelle mit neuem Wrapper */}
            <div className="experiment-table-wrapper shadow-lg">
                <table className="experiment-table">
                    <thead>
                    <tr>
                        <th>Modell-Struktur</th>
                        <th>Sequenz</th>
                        <th>Batch Size</th>
                        <th>Lernrate</th>
                        <th>Loss</th>
                        <th>Genauigkeit</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr>
                        <td>2 Hidden Layer</td>
                        <td>5</td>
                        <td>64</td>
                        <td>0.01</td>
                        <td>0.1481</td>
                        <td>0.9953</td>
                    </tr>
                    <tr>
                        <td>2 Hidden Layer</td>
                        <td>10</td>
                        <td>64</td>
                        <td>0.01</td>
                        <td>0.1311</td>
                        <td>0.9964</td>
                    </tr>
                    <tr>
                        <td>2 Hidden Layer</td>
                        <td>15</td>
                        <td>64</td>
                        <td>0.01</td>
                        <td>0.1946</td>
                        <td>0.9929</td>
                    </tr>
                    <tr>
                        <td>2 Hidden Layer</td>
                        <td>10</td>
                        <td>64</td>
                        <td>0.001</td>
                        <td>5.0294</td>
                        <td>0.0670</td>
                    </tr>
                    <tr>
                        <td>2 Hidden Layer</td>
                        <td>10</td>
                        <td>64</td>
                        <td>0.005</td>
                        <td>0.8100</td>
                        <td>0.9360</td>
                    </tr>
                    <tr>
                        <td>2 Hidden Layer</td>
                        <td>10</td>
                        <td>16</td>
                        <td>0.005</td>
                        <td>0.1264</td>
                        <td>0.9953</td>
                    </tr>
                    <tr className="table-highlight">
                        <td><strong>1 Hidden Layer</strong></td>
                        <td>10</td>
                        <td>16</td>
                        <td>0.005</td>
                        <td><strong>0.1184</strong></td>
                        <td><strong>0.9959</strong></td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </div>
    )
}