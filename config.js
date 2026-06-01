(function initAppConfig() {
  const gasUrl = 'https://script.google.com/macros/s/AKfycbyPCyvgwe_2UKo-zQORmUTermBj0ofJQtzC6oiucXdSLus4PkFoeaQR84kOUDxdYwNY/exec';
  const gasAppKey = 'ALAS_2025_APP_KEY';

  window.APP_CONFIG = Object.freeze({
    apiBase: gasUrl,
    apiBases: [gasUrl],
    gasUrl,
    gasAppKey
  });
})();
