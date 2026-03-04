document.addEventListener("DOMContentLoaded", function () {
  var toggles = document.querySelectorAll("[data-accordion-toggle]");
  toggles.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var card = btn.closest(".project-card");
      var isOpen = card.classList.contains("is-open");

      // Close any other open cards
      document.querySelectorAll(".project-card.is-open").forEach(function (openCard) {
        if (openCard !== card) {
          openCard.classList.remove("is-open");
        }
      });

      if (!isOpen) {
        card.classList.add("is-open");
      } else {
        card.classList.remove("is-open");
      }
    });
  });
});

