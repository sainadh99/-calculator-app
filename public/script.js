document.getElementById('calcForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const num1 = parseFloat(document.getElementById('num1').value);
  const num2 = parseFloat(document.getElementById('num2').value);
  const operation = document.getElementById('operation').value;
  const resultDiv = document.getElementById('result');

  try {
    const response = await fetch('/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operation, num1, num2 })
    });

    const data = await response.json();

    if (response.ok) {
      resultDiv.textContent = `Total: ${data.result}`;
      loadHistory();
    } else {
      resultDiv.textContent = `Error: ${data.error || data.errors.map(e => e.msg).join(', ')}`;
    }
  } catch (err) {
    resultDiv.textContent = 'Network error: ' + err.message;
  }
});

async function loadHistory() {
  const historyElem = document.getElementById('historyList');
  historyElem.innerHTML = '';

  try {
    const response = await fetch('/history');
    const data = await response.json();

    const ops = { add: '+', subtract: '−', multiply: '×', divide: '÷' };
    data.history.forEach(item => {
      const li = document.createElement('li');
      li.textContent = `${item.num1} ${ops[item.operation]} ${item.num2} = ${item.result} (at ${new Date(item.timestamp).toLocaleString()})`;
      historyElem.appendChild(li);
    });

    if (data.history.length === 0) {
      historyElem.textContent = 'No calculations yet.';
    }
  } catch (err) {
    historyElem.textContent = 'Failed to load history.';
  }
}

window.addEventListener('DOMContentLoaded', loadHistory);

