export async function loadHomePage() {
  const contentArea = document.getElementById('content-area');
  const response = await fetch('/src/home.html');
  const html = await response.text();
  contentArea.innerHTML = html;
}
