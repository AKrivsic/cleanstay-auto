"use client";
import { useEffect } from 'react';

export default function Calculator() {
  useEffect(() => {
    // Dynamically import calculator logic
    import('@/js/calculator').then(({ initCalculator }) => {
      initCalculator();
    });
  }, []);

  return (
    <section id="kalkulacka" className="calculator section">
      <div className="container">
        <div className="calculator-inner">
          <h2 className="title">Kalkulačka úklidu</h2>
          <form id="calc-form" className="form-container">
            <div className="form-group">
              <label htmlFor="space-type">Typ prostoru</label>
              <select id="space-type" className="form-input">
                <option value="">-- Vyberte --</option>
                <option value="byt">Byt / Dům</option>
                <option value="kancelar">Kancelář</option>
                <option value="airbnb">Airbnb</option>
              </select>
            </div>
            <div id="dynamic-inputs"></div>
            <p id="result" className="price-result hidden"></p>
          </form>
          <div id="result" className="result hidden"></div>
        </div>
      </div>
    </section>
  );
}

