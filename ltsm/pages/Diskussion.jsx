export default function Diskussion() {
    return (
        <div className="container py-5 mb-5 pb-5">
            <div className="row justify-content-center">
                {/* Haupt-Header */}
                <h1 className="display-4 fw-bold text-light mb-4">Diskussion</h1>
                <div className="mb-5">
                    <p>
                        Arabica Acerbic Affogato Aftertaste Aged Americano And Aroma milk, to et bar At dripper go aroma
                        Cappuccino, as Beans arabica turkish id extraction. Black wings sit variety aroma spoon strong
                        plunger affogato Americano mocha origin as java, id filter Affogato trifecta At white
                        frappuccino Acerbic medium aged pumpkin arabica. Decaffeinated single filter arabica est white
                        aroma Affogato, robusta mountain aged foam Beans irish, medium Blue ristretto breve strong
                        sweet. Press percolator Barista to flavour siphon java steamed, go black caramelization instant
                        french.</p>
                </div>
            </div>
            {/* Tabelle mit neuem Wrapper */}
            <div className="experiment-table-wrapper shadow-lg">
                <table className="experiment-table">
                    <thead>
                    <tr>
                        <th>Modell-Struktur</th>
                        <th>Sequenz</th>
                        <th>BatchSize</th>
                        <th>Lernrate</th>
                        <th>Loss</th>
                        <th>Genauigkeit</th>
                        <th>Beobachtung</th>
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
                        <td>Basis-Konfiguration</td>
                    </tr>
                    <tr>
                        <td>2 Hidden Layer</td>
                        <td>10</td>
                        <td>64</td>
                        <td>0.01</td>
                        <td>0.1311</td>
                        <td>0.9964</td>
                        <td>Optimierung der Kontext-Erfassung</td>
                    </tr>
                    <tr>
                        <td>2 Hidden Layer</td>
                        <td>15</td>
                        <td>64</td>
                        <td>0.01</td>
                        <td>0.1946</td>
                        <td>0.9929</td>
                        <td>Wendepunkt: Komplexität zu hoch</td>
                    </tr>
                    <tr>
                        <td>2 Hidden Layer</td>
                        <td>10</td>
                        <td>64</td>
                        <td>0.001</td>
                        <td>5.0294</td>
                        <td>0.0670</td>
                        <td>Unteranpassung durch zu niedrige Lernrate</td>
                    </tr>
                    <tr>
                        <td>2 Hidden Layer</td>
                        <td>10</td>
                        <td>64</td>
                        <td>0.005</td>
                        <td>0.8100</td>
                        <td>0.9360</td>
                        <td>Identifikation der optimalen Lernrate</td>
                    </tr>
                    <tr>
                        <td>2 Hidden Layer</td>
                        <td>10</td>
                        <td>16</td>
                        <td>0.005</td>
                        <td>0.1264</td>
                        <td>0.9953</td>
                        <td>Stabilitätsgewinn durch BatchSize 16</td>
                    </tr>
                    <tr className="table-highlight">
                        <td><strong>1 Hidden Layer</strong></td>
                        <td>10</td>
                        <td>16</td>
                        <td>0.005</td>
                        <td><strong>0.1184</strong></td>
                        <td><strong>0.9959</strong></td>
                        <td><strong>Effizienz-Optimum (finales Modell)</strong></td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </div>
    )
}