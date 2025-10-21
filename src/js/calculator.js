export function initCalculator() {
  const spaceTypeSelect = document.getElementById('space-type');
  if (!spaceTypeSelect) {
    console.warn('Kalkulačka nebyla nalezena v DOMu');
    return;
  }

  const dynamicInputs = document.getElementById('dynamic-inputs');
  const result = document.getElementById('result');

  const updatePrice = () => {
    const type = spaceTypeSelect.value;
    let price = 0;

    const frequencySelect = document.getElementById('frequency');
    const frequencyCoefficient = frequencySelect ? parseFloat(frequencySelect.value) : 1;

    if (type === 'byt') {
      const bytInput = document.getElementById('byt-size');
      price = 1000 * parseFloat(bytInput?.value || 0) * frequencyCoefficient;
    } else if (type === 'kancelar') {
      const officeSize = parseFloat(document.getElementById('office-size')?.value || 0);
      price = officeSize * 22 * frequencyCoefficient;
    } else if (type === 'airbnb') {
      const count = parseInt(document.getElementById('airbnb-count')?.value || 0);
      price = count * 500;
    }

    if (price > 0) {
      result.textContent = `Odhadovaná cena: ${Math.ceil(price / 50) * 50} Kč`;
      result.classList.remove('hidden');
    } else {
      result.textContent = '';
      result.classList.add('hidden');
    }
  };

  spaceTypeSelect.addEventListener('change', () => {
    const type = spaceTypeSelect.value;
    dynamicInputs.innerHTML = '';
    result.classList.add('hidden');

    let html = '';

    if (type === 'byt') {
      html = `
      <div class="form-group">
        <label for="byt-size">Velikost bytu/domu</label>
        <select id="byt-size" class="form-input">
          <option value="" disabled selected>Vyberte velikost bytu/domu</option>
          <option value="1">1+kk</option>
          <option value="1.5">2+kk</option>
          <option value="2">3+kk</option>
          <option value="2.5">4+kk a větší</option>
        </select>
      </div>
      <div class="form-group">
        <label for="frequency">Četnost úklidu</label>
        <select id="frequency" class="form-input">
          <option value="" disabled selected>Vyberte četnost úklidu</option>
          <option value="1">Jednorázový úklid</option>
          <option value="0.8">Týdenní</option>
          <option value="0.9">Každých 14 dnů</option>
        </select>
      </div>
    `;
    }

    if (type === 'kancelar') {
      html = `
      <div class="form-group">
        <label for="office-size">Rozloha kanceláře (m²)</label>
        <input id="office-size" type="number" class="form-input" placeholder="Např. 80">
      </div>
      <div class="form-group">
        <label for="frequency">Četnost úklidu</label>
        <select id="frequency" class="form-input">
          <option value="" disabled selected>Vyberte četnost úklidu</option>
          <option value="1">Jednorázový úklid</option>
          <option value="0.8">Týdenní</option>
          <option value="0.9">Každých 14 dnů</option>
        </select>
      </div>
    `;
    }

    if (type === 'airbnb') {
      html = `
      <div class="form-group">
        <label for="airbnb-count">Počet jednotek k úklidu</label>
        <input id="airbnb-count" type="number" class="form-input" placeholder="Např. 3">
      </div>
    `;
    }

    dynamicInputs.innerHTML = html;

    setTimeout(() => {
      const inputs = dynamicInputs.querySelectorAll('select, input');
      inputs.forEach(input => input.addEventListener('input', updatePrice));
    }, 0);
  });
}
