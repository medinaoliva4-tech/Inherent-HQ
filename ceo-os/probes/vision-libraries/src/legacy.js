const label = document.querySelector('#event-value');
const count = document.querySelector('#event-count');
let received = 0;

document.addEventListener('inherent:vision-node-selected', (event) => {
  received += 1;
  label.textContent = `${event.detail.label} · ${event.detail.status} · ${event.detail.id}`;
  count.textContent = `${received} ${received === 1 ? 'evento' : 'eventos'}`;
});
